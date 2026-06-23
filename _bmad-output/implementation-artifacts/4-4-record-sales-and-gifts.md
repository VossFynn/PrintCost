---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 4.4: Record Sales and Gifts

Status: review

## Story

As a maker,
I want to record a sale or gift against a saved calculation,
So that available printed inventory and customer history stay accurate.

## Acceptance Criteria

1. **Given** a saved Calculation exists, **when** the user starts recording a Sale, **then** the form supports optional Customer, sale price, gift flag, date, and note.
2. **Given** the user marks the transaction as a Gift, **when** the Sale is saved, **then** sale price `0` is valid, **and** the saved record is marked `gifted: true`.
3. **Given** the Sale form is valid, **when** the user saves, **then** a Sale record is persisted against the Calculation, **and** sold/gifted/remaining counts update on the inventory card and detail view.
4. **Given** a Sale or Gift is saved, **when** persistence completes, **then** no Filament `remainingG` value is deducted, **and** German confirmation or inline success feedback is shown.

## Tasks / Subtasks

- [x] Implement inventory sale/gift capture flow and validation (AC: 1, 2)
  - [x] Add form controls for optional customer, sale price, gift flag, date, and note.
  - [x] Allow gift saves with `sale price = 0` and persist `gifted: true`.
- [x] Persist sale records and update derived inventory counts (AC: 3)
  - [x] Save Sale records linked by `calculationId` in the `sales` store.
  - [x] Recompute and render sold/gifted/remaining counts in card and detail surfaces.
- [x] Keep sale recording independent from filament stock deduction (AC: 4)
  - [x] Ensure sale/gift persistence does not mutate filament `remainingG`.
  - [x] Show German success feedback after successful save.
- [x] Add focused regression coverage for inventory sale workflows (AC: 1-4)
  - [x] Verify form validity and gift semantics.
  - [x] Verify persistence shape and count updates.
  - [x] Verify no filament deduction on sale/gift save.
- [x] Documentation requirement
  - [x] Add TSDoc for sale/gift persistence and inventory count aggregation helpers.
  - [x] Add clarifying comments only where count derivation or gift rules are non-obvious.

## Dev Notes

### Epic Context

Epic 4 extends saved calculations into operational inventory. Story 4.4 introduces post-print commercial tracking (sales and gifts) while preserving existing stock semantics from Epic 3.

### Story Context

- Sales and gifts are transactions against already saved calculations.
- Gift is a first-class transaction state (`gifted: true`) and must allow zero sale price.
- Inventory list/detail views must reflect transaction history via sold/gifted/remaining counts.

### Implementation Guardrails

- Do not couple sale/gift persistence to print-occurrence stock deduction.
- Keep transaction validation and persistence in services, not inline in template logic.
- Preserve German user-facing labels, validation text, and confirmations.

### Architecture Compliance

- AD-3: service-owned mutations and signal refresh after writes.
- AD-5: saved calculation lifecycle remains distinct from printed/sold lifecycle.
- AD-6: sales consume printed inventory counts only; they never deduct filament.
- AD-7: maintain referential integrity across Calculation, Sale, and optional Customer links.
- AD-9: user-facing copy and feedback remain German.

### Current UPDATE File Intelligence

- `src/app/domain/models/storage.models.ts` currently defines minimal `SaleRecord` and `CustomerRecord`; story work will need full sale/gift and customer-facing fields.
- `src/app/core/db/printcost-db.ts` already contains `sales` and `customers` stores with indexes (`calculationId`, `customerId`, `date`).
- `src/app/features/inventory/inventory.component.ts` currently surfaces planned calculations only; no sale/gift transaction state is rendered yet.
- `src/app/features/inventory/inventory.component.html` currently lists basic planned entries; card/detail transaction UI is not yet present.
- `src/app/core/calculations/calculation.service.ts` is the active persistence entry point for saved calculations and should remain the service boundary for inventory-derived refresh flows.

### File Structure Requirements

- Update:
  - `src/app/domain/models/storage.models.ts`
  - `src/app/core/db/printcost-db.ts` (only if schema/index adjustments are required)
  - `src/app/core/calculations/calculation.service.ts`
  - `src/app/features/inventory/*`
- Add new inventory-focused service/helper files under `src/app/core/` only when responsibilities cannot stay cohesive in existing services.
- Reuse existing `sales` store; do not create parallel transaction stores.

### Testing Requirements

- Regression checks must cover:
  - sale form field validation (including optional customer/note and required date semantics)
  - gift flow with zero price and `gifted: true` persistence
  - sold/gifted/remaining count updates in inventory list and detail surfaces
  - no filament `remainingG` deduction when saving sales/gifts
  - German success feedback visibility after save

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.4)
- `_bmad-output/prd.md` (FR-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-5, AD-6, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Stock and inventory semantics)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Inventory flows, German feedback patterns)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/core/calculations/calculation.service.ts`
- `src/app/features/inventory/inventory.component.ts`

## Story Completion Status

- Story implementation completed; ready for peer and manager review.

## File List

- `src/app/features/inventory/inventory.component.ts`
- `src/app/features/inventory/inventory.component.html`
- `src/app/features/inventory/inventory.component.scss`
- `src/app/features/inventory/inventory.component.spec.ts`

## Dev Agent Record

### Completion Notes

- Exposed sale/gift recording form in inventory detail view.
- Added optional customer dropdown, price input, gift check, date picker, and note.
- Added input validations (non-negative price, required date) and German warning feedback.
- Tied submission to `CalculationService.recordSale` and refreshed detail data.
- Updated inventory cards list to recompute and display sold, gifted, and remaining counts.
- Added extensive vitest suites covering UI validation, form toggling, state updates, and submission.

## Change Log

- 2026-06-23: Created Story 4.4 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented Story 4.4 transaction UI, validations, persistence, card updates, and tests. Status updated to `review`.
