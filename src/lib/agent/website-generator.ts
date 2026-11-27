import type { WebsiteProjectData } from "@/types/domain";

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHexColor(color: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(color.trim()) ? color.trim() : "#2563EB";
}

export function renderSandboxedWebsiteHtml(data: WebsiteProjectData): string {
  const brand = escapeHtml(data.brandName || "CampusMate Project");
  const primary = safeHexColor(data.primaryColor);
  const font =
    data.fontFamily === "serif"
      ? "Georgia, serif"
      : data.fontFamily === "mono"
        ? "ui-monospace, monospace"
        : "system-ui, -apple-system, sans-serif";

  const sectionsHtml = data.sections
    .map((sec) => {
      const itemsHtml =
        sec.items.length > 0
          ? `<div class="grid">${sec.items
              .map(
                (it) =>
                  `<div class="card"><h3>${escapeHtml(it.title)}</h3><p>${escapeHtml(it.description)}</p></div>`
              )
              .join("")}</div>`
          : "";
      if (sec.kind === "hero") {
        return `<section class="hero"><span class="badge">${brand}</span><h1>${escapeHtml(sec.heading)}</h1><p>${escapeHtml(sec.subheading)}</p><a href="#contact" class="btn">Découvrir</a></section>`;
      }
      return `<section id="${escapeHtml(sec.kind)}"><h2>${escapeHtml(sec.heading)}</h2><p class="sub">${escapeHtml(sec.subheading)}</p>${itemsHtml}</section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none';" />
<title>${brand}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${font}; color: #0f172a; background: #f8fafc; line-height: 1.6; }
  header { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
  .logo { font-weight: 700; color: ${primary}; font-size: 18px; }
  main { max-width: 1040px; margin: 0 auto; padding: 32px 20px; }
  section { margin-bottom: 40px; }
  .hero { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 48px 32px; text-align: center; }
  .badge { display: inline-block; background: ${primary}15; color: ${primary}; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
  h1 { font-size: 32px; margin-bottom: 12px; }
  h2 { font-size: 22px; margin-bottom: 8px; }
  .sub { color: #475569; margin-bottom: 20px; }
  .btn { display: inline-block; background: ${primary}; color: #ffffff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
  .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
  .card h3 { font-size: 16px; margin-bottom: 6px; }
  .card p { font-size: 14px; color: #475569; }
  footer { text-align: center; padding: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <header><span class="logo">${brand}</span><span>Aperçu généré par CampusMate Studio</span></header>
  <main>
    ${sectionsHtml}
    <section id="contact" class="card">
      <h2>Contact</h2>
      <p class="sub">${escapeHtml(data.contactPreviewNote)}</p>
    </section>
  </main>
  <footer>© ${new Date().getFullYear()} ${brand} — Généré avec CampusMate AI Website Builder</footer>
</body>
</html>`;
}
