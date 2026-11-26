import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured, isSupabaseSecretConfigured } from "@/lib/env";
import type { CampusMateStoreState } from "@/lib/demo/seed";

export type PersistenceMode = "supabase_postgres" | "demo_local" | "ephemeral_unconfigured";

export function getPersistenceMode(): PersistenceMode {
  if (isSupabaseSecretConfigured()) {
    return "supabase_postgres";
  }
  if (isDemoMode() || process.env.VITEST || process.env.NODE_ENV !== "production") {
    return "demo_local";
  }
  return "ephemeral_unconfigured";
}

export function getPersistenceDiagnostics() {
  const mode = getPersistenceMode();
  const missingEnv: string[] = [];
  if (!isSupabaseConfigured()) {
    missingEnv.push("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  if (!isSupabaseSecretConfigured()) {
    missingEnv.push("SUPABASE_SECRET_KEY");
  }
  return {
    mode,
    durable: mode === "supabase_postgres",
    supabaseConfigured: isSupabaseConfigured(),
    supabaseSecretConfigured: isSupabaseSecretConfigured(),
    missingEnv,
  };
}

const SNAPSHOT_KEY = "campusmate-v2-primary";

export async function syncSnapshotToSupabase(state: CampusMateStoreState): Promise<boolean> {
  const client = createSupabaseServiceClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from("campusmate_state_snapshots")
      .upsert(
        {
          snapshot_key: SNAPSHOT_KEY,
          payload: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "snapshot_key" }
      );
    return !error;
  } catch {
    return false;
  }
}

export async function loadSnapshotFromSupabase(): Promise<CampusMateStoreState | null> {
  const client = createSupabaseServiceClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("campusmate_state_snapshots")
      .select("payload")
      .eq("snapshot_key", SNAPSHOT_KEY)
      .maybeSingle();
    if (error || !data?.payload) return null;
    return data.payload as CampusMateStoreState;
  } catch {
    return null;
  }
}

export async function uploadPrivateFileToStorage(params: {
  bucket: "course-materials" | "personal-study-docs" | "knowledge-base" | "admin-documents" | "community-media" | "cv-documents";
  objectPath: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ stored: boolean; signedUrl?: string }> {
  const client = createSupabaseServiceClient();
  if (!client) return { stored: false };
  try {
    const { error } = await client.storage.from(params.bucket).upload(params.objectPath, params.buffer, {
      contentType: params.contentType,
      upsert: true,
    });
    if (error) return { stored: false };
    const { data: signed } = await client.storage.from(params.bucket).createSignedUrl(params.objectPath, 120);
    return { stored: true, signedUrl: signed?.signedUrl };
  } catch {
    return { stored: false };
  }
}

export async function createPrivateSignedDownloadUrl(
  bucket: "course-materials" | "personal-study-docs" | "knowledge-base" | "admin-documents" | "community-media" | "cv-documents",
  objectPath: string,
  expiresInSeconds = 120
): Promise<string | null> {
  const client = createSupabaseServiceClient();
  if (!client) return null;
  try {
    const { data, error } = await client.storage.from(bucket).createSignedUrl(objectPath, expiresInSeconds);
    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
