import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { recommendInternshipsForStudent } from "@/lib/ai/service";
import { addAuditLog, addNotification, getStore, persistToDisk, requireUser } from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = getStore();

    if (user.role === "organization") {
      const org = store.organizations.find((o) => o.id === user.organizationId) || null;
      const offers = store.internshipOffers.filter((o) => o.organizationId === user.organizationId);
      const offerIds = new Set(offers.map((o) => o.id));
      // Organizations ONLY see applications submitted to their own offers
      const applications = store.internshipApplications.filter((a) => offerIds.has(a.offerId));
      return NextResponse.json({ organization: org, offers, applications, recommendations: [] });
    }

    const verifiedOrgIds = new Set(
      store.organizations.filter((o) => o.verificationStatus === "verified").map((o) => o.id)
    );

    const offers = store.internshipOffers.filter(
      (o) =>
        user.role === "super_admin" ||
        (o.status === "published" && verifiedOrgIds.has(o.organizationId))
    );

    const applications =
      user.role === "super_admin"
        ? store.internshipApplications
        : store.internshipApplications.filter((a) => a.studentId === user.id);

    const recommendations =
      user.role === "student"
        ? recommendInternshipsForStudent({
            studentSkills: user.skills || [],
            interests: user.interests || [],
            offers,
          })
        : [];

    const savedIds = store.savedInternshipIds[user.id] || [];

    return NextResponse.json({ offers, applications, recommendations, savedIds });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const CreateOfferSchema = z.object({
  action: z.literal("create_offer"),
  title: z.string().min(4).max(160),
  description: z.string().min(10).max(3000),
  internshipType: z.enum(["initiation", "perfectionnement", "pfe", "summer", "research"]),
  requiredSkills: z.array(z.string()).default([]),
  requiredLevel: z.string().min(2),
  relevantDepartments: z.array(z.string()).default(["Technologies de l'Informatique"]),
  location: z.string().min(2),
  workMode: z.enum(["onsite", "hybrid", "remote"]),
  duration: z.string().min(2),
  deadline: z.string().min(4),
  positionsCount: z.number().int().min(1).max(50).default(1),
  compensation: z.string().optional(),
  instructions: z.string().optional(),
  status: z.enum(["draft", "published"]).default("published"),
});

const ApplySchema = z.object({
  action: z.literal("apply"),
  offerId: z.string().min(1),
  motivationLetter: z.string().min(20).max(5000),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const store = getStore();

    if (body?.action === "toggle_save" && user.role === "student") {
      const offerId = String(body.offerId || "");
      const current = new Set(store.savedInternshipIds[user.id] || []);
      if (current.has(offerId)) current.delete(offerId);
      else current.add(offerId);
      store.savedInternshipIds[user.id] = [...current];
      persistToDisk(store);
      return NextResponse.json({ savedIds: store.savedInternshipIds[user.id] });
    }

    if (body?.action === "apply") {
      if (user.role !== "student" || !user.institutionId) {
        return NextResponse.json({ error: "Seuls les étudiants peuvent postuler." }, { status: 403 });
      }
      const parsed = ApplySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Lettre de motivation requise (min 20 caractères)." }, { status: 400 });
      }

      const offer = store.internshipOffers.find(
        (o) => o.id === parsed.data.offerId && o.status === "published"
      );
      if (!offer) {
        return NextResponse.json({ error: "Offre introuvable ou clôturée." }, { status: 404 });
      }
      const org = store.organizations.find(
        (o) => o.id === offer.organizationId && o.verificationStatus === "verified"
      );
      if (!org) {
        return NextResponse.json({ error: "Organisation non vérifiée." }, { status: 403 });
      }

      const duplicate = store.internshipApplications.find(
        (a) => a.offerId === offer.id && a.studentId === user.id
      );
      if (duplicate) {
        return NextResponse.json({ error: "Vous avez déjà postulé à cette offre." }, { status: 409 });
      }

      const cv = store.cvProfiles.find((c) => c.studentId === user.id);
      const now = new Date().toISOString();
      const application = {
        id: `app-${crypto.randomUUID()}`,
        offerId: offer.id,
        offerTitle: offer.title,
        organizationId: org.id,
        organizationName: org.name,
        studentId: user.id,
        studentName: user.fullName,
        institutionId: user.institutionId,
        cvHeadline: cv?.headline || user.sectionName || "Étudiant(e) ISET",
        cvSkills: cv?.skills || user.skills || [],
        motivationLetter: parsed.data.motivationLetter,
        status: "submitted" as const,
        createdAt: now,
        updatedAt: now,
      };
      store.internshipApplications.unshift(application);

      // Notify organization members
      const orgUsers = store.users.filter((u) => u.organizationId === org.id);
      for (const ou of orgUsers) {
        addNotification({
          institutionId: null,
          userId: ou.id,
          category: "internship",
          title: `Nouvelle candidature : ${offer.title}`,
          body: `${user.fullName} a postulé avec son CV CampusMate.`,
          actionUrl: "/organization/applications",
        });
      }

      persistToDisk(store);
      return NextResponse.json({ application }, { status: 201 });
    }

    if (body?.action === "create_offer") {
      if (user.role !== "organization" || !user.organizationId) {
        return NextResponse.json({ error: "Réservé aux organisations." }, { status: 403 });
      }
      const org = store.organizations.find((o) => o.id === user.organizationId);
      if (!org) {
        return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
      }
      const parsed = CreateOfferSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Champs de l'offre invalides." }, { status: 400 });
      }
      if (parsed.data.status === "published" && org.verificationStatus !== "verified") {
        return NextResponse.json(
          { error: "Votre organisation doit être vérifiée avant de publier publiquement une offre." },
          { status: 403 }
        );
      }

      const offer = {
        id: `int-${crypto.randomUUID()}`,
        organizationId: org.id,
        organizationName: org.name,
        ...parsed.data,
        createdAt: new Date().toISOString(),
      };
      store.internshipOffers.unshift(offer);
      addAuditLog({
        actorId: user.id,
        actorName: user.fullName,
        action: "INTERNSHIP_OFFER_CREATED",
        resourceType: "internship_offer",
        resourceId: offer.id,
        details: `${offer.title} (${offer.status})`,
      });
      persistToDisk(store);
      return NextResponse.json({ offer }, { status: 201 });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur offres de stage." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(["organization", "student"]);
    const body = await request.json();
    const store = getStore();

    if (body.action === "update_application" && user.role === "organization") {
      const app = store.internshipApplications.find(
        (a) => a.id === body.applicationId && a.organizationId === user.organizationId
      );
      if (!app) {
        return NextResponse.json({ error: "Candidature introuvable ou accès refusé." }, { status: 404 });
      }
      if (!["under_review", "interview_requested", "accepted", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
      }
      app.status = body.status;
      app.organizationNote = body.organizationNote || app.organizationNote;
      app.updatedAt = new Date().toISOString();

      addNotification({
        institutionId: app.institutionId,
        userId: app.studentId,
        category: "internship",
        title: `Candidature mise à jour : ${app.offerTitle}`,
        body: `${app.organizationName} a mis à jour le statut : ${app.status}.`,
        actionUrl: "/student/applications",
      });

      persistToDisk(store);
      return NextResponse.json({ application: app });
    }

    if (body.action === "withdraw" && user.role === "student") {
      const app = store.internshipApplications.find(
        (a) => a.id === body.applicationId && a.studentId === user.id
      );
      if (!app) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
      app.status = "withdrawn";
      app.updatedAt = new Date().toISOString();
      persistToDisk(store);
      return NextResponse.json({ application: app });
    }

    if (body.action === "update_offer_status" && user.role === "organization") {
      const offer = store.internshipOffers.find(
        (o) => o.id === body.offerId && o.organizationId === user.organizationId
      );
      if (!offer) return NextResponse.json({ error: "Offre introuvable." }, { status: 404 });
      if (["draft", "published", "closed"].includes(body.status)) {
        offer.status = body.status;
        persistToDisk(store);
        return NextResponse.json({ offer });
      }
    }

    if (body.action === "update_org_profile" && user.role === "organization") {
      const org = store.organizations.find((o) => o.id === user.organizationId);
      if (!org) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
      if (body.name) org.name = String(body.name);
      if (body.sector) org.sector = String(body.sector);
      if (body.city) org.city = String(body.city);
      if (body.website !== undefined) org.website = String(body.website);
      if (body.description) org.description = String(body.description);
      if (body.registrationNumber) org.registrationNumber = String(body.registrationNumber);
      persistToDisk(store);
      return NextResponse.json({ organization: org });
    }

    return NextResponse.json({ error: "Requête non supportée." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
}
