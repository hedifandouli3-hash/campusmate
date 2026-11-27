# CampusMate V9 — University Connect

Implemented in `src/app/api/university-connect/route.ts`, `src/app/student/university/page.tsx`, and `src/app/universities/[slug]/page.tsx`.

- **Single Source of Truth:** Centralizes official `isetb.rnu.tn` crawled pages, departments, specializations, recognized clubs, announcements, events, and transport info.
- **External Social Integration Transparency:** Displays connection status (`active`, `manual_import_only`, `pending_authorization`). When Meta/Facebook Graph API is not configured, authorized university administrators can import announcements manually with mandatory `sourceUrl` and `sourceAttribution` rather than scraping private pages.
