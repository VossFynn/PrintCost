---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 4.2: Record Print Occurrence With Stock Deduction

Status: review

## Story

As a maker,
I want to tap `+1` or record a print occurrence,
So that printed count and filament stock stay aligned.

## Acceptance Criteria

1. **Given** a saved Calculation exists, **When** the user taps `+1` or confirms `Druck verbuchen`, **Then** `timesPrinted` increments by one, **And** no new Calculation is created.
2. **Given** the saved Calculation has Filament lines, **When** the print occurrence is recorded, **Then** the saved total `gramsUsed` for each line is deducted once from current Filament `remainingG`, **And** deduction resolves by saved `filamentId`, including soft-deleted Filament records.
3. **Given** current `remainingG` is lower than required grams, **When** the print occurrence is recorded, **Then** the print occurrence is not blocked, **And** `remainingG` is clamped to `0` with a German warning.
4. **Given** a referenced Filament record is missing, **When** the print occurrence is attempted, **Then** the command is blocked, **And** a German data error explains that stock deduction cannot be completed.

## Tasks / Subtasks

- [x] Implement print-occurrence command path for saved calculations (AC: 1)
  - [x] Add explicit `+1` / `Druck verbuchen` action wiring on inventory saved-calculation cards.
  - [x] Increment `timesPrinted` on the existing saved Calculation record only (no new Calculation creation).
- [x] Implement stock deduction using saved filament line snapshots (AC: 2)
  - [x] Deduct saved `gramsUsed` once per filament line from current `remainingG`.
  - [x] Resolve filament targets by saved `filamentId`, including soft-deleted records.
- [x] Implement low-stock clamp behavior (AC: 3)
  - [x] Allow command execution when `remainingG` is below required grams.
  - [x] Clamp resulting `remainingG` to `0` and surface German warning feedback.
- [x] Implement missing-filament blocking path (AC: 4)
  - [x] Block command when any referenced filament record is missing.
  - [x] Show German data-error feedback describing failed stock deduction.
- [x] Add focused regression checks (AC: 1-4)
  - [x] Verify `timesPrinted` increment without new Calculation creation.
  - [x] Verify single-pass deduction by saved filament lines and soft-deleted lookup path.
  - [x] Verify low-stock clamp-to-zero warning path.
  - [x] Verify missing-filament blocker + German error path.

## Dev Notes

### Epic Context

Epic 4 shifts from planned calculations to operational inventory events. This story introduces the first explicit print-occurrence mutation that changes both print counters and filament stock.

### Story Context

- Story 3.5 established saved calculations with `timesPrinted = 0` and no stock deduction on save.
- Story 4.1 surfaces saved calculations in `Bestand > Drucke`; this story adds the transactional `+1` behavior there.
- Deduction semantics must be driven by saved snapshot links (`filamentId`) instead of current selection UI state.

### Implementation Guardrails

- Keep save (`Kalkulation speichern`) and print occurrence (`Druck verbuchen`) as separate commands.
- Apply stock deduction exactly once per recorded occurrence.
- Never create a second Calculation when recording a print occurrence.
- Keep user-facing warnings/errors German.

### Architecture Compliance

- AD-5: saved calculations remain inventory records, not transient form state.
- AD-6: only explicit print occurrence deducts filament stock.
- AD-7: deduction uses saved snapshot lineage for deterministic behavior.
- AD-9: feedback copy and labels remain German.

### Current UPDATE File Intelligence

- `src/app/core/calculations/calculation.service.ts` currently supports save/template flows but has no print-occurrence mutation API yet.
- `src/app/features/inventory/inventory.component.ts` currently reads planned calculations and refreshes them, but exposes no `+1` action handler.
- `src/app/features/inventory/inventory.component.html` currently renders a passive list (`Geplant`) with no command controls.
- `src/app/domain/models/storage.models.ts` already contains `CalculationRecord.timesPrinted` and filament snapshot linkage (`filamentSnapshots[].filamentId`, `gramsUsed`).
- `src/app/core/db/printcost-db.ts` already provides `calculations` and `filaments` stores required for one transaction boundary.

### File Structure Requirements

- Update:
  - `src/app/core/calculations/calculation.service.ts`
  - `src/app/core/calculations/calculation.service.spec.ts`
  - `src/app/features/inventory/inventory.component.ts`
  - `src/app/features/inventory/inventory.component.html`
  - `src/app/features/inventory/inventory.component.spec.ts`
- Reuse existing IndexedDB stores (`calculations`, `filaments`); do not add parallel stock-tracking stores.

### Testing Requirements

- Regression checks must cover:
  - `timesPrinted` increment with no new Calculation record creation
  - deduction by saved `filamentId` including soft-deleted filament records
  - low-stock non-blocking path with clamp-to-zero behavior
  - missing-filament blocked path with German data-error messaging
  - German warning copy for understock deduction path

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.2)
- `_bmad-output/prd.md` (FR-8)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-5, AD-6, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Stock And Inventory Semantics)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Inventory `Drucke`, feedback states)
- `src/app/core/calculations/calculation.service.ts`
- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`

## Story Completion Status

- Implementation complete and review-ready with automated AC coverage.

## Change Log

- 2026-06-23: Created Story 4.2 implementation context artifact; status set to `ready-for-dev`.
- 2026-06-23: Implemented print-occurrence stock deduction flow, German feedback paths, and focused AC regression coverage; status set to `review`.
