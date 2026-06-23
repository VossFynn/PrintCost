---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 3.6: Save and Load Calculation Templates

Status: review

## Story

As a maker,
I want to save and load reusable calculation templates,
so that repeat jobs start from known inputs.

## Acceptance Criteria

1. **Given** the user has entered reusable Calculation inputs, **when** they choose `Als Vorlage`, **then** a Template can be saved with a Template name independent of `projectName`, **and** it is persisted in the `templates` store.
2. **Given** at least one Template exists, **when** the user chooses `Vorlage laden`, **then** they can select a Template, **and** the Calculation form is prefilled from that Template.
3. **Given** a Template has been loaded, **when** the user edits any prefilled field, **then** the field remains editable, **and** changes do not mutate the stored Template unless explicitly saved again.
4. **Given** Template data references unavailable active records, **when** the Template is loaded, **then** the form shows German inline guidance for records needing reselection, **and** save remains disabled until required selections are valid.

## Tasks / Subtasks

- [x] Implement template save and load entry points (AC: 1, 2)
  - [x] Persist templates in the `templates` store.
  - [x] Prefill the calculation form from a chosen template.
- [x] Keep loaded templates editable and safe (AC: 3, 4)
  - [x] Ensure loading does not mutate the stored template.
  - [x] Show reselection guidance when linked records are unavailable.
- [x] Add empty-state/blocker handling for templates (AC: 2, 4)
  - [x] Show a German empty prompt when no templates exist.
  - [x] Keep the load action blocked until a template is available.
- [x] Add focused regression checks (AC: 1-4)
  - [x] Verify template persistence and selection.
  - [x] Verify loaded fields remain editable.
  - [x] Verify unavailable references trigger reselection guidance.
- [x] Documentation requirement
  - [x] Add TSDoc for template serialization and prefill helpers.
  - [x] Add clarifying comments only where the immutable template copy is not obvious.

## Dev Notes

### Epic Context

Templates are a reuse feature for the calculation flow. The save/load entry points belong in the calculation surface, while any deeper template management can be surfaced elsewhere later if needed.

### Story Context

- Template names are independent of `projectName`.
- Loading a template must not lock the form or rewrite the stored template.
- The UX should surface a blocker/empty state rather than hiding the action when nothing exists yet.

### Implementation Guardrails

- Keep templates editable after load.
- Do not mutate the stored template object when pre-filling the form.
- Do not couple template handling to calculation history or inventory save behavior.

### Architecture Compliance

- AD-3: service-owned writes and signal refresh.
- AD-5 / AD-7: templates are reusable inputs, not historical snapshots.
- AD-9: visible copy and validation guidance stay German.

### Current UPDATE File Intelligence

- `src/app/core/db/printcost-db.ts` already defines a `templates` store.
- `src/app/domain/models/storage.models.ts` currently defines a minimal `TemplateRecord`.
- `src/app/features/calculate/` does not yet expose template actions.
- `src/app/features/more/` may later own broader template management if product wants a dedicated surface, but this story is about the calculation entry points.

### File Structure Requirements

- Update:
  - `src/app/features/calculate/*`
  - `src/app/core/db/printcost-db.ts`
  - `src/app/domain/models/storage.models.ts`
- Avoid duplicating template state in a second feature store.

### Testing Requirements

- Regression checks must cover:
  - template save/persist
  - template load/prefill
  - loaded-field editability
  - reselection guidance for missing linked records
  - empty-state/blocker handling when no templates exist

### Project Structure Notes

- Keep the template flow lightweight enough for repeat use on a phone-sized screen.
- If a template management surface is added later, it should reuse the same store and helper logic from this story.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.6)
- `_bmad-output/prd.md` (FR-13)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-5, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Template flow, state patterns)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (Secondary actions, card treatment)
- `src/app/core/db/printcost-db.ts`
- `src/app/domain/models/storage.models.ts`
- `src/app/features/calculate/calculate.component.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.4-mini (gpt-5.4-mini)

### Debug Log References

### Completion Notes List

- Added template persistence APIs in `CalculationService` (`saveTemplate`, `refreshTemplates`, `loadTemplate`) with deep-clone safety for immutable stored templates.
- Extended `TemplateRecord` model to store independent `templateName` plus full reusable calculation input payload.
- Added calculation-surface template actions: `Als Vorlage` and `Vorlage laden`, including German empty-state blocker text and inline reselection guidance for unavailable printer/filament records.
- Added prefill behavior that keeps loaded fields editable and enforces reselection when linked records are missing.
- Added regression coverage in service and component specs for persistence, prefill, editability, immutability, empty-state blocker, and missing-reference guidance.
- Validation run: `npm run verify:quality` (passes).

### File List

- `src/app/domain/models/storage.models.ts`
- `src/app/core/calculations/calculation.service.ts`
- `src/app/core/calculations/calculation.service.spec.ts`
- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/calculate/calculate.component.html`
- `src/app/features/calculate/calculate.component.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-23: Created Story 3.6 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented Story 3.6 template save/load flow with TDD coverage; status set to `review`.
