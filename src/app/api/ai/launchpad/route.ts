import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildBusinessCanvasFromIdea,
  buildPracticalProjectFromInput,
  buildRoadmapForProjectOrStartup,
  courseToOpportunitiesWithAI,
  extractAcademicSkillsWithAI,
  generateFreelanceIdeasWithAI,
  generatePitchWithAI,
  generateSocialPostsWithAI,
  generateStartupIdeasWithAI,
} from "@/lib/ai/launchpad";
import { ensureStoreHydrated, getVisibleCourseDocuments, persistToDisk, requireUser } from "@/lib/data/store";
import { buildInitialDemoState } from "@/lib/demo/seed";

const RequestSchema = z.object({
  action: z.enum([
    "extract_skills",
    "course_to_opportunities",
    "generate_freelance",
    "generate_startup",
    "generate_canvas",
    "generate_roadmap",
    "generate_project",
    "generate_pitch",
    "generate_social_posts",
  ]),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
  idea: z.string().max(1200).optional(),
  attachedTitle: z.string().max(200).optional(),
  attachedType: z.enum(["project", "certificate", "stage", "upload"]).optional(),
  platforms: z.array(z.enum(["linkedin", "instagram", "facebook"])).optional(),
  courseDocumentId: z.string().optional(),
  mode: z.enum(["knowledge", "course", "custom"]).optional(),
  customPrompt: z.string().max(600).optional(),
  industry: z.string().max(120).optional(),
  budgetConstraint: z.string().max(120).optional(),
  startupIdeaId: z.string().optional(),
  projectId: z.string().optional(),
  title: z.string().max(160).optional(),
  horizon: z.enum(["7d", "14d", "30d", "90d", "custom"]).optional(),
  subjectName: z.string().max(120).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  interests: z.string().max(240).optional(),
  problem: z.string().max(500).optional(),
  solution: z.string().max(500).optional(),
  targetCustomers: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    if (!user.institutionId) {
      return NextResponse.json({ error: "Institution requise." }, { status: 403 });
    }
    const instId = user.institutionId;
    const raw = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête Launchpad invalide." }, { status: 400 });
    }

    const data = parsed.data;
    const store = await ensureStoreHydrated();
    const defaults = buildInitialDemoState();
    store.launchpadSkills ??= defaults.launchpadSkills ?? [];
    store.launchpadOpportunityPacks ??= [];
    store.launchpadFreelanceIdeas ??= defaults.launchpadFreelanceIdeas ?? [];
    store.launchpadStartupIdeas ??= defaults.launchpadStartupIdeas ?? [];
    store.launchpadCanvases ??= defaults.launchpadCanvases ?? [];
    store.launchpadRoadmaps ??= defaults.launchpadRoadmaps ?? [];
    store.launchpadProjects ??= defaults.launchpadProjects ?? [];
    store.launchpadPitches ??= [];

    const authorizedDocs = getVisibleCourseDocuments(user);
    const studentSkills = store.launchpadSkills.filter((s) => s.studentId === user.id).map((s) => s.name);
    const stageTitles = store.internshipApplications
      .filter((a) => a.studentId === user.id)
      .map((a) => `Stage: ${a.offerTitle}`);
    const projectTitles = store.launchpadProjects
      .filter((p) => p.ownerId === user.id)
      .map((p) => `Projet: ${p.title}`);
    const combinedSkills = [...new Set([...studentSkills, ...user.skills, ...stageTitles, ...projectTitles])];
    const spec = store.specializations.find((s) => s.id === user.specializationId)?.name || "Technologies de l'Informatique";

    switch (data.action) {
      case "extract_skills": {
        const personalDocTitles = store.personalDocuments.filter((d) => d.ownerId === user.id).map((d) => d.title);
        const quizTopics = store.quizAttempts.filter((a) => a.studentId === user.id).flatMap((a) => a.weakTopics);
        const res = await extractAcademicSkillsWithAI({
          institutionId: instId,
          studentId: user.id,
          specialization: spec,
          authorizedDocs,
          personalDocTitles,
          quizTopics,
          locale: data.locale,
        });
        const existingNames = new Set(store.launchpadSkills.filter((s) => s.studentId === user.id).map((s) => s.name.toLowerCase()));
        const added = res.skills.filter((s) => !existingNames.has(s.name.toLowerCase()));
        store.launchpadSkills.unshift(...added);
        persistToDisk(store);
        return NextResponse.json({ skills: added, allSkills: store.launchpadSkills.filter((s) => s.studentId === user.id), isDemoFallback: res.isDemoFallback });
      }

      case "course_to_opportunities": {
        const doc = authorizedDocs.find((d) => d.id === data.courseDocumentId);
        if (!doc) {
          return NextResponse.json({ error: "Document de cours non autorisé ou introuvable." }, { status: 403 });
        }
        const pack = await courseToOpportunitiesWithAI({
          institutionId: instId,
          studentId: user.id,
          doc,
          locale: data.locale,
        });
        store.launchpadOpportunityPacks.unshift(pack);
        persistToDisk(store);
        return NextResponse.json({ pack });
      }

      case "generate_freelance": {
        const res = await generateFreelanceIdeasWithAI({
          institutionId: instId,
          studentId: user.id,
          specialization: spec,
          skills: combinedSkills,
          interests: user.interests,
          locale: data.locale,
        });
        store.launchpadFreelanceIdeas.unshift(...res.ideas);
        persistToDisk(store);
        return NextResponse.json({ ideas: res.ideas, isDemoFallback: res.isDemoFallback });
      }

      case "generate_startup": {
        const mode = data.mode || "knowledge";
        let courseTitle: string | undefined;
        if (mode === "course" && data.courseDocumentId) {
          const doc = authorizedDocs.find((d) => d.id === data.courseDocumentId);
          if (!doc) {
            return NextResponse.json({ error: "Document non autorisé." }, { status: 403 });
          }
          courseTitle = doc.title;
        }
        const res = await generateStartupIdeasWithAI({
          institutionId: instId,
          studentId: user.id,
          mode,
          specialization: spec,
          skills: combinedSkills,
          courseTitle,
          customPrompt: data.customPrompt,
          industry: data.industry,
          budgetConstraint: data.budgetConstraint,
          locale: data.locale,
        });
        store.launchpadStartupIdeas.unshift(...res.ideas);
        persistToDisk(store);
        return NextResponse.json({ ideas: res.ideas, isDemoFallback: res.isDemoFallback });
      }

      case "generate_canvas": {
        const idea = data.startupIdeaId
          ? store.launchpadStartupIdeas.find((s) => s.id === data.startupIdeaId && s.studentId === user.id)
          : undefined;
        const canvas = buildBusinessCanvasFromIdea({
          institutionId: instId,
          studentId: user.id,
          idea,
          title: data.title,
        });
        store.launchpadCanvases.unshift(canvas);
        persistToDisk(store);
        return NextResponse.json({ canvas }, { status: 201 });
      }

      case "generate_roadmap": {
        const idea = data.startupIdeaId
          ? store.launchpadStartupIdeas.find((s) => s.id === data.startupIdeaId && s.studentId === user.id)
          : undefined;
        const project = data.projectId
          ? store.launchpadProjects.find((p) => p.id === data.projectId && p.ownerId === user.id)
          : undefined;
        const roadmap = buildRoadmapForProjectOrStartup({
          institutionId: instId,
          studentId: user.id,
          title: data.title || (idea ? `Roadmap — ${idea.name}` : project ? `Roadmap — ${project.title}` : "Roadmap MVP"),
          horizon: data.horizon || "30d",
          projectId: project?.id,
          startupIdeaId: idea?.id,
          skills: idea?.requiredTechnicalSkills || project?.technologies || studentSkills,
        });
        store.launchpadRoadmaps.unshift(roadmap);
        persistToDisk(store);
        return NextResponse.json({ roadmap }, { status: 201 });
      }

      case "generate_project": {
        const project = buildPracticalProjectFromInput({
          institutionId: instId,
          ownerId: user.id,
          ownerName: user.fullName,
          subjectName: data.subjectName || spec,
          difficulty: data.difficulty || "intermediate",
          interests: data.interests || "",
          skills: studentSkills.length > 0 ? studentSkills : user.skills,
        });
        store.launchpadProjects.unshift(project);
        persistToDisk(store);
        return NextResponse.json({ project }, { status: 201 });
      }

      case "generate_pitch": {
        const idea = data.startupIdeaId
          ? store.launchpadStartupIdeas.find((s) => s.id === data.startupIdeaId && s.studentId === user.id)
          : undefined;
        const project = data.projectId
          ? store.launchpadProjects.find((p) => p.id === data.projectId && p.ownerId === user.id)
          : undefined;
        const completedMilestones = project
          ? project.tasks.filter((t) => t.completed).map((t) => t.title)
          : [];
        const plannedMilestones = project
          ? project.tasks.filter((t) => !t.completed).map((t) => t.title)
          : idea?.validationPlan || [];

        const res = await generatePitchWithAI({
          institutionId: instId,
          studentId: user.id,
          title: data.title || idea?.name || project?.title || "Projet Launchpad",
          problem: data.problem || idea?.problemStatement || project?.problemSolved || "Besoin terrain identifié",
          solution: data.solution || idea?.proposedSolution || "Solution numérique issue de nos cours",
          targetCustomers: data.targetCustomers || idea?.targetCustomers.join(", ") || "Utilisateurs cibles locaux",
          completedMilestones,
          plannedMilestones,
          locale: data.locale,
        });
        store.launchpadPitches.unshift(res.pitch);
        persistToDisk(store);
        return NextResponse.json({ pitch: res.pitch, isDemoFallback: res.isDemoFallback }, { status: 201 });
      }

      case "generate_social_posts": {
        if (!data.idea?.trim() || !data.platforms || data.platforms.length === 0) {
          return NextResponse.json({ error: "Idée et au moins une plateforme requises." }, { status: 400 });
        }
        const res = await generateSocialPostsWithAI({
          idea: data.idea.trim(),
          attachedTitle: data.attachedTitle,
          attachedType: data.attachedType,
          platforms: data.platforms,
          studentName: user.fullName,
          specialization: spec,
          locale: data.locale,
        });
        return NextResponse.json(res);
      }
    }
  } catch (err) {
    const msg = err instanceof Error && err.message === "FORBIDDEN" ? "Accès réservé aux étudiants." : "Non autorisé.";
    return NextResponse.json({ error: msg }, { status: err instanceof Error && err.message === "FORBIDDEN" ? 403 : 401 });
  }
}
