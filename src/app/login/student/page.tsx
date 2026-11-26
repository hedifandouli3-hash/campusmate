"use client";

import { GraduationCap } from "lucide-react";
import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function StudentLoginPage() {
  return (
    <RoleLoginForm
      role="student"
      title="Connexion Étudiant"
      subtitle="Accédez à vos cours, assistant IA, attestations, planning et offres de stage."
      badgeText="Espace Étudiant"
      emailPlaceholder="prenom.nom@isetb.rnu.tn"
      allowRegister
      icon={<GraduationCap className="w-6 h-6" />}
    />
  );
}
