# CampusMate V6 — Agent Architecture

## Overview
**CampusMate Agent** (`src/lib/agent/orchestrator.ts`) is the central agentic orchestration layer of CampusMate V6. It connects:
- Official ISET Béja hybrid RAG (`isetb.rnu.tn`)
- Authorized teacher course documents & private student documents
- Creation Studio (`/student/studio`)
- Project Management Kanban (`/student/projects`)
- Automation Center (`/student/automations`)
- Startup Builder (`/student/launchpad/startup-builder`)

## Execution Lifecycle
1. **Authentication & Tenant Context**: Every request to `/api/agent` enforces `requireUser(["student"])` and scopes all reads/writes to `user.id` and `user.institutionId`.
2. **Intent & Tool Planning**: `runCampusMateAgent` evaluates the student's goal, selects authorized tools from `AGENT_TOOL_REGISTRY`, and enforces `MAX_TOOL_CALLS = 4` per turn.
3. **Human-in-the-Loop Gate (Category D)**: External side-effect intents (e.g., `scheduleExternalEmail`, `publishWebsiteExternal`) never execute automatically. Instead, they create an `AgentApprovalRequest` (`status: "pending"`) and set the `AgentRun` status to `"waiting_approval"`.
4. **Grounded RAG Fallback**: Academic or administrative questions query `getAuthorizedChunksForUser` and `answerWithRag` to provide source-grounded answers.
5. **Persistence**: Conversations, runs, approvals, preferences, and generated artifacts persist in `CampusMateStoreState` and Supabase (`008_v6_agent_studio_automation.sql`).
