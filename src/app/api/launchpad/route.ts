import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  addNotification,
  ensureStoreHydrated,
  getVisibleCourseDocuments,
  persistToDisk,
  requireUser,
} from "@/lib/data/store";
import { buildInitialDemoState, type CampusMateStoreState } from "@/lib/demo/seed";
import { isSafeHttpUrl } from "@/lib/security/crypto";
import { sanitizeText } from "@/lib/utils";

function ensureLaunchpadArrays(store: CampusMateStoreState) {
  const defaults = buildInitialDemoState();
  store.launchpadSkills ??= defaults.launchpadSkills ?? [];
  store.launchpadOpportunityPacks ??= [];
  store.launchpadFreelanceIdeas ??= defaults.launchpadFreelanceIdeas ?? [];
  store.launchpadStartupIdeas ??= defaults.launchpadStartupIdeas ?? [];
  store.launchpadCanvases ??= defaults.launchpadCanvases ?? [];
  store.launchpadRoadmaps ??= defaults.launchpadRoadmaps ?? [];
  store.launchpadProjects ??= defaults.launchpadProjects ?? [];
  store.launchpadTeams ??= defaults.launchpadTeams ?? [];
  store.launchpadPortfolios ??= defaults.launchpadPortfolios ?? [];
  store.launchpadMentorships ??= defaults.launchpadMentorships ?? [];
  store.launchpadPitches ??= [];
}

export async function GET() {
  try {
    const user = await requireUser();
    const store = await ensureStoreHydrated();
    ensureLaunchpadArrays(store);

    const instId = user.institutionId;
    const isAdmin = user.role === "super_admin";
    const visibleDocs = getVisibleCourseDocuments(user);

    const skills = store.launchpadSkills!.filter((s) => s.studentId === user.id);
    const opportunityPacks = store.launchpadOpportunityPacks!.filter((p) => p.studentId === user.id);
    const freelanceIdeas = store.launchpadFreelanceIdeas!.filter((f) => f.studentId === user.id);
    const startupIdeas = store.launchpadStartupIdeas!.filter((s) => s.studentId === user.id);
    const canvases = store.launchpadCanvases!.filter((c) => {
      if (c.studentId === user.id) return true;
      if (c.sharedWithTeamId) {
        const team = store.launchpadTeams!.find((t) => t.id === c.sharedWithTeamId && t.institutionId === instId);
        return Boolean(team?.members.some((m) => m.userId === user.id));
      }
      return false;
    });
    const roadmaps = store.launchpadRoadmaps!.filter((r) => r.studentId === user.id);
    const projects = store.launchpadProjects!.filter((p) => p.ownerId === user.id);
    const teams = store.launchpadTeams!.filter((t) => isAdmin || t.institutionId === instId);
    const portfolio =
      store.launchpadPortfolios!.find((p) => p.studentId === user.id) || {
        studentId: user.id,
        institutionId: instId || "",
        headline: `${user.fullName} — CampusMate Launchpad`,
        bio: user.bio || "",
        template: "engineering" as const,
        isPublicShared: false,
        items: [],
        certifications: [],
        achievements: [],
        updatedAt: new Date().toISOString(),
      };
    const mentorships = store.launchpadMentorships!.filter((m) => isAdmin || m.institutionId === instId);
    const pitches = store.launchpadPitches!.filter((p) => p.studentId === user.id);
    const events = store.events.filter((e) => (isAdmin || e.institutionId === instId) && e.isPublished);
    const subjects = store.subjects.filter((s) => isAdmin || s.institutionId === instId);

    return NextResponse.json({
      skills,
      opportunityPacks,
      freelanceIdeas,
      startupIdeas,
      canvases,
      roadmaps,
      projects,
      teams,
      portfolio,
      mentorships,
      pitches,
      events,
      subjects,
      authorizedDocs: visibleDocs.map((d) => ({
        id: d.id,
        title: d.title,
        subjectName: d.subjectName,
        courseId: d.courseId,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.institutionId) {
      return NextResponse.json({ error: "Institution requise." }, { status: 403 });
    }
    const instId = user.institutionId;
    const body = await request.json();
    const store = await ensureStoreHydrated();
    ensureLaunchpadArrays(store);
    const now = new Date().toISOString();

    switch (body.entity) {
      case "skill": {
        if (body.action === "update_status") {
          const skill = store.launchpadSkills!.find((s) => s.id === body.id && s.studentId === user.id);
          if (!skill) return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
          const allowed = new Set(["studied", "practiced", "self_confirmed", "demonstrated"]);
          if (allowed.has(body.status)) {
            skill.status = body.status;
            skill.proficiency =
              body.status === "demonstrated" ? Math.max(skill.proficiency, 85)
              : body.status === "self_confirmed" ? Math.max(skill.proficiency, 75)
              : body.status === "practiced" ? Math.max(skill.proficiency, 65)
              : skill.proficiency;
          }
          persistToDisk(store);
          return NextResponse.json({ skill });
        }
        if (body.action === "delete") {
          const idx = store.launchpadSkills!.findIndex((s) => s.id === body.id && s.studentId === user.id);
          if (idx === -1) return NextResponse.json({ error: "Compétence introuvable." }, { status: 404 });
          store.launchpadSkills!.splice(idx, 1);
          persistToDisk(store);
          return NextResponse.json({ ok: true });
        }
        if (body.action === "create") {
          const name = sanitizeText(String(body.name || ""), 100);
          if (!name) return NextResponse.json({ error: "Nom requis." }, { status: 400 });
          const skill = {
            id: `lsk-${crypto.randomUUID()}`,
            institutionId: instId,
            studentId: user.id,
            name,
            category: (["technical", "data", "design", "business", "engineering", "communication"].includes(body.category)
              ? body.category
              : "technical") as "technical" | "data" | "design" | "business" | "engineering" | "communication",
            subjectName: sanitizeText(String(body.subjectName || "Ajout personnel"), 80),
            sourceDocumentTitle: "Confirmation étudiant",
            evidenceSummary: sanitizeText(String(body.evidenceSummary || "Compétence confirmée manuellement."), 250),
            practicalApplications: ["Projets pratiques", "Portfolio"],
            status: "self_confirmed" as const,
            proficiency: 70,
            nextSkills: ["Projet pratique démontré"],
            createdAt: now,
          };
          store.launchpadSkills!.unshift(skill);
          persistToDisk(store);
          return NextResponse.json({ skill }, { status: 201 });
        }
        break;
      }

      case "freelance": {
        if (body.action === "toggle_save") {
          const item = store.launchpadFreelanceIdeas!.find((f) => f.id === body.id && f.studentId === user.id);
          if (!item) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
          item.saved = !item.saved;
          persistToDisk(store);
          return NextResponse.json({ item });
        }
        if (body.action === "generate_prep_kit") {
          const item = store.launchpadFreelanceIdeas!.find((f) => f.id === body.id && f.studentId === user.id);
          if (!item) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
          item.prepKit = {
            serviceDescription: `${item.serviceTitle} : ${item.description}`,
            proposalTemplate: `Objet : Proposition pour ${item.serviceTitle}\nLivrables : ${item.deliverables.join(", ")}\nHypothèses & Périmètre : Validation écrite avant démarrage.`,
            deliveryChecklist: [
              "Valider le besoin et les livrables par écrit",
              ...item.deliverables.map((d) => `Livrer : ${d}`),
              "Recueillir le retour final et documenter pour le portfolio",
            ],
            mockInterviewQuestions: [
              `Quels livrables incluez-vous dans « ${item.serviceTitle} » ?`,
              "Comment gérez-vous les demandes de révision ?",
              "Quels outils utilisez-vous et pourquoi ?",
            ],
          };
          persistToDisk(store);
          return NextResponse.json({ item });
        }
        break;
      }

      case "startup": {
        if (body.action === "toggle_save") {
          const idea = store.launchpadStartupIdeas!.find((s) => s.id === body.id && s.studentId === user.id);
          if (!idea) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
          idea.saved = !idea.saved;
          persistToDisk(store);
          return NextResponse.json({ idea });
        }
        if (body.action === "delete") {
          const idx = store.launchpadStartupIdeas!.findIndex((s) => s.id === body.id && s.studentId === user.id);
          if (idx === -1) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
          store.launchpadStartupIdeas!.splice(idx, 1);
          persistToDisk(store);
          return NextResponse.json({ ok: true });
        }
        break;
      }

      case "canvas": {
        if (body.action === "update") {
          const canvas = store.launchpadCanvases!.find((c) => c.id === body.id && c.studentId === user.id);
          if (!canvas) return NextResponse.json({ error: "Canvas introuvable." }, { status: 404 });
          const fields = [
            "title",
            "customerSegments",
            "valuePropositions",
            "channels",
            "customerRelationships",
            "revenueStreams",
            "keyResources",
            "keyActivities",
            "keyPartnerships",
            "costStructure",
          ] as const;
          for (const f of fields) {
            if (typeof body[f] === "string") {
              canvas[f] = sanitizeText(body[f], 800);
            }
          }
          if (Array.isArray(body.validatedFacts)) {
            canvas.validatedFacts = body.validatedFacts.map((x: unknown) => sanitizeText(String(x), 200)).filter(Boolean);
          }
          if (Array.isArray(body.assumptions)) {
            canvas.assumptions = body.assumptions.map((x: unknown) => sanitizeText(String(x), 200)).filter(Boolean);
          }
          if (typeof body.sharedWithTeamId === "string") {
            const team = store.launchpadTeams!.find(
              (t) => t.id === body.sharedWithTeamId && t.institutionId === instId && t.members.some((m) => m.userId === user.id)
            );
            canvas.sharedWithTeamId = team ? team.id : undefined;
          }
          canvas.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ canvas });
        }
        if (body.action === "duplicate") {
          const src = store.launchpadCanvases!.find((c) => c.id === body.id && c.studentId === user.id);
          if (!src) return NextResponse.json({ error: "Canvas introuvable." }, { status: 404 });
          const copy = {
            ...src,
            id: `lcv-${crypto.randomUUID()}`,
            title: `${src.title} (v${src.version + 1})`,
            version: src.version + 1,
            createdAt: now,
            updatedAt: now,
          };
          store.launchpadCanvases!.unshift(copy);
          persistToDisk(store);
          return NextResponse.json({ canvas: copy }, { status: 201 });
        }
        if (body.action === "delete") {
          const idx = store.launchpadCanvases!.findIndex((c) => c.id === body.id && c.studentId === user.id);
          if (idx === -1) return NextResponse.json({ error: "Canvas introuvable." }, { status: 404 });
          store.launchpadCanvases!.splice(idx, 1);
          persistToDisk(store);
          return NextResponse.json({ ok: true });
        }
        break;
      }

      case "roadmap": {
        const roadmap = store.launchpadRoadmaps!.find((r) => r.id === body.id && r.studentId === user.id);
        if (!roadmap) return NextResponse.json({ error: "Roadmap introuvable." }, { status: 404 });
        if (body.action === "toggle_task") {
          const task = roadmap.tasks.find((t) => t.id === body.taskId);
          if (task) task.completed = !task.completed;
          roadmap.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ roadmap });
        }
        if (body.action === "add_task") {
          const title = sanitizeText(String(body.title || ""), 160);
          if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
          roadmap.tasks.push({
            id: `lrt-${crypto.randomUUID()}`,
            title,
            phase: (["validation", "design", "development", "testing", "pitch"].includes(body.phase)
              ? body.phase
              : "development") as "validation" | "design" | "development" | "testing" | "pitch",
            priority: (["high", "medium", "low"].includes(body.priority) ? body.priority : "medium") as
              | "high"
              | "medium"
              | "low",
            dueDate: String(body.dueDate || now.slice(0, 10)).slice(0, 10),
            completed: false,
            notes: body.notes ? sanitizeText(String(body.notes), 200) : undefined,
          });
          roadmap.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ roadmap });
        }
        if (body.action === "sync_to_planner") {
          const task = roadmap.tasks.find((t) => t.id === body.taskId);
          if (!task) return NextResponse.json({ error: "Tâche introuvable." }, { status: 404 });
          if (!task.syncedToPlanner) {
            store.personalTasks.unshift({
              id: `task-${crypto.randomUUID()}`,
              studentId: user.id,
              title: `[Launchpad] ${task.title}`,
              dueDate: task.dueDate,
              isCompleted: task.completed,
            });
            task.syncedToPlanner = true;
            roadmap.updatedAt = now;
            persistToDisk(store);
          }
          return NextResponse.json({ roadmap });
        }
        break;
      }

      case "project": {
        if (body.action === "create") {
          const title = sanitizeText(String(body.title || ""), 120);
          if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
          const project = {
            id: `lpr-${crypto.randomUUID()}`,
            institutionId: instId,
            ownerId: user.id,
            ownerName: user.fullName,
            title,
            problemSolved: sanitizeText(String(body.problemSolved || ""), 400),
            subjectName: body.subjectName ? sanitizeText(String(body.subjectName), 80) : undefined,
            difficulty: (["beginner", "intermediate", "advanced"].includes(body.difficulty)
              ? body.difficulty
              : "intermediate") as "beginner" | "intermediate" | "advanced",
            objectives: ["Mettre en pratique les acquis universitaires", "Documenter les résultats"],
            requirements: ["Architecture claire", "Démonstration fonctionnelle"],
            technologies: String(body.technologies || "")
              .split(",")
              .map((s) => sanitizeText(s, 40))
              .filter(Boolean),
            deliverables: ["Code source ou prototype", "Note de réflexion"],
            evaluationCriteria: ["Qualité technique", "Utilité concrète"],
            courseReferences: body.subjectName ? [sanitizeText(String(body.subjectName), 80)] : [],
            skillsDeveloped: [],
            status: "planning" as const,
            progress: 0,
            attachments: [],
            tasks: [{ id: `lpt-${crypto.randomUUID()}`, title: "Définir les objectifs du projet", completed: false }],
            isPrivate: true,
            createdAt: now,
            updatedAt: now,
          };
          store.launchpadProjects!.unshift(project);
          persistToDisk(store);
          return NextResponse.json({ project }, { status: 201 });
        }

        const project = store.launchpadProjects!.find((p) => p.id === body.id && p.ownerId === user.id);
        if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

        if (body.action === "update") {
          if (["planning", "in_progress", "completed"].includes(body.status)) {
            project.status = body.status;
          }
          if (typeof body.progress === "number") {
            project.progress = Math.max(0, Math.min(100, Math.round(body.progress)));
          }
          if (typeof body.repoUrl === "string") {
            const trimmed = body.repoUrl.trim();
            project.repoUrl = trimmed && isSafeHttpUrl(trimmed) ? trimmed : undefined;
          }
          if (typeof body.demoUrl === "string") {
            const trimmed = body.demoUrl.trim();
            project.demoUrl = trimmed && isSafeHttpUrl(trimmed) ? trimmed : undefined;
          }
          if (typeof body.reflections === "string") {
            project.reflections = sanitizeText(body.reflections, 1000);
          }
          project.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ project });
        }

        if (body.action === "toggle_task") {
          const task = project.tasks.find((t) => t.id === body.taskId);
          if (task) task.completed = !task.completed;
          const done = project.tasks.filter((t) => t.completed).length;
          project.progress = project.tasks.length > 0 ? Math.round((done / project.tasks.length) * 100) : project.progress;
          if (project.progress === 100) project.status = "completed";
          project.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ project });
        }

        if (body.action === "add_task") {
          const title = sanitizeText(String(body.title || ""), 140);
          if (title) {
            project.tasks.push({ id: `lpt-${crypto.randomUUID()}`, title, completed: false });
            project.updatedAt = now;
            persistToDisk(store);
          }
          return NextResponse.json({ project });
        }

        if (body.action === "send_to_portfolio") {
          let portfolio = store.launchpadPortfolios!.find((p) => p.studentId === user.id);
          if (!portfolio) {
            portfolio = {
              studentId: user.id,
              institutionId: instId,
              headline: `${user.fullName} — CampusMate Portfolio`,
              bio: user.bio || "",
              template: "engineering",
              isPublicShared: false,
              items: [],
              certifications: [],
              achievements: [],
              updatedAt: now,
            };
            store.launchpadPortfolios!.push(portfolio);
          }
          if (!portfolio.items.some((i) => i.projectId === project.id)) {
            portfolio.items.unshift({
              id: `lpi-${crypto.randomUUID()}`,
              projectId: project.id,
              title: project.title,
              description: project.problemSolved,
              problemSolved: project.problemSolved,
              technologies: project.technologies,
              skillsDemonstrated: project.skillsDeveloped,
              contribution: "Conception et réalisation du projet",
              repoUrl: project.repoUrl,
              demoUrl: project.demoUrl,
              completionDate: now.slice(0, 10),
              importedToCv: false,
            });
            portfolio.updatedAt = now;
            persistToDisk(store);
          }
          return NextResponse.json({ portfolio });
        }
        break;
      }

      case "team": {
        if (body.action === "create") {
          const projectTitle = sanitizeText(String(body.projectTitle || ""), 120);
          const description = sanitizeText(String(body.description || ""), 600);
          if (!projectTitle || !description) {
            return NextResponse.json({ error: "Titre et description requis." }, { status: 400 });
          }
          const requiredRoles = String(body.requiredRoles || "")
            .split(",")
            .map((s) => sanitizeText(s, 60))
            .filter(Boolean);
          const requiredSkills = String(body.requiredSkills || "")
            .split(",")
            .map((s) => sanitizeText(s, 60))
            .filter(Boolean);

          // Create an authorized private academic group chat for the team
          const chatGroupId = `grp-lp-${crypto.randomUUID()}`;
          store.chatGroups.unshift({
            id: chatGroupId,
            institutionId: instId,
            name: `Launchpad • ${projectTitle.slice(0, 32)}`,
            groupType: "subject",
            memberIds: [user.id],
            unreadCount: 0,
          });

          const team = {
            id: `ltm-${crypto.randomUUID()}`,
            institutionId: instId,
            leaderId: user.id,
            leaderName: user.fullName,
            projectTitle,
            description,
            requiredRoles,
            requiredSkills,
            members: [{ userId: user.id, fullName: user.fullName, role: "Porteur de projet", joinedAt: now }],
            joinRequests: [],
            milestones: [{ id: `ltms-${crypto.randomUUID()}`, title: "Cadrage MVP & répartition des rôles", completed: false }],
            chatGroupId,
            announcements: ["Équipe créée ! Les étudiants autorisés peuvent demander à rejoindre le projet."],
            createdAt: now,
          };
          store.launchpadTeams!.unshift(team);
          persistToDisk(store);
          return NextResponse.json({ team }, { status: 201 });
        }

        const team = store.launchpadTeams!.find((t) => t.id === body.id && t.institutionId === instId);
        if (!team) return NextResponse.json({ error: "Équipe introuvable." }, { status: 404 });

        if (body.action === "request_join") {
          if (team.members.some((m) => m.userId === user.id)) {
            return NextResponse.json({ error: "Vous êtes déjà membre." }, { status: 400 });
          }
          if (team.joinRequests.some((r) => r.userId === user.id && r.status === "pending")) {
            return NextResponse.json({ error: "Demande déjà envoyée." }, { status: 400 });
          }
          team.joinRequests.push({
            id: `ljr-${crypto.randomUUID()}`,
            userId: user.id,
            fullName: user.fullName,
            role: sanitizeText(String(body.role || "Membre"), 60),
            message: sanitizeText(String(body.message || "Souhaite contribuer au projet."), 300),
            status: "pending",
            createdAt: now,
          });
          addNotification({
            institutionId: instId,
            userId: team.leaderId,
            category: "launchpad",
            title: "Nouvelle demande d'équipe Launchpad",
            body: `${user.fullName} souhaite rejoindre « ${team.projectTitle} ».`,
            actionUrl: "/student/launchpad/teams",
          });
          persistToDisk(store);
          return NextResponse.json({ team });
        }

        if (body.action === "review_request") {
          if (team.leaderId !== user.id) {
            return NextResponse.json({ error: "Seul le porteur du projet peut valider les membres." }, { status: 403 });
          }
          const req = team.joinRequests.find((r) => r.id === body.requestId);
          if (!req) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
          req.status = body.decision === "accepted" ? "accepted" : "rejected";
          if (req.status === "accepted" && !team.members.some((m) => m.userId === req.userId)) {
            team.members.push({
              userId: req.userId,
              fullName: req.fullName,
              role: req.role,
              joinedAt: now,
            });
            if (team.chatGroupId) {
              const chatGrp = store.chatGroups.find((g) => g.id === team.chatGroupId);
              if (chatGrp && !chatGrp.memberIds.includes(req.userId)) {
                chatGrp.memberIds.push(req.userId);
              }
            }
          }
          persistToDisk(store);
          return NextResponse.json({ team });
        }

        if (body.action === "toggle_milestone") {
          if (!team.members.some((m) => m.userId === user.id)) {
            return NextResponse.json({ error: "Accès réservé aux membres." }, { status: 403 });
          }
          const ms = team.milestones.find((m) => m.id === body.milestoneId);
          if (ms) ms.completed = !ms.completed;
          persistToDisk(store);
          return NextResponse.json({ team });
        }
        break;
      }

      case "portfolio": {
        let portfolio = store.launchpadPortfolios!.find((p) => p.studentId === user.id);
        if (!portfolio) {
          portfolio = {
            studentId: user.id,
            institutionId: instId,
            headline: `${user.fullName} — Portfolio`,
            bio: user.bio || "",
            template: "engineering",
            isPublicShared: false,
            items: [],
            certifications: [],
            achievements: [],
            updatedAt: now,
          };
          store.launchpadPortfolios!.push(portfolio);
        }

        if (body.action === "update_settings") {
          if (typeof body.headline === "string") portfolio.headline = sanitizeText(body.headline, 160);
          if (typeof body.bio === "string") portfolio.bio = sanitizeText(body.bio, 600);
          if (["minimal", "engineering", "product"].includes(body.template)) {
            portfolio.template = body.template;
          }
          if (typeof body.isPublicShared === "boolean") {
            portfolio.isPublicShared = body.isPublicShared;
            if (body.isPublicShared && !portfolio.shareToken) {
              portfolio.shareToken = crypto.randomUUID().slice(0, 12);
            }
          }
          portfolio.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ portfolio });
        }

        if (body.action === "import_to_cv") {
          const item = portfolio.items.find((i) => i.id === body.itemId);
          if (!item) return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
          const cv = store.cvProfiles.find((c) => c.studentId === user.id);
          if (!cv) {
            return NextResponse.json({ error: "Veuillez d'abord ouvrir l'Assistant CV." }, { status: 404 });
          }
          const already = cv.projects.some((p) => p.name === item.title);
          if (!already) {
            cv.projects.unshift({
              name: item.title,
              stack: item.technologies.join(", "),
              description: item.description,
              link: item.repoUrl || item.demoUrl,
            });
            for (const sk of item.skillsDemonstrated) {
              if (!cv.skills.includes(sk)) cv.skills.push(sk);
            }
            cv.updatedAt = now;
          }
          item.importedToCv = true;
          portfolio.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ portfolio, imported: true });
        }
        break;
      }

      case "mentorship": {
        if (body.action === "create") {
          if (!["teacher", "university_admin", "organization", "super_admin"].includes(user.role)) {
            return NextResponse.json({ error: "Réservé aux enseignants, administration et organisations vérifiées." }, { status: 403 });
          }
          const title = sanitizeText(String(body.title || ""), 140);
          const description = sanitizeText(String(body.description || ""), 800);
          if (!title || !description) return NextResponse.json({ error: "Titre et description requis." }, { status: 400 });
          const item = {
            id: `lmn-${crypto.randomUUID()}`,
            institutionId: instId,
            authorId: user.id,
            authorName: user.fullName,
            authorRole: (user.role === "super_admin" ? "university_admin" : user.role) as
              | "teacher"
              | "university_admin"
              | "organization",
            kind: (["challenge", "mentorship", "incubator", "funding_info", "course_application"].includes(body.kind)
              ? body.kind
              : "challenge") as "challenge" | "mentorship" | "incubator" | "funding_info" | "course_application",
            title,
            description,
            relatedDiscipline: sanitizeText(String(body.relatedDiscipline || "Toutes spécialités"), 80),
            eligibilityNote: sanitizeText(String(body.eligibilityNote || "Étudiants autorisés de l'institution."), 200),
            isDemoSample: false,
            applicants: [],
            createdAt: now,
          };
          store.launchpadMentorships!.unshift(item);
          persistToDisk(store);
          return NextResponse.json({ item }, { status: 201 });
        }

        if (body.action === "apply") {
          const item = store.launchpadMentorships!.find((m) => m.id === body.id && m.institutionId === instId);
          if (!item) return NextResponse.json({ error: "Opportunité introuvable." }, { status: 404 });
          item.applicants.push({
            userId: user.id,
            fullName: user.fullName,
            projectTitle: sanitizeText(String(body.projectTitle || "Projet étudiant"), 120),
            message: sanitizeText(String(body.message || ""), 500),
            createdAt: now,
          });
          persistToDisk(store);
          return NextResponse.json({ item });
        }
        break;
      }

      case "pitch": {
        if (body.action === "update") {
          const pitch = store.launchpadPitches!.find((p) => p.id === body.id && p.studentId === user.id);
          if (!pitch) return NextResponse.json({ error: "Pitch introuvable." }, { status: 404 });
          for (const f of ["elevatorPitch", "pitch30s", "pitch1m", "pitch3m", "executiveSummary", "problemSolution", "valueProposition"] as const) {
            if (typeof body[f] === "string") {
              pitch[f] = sanitizeText(body[f], 2000);
            }
          }
          pitch.updatedAt = now;
          persistToDisk(store);
          return NextResponse.json({ pitch });
        }
        break;
      }
    }

    return NextResponse.json({ error: "Action Launchpad non reconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
