"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getDictionary, isRtlLocale } from "@/lib/i18n";
import type { TranslationDict } from "@/lib/i18n/fr";
import type { Locale } from "@/types/domain";

interface ToastItem {
  id: string;
  title: string;
  type: "success" | "error" | "info";
}

interface AppContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => Promise<void>;
  hydrateLocale: (loc: Locale) => void;
  t: TranslationDict;
  isRtl: boolean;
  dark: boolean;
  toggleTheme: () => void;
  notify: (title: string, type?: "success" | "error" | "info") => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  initialLocale = "fr",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dark, setDark] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("campusmate_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      const id = setTimeout(() => setDark(true), 0);
      return () => clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback(async (loc: Locale) => {
    setLocaleState(loc);
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: loc }),
    }).catch(() => {});
  }, []);

  const hydrateLocale = useCallback((loc: Locale) => {
    setLocaleState((prev) => (prev === loc ? prev : loc));
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      localStorage.setItem("campusmate_theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const notify = useCallback((title: string, type: "success" | "error" | "info" = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const t = getDictionary(locale);
  const isRtl = isRtlLocale(locale);

  return (
    <AppContext.Provider value={{ locale, setLocale, hydrateLocale, t, isRtl, dark, toggleTheme, notify }}>
      {children}
      {/* Accessible Toast Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg border ${
              toast.type === "error"
                ? "bg-rose-600 text-white border-rose-700"
                : toast.type === "success"
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-slate-900 text-white border-slate-700"
            }`}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function LocaleSync({ locale }: { locale: Locale }) {
  const { hydrateLocale } = useApp();
  useEffect(() => {
    const id = setTimeout(() => hydrateLocale(locale), 0);
    return () => clearTimeout(id);
  }, [locale, hydrateLocale]);
  return null;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
