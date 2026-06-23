---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 1.1: Create Installable Angular PWA Shell

Status: review

## Story

As a maker,
I want to open PrintCost as an installable app with German navigation,
so that I can start from the main calculation workflow on phone or desktop.

## Acceptance Criteria

1. Angular 22 standalone app structure exists with strict TypeScript enabled.
2. Production build succeeds.
3. Opening `/` redirects to `/calculate`.
4. Visible surface label on first load is `Kalkulation`.
5. Persistent bottom navigation exists for `/calculate`, `/inventory`, `/filaments`, and `/more`.
6. Visible navigation labels are `Kalkulation`, `Bestand`, `Filamente`, and `Mehr`.
7. Each navigation item has a German accessible name.
8. Current route announces selected/current state for keyboard and screen-reader users.
9. Shell stays phone-first and constrained on desktop rather than stretching into a dashboard layout.
10. Route setup uses lazy-loaded feature entry points, not a monolithic eager shell.

## Tasks / Subtasks

- [x] Scaffold Angular 22 standalone app baseline
  - [x] Create root application files and strict TypeScript config
  - [x] Set up standalone bootstrap with routed shell
  - [x] Add minimal PWA installability scaffold needed for shell install flow
  - [x] Keep project structure aligned with `src/app/`
- [x] Create route shell and default redirect
  - [x] Redirect `/` to `/calculate`
  - [x] Add placeholder route entry points for `calculate`, `inventory`, `filaments`, and `more`
  - [x] Ensure route paths stay English and visible labels stay German
- [x] Build persistent bottom navigation
  - [x] Render four items with icon above label
  - [x] Mark active route with selected/current state
  - [x] Add German accessible names and keyboard-friendly activation
- [x] Verify shell behavior
  - [x] Confirm app opens on `Kalkulation`
  - [x] Confirm navigation remains persistent across route changes
  - [x] Confirm production build succeeds
- [x] Add focused tests
  - [x] Redirect test for `/` -> `/calculate`
  - [x] Navigation state/accessibility smoke test
  - [x] Build-level verification for scaffold completeness

## Dev Notes

### Epic Context

This is the first story in Epic 1, the platform foundation epic. It should create only the shell and routing skeleton needed for later stories. Do not drift into design tokens, local persistence, offline cache, or business logic.

### Implementation Guardrails

- Use Angular 22 standalone components/routes, strict TypeScript, SCSS, Signals-ready structure, and lazy route loading. [Source: `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` AD-1, AD-11]
- Keep route paths fixed to `/calculate`, `/inventory`, `/filaments`, `/more`. Visible labels are German. [Source: `_bmad-output/prd.md` §9.1 and `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` IA table]
- Shell and bottom navigation belong in `src/app/shell/`. Feature screens own their routes, not the shell. [Source: architecture structural seed]
- Do not call IndexedDB from route components. Persistence is out of scope for this story. [Source: architecture AD-2]
- Do not use a dashboard-first or analytics-first opening flow. App opens to calculation. [Source: PRD overview, UX anti-patterns]
- Add only the minimum PWA installability hooks required for the shell baseline; keep offline cache/update-banner polish for Story 1.4. [Source: `_bmad-output/prd.md` §14 and architecture build order]

### Technical Requirements

- Angular app bootstrap should be standalone, not NgModule-based. [Source: architecture AD-1]
- Route config should use lazy loading / `loadComponent` style entry points. [Source: `_bmad-output/prd.md` §9.2 and architecture AD-11]
- Shell must preserve mobile-first layout and remain constrained on desktop. [Source: UX `Responsive & Platform` and `Layout & Spacing`]
- Screen-reader and keyboard users need German accessible names and selected-state announcement on bottom nav. [Source: UX `Accessibility Floor` and `State Patterns`]

### File Structure Requirements

Create the scaffold in the architecture shape, even if some files start as placeholders:

- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/app/app.component.ts`
- `src/app/shell/`
- `src/app/features/calculate/`
- `src/app/features/inventory/`
- `src/app/features/filaments/`
- `src/app/features/more/`

Keep TypeScript identifiers in English. Keep labels and visible copy in German. [Source: architecture AD-9]

### Testing Requirements

- Verify redirect from `/` to `/calculate`.
- Verify bottom-nav labels and selected state.
- Verify production build succeeds after scaffold.
- Add only focused tests necessary to protect the shell contract; deeper feature tests belong to later stories.

## Project Structure Notes

- This repo currently has no Angular source tree yet, so this story is a greenfield scaffold inside an existing planning workspace.
- The implementation must set the app up for later Epic 1 stories without hardcoding later behavior.
- If a choice conflicts with PRD draft language, prefer the architecture spine and UX spine. In particular, the architecture already standardizes Angular 22 and the exact route paths.

## References

- `_bmad-output/prd.md` §9.1, §9.2, §10, §11, §14
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` AD-1, AD-2, AD-9, AD-11, structural seed, hosted envelope
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` build order step 1 and step 2
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` Foundation, Information Architecture, State Patterns, Accessibility Floor, Responsive & Platform
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` Typography, Layout & Spacing, Components
- `_bmad-output/implementation-artifacts/epic-1-context.md`

## Dev Agent Record

### Agent Model Used

OpenAI GPT-5

### Debug Log References

- Generated Angular 22 standalone scaffold with CLI, then adapted it to PrintCost routing and shell contracts.
- Installed dependencies with `npm install --no-audit --no-fund`.
- Validated tests with `npm test` and validated production build with `npx -y node@22 ./node_modules/.bin/ng build` because host Node 26.3.1 aborted Angular build.

### Completion Notes List

- Created standalone Angular shell with lazy route entry points for `/calculate`, `/inventory`, `/filaments`, and `/more`.
- Added persistent bottom navigation with German labels, aria labels, and `aria-current` state.
- Added minimal PWA installability scaffold via manifest and placeholder icons.
- Added route and app tests covering root redirect and shell navigation accessibility.
- Verified build output and tests pass under Node 22 runtime wrapper.

### File List

- `angular.json`
- `package.json`
- `package-lock.json`
- `public/favicon.ico`
- `public/icon-192.svg`
- `public/icon-512.svg`
- `public/manifest.webmanifest`
- `src/index.html`
- `src/main.ts`
- `src/styles.scss`
- `src/app/app.component.html`
- `src/app/app.component.scss`
- `src/app/app.component.spec.ts`
- `src/app/app.component.ts`
- `src/app/app.config.ts`
- `src/app/app.routes.spec.ts`
- `src/app/app.routes.ts`
- `src/app/features/calculate/calculate.component.html`
- `src/app/features/calculate/calculate.component.scss`
- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/filaments/filaments.component.html`
- `src/app/features/filaments/filaments.component.scss`
- `src/app/features/filaments/filaments.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/features/inventory/inventory.component.scss`
- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/features/more/more.component.ts`
- `src/app/shared/page-styles.scss`
- `src/app/shell/shell.component.html`
- `src/app/shell/shell.component.scss`
- `src/app/shell/shell.component.ts`
- `tsconfig.app.json`
- `tsconfig.json`
- `tsconfig.spec.json`

## Change Log

- 2026-06-23: Built Angular 22 standalone shell, lazy route setup, persistent German bottom navigation, minimal PWA installability scaffold, and route tests. Verified `ng build` and `ng test` under Node 22 wrapper.
