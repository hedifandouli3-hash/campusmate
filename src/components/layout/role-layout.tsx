import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SkeletonCard } from "@/components/ui/primitives";
import { getCurrentUser } from "@/lib/data/store";
import { isDemoMode, isGeminiConfigured } from "@/lib/env";
import { getDashboardPathForRole } from "@/lib/security/session";
import type { UserRole } from "@/types/domain";

async function RoleGuardInner({
  requiredRole,
  children,
}: {
  requiredRole: UserRole;
  children: React.ReactNode;
}) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== requiredRole) {
    redirect(getDashboardPathForRole(user.role));
  }

  return (
    <DashboardShell user={user} demoMode={isDemoMode()} geminiLive={isGeminiConfigured()}>
      {children}
    </DashboardShell>
  );
}

export function RoleLayout({
  requiredRole,
  children,
}: {
  requiredRole: UserRole;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-6xl mx-auto space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      }
    >
      <RoleGuardInner requiredRole={requiredRole}>{children}</RoleGuardInner>
    </Suspense>
  );
}
