"use client";

import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FileUploadDropzone,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/primitives";
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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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
      <PageHeader
        badge={<Badge variant="primary">Pipeline RAG Sécurisé</Badge>}
        title="Dépôt de Supports & Pipeline RAG"
        description="Glissez-déposez un fichier PDF, DOCX, PPTX ou TXT. Les documents publiés sont accessibles aux étudiants de la section et indexés automatiquement."
      />

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
            <FileUploadDropzone
              accept=".pdf,.docx,.pptx,.txt,.md"
              selectedFile={file}
              onSelectFile={setFile}
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
                <StatusBadge status={d.processingStatus} />
                <StatusBadge
                  status={d.isTeacherOnly ? "draft" : d.isPublished ? "published" : "draft"}
                  label={d.isTeacherOnly ? "Réservé enseignant" : d.isPublished ? "Publié" : "Brouillon"}
                />
              </div>
              <p className="text-xs text-slate-500">{d.subjectName} • {d.sectionName} • {d.fileName}</p>
            </div>
            <div className="flex items-center gap-2">
              {d.isPublished ? (
                <Button size="sm" variant="outline" onClick={() => docAction(d.id, "unpublish")}>Dépublier</Button>
              ) : (
                <Button size="sm" onClick={() => docAction(d.id, "publish")}>Publier</Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setDeleteTargetId(d.id)} aria-label="Supprimer">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) void docAction(deleteTargetId, "delete");
          setDeleteTargetId(null);
        }}
        title="Supprimer ce support de cours ?"
        message="Le document et ses segments d'indexation IA seront définitivement retirés."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
