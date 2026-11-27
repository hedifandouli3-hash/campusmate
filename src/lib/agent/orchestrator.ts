import crypto from "node:crypto";
import { answerWithRag } from "@/lib/ai/service";
import { checkToolAuthorization } from "@/lib/agent/registry";
import type { CampusMateStoreState } from "@/lib/demo/seed";
import { getAuthorizedChunksForUser } from "@/lib/data/store";
import { sanitizeText } from "@/lib/utils";
import type {
  AgentApprovalRequest,
  AgentRun,
  AgentToolExecution,
  CreationArtifact,
  EmailDraft,
  Locale,
  UserProfile,
} from "@/types/domain";

const MAX_TOOL_CALLS = 4;

export async function runCampusMateAgent(params: {
  user: UserProfile;
  store: CampusMateStoreState;
  conversationId: string;
  goal: string;
  locale: Locale;
}): Promise<{
  run: AgentRun;
  createdArtifacts: CreationArtifact[];
  createdApprovals: AgentApprovalRequest[];
}> {
  const now = new Date().toISOString();
  const runId = `arun-${crypto.randomUUID()}`;
  const cleanGoal = sanitizeText(params.goal, 800);
  const lower = cleanGoal.toLowerCase();

  const toolExecutions: AgentToolExecution[] = [];
  const createdArtifacts: CreationArtifact[] = [];
  const createdApprovals: AgentApprovalRequest[] = [];
  const replyParts: string[] = [];

  params.store.creationArtifacts ??= [];
  params.store.agentApprovals ??= [];
  params.store.emailDrafts ??= [];
  params.store.workspaceProjects ??= [];

  const instId = params.user.institutionId || "11111111-1111-1111-1111-111111111101";

  const pushTool = (exec: AgentToolExecution) => {
    if (toolExecutions.length < MAX_TOOL_CALLS) {
      toolExecutions.push(exec);
    }
  };

  // 1. Check for external side-effect intent requiring approval (Category D)
  if (
    lower.includes("envoyer un email") ||
    lower.includes("envoie un email") ||
    lower.includes("send email") ||
    lower.includes("planifier un email") ||
    lower.includes("publier le site") ||
    lower.includes("publish website")
  ) {
    const isEmail = lower.includes("email") || lower.includes("mail");
    const toolName = isEmail ? "scheduleExternalEmail" : "publishWebsiteExternal";
    const auth = checkToolAuthorization(toolName);
    if (auth.allowed && auth.definition) {
      const approval: AgentApprovalRequest = {
        id: `aapp-${crypto.randomUUID()}`,
        runId,
        studentId: params.user.id,
        institutionId: instId,
        toolName,
        description: isEmail
          ? "Préparer et approuver une action externe d'e-mail (aucun envoi automatique sans connecteur OAuth vérifié)."
          : "Publier un site web généré en dehors du studio privé.",
        payload: { goal: cleanGoal },
        status: "pending",
        createdAt: now,
      };
      params.store.agentApprovals.unshift(approval);
      createdApprovals.push(approval);
      pushTool({
        id: `aex-${crypto.randomUUID()}`,
        toolName,
        category: auth.definition.category,
        status: "waiting_approval",
        summary: "En attente d'approbation explicite de l'étudiant.",
        executedAt: now,
      });
      replyParts.push(
        "Cette action externe nécessite votre approbation explicite ci-dessous avant toute exécution."
      );
    }
  }

  // 2. Website Builder intent
  if (lower.includes("site") || lower.includes("website") || lower.includes("landing")) {
    const auth = checkToolAuthorization("createWebsiteProject");
    if (auth.allowed && auth.definition) {
      const artifact: CreationArtifact = {
        id: `art-${crypto.randomUUID()}`,
        institutionId: instId,
        ownerId: params.user.id,
        type: "website",
        title: `Site Web — ${cleanGoal.slice(0, 48)}`,
        description: `Site généré par CampusMate Agent pour : ${cleanGoal}`,
        version: 1,
        isPrivate: true,
        websiteData: {
          template: lower.includes("portfolio") ? "portfolio" : "startup",
          brandName: lower.includes("stock") ? "StockPulse TN" : "Projet CampusMate",
          primaryColor: "#2563EB",
          fontFamily: "sans",
          sections: [
            {
              id: "sec-1",
              kind: "hero",
              heading: cleanGoal.slice(0, 80),
              subheading: "Généré à partir de vos acquis universitaires dans CampusMate Studio.",
              items: [],
            },
            {
              id: "sec-2",
              kind: "features",
              heading: "Points clés",
              subheading: "Structure modulaire éditable et exportable.",
              items: [
                { title: "Problème ciblé", description: "Répond à un besoin concret identifié sur le terrain." },
                { title: "MVP sobre", description: "Conçu pour être testé rapidement avec peu de ressources." },
                { title: "Évolutif", description: "Code HTML/CSS propre exportable depuis le Studio." },
              ],
            },
          ],
          contactPreviewNote: "Formulaire en mode aperçu (aucun backend externe connecté).",
        },
        createdAt: now,
        updatedAt: now,
      };
      params.store.creationArtifacts.unshift(artifact);
      createdArtifacts.push(artifact);
      pushTool({
        id: `aex-${crypto.randomUUID()}`,
        toolName: "createWebsiteProject",
        category: auth.definition.category,
        status: "completed",
        summary: `Site web créé dans Studio (${artifact.title}).`,
        artifactId: artifact.id,
        executedAt: now,
      });
      replyParts.push(
        `J'ai créé votre site web « ${artifact.title} » dans le Studio de création (/student/studio). Vous pouvez le prévisualiser en sandbox sécurisée, l'éditer et l'exporter en HTML.`
      );
    }
  }

  // 3. Presentation / Pitch Deck intent
  if (lower.includes("présentation") || lower.includes("presentation") || lower.includes("pitch") || lower.includes("slides")) {
    const auth = checkToolAuthorization("createPresentation");
    if (auth.allowed && auth.definition) {
      const artifact: CreationArtifact = {
        id: `art-${crypto.randomUUID()}`,
        institutionId: instId,
        ownerId: params.user.id,
        type: "presentation",
        title: `Présentation — ${cleanGoal.slice(0, 45)}`,
        description: "Support de présentation éditable généré par CampusMate Agent.",
        version: 1,
        isPrivate: true,
        slides: [
          { id: "sl-1", title: "1. Titre & Contexte Universitaire", bullets: [cleanGoal, params.user.fullName], speakerNotes: "Présenter le contexte ISET Béja." },
          { id: "sl-2", title: "2. Problème & Solution", bullets: ["Besoin observé sur le terrain", "Approche pratique issue des cours"], speakerNotes: "Rester factuel." },
          { id: "sl-3", title: "3. Réalisations vs Planifié", bullets: ["Prototype en cours", "Prochaine étape : validation utilisateurs"], speakerNotes: "Séparer le réalisé du planifié." },
        ],
        createdAt: now,
        updatedAt: now,
      };
      params.store.creationArtifacts.unshift(artifact);
      createdArtifacts.push(artifact);
      pushTool({
        id: `aex-${crypto.randomUUID()}`,
        toolName: "createPresentation",
        category: auth.definition.category,
        status: "completed",
        summary: `Présentation créée (${artifact.slides?.length} diapositives).`,
        artifactId: artifact.id,
        executedAt: now,
      });
      replyParts.push(`J'ai préparé votre présentation de 3 diapositives (« ${artifact.title} ») dans /student/studio.`);
    }
  }

  // 4. Email draft intent (without sending)
  if ((lower.includes("email") || lower.includes("mail") || lower.includes("professeur")) && createdApprovals.length === 0) {
    const auth = checkToolAuthorization("prepareEmailDraft");
    if (auth.allowed && auth.definition) {
      const draft: EmailDraft = {
        id: `eml-${crypto.randomUUID()}`,
        institutionId: instId,
        ownerId: params.user.id,
        recipient: "enseignant@isetb.rnu.tn",
        subject: `Demande de précision — ${cleanGoal.slice(0, 50)}`,
        body: `Bonjour,\n\nJe me permets de vous contacter au sujet de : ${cleanGoal}.\n\nPourriez-vous m'indiquer les modalités recommandées ?\n\nCordialement,\n${params.user.fullName}`,
        status: "draft",
        createdAt: now,
      };
      params.store.emailDrafts.unshift(draft);
      pushTool({
        id: `aex-${crypto.randomUUID()}`,
        toolName: "prepareEmailDraft",
        category: auth.definition.category,
        status: "completed",
        summary: "Brouillon d'e-mail enregistré dans Automatisations (non envoyé).",
        executedAt: now,
      });
      replyParts.push("J'ai rédigé un brouillon d'e-mail éditable dans /student/automations (aucun envoi externe effectué).");
    }
  }

  // 5. Unread messages / tasks / deadlines read tools
  if (lower.includes("non lu") || lower.includes("unread") || lower.includes("message") || lower.includes("tâche") || lower.includes("deadline") || lower.includes("retard")) {
    const auth = checkToolAuthorization("getProjectAndTaskStatus");
    if (auth.allowed && auth.definition) {
      const unreadNotifs = params.store.notifications.filter((n) => n.userId === params.user.id && !n.isRead).length;
      const openTasks = params.store.personalTasks.filter((t) => t.studentId === params.user.id && !t.isCompleted);
      const projectTasks = params.store.workspaceProjects
        .filter((p) => p.ownerId === params.user.id)
        .flatMap((p) => p.tasks.filter((t) => t.status !== "completed"));
      pushTool({
        id: `aex-${crypto.randomUUID()}`,
        toolName: "getProjectAndTaskStatus",
        category: auth.definition.category,
        status: "completed",
        summary: `${unreadNotifs} notification(s) non lue(s), ${openTasks.length} tâche(s) planner, ${projectTasks.length} tâche(s) projet restantes.`,
        executedAt: now,
      });
      replyParts.push(
        `État réel de votre espace : ${unreadNotifs} notification(s) non lue(s), ${openTasks.length} tâche(s) dans votre Study Planner et ${projectTasks.length} tâche(s) projet en cours.`
      );
    }
  }

  // 6. Default grounded RAG fallback (official university or authorized course knowledge)
  if (toolExecutions.length === 0) {
    const isCourse = lower.includes("cours") || lower.includes("sql") || lower.includes("react") || lower.includes("base");
    const scope = isCourse ? "learning" : "university_assistant";
    const toolName = isCourse ? "searchAuthorizedCourses" : "searchUniversityKnowledge";
    const auth = checkToolAuthorization(toolName);
    if (auth.allowed && auth.definition) {
      const authorizedChunks = getAuthorizedChunksForUser({ user: params.user, scope });
      const rag = await answerWithRag({
        question: cleanGoal,
        locale: params.locale,
        scope,
        authorizedChunks,
      });
      pushTool({
        id: `aex-${crypto.randomUUID()}`,
        toolName,
        category: auth.definition.category,
        status: "completed",
        summary: `${rag.citations.length} source(s) autorisée(s) consultée(s).`,
        executedAt: now,
      });
      replyParts.push(rag.answer);
    }
  }

  const hasPendingApproval = createdApprovals.length > 0;
  const run: AgentRun = {
    id: runId,
    conversationId: params.conversationId,
    studentId: params.user.id,
    institutionId: instId,
    goal: cleanGoal,
    status: hasPendingApproval ? "waiting_approval" : "completed",
    toolExecutions,
    finalAnswer: replyParts.join("\n\n") || "Action traitée.",
    createdAt: now,
    completedAt: hasPendingApproval ? undefined : now,
  };

  return { run, createdArtifacts, createdApprovals };
}
