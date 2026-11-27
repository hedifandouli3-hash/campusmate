"use client";

import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Card } from "@/components/ui/primitives";

const FEATURE_GROUPS = [
  {
    title: "Pôle Académique & IA",
    items: [
      "01. AI Learning Hub : dépôt PDF/DOCX/PPTX/TXT, résumés en 5 modes, flashcards, quiz et chat documentaire sourcé.",
      "02. Assistant Universitaire IA : chatbot RAG multilingue (FR/EN/AR) adossé à la base de connaissances administrative.",
      "04. Smart Study Planner : emploi du temps, examens et planning de révision généré par IA.",
    ],
  },
  {
    title: "Pôle Administration Digitale",
    items: [
      "03. Digital Administration : demandes d'attestations avec numéro de suivi, validation et téléchargement sécurisé.",
      "05. File d'attente Digitale : tickets virtuels par service, estimation d'attente et appel en direct.",
      "10. Salles & Réservations : consultation des créneaux et réservation sans chevauchement.",
      "11. Voix Étudiante : suggestions et réclamations avec mode confidentiel.",
    ],
  },
  {
    title: "Pôle Communauté & Carrière",
    items: [
      "06. Marketplace Étudiant • 07. Transport & Covoiturage encadré • 09. Objets Trouvés • 12. Événements.",
      "13. Groupes Académiques : canaux automatiques par année, département et section avec annonces épinglées.",
      "08 & 14. CV Builder PDF + Organisations vérifiées & Offres de Stage avec matching IA explicable.",
    ],
  },
  {
    title: "Pôle Agentic AI OS & Launchpad (V6)",
    items: [
      "15. CampusMate Launchpad & Startup Builder : compétences, freelance, Business Model Canvas, rentabilité et pitch.",
      "16. CampusMate Agent : assistant agentique central avec registre d'outils sécurisé et approbations humaines.",
      "17. Studio de Création IA : sites web en sandbox CSP + export ZIP Vercel/Netlify, présentations PDF et brand kits.",
      "18, 19 & 20. Projets Kanban (.ics), Centre d'Automatisation (Resend/Cron/Gmail) & Bibliothèque des Livrables.",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="space-y-3">
          <Badge variant="indigo">20 Modules Intégrés</Badge>
          <h1 className="text-3xl font-bold">Fonctionnalités de l&apos;écosystème CampusMate</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Chaque module fonctionne de bout en bout avec contrôle d&apos;accès par rôle et persistance serveur.
          </p>
        </div>

        <div className="space-y-5">
          {FEATURE_GROUPS.map((g) => (
            <Card key={g.title} className="space-y-3">
              <h2 className="text-lg font-semibold text-blue-600">{g.title}</h2>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {g.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Link href="/login" className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          Explorer depuis un compte démo
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
