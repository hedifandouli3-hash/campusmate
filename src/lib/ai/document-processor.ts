import JSZip from "jszip";
import mammoth from "mammoth";
import { extractText } from "unpdf";

export const ALLOWED_DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/markdown",
]);

export const MAX_DOC_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface ExtractedDocumentResult {
  text: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
  isScannedLikely: boolean;
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /system\s*prompt\s*:/gi,
  /you\s+are\s+now\s+in\s+developer\s+mode/gi,
  /reveal\s+(your\s+)?(api\s+key|system\s+instructions|secrets)/gi,
];

export function neutralizePromptInjection(raw: string): string {
  let clean = raw.replace(/\u0000/g, "").replace(/\r\n/g, "\n");
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, "[filtered-untrusted-directive]");
  }
  return clean.trim();
}

export async function extractDocumentContent(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedDocumentResult> {
  const lower = fileName.toLowerCase();

  if (mimeType === "text/plain" || mimeType === "text/markdown" || lower.endsWith(".txt") || lower.endsWith(".md")) {
    const raw = neutralizePromptInjection(buffer.toString("utf8"));
    return {
      text: raw,
      pageCount: Math.max(1, Math.ceil(raw.length / 2200)),
      pages: [{ pageNumber: 1, text: raw }],
      isScannedLikely: raw.length < 15,
    };
  }

  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) {
    const uint8 = new Uint8Array(buffer);
    const result = await extractText(uint8, { mergePages: false });
    const rawPages = Array.isArray(result.text) ? result.text : [String(result.text || "")];
    const pages = rawPages.map((pageText, idx) => ({
      pageNumber: idx + 1,
      text: neutralizePromptInjection(pageText),
    }));
    const fullText = pages.map((p) => p.text).join("\n\n").trim();
    return {
      text: fullText,
      pageCount: Math.max(1, result.totalPages || pages.length),
      pages,
      isScannedLikely: fullText.length < 30,
    };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    const clean = neutralizePromptInjection(value || "");
    const pageCount = Math.max(1, Math.ceil(clean.length / 2400));
    return {
      text: clean,
      pageCount,
      pages: [{ pageNumber: 1, text: clean }],
      isScannedLikely: clean.length < 20,
    };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lower.endsWith(".pptx")
  ) {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const na = Number(a.match(/slide(\d+)\.xml/)?.[1] || 0);
        const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] || 0);
        return na - nb;
      });

    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.files[slideFiles[i]].async("text");
      const matches = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]);
      const slideText = neutralizePromptInjection(matches.join(" "));
      if (slideText) {
        pages.push({ pageNumber: i + 1, text: slideText });
      }
    }
    const fullText = pages.map((p) => `[Slide ${p.pageNumber}] ${p.text}`).join("\n\n");
    return {
      text: fullText,
      pageCount: Math.max(1, slideFiles.length),
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: "" }],
      isScannedLikely: fullText.length < 20,
    };
  }

  throw new Error("Unsupported file format. Please upload PDF, DOCX, PPTX, or TXT.");
}

export function chunkPages(
  pages: Array<{ pageNumber: number; text: string }>,
  chunkSize = 900,
  overlap = 150
): Array<{ chunkIndex: number; pageNumber: number; content: string }> {
  const chunks: Array<{ chunkIndex: number; pageNumber: number; content: string }> = [];
  let idx = 0;

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;
    let start = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + chunkSize);
      const slice = text.slice(start, end).trim();
      if (slice.length > 20) {
        chunks.push({
          chunkIndex: idx++,
          pageNumber: page.pageNumber,
          content: slice,
        });
      }
      if (end === text.length) break;
      start = Math.max(0, end - overlap);
    }
  }
  return chunks;
}
