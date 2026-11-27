# CampusMate V5 — RAG Architecture

## 1. End-to-End Pipeline
`Information Sources (isetb.rnu.tn / Teacher Docs / Personal Docs)` → `Controlled Ingestion & SSRF Allowlist` → `HTML/Document Extraction & Cleaning` → `Spam, Unrelated Institution & Historical Validation` → `Structure-Aware Chunking` → `Multilingual Embeddings (configurable via AI_EMBEDDING_MODEL)` → `PostgreSQL / Supabase Persistent Storage` → `Pre-Retrieval Scope & RBAC Filtering` → `Hybrid Retrieval & Reranking` → `Prompt-Injection-Hardened LLM Generation (3-Key Gemini Failover)` → `Server-Side Citation Validation`.

## 2. Implementation Modules
- **`src/lib/knowledge/validator.ts`:** Enforces `isetb.rnu.tn` HTTPS allowlist (SSRF protection blocking localhost, private IPs, and non-HTTPS), rejects spam (`1xbet`, `casino`, etc.) and unrelated institutions (`FSEGT`), and tags prior academic years (`2015–2025`) as `historical`.
- **`src/lib/knowledge/crawler.ts`:** Controlled sync from the 7 official ISET Béja seed URLs (`/`, `/licences/`, `/licence/`, `/stages-et-pfe/`, `/organigramme-de-formation/`, `/contact-2/`, `/departements-5/`) with timeouts, content hashing (SHA-256), and status inventory (`approved`, `historical`, `rejected`, `failed`).
- **`src/lib/knowledge/retriever.ts`:** Hybrid multilingual retrieval (`hybridRetrieveAndRerank`) combining Arabic/English/French synonym expansion, lexical scoring, title boost, optional cosine vector similarity, and historical-date penalties on current-year queries.
- **`src/lib/knowledge/citations.ts`:** `buildValidatedCitations` resolves citation IDs strictly against retrieved authorized chunks and rejects invented IDs.
- **`src/lib/ai/service.ts`:** Scopes RAG cache keys by `institutionId` + `authorizedDocumentIds` hash + `locale` + normalized query so answers never leak across tenants or permissions.
- **`supabase/migrations/007_rag_v5.sql`:** Adds `knowledge_sources` and `knowledge_sync_jobs` tables with `knowledge_scope` enums and Row Level Security.
