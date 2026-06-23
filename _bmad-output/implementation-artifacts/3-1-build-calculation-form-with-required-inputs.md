---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 3.1: Build Calculation Form With Required Inputs

Status: review

## Story

As a maker,
I want to enter all required print pricing inputs on the calculation screen,
so that I can price a print job without spreadsheet setup.

## Acceptance Criteria

1. **Given** a user opens `/calculate`, **when** the Calculation screen renders, **then** it shows German sections for `Projekt`, `Filament`, and `Druck`, **and** the visible order matches the mobile-first calculation flow from the UX spine.
2. **Given** active Printer Profiles exist, **when** the user opens the printer selector, **then** only active Printer Profiles are selectable, **and** the last used active Printer Profile is preselected when available.
3. **Given** no active Printer Profile exists, **when** the Calculation screen renders, **then** the printer selector is replaced with a German empty prompt and CTA `Erst Drucker anlegen`, **and** saving stays disabled.
4. **Given** the user enters required Calculation inputs, **when** fields are missing or invalid, **then** German inline validation appears on the affected fields, **and** the primary save action remains disabled until the form is valid.
5. **Given** the form is rendered on a 320 px viewport, **when** the user scans the page, **then** the layout stays single-column and touch-friendly, **and** no horizontal page scrolling is introduced.

## Tasks / Subtasks

- [x] Build the calculation form shell and section order (AC: 1, 5)
  - [x] Replace the placeholder `calculate.component` with the required input scaffold.
  - [x] Preserve the mobile-first page container and shared page styling.
- [x] Wire printer selection and blocker state (AC: 2, 3)
  - [x] Show active Printer Profiles only.
  - [x] Preselect the last used active profile when available.
  - [x] Show the `Erst Drucker anlegen` empty state when none exist.
- [x] Add required input validation and save gating (AC: 3, 4)
  - [x] Add German inline validation for missing or invalid fields.
  - [x] Keep the save action disabled until the form is valid.
- [x] Add focused regression checks (AC: 2, 3, 4, 5)
  - [x] Cover empty-printer blocker behavior.
  - [x] Cover selection defaults and validation disabling.
  - [x] Confirm the page stays constrained on mobile and desktop.
- [x] Documentation requirement
  - [x] Add TSDoc for complex form orchestration and validation helpers.
  - [x] Add clarifying comments only where the blocker logic is non-obvious.

## Dev Notes

### Epic Context

This is the first user-facing slice of Epic 3. It should unblock the calculation page itself, but it must not add multi-filament line logic, price math, save snapshots, or template loading yet.

### Story Context

- The current `src/app/features/calculate/calculate.component.ts` and `.html` are placeholder-only.
- The UX spine requires a dense but linear calculation flow with German copy, inline validation, and a non-blocking empty state when no printer exists.
- User-facing copy is German; implementation identifiers remain English.

### Implementation Guardrails

- Keep route components free of direct IndexedDB access.
- Use Angular 22 standalone patterns, Signals-ready orchestration, and Typed Reactive Forms.
- Do not introduce the calculation engine in this story.
- Do not allow the page to stretch into a dashboard layout on desktop.

### Architecture Compliance

- AD-2 / AD-3: form orchestration lives in the feature; persistence stays in services.
- AD-9: German visible labels, English TypeScript names.
- AD-11: keep the form ready for later unit-tested formula wiring without coupling UI to math.

### Current UPDATE File Intelligence

- `src/app/features/calculate/calculate.component.ts` is an empty component shell.
- `src/app/features/calculate/calculate.component.html` only contains a minimal placeholder.
- `src/app/features/calculate/calculate.component.scss` only imports shared page styles.
- `src/app/core/printers/printer.service.ts` and `src/app/core/settings/settings.service.ts` are the likely read-only sources for default selection and form defaults.

### File Structure Requirements

- Update:
  - `src/app/features/calculate/calculate.component.ts`
  - `src/app/features/calculate/calculate.component.html`
  - `src/app/features/calculate/calculate.component.scss`
  - shared page/container styles only if a blocker layout needs a reusable hook
- Avoid:
  - `src/app/core/db/*`
  - `src/app/domain/calculation/*`
  - `src/app/features/inventory/*`

### Testing Requirements

- Add component-level regression checks for:
  - no active printer blocker state
  - active printer preselection
  - invalid-field validation and disabled save
  - mobile-first layout containment

### Project Structure Notes

- Reuse the existing page container and shell spacing patterns instead of inventing a second calculation layout system.
- Keep the empty-state CTA routed toward printer setup, not to a temporary local stub.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.1)
- `_bmad-output/prd.md` (FR-5, FR-6, FR-7, FR-13)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-9, AD-11)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Calculation flow, State Patterns, Accessibility Floor)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (Layout & Spacing, Components)
- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/calculate/calculate.component.html`
- `src/app/features/calculate/calculate.component.scss`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

- 2026-06-23: Added `calculate.component.spec.ts` first (red), implemented reactive form shell + printer/state orchestration (green), then refactored for resilient async init and single-column styling.

### Completion Notes List

- Implemented `/calculate` page with ordered German sections (`Projekt`, `Filament`, `Druck`) and typed reactive form inputs.
- Wired printer selection to active profiles only, with persisted `lastUsedPrinterProfileId` preselection and no-printer blocker CTA (`Erst Drucker anlegen`).
- Added German inline validation for required/invalid fields and save-button gating until form validity and printer availability are satisfied.
- Added focused component regression coverage for section order, printer preselection, empty-state blocker, validation behavior, and single-column shell hook.
- Updated `SettingsService` to be DI-safe in Angular standalone route contexts via injectable provider token.

### File List

- _bmad-output/implementation-artifacts/3-1-build-calculation-form-with-required-inputs.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- src/app/core/settings/settings.service.ts
- src/app/features/calculate/calculate.component.ts
- src/app/features/calculate/calculate.component.html
- src/app/features/calculate/calculate.component.scss
- src/app/features/calculate/calculate.component.spec.ts

## Change Log

- 2026-06-23: Created Story 3.1 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented calculation form shell, printer blocker/preselection, validation gating, and focused component regression tests; status set to `review`.
