import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, addAuditLog, getStore } from "@/lib/data/store";
import { isDemoLoginAllowed, isDemoMode } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getDashboardPathForRole, setServerSessionCookie } from "@/lib/security/session";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  demoRole: z.enum(["student", "teacher", "university_admin", "organization", "super_admin"]).optional(),
});

const DemoQuickSchema = z.object({
  demoEmail: z.string().email(),
});

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

  // Optional Demo Quick-Login (only when DEMO_MODE & ALLOW_DEMO_LOGIN are enabled)
  const quick = DemoQuickSchema.safeParse(body);
  if (quick.success) {
    if (!isDemoMode() || !isDemoLoginAllowed()) {
      return NextResponse.json({ error: "La connexion démo rapide est désactivée." }, { status: 403 });
    }
    const store = getStore();
    const demoUser = store.users.find(
      (u) => u.email.toLowerCase() === quick.data.demoEmail.toLowerCase() && u.isDemoAccount
    );
    if (!demoUser || demoUser.isSuspended) {
      return NextResponse.json({ error: "Compte démo introuvable." }, { status: 404 });
    }
    await setServerSessionCookie({
      userId: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      institutionId: demoUser.institutionId,
    });
    addAuditLog({
      institutionId: demoUser.institutionId,
      actorId: demoUser.id,
      actorName: demoUser.fullName,
      action: "DEMO_QUICK_LOGIN",
      resourceType: "session",
      details: `Connexion rapide démo (${demoUser.role}).`,
    });
    return NextResponse.json({
      user: { id: demoUser.id, fullName: demoUser.fullName, role: demoUser.role, email: demoUser.email },
      redirectTo: getDashboardPathForRole(demoUser.role),
    });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 400 });
  }

  const user = authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Identifiants incorrects ou compte suspendu." }, { status: 401 });
  }

  await setServerSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId,
  });

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
