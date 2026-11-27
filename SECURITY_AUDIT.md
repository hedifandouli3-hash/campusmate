# CampusMate — Security Audit

## Verified Controls
- **Authentication & Registration:** `/api/auth/register` never permits `super_admin` self-registration; all new accounts start as `pending` (`approvalStatus: "pending"`) and are blocked in `/api/auth/login` until approved by `university_admin` (`student`/`teacher`) or `super_admin` (`organization`/`university_admin`).
- **Authorization & IDOR:** Every `/api/*` route validates session cookie HMAC + `requireUser(roles)` + `institutionId` + resource ownership. `university_admin` is blocked (`403`) from approving `organization` or `university_admin` accounts.
- **XSS & Generated Websites:** 0 occurrences of `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, or `new Function` in `src/`. Generated websites render inside `<iframe sandbox="allow-scripts">` with strict CSP (`default-src 'none'`). `https://` protocol enforced on partner destination URLs.
- **HTTP Security Headers (`next.config.ts`):** CSP, HSTS (production), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `Cache-Control: no-store, private` on `/api/*`.
- **Chat Encryption Model:** Application-layer AES-256-GCM AEAD (`encryptChatPayload` / `decryptChatPayload` in `src/lib/security/crypto.ts`) + TLS in transit. Note: This is **server-managed application-layer encryption at rest**, not client-side E2EE, as the server decrypts payloads on authorized `GET /api/chats`.
- **Secret & Dependency Scan:** `npm audit --omit=dev --audit-level=high` reported **0 vulnerabilities**; `git grep` across tracked files found **0 exposed secrets**.

## Findings Remediated in This Audit
- **AUDIT-P2-01 (Rate Limiting on Provider/Partner Registration):** Added IP rate limiting (`10 req/min`) to `register_provider` in `src/app/api/housing/route.ts` and `register_partner` in `src/app/api/partners/route.ts`.
- **AUDIT-P2-02 (URL Scheme Defense-in-Depth):** Added `https://` protocol guard on rendered `destinationUrl` links in `src/app/partners/page.tsx`.
