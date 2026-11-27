import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { renderSandboxedWebsiteHtml } from "@/lib/agent/website-generator";
import type { CreationArtifact, PresentationSlide } from "@/types/domain";

/**
 * Export a presentation artifact as a multi-page landscape PDF slide deck.
 */
export function exportPresentationPdf(title: string, slides: PresentationSlide[]): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  slides.forEach((slide, index) => {
    if (index > 0) doc.addPage();

    // Header bar
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`${title}  •  Slide ${index + 1} / ${slides.length}`, 14, 15);

    // Slide title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(22);
    doc.text(slide.title || `Slide ${index + 1}`, 14, 42, { maxWidth: pageWidth - 28 });

    // Bullets
    doc.setFontSize(13);
    doc.setTextColor(51, 65, 85);
    let y = 60;
    for (const bullet of slide.bullets) {
      const lines = doc.splitTextToSize(`•  ${bullet}`, pageWidth - 32);
      doc.text(lines, 16, y);
      y += lines.length * 7 + 4;
      if (y > 170) break;
    }

    // Speaker notes footer
    if (slide.speakerNotes) {
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 180, pageWidth - 14, 180);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Notes : ${slide.speakerNotes}`, 14, 188, { maxWidth: pageWidth - 28 });
    }
  });

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "presentation";
  doc.save(`${slug}-campusmate.pdf`);
}

/**
 * Export a markdown/text document artifact as a clean A4 PDF report.
 */
export function exportDocumentPdf(title: string, content: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(title, 14, 14, { maxWidth: pageWidth - 28 });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  const cleanLines = doc.splitTextToSize(content || "", pageWidth - 28);
  let y = 34;

  for (const line of cleanLines) {
    if (y > pageHeight - 18) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 6;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "document";
  doc.save(`${slug}-campusmate.pdf`);
}

/**
 * Export a website artifact as a deploy-ready ZIP bundle (index.html + README.md)
 * compatible with Netlify Drop, Vercel CLI, and GitHub Pages.
 */
export async function exportWebsiteDeployZip(artifact: CreationArtifact): Promise<void> {
  if (!artifact.websiteData) return;
  const zip = new JSZip();
  const html = renderSandboxedWebsiteHtml(artifact.websiteData);

  zip.file("index.html", html);
  zip.file(
    "README.md",
    `# ${artifact.websiteData.brandName}\n\nGenerated with CampusMate Creation Studio.\n\n## Free Deployment Options\n1. **Netlify Drop**: Drag and drop this folder onto https://app.netlify.com/drop\n2. **GitHub Pages**: Push \`index.html\` to a GitHub repository and enable Pages.\n3. **Vercel**: Run \`npx vercel --prod\` inside this folder.\n`
  );

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const slug = artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "website";
  a.download = `${slug}-deploy-bundle.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate and download an RFC 5545 .ics calendar event compatible with
 * Google Calendar, Microsoft Outlook, and Apple Calendar.
 */
export function downloadIcsReminder(params: {
  title: string;
  description: string;
  startDate?: Date;
  durationMinutes?: number;
}): void {
  const start = params.startDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + (params.durationMinutes ?? 45) * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const escapeIcs = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CampusMate//ISET Beja V6//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:campusmate-${Date.now()}@isetb.rnu.tn`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeIcs(params.title)}`,
    `DESCRIPTION:${escapeIcs(params.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${params.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "campusmate-event"}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Build a Gmail Web Compose URL and standard mailto: URL for an email draft.
 */
export function buildEmailComposeLinks(params: {
  recipient: string;
  subject: string;
  body: string;
}): { gmailUrl: string; mailtoUrl: string } {
  const to = encodeURIComponent(params.recipient);
  const su = encodeURIComponent(params.subject);
  const body = encodeURIComponent(params.body);
  return {
    gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`,
    mailtoUrl: `mailto:${to}?subject=${su}&body=${body}`,
  };
}
