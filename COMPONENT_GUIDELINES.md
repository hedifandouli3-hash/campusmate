# CampusMate V10 Component Guidelines

## Primitives (`src/components/ui/primitives.tsx`)
- **`Button`**:
  - Variants: `primary` (`#2457D6`), `secondary` (`#20232B` / `#292D36`), `outline`, `ghost`, `danger`.
  - Sizes: `sm` (`32px`), `md` (`40px`), `lg` (`48px`).
  - Focus ring: `focus-visible:ring-2 focus-visible:ring-[#2457D6] dark:focus-visible:ring-[#739BFF]`.
- **`Card`**: Uses `.cm-card` (`var(--bg-surface)` + `1px` `var(--border-subtle)` + `rounded-xl`). Add `interactive` only for clickable cards.
- **`Input` / `Select` / `Textarea`**: `min-h-[40px]`, `rounded-lg`, explicit light/dark surface and placeholder tokens (`#697586` / `#929DAD`).
- **`Tabs`**: Segmented control on `var(--bg-muted)` with elevated active tab (`#FFFFFF` / `#292D36`).
- **`StatusBadge`**: Always pairs an icon with explicit text (never relies on color alone).
