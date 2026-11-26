import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {
  buildInitialDemoState,
  type CampusMateStoreState,
  type DemoAccountRecord,
} from "@/lib/demo/seed";
import { getServerSession, hashPassword, verifyPassword } from "@/lib/security/session";
import type {
  CourseDocument,
  DocumentChunk,
  DocumentRequest,
  Locale,
  UserProfile,
  UserRole,
} from "@/types/domain";

const STORE_FILE = path.join(os.tmpdir(), "campusmate-demo-store-v2.json");

declare global {
  var __campusmateStore: CampusMateStoreState | undefined;
}

function loadFromDisk(): CampusMateStoreState {
  if (globalThis.__campusmateStore) {
    return globalThis.__campusmateStore;
  }
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw) as CampusMateStoreState;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.institutions)) {
        globalThis.__campusmateStore = parsed;
        return parsed;
      }
    }
  } catch {
    // Re-seed cleanly if disk cache was corrupted
  }
  const initial = buildInitialDemoState();
  globalThis.__campusmateStore = initial;
  persistToDisk(initial);
  return initial;
}

export function persistToDisk(state: CampusMateStoreState): void {
  globalThis.__campusmateStore = state;
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(state), "utf8");
  } catch {
    // Ignore read-only fs environments (e.g., some serverless runtimes)
  }
}

export function getStore(): CampusMateStoreState {
  return loadFromDisk();
}

export function resetDemoStore(): CampusMateStoreState {
  const fresh = buildInitialDemoState();
  persistToDisk(fresh);
  return fresh;
}

export function toPublicProfile(record: DemoAccountRecord): UserProfile {
  const { passwordHash: _ignored, ...profile } = record;
  void _ignored;
  return profile;
}

export function toSafeDirectoryProfile(record: DemoAccountRecord): Omit<UserProfile, "enrollmentReference"> {
  const profile = toPublicProfile(record);
  const { enrollmentReference: _privateRef, ...safe } = profile;
  void _privateRef;
  return safe;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const session = await getServerSession();
  if (!session) return null;
  const store = getStore();
  const user = store.users.find((u) => u.id === session.userId);
  if (!user || user.isSuspended) return null;
  return toPublicProfile(user);
}

export async function requireUser(allowedRoles?: UserRole[]): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function authenticateUser(email: string, password: string): UserProfile | null {
  const store = getStore();
  const user = store.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.isSuspended) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return toPublicProfile(user);
}

export function registerStudentOrOrg(input: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "organization";
  institutionId?: string | null;
  sectionId?: string;
  organizationName?: string;
  locale?: Locale;
}): { user?: UserProfile; error?: string } {
  const store = getStore();
  const normalizedEmail = input.email.trim().toLowerCase();
  if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    return { error: "Un compte existe déjà avec cet e-mail." };
  }

  const inst = store.institutions.find((i) => i.id === input.institutionId) || store.institutions[0];
  const section = store.sections.find((s) => s.id === input.sectionId) || store.sections[0];
  const id = `usr-${crypto.randomUUID()}`;

  let orgId: string | undefined;
  let orgName: string | undefined;

  if (input.role === "organization") {
    orgId = `org-${crypto.randomUUID()}`;
    orgName = input.organizationName?.trim() || input.fullName;
    store.organizations.push({
      id: orgId,
      name: orgName,
      orgType: "company",
      sector: "Technologie & Services",
      city: "Tunisie",
      contactEmail: normalizedEmail,
      description: "Organisation nouvellement inscrite en attente de vérification.",
      verificationStatus: "pending",
      createdAt: new Date().toISOString(),
    });
  }

  const newRecord: DemoAccountRecord = {
    id,
    institutionId: input.role === "student" ? inst.id : null,
    institutionName: input.role === "student" ? inst.name : undefined,
    email: normalizedEmail,
    passwordHash: hashPassword(input.password),
    fullName: input.fullName.trim(),
    role: input.role,
    preferredLanguage: input.locale ?? "fr",
    isVerified: input.role === "student",
    isSuspended: false,
    isAdult: true,
    interests: [],
    skills: [],
    departmentId: input.role === "student" ? section?.departmentId : undefined,
    sectionId: input.role === "student" ? section?.id : undefined,
    sectionName: input.role === "student" ? section?.name : undefined,
    academicYearId: input.role === "student" ? section?.academicYearId : undefined,
    academicYearLabel: input.role === "student" ? "2ème Année Licence" : undefined,
    enrollmentReference: input.role === "student" ? `CM-${Date.now().toString().slice(-6)}` : undefined,
    organizationId: orgId,
    organizationName: orgName,
    isDemoAccount: false,
  };

  store.users.push(newRecord);

  // Auto-enroll verified student into relevant academic chat groups in same institution
  if (input.role === "student" && newRecord.institutionId) {
    for (const grp of store.chatGroups) {
      if (
        grp.institutionId === newRecord.institutionId &&
        (grp.sectionId === newRecord.sectionId ||
          grp.departmentId === newRecord.departmentId ||
          grp.academicYearId === newRecord.academicYearId)
      ) {
        if (!grp.memberIds.includes(id)) {
          grp.memberIds.push(id);
        }
      }
    }
  }

  store.auditLogs.unshift({
    id: `aud-${crypto.randomUUID()}`,
    institutionId: newRecord.institutionId ?? undefined,
    actorId: id,
    actorName: newRecord.fullName,
    action: "USER_REGISTERED",
    resourceType: "profile",
    resourceId: id,
    details: `Inscription réussie (${input.role}).`,
    createdAt: new Date().toISOString(),
  });

  persistToDisk(store);
  return { user: toPublicProfile(newRecord) };
}

export function addNotification(params: {
  institutionId: string | null;
  userId: string;
  category: string;
  title: string;
  body: string;
  actionUrl?: string;
}): void {
  const store = getStore();
  store.notifications.unshift({
    id: `notif-${crypto.randomUUID()}`,
    institutionId: params.institutionId || "global",
    userId: params.userId,
    category: params.category,
    title: params.title,
    body: params.body,
    actionUrl: params.actionUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
  persistToDisk(store);
}

export function addAuditLog(params: {
  institutionId?: string | null;
  actorId?: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: string;
}): void {
  const store = getStore();
  store.auditLogs.unshift({
    id: `aud-${crypto.randomUUID()}`,
    institutionId: params.institutionId ?? undefined,
    actorId: params.actorId,
    actorName: params.actorName,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: params.details,
    createdAt: new Date().toISOString(),
  });
  persistToDisk(store);
}

// Tenant-isolated & permission-enforced RAG chunk selector
export function getAuthorizedChunksForUser(params: {
  user: UserProfile;
  scope: "learning" | "university_assistant";
  subjectId?: string;
  courseDocumentId?: string;
}): DocumentChunk[] {
  const store = getStore();
  if (!params.user.institutionId) return [];

  if (params.scope === "university_assistant") {
    const publishedKnowledgeIds = new Set(
      store.knowledgeDocuments
        .filter((k) => k.institutionId === params.user.institutionId && k.isPublished)
        .map((k) => k.id)
    );
    return store.documentChunks.filter(
      (c) =>
        c.institutionId === params.user.institutionId &&
        c.sourceScope === "knowledge" &&
        publishedKnowledgeIds.has(c.documentId)
    );
  }

  // Learning scope: strictly filter BEFORE retrieval!
  // Never include unpublished or teacher-only documents for students.
  const allowedCourseDocIds = new Set(
    store.courseDocuments
      .filter((d) => {
        if (d.institutionId !== params.user.institutionId) return false;
        if (params.courseDocumentId && d.id !== params.courseDocumentId) return false;
        if (params.subjectId && d.subjectId !== params.subjectId) return false;
        if (params.user.role === "teacher" && d.uploadedBy === params.user.id) return true;
        if (params.user.role === "university_admin") return true;
        return d.isPublished && !d.isTeacherOnly && d.processingStatus === "ready";
      })
      .map((d) => d.id)
  );

  return store.documentChunks.filter((c) => {
    if (c.institutionId !== params.user.institutionId) return false;
    if (c.sourceScope === "course") {
      return allowedCourseDocIds.has(c.documentId);
    }
    if (c.sourceScope === "personal") {
      return c.ownerId === params.user.id && (!params.subjectId || c.subjectId === params.subjectId);
    }
    return false;
  });
}

export function getVisibleCourseDocuments(user: UserProfile): CourseDocument[] {
  const store = getStore();
  if (user.role === "super_admin") return store.courseDocuments;
  if (!user.institutionId) return [];

  return store.courseDocuments.filter((doc) => {
    if (doc.institutionId !== user.institutionId) return false;
    if (user.role === "teacher") {
      return doc.uploadedBy === user.id || (doc.isPublished && !doc.isTeacherOnly);
    }
    if (user.role === "university_admin") return true;
    // Students only see published, non-teacher-only docs
    return doc.isPublished && !doc.isTeacherOnly;
  });
}

export function getVisibleDocumentRequests(user: UserProfile): DocumentRequest[] {
  const store = getStore();
  if (user.role === "super_admin") return store.documentRequests;
  if (user.role === "university_admin") {
    return store.documentRequests.filter((r) => r.institutionId === user.institutionId);
  }
  return store.documentRequests.filter(
    (r) => r.studentId === user.id && r.institutionId === user.institutionId
  );
}
