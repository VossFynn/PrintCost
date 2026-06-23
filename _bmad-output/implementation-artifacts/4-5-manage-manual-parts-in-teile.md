---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 4.5: Manage Manual Parts in Teile

Status: review

## Story

As a maker,
I want to track manual parts separately from saved calculations,
so that non-calculated inventory still has a count.

## Acceptance Criteria

1. **Given** the user opens `Bestand > Teile`
   **When** the Parts area renders
   **Then** manual Part records are shown separately from saved Calculation records.
2. **Given** the user creates a Part
   **When** they save name, quantity, optional linked Calculation, and optional note
   **Then** the Part is persisted
   **And** a Part without linked Calculation remains valid.
3. **Given** a Part exists
   **When** the user uses inline increment or decrement controls
   **Then** the quantity updates locally
   **And** quantity cannot be reduced below zero.
4. **Given** invalid Part input is entered
   **When** the user attempts to save
   **Then** German inline validation appears
   **And** invalid data is not persisted.

## Tasks / Subtasks

- [ ] Implement Teile surface separation for manual parts vs saved calculations (AC: 1)
  - [ ] Add/render a dedicated manual Parts area under `Bestand > Teile`.
  - [ ] Ensure saved Calculations stay in `Bestand > Drucke` and are not mixed into manual Part rows.
- [ ] Implement manual Part create flow with optional calculation link (AC: 2)
  - [ ] Persist `name`, `quantity`, optional `calculationId`, and optional `note` into the parts store.
  - [ ] Keep creation valid when no linked Calculation is selected.
- [ ] Implement inline quantity controls with non-negative guard (AC: 3)
  - [ ] Add inline increment/decrement commands for existing Part rows.
  - [ ] Clamp/debounce updates so quantity never persists below `0`.
- [ ] Implement German validation and invalid-write protection (AC: 4)
  - [ ] Show German inline validation for invalid Part form input.
  - [ ] Block persistence when validation fails.
- [ ] Add focused regression coverage (AC: 1-4)
  - [ ] Verify parts/calc separation in inventory rendering.
  - [ ] Verify creation with and without linked Calculation.
  - [ ] Verify inline decrement floor at zero.
  - [ ] Verify invalid input does not persist and German inline feedback is shown.

## Dev Notes

### Epic Context

Epic 4 introduces inventory operations beyond saved calculations. Story 4.5 adds manual `Teile` tracking so non-calculated stock is managed without corrupting the saved calculation lifecycle in `Drucke`.

### Story Context

- `Bestand` now needs two clear inventory lanes: snapshot-backed saved Calculations (`Drucke`) and manually managed Parts (`Teile`).
- Manual parts can optionally reference a Calculation, but must remain valid as standalone records.
- Quantity changes are local inventory operations and must be safe against negative values.

### Implementation Guardrails

- Keep saved Calculation inventory behavior unchanged; this story must not alter snapshot, print occurrence, or sale semantics.
- Keep manual Part persistence and mutations service-owned (no direct IndexedDB writes from components).
- Preserve German visible copy for labels, validation, and confirmations.

### Architecture Compliance

- AD-3: Service-owned mutation and signal refresh for Part create/update actions.
- AD-5: Saved Calculations stay under `Bestand > Drucke`; manual Part records stay under `Bestand > Teile`.
- AD-6: Manual Part quantity actions must not deduct filament stock.
- AD-9: German UI copy, English implementation identifiers.

### Current UPDATE File Intelligence

- `src/app/features/inventory/inventory.component.ts` currently renders only planned saved calculations from `CalculationService`; no manual parts state exists yet.
- `src/app/features/inventory/inventory.component.html` currently shows only `Bestand > Drucke`; `Teile` UI and part controls need to be introduced without regressing existing `Drucke` output.
- `src/app/features/inventory/inventory.component.spec.ts` currently asserts saved planned calculations rendering; extend it to cover parts separation and inline quantity behavior.
- `src/app/domain/models/storage.models.ts` currently defines `PartRecord` minimally (`id`, optional `calculationId`) and will need fields aligned to this story (`name`, `quantity`, optional `note`, timestamps as needed).
- `src/app/core/db/printcost-db.ts` already has a `parts` store and `calculationId` index; reuse this store and evolve schema/contracts only as required for Part record completeness.
- `src/app/core/calculations/calculation.service.ts` currently owns calculation/template persistence only; avoid overloading it with manual parts responsibilities unless architecture introduces an inventory/parts service boundary.

### Library and Framework Requirements

- Use Angular 22 standalone component patterns and Signals consistent with existing feature code.
- Use `idb` access through project service/database abstractions; do not bypass established persistence patterns.

### File Structure Requirements

- Update:
  - `src/app/features/inventory/inventory.component.ts`
  - `src/app/features/inventory/inventory.component.html`
  - `src/app/features/inventory/inventory.component.spec.ts`
  - `src/app/domain/models/storage.models.ts`
  - `src/app/core/db/printcost-db.ts` (only if schema/index adjustments are required)
- Add:
  - `src/app/core/inventory/*` or equivalent service module if needed to keep mutations out of the component.
- Avoid:
  - changing calculation formula/domain code for this story
  - coupling Part quantity updates to filament stock deduction logic

### Testing Requirements

- Component/service tests must cover:
  - separation of manual Parts from saved Calculations in inventory UI
  - create Part persistence with optional linked Calculation and optional note
  - inline increment/decrement behavior with non-negative floor
  - invalid input handling with German inline validation and blocked persistence
- Keep regression checks for existing `Bestand > Drucke` rendering behavior.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.5)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-5, AD-6, AD-9; IndexedDB stores)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Stock and inventory semantics, manual Part rule)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Inventory flow and German inline validation expectations)
- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/features/inventory/inventory.component.spec.ts`
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`

## Story Completion Status

- Story creation context complete. Status is `ready-for-dev`.

## Change Log

- 2026-06-23: Created Story 4.5 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented Story 4.5 with AC automation; status set to `review`.
