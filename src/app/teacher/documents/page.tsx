"use client";

import React, { useEffect, useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { AcademicSection, CourseDocument, Subject } from "@/types/domain";

export default function TeacherDocumentsPage() {
  const { notify } = useApp();
  const [docs, setDocs] = useState<CourseDocument[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [docKind, setDocKind] = useState("lecture");
  const [isPublished, setIsPublished] = useState(true);
  const [isTeacherOnly, setIsTeacherOnly] = useState(false);
  const [inlineText, setInlineText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch("/api/courses");
    if (res.ok) {
      const data = await res.json();
      setDocs(data.documents || []);
      setSubjects(data.subjects || []);
      setSections(data.sections || []);
      setSubjectId((prev) => prev || data.subjects?.[0]?.id || "");
      setSectionId((prev) => prev || data.sections?.[0]?.id || "");
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("description", description);
      form.append("subjectId", subjectId);
      form.append("sectionId", sectionId);
      form.append("docKind", docKind);
      form.append("isPublished", String(isPublished));
      form.append("isTeacherOnly", String(isTeacherOnly));
      if (file) form.append("file", file);
      if (inlineText) form.append("inlineText", inlineText);

      const res = await fetch("/api/courses", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur d'upload.", "error");
        return;
      }
      notify(`Document traité (${data.chunksCount} segments indexés pour l'IA) !`, "success");
      setTitle("");
      setDescription("");
      setInlineText("");
      setFile(null);
      load();
    } finally {
      setUploading(false);
    }
  }

  async function docAction(documentId: string, action: "publish" | "unpublish" | "delete") {
    const res = await fetch("/api/courses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, action }),
    });
    if (res.ok) {
      notify("Document mis à jour.", "success");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileUp className="w-6 h-6 text-blue-600" /> Dépôt de Supports & Pipeline RAG
        </h1>
        <p className="text-sm text-slate-500">
          Importez un fichier PDF, DOCX, PPTX ou TXT. Les documents publiés deviennent instantanément accessibles aux étudiants de la section et indexés par l&apos;assistant IA.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold text-sm">Nouveau support de cours</h2>
        <form onSubmit={handleUpload} className="grid md:grid-cols-2 gap-3">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du document (ex: Chapitre 2 — APIs REST)" />
          <Select value={docKind} onChange={(e) => setDocKind(e.target.value)}>
            <option value="lecture">Support de cours</option>
            <option value="exercise">Série d&apos;exercices</option>
            <option value="correction">Corrigé</option>
            <option value="exam_sample">Sujet d&apos;examen</option>
            <option value="syllabus">Syllabus</option>
          </Select>

          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
            ))}
          </Select>
          <Select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.name}</option>
            ))}
          </Select>

          <Input
            className="md:col-span-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description courte..."
          />

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1">Fichier (PDF, DOCX, PPTX, TXT — max 20 Mo)</label>
            <Input
              type="file"
              accept=".pdf,.docx,.pptx,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Textarea
            className="md:col-span-2"
            rows={3}
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
            placeholder="Ou saisissez/collez directement le texte du cours (optionnel si fichier joint)..."
          />

          <div className="md:col-span-2 flex flex-wrap gap-6 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <span>Publier immédiatement aux étudiants</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTeacherOnly} onChange={(e) => setIsTeacherOnly(e.target.checked)} />
              <span>Corrigé réservé enseignant (exclu du RAG étudiant)</span>
            </label>
          </div>

          <div>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Extraction & Indexation..." : "Téléverser et traiter"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{d.title}</p>
                <Badge variant={d.processingStatus === "ready" ? "success" : "warning"}>{d.processingStatus}</Badge>
                <Badge variant={d.isPublished && !d.isTeacherOnly ? "primary" : "default"}>
                  {d.isTeacherOnly ? "Réservé enseignant" : d.isPublished ? "Publié" : "Brouillon"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{d.subjectName} • {d.sectionName} • {d.fileName}</p>
            </div>
            <div className="flex items-center gap-2">
              {d.isPublished ? (
                <Button size="sm" variant="outline" onClick={() => docAction(d.id, "unpublish")}>Dépublier</Button>
              ) : (
                <Button size="sm" onClick={() => docAction(d.id, "publish")}>Publier</Button>
              )}
              <Button size="sm" variant="danger" onClick={() => docAction(d.id, "delete")}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
