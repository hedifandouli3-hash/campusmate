import type { AgentPermissionCategory } from "@/types/domain";

export interface AgentToolDefinition {
  name: string;
  category: AgentPermissionCategory;
  description: string;
  requiresApproval: boolean;
}

const PROHIBITED_PATTERNS =
  /sql|shell|exec|bash|powershell|admin|escalate|secret|token|password|other_user|bypass|impersonate/i;

export const AGENT_TOOL_REGISTRY: Record<string, AgentToolDefinition> = {
  searchUniversityKnowledge: {
    name: "searchUniversityKnowledge",
    category: "A_read",
    description: "Recherche dans la base officielle validée de l'ISET Béja.",
    requiresApproval: false,
  },
  searchAuthorizedCourses: {
    name: "searchAuthorizedCourses",
    category: "A_read",
    description: "Recherche dans les supports de cours autorisés de l'étudiant.",
    requiresApproval: false,
  },
  getAuthorizedUnreadCounts: {
    name: "getAuthorizedUnreadCounts",
    category: "A_read",
    description: "Consulte le nombre de messages non lus et notifications autorisées.",
    requiresApproval: false,
  },
  getProjectAndTaskStatus: {
    name: "getProjectAndTaskStatus",
    category: "A_read",
    description: "Lit l'avancement réel des projets et tâches de l'étudiant.",
    requiresApproval: false,
  },
  createWebsiteProject: {
    name: "createWebsiteProject",
    category: "B_create_private",
    description: "Crée un site web modifiable et exportable dans le Studio (privé par défaut).",
    requiresApproval: false,
  },
  createPortfolioSite: {
    name: "createPortfolioSite",
    category: "B_create_private",
    description: "Génère un site portfolio à partir des projets réels de l'étudiant.",
    requiresApproval: false,
  },
  createPresentation: {
    name: "createPresentation",
    category: "B_create_private",
    description: "Crée une présentation / pitch deck éditable (export PDF).",
    requiresApproval: false,
  },
  createDocument: {
    name: "createDocument",
    category: "B_create_private",
    description: "Rédige un rapport ou document structuré modifiable.",
    requiresApproval: false,
  },
  createBrandKit: {
    name: "createBrandKit",
    category: "B_create_private",
    description: "Génère une identité de marque (palette, slogan, positionnement).",
    requiresApproval: false,
  },
  createSocialPostDraft: {
    name: "createSocialPostDraft",
    category: "B_create_private",
    description: "Prépare des brouillons LinkedIn / Instagram / Facebook.",
    requiresApproval: false,
  },
  prepareEmailDraft: {
    name: "prepareEmailDraft",
    category: "B_create_private",
    description: "Prépare un brouillon d'e-mail professionnel (jamais envoyé sans validation).",
    requiresApproval: false,
  },
  createPersonalTask: {
    name: "createPersonalTask",
    category: "C_internal_state",
    description: "Ajoute une tâche ou un rappel dans le planificateur de l'étudiant.",
    requiresApproval: false,
  },
  createStartupWorkspace: {
    name: "createStartupWorkspace",
    category: "C_internal_state",
    description: "Crée un espace startup complet (Canvas + Projet + Tâches).",
    requiresApproval: false,
  },
  scheduleExternalEmail: {
    name: "scheduleExternalEmail",
    category: "D_external_approval",
    description: "Action externe : planifier un e-mail via un connecteur autorisé.",
    requiresApproval: true,
  },
  publishWebsiteExternal: {
    name: "publishWebsiteExternal",
    category: "D_external_approval",
    description: "Action externe : publier un site web publiquement.",
    requiresApproval: true,
  },
};

export function checkToolAuthorization(toolName: string): {
  allowed: boolean;
  definition?: AgentToolDefinition;
  reason?: string;
} {
  if (PROHIBITED_PATTERNS.test(toolName)) {
    return { allowed: false, reason: "PROHIBITED_ACTION: Catégorie E strictement interdite." };
  }
  const def = AGENT_TOOL_REGISTRY[toolName];
  if (!def) {
    return { allowed: false, reason: "UNKNOWN_TOOL: Outil non enregistré dans la liste autorisée." };
  }
  return { allowed: true, definition: def };
}
