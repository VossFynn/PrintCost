---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 3.4: Render Live Result Card and Plate Explanation

Status: review

## Story

As a maker,
I want to see the cost breakdown and final price while editing,
so that I can adjust inputs with immediate feedback.

## Acceptance Criteria

1. **Given** Calculation input is valid, **when** any input changes, **then** the result card updates without a submit step, **and** typical update time stays within 100 ms.
2. **Given** the result card renders, **when** costs are displayed, **then** it shows German labels for `Materialkosten`, `Stromkosten`, `AfA`, `Modellierung`, extra-work fee, `Zwischensumme`, `Gewinn`, and `Preis`, **and** the final `Preis` is visually dominant.
3. **Given** `plates` is greater than 1, **when** the model/plate controls render, **then** an inline German explanation such as `3 Platten werden benötigt` appears, **and** the extra-work fee control is available.
4. **Given** a screen reader is active, **when** the result updates during typing, **then** announcements are debounced or focus-triggered, **and** the screen reader is not spammed on every keystroke.

## Tasks / Subtasks

- [x] Build the live result card (AC: 1, 2)
  - [x] Render the breakdown and dominant final price display.
  - [x] Keep the card visible as users edit inputs.
- [x] Add plate explanation and extra-work visibility (AC: 3)
  - [x] Show the plate-count explanation when needed.
  - [x] Surface the extra-work fee control only when the calculation needs it.
- [x] Add accessible live-update behavior (AC: 4)
  - [x] Debounce announcements or gate them behind focus changes.
- [x] Add focused regression checks (AC: 1-4)
  - [x] Verify live updates without submit.
  - [x] Verify plate explanation and fee visibility.
  - [x] Verify screen-reader announcements stay restrained.
- [x] Documentation requirement
  - [x] Add TSDoc for any helper that formats or announces result updates.
  - [x] Add clarifying comments only where accessibility timing needs explanation.

## Dev Notes

### Epic Context

This story turns the calculation flow into a live tool. It should only present derived output from the pure engine and should not add persistence.

### Story Context

- The UX spine expects the result card to stay in flow while the user edits.
- The final price is the visual climax of the screen.
- The plate explanation is a user aid, not a new pricing rule.

### Implementation Guardrails

- Do not recalculate price logic inside the component; reuse the pure engine from Story 3.3.
- Keep German labels and de-DE formatting at the presentation edge.
- Do not spam screen readers on every keystroke.

### Architecture Compliance

- AD-3: component state can derive from signals, but math stays pure.
- AD-4: plate count only explains the optional extra-work fee.
- AD-9: visible labels are German.
- AD-11: live updates must stay fast and covered by regression tests.

### Current UPDATE File Intelligence

- `src/app/features/calculate/calculate.component.ts` is still an empty shell.
- `src/app/features/calculate/calculate.component.html` currently has no result card structure.
- `src/app/features/calculate/calculate.component.scss` only imports shared page styles.
- The pure calculation engine is expected to come from Story 3.3.

### File Structure Requirements

- Update:
  - `src/app/features/calculate/calculate.component.ts`
  - `src/app/features/calculate/calculate.component.html`
  - `src/app/features/calculate/calculate.component.scss`
- Reuse any shared display primitives if a reusable result card becomes necessary.

### Testing Requirements

- Regression checks must cover:
  - live updates without submit
  - German label rendering
  - plate explanation visibility
  - restrained accessibility announcements

### Project Structure Notes

- Keep the live result logic on the calculation surface, not in inventory or settings.
- If a reusable result component emerges, keep it tokenized and calculation-focused.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.4)
- `_bmad-output/prd.md` (FR-6)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-4, AD-9, AD-11)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Result card, Accessibility Floor, Multiple plates state)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (Result card, typography, colors)

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

- `rtk npm run test -- --watch=false --include='src/app/features/calculate/calculate.component.spec.ts'`
- `rtk npm run verify:quality`

### Completion Notes List

- Wired live result rendering in `calculate.component.*` to Story 3.3 pure `calculate()` output (no duplicated pricing math in component).
- Added model/plate controls, conditional `3 Platten werden benötigt` explanation, and conditional extra-work fee control when `plates > 1`.
- Added debounced SR announcement (`Preis aktualisiert …`) via live region update debounce to avoid per-keystroke spam.
- Added regression tests for live updates, German result labels + dominant price, plate explanation/fee visibility, and restrained SR announcements.

### File List

- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/calculate/calculate.component.html`
- `src/app/features/calculate/calculate.component.scss`
- `src/app/features/calculate/calculate.component.spec.ts`
- `_bmad-output/implementation-artifacts/3-4-render-live-result-card-and-plate-explanation.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-23: Created Story 3.4 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented Story 3.4 end-to-end with TDD, added live result card + plate explanation + debounced SR announcements, and set status to `review`.
