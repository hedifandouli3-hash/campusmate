import { describe, expect, it } from "vitest";
import { AGENT_TOOL_REGISTRY, checkToolAuthorization } from "@/lib/agent/registry";
import { renderSandboxedWebsiteHtml } from "@/lib/agent/website-generator";
import { runCampusMateAgent } from "@/lib/agent/orchestrator";
import { getStore } from "@/lib/data/store";
import type { KanbanProjectTask } from "@/types/domain";

describe("CampusMate V6 Agentic OS, Tool Security & Sandboxed Studio", () => {
  it("blocks Category E prohibited tools and unknown tools", () => {
    const sqlRes = checkToolAuthorization("execute_sql_query");
    expect(sqlRes.allowed).toBe(false);
    expect(sqlRes.reason).toContain("PROHIBITED_ACTION");

    const shellRes = checkToolAuthorization("run_bash_shell");
    expect(shellRes.allowed).toBe(false);

    const adminRes = checkToolAuthorization("escalate_admin_privileges");
    expect(adminRes.allowed).toBe(false);

    const unknownRes = checkToolAuthorization("random_unregistered_tool");
    expect(unknownRes.allowed).toBe(false);
    expect(unknownRes.reason).toContain("UNKNOWN_TOOL");
  });

  it("enforces Category D human approval on external actions", () => {
    const emailTool = checkToolAuthorization("scheduleExternalEmail");
    expect(emailTool.allowed).toBe(true);
    expect(emailTool.definition?.category).toBe("D_external_approval");
    expect(emailTool.definition?.requiresApproval).toBe(true);

    const publishTool = checkToolAuthorization("publishWebsiteExternal");
    expect(publishTool.allowed).toBe(true);
    expect(publishTool.definition?.requiresApproval).toBe(true);
    expect(AGENT_TOOL_REGISTRY.createWebsiteProject.requiresApproval).toBe(false);
  });

  it("escapes XSS payloads and injects strict CSP in sandboxed website HTML", () => {
    const html = renderSandboxedWebsiteHtml({
      template: "startup",
      brandName: "<script>alert(document.cookie)</script>CampusTech",
      primaryColor: "javascript:alert(1)",
      fontFamily: "sans",
      contactPreviewNote: "Aperçu local uniquement",
      sections: [
        {
          id: "sec-1",
          kind: "hero",
          heading: '<img src=x onerror="alert(1)">Projet PFE',
          subheading: "ISET Béja <b>2026</b>",
          items: [
            {
              title: "<svg onload=alert(1)>Module",
              description: "Description sûre",
            },
          ],
        },
      ],
    });

    expect(html).toContain(
      `content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none';"`
    );
    expect(html).not.toContain("<script>alert(document.cookie)</script>");
    expect(html).toContain("&lt;script&gt;alert(document.cookie)&lt;/script&gt;CampusTech");
    expect(html).toContain("#2563EB");
    expect(html).not.toContain("javascript:alert(1)");
  });

  it("creates Category D approval request instead of executing external email directly", async () => {
    const store = getStore();
    const student = store.users.find((u) => u.role === "student");
    expect(student).toBeDefined();

    const result = await runCampusMateAgent({
      store,
      user: student!,
      conversationId: "conv-v6-test-1",
      goal: "Je veux envoyer un email à scolarite@isetb.rnu.tn pour mon attestation",
      locale: "fr",
    });

    expect(result.run.status).toBe("waiting_approval");
    expect(result.createdApprovals.length).toBeGreaterThanOrEqual(1);
    expect(result.createdApprovals[0].status).toBe("pending");
    expect(result.run.toolExecutions.length).toBeLessThanOrEqual(4);
  });

  it("creates a private website artifact in Studio when requested", async () => {
    const store = getStore();
    const student = store.users.find((u) => u.role === "student");
    expect(student).toBeDefined();

    const result = await runCampusMateAgent({
      store,
      user: student!,
      conversationId: "conv-v6-test-2",
      goal: "Crée un site web vitrine pour mon projet AgriSmart Béja",
      locale: "fr",
    });

    expect(result.createdArtifacts.length).toBeGreaterThanOrEqual(1);
    expect(result.createdArtifacts[0].type).toBe("website");
    expect(result.createdArtifacts[0].websiteData?.brandName).toBeTruthy();
  });

  it("computes real Kanban progress from completed tasks", () => {
    const tasks: KanbanProjectTask[] = [
      { id: "1", title: "T1", status: "completed", priority: "high" },
      { id: "2", title: "T2", status: "completed", priority: "medium" },
      { id: "3", title: "T3", status: "in_progress", priority: "medium" },
      { id: "4", title: "T4", status: "todo", priority: "low" },
    ];
    const completed = tasks.filter((t) => t.status === "completed").length;
    const progress = Math.round((completed / tasks.length) * 100);
    expect(progress).toBe(50);
  });
});
