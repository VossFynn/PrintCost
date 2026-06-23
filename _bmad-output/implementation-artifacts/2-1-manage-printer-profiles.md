---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.1: Manage Printer Profiles

Status: review

## Story

As a maker,
I want to create and edit printer cost profiles,
so that electricity, depreciation, and base costs are available for calculations.

## Acceptance Criteria

1. **Given** user is on `Mehr`, **when** they open `Drucker verwalten`, **then** they can view existing active Printer Profiles, **and** they can start creating a new Printer Profile.
2. **Given** user enters Printer Profile data, **when** they save form, **then** `name`, `powerWatts`, `purchasePriceEur`, `lifetimeHours`, `electricityPriceEurKwh`, optional `annualBaseFeeEur`, and optional `note` are validated against domain contract, **and** invalid fields show German inline validation.
3. **Given** Printer Profile form is valid, **when** user saves, **then** `PrinterService` writes profile through `core/db`, **and** printer appears in active Printer Profile list.
4. **Given** Printer Profile already exists, **when** user edits and saves it, **then** updated values are persisted, **and** later calculation flows can select active profile.

## Tasks / Subtasks

- [x] Build printer management surface in `Mehr` (AC: 1)
  - [x] Add `Drucker verwalten` entry point on `/more` and printer list/detail flow.
  - [x] Render only active printers (`deleted: false`) on management list.
- [x] Extend printer domain model and persistence contract (AC: 2, 3)
  - [x] Keep required fields and optional fields aligned in `storage.models.ts`, service input type, and form model.
  - [x] Validate and sanitize before write (trim text, numeric range checks, optional note length).
- [x] Implement create/edit command path via service-owned mutations (AC: 2, 3, 4)
  - [x] Add `createPrinter`, `updatePrinter`, and `listActivePrinters` behavior in `PrinterService`.
  - [x] Keep write path `validate -> core/db write -> signal refresh`.
- [x] Add German inline validation and save-button disable logic (AC: 2)
  - [x] Inline field-level errors only; no global error wall.
- [x] Add focused tests (AC: 2, 3, 4)
  - [x] Service tests for valid create/edit, invalid payload rejection, and active-list filtering.
  - [x] Component tests for `Mehr` entry, inline validation, and successful save refresh.

## Dev Notes

### Epic Context

Epic 2 establishes printer and filament inputs for all future pricing. Story 2.1 is first hard dependency for Epic 3 calculation flows that require an active printer profile.

### Implementation Guardrails

- Route/component layer must not call IndexedDB directly; persistence only through `core/db` and service commands.
- User-facing copy and a11y names stay German; TypeScript symbols and file names stay English.
- Keep soft-delete semantics (`deleted`) in model because Story 2.2 depends on it.
- Do not add backend/network calls. Keep local-only PWA contract.

### Architecture Compliance

- AD-2/AD-3: service-owned mutations + readonly signals only.
- AD-7: preserve historical reproducibility; future snapshots rely on stable printer schema.
- AD-9: German UI + English implementation identifiers.
- AD-11: add tests for mutation paths and validation boundaries.

### Current UPDATE File Intelligence

- `src/app/domain/models/storage.models.ts`: `PrinterRecord` already has full cost fields and `deleted`; use this as canonical shape and avoid parallel model.
- `src/app/core/db/printcost-db.ts`: `printers` store exists with keyPath `id`; no indexes today. Writes already available via `db.put`.
- `src/app/core/printers/printer.service.ts`: currently only `refresh()` and `savePrinter()` with raw pass-through. Needs explicit create/edit/list-active/validation methods.
- `src/app/core/printers/printer.service.spec.ts`: currently single happy-path test. Extend to cover validation and filtering contracts.
- `src/app/features/more/more.component.ts` + `.html`: placeholder page only. Story adds printer management entry and flow host.
- `src/app/features/calculate/calculate.component.ts`: currently placeholder. Preserve decoupling; do not implement calculation UI in this story.

### File Structure Requirements

- Update existing:
  - `src/app/features/more/more.component.ts`
  - `src/app/features/more/more.component.html`
  - `src/app/core/printers/printer.service.ts`
  - `src/app/core/printers/printer.service.spec.ts`
  - `src/app/domain/models/storage.models.ts` (only if contract gap appears)
- Create as needed under feature boundaries:
  - `src/app/features/more/printers/*` (form/list/detail UI)
  - shared validation helper in `src/app/domain/validation/*` if reused.

### Library and Framework Requirements

- Angular 22 standalone + Signals + Typed Reactive Forms.
- Keep `idb` v8 usage through existing adapter (`initializePrintCostDatabase`), not direct raw IndexedDB APIs from UI.
- Keep current test stack (`vitest`, `fake-indexeddb`).

### Testing Requirements

- Unit test service validation/sanitization and active filtering.
- Unit/component test form invalid states show German inline errors and block save.
- Unit/component test edit path preserves `id/createdAt` and updates `updatedAt`.
- Ensure no regression to current route shell and Story 1 behavior.

### Git Intelligence Summary

- Recent commits show strict CSP/static-host hardening and Epic 1 completion. New story must preserve these constraints and avoid introducing network dependencies.

### Latest Tech Information

- Angular 22 ecosystem guidance favors standalone + Signals-first architecture and tighter change detection defaults; keep state updates explicit.
- idb v8 guidance: keep short transactions, await `tx.done` for multi-step writes, and keep upgrade logic forward-safe.
- Vitest 4 guidance: prefer focused service tests with deterministic fake-indexeddb setup; keep DI-heavy tests minimal.

### Project Context Reference

- No `project-context.md` file found in repository during discovery.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.1)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-7, AD-9, AD-11)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (build order step 5, builder rules)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (More flow, German copy, validation, accessibility)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/core/printers/printer.service.ts`
- `src/app/features/more/more.component.html`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Story created from Epic 2 requirements, architecture spine, UX spine, current codebase state, git history, and latest technical notes.
- Updated sprint status from `ready-for-dev` to `in-progress` at implementation start.
- Added printer management UI to `MoreComponent` with active list, edit flow, and German inline validation.
- Switched add/edit form to open in modal dialog flow for clearer create/edit interaction.
- Reworked `PrinterService` to service-owned create/update flows with validation and active-list signal.
- Added `PRINTCOST_DB_PROVIDER` injection token for DB provider wiring without direct component DB access.
- Added focused service and component tests for create/edit/validation/active filtering behavior.
- Ran full test suite and production build after implementation.

### Completion Notes List

- Implemented `Drucker verwalten` flow in `/more` with active profile list and in-place create/edit form.
- Printer add/edit form now opens in dialog from `Neuer Drucker` and `Bearbeiten`.
- Added German inline validation and save blocking for invalid inputs.
- Implemented `createPrinter`, `updatePrinter`, and `activePrinters` in `PrinterService` with sanitization and explicit errors.
- Preserved soft-delete semantics by filtering active list via `deleted: false` while retaining full list state.
- Added service and component tests covering valid create/edit, invalid payload rejection, and active filtering.

### File List

- `_bmad-output/implementation-artifacts/2-1-manage-printer-profiles.md`
- `src/app/core/printers/printer.service.ts`
- `src/app/core/printers/printer.service.spec.ts`
- `src/app/features/more/more.component.ts`
- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/features/more/more.component.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-23: Created Story 2.1 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented printer profile management UI and service validation/mutation flow; added tests and dialog-based add/edit flow; status set to `review`.
