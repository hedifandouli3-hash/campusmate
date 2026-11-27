import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStoreHydrated, persistStore, requireUser, toPublicProfile } from "@/lib/data/store";

const ProfileUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  bio: z.string().max(600).optional(),
  preferredLanguage: z.enum(["fr", "en", "ar"]).optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données profil invalides." }, { status: 400 });
    }
    const store = await ensureStoreHydrated();
    const record = store.users.find((u) => u.id === user.id);
    if (!record) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

    if (parsed.data.fullName) record.fullName = parsed.data.fullName;
    if (parsed.data.bio !== undefined) record.bio = parsed.data.bio;
    if (parsed.data.preferredLanguage) record.preferredLanguage = parsed.data.preferredLanguage;
    if (parsed.data.skills) record.skills = parsed.data.skills;
    if (parsed.data.interests) record.interests = parsed.data.interests;

    await persistStore(store);
    return NextResponse.json({ user: toPublicProfile(record) });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
