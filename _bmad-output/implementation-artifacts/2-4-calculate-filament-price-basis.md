---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.4: Calculate Filament Price Basis

Status: review

## Story

As a maker,
I want filament price modes to produce correct per-gram cost,
so that calculations can use weighted average, last paid, or fixed prices.

## Acceptance Criteria

1. **Given** Filament has one or more purchases, **when** weighted average price is requested, **then** `FilamentService` returns `sum(priceEur * quantityKg) / sum(quantityKg) / 1000`, **and** unit tests cover one-purchase and multi-purchase cases.
2. **Given** Filament has multiple purchases, **when** last paid price is requested, **then** `FilamentService` uses latest purchase date, **and** returns that purchase price per gram.
3. **Given** Calculation line uses fixed price mode, **when** `fixedPriceEurG` is missing or <= 0, **then** validation fails, **and** user sees German inline error.
4. **Given** purchase is added, edited, or removed, **when** Filament is saved, **then** weighted average output updates for future Calculation use, **and** historical Calculation snapshots are not mutated.

## Tasks / Subtasks

- [x] Add deterministic price-basis helpers in `FilamentService` (AC: 1, 2)
  - [x] Implement weighted-average-per-gram calculation from purchase list.
  - [x] Implement last-paid-per-gram calculation by latest ISO date.
- [x] Add mode-aware validation contracts (AC: 3)
  - [x] Reject fixed mode without positive `fixedPriceEurG`.
  - [x] Return German-ready validation key/message pathway for UI.
- [x] Wire recalculation on filament purchase edits (AC: 4)
  - [x] Ensure future requests see updated basis immediately after save.
  - [x] Ensure no mutation of existing historical snapshots.
- [x] Add focused tests (AC: 1, 2, 3, 4)
  - [x] Single and multi-purchase weighted average tests.
  - [x] Latest-date last-paid tests.
  - [x] Fixed-mode validation failure tests.
  - [x] Snapshot non-mutation regression tests.

## Dev Notes

### Epic Context

Story 2.4 provides numeric foundation for Epic 3 price calculation flow. Accuracy and deterministic behavior are critical.

### Previous Story Intelligence

- Story 2.3 introduces filament purchase storage. Reuse stored purchase schema; do not create parallel purchase source.
- Keep same service-level validation approach.

### Implementation Guardrails

- Use exact formula from AC for weighted average.
- Sort/compare purchase dates as ISO timestamps for latest-paid mode.
- Keep output in EUR per gram units.
- Never rewrite historical calculation snapshots when filament purchase history changes.

### Architecture Compliance

- AD-3: pure deterministic calculation helper inside service/domain boundary.
- AD-4 and AD-11: correctness-critical math gets unit tests for boundary and regression cases.
- AD-7: historical snapshot immutability.

### Current UPDATE File Intelligence

- No filament math exists yet; implement in new `core/filaments/filament.service.ts` or dedicated domain helper.
- `calculate.component.ts` still placeholder; story should expose service API ready for future UI wiring, not full calculation screen.
- `storage.models.ts` must include purchase/fixed-price fields from Story 2.3 before this story can compile.

### File Structure Requirements

- Update/create:
  - `src/app/core/filaments/filament.service.ts`
  - `src/app/core/filaments/filament.service.spec.ts`
  - `src/app/domain/models/storage.models.ts` (if needed for purchase typing)
  - optional shared math helper in `src/app/domain/calculation/` only if reused by global calculator.

### Library and Framework Requirements

- Keep math pure and side-effect free where possible.
- Use existing TypeScript strictness and Vitest for numeric precision assertions.

### Testing Requirements

- Include precision-safe assertions for per-gram values.
- Cover same-day multiple purchase edge case with deterministic tie-breaker policy.
- Verify invalid fixed-price mode emits validation failure and blocks save path.

### Git Intelligence Summary

- Recent work emphasized regression prevention. Add explicit formula tests before UI consumption.

### Latest Tech Information

- Angular 22 and Signals guidance supports isolating deterministic math outside components for easy testability.
- Vitest 4 parameterized tests (`it.each`) fit price-mode matrix coverage.

### Project Context Reference

- No `project-context.md` file found in repository during discovery.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.4)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-4, AD-7, AD-11)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (correct calculation formula guidance and test floor)
- `src/app/domain/models/storage.models.ts`
- `src/app/features/calculate/calculate.component.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Added deterministic price-basis helpers to FilamentService with weighted-average, last-paid, and fixed-price resolution.
- Covered one-purchase and multi-purchase weighted-average cases, same-day latest-purchase tie-breaking, fixed-price validation, and non-mutation behavior with tests.
- Verified the impacted Angular test suite and production build after the service changes.

### Completion Notes List

- Implemented per-gram price-basis helpers for weighted average, last paid, and fixed price modes.
- Added German validation for missing fixed price mode and kept purchase snapshots immutable.
- Added regression tests for one-purchase/multi-purchase math, same-day latest-purchase selection, and non-mutation behavior.
- Verified the Filament service test suite and production build after the changes.

### File List

- `_bmad-output/implementation-artifacts/2-4-calculate-filament-price-basis.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/core/filaments/filament.service.ts`
- `src/app/core/filaments/filament.service.spec.ts`

## Change Log

- 2026-06-23: Created Story 2.4 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented filament price-basis helpers and tests; marked the story ready for review.
