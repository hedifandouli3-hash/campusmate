"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, Moon, Sun } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/domain";

export function PublicHeader() {
  const { locale, setLocale, t, dark, toggleTheme } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)]/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white shrink-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <span className="text-base sm:text-lg tracking-tight">CampusMate</span>
            <span className="hidden sm:block text-[10px] font-medium text-slate-500">ISET Béja • Portail Universitaire</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/features" className="hover:text-blue-600 transition">{t.nav.features}</Link>
          <Link href="/#how-it-works" className="hover:text-blue-600 transition">{t.nav.howItWorks}</Link>
          <Link href="/about" className="hover:text-blue-600 transition">{t.nav.about}</Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-[11px] sm:text-xs">
            {(["fr", "en", "ar"] as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => setLocale(loc)}
                className={cn(
                  "px-1.5 sm:px-2 py-1 rounded-md font-medium uppercase cursor-pointer",
                  locale === loc ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"
                )}
              >
                {loc}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label={t.nav.theme}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/login"
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t.nav.login}
          </Link>
          <Link
            href="/register"
            className="hidden sm:inline-flex rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
          >
            {t.nav.getStarted}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  const { t } = useApp();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>CampusMate</span>
          </div>
          <p className="text-slate-500 text-xs">{t.brand.slogan}</p>
          <p className="text-slate-400 text-xs">ISET Béja — Tunisie</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Portails de connexion</h4>
          <ul className="space-y-1.5 text-slate-500 text-xs">
            <li><Link href="/login/student" className="hover:text-blue-600">Espace Étudiant</Link></li>
            <li><Link href="/login/teacher" className="hover:text-blue-600">Espace Enseignant</Link></li>
            <li><Link href="/login/administration" className="hover:text-blue-600">Administration Universitaire</Link></li>
            <li><Link href="/login/organization" className="hover:text-blue-600">Organisations & Stages</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Plateforme</h4>
          <ul className="space-y-1.5 text-slate-500 text-xs">
            <li><Link href="/features" className="hover:text-blue-600">14 Modules intégrés</Link></li>
            <li><Link href="/about" className="hover:text-blue-600">À propos</Link></li>
            <li><Link href="/register" className="hover:text-blue-600">Créer un compte</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Légal & Confidentialité</h4>
          <ul className="space-y-1.5 text-slate-500 text-xs">
            <li><Link href="/privacy" className="hover:text-blue-600">Politique de confidentialité</Link></li>
            <li><Link href="/terms" className="hover:text-blue-600">Conditions d&apos;utilisation</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
