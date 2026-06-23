---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 1.4: Enable Offline App Shell and Update Banner

Status: review

## Story

As a maker,  
I want PrintCost to keep loading after first visit and tell me when an update is available,  
so that I can keep working without surprise reloads.

## Acceptance Criteria

1. **Given** a production build has been loaded once, **when** the browser goes offline and the user reloads the app, **then** app shell and local assets still load, **and** user can reach the four primary routes.
2. **Given** Angular service worker is configured, **when** cache rules are inspected, **then** app shell and local assets are precached, **and** user-created IndexedDB data is not cached through runtime network caching.
3. **Given** a new service worker version is available, **when** app detects update, **then** a German non-blocking banner/toast appears, **and** user chooses when to reload.
4. **Given** update checking fails while offline, **when** app handles failure, **then** core workflows are not blocked, **and** no global error wall is shown.

## Tasks / Subtasks

- [x] Enable production PWA/service worker configuration (AC: 1, 2)
  - [x] Add/validate Angular service worker config and `ngsw-config` with app-shell/local-asset caching.
  - [x] Ensure route shell assets required for `/calculate`, `/inventory`, `/filaments`, `/more` are available offline after first load.
  - [x] Exclude runtime caching patterns that imply backend/network data ownership.
- [x] Implement update-availability UX flow (AC: 3, 4)
  - [x] Add non-blocking German update banner/toast in shell layer.
  - [x] Provide explicit user action to reload/apply update.
  - [x] Keep banner behavior resilient when offline/update check fails.
- [x] Preserve local-only data guarantees (AC: 2, 4)
  - [x] Confirm service worker does not attempt to cache IndexedDB/user data.
  - [x] Avoid global blocking error states on update check failures.
- [x] Add focused validation tests/checks (AC: 1, 2, 3, 4)
  - [x] Add service worker/update flow tests where practical.
  - [x] Add smoke validation for offline app-shell route availability.

## Dev Notes

### Epic Context

Story 1.4 introduces offline shell reliability and controlled update messaging. It must not alter business logic or local data ownership boundaries.

### Implementation Guardrails

- Service worker should precache shell and local assets only; no hidden network sync assumptions.  
  [Source: ARCHITECTURE-SPINE AD-10]
- Update UX must be non-blocking and user-controlled reload.  
  [Source: ARCHITECTURE-SPINE AD-10; EXPERIENCE State Patterns]
- Keep German UI copy in update banner/toast.
- Preserve lazy-loaded routes and shell behavior from Story 1.1.
- No backend/API calls introduced.

### Technical Requirements

- Service worker configuration should support:
  - App shell precache
  - Local static assets precache (icons, manifest, local fonts)
  - Safe handling for lazy chunks in production build
- Update flow:
  - Detect available SW update
  - Show German non-blocking message (`Update verfügbar - jetzt neu laden` pattern)
  - Execute reload only on user confirmation
- Offline failure handling:
  - Update check failures should log/report without blocking navigation.

### File Structure Requirements

- Likely touched:
  - `angular.json` (if service worker flags/production config need adjustment)
  - `src/app/shell/` (banner/toast UI + update control)
  - PWA config files (`ngsw-config.json` and related assets if needed)
- Keep route ownership and feature boundaries unchanged.

### Testing Requirements

- Validate:
  - Offline reload after first load keeps shell accessible
  - Route navigation remains available offline
  - Update prompt is non-blocking and action-driven
  - No regression to root redirect and nav behavior tests
- Production build should continue passing with service worker enabled.

### Previous Story Intelligence

- Story 1.1 delivered installable shell baseline with manifest/icons.
- Story 1.2 handles visual token system; reuse shell styling primitives for update banner.
- Story 1.3 introduces IndexedDB; Story 1.4 must not blur DB ownership with SW caching behavior.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 1.4 acceptance criteria
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` — AD-1, AD-10, AD-11
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` — Build order step 7 and non-negotiable rules
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` — State Patterns (Offline, Update available), Accessibility/interaction expectations
- `_bmad-output/prd.md` — Delivery plan and offline/PWA expectations

## Dev Agent Record

### Agent Model Used

OpenAI GPT-5.3-Codex

### Debug Log References

- Story derived from Epic 1 offline/update acceptance criteria and architecture AD-10 constraints.
- Story auto-selected from sprint status first ready story (`1-4-enable-offline-app-shell-and-update-banner`) and moved to `in-progress`.
- Red phase: added service worker/update banner tests first; confirmed failures from missing update service and missing Angular service-worker package.
- Added `@angular/service-worker` dependency and configured production build `serviceWorker: "ngsw-config.json"`.
- Added `ngsw-config.json` with app-shell/assets prefetch groups and no runtime `dataGroups`.
- Implemented `UpdateBannerService` with non-blocking monitoring, German update availability state, explicit apply/dismiss actions, and offline-safe error logging.
- Wired service worker provider in app config and integrated update banner UI/actions in shell component.
- Added focused tests for update banner service and shell banner rendering.
- Final validation run: `npm test` and production build via `npx -y node@22 ./node_modules/.bin/ng build`.

### Completion Notes List

- Context includes SW scope boundaries, update-banner behavior, and local-only data guarantees.
- Enabled Angular service worker generation for production build using `ngsw-config.json`.
- Added app-shell and local asset precache rules (`index`, JS/CSS bundles, manifest, icons, local fonts) and intentionally no runtime data caching groups.
- Added German non-blocking update banner in shell with explicit `Jetzt neu laden` and `Später` actions.
- Update monitoring failures now log errors without blocking app navigation or rendering.
- Existing route shell behavior and lazy route structure preserved.
- Added tests covering update state handling and shell banner visibility.

### File List

- `package.json`
- `package-lock.json`
- `angular.json`
- `ngsw-config.json`
- `src/app/app.config.ts`
- `src/app/shell/shell.component.ts`
- `src/app/shell/shell.component.html`
- `src/app/shell/shell.component.scss`
- `src/app/shell/update-banner.service.ts`
- `src/app/shell/update-banner.service.spec.ts`
- `src/app/shell/shell.component.spec.ts`
- `_bmad-output/implementation-artifacts/1-4-enable-offline-app-shell-and-update-banner.md`

## Change Log

- 2026-06-23: Created Story 1.4 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented service worker/offline shell config, German non-blocking update banner flow, and focused update/offline smoke tests; status set to `review`.
