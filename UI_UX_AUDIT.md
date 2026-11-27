# CampusMate V10 UI/UX Audit

## Key Issues Identified & Resolved
1. **Tailwind v4 Dark Mode Variant Bug (Critical Visual Defect Found via Playwright Inspection)**
   - **Before**: `globals.css` defined `.dark { ... }` CSS variables, but lacked `@custom-variant dark (&:where(.dark, .dark *));`. As a result, Tailwind `dark:*` utility classes did not activate when `.dark` was toggled on `<html>`, causing dark text on dark surfaces and white inputs on dark backgrounds.
   - **After**: Added `@custom-variant dark (&:where(.dark, .dark *));` in `src/app/globals.css` and verified dark-mode contrast across desktop (`1440×900`) and mobile (`390×844`) Playwright screenshots.

2. **AI-Template Gradient & Badge Clutter**
   - **Before**: The AI Agent command bar (`src/app/student/agent/page.tsx`) used a blue-to-indigo gradient card (`bg-gradient-to-br from-blue-50/60 ...`), and the landing hero (`src/app/page.tsx`) stacked two colored pills plus three wrapping CTA buttons.
   - **After**: Replaced with solid surface tokens (`var(--bg-surface)` + `#E2E6EC` / `#303540` borders), single-row primary/secondary hero CTAs with a clean institutional link, and restrained editorial eyebrow.

3. **Social Feed & Shell Hierarchy**
   - **Before**: Unused icon imports in `dashboard-shell.tsx` (9 ESLint warnings), inconsistent button heights (`34px`/`38px`/`44px`), and plain text feed cards.
   - **After**: Removed all 9 unused imports (0 ESLint warnings), standardized `32px`/`40px`/`48px` control heights in `primitives.tsx`, added author avatar initials and clean feed filter pills (`#171A21` / `#F2F4F8` active state) in `src/app/student/home/page.tsx`.
