---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 4.1: Show Saved Calculations in Drucke Inventory

Status: ready-for-dev

## Story

As a maker,
I want saved calculations listed under `Bestand > Drucke`,
So that planned and printed jobs are easy to find.

## Acceptance Criteria

1. **Given** the user opens `/inventory`
   **When** the Inventory screen renders
   **Then** it provides `Drucke` and `Teile` areas or tabs
   **And** `Drucke` is available for saved Calculations.
2. **Given** saved Calculations exist
   **When** `Drucke` is active
   **Then** saved Calculations are listed, including entries with `timesPrinted = 0`
   **And** each card shows project name, quantity printed, quantity sold, rounded price, and last update date.
3. **Given** the user filters `Drucke`
   **When** they choose `Alle`, `Auf Lager`, `Teilweise`, `Vollständig`, or `Verschenkt`
   **Then** the list updates to matching saved Calculations
   **And** one filter is active at a time.
4. **Given** no saved Calculations exist
   **When** the Inventory screen renders
   **Then** a German empty state appears
   **And** it offers a CTA back to `Kalkulation`.

## Tasks / Subtasks

- [ ] Build `Bestand` inventory segmentation for `Drucke` and `Teile` (AC: 1)
  - [ ] Ensure `Drucke` is present as the saved-calculation surface when `/inventory` opens.
  - [ ] Keep the structure compatible with later `Teile` story work without duplicating container logic.
- [ ] Render saved calculation cards in `Drucke`, including planned entries (AC: 2)
  - [ ] Include records where `timesPrinted = 0`.
  - [ ] Show project name, printed quantity, sold quantity, rounded price, and last update date per card.
- [ ] Add `Drucke` filter chips with single-active behavior (AC: 3)
  - [ ] Implement `Alle`, `Auf Lager`, `Teilweise`, `Vollständig`, and `Verschenkt`.
  - [ ] Recompute visible cards based on the selected filter state only.
- [ ] Add German inventory empty state and `Kalkulation` CTA (AC: 4)
  - [ ] Display empty-state copy when no saved calculations exist.
  - [ ] Provide a clear navigation CTA back to `Kalkulation`.
- [ ] Add focused regression checks for inventory listing and filters (AC: 1-4)
  - [ ] Verify `Drucke` availability and segmented structure.
  - [ ] Verify planned (`timesPrinted = 0`) entries render in list output.
  - [ ] Verify each filter returns matching saved-calculation subsets with single-active state.
  - [ ] Verify empty-state + CTA behavior when list is empty.
- [ ] Documentation requirement
  - [ ] Add TSDoc for inventory filtering and view-model mapping helpers where non-trivial.
  - [ ] Add clarifying comments only for non-obvious UI-state transitions or status classification logic.

## Dev Notes

### Epic Context

Epic 4 introduces operational inventory workflows on top of saved calculation snapshots from Epic 3. Story 4.1 is the entry point for viewing saved calculations in `Bestand > Drucke` before print occurrence and sales workflows are layered in later stories.

### Story Context

- Story 3.5 already made saved calculations visible in inventory at a basic level, but only planned entries are currently shown with minimal fields.
- Story 4.1 expands this into the proper `Drucke` inventory list experience with status filtering and full card fields needed by follow-up stories (4.2-4.4).
- This story must preserve snapshot/historical semantics established by Epic 3 while adding inventory UX behavior.

### Implementation Guardrails

- Do not move persistence into the component; continue reading inventory data through services/signals.
- Do not deduct filament or alter print/sale counters in this story; this story is display/filter behavior only.
- Keep German user-facing copy and English code symbols/routes.
- Keep one active filter at a time and avoid multi-select chip behavior.

### Architecture Compliance

- **AD-3 (Service-Owned Mutation And Signals):** Inventory UI should consume service signals/view-models; avoid direct IndexedDB access in feature components.
- **AD-5 (Saved Calculation Is Not Printed Inventory):** Saved calculations, including `timesPrinted = 0`, must be visible under `Bestand > Drucke`.
- **AD-7 (Snapshots And Referential Integrity):** Display values from saved records/snapshots without mutating historical data.
- **AD-9 (German UI, English Implementation):** Visible labels, empty states, and CTA text remain German; implementation naming remains English.

### Current UPDATE File Intelligence

- `src/app/features/inventory/inventory.component.ts` currently exposes only `plannedCalculations` (`timesPrinted === 0`), so filter/status support and richer card projection are not yet present.
- `src/app/features/inventory/inventory.component.html` currently renders a single `Drucke` list with project name + planned state + rounded price; it does not yet provide `Teile` segmentation, filter chips, or full card metrics.
- `src/app/features/inventory/inventory.component.spec.ts` currently verifies the minimal planned-list rendering; test coverage needs expansion for segmentation, filters, card fields, and empty-state CTA.
- `src/app/core/calculations/calculation.service.ts` already provides `activeSavedCalculations` and sorted refresh behavior; this should remain the source for inventory listing.
- `src/app/domain/models/storage.models.ts` and `src/app/core/db/printcost-db.ts` already define `CalculationRecord`, `SaleRecord`, and related stores/indexes required for inventory projections; reuse these contracts.

### File Structure Requirements

- Update:
  - `src/app/features/inventory/inventory.component.ts`
  - `src/app/features/inventory/inventory.component.html`
  - `src/app/features/inventory/inventory.component.spec.ts`
  - `src/app/features/inventory/inventory.component.scss` (only if needed for filter/segment presentation)
- Reuse:
  - `src/app/core/calculations/calculation.service.ts` signal outputs for saved calculations
  - existing domain storage models in `src/app/domain/models/storage.models.ts`
- Do not introduce a parallel inventory persistence layer or duplicate saved-calculation store logic.

### Testing Requirements

- Add/expand component tests for:
  - `Drucke` + `Teile` availability/segmentation behavior
  - rendering of saved calculations including `timesPrinted = 0`
  - card field visibility: project, printed, sold, rounded price, last update date
  - single-active filter behavior for `Alle`, `Auf Lager`, `Teilweise`, `Vollständig`, `Verschenkt`
  - German empty state + CTA to `Kalkulation`
- Keep regression scope limited to Story 4.1 behavior; print occurrence and sale mutation paths belong to later stories.

### Project Structure Notes

- Keep inventory UI logic feature-local in `features/inventory` while using service-provided data as the single source of truth.
- Shape card/status mapping so Stories 4.2-4.4 can extend the same inventory card without reworking this story’s data flow.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.1)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-5, AD-7, AD-9; inventory capability map)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Stock And Inventory Semantics; Source Tree Seed; Test Floor)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Information Architecture; State Patterns; Required German Labels; Flow 2 inventory behavior)
- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/features/inventory/inventory.component.spec.ts`
- `src/app/core/calculations/calculation.service.ts`

## Story Completion Status

- Creation context complete - story prepared for development handoff.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

- N/A (story creation only)

### Completion Notes List

- Created Story 4.1 implementation artifact with exact acceptance criteria alignment from Epic 4.
- Added implementation guardrails, architecture constraints, and current file intelligence for `features/inventory`.
- Set story status to `ready-for-dev` for handoff.

### File List

- `_bmad-output/implementation-artifacts/4-1-show-saved-calculations-in-drucke-inventory.md`

## Change Log

- 2026-06-23: Created Story 4.1 implementation context; status set to `ready-for-dev`.
