---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.2: Soft-Delete Printer Profiles Safely

Status: review

## Story

As a maker,
I want deleted printers hidden from new calculations but preserved historically,
so that old saved calculations remain reproducible.

## Acceptance Criteria

1. **Given** active Printer Profile exists, **when** user chooses delete, **then** German confirmation is shown before mutation, **and** canceling leaves profile unchanged.
2. **Given** user confirms deletion, **when** deletion completes, **then** profile is marked `deleted: true`, **and** it is hidden from active lists and future Calculation selection defaults.
3. **Given** saved Calculation contains `printerSnapshot`, **when** source Printer Profile is soft-deleted, **then** saved Calculation remains readable and reproducible from snapshot.

## Tasks / Subtasks

- [x] Add deletion affordance and confirmation flow on printer management UI (AC: 1)
  - [x] Use German destructive confirmation copy.
  - [x] Keep cancel path mutation-free.
- [x] Implement soft-delete command in `PrinterService` (AC: 2)
  - [x] Never hard-delete printer record.
  - [x] Set `deleted: true`, update timestamp, refresh active list signals.
- [x] Enforce active-list filtering in consumers (AC: 2)
  - [x] More/printer list and calculation default-selector paths must use active printers only.
- [x] Protect historical behavior contracts (AC: 3)
  - [x] Do not mutate historical snapshot structures.
  - [x] Keep record addressable by `id` for snapshot references.
- [x] Add tests (AC: 1, 2, 3)
  - [x] Confirmation cancel test.
  - [x] Soft-delete mutation and active-list exclusion tests.
  - [x] Regression test documenting snapshot-preservation expectation.

## Dev Notes

### Epic Context

Story 2.2 builds on Story 2.1 and establishes deletion semantics required by later calculation snapshot and inventory flows.

### Previous Story Intelligence

- Story 2.1 defines printer CRUD and active-list contract.
- Keep same validation and write path shape; add deletion command without rewriting create/edit logic.

### Implementation Guardrails

- Soft delete only. Never remove printer row from `printers` store.
- Confirmation required before mutation for destructive action.
- Preserve English implementation names (`deleted`) and German user copy.
- No direct DB mutation in UI component.

### Architecture Compliance

- AD-3: service-owned mutation pipeline.
- AD-7: referential integrity and historical reproducibility must hold after deletion.
- AD-9: German confirmation copy and a11y names.

### Current UPDATE File Intelligence

- `PrinterRecord` already includes `deleted`; no schema migration required for flag itself.
- `PrinterService` currently lacks dedicated delete command and active-only selectors.
- `more.component` currently placeholder; deletion UX likely implemented in new sub-feature files.
- `calculate.component` remains placeholder; keep integration seam by exposing active-printer query method for future story consumption.

### File Structure Requirements

- Update:
  - `src/app/core/printers/printer.service.ts`
  - `src/app/core/printers/printer.service.spec.ts`
  - printer-management UI files under `src/app/features/more/printers/*`
- Avoid unrelated route or shell rewrites.

### Library and Framework Requirements

- Angular 22 standalone + Signals patterns consistent with existing codebase.
- idb v8 operations via shared DB adapter only.
- Vitest + fake-indexeddb for deterministic service tests.

### Testing Requirements

- Verify confirm/cancel behavior at UI boundary.
- Verify soft delete sets flag and excludes printer from active list.
- Verify delete path keeps record retrievable by id for future snapshot-based workflows.

### Git Intelligence Summary

- Foundation stories prioritized strict contracts and non-regression checks. Keep same pattern: explicit behavior tests before broad UI polish.

### Latest Tech Information

- Angular Signals guidance: keep deletion state updates explicit and derived lists computed from source signal.
- idb v8 guidance: for multi-step delete updates, ensure write completes before refresh to avoid stale signal races.

### Project Context Reference

- No `project-context.md` file found in repository during discovery.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.2)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-7, AD-9)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (destructive confirmation, German copy)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/printers/printer.service.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Story created with dependency on Story 2.1 contracts and architecture soft-delete/snapshot requirements.

### Completion Notes List

- Story status set to `ready-for-dev`.
- Deletion behavior constrained to soft-delete and historical safety.
- Implemented printer soft-delete command in `PrinterService` with persisted `deleted: true` state, timestamp update, and signal refresh.
- Added UI delete affordance in printer management with German destructive confirmation copy and mutation-free cancel behavior.
- Added regression coverage for cancel path, confirmed soft-delete behavior, active-list exclusion, and ID-based record retrievability after delete.

### File List

- `_bmad-output/implementation-artifacts/2-2-soft-delete-printer-profiles-safely.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/core/printers/printer.service.ts`
- `src/app/core/printers/printer.service.spec.ts`
- `src/app/features/more/more.component.ts`
- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/features/more/more.component.spec.ts`

## Change Log

- 2026-06-23: Created Story 2.2 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented soft-delete workflow for printer profiles with confirmation UI and regression coverage; status set to `review`.
