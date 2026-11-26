"use client";

import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { Award, Download, Save } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { CVProfile } from "@/types/domain";

export default function CvBuilderPage() {
  const { notify } = useApp();
  const [cv, setCv] = useState<CVProfile | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/ai/career")
      .then((r) => r.json())
      .then((data) => {
        if (data.cv) {
          setCv(data.cv);
          setSkillsInput((data.cv.skills || []).join(", "));
        }
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!cv) return;
    setSaving(true);
    try {
      const updated = {
        ...cv,
        skills: skillsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch("/api/ai/career", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setCv(data.cv);
        notify("CV enregistré !", "success");
      }
    } finally {
      setSaving(false);
    }
  }

  function exportPdf() {
    if (!cv) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(cv.fullName, 14, 20);
    doc.setFontSize(11);
    doc.text(cv.headline, 14, 28);
    doc.setFontSize(9);
    doc.text(cv.email, 14, 34);

    doc.setFontSize(12);
    doc.text("Profil", 14, 46);
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(cv.summary || "", 180);
    doc.text(summaryLines, 14, 53);

    let y = 55 + summaryLines.length * 5 + 6;
    doc.setFontSize(12);
    doc.text("Compétences", 14, y);
    y += 6;
    doc.setFontSize(10);
    doc.text(skillsInput || cv.skills.join(", "), 14, y);

    y += 10;
    doc.setFontSize(12);
    doc.text("Formation", 14, y);
    y += 6;
    doc.setFontSize(10);
    cv.education.forEach((ed) => {
      doc.text(`• ${ed.degree} — ${ed.school} (${ed.period})`, 14, y);
      y += 6;
    });

    y += 4;
    doc.setFontSize(12);
    doc.text("Projets & Expériences", 14, y);
    y += 6;
    doc.setFontSize(10);
    cv.projects.forEach((p) => {
      doc.text(`• ${p.name} [${p.stack}] : ${p.description}`, 14, y);
      y += 6;
    });

    doc.save(`${cv.fullName.toLowerCase().replace(/\s+/g, "-")}-cv-campusmate.pdf`);
    notify("CV exporté en PDF !", "success");
  }

  if (!cv) return <Card>Chargement de votre CV...</Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" /> AI CV & Career Assistant
          </h1>
          <p className="text-sm text-slate-500">
            Modifiez vos informations authentiques et exportez votre CV au format PDF.
          </p>
        </div>
        <Button onClick={exportPdf} variant="secondary">
          <Download className="w-4 h-4" /> Exporter PDF
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Nom complet</label>
                <Input value={cv.fullName} onChange={(e) => setCv({ ...cv, fullName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium">Modèle</label>
                <Select value={cv.template} onChange={(e) => setCv({ ...cv, template: e.target.value as CVProfile["template"] })}>
                  <option value="modern">Moderne (SaaS Blue)</option>
                  <option value="classic">Classique Académique</option>
                  <option value="minimal">Minimaliste</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Titre professionnel</label>
              <Input value={cv.headline} onChange={(e) => setCv({ ...cv, headline: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Résumé</label>
              <Textarea rows={3} value={cv.summary} onChange={(e) => setCv({ ...cv, summary: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Compétences (séparées par virgules)</label>
              <Input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
            </div>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4" /> {saving ? "Sauvegarde..." : "Enregistrer mon CV"}
            </Button>
          </form>
        </Card>

        {/* Live Template Preview */}
        <Card className={`space-y-4 ${cv.template === "modern" ? "border-t-4 border-t-blue-600" : cv.template === "classic" ? "border-s-4 border-s-slate-800" : ""}`}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{cv.fullName}</h2>
              <p className="text-sm text-blue-600 font-medium">{cv.headline}</p>
              <p className="text-xs text-slate-500">{cv.email}</p>
            </div>
            <Badge>{cv.template}</Badge>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{cv.summary}</p>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Compétences</h3>
            <div className="flex flex-wrap gap-1.5">
              {skillsInput.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                <Badge key={s} variant="primary">{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Formation</h3>
            {cv.education.map((ed, i) => (
              <p key={i} className="text-xs"><strong>{ed.degree}</strong> — {ed.school} ({ed.period})</p>
            ))}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-1">Projets</h3>
            {cv.projects.map((p, i) => (
              <p key={i} className="text-xs"><strong>{p.name}</strong> ({p.stack}) — {p.description}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
