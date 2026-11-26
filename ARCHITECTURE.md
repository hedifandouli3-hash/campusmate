# CampusMate Architecture

## 1. High-Level System Design

CampusMate is structured as a unified Next.js App Router full-stack application with:
- **Public Marketing & Auth Layer:** `/`, `/features`, `/about`, `/login`, `/register`, `/forgot-password`, `/privacy`, `/terms`.
- **Optimistic Edge/Proxy Gate (`src/proxy.ts`):** Redirects unauthenticated visitors away from `/student/*`, `/teacher/*`, `/administration/*`, `/organization/*`, and `/admin/*`.
- **Server-Side Role Layouts (`src/components/layout/role-layout.tsx`):** Enforces authenticated session + exact `role` match inside `<Suspense>` boundaries compatible with Next.js 16 `cacheComponents`.
- **Typed API Route Handlers (`src/app/api/*`):** Every mutation and read validates inputs with Zod, enforces `requireUser(...)` and `institutionId` tenant scoping, and emits notifications + audit logs.

---

## 2. Multi-Tenant Academic Hierarchy

```
Institution (e.g., ISET Béja, ISET Radès)
 └── Department (e.g., TI, GE)
      └── Specialization (e.g., DSI, RSI)
           └── Academic Year (1ère, 2ème, 3ème Année)
                └── Academic Section (e.g., TI2-DSI-A)
                     └── Subject (e.g., TI-201 Web Full-Stack)
                          └── Course & Course Documents
```

All institution-scoped entities carry `institution_id`. Cross-institution queries are blocked both at the application Data Access Layer (`src/lib/data/store.ts`) and in PostgreSQL Row Level Security (`supabase/migrations/002_rls.sql`).

---

## 3. Centralized AI & RAG Pipeline (`src/lib/ai/`)

1. **Document Ingestion (`document-processor.ts`):**
   - Validates MIME type (`PDF`, `DOCX`, `PPTX`, `TXT`, `MD`) and file size (max 20 MB).
   - Extracts text & page numbers via `unpdf`, `mammoth`, and `jszip`.
   - Detects scanned PDFs without extractable text and returns an explicit `422` error instead of pretending indexing succeeded.
   - Neutralizes prompt-injection directives (`neutralizePromptInjection`).
   - Splits content into overlapping page-attributed chunks (`chunkPages`).
2. **Permission-First Retrieval (`getAuthorizedChunksForUser`):**
   - Separates `course`, `personal`, and `knowledge` scopes.
   - Excludes unpublished (`isPublished === false`) and `isTeacherOnly === true` documents *before* retrieval.
   - Filters strictly by `institutionId` and ownership (`personal` scope).
3. **Provider Abstraction (`service.ts`):**
   - Uses `@google/genai` (`GEMINI_API_KEY`, `gemini-2.5-flash`, `text-embedding-004`) when configured.
   - Uses a deterministic, clearly labeled **Demo AI Fallback** (`isDemoFallback: true`) when no external API key is configured.

---

## 4. Database Migrations (`supabase/migrations/`)

- `001_schema.sql`: Complete normalized relational schema + `vector(768)` (`pgvector`) + `match_authorized_chunks` RPC.
- `002_rls.sql`: Row Level Security policies across profiles, enrollments, course documents, chunks, document requests, queues, chats, confidential feedback, internship applications, and audit logs.
- `003_storage.sql`: Private-by-default storage buckets (`course-materials`, `personal-study-docs`, `knowledge-base`, `admin-documents`, `community-media`).
- `004_seed_iset_beja.sql`: Sample ISET Béja hierarchy, request types, and administrative queues.
