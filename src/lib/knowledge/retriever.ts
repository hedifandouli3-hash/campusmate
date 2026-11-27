import type { DocumentChunk } from "@/types/domain";

// Multilingual query expansion bridging Arabic, English, and French university terminology
const MULTILINGUAL_SYNONYMS: Array<[RegExp, string[]]> = [
  [/شهادة|التسجيل|الترسيم|certificate|enrollment|registration|attestation|scolarite/i, ["attestation", "inscription", "scolarite", "certificat", "guichet"]],
  [/الاختصاصات|الشعب|التكوين|الاجازة|specializations|programs|degrees|licences|parcours/i, ["licences", "parcours", "dsi", "rsi", "genie", "mecanique", "electrique", "informatique"]],
  [/التربص|تربص|مشروع التخرج|internship|internships|pfe|stage/i, ["stage", "stages", "pfe", "perfectionnement", "initiation"]],
  [/امتحان|امتحانات|رزنامة|الجدول|exam|exams|calendar|calendrier|examen/i, ["examens", "calendrier", "devoirs", "semestre"]],
  [/ادارة|اتصال|هاتف|ايميل|contact|administration|director|directrice|organigramme/i, ["contact", "scolarite", "administration", "direction", "isetb"]],
  [/شكاية|تظلم|ملاحظة|complaint|reclamation|feedback/i, ["reclamation", "reclamations", "boite", "voix"]],
];

export function normalizeMultilingualQuery(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STOP_WORDS = new Set([
  "quel", "quels", "quelle", "quelles", "comment", "pourquoi", "quand", "dans", "avec", "pour",
  "depuis", "vers", "sont", "est", "une", "des", "les", "the", "and", "for", "how", "what", "where",
  "when", "from", "iset", "beja", "tunisie",
]);

export function expandMultilingualTerms(query: string): string[] {
  const normalized = normalizeMultilingualQuery(query);
  const baseTerms = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  const expanded = new Set<string>(baseTerms);
  for (const [pattern, synonyms] of MULTILINGUAL_SYNONYMS) {
    if (pattern.test(query) || pattern.test(normalized)) {
      for (const syn of synonyms) expanded.add(syn);
    }
  }
  return [...expanded];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function hybridRetrieveAndRerank(params: {
  query: string;
  authorizedChunks: DocumentChunk[];
  queryEmbedding?: number[] | null;
  limit?: number;
}): Array<DocumentChunk & { score: number }> {
  const limit = params.limit ?? 4;
  const terms = expandMultilingualTerms(params.query);
  if (terms.length === 0) return [];

  const asksCurrent = /actuel|current|2026|2027|aujourd|الآن|الحالي/i.test(params.query);

  const scored = params.authorizedChunks.map((chunk) => {
    const haystack = normalizeMultilingualQuery(`${chunk.documentTitle} ${chunk.content}`);
    let keywordHits = 0;
    for (const term of terms) {
      if (haystack.includes(term)) keywordHits += 1;
    }
    const lexicalScore = keywordHits / terms.length;
    const titleBoost = terms.some((t) => normalizeMultilingualQuery(chunk.documentTitle).includes(t)) ? 0.15 : 0;
    const vectorScore =
      params.queryEmbedding && chunk.embedding && chunk.embedding.length === params.queryEmbedding.length
        ? Math.max(0, cosineSimilarity(params.queryEmbedding, chunk.embedding))
        : 0;

    // Penalize historical chunks when the user asks about current dates/calendars
    const isHistorical = /\[historique/i.test(chunk.content) || /\b202[0-4][-–/]202[1-5]\b/.test(chunk.content);
    const historicalPenalty = asksCurrent && isHistorical ? -0.35 : 0;

    const combined =
      vectorScore > 0
        ? 0.55 * vectorScore + 0.45 * lexicalScore + titleBoost + historicalPenalty
        : lexicalScore + titleBoost + historicalPenalty;

    return { ...chunk, score: Number(combined.toFixed(4)) };
  });

  return scored
    .filter((c) => c.score >= 0.18)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
