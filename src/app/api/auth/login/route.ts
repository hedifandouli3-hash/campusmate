import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, addAuditLog, ensureStoreHydrated } from "@/lib/data/store";
import { isDemoLoginAllowed, isDemoMode } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getDashboardPathForRole, setServerSessionCookie } from "@/lib/security/session";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  expectedRole: z
    .enum(["student", "teacher", "university_admin", "organization", "super_admin"])
    .optional(),
});

const DemoQuickSchema = z.object({
  demoEmail: z.string().email(),
});

const ROLE_LABELS: Record<string, string> = {
  student: "Étudiant",
  teacher: "Enseignant",
  university_admin: "Administration Universitaire",
  organization: "Organisation Partenaire",
  super_admin: "Super Administrateur",
};

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limit = checkRateLimit(`login:${ip}`, 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans une minute." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête JSON invalide." }, { status: 400 });
  }

  const quick = DemoQuickSchema.safeParse(body);
  if (quick.success) {
    if (!isDemoMode() || !isDemoLoginAllowed()) {
      return NextResponse.json(
        { error: "Veuillez vous connecter avec votre adresse e-mail et votre mot de passe." },
        { status: 403 }
      );
    }
    const store = await ensureStoreHydrated();
    const demoUser = store.users.find(
      (u) => u.email.toLowerCase() === quick.data.demoEmail.toLowerCase() && u.isDemoAccount
    );
    if (!demoUser || demoUser.isSuspended) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }
    try {
      await setServerSessionCookie({
        userId: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        institutionId: demoUser.institutionId,
        sessionVersion: demoUser.sessionVersion ?? 1,
      });
    } catch (err) {
      const message =
        err instanceof Error && err.message === "SESSION_SECRET_MISCONFIGURED"
          ? "Configuration serveur incomplète : SESSION_SECRET doit être défini en production."
          : "Erreur serveur lors de la création de la session.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.json({
      user: { id: demoUser.id, fullName: demoUser.fullName, role: demoUser.role, email: demoUser.email },
      redirectTo: getDashboardPathForRole(demoUser.role),
    });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 400 });
  }

  await ensureStoreHydrated();
  const user = authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Identifiants incorrects ou compte suspendu." }, { status: 401 });
  }

  if (parsed.data.expectedRole && user.role !== parsed.data.expectedRole) {
    return NextResponse.json(
      {
        error: `Ce portail est réservé aux comptes « ${ROLE_LABELS[parsed.data.expectedRole]} ». Votre compte appartient à l'espace « ${ROLE_LABELS[user.role]} ».`,
      },
      { status: 403 }
    );
  }

  try {
    await setServerSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      sessionVersion: user.sessionVersion ?? 1,
    });
  } catch (err) {
    const message =
      err instanceof Error && err.message === "SESSION_SECRET_MISCONFIGURED"
        ? "Configuration serveur incomplète : SESSION_SECRET doit être défini en production."
        : "Erreur serveur lors de la création de la session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  addAuditLog({
    institutionId: user.institutionId,
    actorId: user.id,
    actorName: user.fullName,
    action: "LOGIN_SUCCESS",
    resourceType: "session",
    details: `Connexion réussie (${user.role}).`,
  });

  return NextResponse.json({
    user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email },
    redirectTo: getDashboardPathForRole(user.role),
  });
}
