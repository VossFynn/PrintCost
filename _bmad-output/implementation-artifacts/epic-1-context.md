# Epic 1 Context: App Shell, Local Data, and Offline Foundation

Status: ready-for-dev
Generated: 2026-06-23

## Epic Goal

Create the installable Angular PWA shell, establish the four primary surfaces, and lay the foundation for local-only storage and offline behavior without mixing business logic into route components.

This epic is the platform base for the rest of PrintCost. If the shell, routing, and layout contracts are wrong here, every later story inherits the mistake.

## Epic Scope

Epic 1 covers:

1. Installable Angular 22 app shell with strict TypeScript and standalone routing.
2. Persistent bottom navigation for `Kalkulation`, `Bestand`, `Filamente`, and `Mehr`.
3. Local IndexedDB schema v1 and seeded Settings.
4. Offline app-shell loading and update banner behavior.
5. Static hosting, CSP, and build verification baseline.

## Story Inventory

### Story 1.1: Create Installable Angular PWA Shell

Build the Angular 22 standalone shell, default redirect to `/calculate`, and persistent German bottom navigation.

Key risk: do not let shell work drift into design tokens, persistence, or feature logic. This story should create the frame and routing skeleton only.

### Story 1.2: Apply Design Tokens and Shared Shell UI

Add local DM Sans, warm cream surface, terracotta active state, and shared shell UI patterns.

Key risk: styling should not introduce feature logic or duplicate shell structure.

### Story 1.3: Initialize Local IndexedDB Schema and Settings

Create the local database adapter, schema v1 stores, migrations, and first-run Settings seed.

Key risk: route components must never talk to IndexedDB directly. Persistence belongs in `core/db` and services.

### Story 1.4: Enable Offline App Shell and Update Banner

Ensure app-shell precache behavior and user-controlled update notification flow.

Key risk: offline behavior must not block core flows or expose network assumptions.

### Story 1.5: Add Static Hosting, CSP, and Build Checks

Make the app safe to host as static files and verify production/build/PWA quality gates.

Key risk: keep user data local-only and do not introduce backend calls or hidden network transfer.

## Story 1.1 Implementation Context

This story is the first visible surface of the app and the default route path. It should establish:

- Angular 22 standalone app structure
- strict TypeScript
- lazy route shell with default redirect from `/` to `/calculate`
- four primary route placeholders: `/calculate`, `/inventory`, `/filaments`, `/more`
- persistent bottom navigation with German visible labels
- German accessible names and selected/current-state announcement
- layout that works on phone first and remains constrained on desktop

### Files likely to be created

- `angular.json`
- `package.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `src/main.ts`
- `src/index.html`
- `src/styles.scss`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/app/app.component.ts`
- `src/app/shell/*`
- `src/app/features/calculate/*`
- `src/app/features/inventory/*`
- `src/app/features/filaments/*`
- `src/app/features/more/*`

### Do Not Expand Scope

Do not implement these in Story 1.1:

- design token system and DM Sans bundling
- IndexedDB schema or Settings seed
- calculation engine or live result card
- offline caching/update banner behavior
- backup, import/export, or delete-all-data flows
- printer/filament/customer/business services

## Epic Guardrails

- Use Angular 22 standalone components/routes, strict TypeScript, Signals, Typed Reactive Forms, SCSS/CSS custom properties, `idb`, Angular service worker, and Lucide Angular.
- Feature screens may orchestrate UI state, but route components must not access IndexedDB directly.
- User-facing copy is German; implementation identifiers remain English.
- Route paths are fixed: `/calculate`, `/inventory`, `/filaments`, `/more`.
- Production builds must stay lazy-loaded.
- The app is mobile-first, phone-sized, and tool-like, not dashboard-like.

## Story Dependencies

- Story 1.1 should not depend on later stories.
- Story 1.2 assumes this shell exists.
- Story 1.3 assumes the shell and route scaffolding exist.
- Story 1.4 assumes PWA shell baseline exists.
- Story 1.5 assumes production build and app shell structure exist.

## References

- `_bmad-output/prd.md` section 9.1, 9.2, 10, 11, 12, 14
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` sections AD-1 through AD-11, stack, structural seed, hosted envelope
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` sections Foundation, Information Architecture, State Patterns, Responsive & Platform, German UI Copy Inventory
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` sections Typography, Layout & Spacing, Components
