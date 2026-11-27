import crypto from "node:crypto";

const ALLOWED_UNIVERSITY_HOSTS = new Set(["isetb.rnu.tn", "www.isetb.rnu.tn"]);

const SPAM_PATTERNS =
  /\b(casino|1xbet|slot|togel|jackpot|betting|poker|roulette|vavada|spinaconda|spinobon|crypto-bonus|viagra|porn)\b/i;

const UNRELATED_INSTITUTION_PATTERNS =
  /\b(fsegt|faculté des sciences économiques et de gestion de tunis|iset rad[eè]s|iset nabeul|iset sfax)\b/i;

const HISTORICAL_YEAR_PATTERN = /\b(201[5-9]|202[0-4])\s*[-/–]\s*(201[6-9]|202[0-5])\b/;

export type KnowledgeSourceStatus =
  | "discovered"
  | "fetched"
  | "extracted"
  | "pending_review"
  | "approved"
  | "indexed"
  | "historical"
  | "suspicious"
  | "rejected"
  | "superseded"
  | "failed";

export interface SourceValidationResult {
  status: KnowledgeSourceStatus;
  reasons: string[];
  isHistorical: boolean;
  detectedAcademicYear: string | null;
  contentHash: string;
}

export function isAllowedUniversityUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    // Block localhost, IP literals, and non-allowlisted hosts (SSRF protection)
    if (
      host === "localhost" ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      host.includes(":") ||
      !ALLOWED_UNIVERSITY_HOSTS.has(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function validateExtractedSource(params: {
  url: string;
  title: string;
  cleanText: string;
}): SourceValidationResult {
  const reasons: string[] = [];
  const contentHash = crypto.createHash("sha256").update(params.cleanText, "utf8").digest("hex");

  if (!isAllowedUniversityUrl(params.url)) {
    return {
      status: "rejected",
      reasons: ["URL hors domaine officiel autorisé (isetb.rnu.tn)."],
      isHistorical: false,
      detectedAcademicYear: null,
      contentHash,
    };
  }

  if (params.cleanText.length < 60) {
    return {
      status: "rejected",
      reasons: ["Contenu insuffisant ou page vide (< 60 caractères)."],
      isHistorical: false,
      detectedAcademicYear: null,
      contentHash,
    };
  }

  if (SPAM_PATTERNS.test(params.cleanText) || SPAM_PATTERNS.test(params.title)) {
    return {
      status: "rejected",
      reasons: ["Contenu promotionnel/spam détecté et bloqué."],
      isHistorical: false,
      detectedAcademicYear: null,
      contentHash,
    };
  }

  if (UNRELATED_INSTITUTION_PATTERNS.test(params.cleanText)) {
    return {
      status: "rejected",
      reasons: ["Contenu concernant une autre institution (ex: FSEGT) exclu."],
      isHistorical: false,
      detectedAcademicYear: null,
      contentHash,
    };
  }

  const histMatch = params.cleanText.match(HISTORICAL_YEAR_PATTERN) || params.title.match(HISTORICAL_YEAR_PATTERN);
  if (histMatch) {
    return {
      status: "historical",
      reasons: [`Année universitaire antérieure détectée (${histMatch[0]}).`],
      isHistorical: true,
      detectedAcademicYear: histMatch[0],
      contentHash,
    };
  }

  const currentYearMatch = params.cleanText.match(/\b(202[5-7])\s*[-/–]\s*(202[6-8])\b/);
  return {
    status: "approved",
    reasons: reasons.length > 0 ? reasons : ["Source officielle validée."],
    isHistorical: false,
    detectedAcademicYear: currentYearMatch ? currentYearMatch[0] : null,
    contentHash,
  };
}
