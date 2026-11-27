# CampusMate V8 — Institutional Licensing, Entitlements & Seats

Implemented in `src/lib/licensing/engine.ts` and `supabase/migrations/009_v8_institutional_saas.sql`.

- **Server-Side Entitlement Inheritance**: `getInstitutionEntitlements()` and `checkFeatureEntitlement()` derive every user's feature access from their **verified institution's active license** (`university_plus`, `university_pro`, `university_ultra`). Client parameters or URL tampering cannot elevate entitlements.
- **Seat Allocation**: `assignInstitutionSeat()` and `releaseInstitutionSeat()` enforce `maxStudentSeats` and `maxProfessorSeats`, prevent duplicate seat consumption per user, and run when `university_admin` or `super_admin` verifies accounts.
- **AI Allowance Governance**: `consumeAiAllowance()` tracks per-institution AI usage and degrades gracefully without asking students to pay.
