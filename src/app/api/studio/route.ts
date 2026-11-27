import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";
import { buildInitialDemoState, type CampusMateStoreState } from "@/lib/demo/seed";
import { sanitizeText } from "@/lib/utils";
import type { CreationArtifact, StudentWorkspaceProject } from "@/types/domain";

function ensureStudioArrays(store: CampusMateStoreState) {
  const defaults = buildInitialDemoState();
  store.creationArtifacts ??= defaults.creationArtifacts ?? [];
  store.workspaceProjects ??= defaults.workspaceProjects ?? [];
}

export async function GET() {
  try {
    const user = await requireUser(["student"]);
    const store = await ensureStoreHydrated();
    ensureStudioArrays(store);
    const artifacts = store.creationArtifacts!.filter((a) => a.ownerId === user.id);
    const projects = store.workspaceProjects!.filter((p) => p.ownerId === user.id);
    return NextResponse.json({ artifacts, projects });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const store = await ensureStoreHydrated();
    ensureStudioArrays(store);
    const now = new Date().toISOString();
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";

    if (body.entity === "project") {
      if (body.action === "create") {
        const title = sanitizeText(String(body.title || ""), 120);
        if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
        const project: StudentWorkspaceProject = {
          id: `wpr-${crypto.randomUUID()}`,
          institutionId: instId,
          ownerId: user.id,
          title,
          category: (["academic", "pfe", "startup", "portfolio", "personal"].includes(body.category)
            ? body.category
            : "academic") as StudentWorkspaceProject["category"],
          description: sanitizeText(String(body.description || ""), 500),
          objectives: ["Objectif principal du projet"],
          tasks: [{ id: `wpt-${crypto.randomUUID()}`, title: "Définir le périmètre initial", status: "todo", priority: "high" }],
          progress: 0,
          isPrivate: true,
          createdAt: now,
          updatedAt: now,
        };
        store.workspaceProjects!.unshift(project);
        await persistStore(store);
        return NextResponse.json({ project }, { status: 201 });
      }

      const project = store.workspaceProjects!.find((p) => p.id === body.id && p.ownerId === user.id);
      if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

      if (body.action === "add_task") {
        const title = sanitizeText(String(body.title || ""), 140);
        if (title) {
          project.tasks.push({
            id: `wpt-${crypto.randomUUID()}`,
            title,
            status: "todo",
            priority: body.priority === "high" || body.priority === "low" ? body.priority : "medium",
            dueDate: body.dueDate ? String(body.dueDate).slice(0, 10) : undefined,
          });
        }
      } else if (body.action === "move_task") {
        const task = project.tasks.find((t) => t.id === body.taskId);
        if (task && ["todo", "in_progress", "under_review", "completed"].includes(body.status)) {
          task.status = body.status;
        }
      } else if (body.action === "delete_task") {
        project.tasks = project.tasks.filter((t) => t.id !== body.taskId);
      }
      const completed = project.tasks.filter((t) => t.status === "completed").length;
      project.progress = project.tasks.length > 0 ? Math.round((completed / project.tasks.length) * 100) : 0;
      project.updatedAt = now;
      await persistStore(store);
      return NextResponse.json({ project });
    }

    // Artifacts CRUD
    if (body.action === "create_artifact") {
      const title = sanitizeText(String(body.title || ""), 120);
      if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
      const type = (["website", "portfolio_site", "presentation", "document", "brand_kit", "social_post"].includes(body.type)
        ? body.type
        : "website") as CreationArtifact["type"];

      const artifact: CreationArtifact = {
        id: `art-${crypto.randomUUID()}`,
        institutionId: instId,
        ownerId: user.id,
        type,
        title,
        description: sanitizeText(String(body.description || ""), 400),
        version: 1,
        isPrivate: true,
        websiteData:
          type === "website" || type === "portfolio_site"
            ? {
                template: type === "portfolio_site" ? "portfolio" : "saas",
                brandName: title,
                primaryColor: "#2563EB",
                fontFamily: "sans",
                sections: [
                  {
                    id: "s-hero",
                    kind: "hero",
                    heading: title,
                    subheading: sanitizeText(String(body.description || "Créé avec CampusMate AI Studio"), 200),
                    items: [],
                  },
                  {
                    id: "s-feat",
                    kind: "features",
                    heading: "Points forts",
                    subheading: "Sections modifiables en direct",
                    items: [
                      { title: "Conception claire", description: "Structure adaptée au mobile et au desktop." },
                      { title: "Ancrage universitaire", description: "Relié à vos projets et compétences." },
                    ],
                  },
                ],
                contactPreviewNote: "Formulaire en mode aperçu (aucun backend externe connecté).",
              }
            : undefined,
        slides:
          type === "presentation"
            ? [
                { id: "sl-1", title: title, bullets: ["Contexte & objectif", "Présentation CampusMate"], speakerNotes: "Introduction." },
                { id: "sl-2", title: "Solution & Architecture", bullets: ["Approche technique", "Livrables concrets"], speakerNotes: "Détails clés." },
              ]
            : undefined,
        documentMarkdown:
          type === "document"
            ? `# ${title}\n\n## Objectif\n${sanitizeText(String(body.description || "Document structuré."), 500)}\n\n## Points clés\n- Point 1\n- Point 2`
            : undefined,
        brandKit:
          type === "brand_kit"
            ? {
                brandName: title,
                slogan: "Innover depuis le campus.",
                positioning: sanitizeText(String(body.description || "Solution étudiante accessible."), 200),
                palette: ["#2563EB", "#0F172A", "#10B981", "#F8FAFC"],
                typography: "Plus Jakarta Sans / Inter",
                toneOfVoice: "Clair, professionnel et pragmatique",
              }
            : undefined,
        createdAt: now,
        updatedAt: now,
      };
      store.creationArtifacts!.unshift(artifact);
      await persistStore(store);
      return NextResponse.json({ artifact }, { status: 201 });
    }

    if (body.action === "update_artifact") {
      const artifact = store.creationArtifacts!.find((a) => a.id === body.id && a.ownerId === user.id);
      if (!artifact) return NextResponse.json({ error: "Artifact introuvable." }, { status: 404 });
      if (typeof body.title === "string") artifact.title = sanitizeText(body.title, 120);
      if (typeof body.description === "string") artifact.description = sanitizeText(body.description, 400);
      if (body.websiteData) artifact.websiteData = body.websiteData;
      if (Array.isArray(body.slides)) artifact.slides = body.slides;
      if (typeof body.documentMarkdown === "string") artifact.documentMarkdown = sanitizeText(body.documentMarkdown, 8000);
      if (body.brandKit) artifact.brandKit = body.brandKit;
      artifact.version += 1;
      artifact.updatedAt = now;
      await persistStore(store);
      return NextResponse.json({ artifact });
    }

    if (body.action === "delete_artifact") {
      const idx = store.creationArtifacts!.findIndex((a) => a.id === body.id && a.ownerId === user.id);
      if (idx === -1) return NextResponse.json({ error: "Artifact introuvable." }, { status: 404 });
      store.creationArtifacts!.splice(idx, 1);
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
