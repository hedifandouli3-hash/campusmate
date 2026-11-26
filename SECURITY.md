# CampusMate Security & Privacy Architecture

## 1. Authentication & Session Security
- Passwords hashed with Node.js `crypto.scryptSync` + 16-byte random salt and verified with `crypto.timingSafeEqual`.
- Session cookies (`campusmate_session`) are `HttpOnly`, `SameSite=Lax`, `Secure` in production, and signed with HMAC-SHA256 (`SESSION_SECRET`).
- Public registration (`/api/auth/register`) strictly permits only `student` and `organization` roles; privileged roles (`teacher`, `university_admin`, `super_admin`) can never be self-assigned.

## 2. Authorization & Multi-Tenant Isolation
- **Server-Side Enforcement:** Every API handler calls `requireUser(allowedRoles)` and checks `institutionId` ownership.
- **Database Enforcement (Supabase):** `supabase/migrations/002_rls.sql` enables Row Level Security on all tables and enforces `current_user_institution()` and `current_user_role()`.
- **Organization Isolation:** Organizations can only read/update internship applications belonging to their own offers. Unverified organizations cannot publish public internship offers.
- **Confidentiality:**
  - Student `enrollmentReference` is stripped from directory responses (`toSafeDirectoryProfile`).
  - Confidential `feedback_reports` are visible only to the author and authorized administrators of that institution.
  - Academic group chats require verified group membership within the same institution.

## 3. AI & Document Security
- Uploaded documents are treated as untrusted input; prompt-injection patterns are filtered before chunking.
- Draft and teacher-only correction files (`isPublished=false` or `isTeacherOnly=true`) are filtered out *before* RAG chunk retrieval, preventing data leakage through AI prompts.
- System prompts and server-side API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are never exposed to client bundles.
- Sliding-window rate limiting (`src/lib/security/rate-limit.ts`) protects login, registration, AI, and chat endpoints.
