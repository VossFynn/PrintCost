---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.3: Manage Filament Records and Purchase History

Status: review

## Story

As a maker,
I want to create and edit filament rolls with purchase data,
so that material cost basis and stock state are accurate enough for pricing.

## Acceptance Criteria

1. **Given** user opens `Filamente`, **when** list loads, **then** active Filaments are shown, **and** user can start creating a Filament.
2. **Given** user enters Filament data, **when** they save form, **then** `name`, `type`, `colorHex`, optional `manufacturer`, `rollWeightG`, `remainingG`, `purchases`, `multiColorSurchargeEurKg`, and optional `fixedPriceEurG` are validated against domain contract, **and** invalid fields show German inline validation.
3. **Given** user creates or edits purchases, **when** form is saved, **then** at least one purchase with valid price, quantity, and ISO date is required, **and** purchase data is persisted with Filament.
4. **Given** Filament has low or zero `remainingG`, **when** Filament appears in list, **then** it remains selectable and visible, **and** low/zero state is shown with text or icon, not color alone.

## Tasks / Subtasks

- [x] Expand filament domain record and storage contract (AC: 2, 3)
  - [x] Add missing filament fields and purchase-entry structure to model types.
  - [x] Keep backward compatibility defaults for existing minimal records.
- [x] Build filament create/edit flow on `/filaments` (AC: 1, 2, 3)
  - [x] Add list + form entry with German labels.
  - [x] Validate required and optional fields inline.
- [x] Implement filament service command/query API (AC: 1, 2, 3, 4)
  - [x] Active-list query excludes `deleted: true`.
  - [x] Create/edit writes via `core/db`, refreshes signal state.
  - [x] Purchase list validation enforces at least one valid purchase row.
- [x] Implement low/zero-stock indication that remains selectable (AC: 4)
  - [x] Add explicit state text/icon; do not rely on color only.
- [x] Add tests (AC: 2, 3, 4)
  - [x] Service tests for validation boundaries and purchase persistence.
  - [x] UI tests for inline errors and low-stock accessibility state.

## Dev Notes

### Epic Context

Story 2.3 creates base filament data model needed by Story 2.4 price-basis math and Story 2.5 list filtering/search.

### Previous Story Intelligence

- Stories 2.1/2.2 establish service-owned CRUD + soft-delete conventions. Reuse same mutation pipeline and confirmation/validation style.

### Implementation Guardrails

- Keep filament rows selectable even at `remainingG <= 0`.
- Preserve future soft-delete compatibility: keep `deleted` field, avoid hard deletes.
- Use German user copy and error text; keep TypeScript contracts English.
- Validate purchases with ISO date strings at save boundary.

### Architecture Compliance

- AD-2/AD-3: no DB calls from route component; service owns writes and signal refresh.
- AD-6/AD-7: future print deduction resolves by filament id, so id stability and historical records matter.
- AD-9: German labels and accessibility text.

### Current UPDATE File Intelligence

- `FilamentRecord` in `storage.models.ts` currently too minimal (`id/name/type/deleted/updatedAt` only); must be expanded carefully.
- `printcost-db.ts` already has `filaments` store and indexes on `type` and `deleted`; can support list/filter semantics.
- `filaments.component.ts/.html` currently placeholder and ready for first real UI implementation.
- No filament service exists yet; new service should live under `src/app/core/filaments/` to match current `core/printers` pattern.

### File Structure Requirements

- Update:
  - `src/app/domain/models/storage.models.ts`
  - `src/app/core/db/printcost-db.ts` (only if schema/index changes required)
  - `src/app/features/filaments/filaments.component.ts`
  - `src/app/features/filaments/filaments.component.html`
- Create:
  - `src/app/core/filaments/filament.service.ts`
  - `src/app/core/filaments/filament.service.spec.ts`
  - optional filament form/list subcomponents under `src/app/features/filaments/*`

### Library and Framework Requirements

- Angular Typed Reactive Forms for nested purchase entries.
- Signals for in-memory query state.
- `idb` adapter through `initializePrintCostDatabase`.

### Testing Requirements

- Validate field constraints and purchase requirements.
- Validate low/zero-stock remains selectable and has non-color indicator text/icon.
- Validate persistence keeps purchase history stable across edit.

### Git Intelligence Summary

- Current repo has only Epic 1 primitives. Story should add filaments incrementally, keeping shell and deployment hardening untouched.

### Latest Tech Information

- Angular 22: keep form state and derived validation simple, signal-driven, and explicit.
- idb v8: when writing filament + purchase arrays, treat full object write as single transaction boundary and refresh signal after write success.

### Project Context Reference

- No `project-context.md` file found in repository during discovery.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.3)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-6, AD-7, AD-9)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Filaments flow, low-stock state, German validation)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/features/filaments/filaments.component.html`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Story created with explicit model-expansion and purchase-history constraints from Epic 2 ACs.

### Completion Notes List

- Story status set to `ready-for-dev`.
- Added anti-regression guardrails for low-stock behavior and future stock-deduction semantics.
- Expanded filament storage model with purchase history and pricing fields while preserving compatibility with legacy minimal records through service normalization defaults.
- Implemented `FilamentService` with active-list filtering, create/update command pipeline via core DB adapter, and save-boundary validation including ISO purchase date and at-least-one-purchase enforcement.
- Built `/filaments` dialog-based create/edit UI with German labels, inline validation messages, and dirty-dialog close confirmation.
- Added explicit non-color stock state text (`Kein Bestand`, `Niedriger Bestand`, `Bestand verfügbar`) while keeping all active filaments selectable.
- Added regression tests for service validation/persistence and UI dialog validation + low-stock accessibility state.

### File List

- `_bmad-output/implementation-artifacts/2-3-manage-filament-records-and-purchase-history.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/domain/models/storage.models.ts`
- `src/app/core/filaments/filament.service.ts`
- `src/app/core/filaments/filament.service.spec.ts`
- `src/app/features/filaments/filaments.component.ts`
- `src/app/features/filaments/filaments.component.html`
- `src/app/features/filaments/filaments.component.scss`
- `src/app/features/filaments/filaments.component.spec.ts`

## Change Log

- 2026-06-23: Created Story 2.3 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented filament create/edit dialog flow, purchase-history validation/persistence, and low-stock accessibility states; status set to `review`.
