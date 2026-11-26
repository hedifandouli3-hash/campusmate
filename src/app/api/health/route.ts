import { NextResponse } from "next/server";
import { getGeminiKeyPoolStatus } from "@/lib/ai/service";
import { getPersistenceDiagnostics } from "@/lib/data/persistence";
import {
  isDemoMode,
  isGeminiConfigured,
  isSupabaseConfigured,
  isSupabaseSecretConfigured,
} from "@/lib/env";

export async function GET() {
  const persistence = getPersistenceDiagnostics();
  return NextResponse.json({
    status: "ok",
    app: "CampusMate",
    demoMode: isDemoMode(),
    supabaseConfigured: isSupabaseConfigured(),
    supabaseSecretConfigured: isSupabaseSecretConfigured(),
    persistence: {
      mode: persistence.mode,
      durable: persistence.durable,
      missingEnvCount: persistence.missingEnv.length,
    },
    geminiConfigured: isGeminiConfigured(),
    geminiPool: getGeminiKeyPoolStatus(),
  });
}
