export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "",
  supabaseServiceRoleKey:
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "",
  supabaseJwksUrl: process.env.SUPABASE_JWKS_URL || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiApiKeys: process.env.GEMINI_API_KEYS || "",
  aiProvider: process.env.AI_PROVIDER || "gemini",
  aiGenerationModel: process.env.AI_GENERATION_MODEL || "gemini-3.5-flash-lite",
  aiFallbackModel: process.env.AI_FALLBACK_MODEL || "gemini-3.8-flash",
  aiEmbeddingModel: process.env.AI_EMBEDDING_MODEL || "gemini-embedding-001",
  demoModeFlag: process.env.DEMO_MODE ?? process.env.NEXT_PUBLIC_DEMO_MODE ?? "false",
  allowDemoLogin: process.env.ALLOW_DEMO_LOGIN ?? "false",
  sessionSecret: process.env.SESSION_SECRET || "campusmate-local-dev-secret-change-in-prod",
  chatEncryptionKey: process.env.CHAT_ENCRYPTION_KEY || "",
};

export function getGeminiApiKeys(): string[] {
  const combined = [
    ...(env.geminiApiKeys ? env.geminiApiKeys.split(",") : []),
    ...(env.geminiApiKey ? [env.geminiApiKey] : []),
  ]
    .map((k) => k.trim())
    .filter((k) => k.length > 10);

  return [...new Set(combined)];
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isSupabaseSecretConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey && !env.supabaseServiceRoleKey.includes("•"));
}

export function isGeminiConfigured(): boolean {
  return getGeminiApiKeys().length > 0;
}

export function isDemoMode(): boolean {
  return env.demoModeFlag === "true";
}

export function isDemoLoginAllowed(): boolean {
  return env.allowDemoLogin === "true";
}
