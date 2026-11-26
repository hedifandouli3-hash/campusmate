import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider, LocaleSync } from "@/components/providers/app-provider";
import { LOCALE_COOKIE } from "@/lib/i18n";
import type { Locale } from "@/types/domain";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusMate — One Campus. One Platform. Endless Possibilities.",
  description:
    "Écosystème universitaire intelligent propulsé par l'IA pour étudiants, enseignants, administrations et organisations partenaires (ISET Béja — Tunisie).",
};

async function LocaleCookieSync() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const cookieLocale: Locale = raw === "en" || raw === "ar" ? raw : "fr";
  return <LocaleSync locale={cookieLocale} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider initialLocale="fr">
          <Suspense fallback={null}>
            <LocaleCookieSync />
          </Suspense>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
