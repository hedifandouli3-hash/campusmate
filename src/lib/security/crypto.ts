import crypto from "node:crypto";
import { env, isSupabaseSecretConfigured } from "@/lib/env";

const ENCRYPTION_PREFIX = "cmv1";

function deriveChatKey(): Buffer {
  const explicitSecret =
    env.sessionSecret !== "campusmate-local-dev-secret-change-in-prod" &&
    env.sessionSecret !== "replace-with-secure-random-32-char-secret" &&
    env.sessionSecret.length >= 24
      ? env.sessionSecret
      : "";
  const material =
    env.chatEncryptionKey ||
    explicitSecret ||
    (isSupabaseSecretConfigured()
      ? crypto.createHmac("sha256", env.supabaseServiceRoleKey).update("campusmate-chat-v1").digest("hex")
      : env.sessionSecret);
  return Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(material, "utf8"),
      Buffer.from("campusmate-chat-salt-v2", "utf8"),
      Buffer.from("academic-group-message-aead", "utf8"),
      32
    )
  );
}

/**
 * Server-side application-layer authenticated encryption (AES-256-GCM) for stored chat payloads.
 * Note: This protects stored chat payloads at rest using server-managed keys and supports
 * institutional moderation and group membership enforcement. It is NOT client-held E2EE.
 */
export function encryptChatPayload(plaintext: string): string {
  const key = deriveChatKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTION_PREFIX}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptChatPayload(stored: string): string {
  if (!stored.startsWith(`${ENCRYPTION_PREFIX}:`)) {
    return stored;
  }
  const parts = stored.split(":");
  if (parts.length !== 4) return stored;
  try {
    const [, ivB64, tagB64, dataB64] = parts;
    const key = deriveChatKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "[Contenu chiffré indisponible]";
  }
}

export function isEncryptedChatPayload(value: string): boolean {
  return value.startsWith(`${ENCRYPTION_PREFIX}:`);
}

export function sanitizeRedirectPath(input: string | null | undefined, fallback = "/"): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  if (/^[\s\S]*[\r\n]/.test(trimmed)) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function isSafeHttpUrl(raw: string | null | undefined): boolean {
  if (!raw || !raw.trim()) return true;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function sanitizeDownloadFilename(name: string, fallback = "document.txt"): string {
  const cleaned = name
    .replace(/[\r\n"\\/;:*?<>|]/g, "_")
    .replace(/\s+/g, "-")
    .slice(0, 90);
  return cleaned || fallback;
}

export function verifyDocumentMagicBytes(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): { valid: boolean; reason?: string } {
  if (buffer.length === 0) {
    return { valid: false, reason: "Le fichier importé est vide." };
  }
  const headText = buffer.subarray(0, 256).toString("utf8").trimStart().toLowerCase();
  if (headText.startsWith("<svg") || headText.includes("<script")) {
    return { valid: false, reason: "Les fichiers actifs ou SVG ne sont pas autorisés." };
  }
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    const pdfMagic = buffer.subarray(0, 5).toString("ascii");
    if (pdfMagic !== "%PDF-") {
      return { valid: false, reason: "Signature PDF invalide." };
    }
  } else if (
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".pptx") ||
    mimeType.includes("officedocument")
  ) {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return { valid: false, reason: "Signature archive Office (DOCX/PPTX) invalide." };
    }
  } else if (lowerName.endsWith(".png") || mimeType === "image/png") {
    const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    if (!buffer.subarray(0, 4).equals(pngSig)) {
      return { valid: false, reason: "Signature PNG invalide." };
    }
  } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || mimeType === "image/jpeg") {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      return { valid: false, reason: "Signature JPEG invalide." };
    }
  }
  return { valid: true };
}
