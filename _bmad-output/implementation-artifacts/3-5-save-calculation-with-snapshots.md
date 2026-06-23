---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 3.5: Save Calculation With Snapshots

Status: review

## Story

As a maker,
I want to save a planned calculation without deducting filament,
so that I can print it later and keep the price reproducible.

## Acceptance Criteria

1. **Given** the Calculation form is valid, **when** the user saves it, **then** the saved Calculation stores `printerSnapshot`, each `filamentSnapshot`, selected Price Modes, calculated price per gram, inputs, and computed outputs.
2. **Given** the Calculation is saved, **when** persistence completes, **then** `timesPrinted` can be `0`, **and** no Filament `remainingG` value is deducted.
3. **Given** source Printer Profiles, Filaments, Settings, or purchases later change, **when** the saved Calculation is opened, **then** historical pricing remains readable and reproducible from snapshots.
4. **Given** save succeeds, **when** feedback is shown, **then** the user sees German confirmation, **and** the saved Calculation appears under `Bestand > Drucke`.

## Tasks / Subtasks

- [x] Implement the save flow and snapshot payload (AC: 1-4)
  - [x] Persist the full Calculation snapshot payload.
  - [x] Keep the save path free of filament deduction.
- [x] Update inventory visibility after save (AC: 2, 4)
  - [x] Make saved Calculations available for the `Bestand > Drucke` surface.
  - [x] Allow planned entries with `timesPrinted = 0`.
- [x] Preserve historical reproducibility (AC: 3)
  - [x] Store snapshot values that do not drift when source records change later.
- [x] Add focused regression checks (AC: 1-4)
  - [x] Verify snapshot fields are stored.
  - [x] Verify save does not deduct filament.
  - [x] Verify later source edits do not mutate the saved record.
- [x] Documentation requirement
  - [x] Add TSDoc for snapshot assembly and persistence helpers.
  - [x] Add clarifying comments only where non-obvious snapshot copying happens.

## Dev Notes

### Epic Context

This story turns a priced calculation into a saved historical record. It is the bridge between live calculation and inventory tracking.

### Story Context

- Saving a calculation must not behave like printing it.
- The record needs to stay readable later even if upstream Printer Profiles or Filaments change.
- The inventory surface will consume these saved calculations in Epic 4.

### Implementation Guardrails

- Do not deduct filament on save.
- Keep snapshot data immutable once stored.
- Do not collapse save and print-occurrence behaviors into one command.

### Architecture Compliance

- AD-5: saved calculations are not printed inventory.
- AD-6: only explicit print occurrence deducts stock.
- AD-7: snapshots preserve historical correctness.
- AD-9: user confirmation and labels stay German.

### Current UPDATE File Intelligence

- `src/app/domain/models/storage.models.ts` currently defines a minimal `CalculationRecord`; it will need the snapshot fields required by the save flow.
- `src/app/core/db/printcost-db.ts` currently has a `calculations` store with only basic indexing.
- `src/app/features/calculate/` still contains placeholders, so the save action must be introduced alongside the calculation UI.
- `src/app/features/inventory/` will eventually read the saved calculations.

### File Structure Requirements

- Update:
  - `src/app/domain/models/storage.models.ts`
  - `src/app/core/db/printcost-db.ts`
  - `src/app/features/calculate/*`
- Reuse the existing `calculations` store; do not invent a parallel save store.

### Testing Requirements

- Regression checks must cover:
  - snapshot field persistence
  - zero-printed saved calculations
  - no filament deduction on save
  - historical immutability after later source edits

### Project Structure Notes

- Keep the save payload aligned with the future inventory card so Epic 4 does not need a second mapping layer.
- If persistence helpers grow complex, keep them in the core/db or a dedicated calculation service, not in the component.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.5)
- `_bmad-output/prd.md` (FR-7)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-5, AD-6, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Stock And Inventory Semantics)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Save success state)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/features/calculate/calculate.component.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

- `npm run test -- --watch=false --include='src/app/core/calculations/calculation.service.spec.ts' --include='src/app/features/calculate/calculate.component.spec.ts' --include='src/app/features/inventory/inventory.component.spec.ts'`
- `npm run verify:quality`

### Completion Notes List

- Added `CalculationService` snapshot persistence flow with full payload storage, `timesPrinted = 0`, and deep-cloned historical snapshots.
- Wired Calculate save submit to persist `printerSnapshot`, filament line snapshots (selected mode + computed price/gram), full engine input/output, and German success feedback.
- Added Bestand > Drucke rendering of planned saved calculations so records are visible in inventory without print deduction semantics.
- Added regression coverage for snapshot persistence, no filament deduction, immutable historical snapshots, calculate save feedback, and inventory visibility.

### File List

- `src/app/core/calculations/calculation.service.ts`
- `src/app/core/calculations/calculation.service.spec.ts`
- `src/app/domain/models/storage.models.ts`
- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/calculate/calculate.component.html`
- `src/app/features/calculate/calculate.component.spec.ts`
- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/features/inventory/inventory.component.spec.ts`
- `_bmad-output/implementation-artifacts/3-5-save-calculation-with-snapshots.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-23: Created Story 3.5 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented Story 3.5 end-to-end with TDD, added snapshot save + inventory visibility, and set status to `review`.
