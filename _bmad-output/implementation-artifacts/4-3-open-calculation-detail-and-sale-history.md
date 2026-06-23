---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 4.3: Open Calculation Detail and Sale History

Status: review

## Story

As a maker,
I want to inspect a saved calculation and its sales,
So that I can understand stock, price, and transaction history.

## Acceptance Criteria

1. **Given** the user is viewing a `Drucke` inventory card, **when** they tap the card outside quick actions, **then** a Calculation detail route, sheet, or full-screen view opens, **and** the current bottom navigation state remains associated with `Bestand`.
2. **Given** the Calculation detail is open, **when** data renders, **then** it shows snapshot-based printer, filament, input, and cost breakdown data, **and** historical totals do not change when source records were edited later.
3. **Given** Sales or Gifts exist for the Calculation, **when** the detail view renders, **then** it shows printed, sold, gifted, and remaining counts, **and** it lists sale/gift records with date, price/gift state, optional Customer, and note when present.
4. **Given** the detail view is open, **when** the user presses browser back or Escape where supported, **then** the detail view closes before the app leaves the Inventory surface.

## Tasks / Subtasks

- [x] Add inventory-to-detail open flow from `Drucke` cards (AC: 1)
  - [x] Wire card tap behavior so quick actions and detail-open actions remain distinct.
  - [x] Keep bottom navigation context anchored to `Bestand` while detail is open.
- [x] Render immutable snapshot-backed calculation detail content (AC: 2)
  - [x] Show printer snapshot, filament snapshots, calculation inputs, and cost breakdown fields from saved snapshot data.
  - [x] Ensure displayed historical totals come from persisted snapshot values, not mutable live source records.
- [x] Add sale/gift history section in calculation detail (AC: 3)
  - [x] Aggregate and display printed/sold/gifted/remaining counts for the selected calculation.
  - [x] List sale/gift records with date, price or gift state, optional customer, and optional note.
- [x] Implement close-before-leave back behavior for deep detail flow (AC: 4)
  - [x] Handle browser back and Escape (where supported) to close detail first.
  - [x] Prevent accidental exit from Inventory while detail is the active deep state.
- [x] Add focused regression coverage for detail and history flow (AC: 1-4)
  - [x] Verify opening detail keeps `Bestand` navigation association.
  - [x] Verify snapshot fields drive rendered detail data.
  - [x] Verify counts and sale/gift list rendering for mixed history records.
  - [x] Verify back/Escape closes detail before route exit.
- [x] Documentation requirement
  - [x] Add TSDoc for new detail-view orchestration and snapshot/history mapping helpers.
  - [x] Add clarifying comments only where back-navigation interception or state derivation is non-obvious.

## Dev Notes

### Epic Context

Epic 4 introduces inventory operations on saved calculations. Story 4.3 creates the read-only detail/history surface that users inspect before recording additional sales or gifts.

### Story Context

- Story 3.5 already persists calculation snapshots suitable for historical display.
- Inventory currently lists planned calculations; this story adds drill-in detail semantics from that list.
- Story 4.4 will extend this surface with sales/gifts mutation flows; this story should establish the stable detail baseline first.

### Implementation Guardrails

- Treat this as detail/history viewing only; do not bundle sale-record mutation behavior from Story 4.4.
- Prefer snapshot-backed rendering for historical correctness; avoid recomputing totals from mutable source entities.
- Preserve Inventory-first navigation semantics: deep detail closes first, then broader route transitions.
- Keep all visible user copy in German.

### Architecture Compliance

- AD-3: service-owned reads/derivations for detail and history state.
- AD-5: saved calculations are inventory records, not immediate stock deductions.
- AD-7: snapshot integrity must preserve historical reproducibility.
- AD-9: German UI labels, feedback, and inline guidance.

### Current UPDATE File Intelligence

- `src/app/features/inventory/inventory.component.ts` currently exposes planned calculation list state but no detail-open route/state handling.
- `src/app/features/inventory/inventory.component.html` currently renders simple `Drucke` list rows without interactive drill-in or history details.
- `src/app/core/calculations/calculation.service.ts` already provides saved calculation snapshots via `savedCalculations`/`activeSavedCalculations`, which should remain the source for detail snapshot rendering.
- `src/app/domain/models/storage.models.ts` currently defines only a minimal `SaleRecord`; detail history rendering may require model enrichment for price/gift/note metadata expected by AC 3.
- `src/app/app.routes.ts` currently has top-level `inventory` route only; detail route/sheet state needs to preserve bottom-nav association with `Bestand`.

### File Structure Requirements

- Update:
  - `src/app/features/inventory/*`
  - `src/app/core/calculations/calculation.service.ts` (or a dedicated inventory-facing service if read logic grows)
  - `src/app/domain/models/storage.models.ts` (if sale history fields need expansion)
  - `src/app/app.routes.ts` (if route-based detail is chosen)
- Reuse existing `calculations` and `sales` stores; do not create parallel history stores.
- Keep deep-flow state within Inventory feature boundaries and existing shell navigation patterns.

### Testing Requirements

- Regression checks must cover:
  - card-to-detail open behavior while keeping Inventory nav context
  - snapshot-based detail rendering and historical immutability expectations
  - printed/sold/gifted/remaining count calculations and sale/gift list rendering
  - browser back / Escape close-before-leave behavior
- Add tests close to Inventory and calculation service boundaries (component + focused service tests).

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.3)
- `_bmad-output/prd.md` (FR-8, FR-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-5, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Inventory and sales flow expectations)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Inventory card drill-in, deep-flow/back behavior)
- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/core/calculations/calculation.service.ts`
- `src/app/domain/models/storage.models.ts`
- `src/app/app.routes.ts`

## Story Completion Status

- Implementation complete and review-ready with automated AC coverage.

## Change Log

- 2026-06-23: Created Story 4.3 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented inventory detail/history flow with snapshot-safe rendering, back/Escape close handling, and focused regression tests; status set to `review`.
