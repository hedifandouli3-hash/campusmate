"use client";

import Link from "next/link";
import { Bus, CalendarClock, DoorOpen, FileText, Home, MessageCircleWarning, Ticket } from "lucide-react";
import { Card, PageHeader } from "@/components/ui/primitives";

const SERVICES = [
  {
    title: "Documents Administratifs",
    desc: "Demandez attestations de présence, relevés et conventions avec suivi en ligne.",
    href: "/student/documents",
    icon: <FileText className="w-5 h-5 text-blue-600" />,
  },
  {
    title: "File d'Attente Digitale",
    desc: "Prenez un ticket virtuel au guichet Scolarité et suivez votre position.",
    href: "/student/queue",
    icon: <Ticket className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Salles d'Étude",
    desc: "Consultez la disponibilité des salles et réservez sans conflit.",
    href: "/student/study-rooms",
    icon: <DoorOpen className="w-5 h-5 text-indigo-600" />,
  },
  {
    title: "Voix Étudiante",
    desc: "Envoyez vos suggestions ou réclamations avec option confidentielle.",
    href: "/student/feedback",
    icon: <MessageCircleWarning className="w-5 h-5 text-amber-600" />,
  },
  {
    title: "Transport Universitaire",
    desc: "Horaires des navettes et lignes desservant l'ISET Béja.",
    href: "/student/transport",
    icon: <Bus className="w-5 h-5 text-blue-600" />,
  },
  {
    title: "Logement Étudiant",
    desc: "Résidences et studios vérifiés à proximité du campus (gratuit).",
    href: "/student/housing",
    icon: <Home className="w-5 h-5 text-emerald-600" />,
  },
  {
    title: "Emploi du Temps & Examens",
    desc: "Calendrier académique et planificateur de révision intelligent.",
    href: "/student/study-planner",
    icon: <CalendarClock className="w-5 h-5 text-indigo-600" />,
  },
];

export default function StudentServicesHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Hub des Services Universitaires"
        description="Tous les services pratiques de votre campus réunis au même endroit, toujours accessibles même hors quota IA."
        badge="Services Campus"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card interactive className="p-5 h-full space-y-2">
              {s.icon}
              <h2 className="font-semibold text-base text-slate-900 dark:text-white">{s.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">{s.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
