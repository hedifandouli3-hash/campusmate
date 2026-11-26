"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Download, FileUp, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FileUploadDropzone,
  Input,
  PageHeader,
  SearchField,
  Select,
} from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import type { CourseDocument, Subject } from "@/types/domain";

export default function StudentCoursesPage() {
  const { notify, locale } = useApp();
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [readDocIds, setReadDocIds] = useState<string[]>([]);
  const [personalDocs, setPersonalDocs] = useState<Array<{ id: string; title: string; fileName: string }>>([]);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [title, setTitle] = useState("");
  const [inlineText, setInlineText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch("/api/courses");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents || []);
      setSubjects(data.subjects || []);
      setPersonalDocs(data.personalDocs || []);
      setReadDocIds(data.readDocIds || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handlePersonalUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("subjectId", subjectFilter);
      if (file) form.append("file", file);
      if (inlineText) form.append("inlineText", inlineText);
      const res = await fetch("/api/courses", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur d'import.", "error");
        return;
      }
      notify("Document personnel indexé pour l'IA !", "success");
      setTitle("");
      setInlineText("");
      setFile(null);
      load();
    } finally {
      setUploading(false);
    }
  }

  const filtered = documents.filter((d) => {
    const sub = subjects.find((s) => s.id === d.subjectId);
    if (subjectFilter && d.subjectId !== subjectFilter) return false;
    if (semesterFilter && String(sub?.semester || 1) !== semesterFilter) return false;
    if (search && !`${d.title} ${d.subjectName} ${d.description}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <>
            <Badge variant="primary">AI Learning Hub</Badge>
            <Badge variant="success">
              {readDocIds.length}/{documents.length} supports consultés
            </Badge>
          </>
        }
        title="Bibliothèque de Cours & Révision IA"
        description="Accédez aux supports publiés par vos enseignants, téléchargez les documents et lancez résumés, quiz et Q&A sourcés."
      />

      {/* Filters */}
      <Card className="grid sm:grid-cols-3 gap-3 p-4">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un cours ou chapitre..."
          ariaLabel="Rechercher un cours"
        />
        <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
          ))}
        </Select>
        <Select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
          <option value="">Tous les semestres</option>
          <option value="1">Semestre 1</option>
          <option value="2">Semestre 2</option>
        </Select>
      </Card>

      {/* Course Documents Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="Aucun support publié correspondant"
          description="Modifiez vos filtres ou attendez qu'un enseignant publie un document."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const isRead = readDocIds.includes(doc.id);
            return (
            <Card key={doc.id} className="flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="primary">{doc.subjectName}</Badge>
                  <div className="flex items-center gap-1">
                    {isRead && (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3 h-3" /> Lu
                      </Badge>
                    )}
                    <Badge variant="default">{doc.docKind}</Badge>
                  </div>
                </div>
                <h2 className="font-semibold text-base">{doc.title}</h2>
                <p className="text-xs text-slate-500 line-clamp-2">{doc.description}</p>
                <p className="text-xs text-slate-400">
                  Par {doc.uploaderName} • {doc.pageCount} p. • {formatDate(doc.createdAt, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/student/courses/${doc.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Réviser avec l&apos;IA
                </Link>
                <a
                  href={`/api/courses?downloadDocId=${encodeURIComponent(doc.id)}`}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Télécharger"
                  aria-label={`Télécharger ${doc.title}`}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Personal Study Document Upload */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <FileUp className="w-4 h-4 text-indigo-600" />
          <span>Importer mes notes personnelles (privées, visibles uniquement par vous)</span>
        </div>
        <form onSubmit={handlePersonalUpload} className="grid md:grid-cols-2 gap-3">
          <Input
            required
            placeholder="Titre de vos notes (ex: Fiche révision SQL)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="md:col-span-2">
            <FileUploadDropzone
              accept=".pdf,.docx,.pptx,.txt,.md"
              selectedFile={file}
              onSelectFile={setFile}
              label="Déposez vos notes personnelles ici (privées)"
            />
          </div>
          <Input
            className="md:col-span-2"
            placeholder="Ou collez directement un extrait de vos notes (optionnel si fichier joint)..."
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
          />
          <div>
            <Button type="submit" disabled={uploading}>
              {uploading ? "Indexation..." : "Ajouter à mes documents personnels"}
            </Button>
          </div>
        </form>
        {personalDocs.length > 0 && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <p className="text-xs font-semibold text-slate-500">Vos documents personnels indexés :</p>
            {personalDocs.map((p) => (
              <p key={p.id} className="text-xs">• {p.title} ({p.fileName})</p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
