"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";

export default function NewInternshipOfferPage() {
  const router = useRouter();
  const { notify } = useApp();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [internshipType, setInternshipType] = useState("pfe");
  const [skills, setSkills] = useState("TypeScript, React, PostgreSQL");
  const [requiredLevel, setRequiredLevel] = useState("2ème / 3ème Année Licence");
  const [location, setLocation] = useState("Béja / Hybride");
  const [workMode, setWorkMode] = useState("hybrid");
  const [duration, setDuration] = useState("4 mois");
  const [deadline, setDeadline] = useState("2027-01-30");
  const [positionsCount, setPositionsCount] = useState(2);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_offer",
          title,
          description,
          internshipType,
          requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          requiredLevel,
          location,
          workMode,
          duration,
          deadline,
          positionsCount: Number(positionsCount),
          status: "published",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur.", "error");
        return;
      }
      notify("Offre de stage publiée !", "success");
      router.push("/organization/internships");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-blue-600" /> Publier une Offre de Stage
      </h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'offre (ex: Stage PFE Full-Stack)" />
          <div className="grid sm:grid-cols-3 gap-3">
            <Select value={internshipType} onChange={(e) => setInternshipType(e.target.value)}>
              <option value="initiation">Stage d&apos;initiation</option>
              <option value="perfectionnement">Stage de perfectionnement</option>
              <option value="pfe">Stage PFE</option>
              <option value="summer">Stage d&apos;été</option>
              <option value="research">Recherche</option>
            </Select>
            <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
              <option value="hybrid">Hybride</option>
              <option value="onsite">Présentiel</option>
              <option value="remote">À distance</option>
            </Select>
            <Input type="number" min="1" value={positionsCount} onChange={(e) => setPositionsCount(Number(e.target.value))} placeholder="Postes" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu" />
            <Input required value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Durée" />
            <Input type="date" required value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <Input required value={requiredLevel} onChange={(e) => setRequiredLevel(e.target.value)} placeholder="Niveau académique requis" />
          <Input required value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Compétences requises (virgules)" />
          <Textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description détaillée de la mission..." />
          <Button type="submit" disabled={saving}>{saving ? "Publication..." : "Publier l'offre"}</Button>
        </form>
      </Card>
    </div>
  );
}
