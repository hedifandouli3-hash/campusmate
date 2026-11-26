import type { Locale } from "@/types/domain";
import { fr, type TranslationDict } from "./fr";
import { en } from "./en";
import { ar } from "./ar";

const dictionaries = { fr, en, ar } as const;

export function getDictionary(locale: Locale): TranslationDict {
  return (dictionaries[locale] ?? fr) as TranslationDict;
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar";
}

export const LOCALE_COOKIE = "campusmate_locale";
export const SUPPORTED_LOCALES: Locale[] = ["fr", "en", "ar"];
