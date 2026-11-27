import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStoreHydrated, persistStore, registerStudentOrOrg } from "@/lib/data/store";
import { checkRateLimit } from "@/lib/security/rate-limit";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum."),
  fullName: z.string().min(2).max(120),
  // Never allow self-registration as university_admin or super_admin!
  role: z.enum(["student", "teacher", "organization"]).default("student"),
  institutionId: z.string().optional(),
  sectionId: z.string().optional(),
  organizationName: z.string().optional(),
  locale: z.enum(["fr", "en", "ar"]).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(`register:${ip}`, 15, 60_000).allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Données invalides." },
      { status: 400 }
    );
  }

  const store = await ensureStoreHydrated();
  const result = registerStudentOrOrg(parsed.data);
  if (result.error || !result.user) {
    return NextResponse.json({ error: result.error || "Erreur d'inscription." }, { status: 400 });
  }

  await persistStore(store);

  const approverLabel =
    result.user.role === "organization"
      ? "le Super Administrateur"
      : "l'Administration universitaire";

  return NextResponse.json(
    {
      user: result.user,
      pendingApproval: true,
      message: `Compte créé avec succès. Il doit être vérifié par ${approverLabel} avant votre première connexion.`,
    },
    { status: 201 }
  );
}
