"use client";

import { Building2 } from "lucide-react";
import { RoleLoginForm } from "@/components/auth/role-login-form";

export default function AdministrationLoginPage() {
  return (
    <RoleLoginForm
      role="university_admin"
      title="Connexion Administration Universitaire"
      subtitle="Espace réservé aux services de scolarité, direction et gestion de l'établissement."
      badgeText="Administration"
      emailPlaceholder="administration@isetb.rnu.tn"
      icon={<Building2 className="w-6 h-6" />}
    />
  );
}
