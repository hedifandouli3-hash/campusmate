"use client";

import { Users } from "lucide-react";
import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function TeacherLoginPage() {
  return (
    <RoleLoginForm
      role="teacher"
      title="Connexion Enseignant & Professeurs"
      subtitle="Gérez vos matières, publiez vos supports de cours et créez des quiz IA pour vos sections."
      badgeText="Corps Enseignant"
      emailPlaceholder="professeur@isetb.rnu.tn"
      icon={<Users className="w-6 h-6" />}
    />
  );
}
