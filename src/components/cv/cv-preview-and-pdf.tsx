"use client";

import React from "react";
import { jsPDF } from "jspdf";
import { Award, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { sanitizeDownloadFilename } from "@/lib/security/crypto";
import type { CVProfile } from "@/types/domain";

export const CV_TEMPLATES: Array<{
  id: CVProfile["template"];
  name: string;
  desc: string;
}> = [
  { id: "modern", name: "Moderne (2 Colonnes)", desc: "Colonne latérale structurée & mise en page SaaS" },
  { id: "ats", name: "ATS Compatible (Linéaire)", desc: "1 colonne pure, lisible par tous les parseurs" },
  { id: "classic", name: "Classique Exécutif", desc: "En-tête centré et séparateurs formels" },
  { id: "technical", name: "Ingénierie & Tech", desc: "Accent sur projets, stack technique & GitHub" },
  { id: "academic", name: "Académique & Recherche", desc: "Formation, certifications, prix & bénévolat" },
];

export function exportProfessionalCvPdf(cv: CVProfile): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageHeight = 297;
  const marginX = 16;
  const maxWidth = 210 - marginX * 2;
  let y = 18;

  const ensureSpace = (needed = 14) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  const accentHex = cv.accentColor || "#2563eb";
  const r = parseInt(accentHex.slice(1, 3), 16) || 37;
  const g = parseInt(accentHex.slice(3, 5), 16) || 99;
  const b = parseInt(accentHex.slice(5, 7), 16) || 235;

  // Header styled per template
  if (cv.template === "classic" || cv.template === "academic") {
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text(cv.fullName, 105, y, { align: "center" });
    y += 7;
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(r, g, b);
    doc.text(cv.headline, 105, y, { align: "center" });
    y += 6;
  } else {
    doc.setFillColor(r, g, b);
    doc.rect(marginX, y - 6, 3, 16, "F");
    doc.setFont(cv.template === "technical" ? "courier" : "helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(15, 23, 42);
    doc.text(cv.fullName, marginX + 6, y);
    y += 6.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(r, g, b);
    doc.text(cv.headline, marginX + 6, y);
    y += 6;
  }

  const contacts = [cv.email, cv.phone, cv.city, cv.linkedin, cv.github, cv.website]
    .filter(Boolean)
    .join("  •  ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const contactLines = doc.splitTextToSize(contacts, maxWidth);
  doc.text(contactLines, cv.template === "classic" || cv.template === "academic" ? 105 : marginX, y, {
    align: cv.template === "classic" || cv.template === "academic" ? "center" : "left",
  });
  y += contactLines.length * 4 + 4;

  const drawSection = (title: string) => {
    ensureSpace(16);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(r, g, b);
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.5;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(marginX, y, 210 - marginX, y);
    y += 5;
    doc.setTextColor(15, 23, 42);
  };

  const writeWrapped = (text: string, fontSize = 9.5, indent = 0, bold = false) => {
    if (!text.trim()) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    for (const line of lines) {
      ensureSpace(6);
      doc.text(line, marginX + indent, y);
      y += 4.6;
    }
  };

  const hidden = new Set(cv.hiddenSections || []);
  const order = cv.sectionOrder?.length
    ? cv.sectionOrder
    : ["summary", "experience", "internships", "projects", "education", "skills", "certifications", "languages", "awards", "volunteer"];

  for (const section of order) {
    if (hidden.has(section)) continue;
    if (section === "summary" && cv.summary.trim()) {
      drawSection("Profil Professionnel");
      writeWrapped(cv.summary);
    } else if (section === "experience" && cv.experience.length > 0) {
      drawSection("Expériences Professionnelles");
      for (const exp of cv.experience) {
        ensureSpace(12);
        writeWrapped(`${exp.role} — ${exp.company} (${exp.period})`, 10, 0, true);
        writeWrapped(exp.details, 9.2, 3);
        y += 1.5;
      }
    } else if (section === "internships" && (cv.internships?.length || 0) > 0) {
      drawSection("Stages");
      for (const st of cv.internships || []) {
        ensureSpace(12);
        writeWrapped(`${st.role} — ${st.organization} (${st.period})`, 10, 0, true);
        writeWrapped(st.details, 9.2, 3);
        y += 1.5;
      }
    } else if (section === "projects" && cv.projects.length > 0) {
      drawSection("Projets Académiques & Personnels");
      for (const p of cv.projects) {
        ensureSpace(12);
        writeWrapped(`${p.name} [${p.stack}]`, 10, 0, true);
        writeWrapped(p.description, 9.2, 3);
        y += 1.5;
      }
    } else if (section === "education" && cv.education.length > 0) {
      drawSection("Formation");
      for (const ed of cv.education) {
        ensureSpace(10);
        writeWrapped(`${ed.degree} — ${ed.school} (${ed.period})`, 9.8, 0, true);
        if (ed.details) writeWrapped(ed.details, 9, 3);
      }
    } else if (section === "skills" && (cv.skills.length > 0 || (cv.softSkills?.length || 0) > 0)) {
      drawSection("Compétences");
      if (cv.skills.length > 0) writeWrapped(`Techniques : ${cv.skills.join(" • ")}`, 9.3);
      if (cv.softSkills && cv.softSkills.length > 0) writeWrapped(`Transversales : ${cv.softSkills.join(" • ")}`, 9.3);
    } else if (section === "certifications" && cv.certifications.length > 0) {
      drawSection("Certifications");
      for (const c of cv.certifications) {
        writeWrapped(`• ${c.name} — ${c.issuer} (${c.year})`, 9.3);
      }
    } else if (section === "languages" && cv.languages.length > 0) {
      drawSection("Langues");
      writeWrapped(cv.languages.join("  •  "), 9.3);
    } else if (section === "awards" && (cv.awards?.length || 0) > 0) {
      drawSection("Distinctions & Prix");
      for (const a of cv.awards || []) {
        writeWrapped(`• ${a.title} — ${a.issuer} (${a.year})`, 9.3);
      }
    } else if (section === "volunteer" && (cv.volunteer?.length || 0) > 0) {
      drawSection("Engagements & Bénévolat");
      for (const v of cv.volunteer || []) {
        writeWrapped(`${v.role} — ${v.organization} (${v.period})`, 9.5, 0, true);
        writeWrapped(v.details, 9, 3);
      }
    }
  }

  const safeFile = sanitizeDownloadFilename(`${cv.fullName || "cv"}-${cv.template}.pdf`, "cv-campusmate.pdf");
  doc.save(safeFile);
}

export function CvLivePreview({ cv }: { cv: CVProfile }) {
  const accent = cv.accentColor || "#2563eb";
  const hidden = new Set(cv.hiddenSections || []);
  const order = cv.sectionOrder?.length
    ? cv.sectionOrder
    : ["summary", "experience", "internships", "projects", "education", "skills", "certifications", "languages", "awards", "volunteer"];
  const isRtl = cv.language === "ar";
  const fontClass =
    cv.fontStyle === "serif" || cv.template === "classic" || cv.template === "academic"
      ? "font-serif"
      : cv.fontStyle === "mono" || cv.template === "technical"
        ? "font-mono"
        : "font-sans";

  const renderSectionContent = (sec: string) => {
    if (hidden.has(sec)) return null;
    switch (sec) {
      case "summary":
        return cv.summary.trim() ? (
          <section key={sec} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Profil
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{cv.summary}</p>
          </section>
        ) : null;
      case "experience":
        return cv.experience.length > 0 ? (
          <section key={sec} className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Expériences
            </h3>
            {cv.experience.map((e, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between gap-2 font-semibold text-slate-900">
                  <span>{e.role} — {e.company}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">{e.period}</span>
                </div>
                <p className="text-slate-600 mt-0.5 whitespace-pre-line">{e.details}</p>
              </div>
            ))}
          </section>
        ) : null;
      case "internships":
        return (cv.internships?.length || 0) > 0 ? (
          <section key={sec} className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Stages Universitaires
            </h3>
            {(cv.internships || []).map((st, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between gap-2 font-semibold text-slate-900">
                  <span>{st.role} — {st.organization}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">{st.period}</span>
                </div>
                <p className="text-slate-600 mt-0.5">{st.details}</p>
              </div>
            ))}
          </section>
        ) : null;
      case "projects":
        return cv.projects.length > 0 ? (
          <section key={sec} className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Projets
            </h3>
            {cv.projects.map((p, i) => (
              <div key={i} className="text-xs">
                <p className="font-semibold text-slate-900">
                  {p.name} {p.stack && <span className="font-normal text-slate-500">• {p.stack}</span>}
                </p>
                <p className="text-slate-600">{p.description}</p>
              </div>
            ))}
          </section>
        ) : null;
      case "education":
        return cv.education.length > 0 ? (
          <section key={sec} className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Formation
            </h3>
            {cv.education.map((ed, i) => (
              <div key={i} className="text-xs flex justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-900">{ed.degree}</span>
                  <span className="text-slate-600"> — {ed.school}</span>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">{ed.period}</span>
              </div>
            ))}
          </section>
        ) : null;
      case "skills":
        return cv.skills.length > 0 || (cv.softSkills?.length || 0) > 0 ? (
          <section key={sec} className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Compétences
            </h3>
            <div className="flex flex-wrap gap-1">
              {cv.skills.map((s) => (
                <span
                  key={s}
                  className={
                    cv.template === "ats"
                      ? "text-xs text-slate-700 after:content-[','] last:after:content-[''] me-1"
                      : "rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800"
                  }
                >
                  {s}
                </span>
              ))}
            </div>
            {cv.softSkills && cv.softSkills.length > 0 && (
              <p className="text-[11px] text-slate-600">Soft skills : {cv.softSkills.join(" • ")}</p>
            )}
          </section>
        ) : null;
      case "certifications":
        return cv.certifications.length > 0 ? (
          <section key={sec} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Certifications
            </h3>
            {cv.certifications.map((c, i) => (
              <p key={i} className="text-xs text-slate-700">
                • <strong>{c.name}</strong> — {c.issuer} ({c.year})
              </p>
            ))}
          </section>
        ) : null;
      case "languages":
        return cv.languages.length > 0 ? (
          <section key={sec} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Langues
            </h3>
            <p className="text-xs text-slate-700">{cv.languages.join(" • ")}</p>
          </section>
        ) : null;
      case "awards":
        return (cv.awards?.length || 0) > 0 ? (
          <section key={sec} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Distinctions
            </h3>
            {(cv.awards || []).map((a, i) => (
              <p key={i} className="text-xs text-slate-700">
                <Award className="w-3 h-3 inline me-1" style={{ color: accent }} />
                {a.title} — {a.issuer} ({a.year})
              </p>
            ))}
          </section>
        ) : null;
      case "volunteer":
        return (cv.volunteer?.length || 0) > 0 ? (
          <section key={sec} className="space-y-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider border-b pb-0.5" style={{ color: accent, borderColor: "#e2e8f0" }}>
              Engagement Associatif
            </h3>
            {(cv.volunteer || []).map((v, i) => (
              <div key={i} className="text-xs text-slate-700">
                <strong>{v.role}</strong> — {v.organization} ({v.period}) : {v.details}
              </div>
            ))}
          </section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`cv-print-sheet bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 min-h-[720px] ${fontClass}`}
    >
      {cv.template === "modern" ? (
        <div className="grid sm:grid-cols-3 gap-6">
          <aside className="sm:col-span-1 rounded-lg bg-slate-50 p-4 space-y-4 border border-slate-100">
            {cv.photoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cv.photoDataUrl} alt={cv.fullName} className="w-20 h-20 rounded-full object-cover border" />
            )}
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[10px]" style={{ color: accent }}>
                Contact
              </p>
              <p className="flex items-center gap-1.5 break-all"><Mail className="w-3 h-3 shrink-0" /> {cv.email}</p>
              {cv.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0" /> {cv.phone}</p>}
              {cv.city && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3 shrink-0" /> {cv.city}</p>}
              {cv.linkedin && <p className="flex items-center gap-1.5 break-all"><Globe className="w-3 h-3 shrink-0" /> {cv.linkedin}</p>}
              {cv.github && <p className="flex items-center gap-1.5 break-all"><Globe className="w-3 h-3 shrink-0" /> {cv.github}</p>}
            </div>
            {renderSectionContent("skills")}
            {renderSectionContent("languages")}
          </aside>
          <div className="sm:col-span-2 space-y-4">
            <header className="border-b pb-3" style={{ borderColor: accent }}>
              <h2 className="text-2xl font-bold text-slate-900">{cv.fullName}</h2>
              <p className="text-sm font-semibold mt-0.5" style={{ color: accent }}>{cv.headline}</p>
            </header>
            {order
              .filter((s) => s !== "skills" && s !== "languages")
              .map((sec) => renderSectionContent(sec))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <header
            className={
              cv.template === "classic" || cv.template === "academic"
                ? "text-center border-b pb-4 space-y-1"
                : cv.template === "technical"
                  ? "border-s-4 ps-4 pb-2 space-y-1"
                  : "border-b pb-3 space-y-1"
            }
            style={{ borderColor: accent }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className={cv.template === "classic" || cv.template === "academic" ? "w-full" : ""}>
                <h2 className="text-2xl font-bold text-slate-900">{cv.fullName}</h2>
                <p className="text-sm font-semibold" style={{ color: accent }}>{cv.headline}</p>
              </div>
              {cv.template === "technical" && (
                <Badge variant="default" className="no-print shrink-0">Tech Dossier</Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {[cv.email, cv.phone, cv.city, cv.linkedin, cv.github, cv.website].filter(Boolean).join(" • ")}
            </p>
          </header>
          <div className="space-y-3.5">{order.map((sec) => renderSectionContent(sec))}</div>
        </div>
      )}
    </div>
  );
}
