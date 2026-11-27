import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env, isSupabaseSecretConfigured } from "@/lib/env";
import type { UserRole } from "@/types/domain";

export const SESSION_COOKIE_NAME = "campusmate_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
  sessionVersion?: number;
  exp: number;
}

function hasExplicitSessionSecret(): boolean {
  const secret = env.sessionSecret;
  return !(
    secret === "campusmate-local-dev-secret-change-in-prod" ||
    secret === "replace-with-secure-random-32-char-secret" ||
    secret.length < 24
  );
}

export function isSessionSecretConfigured(): boolean {
  return hasExplicitSessionSecret() || isSupabaseSecretConfigured();
}

export function getSecret(): string {
  if (hasExplicitSessionSecret()) {
    return env.sessionSecret;
  }
  // If SESSION_SECRET wasn't explicitly set in production, derive a strong domain-separated
  // key from the server-only SUPABASE_SECRET_KEY so sessions remain cryptographically unique.
  if (isSupabaseSecretConfigured()) {
    return crypto
      .createHmac("sha256", env.supabaseServiceRoleKey)
      .update("campusmate-session-v1")
      .digest("hex");
  }
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.VITEST &&
    env.demoModeFlag !== "true"
  ) {
    throw new Error("SESSION_SECRET_MISCONFIGURED");
  }
  return env.sessionSecret;
}

export function signSessionToken(payload: Omit<SessionPayload, "exp">, ttlSeconds = 60 * 60 * 24 * 7): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.userId || !parsed.role || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(expected, "hex"));
}

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(raw);
}

export async function setServerSessionCookie(payload: Omit<SessionPayload, "exp">): Promise<void> {
  const token = signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearServerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student/home";
    case "teacher":
      return "/teacher/dashboard";
    case "university_admin":
      return "/administration/dashboard";
    case "organization":
      return "/organization/dashboard";
    case "super_admin":
      return "/admin/dashboard";
  }
}
