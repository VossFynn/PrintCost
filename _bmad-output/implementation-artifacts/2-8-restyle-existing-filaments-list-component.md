---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.8: Restyle Existing Filaments List Component

Status: review

## Story

As a maker,
I want the existing Filaments list component restyled to the updated visual guide,
so that the inventory surface matches the new PrintCost look without changing behavior.

## Acceptance Criteria

1. **Given** the Filaments surface renders, **when** the updated style guide is applied, **then** list rows, filter chips, empty state, and low-stock state use the revised tokens, spacing, radius, and typography from `DESIGN.md`, **and** the component keeps the existing layout density appropriate for mobile.
2. **Given** the existing Filaments interactions are used, **when** the restyle ships, **then** search, filter, selection, create, and edit behavior remain unchanged, **and** no new data contract is introduced.
3. **Given** low/zero stock rows render, **when** the new style is applied, **then** the state remains readable with non-color indicator text or icon, **and** contrast stays consistent with the accessibility floor.
4. **Given** the surface renders at mobile and desktop widths, **when** the restyled component is shown, **then** touch targets remain usable, **and** no horizontal overflow is introduced.

## Tasks / Subtasks

- [x] Update Filaments component styling to the revised visual guide (AC: 1, 3, 4)
  - [x] Restyle row spacing, chips, empty state, and stock-state treatment.
  - [x] Keep the existing mobile-first density and active/selected semantics intact.
- [x] Preserve current Filaments behavior contract (AC: 2)
  - [x] Avoid changing search, filter, create, edit, or selection logic.
  - [x] Keep the existing data model and service boundaries unchanged.
- [x] Add focused regression checks for the restyle (AC: 2, 3, 4)
  - [x] Verify behavior still passes after style changes.
  - [x] Verify low/zero stock remains legible without color-only signaling.

## Dev Notes

### Epic Context

Story 2.8 absorbs the updated style guide into an already existing Epic 2 component. It is a presentation refresh, not a behavior or data-model change.

### Previous Story Intelligence

- Story 2.3 established the Filament record and purchase-history contract.
- Story 2.5 established search/filter, row content, and low-stock accessibility behavior.
- This story must preserve those contracts exactly while changing the look.

### Implementation Guardrails

- Keep all user-facing copy German and all implementation identifiers English.
- Do not introduce new DB writes, new fields, or service-layer changes for the restyle.
- Preserve the touch-first, mobile-first layout and 44 x 44 px target sizing.
- Use the updated style guide as the source of truth for spacing, radius, typography, and component treatment.

### Architecture Compliance

- AD-2 / AD-3: presentation-only changes must not leak into storage or service ownership.
- AD-9: German visible copy and English implementation identifiers remain unchanged.
- UX spine: low-stock state must remain visible and non-color dependent.

### Current UPDATE File Intelligence

- `src/app/features/filaments/filaments.component.scss` is the primary styling surface.
- `src/app/features/filaments/filaments.component.html` may need only minimal class or structure adjustments if the updated style guide requires them.
- `src/app/features/filaments/filaments.component.ts` should remain behaviorally stable unless a presentation hook is strictly necessary.

### File Structure Requirements

- Update:
  - `src/app/features/filaments/filaments.component.scss`
  - `src/app/features/filaments/filaments.component.html` (only if needed for styling hooks)
  - relevant shared UI token or primitive styles if the style guide requires it
- Avoid:
  - `src/app/core/filaments/*` unless a styling issue exposes a pre-existing contract bug
  - domain models or database schema files

### Library and Framework Requirements

- Stay within Angular 22, SCSS, and the existing tokenized style approach.
- Prefer shared design tokens over hardcoded color/spacing values where possible.

### Testing Requirements

- Protect existing list/filter/selectability behavior.
- Add or adjust style-focused regression checks only where the current test stack supports them.
- Keep accessibility assertions for low-stock state and touch target usability.

### Project Structure Notes

- This story should reuse the existing Filaments surface rather than introduce a parallel component.
- If the style guide creates a mismatch with current shared tokens, update the shared token source instead of duplicating values in the feature.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.8)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (Colors, Typography, Layout & Spacing, Components, Do's and Don'ts)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Filaments flow, low/zero stock state, Accessibility Floor)
- `src/app/features/filaments/filaments.component.html`
- `src/app/features/filaments/filaments.component.scss`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Started from the existing Filaments surface and added presentation-only hooks for empty state and stock state.
- Kept the service and data contracts unchanged while restyling the UI to match the updated guide.
- Added regression coverage for the empty state card and explicit low/zero-stock badge treatment.
- Verified the impacted Angular test suite and production build after the restyle.

### Completion Notes List

- Restyled the Filaments list surface to use card-like rows, a clearer empty state, and explicit stock-state badges.
- Preserved search/filter/selection/edit behavior and avoided any data-model or service-layer changes.
- Added regression tests for the empty-state card and stock-state badge presentation hooks.
- Verified the Filaments feature still passes the Angular test suite and production build.

### File List

- `_bmad-output/implementation-artifacts/2-8-restyle-existing-filaments-list-component.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/features/filaments/filaments.component.ts`
- `src/app/features/filaments/filaments.component.html`
- `src/app/features/filaments/filaments.component.scss`
- `src/app/features/filaments/filaments.component.spec.ts`

## Change Log

- 2026-06-23: Created Story 2.8 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Restyled the Filaments list component, added presentation hooks and regression tests, and marked the story ready for review.
