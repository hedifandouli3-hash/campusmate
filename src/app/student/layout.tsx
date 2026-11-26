import { RoleLayout } from "@/components/layout/role-layout";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RoleLayout requiredRole="student">{children}</RoleLayout>;
}
