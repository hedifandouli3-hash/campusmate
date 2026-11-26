import { RoleLayout } from "@/components/layout/role-layout";

export default function AdministrationLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout requiredRole="university_admin">{children}</RoleLayout>;
}
