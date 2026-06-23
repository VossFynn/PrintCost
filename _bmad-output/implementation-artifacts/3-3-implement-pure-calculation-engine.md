---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 3.3: Implement Pure Calculation Engine

Status: review

## Story

As a maker,
I want PrintCost to calculate a correct breakdown instantly,
so that the final price is trustworthy.

## Acceptance Criteria

1. **Given** valid Calculation input is passed to `domain/calculation/calculate()`, **when** the function runs, **then** it returns material, electricity, depreciation, modeling, extra-work fee, subtotal, final price, rounded price, plate count, and total grams.
2. **Given** `printMinutes`, `gramsUsed`, `printQuantity`, and `partsPerPlate` are provided, **when** plate count is greater than 1, **then** plate count does not multiply material, electricity, base fee, or depreciation costs, **and** only `extraWorkFeePercent` can add an extra fee.
3. **Given** Price Modes are used, **when** the calculation runs, **then** weighted average, paid, and fixed prices produce the expected material costs, **and** unit tests cover each mode.
4. **Given** profit margin and rounding are applied, **when** the calculation returns the final result, **then** `finalPriceEur` applies profit margin, **and** `roundedFinalPriceEur` uses ceiling rounding.

## Tasks / Subtasks

- [x] Implement the pure calculation function (AC: 1-4)
  - [x] Keep the function free of Angular and IndexedDB dependencies.
  - [x] Apply the corrected plate-count semantics and `extraWorkFeePercent`.
- [x] Add deterministic unit tests (AC: 1-4)
  - [x] Cover plate-count behavior.
  - [x] Cover price-mode matrix behavior.
  - [x] Cover profit margin and ceiling rounding.
- [x] Keep the contract compatible with snapshot/save stories (AC: 1, 4)
  - [x] Return stable field names that later stories can persist directly.
- [x] Documentation requirement
  - [x] Add TSDoc for the calculation inputs and outputs.
  - [x] Add clarifying comments only for formula decisions that are easy to misread.

## Dev Notes

### Epic Context

This is the calculation core for Epic 3. It is intentionally technical, but every later calculation story depends on its output contract.

### Story Context

- The formula must use total job inputs, not per-plate multipliers.
- `extraWorkFeePercent` is the only plate-related surcharge.
- The engine must stay pure so the UI and storage layers can test and reuse it cleanly.

### Implementation Guardrails

- Do not put Angular, services, or persistence code in this module.
- Use `extraWorkFeePercent`; do not reintroduce `multiPlateSurchargePercent`.
- Keep numeric outputs stable and easy to snapshot.

### Architecture Compliance

- AD-4: corrected calculation semantics are mandatory.
- AD-11: formula coverage needs focused unit tests.
- AD-2 / AD-3: math stays below the feature layer and above persistence.

### Current UPDATE File Intelligence

- `src/app/domain/calculation/` does not yet contain the engine.
- `src/app/features/calculate/calculate.component.ts` is still a placeholder and should consume this engine later.
- `src/app/domain/models/storage.models.ts` already holds the supporting printer and filament fields.

### File Structure Requirements

- Create:
  - `src/app/domain/calculation/calculate.ts`
  - `src/app/domain/calculation/calculate.spec.ts`
- Update only if compilation needs it:
  - shared calculation types in `src/app/domain/models/*`

### Testing Requirements

- The unit test suite must cover:
  - weighted-average, paid, and fixed price modes
  - plate-count handling
  - extra-work fee application
  - profit margin and ceiling rounding

### Project Structure Notes

- Keep the calculation function reusable from both the live result card and the snapshot save flow.
- Do not let this story depend on any particular page UI.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.3)
- `_bmad-output/prd.md` (FR-6)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-4, AD-11)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (Correct Calculation Formula)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Calculation flow and result behavior)
- `_bmad-output/specs/spec-printcost/domain-contract.md` (calculation contract)

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

- Red: `npm run test` (failed initially with missing `./calculate` module)
- Green/Refactor: `npm run test -- --include src/app/domain/calculation/calculate.spec.ts`
- Validation: `npm run test` (repository currently has unrelated failing Story 3.2 tests), `npm run build`

### Completion Notes List

- Implemented pure `domain/calculation/calculate()` with no Angular/IndexedDB dependencies.
- Implemented corrected formula semantics: total-job inputs, plate-count gating only for `extraWorkFeePercent`.
- Added deterministic unit coverage for output contract, plate behavior, price-mode matrix, profit/rounding, and input immutability.
- Stabilized output contract for upcoming stories with fields: `plateCount`, `totalGrams`, `materialCostEur`, `electricityCostEur`, `depreciationCostEur`, `modelingCostEur`, `extraWorkFeeEur`, `subtotalEur`, `finalPriceEur`, `roundedFinalPriceEur`.

### File List

- `src/app/domain/calculation/calculate.ts`
- `src/app/domain/calculation/calculate.spec.ts`

## Change Log

- 2026-06-23: Created Story 3.3 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented pure calculation engine with strict TDD tests; status set to `review`.
