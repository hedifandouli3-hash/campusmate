# CampusMate V6 — Generated Code & Studio Security

Implemented in `src/lib/agent/website-generator.ts` and `src/app/student/studio/page.tsx`.

## Threat Model
AI-generated website previews must never execute arbitrary scripts in the CampusMate origin, access `document.cookie`, `localStorage`, or `sessionStorage`, or perform unauthorized network requests.

## Controls
1. **Strict HTML Escaping**: `escapeHtml()` encodes `&`, `<`, `>`, `"`, and `'` on all user/LLM-supplied brand names, headings, subheadings, and item fields.
2. **Hex Color Validation**: `safeHexColor()` validates `/^#[0-9A-Fa-f]{6}$/` and falls back to `#2563EB`, blocking `javascript:` or CSS injection payloads.
3. **Strict Content Security Policy (CSP)**: Every generated HTML document embeds:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none';" />`
4. **Iframe Sandbox Isolation**: Studio renders website previews inside `<iframe sandbox="allow-scripts" srcDoc={sandboxHtml} />` without `allow-same-origin`, preventing any access to CampusMate's origin, cookies, or APIs.
