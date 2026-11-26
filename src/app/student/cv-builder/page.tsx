"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Award,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  Printer,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { CV_TEMPLATES, CvLivePreview, exportProfessionalCvPdf } from "@/components/cv/cv-preview-and-pdf";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  Input,
  PageHeader,
  Select,
  SkeletonCard,
  Tabs,
  Textarea,
} from "@/components/ui/primitives";
import type { CVProfile, Locale } from "@/types/domain";

interface OfferSummary {
  id: string;
  title: string;
  organizationName: string;
  requiredSkills: string[];
}

interface CvEvaluation {
  heuristicScore: number;
  disclaimer: string;
  checks: Array<{ label: string; passed: boolean; tip: string }>;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function CvBuilderPage() {
  const { notify, locale } = useApp();
  const [cvs, setCvs] = useState<CVProfile[]>([]);
  const [cv, setCv] = useState<CVProfile | null>(null);
  const [offers, setOffers] = useState<OfferSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<"identity" | "sections" | "skills" | "ai" | "style">("identity");
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");

  const [skillsInput, setSkillsInput] = useState("");
  const [softSkillsInput, setSoftSkillsInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [dirty, setDirty] = useState(false);

  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiTask, setAiTask] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<CvEvaluation | null>(null);
  const [letterText, setLetterText] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const syncFromCv = useCallback((target: CVProfile) => {
    setCv(target);
    setSkillsInput((target.skills || []).join(", "));
    setSoftSkillsInput((target.softSkills || []).join(", "));
    setLanguagesInput((target.languages || []).join(", "));
    setDirty(false);
    if (target.updatedAt) {
      setLastSavedAt(new Date(target.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }
  }, []);

  const fetchCvs = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/ai/career");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
      setCvs(data.cvs || (data.cv ? [data.cv] : []));
      setOffers(data.offers || []);
      if (data.offers?.[0]?.id) setSelectedOfferId(data.offers[0].id);
      if (data.cv) syncFromCv(data.cv);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [syncFromCv]);

  useEffect(() => {
    const id = setTimeout(() => {
      void fetchCvs();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchCvs]);

  const buildPayload = useCallback(
    (source: CVProfile): CVProfile => ({
      ...source,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      softSkills: softSkillsInput.split(",").map((s) => s.trim()).filter(Boolean),
      languages: languagesInput.split(",").map((s) => s.trim()).filter(Boolean),
    }),
    [skillsInput, softSkillsInput, languagesInput]
  );

  const saveCv = useCallback(
    async (silent = false) => {
      if (!cv) return;
      setSaving(true);
      try {
        const res = await fetch("/api/ai/career", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(cv)),
        });
        const data = await res.json();
        if (!res.ok) {
          if (!silent) notify(data.error || "Impossible d'enregistrer le CV.", "error");
          return;
        }
        if (data.cvs) setCvs(data.cvs);
        if (data.cv) setCv(data.cv);
        setDirty(false);
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        if (!silent) notify("CV enregistré.", "success");
      } finally {
        setSaving(false);
      }
    },
    [cv, buildPayload, notify]
  );

  // Clean debounced autosave (1.8s after last edit)
  useEffect(() => {
    if (!dirty || !cv) return;
    const timer = setTimeout(() => {
      void saveCv(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, [dirty, cv, saveCv]);

  function updateCv(patch: Partial<CVProfile>) {
    setCv((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  }

  async function duplicateCv() {
    if (!cv) return;
    const res = await fetch("/api/ai/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "duplicate",
        cvId: cv.id,
        newTitle: `${cv.title || "CV"} (Copie)`,
      }),
    });
    const data = await res.json();
    if (res.ok && data.cv) {
      setCvs(data.cvs);
      syncFromCv(data.cv);
      notify("Version du CV dupliquée.", "success");
    }
  }

  async function deleteActiveCv() {
    if (!cv) return;
    const res = await fetch("/api/ai/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", cvId: cv.id }),
    });
    const data = await res.json();
    setConfirmDeleteOpen(false);
    if (res.ok && data.cv) {
      setCvs(data.cvs);
      syncFromCv(data.cv);
      notify("CV supprimé.", "info");
    } else {
      notify(data.error || "Action impossible.", "error");
    }
  }

  async function runAiAssist(task: "improve_summary" | "improve_experience" | "translate" | "interview_prep" | "tailor_offer") {
    if (!cv) return;
    setAiLoading(true);
    setAiTask(task);
    try {
      await saveCv(true);
      const expText = cv.experience.map((e) => `${e.role} (${e.company}): ${e.details}`).join("\n");
      const res = await fetch("/api/ai/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_assist",
          task,
          cvId: cv.id,
          offerId: selectedOfferId || undefined,
          experienceText: expText,
          targetLocale: (cv.language || locale) as Locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur assistant IA.", "error");
        return;
      }
      setAiSuggestion(data.suggestion || "");
    } finally {
      setAiLoading(false);
    }
  }

  async function runEvaluation() {
    if (!cv) return;
    await saveCv(true);
    const res = await fetch("/api/ai/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "evaluate", cvId: cv.id, offerId: selectedOfferId || undefined }),
    });
    const data = await res.json();
    if (res.ok && data.evaluation) {
      setEvaluation(data.evaluation);
    }
  }

  async function generateLetter() {
    if (!cv) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: selectedOfferId,
          cvId: cv.id,
          locale: cv.language || locale,
        }),
      });
      const data = await res.json();
      if (res.ok) setLetterText(data.letter || "");
    } finally {
      setAiLoading(false);
    }
  }

  function importCvText(file: File | null) {
    if (!file || !cv) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "").slice(0, 3000);
      if (text.trim()) {
        updateCv({ summary: text.split(/\r?\n/).slice(0, 4).join(" ").slice(0, 500) });
        notify("Texte importé dans le résumé — relisez et complétez vos rubriques.", "info");
      }
    };
    reader.readAsText(file);
  }

  function handlePhotoUpload(file: File | null) {
    if (!file) return;
    if (file.size > 240_000) {
      notify("Image trop grande (max 240 Ko).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateCv({ photoDataUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  }

  function moveSection(index: number, dir: -1 | 1) {
    if (!cv) return;
    const list = [...(cv.sectionOrder || [])];
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    [list[index], list[targetIdx]] = [list[targetIdx], list[index]];
    updateCv({ sectionOrder: list });
  }

  function toggleHiddenSection(sec: string) {
    if (!cv) return;
    const current = new Set(cv.hiddenSections || []);
    if (current.has(sec)) current.delete(sec);
    else current.add(sec);
    updateCv({ hiddenSections: [...current] });
  }

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (loadError || !cv) {
    return <ErrorState message={loadError || "Profil CV introuvable."} onRetry={fetchCvs} />;
  }

  const liveCv = buildPayload(cv);

  return (
    <div className="space-y-5">
      <div className="no-print space-y-4">
        <PageHeader
          badge={
            <>
              <Badge variant="primary">5 Modèles A4</Badge>
              <Badge variant={dirty ? "warning" : "success"}>
                {saving ? "Sauvegarde..." : dirty ? "Modifications non enregistrées" : `Enregistré ${lastSavedAt}`}
              </Badge>
            </>
          }
          title="Studio CV & Carrière IA"
          description="Créez plusieurs versions de CV adaptées à chaque offre de stage, améliorez vos formulations sans inventer de diplômes et exportez un PDF A4 propre."
          actions={
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => saveCv(false)} disabled={saving}>
                <Save className="w-4 h-4" /> Enregistrer
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  exportProfessionalCvPdf(liveCv);
                  notify("CV exporté au format PDF A4.", "success");
                }}
              >
                <Download className="w-4 h-4" /> Exporter PDF A4
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4" /> Imprimer / RTL
              </Button>
            </>
          }
        />

        {/* Multi-CV toolbar + Mobile Preview Switcher */}
        <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="cv-switcher" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Version active :
            </label>
            <Select
              id="cv-switcher"
              className="w-48"
              value={cv.id}
              onChange={(e) => {
                const target = cvs.find((c) => c.id === e.target.value);
                if (target) syncFromCv(target);
              }}
            >
              {cvs.map((item, idx) => (
                <option key={item.id || idx} value={item.id}>
                  {item.title || `CV ${idx + 1}`} ({item.template})
                </option>
              ))}
            </Select>
            <Button type="button" size="sm" variant="outline" onClick={duplicateCv} title="Dupliquer ce CV">
              <Copy className="w-3.5 h-3.5" /> Dupliquer
            </Button>
            {cvs.length > 1 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDeleteOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              </Button>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
            <button
              type="button"
              onClick={() => setMobileMode("edit")}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                mobileMode === "edit" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
            >
              Éditeur
            </button>
            <button
              type="button"
              onClick={() => setMobileMode("preview")}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                mobileMode === "preview" ? "bg-blue-600 text-white" : "text-slate-600"
              }`}
            >
              Aperçu PDF
            </button>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Editor Column */}
        <div className={`lg:col-span-6 space-y-4 no-print ${mobileMode === "preview" ? "hidden lg:block" : ""}`}>
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { id: "identity", label: "Identité" },
              { id: "sections", label: "Parcours" },
              { id: "skills", label: "Compétences" },
              { id: "ai", label: "IA & Score" },
              { id: "style", label: "Modèle & Lettre" },
            ]}
          />

          {activeTab === "identity" && (
            <Card className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Nom de cette version de CV</label>
                  <Input value={cv.title || ""} onChange={(e) => updateCv({ title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Langue du CV</label>
                  <Select
                    value={cv.language || "fr"}
                    onChange={(e) => updateCv({ language: e.target.value as Locale })}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية (RTL)</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Nom complet</label>
                  <Input value={cv.fullName} onChange={(e) => updateCv({ fullName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">E-mail de contact</label>
                  <Input type="email" value={cv.email} onChange={(e) => updateCv({ email: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Téléphone</label>
                  <Input placeholder="+216 ..." value={cv.phone || ""} onChange={(e) => updateCv({ phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Ville</label>
                  <Input placeholder="Béja, Tunisie" value={cv.city || ""} onChange={(e) => updateCv({ city: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">GitHub</label>
                  <Input placeholder="https://github.com/..." value={cv.github || ""} onChange={(e) => updateCv({ github: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">LinkedIn</label>
                  <Input placeholder="https://linkedin.com/in/..." value={cv.linkedin || ""} onChange={(e) => updateCv({ linkedin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Titre professionnel / Accroche</label>
                <Input value={cv.headline} onChange={(e) => updateCv({ headline: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Résumé professionnel</label>
                <Textarea rows={4} value={cv.summary} onChange={(e) => updateCv({ summary: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-xs font-medium block mb-1">Photo (optionnelle, PNG/JPG &lt; 240 Ko)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Importer un brouillon (.txt)</label>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={(e) => importCvText(e.target.files?.[0] || null)}
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === "sections" && (
            <div className="space-y-4">
              <Card className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Formation</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateCv({
                        education: [...cv.education, { school: "ISET Béja", degree: "Licence Appliquée", period: "2024 - 2027" }],
                      })
                    }
                  >
                    <FilePlus2 className="w-3.5 h-3.5" /> Ajouter
                  </Button>
                </div>
                {cv.education.map((ed, idx) => (
                  <div key={idx} className="grid sm:grid-cols-3 gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                    <Input
                      placeholder="Diplôme"
                      value={ed.degree}
                      onChange={(e) => {
                        const next = [...cv.education];
                        next[idx] = { ...ed, degree: e.target.value };
                        updateCv({ education: next });
                      }}
                    />
                    <Input
                      placeholder="Établissement"
                      value={ed.school}
                      onChange={(e) => {
                        const next = [...cv.education];
                        next[idx] = { ...ed, school: e.target.value };
                        updateCv({ education: next });
                      }}
                    />
                    <div className="flex gap-1">
                      <Input
                        placeholder="Période"
                        value={ed.period}
                        onChange={(e) => {
                          const next = [...cv.education];
                          next[idx] = { ...ed, period: e.target.value };
                          updateCv({ education: next });
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => updateCv({ education: cv.education.filter((_, i) => i !== idx) })}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>

              <Card className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Stages & Expériences</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateCv({
                        experience: [
                          ...cv.experience,
                          { role: "Stagiaire Développeur", company: "Entreprise", period: "2026", details: "Développement et tests d'interface." },
                        ],
                      })
                    }
                  >
                    <FilePlus2 className="w-3.5 h-3.5" /> Ajouter
                  </Button>
                </div>
                {cv.experience.map((exp, idx) => (
                  <div key={idx} className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="grid sm:grid-cols-3 gap-2">
                      <Input
                        placeholder="Poste"
                        value={exp.role}
                        onChange={(e) => {
                          const next = [...cv.experience];
                          next[idx] = { ...exp, role: e.target.value };
                          updateCv({ experience: next });
                        }}
                      />
                      <Input
                        placeholder="Organisation"
                        value={exp.company}
                        onChange={(e) => {
                          const next = [...cv.experience];
                          next[idx] = { ...exp, company: e.target.value };
                          updateCv({ experience: next });
                        }}
                      />
                      <Input
                        placeholder="Période"
                        value={exp.period}
                        onChange={(e) => {
                          const next = [...cv.experience];
                          next[idx] = { ...exp, period: e.target.value };
                          updateCv({ experience: next });
                        }}
                      />
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Missions réalisées..."
                      value={exp.details}
                      onChange={(e) => {
                        const next = [...cv.experience];
                        next[idx] = { ...exp, details: e.target.value };
                        updateCv({ experience: next });
                      }}
                    />
                  </div>
                ))}
              </Card>

              <Card className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Projets Académiques & Personnels</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateCv({
                        projects: [...cv.projects, { name: "Nouveau Projet", stack: "React, TypeScript", description: "Description concise." }],
                      })
                    }
                  >
                    <FilePlus2 className="w-3.5 h-3.5" /> Ajouter
                  </Button>
                </div>
                {cv.projects.map((p, idx) => (
                  <div key={idx} className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Nom du projet"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...cv.projects];
                          next[idx] = { ...p, name: e.target.value };
                          updateCv({ projects: next });
                        }}
                      />
                      <Input
                        placeholder="Technologies"
                        value={p.stack}
                        onChange={(e) => {
                          const next = [...cv.projects];
                          next[idx] = { ...p, stack: e.target.value };
                          updateCv({ projects: next });
                        }}
                      />
                    </div>
                    <Textarea
                      rows={2}
                      value={p.description}
                      onChange={(e) => {
                        const next = [...cv.projects];
                        next[idx] = { ...p, description: e.target.value };
                        updateCv({ projects: next });
                      }}
                    />
                  </div>
                ))}
              </Card>
            </div>
          )}

          {activeTab === "skills" && (
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Compétences techniques (séparées par virgules)</label>
                <Textarea rows={2} value={skillsInput} onChange={(e) => { setSkillsInput(e.target.value); setDirty(true); }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Compétences transversales / Soft skills</label>
                <Input value={softSkillsInput} onChange={(e) => { setSoftSkillsInput(e.target.value); setDirty(true); }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Langues (séparées par virgules)</label>
                <Input value={languagesInput} onChange={(e) => { setLanguagesInput(e.target.value); setDirty(true); }} />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold">Ordre et visibilité des rubriques</p>
                {(cv.sectionOrder || []).map((sec, idx) => {
                  const isHidden = (cv.hiddenSections || []).includes(sec);
                  return (
                    <div key={sec} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs">
                      <span className="font-medium capitalize">{sec}</span>
                      <div className="flex items-center gap-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => moveSection(idx, -1)} disabled={idx === 0}>
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => moveSection(idx, 1)}
                          disabled={idx === (cv.sectionOrder?.length || 1) - 1}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => toggleHiddenSection(sec)}>
                          {isHidden ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-blue-600" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {activeTab === "ai" && (
            <Card className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1">Cibler une offre de stage (optionnel)</label>
                <Select value={selectedOfferId} onChange={(e) => setSelectedOfferId(e.target.value)}>
                  <option value="">Aucune offre spécifique</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} — {o.organizationName}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={aiLoading} onClick={() => runAiAssist("improve_summary")}>
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Améliorer le résumé
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={aiLoading} onClick={() => runAiAssist("improve_experience")}>
                  Reformuler expériences
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={aiLoading} onClick={() => runAiAssist("tailor_offer")}>
                  Adapter au stage
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={aiLoading} onClick={() => runAiAssist("interview_prep")}>
                  Questions entretien
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={aiLoading} onClick={() => runAiAssist("translate")}>
                  Traduire ({(cv.language || locale).toUpperCase()})
                </Button>
                <Button type="button" size="sm" variant="primary" onClick={runEvaluation}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Audit qualité CV
                </Button>
              </div>

              {aiSuggestion && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-3.5 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Suggestion IA éditable ({aiTask}) — Relisez avant d&apos;appliquer :
                  </p>
                  <Textarea rows={5} value={aiSuggestion} onChange={(e) => setAiSuggestion(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {(aiTask === "improve_summary" || aiTask === "translate" || aiTask === "tailor_offer") && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          updateCv({ summary: aiSuggestion });
                          notify("Résumé mis à jour avec votre validation.", "success");
                        }}
                      >
                        Appliquer au résumé
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="ghost" onClick={() => setAiSuggestion("")}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}

              {evaluation && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Indice de complétude & lisibilité</span>
                    <Badge variant={evaluation.heuristicScore >= 80 ? "success" : "warning"}>
                      {evaluation.heuristicScore} / 100
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{evaluation.disclaimer}</p>
                  <ul className="space-y-1.5 text-xs">
                    {evaluation.checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2">
                        <span className={c.passed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                          {c.passed ? "✓" : "!"}
                        </span>
                        <div>
                          <span className="font-medium">{c.label}</span>
                          {!c.passed && <p className="text-slate-500">{c.tip}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {activeTab === "style" && (
            <Card className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium block">Modèle de CV (5 mises en page distinctes)</label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {CV_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => updateCv({ template: tpl.id })}
                      className={`rounded-lg border p-3 text-start cursor-pointer transition ${
                        cv.template === tpl.id
                          ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                      }`}
                    >
                      <p className="text-xs font-semibold">{tpl.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Couleur d&apos;accent</label>
                  <div className="flex items-center gap-2">
                    {["#2563eb", "#0f172a", "#059669", "#4f46e5", "#b45309"].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        aria-label={`Couleur ${hex}`}
                        onClick={() => updateCv({ accentColor: hex })}
                        className={`h-7 w-7 rounded-full border-2 cursor-pointer ${
                          (cv.accentColor || "#2563eb") === hex ? "border-slate-900 scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Typographie</label>
                  <Select
                    value={cv.fontStyle || "sans"}
                    onChange={(e) => updateCv({ fontStyle: e.target.value as CVProfile["fontStyle"] })}
                  >
                    <option value="sans">Sans-serif Moderne (Inter)</option>
                    <option value="serif">Académique (Serif)</option>
                    <option value="mono">Ingénierie (Monospace)</option>
                  </Select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" /> Lettre de motivation associée
                  </span>
                  <Button type="button" size="sm" variant="outline" disabled={aiLoading} onClick={generateLetter}>
                    Générer brouillon
                  </Button>
                </div>
                <Textarea
                  rows={6}
                  placeholder="Sélectionnez une offre dans l'onglet IA ou générez un brouillon éditable ici..."
                  value={letterText}
                  onChange={(e) => setLetterText(e.target.value)}
                />
              </div>
            </Card>
          )}
        </div>

        {/* Live A4 Preview Column */}
        <div className={`lg:col-span-6 ${mobileMode === "edit" ? "hidden lg:block" : ""}`}>
          <CvLivePreview cv={liveCv} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={deleteActiveCv}
        title="Supprimer cette version de CV ?"
        message={`Voulez-vous supprimer « ${cv.title || "ce CV"} » ? Cette action est définitive.`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
