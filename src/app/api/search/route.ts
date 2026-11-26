import { NextResponse } from "next/server";
import {
  getStore,
  getVisibleCourseDocuments,
  getVisibleDocumentRequests,
  requireUser,
} from "@/lib/data/store";

export interface GlobalSearchResult {
  id: string;
  category: "course" | "document" | "knowledge" | "event" | "internship" | "chat" | "request";
  title: string;
  subtitle: string;
  href: string;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const rawQ = (url.searchParams.get("q") || "").trim().toLowerCase();

    if (rawQ.length < 2 || rawQ.length > 80) {
      return NextResponse.json({ results: [] });
    }

    const store = getStore();
    const results: GlobalSearchResult[] = [];
    const matches = (text: string | undefined) => Boolean(text && text.toLowerCase().includes(rawQ));

    // 1. Authorized Course Documents (never returns unpublished drafts or cross-tenant docs)
    const visibleDocs = getVisibleCourseDocuments(user);
    for (const d of visibleDocs) {
      if (matches(d.title) || matches(d.subjectName) || matches(d.description)) {
        const href =
          user.role === "teacher" ? `/teacher/courses/${d.courseId}` : `/student/courses/${d.id}`;
        results.push({
          id: `doc-${d.id}`,
          category: "document",
          title: d.title,
          subtitle: `${d.subjectName} • ${d.uploaderName}`,
          href,
        });
      }
    }

    // 2. Authorized Knowledge Docs (only published within user's institution)
    if (user.institutionId) {
      for (const k of store.knowledgeDocuments) {
        if (
          k.institutionId === user.institutionId &&
          (k.isPublished || user.role === "university_admin") &&
          (matches(k.title) || matches(k.category) || matches(k.contentText))
        ) {
          results.push({
            id: `kb-${k.id}`,
            category: "knowledge",
            title: k.title,
            subtitle: `Base ISET • ${k.category}`,
            href: user.role === "university_admin" ? "/administration/knowledge-base" : "/student/ai-assistant",
          });
        }
      }

      // 3. Events within user's institution
      for (const e of store.events) {
        if (
          e.institutionId === user.institutionId &&
          e.isPublished &&
          (matches(e.title) || matches(e.location) || matches(e.category))
        ) {
          results.push({
            id: `evt-${e.id}`,
            category: "event",
            title: e.title,
            subtitle: `${e.location} • ${e.eventDate.slice(0, 10)}`,
            href: user.role === "university_admin" ? "/administration/events" : "/student/events",
          });
        }
      }

      // 4. Academic Chat Groups (ONLY groups where user is an authorized member or admin)
      for (const g of store.chatGroups) {
        if (
          g.institutionId === user.institutionId &&
          (user.role === "university_admin" || g.memberIds.includes(user.id)) &&
          matches(g.name)
        ) {
          results.push({
            id: `grp-${g.id}`,
            category: "chat",
            title: g.name,
            subtitle: `Canal ${g.groupType} • ${g.memberIds.length} membres`,
            href: user.role === "teacher" ? "/teacher/chats" : `/student/chats/${g.id}`,
          });
        }
      }
    }

    // 5. Verified Published Internships (or org's own offers)
    const verifiedOrgIds = new Set(
      store.organizations.filter((o) => o.verificationStatus === "verified").map((o) => o.id)
    );
    for (const offer of store.internshipOffers) {
      const visible =
        user.role === "organization"
          ? offer.organizationId === user.organizationId
          : offer.status === "published" && verifiedOrgIds.has(offer.organizationId);
      if (
        visible &&
        (matches(offer.title) || matches(offer.organizationName) || offer.requiredSkills.some(matches))
      ) {
        results.push({
          id: `int-${offer.id}`,
          category: "internship",
          title: offer.title,
          subtitle: `${offer.organizationName} • ${offer.location}`,
          href:
            user.role === "organization"
              ? `/organization/internships/${offer.id}`
              : `/student/internships/${offer.id}`,
        });
      }
    }

    // 6. Own Document Requests
    const visibleReqs = getVisibleDocumentRequests(user);
    for (const r of visibleReqs) {
      if (matches(r.requestTypeName) || matches(r.referenceNumber)) {
        results.push({
          id: `req-${r.id}`,
          category: "request",
          title: `${r.requestTypeName} (${r.referenceNumber})`,
          subtitle: `Statut : ${r.status}`,
          href: user.role === "university_admin" ? "/administration/document-requests" : "/student/documents",
        });
      }
    }

    return NextResponse.json({ results: results.slice(0, 12) });
  } catch {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
}
