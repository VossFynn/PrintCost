---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 1.2: Apply Design Tokens and Shared Shell UI

Status: review

## Story

As a maker,  
I want the app shell to look and feel like the PrintCost design,  
so that every feature starts from a consistent mobile-first interface.

## Acceptance Criteria

1. **Given** the app shell renders, **when** styles load, **then** local DM Sans typography is applied, **and** no external runtime font request is required.
2. **Given** the design token system is implemented, **when** the shell and bottom navigation render, **then** warm cream app surface, white cards, terracotta primary accent, slate ink, muted taupe dividers, spacing, radius, and type tokens match `DESIGN.md`.
3. **Given** the viewport width is 320 px, **when** the user views the app shell, **then** no horizontal page scrolling is required, **and** bottom navigation remains usable.
4. **Given** shared shell UI is implemented, **when** future features add screens, **then** they can use shared page container and tokenized styles without redefining app-level colors, spacing, or typography.

## Tasks / Subtasks

- [x] Establish global design-token foundation (AC: 1, 2, 4)
  - [x] Define CSS custom properties for color, typography, spacing, radius, and key component tokens from UX `DESIGN.md`.
  - [x] Replace hardcoded shell/page colors and typography with token usage.
  - [x] Keep token names English and semantic (`--pc-color-primary`, `--pc-space-4`, etc.).
- [x] Bundle and apply local DM Sans (AC: 1)
  - [x] Add DM Sans assets under project-local static assets (no runtime CDN).
  - [x] Register font via local `@font-face` with `font-display: swap`.
  - [x] Apply DM Sans globally while keeping safe fallback stack.
- [x] Tokenize shared shell + feature placeholders (AC: 2, 4)
  - [x] Update `src/app/shell/shell.component.scss` and shared page styles to use tokens for app background, card/nav surfaces, borders, active states, and typography.
  - [x] Keep existing route structure and nav labels unchanged.
  - [x] Ensure feature placeholder pages inherit tokenized container styles with no duplicated style constants.
- [x] Mobile-first fit and motion accessibility pass (AC: 3)
  - [x] Validate layout at 320 px: no horizontal overflow, bottom nav tap targets remain usable.
  - [x] Add reduced-motion handling for non-essential transitions in shell/navigation styles.
  - [x] Avoid hover-only affordances.
- [x] Guardrails and focused tests (AC: 1, 2, 3, 4)
  - [x] Add/adjust tests to protect nav labels/state plus tokenized shell expectations where practical.
  - [x] Add a focused assertion that no external font stylesheet/script is introduced in app shell/bootstrap.
  - [x] Keep tests focused on shell contract; do not add business-feature tests.

## Dev Notes

### Epic Context

Story 1.2 is visual/system foundation for all later stories. It must apply the UX token contract and shared shell styles without introducing feature logic, persistence logic, or route restructuring.

### Current Code Context (files likely UPDATED)

- `src/styles.scss`
  - **Current state:** Global reset + system font stack + hardcoded app background/text colors.
  - **Change in this story:** Introduce token definitions, local font-face registration import/use, global typography token application.
  - **Must preserve:** Global box sizing/reset behavior and app-wide baseline styles.
- `src/app/shell/shell.component.scss`
  - **Current state:** Hardcoded shell/nav colors, spacing, border, active-state colors.
  - **Change in this story:** Replace with tokenized values matching UX spine and keep current mobile-first shell structure.
  - **Must preserve:** Persistent bottom nav behavior, active route highlighting, safe-area bottom padding.
- `src/app/shared/page-styles.scss`
  - **Current state:** Shared placeholder page typography/colors with hardcoded values.
  - **Change in this story:** Tokenized typography/spacing/colors and reusable page container contract.
  - **Must preserve:** Existing `.page` structure consumed by all placeholder routes.
- `src/app/features/*/*.scss`
  - **Current state:** Each feature SCSS imports shared page styles only.
  - **Change in this story:** Keep this pattern; avoid per-feature token duplication.
  - **Must preserve:** Feature-level style simplicity.
- `src/app/shell/shell.component.html`, `src/app/shell/shell.component.ts`, `src/app/app.routes.ts`
  - **Current state:** Correct German labels, accessibility names, route paths.
  - **Change in this story:** Styling-only touch unless strictly needed.
  - **Must preserve:** `/calculate`, `/inventory`, `/filaments`, `/more`; German labels; `aria-current` behavior.

### Implementation Guardrails

- Use Angular 22 standalone + strict TypeScript stack already established; no architecture drift.  
  [Source: `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` AD-1]
- User-facing copy/accessibility labels remain German, implementation identifiers remain English.  
  [Source: ARCHITECTURE-SPINE AD-9; EXPERIENCE Foundation]
- No external runtime fonts, analytics, cloud sync, or backend calls.  
  [Source: ARCHITECTURE-SPINE AD-1, AD-10; IMPLEMENTATION-HANDOFF Non-Negotiable Rules]
- Primary color semantics: terracotta for active/primary controls; filament colors are content-only, not nav/action chroma.  
  [Source: `DESIGN.md` Colors, Do/Don't]
- Keep mobile-first constrained shell; do not turn app into wide dashboard layout.  
  [Source: EXPERIENCE Responsive & Platform; DESIGN Layout & Spacing]
- Reduced motion support required for non-essential transitions.  
  [Source: EXPERIENCE Accessibility Floor]

### Technical Requirements

- Token coverage for at least:
  - Surfaces: app, card, muted surface
  - Borders/dividers: subtle and muted taupe family
  - Ink: primary/secondary/muted/label
  - Accent: terracotta primary + foreground
  - Success color
  - Typography ramp (title/body/meta/nav/section label)
  - Radius and spacing scale used by shell and shared page container
- Local DM Sans font pipeline:
  - Font files local to repository assets
  - Local `@font-face`
  - `font-display: swap`
  - No `fonts.googleapis.com` or other runtime font hosts in markup/styles
- Shell/navigation behavior must remain semantically intact (styling upgrade only).
- Keep 44x44 minimum touch targets for nav interactions.

### Library & Framework Requirements

- Angular core/router/forms/service-worker ecosystem stays on existing Angular 22 baseline.
- Continue SCSS + CSS custom properties; do not introduce CSS-in-JS or alternate styling framework.
- If icon refinement is touched, stay consistent with architecture direction for `shared/icons` and planned Lucide usage (no breaking nav behavior now).

### File Structure Requirements

- Keep source tree aligned with architecture seed:
  - `src/app/shell/` owns shell frame/nav visuals
  - `src/app/shared/` holds reusable style primitives
  - Feature routes consume shared styles, do not redefine app-wide tokens
- Likely files touched:
  - `src/styles.scss`
  - `src/app/shell/shell.component.scss`
  - `src/app/shared/page-styles.scss`
  - Optional supporting asset/style files under `src/assets` for local DM Sans
- Do not move route files or alter lazy-loading route structure.

### Testing Requirements

- Keep or extend existing route-shell tests to ensure no regression in:
  - Root redirect to `/calculate`
  - German nav labels and selected state announcement
  - Persistent nav presence
- Add focused checks for Story 1.2 contracts:
  - Local font usage strategy present (no external runtime font include)
  - 320 px usability/no horizontal overflow (component/style-level smoke)
  - Tokenized active state still visible and deterministic
- Production build must still succeed after token/font integration.

### Previous Story Intelligence (1.1)

- Story 1.1 already delivered shell, lazy routes, German nav labels, baseline PWA scaffold, and tests.
- Current shell styling uses hardcoded color values; Story 1.2 should refactor those to tokens, not rebuild shell architecture.
- Runtime environment note from prior work: Angular build/test may require Node 22 wrapper in this environment; preserve existing command conventions if local Node mismatch appears.
- Keep scope discipline from Story 1.1: do not add IndexedDB, business logic, offline-banner behavior, or feature workflows yet.

### Git Intelligence Summary

- Repository currently shows only baseline commit (`a26f68e Initial commit`).
- Practical implication: rely primarily on current workspace file state and Story 1.1 artifact log for implementation patterns.

### Latest Technical Information

- Self-hosted font best practice for Angular standalone apps: keep font files local, register with `@font-face`, apply via global styles, and verify no external font network calls at runtime.
- Motion accessibility baseline: honor `@media (prefers-reduced-motion: reduce)` for non-essential transitions/animations in shell/nav styles.

### Project Structure Notes

- This is still foundation phase. Story 1.2 should improve visual system and reusable styling contract only.
- If conflicts arise between mock details and spines, use UX/architecture spines as contract source.
- Prefer token-driven styles that future stories can reuse in `calculate`, `inventory`, `filaments`, and `more` without restating color/spacing/typography constants.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 1.2 acceptance criteria; UX coverage map (UX-DR4/5/6/7/8/9/11/29/32)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` — Colors, Typography, Layout & Spacing, Components, Do/Don't
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` — Foundation, Component Patterns, Accessibility Floor, Responsive & Platform
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` — AD-1, AD-9, AD-10, AD-11, Structural Seed, Accessibility conventions
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` — Build order step 2, non-negotiable rules
- `_bmad-output/implementation-artifacts/1-1-create-installable-angular-pwa-shell.md` — previous story outputs and constraints
- `_bmad-output/implementation-artifacts/epic-1-context.md` — Epic 1 scope and Story 1.2 risk framing
- `_bmad-output/prd.md` §14 Delivery Plan (Phase 0 token requirement)

## Dev Agent Record

### Agent Model Used

OpenAI GPT-5.3-Codex

### Debug Log References

- Workflow activation loaded with no prepend/append overrides.
- Persistent fact glob `**/project-context.md` resolved with no matches.
- Story auto-selected from sprint status first ready story: `1-2-apply-design-tokens-and-shared-shell-ui`.
- Baseline validation run: `npm test` and production build via Node 22 wrapper before implementation.
- Added local DM Sans font assets under `public/fonts` and introduced tokenized global style contract.
- Updated shell/page SCSS to tokenized colors/spacing/typography and added reduced-motion override.
- Extended route-shell test to assert reduced-motion style presence and no external font host links/scripts.
- Final validation run: `npm test` and production build via `npx -y node@22 ./node_modules/.bin/ng build`.

### Completion Notes List

- Implemented global PrintCost token system in `src/styles.scss` with semantic `--pc-*` variables for color, spacing, radius, and typography.
- Bundled local DM Sans (weights 400/500/600/700) and applied via local `@font-face` with `font-display: swap`.
- Replaced hardcoded shell and shared page style values with token-driven values while preserving route structure, labels, and navigation behavior.
- Added reduced-motion support for shell link transitions and maintained touch-first navigation without hover-only behavior.
- Added focused contract assertions in route-shell test for reduced-motion style and no external font script/stylesheet inclusion.
- Verified tests and production build pass after implementation.

### File List

- `public/fonts/dm-sans-latin-400-normal.woff2`
- `public/fonts/dm-sans-latin-500-normal.woff2`
- `public/fonts/dm-sans-latin-600-normal.woff2`
- `public/fonts/dm-sans-latin-700-normal.woff2`
- `src/styles.scss`
- `src/index.html`
- `src/app/shell/shell.component.scss`
- `src/app/shared/page-styles.scss`
- `src/app/app.routes.spec.ts`
- `_bmad-output/implementation-artifacts/1-2-apply-design-tokens-and-shared-shell-ui.md`

## Change Log

- 2026-06-23: Created Story 1.2 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented design tokens, local DM Sans font bundling, tokenized shell/page styling, reduced-motion handling, and focused shell/font guardrail tests; status set to `review`.
