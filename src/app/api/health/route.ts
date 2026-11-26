import { NextResponse } from "next/server";
import { getGeminiKeyPoolStatus } from "@/lib/ai/service";
import {
  isDemoMode,
  isGeminiConfigured,
  isSupabaseConfigured,
  isSupabaseSecretConfigured,
} from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "CampusMate",
    demoMode: isDemoMode(),
    supabaseConfigured: isSupabaseConfigured(),
    supabaseSecretConfigured: isSupabaseSecretConfigured(),
    geminiConfigured: isGeminiConfigured(),
    geminiPool: getGeminiKeyPoolStatus(),
  });
}
