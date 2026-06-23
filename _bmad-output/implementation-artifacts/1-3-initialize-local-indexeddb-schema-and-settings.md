---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 1.3: Initialize Local IndexedDB Schema and Settings

Status: review

## Story

As a maker,  
I want PrintCost to store my data locally,  
so that my records stay on my device and work offline.

## Acceptance Criteria

1. **Given** the app starts for the first time, **when** local storage initializes, **then** `core/db` opens IndexedDB schema version 1, **and** stores exist for `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, and `settings`.
2. **Given** Settings do not exist yet, **when** the database initializes, **then** default Settings are seeded exactly once, **and** later app starts do not duplicate or overwrite user-edited Settings.
3. **Given** a feature component needs data, **when** it reads or writes local data, **then** it uses a service API, **and** no feature component imports or calls the IndexedDB adapter directly.
4. **Given** a local database smoke test runs, **when** it writes and reads a test settings value through `core/db`, **then** the stored value round-trips successfully, **and** typical read/write operations complete within target budget where meaningful.

## Tasks / Subtasks

- [x] Create `core/db` IndexedDB foundation (AC: 1)
  - [x] Add connection module with schema versioning (`v1`), upgrade callback, and typed store map.
  - [x] Create all v1 stores and indexes per architecture contract.
  - [x] Keep adapter ownership in `core/db` only.
- [x] Define domain models and settings defaults (AC: 1, 2)
  - [x] Add English model interfaces/enums under `domain/models` for v1 entities.
  - [x] Define default settings object and seed helper.
  - [x] Ensure seed runs exactly once and is idempotent.
- [x] Create service-level access pattern (AC: 3)
  - [x] Introduce initial service APIs (signals + command/query shape) for settings and at least one additional store as pattern.
  - [x] Confirm feature routes do not import db adapter directly.
- [x] Add database smoke tests (AC: 4)
  - [x] Validate open/migrate path and store availability.
  - [x] Validate settings seed behavior (first-run seed, no overwrite on later runs).
  - [x] Validate round-trip write/read for settings key/value.
- [x] Wire minimal app bootstrap integration (AC: 1, 2)
  - [x] Ensure db init path runs safely at startup without blocking shell rendering.
  - [x] Surface failures as explicit errors (no silent fallback).

## Dev Notes

### Epic Context

Story 1.3 introduces persistent local storage contract used by every later feature. Wrong schema or ownership boundaries here propagate defects into all epics.

### Implementation Guardrails

- `core/db` is sole IndexedDB adapter; route components must never call IndexedDB directly.  
  [Source: ARCHITECTURE-SPINE AD-2]
- Use Angular 22 + strict TypeScript + `idb` package from architecture stack.  
  [Source: ARCHITECTURE-SPINE AD-1, Stack]
- Keep German UI / English implementation separation in model and store names.  
  [Source: ARCHITECTURE-SPINE AD-9]
- No backend/network/cloud behavior introduced; local-only data.  
  [Source: ARCHITECTURE-SPINE AD-10; IMPLEMENTATION-HANDOFF rules]

### Technical Requirements

- IndexedDB v1 stores and indexes must match architecture:
  - `printers` (key `id`)
  - `filaments` (key `id`, indexes `type`, `deleted`)
  - `calculations` (key `id`, indexes `customerId`, `deleted`, `updatedAt`)
  - `sales` (key `id`, indexes `calculationId`, `customerId`, `date`)
  - `customers` (key `id`, index `deleted`)
  - `templates` (key `id`, index `updatedAt`)
  - `parts` (key `id`, index `calculationId`)
  - `settings` (key `key`)
- Include migration-safe scaffolding for future schema bumps.
- Settings seed must be exactly-once and non-destructive to edited values.
- Keep write paths service-owned and validated before persistence.

### File Structure Requirements

- New/updated areas should align to architecture seed:
  - `src/app/core/db/`
  - `src/app/domain/models/`
  - `src/app/core/locale/` (if helper needed for defaults/parsing)
  - `src/app/features/*` should consume services only
- Do not move shell/router scaffolding from Story 1.1.

### Testing Requirements

- Add focused unit/smoke coverage for:
  - DB open + v1 schema creation
  - Store/index presence checks
  - Settings seed once-only behavior
  - Settings round-trip write/read
- Keep shell route tests from Story 1.1 passing.

### Previous Story Intelligence

- Story 1.1 delivered shell/routing only; persistence intentionally deferred.
- Story 1.2 covers visual tokens; keep DB work independent from styling scope.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 1.3 acceptance criteria
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` — AD-1, AD-2, AD-3, AD-9, AD-10, IndexedDB v1 Stores table, Structural Seed
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` — Build order step 3, non-negotiable rules
- `_bmad-output/implementation-artifacts/epic-1-context.md` — Story dependency and risk framing

## Dev Agent Record

### Agent Model Used

OpenAI GPT-5.3-Codex

### Debug Log References

- Story derived from Epic 1 backlog sequence and architecture db contract.
- Story auto-selected from sprint status first ready story (`1-3-initialize-local-indexeddb-schema-and-settings`) and status moved to `in-progress`.
- Red phase: added database/service tests first; confirmed failures from missing db/services and missing IndexedDB test harness.
- Added `idb` runtime dependency and `fake-indexeddb` dev dependency for deterministic IndexedDB smoke tests in Vitest.
- Implemented `core/db` module with schema v1 stores/indexes, singleton db initialization, default settings seeding, and helper read/write/delete functions.
- Implemented service-level query/command pattern via `SettingsService` and `PrinterService` using readonly signals and async writes.
- Wired startup initialization in `main.ts` after bootstrap with explicit error logging (`Failed to initialize local database`).
- Final validation run: `npm test` and production build via `npx -y node@22 ./node_modules/.bin/ng build`.

### Completion Notes List

- Context includes explicit v1 store/index contract, seed rules, and service-boundary constraints.
- Added full IndexedDB v1 schema and index setup for `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, and `settings`.
- Added idempotent settings seed defaults (`defaultCurrency`, `locale`) that only write missing keys and preserve user-edited values.
- Added db smoke tests for schema/index creation, seed-once behavior, and setting round-trip through `core/db`.
- Added initial service APIs (settings + printers) exposing readonly signal state and async command methods.
- Confirmed feature route components still do not import `core/db` directly.
- Bootstrap now triggers database initialization without blocking first render and surfaces init failures explicitly.

### File List

- `package.json`
- `package-lock.json`
- `src/main.ts`
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/core/db/printcost-db.spec.ts`
- `src/app/core/settings/settings.service.ts`
- `src/app/core/settings/settings.service.spec.ts`
- `src/app/core/printers/printer.service.ts`
- `src/app/core/printers/printer.service.spec.ts`
- `_bmad-output/implementation-artifacts/1-3-initialize-local-indexeddb-schema-and-settings.md`

## Change Log

- 2026-06-23: Created Story 1.3 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented IndexedDB schema v1, settings seed and db smoke tests, added initial settings/printer services, and wired non-blocking startup db initialization; status set to `review`.
