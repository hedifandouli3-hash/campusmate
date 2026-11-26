# CampusMate Deployment Guide (Supabase + Gemini + Vercel)

## 1. Supabase Setup
1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. In the Supabase **SQL Editor**, run the migration scripts in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_storage.sql`
   - `supabase/migrations/004_seed_iset_beja.sql` (optional sample dataset)
3. Copy `Project URL`, `anon public key`, and `service_role key` (server-only) from **Project Settings → API**.

## 2. Google AI Studio (Gemini API)
1. Create a Gemini API key at [aistudio.google.com](https://aistudio.google.com).
2. Set `GEMINI_API_KEY` in your `.env.local` (or Vercel Environment Variables).
3. Recommended models:
   - `AI_GENERATION_MODEL=gemini-2.5-flash`
   - `AI_EMBEDDING_MODEL=text-embedding-004`

## 3. Vercel Deployment
1. Push your repository to GitHub/GitLab.
2. Import the project into [vercel.com](https://vercel.com).
3. Configure Environment Variables in Vercel:
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Server-only)
   - `GEMINI_API_KEY` (Server-only)
   - `SESSION_SECRET` (32+ random characters)
   - `DEMO_MODE=false` and `ALLOW_DEMO_LOGIN=false` for strict production deployments.
4. Deploy (`npm run build`).
