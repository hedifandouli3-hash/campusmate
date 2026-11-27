import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureStoreHydrated, getCurrentUser, persistStore, requireUser } from "@/lib/data/store";
import { buildInitialDemoState } from "@/lib/demo/seed";
import { sanitizeText } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") || "iset-beja").toLowerCase();
  const store = await ensureStoreHydrated();
  const defaults = buildInitialDemoState();
  store.clubProfiles ??= defaults.clubProfiles ?? [];
  store.externalSources ??= defaults.externalSources ?? [];

  const user = await getCurrentUser();
  const inst =
    store.institutions.find((i) =>
      slug.includes("rades") ? i.code.toLowerCase().includes("rades") : i.code.toLowerCase().includes("beja")
    ) ||
    (user?.institutionId ? store.institutions.find((i) => i.id === user.institutionId) : undefined) ||
    store.institutions[0];

  const instId = inst.id;

  return NextResponse.json({
    institution: inst,
    departments: store.departments.filter((d) => d.institutionId === instId),
    specializations: store.specializations.filter((s) => s.institutionId === instId),
    clubs: store.clubProfiles.filter((c) => c.institutionId === instId),
    announcements: store.announcements.filter((a) => a.institutionId === instId),
    events: store.events.filter((e) => e.institutionId === instId),
    publicKnowledgeDocs: store.knowledgeDocuments
      .filter((k) => k.institutionId === instId && k.isPublished)
      .map((k) => ({
        id: k.id,
        title: k.title,
        category: k.category,
        sourceUrl: inst.website || "https://www.isetb.rnu.tn/",
        academicYear: "2026",
        isHistorical: false,
        updatedAt: k.createdAt,
      })),
    externalSources: store.externalSources.filter((s) => s.institutionId === instId),
    transportInfo: store.transportInfo.filter((t) => t.institutionId === instId),
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const body = await request.json();
    const store = await ensureStoreHydrated();
    const defaults = buildInitialDemoState();
    store.socialPosts ??= defaults.socialPosts ?? [];
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";
    const now = new Date().toISOString();

    if (body.action === "import_external_announcement") {
      const title = sanitizeText(String(body.title || ""), 140);
      const content = sanitizeText(String(body.content || ""), 1000);
      const sourceUrl = sanitizeText(String(body.sourceUrl || ""), 240);
      const sourceAttribution = sanitizeText(
        String(body.sourceAttribution || "Source officielle importée"),
        120
      );
      if (!title || !content || !/^https:\/\//i.test(sourceUrl)) {
        return NextResponse.json({ error: "Titre, contenu et URL HTTPS requis." }, { status: 400 });
      }
      store.socialPosts.unshift({
        id: `spost-${crypto.randomUUID()}`,
        institutionId: instId,
        authorId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        postType: "announcement",
        title,
        content,
        sourceUrl,
        sourceAttribution,
        isPinned: Boolean(body.isPinned),
        likesUserIds: [],
        bookmarkedUserIds: [],
        comments: [],
        moderationStatus: "approved",
        createdAt: now,
        updatedAt: now,
      });
      await persistStore(store);
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Accès réservé à l'administration." }, { status: 403 });
  }
}
