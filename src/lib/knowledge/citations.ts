import type { AICitation, DocumentChunk } from "@/types/domain";

export interface ValidatedCitation extends AICitation {
  sourceUrl?: string;
  isHistorical?: boolean;
}

/**
 * Validates that every citation corresponds strictly to an authorized retrieved chunk.
 * Rejects any invented documentId or fabricated external URL.
 */
export function buildValidatedCitations(
  retrievedChunks: DocumentChunk[],
  requestedDocIds?: string[]
): ValidatedCitation[] {
  const allowedByDoc = new Map<string, DocumentChunk>();
  for (const ch of retrievedChunks) {
    if (!allowedByDoc.has(ch.documentId)) {
      allowedByDoc.set(ch.documentId, ch);
    }
  }

  const targetIds =
    requestedDocIds && requestedDocIds.length > 0
      ? requestedDocIds.filter((id) => allowedByDoc.has(id))
      : [...allowedByDoc.keys()];

  return targetIds.map((docId) => {
    const ch = allowedByDoc.get(docId)!;
    const urlMatch = ch.content.match(/https:\/\/(?:www\.)?isetb\.rnu\.tn[^\s)]+/i);
    return {
      documentId: ch.documentId,
      documentTitle: ch.documentTitle,
      pageNumber: ch.pageNumber,
      excerpt: ch.content.slice(0, 180) + (ch.content.length > 180 ? "..." : ""),
      sourceScope: ch.sourceScope,
      sourceUrl: urlMatch ? urlMatch[0] : undefined,
      isHistorical: /\[historique/i.test(ch.content),
    };
  });
}
