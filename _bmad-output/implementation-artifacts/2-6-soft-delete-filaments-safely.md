---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.6: Soft-Delete Filaments Safely

Status: review

## Story

As a maker,
I want deleted filaments hidden from new selection but preserved for saved calculations,
so that old pricing stays reproducible.

## Acceptance Criteria

1. **Given** active Filament exists, **when** user chooses delete, **then** German confirmation is shown before mutation, **and** canceling leaves Filament unchanged.
2. **Given** user confirms deletion, **when** deletion completes, **then** Filament is marked `deleted: true`, **and** it is hidden from active lists and future Calculation selection defaults.
3. **Given** saved Calculation contains `filamentSnapshot`, **when** source Filament is soft-deleted, **then** saved Calculation remains readable and reproducible from snapshot.
4. **Given** print occurrence later references soft-deleted Filament by saved `filamentId`, **when** Filament record still exists, **then** system can resolve it for stock deduction, **and** missing records are handled by German data error in print occurrence flow.

## Tasks / Subtasks

- [x] Add delete action and German confirm/cancel flow in filament management UI (AC: 1)
  - [x] Ensure cancel path has zero mutation.
- [x] Implement soft-delete command in filament service (AC: 2)
  - [x] Mark `deleted: true`, keep record data and `id`, refresh active list query state.
- [x] Ensure active selection queries hide deleted rows while id-based lookup remains possible (AC: 2, 4)
  - [x] Separate active-list query from by-id resolve query.
- [x] Guard historical and print-occurrence contracts (AC: 3, 4)
  - [x] Do not mutate saved snapshots.
  - [x] Define explicit missing-filament error path for future print-occurrence command.
- [x] Add tests (AC: 1, 2, 3, 4)
  - [x] Confirm/cancel UI tests.
  - [x] Service soft-delete + active filter tests.
  - [x] By-id resolution of soft-deleted filament tests.
  - [x] Missing-record error contract tests.

## Dev Notes

### Epic Context

Story 2.6 finalizes Epic 2 data safety rules for filaments and enables future inventory deduction logic in Epic 4.

### Previous Story Intelligence

- Stories 2.3-2.5 define filament data, price basis, and list behavior.
- Preserve existing list/search/filter behavior while introducing delete flow.

### Implementation Guardrails

- Soft-delete only; no hard delete.
- Keep deleted records resolvable by id for historical flows.
- Confirmation dialog must be German and explicit.
- Active-list and selection defaults exclude deleted rows.

### Architecture Compliance

- AD-6: print occurrence may need soft-deleted filament lookup by saved id.
- AD-7: historical snapshots stay reproducible.
- AD-3: service-owned mutation path only.
- AD-9: German UI/a11y text.

### Current UPDATE File Intelligence

- `FilamentRecord` already includes `deleted`; ensure service/API preserve this field on updates.
- `filaments` store has `deleted` index, supporting active query filtering.
- Filaments UI currently placeholder; ensure delete UX integrates with existing/new list rows from Stories 2.3-2.5.
- Inventory print-occurrence logic not implemented yet; define clear interface now so Epic 4 can consume.

### File Structure Requirements

- Update:
  - `src/app/core/filaments/filament.service.ts`
  - `src/app/core/filaments/filament.service.spec.ts`
  - `src/app/features/filaments/filaments.component.ts`
  - `src/app/features/filaments/filaments.component.html`
  - optional future-facing contract in inventory domain/service files if introduced.

### Library and Framework Requirements

- Keep signal query split (`active`, `all/byId`) for clarity and future integration.
- Keep DB writes transactional and explicit with idb adapter.

### Testing Requirements

- Confirm deletion confirmation behavior and cancel safety.
- Verify active-list exclusion and by-id resolution for soft-deleted records.
- Verify missing-record branch returns explicit German data error contract.

### Git Intelligence Summary

- Existing commits favor explicit policy constraints. Story should codify soft-delete lookup semantics now to prevent Epic 4 regressions later.

### Latest Tech Information

- idb v8 best practice supports keeping immutable historical records while filtering active views through indexed predicates.
- Angular signal selectors should model distinct query intents (`active list` vs `resolve by id`) to avoid accidental filtering bugs.

### Project Context Reference

- No `project-context.md` file found in repository during discovery.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.6)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-3, AD-6, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` (stock deduction semantics)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (destructive confirmation behavior)
- `src/app/core/db/printcost-db.ts`
- `src/app/domain/models/storage.models.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Added soft-delete command and by-id resolve helpers to FilamentService.
- Added German confirmation/cancel behavior in the Filaments UI with cancel safety and deletion refresh.
- Verified the Angular test suite and production build after the soft-delete flow.

### Completion Notes List

- Implemented soft-delete for filaments while preserving record data, id-based lookup, and active-list filtering.
- Added German confirmation/cancel UI for delete actions and ensured cancel keeps state unchanged.
- Added regression tests for service soft-delete, by-id resolution, missing-record handling, and UI confirm/cancel behavior.
- Verified the Filament feature test suite and production build after the changes.

### File List

- `_bmad-output/implementation-artifacts/2-6-soft-delete-filaments-safely.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/core/filaments/filament.service.ts`
- `src/app/core/filaments/filament.service.spec.ts`
- `src/app/features/filaments/filaments.component.ts`
- `src/app/features/filaments/filaments.component.html`
- `src/app/features/filaments/filaments.component.scss`
- `src/app/features/filaments/filaments.component.spec.ts`

## Change Log

- 2026-06-23: Created Story 2.6 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented soft-delete behavior and tests; marked the story ready for review.
