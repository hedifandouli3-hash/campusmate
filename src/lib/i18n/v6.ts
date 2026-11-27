import type { Locale } from "@/types/domain";

export interface V6Copy {
  agent: {
    title: string;
    description: string;
    promptLabel: string;
    promptPlaceholder: string;
    runButton: string;
    runningButton: string;
    newConversation: string;
    clearHistory: string;
    memoryActive: string;
    memoryDisabled: string;
    approvalsTitle: string;
    approve: string;
    reject: string;
    sessionTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    toolLogTitle: string;
    artifactsTitle: string;
    openStudio: string;
    securityTitle: string;
  };
  studio: {
    title: string;
    description: string;
    createPlaceholder: string;
    createBtn: string;
    myCreations: string;
    emptyTitle: string;
    emptyDesc: string;
    save: string;
    exportHtml: string;
    exportZip: string;
    exportSlidesPdf: string;
    exportDocPdf: string;
    brandName: string;
    primaryColor: string;
    font: string;
    sectionsEditor: string;
    headingLabel: string;
    subheadingLabel: string;
    sandboxBanner: string;
  };
  projects: {
    title: string;
    description: string;
    newProjectPlaceholder: string;
    createProject: string;
    emptyTitle: string;
    emptyDesc: string;
    addTaskPlaceholder: string;
    addTask: string;
    exportIcs: string;
    moveBack: string;
    moveForward: string;
    deleteTask: string;
    columns: { todo: string; in_progress: string; under_review: string; completed: string };
  };
  automations: {
    title: string;
    description: string;
    builderTitle: string;
    templatesTitle: string;
    activateTemplate: string;
    myAutomations: string;
    runNow: string;
    addCalendar: string;
    emailDraftsTitle: string;
    saveDraft: string;
  };
  artifacts: {
    title: string;
    description: string;
    allTypes: string;
    emptyTitle: string;
    emptyDesc: string;
    openInStudio: string;
  };
  startupBuilder: {
    title: string;
    description: string;
    step1Title: string;
    startupName: string;
    courseOrigin: string;
    problemSolved: string;
    generateBundle: string;
    generating: string;
    step2Title: string;
    monthlyPrice: string;
    fixedCost: string;
    variableCost: string;
    unitMargin: string;
    breakEven: string;
    clientsUnit: string;
  };
}

const FR: V6Copy = {
  agent: {
    title: "CampusMate Agent",
    description: "Votre assistant agentique central : recherche ISET Béja, création de livrables, planification et automatisation sécurisée.",
    promptLabel: "Que souhaitez-vous accomplir aujourd'hui ?",
    promptPlaceholder: "Ex: Crée un site web pour mon projet startup, génère 5 slides de soutenance, ou prépare un email...",
    runButton: "Lancer l'agent",
    runningButton: "Exécution...",
    newConversation: "Nouvelle conversation",
    clearHistory: "Effacer l'historique",
    memoryActive: "Mémoire : Active",
    memoryDisabled: "Mémoire : Désactivée",
    approvalsTitle: "Approbations humaines requises",
    approve: "Approuver",
    reject: "Refuser",
    sessionTitle: "Session de l'agent",
    emptyTitle: "Prêt pour votre premier objectif",
    emptyDesc: "Décrivez une tâche ci-dessus ou choisissez un raccourci pour que l'agent exécute des outils et crée de vrais livrables.",
    toolLogTitle: "Journal d'exécution des outils (max 4 outils/tour)",
    artifactsTitle: "Livrables récents",
    openStudio: "Ouvrir Studio",
    securityTitle: "Sécurité & Contrôle",
  },
  studio: {
    title: "Studio de Création IA",
    description: "Concevez des sites web en sandbox sécurisée, présentations PDF, documents académiques et kits de marque.",
    createPlaceholder: "Nom du livrable (ex: Portfolio PFE, Pitch Deck...)",
    createBtn: "Créer",
    myCreations: "Mes créations",
    emptyTitle: "Sélectionnez ou créez un livrable",
    emptyDesc: "Utilisez le formulaire ci-dessus pour démarrer un site web, une présentation, un document ou un brand kit.",
    save: "Enregistrer",
    exportHtml: "Exporter HTML",
    exportZip: "ZIP Déploiement (Vercel / Netlify)",
    exportSlidesPdf: "Exporter PDF (Slides)",
    exportDocPdf: "Exporter PDF",
    brandName: "Nom de marque",
    primaryColor: "Couleur principale",
    font: "Police",
    sectionsEditor: "Contenu des sections du site",
    headingLabel: "Titre de section",
    subheadingLabel: "Sous-titre",
    sandboxBanner: "Aperçu isolé (iframe sandbox, CSP strict, sans cookies)",
  },
  projects: {
    title: "Gestion de Projets & Kanban",
    description: "Suivez vos projets académiques, PFE, startups et portfolios avec calcul réel d'avancement.",
    newProjectPlaceholder: "Nouveau projet (ex: PFE Smart Irrigation ISET Béja)",
    createProject: "Créer projet",
    emptyTitle: "Aucun projet pour le moment",
    emptyDesc: "Créez votre premier projet ci-dessus pour organiser vos tâches en Kanban.",
    addTaskPlaceholder: "Ajouter une tâche au tableau Kanban...",
    addTask: "Ajouter tâche",
    exportIcs: "Calendrier (.ics)",
    moveBack: "Reculer",
    moveForward: "Avancer",
    deleteTask: "Supprimer la tâche",
    columns: { todo: "À faire", in_progress: "En cours", under_review: "En révision", completed: "Terminé" },
  },
  automations: {
    title: "Centre d'Automatisation",
    description: "Workflows Déclencheur → Conditions → Actions → Résultat, briefing quotidien et brouillons d'emails sécurisés (Africa/Tunis).",
    builderTitle: "Constructeur visuel (Déclencheur → Conditions → Actions → Résultat)",
    templatesTitle: "7 modèles prêts à l'emploi",
    activateTemplate: "Activer ce modèle",
    myAutomations: "Mes automatisations",
    runNow: "Exécuter maintenant",
    addCalendar: ".ics",
    emailDraftsTitle: "Brouillons d'emails (Validation requise)",
    saveDraft: "Enregistrer le brouillon",
  },
  artifacts: {
    title: "Bibliothèque des Livrables",
    description: "Retrouvez tous les sites web, présentations, documents et kits de marque générés par l'Agent ou le Studio.",
    allTypes: "Tous les types",
    emptyTitle: "Aucun livrable dans cette catégorie",
    emptyDesc: "Créez des livrables depuis CampusMate Agent ou le Studio de Création.",
    openInStudio: "Ouvrir dans Studio",
  },
  startupBuilder: {
    title: "Startup Builder Unifié",
    description: "Reliez vos cours à une vraie startup : Problème → Modèle économique → Seuil de rentabilité → Site web → MVP Kanban.",
    step1Title: "1. Définition Cours → Problème → Startup",
    startupName: "Nom de la startup",
    courseOrigin: "Cours / compétence source",
    problemSolved: "Problème résolu",
    generateBundle: "Générer Site Web + Projet MVP",
    generating: "Génération...",
    step2Title: "2. Simulateur de Rentabilité (TND)",
    monthlyPrice: "Abonnement mensuel (TND)",
    fixedCost: "Coûts fixes mensuels (TND)",
    variableCost: "Coût variable / client (TND)",
    unitMargin: "Marge unitaire",
    breakEven: "Seuil de rentabilité :",
    clientsUnit: "clients",
  },
};

const EN: V6Copy = {
  agent: {
    title: "CampusMate Agent",
    description: "Your central agentic workspace: ISET Béja RAG search, deliverable creation, planning, and safe automation.",
    promptLabel: "What would you like to accomplish today?",
    promptPlaceholder: "e.g., Create a website for my PFE project, generate 5 defense slides, or draft an email...",
    runButton: "Run Agent",
    runningButton: "Running...",
    newConversation: "New conversation",
    clearHistory: "Clear history",
    memoryActive: "Memory: Active",
    memoryDisabled: "Memory: Off",
    approvalsTitle: "Human approvals required",
    approve: "Approve",
    reject: "Reject",
    sessionTitle: "Agent Session",
    emptyTitle: "Ready for your first goal",
    emptyDesc: "Describe a task above or pick a shortcut so the agent runs authorized tools and creates real deliverables.",
    toolLogTitle: "Tool execution log (max 4 tools/turn)",
    artifactsTitle: "Recent deliverables",
    openStudio: "Open Studio",
    securityTitle: "Security & Control",
  },
  studio: {
    title: "AI Creation Studio",
    description: "Build sandboxed websites, PDF slide decks, academic documents, and brand kits.",
    createPlaceholder: "Deliverable name (e.g., PFE Portfolio, Pitch Deck...)",
    createBtn: "Create",
    myCreations: "My creations",
    emptyTitle: "Select or create a deliverable",
    emptyDesc: "Use the form above to start a website, presentation, document, or brand kit.",
    save: "Save",
    exportHtml: "Export HTML",
    exportZip: "Deploy ZIP (Vercel / Netlify)",
    exportSlidesPdf: "Export PDF (Slides)",
    exportDocPdf: "Export PDF",
    brandName: "Brand name",
    primaryColor: "Primary color",
    font: "Font",
    sectionsEditor: "Website section content",
    headingLabel: "Section heading",
    subheadingLabel: "Subheading",
    sandboxBanner: "Isolated preview (sandboxed iframe, strict CSP, no cookies)",
  },
  projects: {
    title: "Projects & Kanban",
    description: "Track academic, PFE, startup, and portfolio projects with real task-based progress.",
    newProjectPlaceholder: "New project (e.g., Smart Irrigation PFE)",
    createProject: "Create project",
    emptyTitle: "No projects yet",
    emptyDesc: "Create your first project above to organize tasks on the Kanban board.",
    addTaskPlaceholder: "Add a task to the Kanban board...",
    addTask: "Add task",
    exportIcs: "Calendar (.ics)",
    moveBack: "Back",
    moveForward: "Advance",
    deleteTask: "Delete task",
    columns: { todo: "To Do", in_progress: "In Progress", under_review: "Under Review", completed: "Completed" },
  },
  automations: {
    title: "Automation Center",
    description: "Trigger → Conditions → Actions → Result workflows, daily briefings, and safe email drafts (Africa/Tunis).",
    builderTitle: "Visual builder (Trigger → Conditions → Actions → Result)",
    templatesTitle: "7 ready-to-use templates",
    activateTemplate: "Activate template",
    myAutomations: "My automations",
    runNow: "Run now",
    addCalendar: ".ics",
    emailDraftsTitle: "Email Drafts (Approval required)",
    saveDraft: "Save draft",
  },
  artifacts: {
    title: "Artifact Library",
    description: "Browse all websites, presentations, documents, and brand kits created by the Agent or Studio.",
    allTypes: "All types",
    emptyTitle: "No artifacts in this category",
    emptyDesc: "Create deliverables from CampusMate Agent or Creation Studio.",
    openInStudio: "Open in Studio",
  },
  startupBuilder: {
    title: "Unified Startup Builder",
    description: "Connect your courses to a real startup: Problem → Business Model → Break-Even → Website → MVP Kanban.",
    step1Title: "1. Course → Problem → Startup Definition",
    startupName: "Startup name",
    courseOrigin: "Source course / skill",
    problemSolved: "Problem solved",
    generateBundle: "Generate Website + MVP Project",
    generating: "Generating...",
    step2Title: "2. Break-Even Simulator (TND)",
    monthlyPrice: "Monthly subscription (TND)",
    fixedCost: "Monthly fixed costs (TND)",
    variableCost: "Variable cost / client (TND)",
    unitMargin: "Unit margin",
    breakEven: "Break-even point:",
    clientsUnit: "clients",
  },
};

const AR: V6Copy = {
  agent: {
    title: "الوكيل الذكي CampusMate",
    description: "مساحة العمل المركزية: البحث في المعهد العالي للدراسات التكنولوجية بباجة، إنشاء المخرجات، التخطيط والأتمتة الآمنة.",
    promptLabel: "ما الذي ترغب في إنجازه اليوم؟",
    promptPlaceholder: "مثال: أنشئ موقعاً لمشروع التخرج، أو 5 شرائح عرض، أو مسودة بريد إلكتروني...",
    runButton: "تشغيل الوكيل",
    runningButton: "جارٍ التنفيذ...",
    newConversation: "محادثة جديدة",
    clearHistory: "مسح السجل",
    memoryActive: "الذاكرة: مفعّلة",
    memoryDisabled: "الذاكرة: معطّلة",
    approvalsTitle: "موافقات بشرية مطلوبة",
    approve: "موافقة",
    reject: "رفض",
    sessionTitle: "جلسة الوكيل",
    emptyTitle: "جاهز لهدفك الأول",
    emptyDesc: "صف مهمتك أعلاه أو اختر اختصاراً ليقوم الوكيل بتنفيذ الأدوات وإنشاء مخرجات حقيقية.",
    toolLogTitle: "سجل تنفيذ الأدوات (بحد أقصى 4 أدوات/دورة)",
    artifactsTitle: "أحدث المخرجات",
    openStudio: "فتح الاستوديو",
    securityTitle: "الأمان والتحكم",
  },
  studio: {
    title: "استوديو الإبداع الذكي",
    description: "صمّم مواقع ويب معزولة، عروض PDF، تقارير أكاديمية وهوية بصرية.",
    createPlaceholder: "اسم المخرج (مثال: موقع مشروع التخرج، عرض تقديمي...)",
    createBtn: "إنشاء",
    myCreations: "إبداعاتي",
    emptyTitle: "اختر أو أنشئ مخرجاً",
    emptyDesc: "استخدم النموذج أعلاه لبدء موقع ويب أو عرض تقديمي أو مستند أو هوية بصرية.",
    save: "حفظ",
    exportHtml: "تصدير HTML",
    exportZip: "حزمة النشر ZIP (Vercel / Netlify)",
    exportSlidesPdf: "تصدير PDF (الشرائح)",
    exportDocPdf: "تصدير PDF",
    brandName: "اسم العلامة",
    primaryColor: "اللون الأساسي",
    font: "الخط",
    sectionsEditor: "تعديل محتوى أقسام الموقع",
    headingLabel: "عنوان القسم",
    subheadingLabel: "العنوان الفرعي",
    sandboxBanner: "معاينة معزولة (iframe sandbox، سياسة CSP صارمة، بدون ملفات تعريف الارتباط)",
  },
  projects: {
    title: "إدارة المشاريع و Kanban",
    description: "تابع مشاريعك الدراسية ومشروع التخرج والشركات الناشئة مع حساب حقيقي للتقدم.",
    newProjectPlaceholder: "مشروع جديد (مثال: مشروع تخرج الري الذكي)",
    createProject: "إنشاء مشروع",
    emptyTitle: "لا توجد مشاريع بعد",
    emptyDesc: "أنشئ مشروعك الأول أعلاه لتنظيم المهام في لوحة Kanban.",
    addTaskPlaceholder: "أضف مهمة إلى لوحة Kanban...",
    addTask: "إضافة مهمة",
    exportIcs: "التقويم (.ics)",
    moveBack: "تراجع",
    moveForward: "تقديم",
    deleteTask: "حذف المهمة",
    columns: { todo: "للإنجاز", in_progress: "قيد التنفيذ", under_review: "قيد المراجعة", completed: "مكتمل" },
  },
  automations: {
    title: "مركز الأتمتة",
    description: "سير عمل: مشغّل ← شروط ← إجراءات ← نتيجة، ملخص يومي ومسودات بريد إلكتروني آمنة (توقيت تونس).",
    builderTitle: "منشئ سير العمل المرئي",
    templatesTitle: "7 قوالب جاهزة للاستخدام",
    activateTemplate: "تفعيل هذا القالب",
    myAutomations: "أتمتتي",
    runNow: "تشغيل الآن",
    addCalendar: ".ics",
    emailDraftsTitle: "مسودات البريد الإلكتروني (تتطلب موافقة)",
    saveDraft: "حفظ المسودة",
  },
  artifacts: {
    title: "مكتبة المخرجات",
    description: "تصفح جميع المواقع والعروض والمستندات والهويات البصرية المنشأة.",
    allTypes: "جميع الأنواع",
    emptyTitle: "لا توجد مخرجات في هذه الفئة",
    emptyDesc: "أنشئ مخرجات من الوكيل الذكي أو استوديو الإبداع.",
    openInStudio: "فتح في الاستوديو",
  },
  startupBuilder: {
    title: "باني الشركات الناشئة الموحّد",
    description: "اربط دروسك بشركة ناشئة حقيقية: المشكلة ← نموذج العمل ← نقطة التعادل ← الموقع ← لوحة MVP.",
    step1Title: "1. الدرس ← المشكلة ← تعريف الشركة الناشئة",
    startupName: "اسم الشركة الناشئة",
    courseOrigin: "المادة / المهارة المصدر",
    problemSolved: "المشكلة المعالجة",
    generateBundle: "إنشاء الموقع + مشروع MVP",
    generating: "جارٍ الإنشاء...",
    step2Title: "2. محاكي نقطة التعادل (بالدينار التونسي)",
    monthlyPrice: "الاشتراك الشهري (TND)",
    fixedCost: "التكاليف الثابتة الشهرية (TND)",
    variableCost: "التكلفة المتغيرة / عميل (TND)",
    unitMargin: "الهامش الوحدوي",
    breakEven: "نقطة التعادل:",
    clientsUnit: "عملاء",
  },
};

export function getV6Copy(locale: Locale): V6Copy {
  if (locale === "en") return EN;
  if (locale === "ar") return AR;
  return FR;
}
