"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Briefcase,
  Compass,
  FolderKanban,
  LayoutGrid,
  Lightbulb,
  Map,
  Rocket,
  Share2,
  Sparkles,
  Users,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/student/launchpad", label: "Vue d'ensemble", icon: <Rocket className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/startup-builder", label: "Startup Builder", icon: <Rocket className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/skills", label: "Compétences IA", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/freelance", label: "Freelance", icon: <Briefcase className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/startups", label: "Idées Startup", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/business-canvas", label: "Business Canvas", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/roadmaps", label: "Roadmaps & Pitch", icon: <Map className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/projects", label: "Labo Projets", icon: <FolderKanban className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/teams", label: "Équipes", icon: <Users className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/portfolio", label: "Portfolio & CV", icon: <Award className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/mentorship", label: "Mentorat & Défis", icon: <Handshake className="w-3.5 h-3.5" /> },
  { href: "/student/launchpad/social-post", label: "Posts IA (LinkedIn/IG/FB)", icon: <Share2 className="w-3.5 h-3.5" /> },
];

export function LaunchpadNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation Launchpad"
      className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800"
    >
      {LINKS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition",
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/student/courses"
        className="ms-auto inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-blue-200 dark:border-blue-800 px-2.5 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
      >
        <Compass className="w-3.5 h-3.5" /> Mes Cours
      </Link>
    </nav>
  );
}
