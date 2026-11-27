import { NextResponse } from "next/server";
import { getGeminiKeyPoolStatus } from "@/lib/ai/service";
import { checkSupabaseHealth, getPersistenceDiagnostics } from "@/lib/data/persistence";
import {
  isDemoMode,
  isGeminiConfigured,
  isSupabaseConfigured,
  isSupabaseSecretConfigured,
} from "@/lib/env";
import { isSessionSecretConfigured } from "@/lib/security/session";

export async function GET() {
  const persistence = getPersistenceDiagnostics();
  const supabaseHealth = await checkSupabaseHealth();
  return NextResponse.json({
    status: "ok",
    app: "CampusMate",
    demoMode: isDemoMode(),
    sessionSecretConfigured: isSessionSecretConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    supabaseSecretConfigured: isSupabaseSecretConfigured(),
    supabaseHealth,
    persistence: {
      mode: persistence.mode,
      durable: persistence.durable,
      missingEnvCount: persistence.missingEnv.length,
    },
    geminiConfigured: isGeminiConfigured(),
    geminiPool: getGeminiKeyPoolStatus(),
  });
}
