# CampusMate V10 Accessibility Report

## Implemented Safeguards
- **Color Contrast**: Light (`#171A21` on `#FFFFFF`/`#F7F8FA`) and Dark (`#F2F4F8` on `#181A20`/`#101114`, `#BCC4D0` secondary) exceed WCAG AA 4.5:1 contrast.
- **Keyboard & Focus**:
  - Global `:focus-visible` outline (`2px solid var(--accent-primary)`, `2px` offset).
  - Skip-to-content link (`Aller au contenu principal`) in `dashboard-shell.tsx`.
  - `Ctrl+K` global search shortcut.
- **Semantics & Reduced Motion**:
  - Icon-only buttons include `aria-label` (theme toggle, mobile menu, notifications, hide/report post).
  - `StatusBadge` pairs icons (`CheckCircle2`, `Clock`, `XCircle`, `Info`) with text labels.
  - `@media (prefers-reduced-motion: reduce)` disables non-essential animations in `src/app/globals.css`.
