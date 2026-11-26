import crypto from "node:crypto";
import { chunkPages, neutralizePromptInjection } from "@/lib/ai/document-processor";
import type { DocumentChunk, KnowledgeDocument } from "@/types/domain";

export const OFFICIAL_ISETB_PAGE_SLUGS = [
  { slug: "presentation-generale", category: "presentation", label: "Présentation Générale ISET Béja" },
  { slug: "technologies-de-linformatique", category: "department", label: "Département Technologies de l'Informatique (TI)" },
  { slug: "departements-electrique", category: "department", label: "Département Génie Électrique (GE)" },
  { slug: "licences", category: "academic", label: "Catalogue des Licences & Génie Mécanique" },
  { slug: "organigramme-2", category: "administration", label: "Organigramme & Services ISET Béja" },
  { slug: "mot-de-la-direction", category: "administration", label: "Mot de la Direction & Contacts Officiels" },
  { slug: "mission-vision-et-valeurs-3", category: "strategy", label: "Mission, Vision et Valeurs ISET Béja" },
  { slug: "reclmations", category: "procedure", label: "Politique Officielle de Réclamations ISET Béja" },
] as const;

const SPAM_BLOCKLIST = /\b(casino|1xbet|slot|togel|jackpot|betting|poker|roulette|vavada|spinaconda|spinobon)\b/i;

export function stripHtmlToCleanText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchOfficialIsetBejaPages(params: {
  institutionId: string;
  actorId: string;
}): Promise<{ documents: KnowledgeDocument[]; chunks: DocumentChunk[]; skipped: string[] }> {
  const documents: KnowledgeDocument[] = [];
  const chunks: DocumentChunk[] = [];
  const skipped: string[] = [];
  const now = new Date().toISOString();

  for (const item of OFFICIAL_ISETB_PAGE_SLUGS) {
    try {
      const res = await fetch(
        `https://www.isetb.rnu.tn/wp-json/wp/v2/pages?slug=${encodeURIComponent(item.slug)}`,
        {
          headers: { "User-Agent": "CampusMate-RAG-Indexer/1.0" },
          signal: AbortSignal.timeout(10_000),
        }
      );
      if (!res.ok) {
        skipped.push(item.slug);
        continue;
      }
      const arr = (await res.json()) as Array<{ link?: string; content?: { rendered?: string } }>;
      const page = arr?.[0];
      if (!page?.content?.rendered) {
        skipped.push(item.slug);
        continue;
      }

      const rawText = stripHtmlToCleanText(page.content.rendered);
      if (rawText.length < 60 || SPAM_BLOCKLIST.test(rawText)) {
        skipped.push(item.slug);
        continue;
      }

      const cleanText = neutralizePromptInjection(
        `Source officielle : ${page.link || `https://www.isetb.rnu.tn/${item.slug}/`}\n\n${rawText}`
      );
      const docId = `kb-isetb-${item.slug}`;

      documents.push({
        id: docId,
        institutionId: params.institutionId,
        uploadedBy: params.actorId,
        title: `${item.label} (isetb.rnu.tn)`,
        category: item.category,
        fileName: `isetb-${item.slug}.txt`,
        contentText: cleanText,
        isPublished: true,
        isDemoSample: false,
        processingStatus: "ready",
        createdAt: now,
      });

      const docChunks = chunkPages([{ pageNumber: 1, text: cleanText }], 900, 150);
      for (const ch of docChunks) {
        chunks.push({
          id: `chk-isetb-${item.slug}-${ch.chunkIndex}-${crypto.randomUUID().slice(0, 6)}`,
          institutionId: params.institutionId,
          sourceScope: "knowledge",
          documentId: docId,
          documentTitle: `${item.label} (isetb.rnu.tn)`,
          chunkIndex: ch.chunkIndex,
          pageNumber: ch.pageNumber,
          content: ch.content,
        });
      }
    } catch {
      skipped.push(item.slug);
    }
  }

  return { documents, chunks, skipped };
}
