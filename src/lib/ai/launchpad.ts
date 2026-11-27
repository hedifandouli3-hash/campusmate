import crypto from "node:crypto";
import { z } from "zod";
import { generateCompactText } from "@/lib/ai/service";
import type {
  CourseDocument,
  LaunchpadBusinessCanvas,
  LaunchpadFreelanceIdea,
  LaunchpadOpportunityPack,
  LaunchpadPitch,
  LaunchpadProject,
  LaunchpadRoadmap,
  LaunchpadSkill,
  LaunchpadStartupIdea,
  Locale,
} from "@/types/domain";

function parseJsonSafe<T>(raw: string | null, schema: z.ZodType<T>): T | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    const res = schema.safeParse(parsed);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

const SkillExtractionSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: z.enum(["technical", "data", "design", "business", "engineering", "communication"]),
        subjectName: z.string(),
        sourceDocumentTitle: z.string(),
        evidenceSummary: z.string(),
        practicalApplications: z.array(z.string()).min(1),
        status: z.enum(["studied", "practiced", "self_confirmed", "demonstrated"]),
        proficiency: z.number().min(10).max(95),
        nextSkills: z.array(z.string()).min(1),
      })
    )
    .min(1),
});

export async function extractAcademicSkillsWithAI(params: {
  institutionId: string;
  studentId: string;
  specialization: string;
  authorizedDocs: CourseDocument[];
  personalDocTitles: string[];
  quizTopics: string[];
  locale: Locale;
}): Promise<{ skills: LaunchpadSkill[]; isDemoFallback: boolean }> {
  const docSummary = params.authorizedDocs
    .slice(0, 6)
    .map((d) => `- [${d.subjectName}] ${d.title}: ${d.extractedText.slice(0, 350)}`)
    .join("\n");

  const raw = await generateCompactText({
    systemInstruction:
      "You are CampusMate Academic Skill Analyzer. Extract realistic, evidence-grounded skills strictly from the provided authorized academic documents. Never invent degrees or professional experience. Respond in valid JSON matching { skills: [...] }.",
    prompt: `Locale: ${params.locale}\nSpecialization: ${params.specialization}\nAuthorized Course Docs:\n${docSummary || "None"}\nPersonal Docs: ${params.personalDocTitles.join(", ") || "None"}\nQuiz topics: ${params.quizTopics.join(", ") || "None"}`,
    maxOutputTokens: 900,
    jsonMode: true,
    temperature: 0.2,
  });

  const aiParsed = parseJsonSafe(raw, SkillExtractionSchema);
  const now = new Date().toISOString();

  if (aiParsed) {
    return {
      isDemoFallback: false,
      skills: aiParsed.skills.map((s) => ({
        id: `lsk-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        ...s,
        createdAt: now,
      })),
    };
  }

  // Deterministic, course-grounded fallback
  const derived: LaunchpadSkill[] = [];
  for (const doc of params.authorizedDocs.slice(0, 4)) {
    const lower = `${doc.title} ${doc.subjectName} ${doc.extractedText}`.toLowerCase();
    if (lower.includes("react") || lower.includes("next") || lower.includes("web")) {
      derived.push({
        id: `lsk-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        name: "Développement Web React / Next.js & API",
        category: "technical",
        subjectName: doc.subjectName,
        sourceCourseId: doc.id,
        sourceDocumentTitle: doc.title,
        evidenceSummary: `Extrait du document autorisé « ${doc.title} » (SSR, Route Handlers, validation Zod).`,
        practicalApplications: ["Applications web vitrines & portails clients", "Tableaux de bord SaaS PME"],
        status: "studied",
        proficiency: 65,
        nextSkills: ["Tests automatisés", "Déploiement production"],
        createdAt: now,
      });
    }
    if (lower.includes("sql") || lower.includes("postgres") || lower.includes("base") || lower.includes("données")) {
      derived.push({
        id: `lsk-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        name: "Modélisation SQL, Normalisation 3NF & PostgreSQL",
        category: "data",
        subjectName: doc.subjectName,
        sourceCourseId: doc.id,
        sourceDocumentTitle: doc.title,
        evidenceSummary: `Basé sur le cours « ${doc.title} » (3NF, RLS, indexation).`,
        practicalApplications: ["Gestion de stocks & facturation", "Reporting analytique sécurisé"],
        status: params.quizTopics.length > 0 ? "practiced" : "studied",
        proficiency: 70,
        nextSkills: ["Requêtes analytiques avancées", "Sécurité RLS"],
        createdAt: now,
      });
    }
    if (lower.includes("énerg") || lower.includes("électr") || lower.includes("circuit")) {
      derived.push({
        id: `lsk-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        name: "Analyse Énergétique & Supervision Électrique",
        category: "engineering",
        subjectName: doc.subjectName,
        sourceCourseId: doc.id,
        sourceDocumentTitle: doc.title,
        evidenceSummary: `Extrait du support « ${doc.title} ».`,
        practicalApplications: ["Tableaux de bord de consommation", "Audit énergétique simulé"],
        status: "studied",
        proficiency: 60,
        nextSkills: ["IoT & capteurs", "Reporting énergétique"],
        createdAt: now,
      });
    }
    if (lower.includes("gestion") || lower.includes("financ") || lower.includes("management") || lower.includes("market")) {
      derived.push({
        id: `lsk-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        name: "Planification Financière & Gestion de Projet",
        category: "business",
        subjectName: doc.subjectName,
        sourceCourseId: doc.id,
        sourceDocumentTitle: doc.title,
        evidenceSummary: `Extrait du support « ${doc.title} ».`,
        practicalApplications: ["Tableaux de suivi budgétaire PME", "Business Model Canvas"],
        status: "studied",
        proficiency: 60,
        nextSkills: ["Validation client", "Modélisation financière"],
        createdAt: now,
      });
    }
  }

  if (derived.length === 0) {
    derived.push({
      id: `lsk-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      name: `Analyse & Synthèse — ${params.specialization}`,
      category: "communication",
      subjectName: params.specialization,
      sourceDocumentTitle: params.authorizedDocs[0]?.title || "Parcours académique",
      evidenceSummary: "Compétence transversale identifiée depuis votre spécialité universitaire.",
      practicalApplications: ["Documentation technique", "Présentation de projet"],
      status: "studied",
      proficiency: 55,
      nextSkills: ["Réalisation d'un prototype pratique"],
      createdAt: now,
    });
  }

  return { skills: derived, isDemoFallback: true };
}

const OpportunityPackSchema = z.object({
  reasoningSummary: z.string(),
  practicalProjects: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        connectionToCourse: z.string(),
        skills: z.array(z.string()),
      })
    )
    .min(1),
  freelanceIdeas: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string(),
        connectionToCourse: z.string(),
        targetClients: z.string(),
      })
    )
    .min(1),
  startupIdeas: z
    .array(
      z.object({
        title: z.string(),
        pitch: z.string(),
        connectionToCourse: z.string(),
        mvpScope: z.string(),
      })
    )
    .min(1),
  roadmapSteps: z.array(z.string()).min(2),
});

export async function courseToOpportunitiesWithAI(params: {
  institutionId: string;
  studentId: string;
  doc: CourseDocument;
  locale: Locale;
}): Promise<LaunchpadOpportunityPack> {
  const raw = await generateCompactText({
    systemInstruction:
      "You are the CampusMate Knowledge-to-Opportunity Engine. Transform the authorized university course content into 3 practical projects, 3 realistic freelance services, 3 lightweight startup hypotheses, and a skills roadmap. Every recommendation MUST explicitly explain its connection to the course. Do not invent earnings or market guarantees. Return valid JSON.",
    prompt: `Locale: ${params.locale}\nSubject: ${params.doc.subjectName}\nCourse Title: ${params.doc.title}\nExcerpt:\n${params.doc.extractedText.slice(0, 1800)}`,
    maxOutputTokens: 1100,
    jsonMode: true,
    temperature: 0.3,
  });

  const parsed = parseJsonSafe(raw, OpportunityPackSchema);
  const now = new Date().toISOString();

  if (parsed) {
    return {
      id: `lpack-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      courseDocumentId: params.doc.id,
      courseTitle: params.doc.title,
      subjectName: params.doc.subjectName,
      ...parsed,
      isDemoFallback: false,
      createdAt: now,
    };
  }

  const lower = `${params.doc.title} ${params.doc.subjectName} ${params.doc.extractedText}`.toLowerCase();
  const isDb = lower.includes("base") || lower.includes("sql") || lower.includes("postgres");
  const isElec = lower.includes("électr") || lower.includes("énerg");
  const isMgmt = lower.includes("gestion") || lower.includes("financ") || lower.includes("management");

  if (isDb) {
    return {
      id: `lpack-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      courseDocumentId: params.doc.id,
      courseTitle: params.doc.title,
      subjectName: params.doc.subjectName,
      reasoningSummary: `Analyse du cours « ${params.doc.title} » (${params.doc.subjectName}) : la normalisation 3NF, l'indexation et les politiques RLS permettent de concevoir des systèmes fiables multi-utilisateurs.`,
      practicalProjects: [
        {
          title: "Application de gestion de stock multi-dépôts",
          summary: "Suivi des entrées/sorties, alertes de seuil et historique auditable.",
          connectionToCourse: "Applique directement la normalisation 3NF et les contraintes relationnelles du cours.",
          skills: ["PostgreSQL", "Modélisation 3NF", "API CRUD"],
        },
        {
          title: "Portail de prise de rendez-vous & dossiers clients",
          summary: "Gestion sécurisée des créneaux et isolement par rôle utilisateur.",
          connectionToCourse: "Met en œuvre le contrôle d'accès par ligne (RLS) vu au chapitre 2.",
          skills: ["RLS", "Authentification", "Next.js"],
        },
        {
          title: "Moteur de recherche documentaire sémantique",
          summary: "Indexation de fiches techniques avec recherche par mots-clés et vecteurs.",
          connectionToCourse: "Prolonge la section pgvector (768 dimensions) du support de cours.",
          skills: ["pgvector", "Indexation", "TypeScript"],
        },
      ],
      freelanceIdeas: [
        {
          title: "Conception de schémas de bases de données & migration Excel → SQL",
          summary: "Nettoyage de fichiers tableurs dispersés vers une base relationnelle structurée.",
          connectionToCourse: "Exploite la suppression des anomalies de mise à jour (3NF).",
          targetClients: "PME locales, librairies, cabinets médicaux",
        },
        {
          title: "Création de tableaux de bord de reporting SQL",
          summary: "Vues synthétiques des ventes, stocks et échéances sur interface web.",
          connectionToCourse: "Utilise les requêtes d'agrégation et l'indexation PostgreSQL.",
          targetClients: "Commerces et associations étudiantes",
        },
        {
          title: "Audit de sécurité et droits d'accès base de données",
          summary: "Vérification des rôles et cloisonnement des données sensibles.",
          connectionToCourse: "Directement lié aux politiques Row Level Security du cours.",
          targetClients: "Startups en phase prototype",
        },
      ],
      startupIdeas: [
        {
          title: "StockPulse TN — SaaS de gestion de stock pour petits commerces",
          pitch: "Outil web léger remplaçant les cahiers papier avec alertes de rupture.",
          connectionToCourse: "Architecture multi-tenant isolée par tenant_id et RLS PostgreSQL.",
          mvpScope: "Catalogue, mouvements entrée/sortie, alerte seuil, export PDF.",
        },
        {
          title: "DocuVault Campus — Archivage structuré pour clubs et PME",
          pitch: "Recherche instantanée dans les factures et procès-verbaux.",
          connectionToCourse: "Combine tables relationnelles et recherche vectorielle pgvector.",
          mvpScope: "Upload PDF, métadonnées, recherche plein texte.",
        },
        {
          title: "QueueLite — Gestion de rendez-vous pour cliniques & services",
          pitch: "Réservation de créneaux sans conflit avec suivi de file.",
          connectionToCourse: "Transactions SQL et contraintes d'unicité temporelle.",
          mvpScope: "Prise de ticket, vue guichet, notification statut.",
        },
      ],
      roadmapSteps: [
        "Maîtriser les requêtes CRUD et migrations SQL",
        "Ajouter une API typée (Next.js + Zod) et authentification",
        "Déployer un prototype avec données réelles anonymisées",
        "Tester auprès de 5 utilisateurs locaux pour valider le besoin",
      ],
      isDemoFallback: true,
      createdAt: now,
    };
  }

  if (isElec) {
    return {
      id: `lpack-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      courseDocumentId: params.doc.id,
      courseTitle: params.doc.title,
      subjectName: params.doc.subjectName,
      reasoningSummary: `Analyse du cours « ${params.doc.title} » : les notions de mesure, rendement et bilan énergétique s'appliquent directement au suivi de consommation.`,
      practicalProjects: [
        {
          title: "Tableau de bord simulé de suivi de consommation énergétique",
          summary: "Visualisation horaire des pics de charge et calcul du coût estimé.",
          connectionToCourse: "Utilise les formules de puissance active/réactive du cours.",
          skills: ["Analyse énergétique", "Visualisation de données", "Tableur / Web"],
        },
        {
          title: "Calculateur de dimensionnement solaire autonome",
          summary: "Estimation du nombre de panneaux et batteries selon les besoins d'un local.",
          connectionToCourse: "Applique les bilans énergétiques étudiés en séance.",
          skills: ["Dimensionnement PV", "Modélisation", "Documentation"],
        },
        {
          title: "Simulateur d'optimisation tarifaire pour atelier",
          summary: "Identification des équipements énergivores et décalage hors heures pleines.",
          connectionToCourse: "Relié à l'étude des charges et facteurs de puissance.",
          skills: ["Efficacité énergétique", "Reporting"],
        },
      ],
      freelanceIdeas: [
        {
          title: "Analyse & reporting de factures d'électricité pour PME",
          summary: "Synthèse visuelle des dérives de consommation et recommandations simples.",
          connectionToCourse: "Exploite la lecture des profils de charge du cours.",
          targetClients: "Petits ateliers, cafés, bureaux",
        },
        {
          title: "Pré-étude technique d'installation photovoltaïque",
          summary: "Dossier comparatif clair avant passage d'un installateur agréé.",
          connectionToCourse: "Basé sur les calculs de rendement du support.",
          targetClients: "Particuliers et petites exploitations agricoles",
        },
        {
          title: "Rédaction de schémas et fiches de maintenance préventive",
          summary: "Documentation claire des armoires et points de contrôle.",
          connectionToCourse: "Normes et sécurité électrique vues en TP.",
          targetClients: "Techniciens et ateliers locaux",
        },
      ],
      startupIdeas: [
        {
          title: "WattClair — Logiciel d'efficacité énergétique pour PME",
          pitch: "Importez vos relevés mensuels et identifiez les postes de gaspillage.",
          connectionToCourse: "Automatise les bilans de puissance et alertes de dépassement.",
          mvpScope: "Import CSV/relevés, graphiques, rapport PDF mensuel.",
        },
        {
          title: "SolarSim TN — Aide à la décision solaire pour exploitations",
          pitch: "Simulation pédagogique claire du retour sur équipement.",
          connectionToCourse: "Modèles d'ensoleillement et rendement étudiés en cours.",
          mvpScope: "Formulaire besoins, simulation graphique, export fiche.",
        },
        {
          title: "MaintCheck — Carnet numérique de contrôle électrique",
          pitch: "Suivi des vérifications périodiques et conformité sécurité.",
          connectionToCourse: "Checklists issues des normes de sécurité du cours.",
          mvpScope: "Inventaire équipements, checklists, alertes échéance.",
        },
      ],
      roadmapSteps: [
        "Créer un jeu de données simulé réaliste",
        "Construire les graphiques de consommation et indicateurs",
        "Rédiger une note méthodologique claire",
        "Présenter le prototype à un enseignant pour validation technique",
      ],
      isDemoFallback: true,
      createdAt: now,
    };
  }

  if (isMgmt) {
    return {
      id: `lpack-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      courseDocumentId: params.doc.id,
      courseTitle: params.doc.title,
      subjectName: params.doc.subjectName,
      reasoningSummary: `Analyse du cours « ${params.doc.title} » : les outils de pilotage financier et d'organisation répondent à un besoin fort des très petites entreprises.`,
      practicalProjects: [
        {
          title: "Tableau de bord de trésorerie pour TPE fictive",
          summary: "Suivi mensuel des encaissements, charges fixes et seuil de rentabilité.",
          connectionToCourse: "Applique les indicateurs de marge et trésorerie du cours.",
          skills: ["Planification financière", "Tableurs avancés", "Synthèse"],
        },
        {
          title: "Kit d'organisation des processus d'une association étudiante",
          summary: "Modèles de budget événementiel et suivi des tâches.",
          connectionToCourse: "Met en pratique la gestion budgétaire et opérationnelle.",
          skills: ["Gestion de projet", "Budgétisation"],
        },
        {
          title: "Étude de faisabilité comparative de 2 lancements produits",
          summary: "Matrice coûts/risques et plan d'action sur 90 jours.",
          connectionToCourse: "Directement lié aux méthodes d'analyse stratégique du cours.",
          skills: ["Analyse stratégique", "Présentation"],
        },
      ],
      freelanceIdeas: [
        {
          title: "Structuration de tableurs de suivi commercial & budget",
          summary: "Modèles automatisés prêts à l'emploi pour gérants non-financiers.",
          connectionToCourse: "Traduit les formules de gestion du cours en outils simples.",
          targetClients: "Auto-entrepreneurs, artisans, associations",
        },
        {
          title: "Rédaction de plans d'action & dossiers de présentation",
          summary: "Mise en forme structurée d'offres et synthèses de projet.",
          connectionToCourse: "Exploite la méthodologie business apprise en cours.",
          targetClients: "Porteurs de projets étudiants et TPE",
        },
        {
          title: "Optimisation de flux administratifs internes",
          summary: "Cartographie simple des tâches répétitives et checklists.",
          connectionToCourse: "Outils d'organisation étudiés en management.",
          targetClients: "Petits cabinets et commerces",
        },
      ],
      startupIdeas: [
        {
          title: "GestioFacile — Plateforme de pilotage simple pour TPE",
          pitch: "Suivi des devis, dépenses et échéances sans jargon comptable complexe.",
          connectionToCourse: "Repose sur les indicateurs essentiels de gestion vus en cours.",
          mvpScope: "Tableau dépenses/recettes, alertes échéances, export mensuel.",
        },
        {
          title: "AssoPilot — Outil de gestion pour clubs universitaires",
          pitch: "Centralise budgets, membres et bilans d'événements.",
          connectionToCourse: "Applique la gestion de projet et transparence budgétaire.",
          mvpScope: "Budget par événement, liste tâches, bilan PDF.",
        },
        {
          title: "CahierClair — Assistant de pré-lancement pour jeunes créateurs",
          pitch: "Guide pas à pas pour estimer coûts de départ et point mort.",
          connectionToCourse: "Automatise le calcul du seuil de rentabilité du cours.",
          mvpScope: "Simulateur coûts, canvas, checklist validation.",
        },
      ],
      roadmapSteps: [
        "Valider les formules de gestion sur un cas concret",
        "Tester le modèle auprès d'un club ou commerce pilote",
        "Simplifier l'interface pour des utilisateurs non spécialistes",
      ],
      isDemoFallback: true,
      createdAt: now,
    };
  }

  return {
    id: `lpack-${crypto.randomUUID()}`,
    institutionId: params.institutionId,
    studentId: params.studentId,
    courseDocumentId: params.doc.id,
    courseTitle: params.doc.title,
    subjectName: params.doc.subjectName,
    reasoningSummary: `Analyse du cours « ${params.doc.title} » (${params.doc.subjectName}) : transformation des concepts clés en projets appliqués, services et pistes d'innovation.`,
    practicalProjects: [
      {
        title: `Prototype Web appliqué — ${params.doc.subjectName}`,
        summary: "Mise en pratique des principes de sécurité, architecture et validation vus dans le support.",
        connectionToCourse: `Directement tiré de « ${params.doc.title} ».`,
        skills: ["Architecture Web", "Validation Zod", "UI Responsive"],
      },
      {
        title: "Mini-portail multi-tenant sécurisé",
        summary: "Application cloisonnée par institution avec gestion de rôles.",
        connectionToCourse: "Applique les bonnes pratiques d'isolation et API typées du cours.",
        skills: ["TypeScript", "API Routes", "Sécurité"],
      },
      {
        title: "Tableau de bord de suivi pédagogique",
        summary: "Visualisation de progression par chapitre et exercices pratiques.",
        connectionToCourse: "Valorise les notions de composants serveur et performance.",
        skills: ["React", "Next.js", "UX"],
      },
    ],
    freelanceIdeas: [
      {
        title: "Développement de sites vitrines & portails modernes Next.js",
        summary: "Création de sites rapides, accessibles et bien référencés pour acteurs locaux.",
        connectionToCourse: "Exploite le rendu serveur (SSR) et SEO présentés au chapitre 1.",
        targetClients: "PME, cabinets, associations locales",
      },
      {
        title: "Développement d'API sécurisées & validation de formulaires",
        summary: "Fiabilisation de backends web avec schémas stricts.",
        connectionToCourse: "Basé sur les bonnes pratiques API et Zod du cours.",
        targetClients: "Équipes produit et startups étudiantes",
      },
      {
        title: "Audit UX & accessibilité d'applications web existantes",
        summary: "Amélioration de la lisibilité mobile, contrastes et navigation.",
        connectionToCourse: "Prolonge les principes d'architecture frontend moderne.",
        targetClients: "Organisations locales",
      },
    ],
    startupIdeas: [
      {
        title: "CampusFlow — Outil d'organisation collaborative pour équipes étudiantes",
        pitch: "Centralise tâches, documents et suivi d'avancement sans complexité.",
        connectionToCourse: "Architecture modulaire Next.js + isolation par espace.",
        mvpScope: "Espace projet, liste de tâches, partage de notes.",
      },
      {
        title: "LocalVitrine — Créateur de pages pro accessibles pour artisans",
        pitch: "Génération rapide de pages web propres et rapides pour commerces locaux.",
        connectionToCourse: "SSR optimisé SEO et formulaires sécurisés vus en cours.",
        mvpScope: "3 modèles de pages, formulaire contact, export.",
      },
      {
        title: "DocuCheck — Vérificateur de conformité de dossiers étudiants",
        pitch: "Checklist interactive évitant les dossiers incomplets.",
        connectionToCourse: "Validation stricte de schémas et UX claire.",
        mvpScope: "Modèles de dossiers, progression, export récapitulatif.",
      },
    ],
    roadmapSteps: [
      "Revoir les concepts clés du chapitre et isoler 1 problème concret",
      "Construire un prototype minimal en 14 jours",
      "Publier le résultat dans votre Portfolio Launchpad et CV",
    ],
    isDemoFallback: true,
    createdAt: now,
  };
}

const StartupIdeaSchema = z.object({
  ideas: z
    .array(
      z.object({
        name: z.string(),
        shortPitch: z.string(),
        problemStatement: z.string(),
        proposedSolution: z.string(),
        targetCustomers: z.array(z.string()).min(1),
        academicKnowledgeUsed: z.array(z.string()).min(1),
        requiredTechnicalSkills: z.array(z.string()).min(1),
        requiredBusinessSkills: z.array(z.string()).min(1),
        existingCapabilities: z.array(z.string()),
        missingCapabilities: z.array(z.string()),
        valueProposition: z.string(),
        businessModel: z.string(),
        revenueStreams: z.array(z.string()).min(1),
        mvpFeatures: z.array(z.string()).min(2),
        technicalRequirements: z.array(z.string()).min(1),
        effortEstimate: z.string(),
        resourceRequirements: z.array(z.string()).min(1),
        validationPlan: z.array(z.string()).min(2),
        risksAndAssumptions: z.array(z.string()).min(1),
        suggestedTeam: z.array(z.string()).min(1),
        initialRoadmap: z.array(z.string()).min(2),
      })
    )
    .min(1),
});

export async function generateStartupIdeasWithAI(params: {
  institutionId: string;
  studentId: string;
  mode: "knowledge" | "course" | "custom";
  specialization: string;
  skills: string[];
  courseTitle?: string;
  customPrompt?: string;
  industry?: string;
  budgetConstraint?: string;
  locale: Locale;
}): Promise<{ ideas: LaunchpadStartupIdea[]; isDemoFallback: boolean }> {
  const raw = await generateCompactText({
    systemInstruction:
      "You are CampusMate Startup Ideation Advisor. Generate realistic, resource-lean startup hypotheses grounded in the student's academic skills and courses. Never fabricate market research, competitor stats, or guaranteed revenue. Return valid JSON { ideas: [...] } with 2 concise ideas.",
    prompt: `Locale: ${params.locale}\nMode: ${params.mode}\nSpecialization: ${params.specialization}\nSkills: ${params.skills.join(", ")}\nCourse: ${params.courseTitle || "N/A"}\nCustom Idea/Problem: ${params.customPrompt || "N/A"}\nIndustry: ${params.industry || "General"}\nBudget: ${params.budgetConstraint || "Student / zero-budget"}`,
    maxOutputTokens: 1300,
    jsonMode: true,
    temperature: 0.35,
  });

  const parsed = parseJsonSafe(raw, StartupIdeaSchema);
  const now = new Date().toISOString();
  const disclaimer =
    "Hypothèse entrepreneuriale générée par IA nécessitant une validation terrain. Aucun chiffre de marché ou revenu n'est garanti.";

  if (parsed) {
    return {
      isDemoFallback: false,
      ideas: parsed.ideas.map((idea) => ({
        id: `lst-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        mode: params.mode,
        sourceCourseTitle: params.courseTitle,
        ...idea,
        hypothesisDisclaimer: disclaimer,
        feasibility: computeHeuristicFeasibility({
          existingCount: idea.existingCapabilities.length,
          missingCount: idea.missingCapabilities.length,
          mvpFeatureCount: idea.mvpFeatures.length,
        }),
        saved: false,
        createdAt: now,
      })),
    };
  }

  const baseTopic = params.customPrompt?.trim() || params.courseTitle || params.specialization;
  const fallbackIdea: LaunchpadStartupIdea = {
    id: `lst-${crypto.randomUUID()}`,
    institutionId: params.institutionId,
    studentId: params.studentId,
    mode: params.mode,
    sourceCourseTitle: params.courseTitle,
    name: params.mode === "custom" ? `Projet ${baseTopic.slice(0, 28)}` : "CampusBridge Local",
    shortPitch: `Solution numérique légère s'appuyant sur ${baseTopic} pour résoudre un besoin concret de proximité.`,
    problemStatement: `Les acteurs locaux et étudiants manquent d'un outil simple adapté au contexte autour de « ${baseTopic} ».`,
    proposedSolution: "Un MVP web focalisé sur une tâche critique, testable gratuitement avec un premier groupe pilote.",
    targetCustomers: ["PME locales", "Associations et étudiants"],
    academicKnowledgeUsed: params.skills.length > 0 ? params.skills.slice(0, 4) : [params.specialization],
    requiredTechnicalSkills: ["Développement Web", "Base de données", "Tests"],
    requiredBusinessSkills: ["Entretiens utilisateurs", "Modèle économique simple"],
    existingCapabilities: params.skills.slice(0, 3),
    missingCapabilities: ["Validation terrain auprès de 5 utilisateurs"],
    valueProposition: "Simple à prendre en main, rapide à déployer et adapté aux contraintes locales.",
    businessModel: "Pilote gratuit puis abonnement mensuel accessible (hypothèse à valider).",
    revenueStreams: ["Abonnement mensuel léger (hypothèse)", "Service de mise en place"],
    mvpFeatures: ["Inscription & espace sécurisé", "Workflow principal unique", "Export récapitulatif"],
    technicalRequirements: ["Frontend responsive", "Base PostgreSQL / RLS", "Hébergement cloud gratuit"],
    effortEstimate: "30 jours (MVP étudiant)",
    resourceRequirements: ["Binôme technique + gestion", "0 TND de coût matériel initial"],
    validationPlan: ["Réaliser 5 entretiens exploratoires", "Tester une maquette cliquable avant le développement complet"],
    risksAndAssumptions: ["Hypothèse : le problème est assez fréquent pour justifier l'adoption d'un nouvel outil."],
    suggestedTeam: ["Développement Full-Stack", "UI/UX & Validation client"],
    initialRoadmap: ["J1-J7 : Entretiens & maquette", "J8-J21 : MVP", "J22-J30 : Pilote & ajustements"],
    hypothesisDisclaimer: disclaimer,
    feasibility: computeHeuristicFeasibility({
      existingCount: Math.max(1, params.skills.length),
      missingCount: 1,
      mvpFeatureCount: 3,
    }),
    saved: false,
    createdAt: now,
  };

  return { isDemoFallback: true, ideas: [fallbackIdea] };
}

export function computeHeuristicFeasibility(params: {
  existingCount: number;
  missingCount: number;
  mvpFeatureCount: number;
}): NonNullable<LaunchpadStartupIdea["feasibility"]> {
  const alignment = Math.min(92, 60 + params.existingCount * 8);
  const mvpEase = params.mvpFeatureCount <= 4 ? 82 : 68;
  const readiness = Math.max(45, 80 - params.missingCount * 10);
  const validation = 45;
  const overallScore = Math.round((alignment + mvpEase + readiness + validation) / 4);

  return {
    overallScore,
    factors: [
      {
        name: "Alignement compétences académiques",
        score: alignment,
        explanation: `${params.existingCount} compétence(s) déjà identifiée(s) dans votre parcours.`,
      },
      {
        name: "Simplicité du MVP",
        score: mvpEase,
        explanation: `${params.mvpFeatureCount} fonctionnalités clés ciblées pour un lancement réaliste.`,
      },
      {
        name: "Capacité de réalisation",
        score: readiness,
        explanation: `${params.missingCount} compétence(s) complémentaire(s) à acquérir ou recruter en équipe.`,
      },
      {
        name: "Maturité de validation terrain",
        score: validation,
        explanation: "À renforcer par des entretiens utilisateurs réels avant investissement.",
      },
    ],
    recommendedNextStep:
      "Validez le problème auprès de 5 utilisateurs potentiels puis construisez un prototype sur 14 jours.",
    methodologyNote:
      "Score heuristique interne transparent (moyenne pondérée alignement, taille MVP, écart de compétences, validation) — ne constitue pas une prédiction de succès.",
  };
}

export async function generateFreelanceIdeasWithAI(params: {
  institutionId: string;
  studentId: string;
  specialization: string;
  skills: string[];
  interests: string[];
  locale: Locale;
}): Promise<{ ideas: LaunchpadFreelanceIdea[]; isDemoFallback: boolean }> {
  const now = new Date().toISOString();
  const skillsLower = params.skills.join(" ").toLowerCase();

  const ideas: LaunchpadFreelanceIdea[] = [
    {
      id: `lfr-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      serviceTitle:
        skillsLower.includes("web") || skillsLower.includes("react")
          ? "Création de Sites Vitrines & Portails Web Modernes"
          : `Assistance Technique & Digitalisation (${params.specialization})`,
      description:
        "Conception d'interfaces claires, rapides et adaptées mobile pour aider les structures locales à structurer leur présence ou leurs outils internes.",
      relatedSubjects: [params.specialization, "Développement Web / Projets"],
      requiredSkills: ["HTML/CSS/React", "Ergonomie mobile", "Communication client"],
      possessedSkills: params.skills.slice(0, 3),
      missingSkills: ["Cadrage du cahier des charges"],
      difficulty: "beginner",
      targetClients: ["PME locales", "Associations", "Indépendants"],
      deliverables: ["Maquette validée", "Site/outil fonctionnel", "Documentation de prise en main"],
      portfolioProjectIdea: "Refonte complète d'un portail associatif ou catalogue local",
      toolsToLearn: ["Next.js", "Tailwind CSS", "Figma"],
      nextSteps: ["Créer 1 projet démo dans le Portfolio", "Préparer un modèle de proposition"],
      illustrativeQuoteNote:
        "Note pédagogique : aucun tarif ou revenu n'est garanti. Définissez toujours le périmètre, les livrables et les délais par écrit, dans le respect des règles d'éligibilité applicables.",
      prepKit: {
        serviceDescription:
          "Service de conception et mise en ligne d'un site web clair, rapide et responsive, incluant formulaire de contact sécurisé et formation de prise en main.",
        proposalTemplate:
          "1. Contexte & besoin | 2. Livrables inclus | 3. Planning estimatif (2 semaines) | 4. Hypothèses & prérequis client | 5. Conditions de révision.",
        deliveryChecklist: [
          "Valider le cahier des charges écrit",
          "Tester sur mobile (360px) et desktop",
          "Vérifier sécurité des formulaires et liens",
          "Fournir un guide d'utilisation PDF",
        ],
        mockInterviewQuestions: [
          "Comment gérez-vous une demande de modification hors périmètre initial ?",
          "Quelles informations vous faut-il avant de démarrer ?",
          "Comment garantissez-vous que le site reste facile à mettre à jour ?",
        ],
      },
      saved: false,
      createdAt: now,
    },
    {
      id: `lfr-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      serviceTitle: "Structuration de Données, Tableaux de Bord & Automatisation",
      description:
        "Transformation de fichiers dispersés en bases structurées ou tableaux de bord décisionnels faciles à lire.",
      relatedSubjects: ["Bases de Données", "Analyse & Gestion"],
      requiredSkills: ["Modélisation SQL / Tableurs", "Nettoyage de données", "Visualisation"],
      possessedSkills: params.skills.slice(0, 2),
      missingSkills: ["Présentation de métriques aux non-techniciens"],
      difficulty: "intermediate",
      targetClients: ["Commerces", "Cabinets", "Clubs universitaires"],
      deliverables: ["Base nettoyée", "Tableau de bord indicateurs", "Guide de saisie"],
      portfolioProjectIdea: "Tableau de bord de suivi de stock et ventes sur données simulées",
      toolsToLearn: ["PostgreSQL", "Recharts", "Excel / Sheets"],
      nextSteps: ["Construire un exemple anonymisé", "Pratiquer l'entretien client simulé"],
      illustrativeQuoteNote:
        "Estimation purement illustrative à usage éducatif — adaptez chaque proposition selon la complexité réelle.",
      saved: false,
      createdAt: now,
    },
  ];

  return { ideas, isDemoFallback: true };
}

export function buildBusinessCanvasFromIdea(params: {
  institutionId: string;
  studentId: string;
  idea?: LaunchpadStartupIdea;
  title?: string;
}): LaunchpadBusinessCanvas {
  const now = new Date().toISOString();
  const idea = params.idea;
  return {
    id: `lcv-${crypto.randomUUID()}`,
    institutionId: params.institutionId,
    studentId: params.studentId,
    startupIdeaId: idea?.id,
    title: params.title || (idea ? `${idea.name} — Business Model Canvas` : "Nouveau Business Model Canvas"),
    version: 1,
    customerSegments: idea?.targetCustomers.join(", ") || "À préciser : segments clients prioritaires.",
    valuePropositions: idea?.valueProposition || "À préciser : problème résolu et bénéfice concret.",
    channels: "Canaux directs campus/local, démonstrations, bouche-à-oreille.",
    customerRelationships: "Accompagnement personnalisé lors de la phase pilote.",
    revenueStreams: idea?.revenueStreams.join(" • ") || "Hypothèse à valider : abonnement ou prestation.",
    keyResources: idea?.academicKnowledgeUsed.join(", ") || "Compétences académiques de l'équipe.",
    keyActivities: idea?.mvpFeatures.join(", ") || "Conception MVP, entretiens terrain, itérations.",
    keyPartnerships: "Clubs universitaires, mentors académiques, utilisateurs pilotes.",
    costStructure: "Temps étudiant, hébergement cloud gratuit/modéré, coûts de validation terrain.",
    validatedFacts: ["Basé sur les compétences acquises à l'université."],
    assumptions: idea?.risksAndAssumptions || ["Hypothèse de valeur à tester auprès de 5 utilisateurs."],
    updatedAt: now,
    createdAt: now,
  };
}

export function buildRoadmapForProjectOrStartup(params: {
  institutionId: string;
  studentId: string;
  title: string;
  horizon: LaunchpadRoadmap["horizon"];
  projectId?: string;
  startupIdeaId?: string;
  skills: string[];
}): LaunchpadRoadmap {
  const now = new Date().toISOString();
  const baseDate = new Date();
  const addDays = (d: number) => {
    const dt = new Date(baseDate);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };
  const scale = params.horizon === "7d" ? 0.25 : params.horizon === "14d" ? 0.5 : params.horizon === "90d" ? 3 : 1;

  return {
    id: `lrm-${crypto.randomUUID()}`,
    institutionId: params.institutionId,
    studentId: params.studentId,
    projectId: params.projectId,
    startupIdeaId: params.startupIdeaId,
    title: params.title,
    horizon: params.horizon,
    objectives: [
      "Valider le problème auprès d'utilisateurs pilotes",
      "Construire un MVP sobre et testable",
      "Préparer une démonstration claire pour le portfolio et le jury",
    ],
    requiredSkills: params.skills.length > 0 ? params.skills : ["Conception", "Développement", "Présentation"],
    mvpScope: "Fonctionnalité centrale unique sans sur-ingénierie.",
    tasks: [
      {
        id: `lrt-${crypto.randomUUID()}`,
        title: "Formuler l'hypothèse problème & mener 3-5 entretiens",
        phase: "validation",
        priority: "high",
        dueDate: addDays(Math.max(2, Math.round(4 * scale))),
        completed: false,
      },
      {
        id: `lrt-${crypto.randomUUID()}`,
        title: "Dessiner les écrans clés et le modèle de données",
        phase: "design",
        priority: "high",
        dueDate: addDays(Math.max(4, Math.round(9 * scale))),
        completed: false,
      },
      {
        id: `lrt-${crypto.randomUUID()}`,
        title: "Développer le cœur du MVP (workflow principal)",
        phase: "development",
        priority: "high",
        dueDate: addDays(Math.max(5, Math.round(18 * scale))),
        completed: false,
      },
      {
        id: `lrt-${crypto.randomUUID()}`,
        title: "Tester les cas limites et la sécurité d'accès",
        phase: "testing",
        priority: "medium",
        dueDate: addDays(Math.max(6, Math.round(24 * scale))),
        completed: false,
      },
      {
        id: `lrt-${crypto.randomUUID()}`,
        title: "Rédiger le pitch et ajouter le projet au Portfolio / CV",
        phase: "pitch",
        priority: "medium",
        dueDate: addDays(Math.max(7, Math.round(30 * scale))),
        completed: false,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function buildPracticalProjectFromInput(params: {
  institutionId: string;
  ownerId: string;
  ownerName: string;
  subjectName: string;
  difficulty: LaunchpadProject["difficulty"];
  interests: string;
  skills: string[];
}): LaunchpadProject {
  const now = new Date().toISOString();
  return {
    id: `lpr-${crypto.randomUUID()}`,
    institutionId: params.institutionId,
    ownerId: params.ownerId,
    ownerName: params.ownerName,
    title: `Projet Appliqué — ${params.subjectName}${params.interests ? ` (${params.interests})` : ""}`,
    problemSolved: `Mettre en pratique les notions de « ${params.subjectName} » sur un cas concret réel.`,
    subjectName: params.subjectName,
    difficulty: params.difficulty,
    objectives: [
      "Relier la théorie du cours à un livrable vérifiable",
      "Structurer le code, la documentation et les tests",
      "Valoriser le projet dans votre Portfolio et CV CampusMate",
    ],
    requirements: ["Architecture claire", "Validation des entrées", "Démonstration reproductible"],
    technologies: params.skills.length > 0 ? params.skills.slice(0, 4) : ["Next.js", "TypeScript", "PostgreSQL"],
    deliverables: ["Dépôt de code ou documentation", "Captures d'écran", "Note de réflexion personnelle"],
    evaluationCriteria: ["Pertinence par rapport au problème", "Qualité technique", "Clarté de la démonstration"],
    courseReferences: [params.subjectName],
    skillsDeveloped: params.skills.slice(0, 4),
    status: "planning",
    progress: 10,
    attachments: [],
    tasks: [
      { id: `lpt-${crypto.randomUUID()}`, title: "Définir le périmètre minimal et les données d'exemple", completed: false },
      { id: `lpt-${crypto.randomUUID()}`, title: "Implémenter la fonctionnalité principale", completed: false },
      { id: `lpt-${crypto.randomUUID()}`, title: "Tester, documenter et publier dans le portfolio", completed: false },
    ],
    isPrivate: true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function generatePitchWithAI(params: {
  institutionId: string;
  studentId: string;
  title: string;
  problem: string;
  solution: string;
  targetCustomers: string;
  completedMilestones: string[];
  plannedMilestones: string[];
  locale: Locale;
}): Promise<{ pitch: LaunchpadPitch; isDemoFallback: boolean }> {
  const now = new Date().toISOString();
  const completedText = params.completedMilestones.length > 0 ? params.completedMilestones.join(", ") : "Phase de conception initiale";
  const plannedText = params.plannedMilestones.length > 0 ? params.plannedMilestones.join(", ") : "Tests pilotes auprès des premiers utilisateurs";

  if (params.locale === "en") {
    return {
      isDemoFallback: true,
      pitch: {
        id: `lpi-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        startupOrProjectTitle: params.title,
        locale: "en",
        elevatorPitch: `${params.title} turns university knowledge into a practical solution for ${params.targetCustomers}: ${params.solution}.`,
        pitch30s: `At university, we noticed ${params.problem}. With ${params.title}, we help ${params.targetCustomers} solve this through ${params.solution}. So far we completed: ${completedText}.`,
        pitch1m: `Problem: ${params.problem}\nSolution: ${params.solution}\nTarget: ${params.targetCustomers}\nCompleted so far: ${completedText}\nNext planned steps: ${plannedText}.`,
        pitch3m: `Project: ${params.title}\n1. Hook & Problem: ${params.problem}\n2. Academic Grounding & Solution: ${params.solution}\n3. Target Users: ${params.targetCustomers}\n4. Current Progress (Completed): ${completedText}\n5. Validation Roadmap (Planned): ${plannedText}\n6. Ask: Feedback and pilot user introductions.`,
        executiveSummary: `${params.title} addresses ${params.problem} for ${params.targetCustomers} via ${params.solution}.`,
        problemSolution: `Problem: ${params.problem} → Solution: ${params.solution}`,
        valueProposition: `Practical, low-cost solution grounded in academic skills.`,
        deckOutline: [
          "1. Title & University Context",
          "2. Observed Problem",
          "3. Proposed Solution & Demo",
          "4. Target Users & Value Proposition",
          "5. Current Prototype Progress vs Planned Roadmap",
          "6. Team & Next Validation Steps",
        ],
        juryQuestions: [
          {
            question: "What have you already validated vs what is still an assumption?",
            suggestedAnswer: `Completed: ${completedText}. Planned validation: ${plannedText}.`,
          },
          {
            question: "How does your university coursework support this project?",
            suggestedAnswer: "Our technical architecture and methodology directly apply our academic modules.",
          },
        ],
        completedVsPlannedNote: `Réalisé : ${completedText} | Planifié : ${plannedText}`,
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  if (params.locale === "ar") {
    return {
      isDemoFallback: true,
      pitch: {
        id: `lpi-${crypto.randomUUID()}`,
        institutionId: params.institutionId,
        studentId: params.studentId,
        startupOrProjectTitle: params.title,
        locale: "ar",
        elevatorPitch: `مشروع ${params.title} يحوّل المعارف الجامعية إلى حل عملي لفائدة ${params.targetCustomers}: ${params.solution}.`,
        pitch30s: `لاحظنا إشكالية: ${params.problem}. يقدم مشروع ${params.title} حلاً عملياً عبر ${params.solution}. ما تم إنجازه: ${completedText}.`,
        pitch1m: `المشكلة: ${params.problem}\nالحل: ${params.solution}\nالفئة المستهدفة: ${params.targetCustomers}\nالإنجازات الحالية: ${completedText}\nالخطوات المخططة: ${plannedText}.`,
        pitch3m: `المشروع: ${params.title}\n1. المشكلة الملاحظة: ${params.problem}\n2. الحل المقترح: ${params.solution}\n3. المستفيدون: ${params.targetCustomers}\n4. الإنجاز الفعلي: ${completedText}\n5. خارطة التحقق المخططة: ${plannedText}.`,
        executiveSummary: `ملخص تنفيذي لمشروع ${params.title} الموجه نحو ${params.targetCustomers}.`,
        problemSolution: `المشكلة: ${params.problem} ← الحل: ${params.solution}`,
        valueProposition: "حل عملي مبني على الكفاءات الجامعية بتكلفة منخفضة.",
        deckOutline: [
          "1. العنوان والسياق الجامعي",
          "2. المشكلة الميدانية",
          "3. الحل والنموذج الأولي",
          "4. الفئة المستهدفة والقيمة المضافة",
          "5. ما تم إنجازه مقابل المخطط",
          "6. الفريق والخطوات القادمة",
        ],
        juryQuestions: [
          {
            question: "ما الذي تم إنجازه فعلياً وما هي الفرضيات التي تحتاج للتحقق؟",
            suggestedAnswer: `المنجز: ${completedText}. المخطط للتحقق: ${plannedText}.`,
          },
        ],
        completedVsPlannedNote: `منجز: ${completedText} | مخطط: ${plannedText}`,
        createdAt: now,
        updatedAt: now,
      },
    };
  }

  return {
    isDemoFallback: true,
    pitch: {
      id: `lpi-${crypto.randomUUID()}`,
      institutionId: params.institutionId,
      studentId: params.studentId,
      startupOrProjectTitle: params.title,
      locale: "fr",
      elevatorPitch: `${params.title} transforme les acquis universitaires en une solution concrète pour ${params.targetCustomers} : ${params.solution}.`,
      pitch30s: `Sur le terrain, nous avons constaté que ${params.problem}. Avec ${params.title}, nous proposons à ${params.targetCustomers} : ${params.solution}. À ce stade, nous avons réalisé : ${completedText}.`,
      pitch1m: `Problème : ${params.problem}\nSolution : ${params.solution}\nCible : ${params.targetCustomers}\nRéalisations effectives : ${completedText}\nProchaines étapes planifiées : ${plannedText}.`,
      pitch3m: `Projet : ${params.title}\n1. Accroche & Problème : ${params.problem}\n2. Solution ancrée dans nos cours : ${params.solution}\n3. Utilisateurs cibles : ${params.targetCustomers}\n4. Avancement réel (réalisé) : ${completedText}\n5. Plan de validation terrain (planifié) : ${plannedText}\n6. Besoin : retours du jury et mise en relation avec des utilisateurs pilotes.`,
      executiveSummary: `${params.title} répond à la problématique « ${params.problem} » pour ${params.targetCustomers} grâce à ${params.solution}.`,
      problemSolution: `Problème : ${params.problem} → Solution : ${params.solution}`,
      valueProposition: "Solution sobre, accessible et directement issue des compétences développées à l'ISET.",
      deckOutline: [
        "1. Titre & Ancrage Universitaire",
        "2. Problème observé sur le terrain",
        "3. Solution proposée & Démonstration",
        "4. Cible & Proposition de valeur",
        "5. Réalisé vs Planifié (honnêteté projet)",
        "6. Équipe & Prochaines étapes de validation",
      ],
      juryQuestions: [
        {
          question: "Qu'est-ce qui est déjà réalisé par rapport à ce qui reste une hypothèse ?",
          suggestedAnswer: `Déjà réalisé : ${completedText}. Étapes planifiées pour valider nos hypothèses : ${plannedText}.`,
        },
        {
          question: "Comment vos cours universitaires vous ont-ils permis de bâtir ce projet ?",
          suggestedAnswer: "L'architecture, la méthode et les livrables appliquent directement nos modules académiques.",
        },
      ],
      completedVsPlannedNote: `Réalisé : ${completedText} | Planifié : ${plannedText}`,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export interface GeneratedSocialPost {
  platform: "linkedin" | "instagram" | "facebook";
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
}

const SocialPostSchema = z.object({
  posts: z.array(
    z.object({
      platform: z.enum(["linkedin", "instagram", "facebook"]),
      headline: z.string(),
      body: z.string(),
      hashtags: z.array(z.string()),
      callToAction: z.string(),
    })
  ),
});

export async function generateSocialPostsWithAI(params: {
  idea: string;
  attachedTitle?: string;
  attachedType?: "project" | "certificate" | "stage" | "upload";
  platforms: Array<"linkedin" | "instagram" | "facebook">;
  studentName: string;
  specialization: string;
  locale: Locale;
}): Promise<{ posts: GeneratedSocialPost[]; isDemoFallback: boolean }> {
  const attachmentContext = params.attachedTitle
    ? `Attached ${params.attachedType || "item"}: ${params.attachedTitle}`
    : "No attachment";

  const raw = await generateCompactText({
    systemInstruction:
      "You are CampusMate AI Social Post Writer. Write authentic, engaging social media posts tailored to each selected platform (LinkedIn: professional storytelling; Instagram: concise visual caption; Facebook: warm community update). Ground the post strictly in the student's real idea, project, internship (stage), or certificate. Never invent metrics or fake achievements. Return valid JSON { posts: [...] }.",
    prompt: `Locale: ${params.locale}\nStudent: ${params.studentName} (${params.specialization})\nPlatforms: ${params.platforms.join(", ")}\nIdea/Message: ${params.idea}\n${attachmentContext}`,
    maxOutputTokens: 1000,
    jsonMode: true,
    temperature: 0.4,
  });

  const parsed = parseJsonSafe(raw, SocialPostSchema);
  if (parsed && parsed.posts.length > 0) {
    return { posts: parsed.posts, isDemoFallback: false };
  }

  const refLine = params.attachedTitle ? `\n\n📎 Référence jointe : ${params.attachedTitle}` : "";
  const posts: GeneratedSocialPost[] = params.platforms.map((platform) => {
    if (platform === "linkedin") {
      return {
        platform: "linkedin",
        headline: "Post LinkedIn Professionnel",
        body: `De l'université à l'action concrète 🚀\n\nEn tant qu'étudiant(e) en ${params.specialization}, j'ai transformé mes apprentissages, stages et projets pratiques en une nouvelle initiative :\n\n« ${params.idea} »${refLine}\n\nChaque cours, projet et stage est une opportunité de créer de la valeur réelle, de se lancer en freelance ou de bâtir une startup. Hâte d'échanger avec des professionnels et mentors sur cette démarche !`,
        hashtags: ["#CampusMate", "#ISETBeja", "#EntrepreneuriatEtudiant", "#Freelance", "#Innovation"],
        callToAction: "Vos retours et conseils sont les bienvenus en commentaire !",
      };
    }
    if (platform === "instagram") {
      return {
        platform: "instagram",
        headline: "Légende Instagram",
        body: `✨ Du campus au monde réel !\n\n${params.idea}${refLine}\n\nCours + Stages + Projets = Opportunités infinies 💡🔥`,
        hashtags: ["#CampusLife", "#StudentStartup", "#TechTunisia", "#ISETBeja", "#BuildInPublic"],
        callToAction: "Dis-moi ce que tu en penses en DM ou en commentaire 👇",
      };
    }
    return {
      platform: "facebook",
      headline: "Publication Facebook",
      body: `Bonjour à tous 👋\n\nJe partage avec vous une nouvelle étape de mon parcours universitaire (${params.specialization}) : ${params.idea}.${refLine}\n\nMerci à mes enseignants, camarades et encadrants de stage pour leur soutien. N'hésitez pas à partager ou donner votre avis !`,
      hashtags: ["#ISETBeja", "#VieEstudiantine", "#ProjetEtudiant", "#CampusMate"],
      callToAction: "Partagez votre avis en commentaire !",
    };
  });

  return { posts, isDemoFallback: true };
}
