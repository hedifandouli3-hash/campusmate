"use client";

import { ShieldCheck } from "lucide-react";
import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function SuperAdminLoginPage() {
  return (
    <RoleLoginForm
      role="super_admin"
      title="Connexion Administrateur Plateforme"
      subtitle="Accès restreint à la gouvernance multi-universités, modération et audit de sécurité."
      badgeText="Super Admin"
      emailPlaceholder="superadmin@campusmate.tn"
      icon={<ShieldCheck className="w-6 h-6" />}
    />
  );
}
