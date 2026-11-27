import crypto from "node:crypto";
import { chunkPages, neutralizePromptInjection } from "@/lib/ai/document-processor";
import { stripHtmlToCleanText } from "@/lib/ai/isetb-sync";
import { isAllowedUniversityUrl, validateExtractedSource, type KnowledgeSourceStatus } from "@/lib/knowledge/validator";
import type { DocumentChunk, KnowledgeDocument } from "@/types/domain";

export const OFFICIAL_ISETB_SEED_URLS = [
  "https://www.isetb.rnu.tn/",
  "https://www.isetb.rnu.tn/licences/",
  "https://www.isetb.rnu.tn/licence/",
  "https://www.isetb.rnu.tn/stages-et-pfe/",
  "https://www.isetb.rnu.tn/organigramme-de-formation/",
  "https://www.isetb.rnu.tn/contact-2/",
  "https://www.isetb.rnu.tn/departements-5/",
] as const;

export interface CrawledSourceInventoryItem {
  url: string;
  canonicalUrl: string;
  title: string;
  category: string;
  status: KnowledgeSourceStatus;
  isHistorical: boolean;
  detectedAcademicYear: string | null;
  contentHash: string;
  reasons: string[];
  fetchedAt: string;
}

export async function runControlledIsetbSync(params: {
  institutionId: string;
  actorId: string;
  maxPages?: number;
}): Promise<{
  documents: KnowledgeDocument[];
  chunks: DocumentChunk[];
  inventory: CrawledSourceInventoryItem[];
  rejectedCount: number;
  historicalCount: number;
  failedCount: number;
}> {
  const maxPages = Math.min(20, Math.max(1, params.maxPages ?? 12));
  const visited = new Set<string>();
  const documents: KnowledgeDocument[] = [];
  const chunks: DocumentChunk[] = [];
  const inventory: CrawledSourceInventoryItem[] = [];
  let rejectedCount = 0;
  let historicalCount = 0;
  let failedCount = 0;
  const now = new Date().toISOString();

  for (const seedUrl of OFFICIAL_ISETB_SEED_URLS.slice(0, maxPages)) {
    const normalized = seedUrl.replace(/\/+$/, "/");
    if (visited.has(normalized) || !isAllowedUniversityUrl(normalized)) continue;
    visited.add(normalized);

    try {
      const res = await fetch(normalized, {
        headers: { "User-Agent": "CampusMate-RAG-Indexer/2.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok || !isAllowedUniversityUrl(res.url || normalized)) {
        failedCount += 1;
        inventory.push({
          url: normalized,
          canonicalUrl: res.url || normalized,
          title: normalized,
          category: "official",
          status: "failed",
          isHistorical: false,
          detectedAcademicYear: null,
          contentHash: "",
          reasons: [`HTTP ${res.status}`],
          fetchedAt: now,
        });
        continue;
      }

      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = stripHtmlToCleanText(titleMatch?.[1] || normalized).slice(0, 140);
      // Extract main/article content if present, stripping scripts/styles/nav/footer
      const strippedHtml = html
        .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
        .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
        .replace(/<header[\s\S]*?<\/header>/gi, " ");
      const cleanText = neutralizePromptInjection(stripHtmlToCleanText(strippedHtml));
      const validation = validateExtractedSource({ url: res.url || normalized, title, cleanText });

      inventory.push({
        url: normalized,
        canonicalUrl: res.url || normalized,
        title,
        category: normalized.includes("licence")
          ? "academic"
          : normalized.includes("stage")
            ? "internships"
            : normalized.includes("contact")
              ? "contacts"
              : "presentation",
        status: validation.status,
        isHistorical: validation.isHistorical,
        detectedAcademicYear: validation.detectedAcademicYear,
        contentHash: validation.contentHash,
        reasons: validation.reasons,
        fetchedAt: now,
      });

      if (validation.status === "rejected") {
        rejectedCount += 1;
        continue;
      }
      if (validation.status === "historical") {
        historicalCount += 1;
      }

      const docId = `kb-crawl-${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`;
      const finalContent = `Source officielle : ${res.url || normalized}\n${validation.isHistorical ? `[HISTORIQUE ${validation.detectedAcademicYear || ""}]\n` : ""}\n${cleanText}`;

      documents.push({
        id: docId,
        institutionId: params.institutionId,
        uploadedBy: params.actorId,
        title: `${title} (isetb.rnu.tn)`,
        category: validation.isHistorical ? "historical" : "official",
        fileName: `${docId}.txt`,
        contentText: finalContent,
        isPublished: validation.status === "approved",
        isDemoSample: false,
        processingStatus: "ready",
        createdAt: now,
      });

      if (validation.status === "approved") {
        const docChunks = chunkPages([{ pageNumber: 1, text: finalContent }], 900, 150);
        for (const ch of docChunks) {
          chunks.push({
            id: `chk-${docId}-${ch.chunkIndex}`,
            institutionId: params.institutionId,
            sourceScope: "knowledge",
            documentId: docId,
            documentTitle: `${title} (isetb.rnu.tn)`,
            chunkIndex: ch.chunkIndex,
            pageNumber: ch.pageNumber,
            content: ch.content,
          });
        }
      }
    } catch {
      failedCount += 1;
      inventory.push({
        url: normalized,
        canonicalUrl: normalized,
        title: normalized,
        category: "official",
        status: "failed",
        isHistorical: false,
        detectedAcademicYear: null,
        contentHash: "",
        reasons: ["Erreur réseau ou timeout lors de la récupération."],
        fetchedAt: now,
      });
    }
  }

  return { documents, chunks, inventory, rejectedCount, historicalCount, failedCount };
}
