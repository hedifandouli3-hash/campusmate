import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string, locale: "fr" | "en" | "ar" = "fr"): string {
  try {
    const map = { fr: "fr-TN", en: "en-US", ar: "ar-TN" } as const;
    return new Intl.DateTimeFormat(map[locale], {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string, locale: "fr" | "en" | "ar" = "fr"): string {
  try {
    const map = { fr: "fr-TN", en: "en-US", ar: "ar-TN" } as const;
    return new Intl.DateTimeFormat(map[locale], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function sanitizeText(input: string, maxLength = 4000): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}
