"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  CalendarClock,
  CheckCircle2,
  DoorOpen,
  FileText,
  GraduationCap,
  MessageCircleWarning,
  MessageSquare,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Card } from "@/components/ui/primitives";

const MODULES = [
  { num: "01", title: "AI Learning Hub", desc: "Cours, résumés IA, quiz, flashcards et Q&A sourcé par document.", icon: <BookOpen className="w-5 h-5 text-blue-600" /> },
  { num: "02", title: "Assistant Universitaire IA", desc: "Chatbot RAG connecté aux pages officielles ISET Béja & procédures.", icon: <Bot className="w-5 h-5 text-indigo-600" /> },
  { num: "03", title: "Administration Digitale", desc: "Demandes d'attestations, suivi temps réel et téléchargement sécurisé.", icon: <FileText className="w-5 h-5 text-blue-600" /> },
  { num: "04", title: "Smart Study Planner", desc: "Emploi du temps, examens et planning de révision généré par IA.", icon: <CalendarClock className="w-5 h-5 text-emerald-600" /> },
  { num: "05", title: "File d'Attente Digitale", desc: "Tickets virtuels de scolarité et notifications de passage.", icon: <Ticket className="w-5 h-5 text-blue-600" /> },
  { num: "06", title: "Marketplace Étudiant", desc: "Manuels, calculatrices et matériel universitaire entre pairs.", icon: <ShoppingBag className="w-5 h-5 text-indigo-600" /> },
  { num: "07", title: "Transport & Navettes", desc: "Horaires des navettes campus et informations de transport universitaire.", icon: <Bus className="w-5 h-5 text-emerald-600" /> },
  { num: "08", title: "Assistant CV & Carrière IA", desc: "Création de CV PDF, lettres de motivation et préparation entretiens.", icon: <Award className="w-5 h-5 text-blue-600" /> },
  { num: "09", title: "Objets Perdus & Trouvés", desc: "Signalement sécurisé et restitution vérifiée via l'administration.", icon: <Search className="w-5 h-5 text-indigo-600" /> },
  { num: "10", title: "Salles & Réservations", desc: "Disponibilité des salles d'étude sans conflit d'horaire.", icon: <DoorOpen className="w-5 h-5 text-emerald-600" /> },
  { num: "11", title: "Voix Étudiante", desc: "Suggestions et réclamations avec option confidentielle.", icon: <MessageCircleWarning className="w-5 h-5 text-blue-600" /> },
  { num: "12", title: "Événements Campus", desc: "Hackathons, ateliers, clubs et inscriptions avec capacité.", icon: <Calendar className="w-5 h-5 text-indigo-600" /> },
  { num: "13", title: "Groupes Académiques", desc: "Discussions temps réel par promo, département, section et matière.", icon: <MessageSquare className="w-5 h-5 text-emerald-600" /> },
  { num: "14", title: "Organisations & Stages", desc: "Offres PFE/Perfectionnement vérifiées et matching IA explicable.", icon: <Briefcase className="w-5 h-5 text-blue-600" /> },
  { num: "15", title: "CampusMate Launchpad", desc: "Transformez vos cours en compétences, projets pratiques, freelance, Business Canvas et startups.", icon: <Rocket className="w-5 h-5 text-indigo-600" /> },
];

const ROLE_PREVIEWS = [
  {
    id: "student",
    label: "Étudiant",
    badge: "2ème Année TI DSI",
    highlights: [
      "Résumés IA, Quiz & Q&A sourcé sur vos cours",
      "Assistant ISET Béja (attestations, parcours, contacts)",
      "File d'attente virtuelle, Salles, CV PDF & Stages",
    ],
  },
  {
    id: "teacher",
    label: "Enseignant",
    badge: "Département TI",
    highlights: [
      "Dépôt PDF/DOCX/PPTX avec indexation RAG automatique",
      "Corrigés réservés exclus des requêtes étudiantes",
      "Génération de Quiz IA & Annonces épinglées",
    ],
  },
  {
    id: "admin",
    label: "Administration",
    badge: "Scolarité & Services",
    highlights: [
      "Traitement des attestations & dépôt de spécimens",
      "Synchronisation Base IA officielle (isetb.rnu.tn)",
      "Analytiques Recharts, Files d'attente & Voix Étudiante",
    ],
  },
  {
    id: "org",
    label: "Organisation",
    badge: "Partenaire Stages",
    highlights: [
      "Publication d'offres PFE, Perfectionnement & Été",
      "Réception et suivi des candidatures CV CampusMate",
      "Isolation stricte des candidatures par organisation",
    ],
  },
] as const;

export default function LandingPage() {
  const { t } = useApp();
  const [previewRole, setPreviewRole] = useState<(typeof ROLE_PREVIEWS)[number]["id"]>("student");
  const activePreview = ROLE_PREVIEWS.find((r) => r.id === previewRole) || ROLE_PREVIEWS[0];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <PublicHeader />

      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">ISET Béja • Écosystème Universitaire IA</Badge>
              <Badge variant="success">Multi-Tenant • 15 Modules</Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              {t.landing.heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.landing.heroSubtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
              >
                {t.landing.ctaPrimary}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Explorer la démo interactive
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                {t.landing.ctaSecondary}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-1">
              <span>✓ Français, English, العربية (RTL)</span>
              <span>✓ Mode Clair & Sombre</span>
              <span>✓ 5 Rôles • 14 Modules</span>
            </div>
          </div>

          {/* Interactive SaaS Role Preview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Aperçu Interactif — ISET Béja</span>
              </div>
              <Badge variant="success">{activePreview.badge}</Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 rounded-xl bg-white dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
              {ROLE_PREVIEWS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setPreviewRole(r.id)}
                  className={`flex-1 min-w-[85px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    previewRole === r.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <Card className="p-4 space-y-2.5">
              {activePreview.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </Card>

            <div className="grid sm:grid-cols-2 gap-3">
              <Card className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600">Assistant RAG</span>
                  <Bot className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Indexé sur <strong>isetb.rnu.tn</strong> : départements TI/GE/GM, direction & réclamations.
                </p>
              </Card>

              <Card className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600">File Digitale</span>
                  <Ticket className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Guichet Scolarité • Ticket virtuel & estimation d&apos;attente.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Solved */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold">{t.landing.problemsTitle}</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            Fini les déplacements inutiles, les groupes dispersés et les cours introuvables.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: "Questions administratives répétitives", desc: "L'assistant RAG répond instantanément à partir des procédures et du site officiel de l'établissement." },
            { title: "Supports de cours dispersés", desc: "Chaque enseignant publie ses PDF/DOCX/PPTX directement pour ses sections inscrites." },
            { title: "Manque de planification personnalisée", desc: "Le Smart Study Planner génère un emploi de révision réaliste selon vos examens." },
            { title: "Attentes physiques au guichet", desc: "Demandes d'attestations en ligne et file d'attente virtuelle avec notifications." },
            { title: "Communication étudiant–enseignant fragmentée", desc: "Groupes académiques modérés et annonces officielles épinglées." },
            { title: "Accès difficile aux stages PFE", desc: "Organisations vérifiées, CV Builder PDF et lettres de motivation assistées par IA." },
          ].map((item) => (
            <Card key={item.title} interactive className="space-y-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-base">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 14 Modules Grid */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">{t.landing.featuresTitle}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Une architecture modulaire, sécurisée par Row Level Security et isolation multi-tenant.
              </p>
            </div>
            <Link href="/features" className="text-sm font-semibold text-blue-600 hover:underline">
              Explorer les 15 modules →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MODULES.map((m) => (
              <Card key={m.num} interactive className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900">
                    {m.icon}
                  </div>
                  <span className="text-xs font-mono text-slate-400">{m.num}</span>
                </div>
                <h3 className="font-semibold text-sm">{m.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{m.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* De l'université au monde professionnel — Launchpad Flagship */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-6 sm:p-10 space-y-6">
          <div className="max-w-3xl space-y-2">
            <Badge variant="indigo">Nouveauté V3 • CampusMate Launchpad</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold">
              De l&apos;université au monde professionnel.
            </h2>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              De l&apos;apprentissage à l&apos;emploi, du savoir à l&apos;entrepreneuriat.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              CampusMate Launchpad relie directement vos cours universitaires à des compétences vérifiées, des projets pratiques, des services freelance, des Business Model Canvas et des startups étudiantes.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {[
              { step: "Apprendre & Connecter", desc: "Extrayez les compétences réelles de vos cours autorisés et quiz." },
              { step: "Appliquer & Construire", desc: "Transformez un cours en 3 projets pratiques, 3 services freelance et 3 idées startup." },
              { step: "Structurer & Collaborer", desc: "Éditez votre Business Model Canvas, roadmap MVP et équipe académique." },
              { step: "Valoriser & Lancer", desc: "Exportez vos réalisations vers votre Portfolio, Studio CV et Pitch Jury." },
            ].map((item) => (
              <Card key={item.step} className="p-4 space-y-1.5">
                <p className="font-semibold text-sm">{item.step}</p>
                <p className="text-slate-600 dark:text-slate-300">{item.desc}</p>
              </Card>
            ))}
          </div>
          <div>
            <Link
              href="/login/student"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Découvrir CampusMate Launchpad <Rocket className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How CampusMate connects 5 roles */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <h2 className="text-2xl sm:text-3xl font-bold">{t.landing.howTitle}</h2>
        <div className="grid md:grid-cols-4 gap-5">
          {[
            { icon: <GraduationCap className="w-6 h-6 text-blue-600" />, role: "Étudiants", desc: "Accès aux cours, IA d'étude sourcée, documents administratifs, groupes, CV et stages." },
            { icon: <Users className="w-6 h-6 text-indigo-600" />, role: "Enseignants", desc: "Publication de cours PDF/DOCX/PPTX, génération de quiz IA et annonces ciblées." },
            { icon: <Building2 className="w-6 h-6 text-emerald-600" />, role: "Administration", desc: "Validation des attestations, base de connaissances RAG, files d'attente et salles." },
            { icon: <ShieldCheck className="w-6 h-6 text-blue-600" />, role: "Organisations & Super Admin", desc: "Offres de stage vérifiées, gouvernance multi-universités et journaux d'audit." },
          ].map((card) => (
            <Card key={card.role} interactive className="space-y-3">
              {card.icon}
              <h3 className="font-semibold">{card.role}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{card.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ + Final CTA */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <h2 className="text-2xl font-bold text-center">{t.landing.faqTitle}</h2>
          <div className="grid gap-4">
            {[
              {
                q: "Comment accéder à mon espace selon mon statut ?",
                a: "Chaque profil dispose d'un portail dédié (/login/student, /login/teacher, /login/administration, /login/organization, /login/admin) avec vérification de rôle côté serveur.",
              },
              {
                q: "Comment fonctionne l'IA sans inventer de fausses informations ?",
                a: "Le moteur RAG filtre d'abord les documents autorisés pour l'institution et le rôle de l'utilisateur, puis cite le titre du document et la page.",
              },
              {
                q: "La plateforme peut-elle accueillir d'autres universités tunisiennes ?",
                a: "Oui. Chaque ressource est isolée par identifiant d'institution (multi-tenant) et protégée par des politiques Row Level Security PostgreSQL.",
              },
            ].map((faq) => (
              <Card key={faq.q} className="p-4">
                <h3 className="font-semibold text-sm">{faq.q}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{faq.a}</p>
              </Card>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-900 text-white p-8 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-300">
              <Sparkles className="w-3.5 h-3.5" /> Écosystème Unifié
            </div>
            <h3 className="text-2xl font-bold">Prêt à accéder à votre espace CampusMate ?</h3>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Connectez-vous à votre portail dédié (Étudiant, Enseignant, Administration ou Entreprise Partenaire).
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition">
                Choisir un portail
              </Link>
              <Link href="/register" className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
