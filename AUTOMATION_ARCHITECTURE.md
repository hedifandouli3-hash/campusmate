# CampusMate V6 — Automation Architecture

Implemented in `src/app/api/automations/route.ts` and `src/app/student/automations/page.tsx`.

## Workflow Model
Each `AutomationWorkflow` follows a structured pipeline:
- **Trigger (`triggerType`)**: `daily_schedule`, `weekly_schedule`, `deadline_approaching`, `new_course_published`, `unread_messages`, `new_internship`.
- **Schedule & Timezone**: Stored with `scheduleCronOrLabel` and `timezone` (default `Africa/Tunis`).
- **Conditions (`conditions[]`)**: Explicit context checks (e.g., active projects, upcoming exams).
- **Actions (`actions[]`)**: Internal summaries, study planner updates, notifications, or local email drafts.
- **Execution Logs (`runs[]`)**: Every manual (`run_now`) or scheduled execution records an `AutomationRunLog` with timestamp and summary.

## Email Draft Safety
`EmailDraft` records are stored locally with status `"draft"` or `"approved_local_pending_provider"`. CampusMate never simulates external SMTP/OAuth delivery when no external mail provider is configured.
