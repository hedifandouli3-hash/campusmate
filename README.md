# CampusMate

**One Campus. One Platform. Endless Possibilities.**  
**Un campus. Une plateforme. Des possibilités infinies.**

CampusMate is an intelligent, collaborative, multi-tenant university ecosystem built for the **IA Student Discovery Camp** hackathon (*L'intelligence artificielle au service de la vie estudiantine*). Its initial demonstration dataset models **ISET Béja, Tunisia**, while keeping the architecture completely tenant-isolated and ready for any higher education institution.

---

## Key Capabilities

- **5 Role-Based Dashboards:** Student, Teacher, University Administrator, Organization, and Super Administrator.
- **14 Integrated Modules:**
  1. **AI Learning Hub** — Course publishing (`PDF`, `DOCX`, `PPTX`, `TXT`), 5-mode AI summaries, flashcards, AI quiz generator with attempt history & topic recommendations, and source-cited RAG document Q&A.
  2. **AI University Assistant** — Multilingual RAG chatbot (`FR` / `EN` / `AR`) grounded in official/sample university knowledge documents with action links.
  3. **Digital Administration** — Online administrative document requests, approval workflow, history tracking, and demo sample downloads.
  4. **Smart Study & Exam Planner** — Timetable, exam calendar, personal tasks, and AI-generated study schedules.
  5. **Digital Queue Management** — Virtual tickets per service, live status updates, and estimated waiting times.
  6. **Student Marketplace** — Campus second-hand academic supplies and textbooks (no online payment).
  7. **Student Transport Coordination** — University shuttle schedules and institution-approved adult carpool demo listings.
  8. **AI CV & Career Assistant** — Multi-template CV builder, PDF export (`jsPDF`), and editable motivation letters grounded in genuine skills.
  9. **Lost & Found** — Campus lost/found reports without exposing private IDs.
  10. **Classroom & Study Room Availability** — Room schedules and conflict-checked reservations.
  11. **Student Voice** — Suggestions and complaints with confidential submission support.
  12. **Student Events** — Hackathons, workshops, clubs, and capacity-checked registrations.
  13. **Academic Group Chats** — Auto-enrolled section/department/year groups, pinned announcements, replies, and reporting.
  14. **Organizations & Internship Offers** — Verified partner organizations, stage offers, application tracking, and explainable AI matching.
- **Multilingual & RTL:** French (default), English, and Arabic (`dir="rtl"`), plus Light/Dark mode.
- **Dual-Mode Architecture:** Works immediately locally in **Demonstration Mode** (with explicit Demo Mode & Demo AI Fallback labels) and connects seamlessly to **Supabase** + **Google Gemini API** when environment credentials are provided.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript (`strict: true`)
- **Styling & UI:** Tailwind CSS v4, Lucide React icons, Recharts analytics
- **Validation & Forms:** Zod, React Hook Form
- **Document Extraction & PDF:** `unpdf`, `mammoth`, `jszip`, `jspdf`
- **Database & Infra (Production):** Supabase (PostgreSQL, `pgvector`, Auth, Storage, Realtime, RLS)
- **AI Engine:** `@google/genai` (Gemini generation + embeddings) with centralized provider abstraction and explicit Demo Fallback
- **Testing:** Vitest (unit/security/RAG) + Playwright (E2E)

---

## Quick Start (Local Development)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   By default (`DEMO_MODE=true`), CampusMate runs with the seeded **ISET Béja (Démo)** dataset and local AI fallback — no external paid accounts required.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and visit `/login` to explore all 5 roles.

---

## Commands

- `npm run dev` — Start local development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run typecheck` — Run TypeScript strict type checking (`tsc --noEmit`)
- `npm run lint` — Run ESLint
- `npm run test` — Run Vitest unit & security test suite
- `npm run test:e2e` — Run Playwright end-to-end tests

---

## Documentation Index

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Multi-tenant architecture, AI/RAG pipeline, and database design
- [SECURITY.md](./SECURITY.md) — RBAC, tenant isolation, RLS policies, and AI prompt-injection defenses
- [DEMO_GUIDE.md](./DEMO_GUIDE.md) — Demo accounts and 6-scenario hackathon presentation walkthrough
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Supabase + Gemini + Vercel deployment steps
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Implemented features, test results, and known limitations
