# CampusMate V10 Design System

## 1. Design Philosophy
CampusMate V10 replaces generic hackathon/AI-template styling with a restrained, commercial EdTech design language inspired by Linear (precision, spacing, typography), Notion (calm hierarchy), Apple (restraint), Stripe (editorial clarity), and modern social apps (scan-friendly feeds).

## 2. Color System & Semantic Tokens (`src/app/globals.css`)
### Light Mode
- **Page Background (`--bg-page`)**: `#F7F8FA`
- **Primary Surface (`--bg-surface`)**: `#FFFFFF`
- **Secondary Surface (`--bg-muted`)**: `#F1F3F5`
- **Primary Text (`--text-main`)**: `#171A21`
- **Secondary Text (`--text-secondary`)**: `#515C6D`
- **Muted Text (`--text-muted`)**: `#697586`
- **Subtle Border (`--border-subtle`)**: `#E2E6EC`
- **Primary Accent (`--accent-primary`)**: `#2457D6` (hover `#1D46B8`)

### Dark Mode (`.dark` + `@custom-variant dark (&:where(.dark, .dark *));`)
- **Page Background (`--bg-page`)**: `#101114`
- **Primary Surface (`--bg-surface`)**: `#181A20`
- **Secondary Surface (`--bg-muted`)**: `#20232B`
- **Elevated Surface (`--bg-elevated`)**: `#292D36`
- **Primary Text (`--text-main`)**: `#F2F4F8`
- **Secondary Text (`--text-secondary`)**: `#BCC4D0`
- **Muted Text (`--text-muted`)**: `#929DAD`
- **Subtle Border (`--border-subtle`)**: `#303540`
- **Primary Accent (`--accent-primary`)**: `#739BFF` (hover `#5C88FA`)

## 3. Typography (`src/app/layout.tsx`)
- **Latin UI & Body**: `Inter` (`--font-sans`) with `optimizeLegibility`
- **Arabic RTL**: `IBM_Plex_Sans_Arabic` (`--font-arabic`, weights 400/500/600/700, `line-height: 1.7`)
- **Monospace / Code**: `JetBrains_Mono` (`--font-mono`)

## 4. Spacing, Radii & Motion
- **Cards**: `12px` (`rounded-xl`), crisp `1px` border, no heavy drop shadows.
- **Controls**: `8px` (`rounded-lg`), `32px` (`sm`), `40px` (`md`), `48px` (`lg`) heights.
- **Transitions**: `150ms cubic-bezier(0.16, 1, 0.3, 1)` with `@media (prefers-reduced-motion: reduce)` honored globally.
