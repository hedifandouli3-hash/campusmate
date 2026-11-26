import { RoleLayout } from "@/components/layout/role-layout";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout requiredRole="organization">{children}</RoleLayout>;
}
