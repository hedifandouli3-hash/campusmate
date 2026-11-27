import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { addAuditLog, ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";
import { buildInitialDemoState, type CampusMateStoreState } from "@/lib/demo/seed";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";
import type { SocialComment, SocialPost, SocialPostType } from "@/types/domain";

function ensureV9Arrays(store: CampusMateStoreState) {
  const defaults = buildInitialDemoState();
  store.socialPosts ??= defaults.socialPosts ?? [];
  store.clubProfiles ??= defaults.clubProfiles ?? [];
  store.externalSources ??= defaults.externalSources ?? [];
  store.userHiddenPostIds ??= {};
  store.userMutedAuthors ??= {};
}

export interface NormalizedFeedItem {
  id: string;
  sourceKind:
    | "social_post"
    | "official_announcement"
    | "course_update"
    | "event"
    | "marketplace"
    | "lost_found"
    | "housing"
    | "internship";
  postType: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  href: string;
  sourceAttribution?: string;
  sourceUrl?: string;
  isPinned: boolean;
  likesCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  comments: SocialComment[];
  createdAt: string;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const limit = Math.min(60, Math.max(10, Number(searchParams.get("limit") || 25)));

    const store = await ensureStoreHydrated();
    ensureV9Arrays(store);

    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";
    const hiddenIds = new Set(store.userHiddenPostIds![user.id] || []);
    const mutedAuthors = new Set(store.userMutedAuthors![user.id] || []);

    const feed: NormalizedFeedItem[] = [];

    // 1. Social Posts (institution-isolated)
    for (const p of store.socialPosts!) {
      if (p.institutionId !== instId || p.moderationStatus !== "approved") continue;
      if (hiddenIds.has(p.id) || mutedAuthors.has(p.authorId)) continue;
      feed.push({
        id: p.id,
        sourceKind: "social_post",
        postType: p.postType,
        authorId: p.authorId,
        authorName: p.authorName,
        authorRole: p.authorRole,
        title: p.title || (p.postType === "question" ? "Question académique" : "Publication campus"),
        content: p.content,
        href: p.relatedHref || "/student/home",
        sourceAttribution: p.sourceAttribution,
        sourceUrl: p.sourceUrl,
        isPinned: p.isPinned,
        likesCount: p.likesUserIds.length,
        likedByMe: p.likesUserIds.includes(user.id),
        bookmarkedByMe: p.bookmarkedUserIds.includes(user.id),
        comments: p.comments,
        createdAt: p.createdAt,
      });
    }

    // 2. Official Announcements
    for (const a of store.announcements) {
      if (a.institutionId !== instId) continue;
      feed.push({
        id: `ann-${a.id}`,
        sourceKind: "official_announcement",
        postType: "announcement",
        authorId: a.authorId,
        authorName: a.authorName,
        authorRole: "university_admin",
        title: a.title,
        content: a.body,
        href: "/student/university",
        sourceAttribution: "Annonce officielle de l'établissement",
        isPinned: a.isPinned,
        likesCount: 0,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [],
        createdAt: a.createdAt,
      });
    }

    // 3. Published Courses
    for (const c of store.courseDocuments) {
      if (c.institutionId !== instId || !c.isPublished || c.isTeacherOnly) continue;
      feed.push({
        id: `crs-${c.id}`,
        sourceKind: "course_update",
        postType: "course",
        authorId: c.uploadedBy,
        authorName: c.uploaderName,
        authorRole: "teacher",
        title: `Nouveau support : ${c.title}`,
        content: `${c.subjectName} — Support prêt pour résumé IA, quiz et flashcards.`,
        href: `/student/courses/${c.courseId}`,
        isPinned: false,
        likesCount: 0,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [],
        createdAt: c.createdAt,
      });
    }

    // 4. Campus Events
    for (const ev of store.events) {
      if (ev.institutionId !== instId) continue;
      feed.push({
        id: `evt-${ev.id}`,
        sourceKind: "event",
        postType: "event",
        authorId: ev.organizerId,
        authorName: ev.organizerName,
        authorRole: "university_admin",
        title: ev.title,
        content: `${ev.eventDate} • ${ev.location} — ${ev.description}`,
        href: "/student/events",
        isPinned: false,
        likesCount: 0,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [],
        createdAt: ev.eventDate,
      });
    }

    // 5. Approved Marketplace previews
    for (const m of store.marketplaceListings) {
      if (m.institutionId !== instId || m.moderationStatus !== "approved" || m.status !== "available") continue;
      feed.push({
        id: `mkt-${m.id}`,
        sourceKind: "marketplace",
        postType: "marketplace",
        authorId: m.sellerId,
        authorName: m.sellerName,
        authorRole: "student",
        title: `${m.title} — ${m.priceTnd} TND`,
        content: m.description,
        href: "/student/marketplace",
        isPinned: false,
        likesCount: 0,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [],
        createdAt: m.createdAt,
      });
    }

    // 6. Approved Housing & Internships
    for (const h of store.housingListings || []) {
      if (h.institutionId !== instId || h.moderationStatus !== "approved") continue;
      feed.push({
        id: `hous-${h.id}`,
        sourceKind: "housing",
        postType: "housing",
        authorId: h.providerId,
        authorName: h.providerName,
        authorRole: "housing_provider",
        title: `${h.title} (${h.monthlyRentTnd} TND/mois)`,
        content: `${h.generalLocation} — ${h.description}`,
        href: "/student/housing",
        sourceAttribution: h.isSponsored ? "Sponsorisé • Prestataire vérifié" : "Logement vérifié",
        isPinned: false,
        likesCount: 0,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [],
        createdAt: h.createdAt,
      });
    }

    for (const off of store.internshipOffers) {
      if (off.status !== "published") continue;
      feed.push({
        id: `int-${off.id}`,
        sourceKind: "internship",
        postType: "internship",
        authorId: off.organizationId,
        authorName: off.organizationName,
        authorRole: "organization",
        title: `${off.title} (${off.internshipType})`,
        content: `${off.location} — ${off.description}`,
        href: `/student/internships/${off.id}`,
        isPinned: false,
        likesCount: 0,
        likedByMe: false,
        bookmarkedByMe: false,
        comments: [],
        createdAt: off.createdAt,
      });
    }

    const filtered = feed.filter((item) => {
      if (filter === "all") return true;
      if (filter === "official") return item.sourceKind === "official_announcement" || item.postType === "announcement";
      if (filter === "courses") return item.sourceKind === "course_update";
      if (filter === "events") return item.sourceKind === "event";
      if (filter === "clubs") return item.postType === "club_update";
      if (filter === "discussions") return item.postType === "post" || item.postType === "question";
      if (filter === "marketplace") return item.sourceKind === "marketplace";
      if (filter === "housing") return item.sourceKind === "housing";
      if (filter === "opportunities") return item.sourceKind === "internship";
      if (filter === "projects") return item.postType === "project_showcase";
      return true;
    });

    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    const context = {
      upcomingExams: store.exams.filter((e) => e.institutionId === instId).slice(0, 3),
      pendingTasks: store.personalTasks.filter((t) => t.studentId === user.id && !t.isCompleted).slice(0, 4),
      clubs: store.clubProfiles!.filter((c) => c.institutionId === instId).slice(0, 4),
      timetable: store.timetableEntries.filter((t) => t.institutionId === instId).slice(0, 3),
    };

    return NextResponse.json({
      items: filtered.slice(0, limit),
      totalCount: filtered.length,
      context,
    });
  } catch {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!checkRateLimit(`social:${user.id}`, 30, 60_000).allowed) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
    }

    const body = await request.json();
    const store = await ensureStoreHydrated();
    ensureV9Arrays(store);
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";
    const now = new Date().toISOString();

    if (body.action === "create_post") {
      const content = sanitizeText(String(body.content || ""), 1200);
      const title = body.title ? sanitizeText(String(body.title), 140) : undefined;
      if (!content || content.length < 3) {
        return NextResponse.json({ error: "Le contenu de la publication est requis." }, { status: 400 });
      }
      const requestedType = String(body.postType || "post") as SocialPostType;
      const canAnnounce = ["teacher", "university_admin", "super_admin"].includes(user.role);
      const postType: SocialPostType =
        requestedType === "announcement" && !canAnnounce
          ? "post"
          : ["post", "question", "announcement", "project_showcase", "club_update"].includes(requestedType)
            ? requestedType
            : "post";

      const post: SocialPost = {
        id: `spost-${crypto.randomUUID()}`,
        institutionId: instId,
        authorId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        postType,
        title,
        content,
        relatedHref: body.relatedHref ? sanitizeText(String(body.relatedHref), 160) : undefined,
        isPinned: Boolean(body.isPinned && ["university_admin", "super_admin"].includes(user.role)),
        likesUserIds: [],
        bookmarkedUserIds: [],
        comments: [],
        moderationStatus: "approved",
        createdAt: now,
        updatedAt: now,
      };
      store.socialPosts!.unshift(post);
      await persistStore(store);
      return NextResponse.json({ post }, { status: 201 });
    }

    if (body.action === "hide_post") {
      const id = String(body.postId || "");
      store.userHiddenPostIds![user.id] ??= [];
      if (id && !store.userHiddenPostIds![user.id].includes(id)) {
        store.userHiddenPostIds![user.id].push(id);
      }
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "mute_author") {
      const authorId = String(body.authorId || "");
      store.userMutedAuthors![user.id] ??= [];
      if (authorId && authorId !== user.id && !store.userMutedAuthors![user.id].includes(authorId)) {
        store.userMutedAuthors![user.id].push(authorId);
      }
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    const post = store.socialPosts!.find((p) => p.id === body.postId && p.institutionId === instId);
    if (!post) {
      return NextResponse.json({ error: "Publication introuvable." }, { status: 404 });
    }

    if (body.action === "toggle_like") {
      if (post.likesUserIds.includes(user.id)) {
        post.likesUserIds = post.likesUserIds.filter((id) => id !== user.id);
      } else {
        post.likesUserIds.push(user.id);
      }
      await persistStore(store);
      return NextResponse.json({ post });
    }

    if (body.action === "toggle_bookmark") {
      if (post.bookmarkedUserIds.includes(user.id)) {
        post.bookmarkedUserIds = post.bookmarkedUserIds.filter((id) => id !== user.id);
      } else {
        post.bookmarkedUserIds.push(user.id);
      }
      await persistStore(store);
      return NextResponse.json({ post });
    }

    if (body.action === "add_comment") {
      const content = sanitizeText(String(body.content || ""), 500);
      if (!content) return NextResponse.json({ error: "Commentaire requis." }, { status: 400 });
      const comment: SocialComment = {
        id: `scom-${crypto.randomUUID()}`,
        postId: post.id,
        authorId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        content,
        createdAt: now,
      };
      post.comments.push(comment);
      post.updatedAt = now;
      await persistStore(store);
      return NextResponse.json({ comment, post }, { status: 201 });
    }

    if (body.action === "delete_post") {
      if (post.authorId !== user.id && user.role !== "university_admin" && user.role !== "super_admin") {
        return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
      }
      post.moderationStatus = "removed";
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "report_post") {
      store.contentReports.unshift({
        id: `rep-${crypto.randomUUID()}`,
        institutionId: instId,
        reporterId: user.id,
        reporterName: user.fullName,
        targetType: "chat_message",
        targetId: post.id,
        reason: sanitizeText(String(body.reason || "Signalement publication campus"), 300),
        status: "open",
        createdAt: now,
      });
      addAuditLog({
        institutionId: instId,
        actorId: user.id,
        actorName: user.fullName,
        action: "SOCIAL_POST_REPORTED",
        resourceType: "social_post",
        resourceId: post.id,
        details: "Publication signalée à la modération",
      });
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
