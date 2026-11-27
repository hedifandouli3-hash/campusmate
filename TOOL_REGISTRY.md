# CampusMate V6 — Tool Registry & Authorization

Defined in `src/lib/agent/registry.ts` and enforced via `checkToolAuthorization(toolName)`.

## Permission Categories
- **Category A (`A_read`)** — Read-only authorized retrieval (`requiresApproval: false`):
  - `searchUniversityKnowledge`: Official validated ISET Béja knowledge base.
  - `searchAuthorizedCourses`: Authorized course documents for the student's enrollments.
  - `getAuthorizedUnreadCounts`: Unread messages and notifications for the student.
  - `getProjectAndTaskStatus`: Real project and Kanban task progress.
- **Category B (`B_create_private`)** — Private deliverable creation (`requiresApproval: false`):
  - `createWebsiteProject`: Sandboxed website project in Studio.
  - `createPortfolioSite`: Portfolio website from real student projects.
  - `createPresentation`: Editable presentation / pitch deck slides.
  - `createDocument`: Structured academic/project Markdown document.
  - `createBrandKit`: Brand identity (palette, slogan, positioning).
  - `createSocialPostDraft`: LinkedIn / Instagram / Facebook post drafts.
  - `prepareEmailDraft`: Local email draft (never sent externally without approval).
- **Category C (`C_internal_state`)** — Internal student workspace mutations (`requiresApproval: false`):
  - `createPersonalTask`: Task in student study/project workspace.
  - `createStartupWorkspace`: Unified startup project + canvas + tasks.
- **Category D (`D_external_approval`)** — External actions (`requiresApproval: true`):
  - `scheduleExternalEmail`: Requires explicit student approval; stored locally until an authorized OAuth connector is configured.
  - `publishWebsiteExternal`: Requires explicit student approval before external publication.
- **Category E (`PROHIBITED_PATTERNS`)** — Hard-blocked:
  - Any tool matching `/sql|shell|exec|bash|powershell|admin|escalate|secret|token|password|other_user|bypass|impersonate/i` or any unregistered tool name is rejected immediately.
