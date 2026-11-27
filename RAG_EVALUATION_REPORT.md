# CampusMate — RAG, Agent, Database, UI/UX, Business & Performance Summary

## RAG Evaluation (`RAG_EVALUATION_REPORT.md` equivalent)
- **Crawler (`src/lib/knowledge/crawler.ts`):** Domain-restricted to `isetb.rnu.tn`, post-redirect URL validation, `10s` timeout, spam/FSEGT filtering, historical calendar labeling, and prompt-injection neutralization.
- **Retrieval & Isolation:** Verified in `tests/unit/rag-v5.test.ts` (5/5) and `tests/unit/security-rag-workflows.test.ts` (cross-institution isolation + teacher-only restriction).

## Agent Verification (`AGENT_VERIFICATION_REPORT.md` equivalent)
- **Orchestrator & Registry:** `MAX_TOOL_CALLS = 4`, Category D human approval (`waiting_approval`), Category E hard block (`sql|shell|exec|bash|powershell|admin|...`), verified in `tests/unit/agent-studio-v6.test.ts` (7/7).

## Database & Performance
- **Migrations:** `001` through `009_v8_institutional_saas.sql` with RLS policies and unique active seat index (`idx_unique_active_seat`).
- **Build & Test Timings:** `next build` compiled 143 routes cleanly; `vitest run` completed 31/31 tests in `9.40s`; `playwright test` completed 11/11 browser journeys in `1.2m`.
