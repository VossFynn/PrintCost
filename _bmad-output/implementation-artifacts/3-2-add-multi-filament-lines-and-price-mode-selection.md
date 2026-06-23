---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 3.2: Add Multi-Filament Lines and Price Mode Selection

Status: review

## Story

As a maker,
I want to select one or more filaments with grams and price mode,
so that multi-color jobs price material correctly.

## Acceptance Criteria

1. **Given** active Filaments exist, **when** the Calculation screen renders the filament area, **then** the user can select and deselect Filament chips, **and** each selected Filament exposes its own grams input row.
2. **Given** no active Filaments exist, **when** the Calculation screen renders, **then** the filament area shows a German empty prompt and CTA `Filament hinzufügen`, **and** the filament selection controls stay blocked until at least one active Filament exists.
3. **Given** a selected Filament row is visible, **when** the user chooses a Price Mode, **then** the UI shows German labels `Ø Schnitt`, `Bezahlt`, and `Fester Preis`, **and** the stored value stays aligned with the English enum values.
4. **Given** a selected Filament uses `FIXED` mode, **when** the fixed price is missing or invalid, **then** the row shows a German inline validation error, **and** the Calculation cannot be saved.
5. **Given** multiple Filaments are selected, **when** grams change, **then** the total grams line updates immediately, **and** valid/invalid states are indicated with text or icon in addition to color.

## Tasks / Subtasks

- [x] Build the multi-filament selector and line editor (AC: 1, 2, 5)
  - [x] Add chip selection and deselection behavior.
  - [x] Render one grams row per selected Filament.
  - [x] Show the no-filament blocker state and CTA.
- [x] Add price mode selection and fixed-price validation (AC: 3, 4)
  - [x] Wire the three German labels to the correct stored enum values.
  - [x] Validate `FIXED` mode strictly.
- [x] Keep total-grams feedback live (AC: 5)
  - [x] Update the total immediately on field changes.
  - [x] Preserve non-color accessibility cues.
- [x] Add focused regression checks (AC: 1-5)
  - [x] Verify chip toggling and grams row creation.
  - [x] Verify the no-filament blocker state.
  - [x] Verify fixed-mode validation and live total updates.
- [x] Documentation requirement
  - [x] Add TSDoc for any helper that normalizes price modes or totals filament lines.
  - [x] Add clarifying comments only where chip-to-line syncing needs explanation.

## Dev Notes

### Epic Context

This story extends the calculation page with the material-input layer. It should stop short of live pricing math, save snapshots, or template persistence.

### Story Context

- The calculation page currently has no filament line UI.
- The UX spine expects horizontal chip selection, one grams row per selected Filament, and an immediately visible grams sum.
- The story should remove the "no filament" blocker by directing the user to `Filament hinzufügen` when nothing is available.

### Implementation Guardrails

- Keep user-facing copy German and implementation identifiers English.
- Do not duplicate price-basis math in the UI; that belongs in the calculation/domain layer.
- Keep the chip row mobile-friendly and horizontally scrollable if needed.
- Do not allow hidden state that makes selected Filaments impossible to reselect or edit.

### Architecture Compliance

- AD-2 / AD-3: the feature may orchestrate selection state, but services own persistence and read models.
- AD-5 / AD-7: selected line data must be compatible with future snapshots.
- AD-9: German labels in UI, English enum values in code.

### Current UPDATE File Intelligence

- `src/app/features/calculate/calculate.component.ts` is still a placeholder shell.
- `src/app/features/calculate/calculate.component.html` needs the filament chip and line structure.
- `src/app/core/filaments/filament.service.ts` already owns the active-filament read signal and price-basis helpers from Epic 2.
- `src/app/domain/models/storage.models.ts` already carries filament purchase history and fixed-price fields.

### File Structure Requirements

- Update:
  - `src/app/features/calculate/calculate.component.ts`
  - `src/app/features/calculate/calculate.component.html`
  - `src/app/features/calculate/calculate.component.scss`
- Reuse existing filament service and models; do not add a second filament data source.

### Testing Requirements

- Regression checks must cover:
  - chip selection/deselection
  - grams row creation/removal
  - `FIXED` validation
  - total grams line updates
  - no-filament blocker state

### Project Structure Notes

- Keep the material editor inside the calculation feature instead of pushing it into Filaments management.
- Make the no-filament blocker feel like a navigation aid, not a dead end.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.2)
- `_bmad-output/prd.md` (FR-5)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-5, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Calculation flow, State Patterns, German UI Copy Inventory)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (Components, Colors, Do's and Don'ts)
- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/calculate/calculate.component.html`
- `src/app/features/calculate/calculate.component.scss`
- `src/app/core/filaments/filament.service.ts`
- `src/app/domain/models/storage.models.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

- 2026-06-23: Red — expanded `calculate.component.spec.ts` with failing AC 1-5 tests for chip toggling, no-filament blocker, fixed-mode validation, and live total feedback.
- 2026-06-23: Green — implemented multi-filament chip/line editor with German price-mode labels mapped to English enum values and strict FIXED validation gating save.
- 2026-06-23: Refactor — extracted price-mode normalization and grams total helpers with TSDoc, plus chip/line sync comment for refresh-safe selection state.

### Completion Notes List

- Replaced single filament grams field with chip-driven multi-line filament editor in `/calculate`.
- Added blocked empty state (`Filament hinzufügen`) when no active filaments exist.
- Added per-line price mode select (`Ø Schnitt`, `Bezahlt`, `Fester Preis`) while persisting English enum values.
- Added strict inline FIXED-price validation and save blocking when missing/invalid.
- Added live total grams line with explicit text/icon valid-invalid cue (`✓` / `⚠`) beyond color alone.
- Added targeted regression coverage for AC 1-5 in `calculate.component.spec.ts`.

### File List

- _bmad-output/implementation-artifacts/3-2-add-multi-filament-lines-and-price-mode-selection.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/app/features/calculate/calculate.component.ts
- src/app/features/calculate/calculate.component.html
- src/app/features/calculate/calculate.component.scss
- src/app/features/calculate/calculate.component.spec.ts

## Change Log

- 2026-06-23: Created Story 3.2 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented multi-filament chip lines, price mode selection, strict FIXED validation, live total grams feedback, and AC-focused regression tests; status set to `review`.
