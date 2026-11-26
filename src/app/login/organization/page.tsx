"use client";

import { Briefcase } from "lucide-react";
import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function OrganizationLoginPage() {
  return (
    <RoleLoginForm
      role="organization"
      title="Connexion Organisation & Entreprise"
      subtitle="Publiez vos offres de stage et suivez les candidatures des étudiants."
      badgeText="Partenaire Pro"
      emailPlaceholder="rh@entreprise.tn"
      allowRegister
      icon={<Briefcase className="w-6 h-6" />}
    />
  );
}
