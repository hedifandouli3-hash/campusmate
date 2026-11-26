import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/components/providers/app-provider";
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
    "Écosystème universitaire intelligent propulsé par l'IA pour étudiants, enseignants, administrations et organisations partenaires (Démo ISET Béja).",
};

async function LocaleProviderGate({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const initialLocale: Locale = raw === "en" || raw === "ar" ? raw : "fr";
  return <AppProvider initialLocale={initialLocale}>{children}</AppProvider>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<AppProvider initialLocale="fr">{children}</AppProvider>}>
          <LocaleProviderGate>{children}</LocaleProviderGate>
        </Suspense>
      </body>
    </html>
  );
}
