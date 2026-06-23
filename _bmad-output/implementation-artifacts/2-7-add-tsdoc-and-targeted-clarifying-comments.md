---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.7: Add TSDoc and Clarifying Documentation for Existing Code

Status: review

## Story

As a maker and maintainer,
I want important functions, stores, and complex logic documented with TSDoc and targeted clarifying comments,
so that implementation intent stays clear and future development is safer.

## Acceptance Criteria

1. **Given** existing TypeScript modules in `core`, `domain`, and feature layers, **when** documentation pass is completed, **then** public APIs, critical private functions, and store/state structures have concise TSDoc, **and** non-obvious rules and constraints are documented.
2. **Given** comments are added, **when** developer reads code, **then** comments clarify purpose, invariants, side effects, and decisions, **and** do not narrate obvious line-by-line operations.
3. **Given** service/database/store logic contains important behaviors, **when** TSDoc is written, **then** input/output contracts, mutation boundaries, and error behavior are explicit, **and** wording remains concise and maintainable.
4. **Given** new tickets are created after this story, **when** tasks/dev notes are prepared, **then** ticket includes requirement to document difficult functions/stores with TSDoc, **and** includes rule to comment sections/functions only, not every line.

## Tasks / Subtasks

- [x] Add TSDoc coverage to existing critical modules (AC: 1, 3)
  - [x] Document database contract and schema helpers in `core/db`.
  - [x] Document service mutation/query APIs in `core/*`.
  - [x] Document domain model constraints and non-obvious calculation/storage rules.
- [x] Add targeted clarifying comments in complex sections only (AC: 2)
  - [x] Comment only sections/functions/important blocks that are hard to infer.
  - [x] Do not add line-by-line or redundant comments.
- [x] Standardize future ticket expectation (AC: 4)
  - [x] Ensure story template/dev-note conventions include TSDoc requirement for complex functions/stores.
- [x] Add/adjust tests only when refactors are needed for documentation-safe edits (AC: 1-3)

## Dev Notes

### Implementation Guardrails

- Keep code behavior unchanged; this story is documentation-focused.
- Use TSDoc for functions, stores, interfaces, and complex logic boundaries.
- Explain why/constraints/side effects; skip obvious "what this line does" comments.
- Prefer short, high-signal documentation blocks.

### Scope Priorities

1. `src/app/core/db/printcost-db.ts`
2. `src/app/core/printers/printer.service.ts`
3. `src/app/core/settings/settings.service.ts`
4. `src/app/domain/models/storage.models.ts`
5. Other service/store-like files introduced by Epic 2 implementation.

### Documentation Standard

- Required in TSDoc when relevant:
  - Purpose and responsibility.
  - Parameters and return value expectations.
  - Side effects (DB writes, signal updates, state mutation).
  - Invariants/constraints (soft delete, snapshot safety, local-only assumptions).
  - Error or invalid-input behavior.
- Forbidden:
  - Commenting every line.
  - Repeating code literally without added intent.

### References

- `_bmad-output/planning-artifacts/epics.md` (Story 2.7)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md`

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Story created to formalize documentation baseline and future ticket requirement for targeted TSDoc.
- Added TSDoc to core DB helpers, printer/settings services, filament service, and storage models without changing behavior.
- Updated the story template to keep the TSDoc requirement explicit for future tickets.
- Added `.gitignore` entries for local AI tool state and generated macOS metadata.
- Added targeted clarifying comments to the filament and printer feature components.
- Re-ran the test suite and production build after the component comment pass.

### Completion Notes List

- Story status set to `review`.
- Includes explicit "no comment-every-line" rule.
- Documented public APIs, store contracts, and complex service boundaries with concise TSDoc.
- Added one-time clarifying comments only where deterministic behavior or persistence rules were non-obvious.
- Verified the existing test suite and production build still pass.
- Added targeted comments in the feature components where the create/edit/delete flow needed extra intent.
- Re-verified the feature comment pass did not change behavior.

### File List

- `_bmad-output/implementation-artifacts/2-7-add-tsdoc-and-targeted-clarifying-comments.md`
- `.gitignore`
- `.agents/skills/bmad-create-story/template.md`
- `src/app/core/db/printcost-db.ts`
- `src/app/core/filaments/filament.service.ts`
- `src/app/core/printers/printer.service.ts`
- `src/app/core/settings/settings.service.ts`
- `src/app/domain/models/storage.models.ts`
- `src/app/features/filaments/filaments.component.ts`
- `src/app/features/more/more.component.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-23: Created Story 2.7 documentation-focused implementation context; status set to `ready-for-dev`.
- 2026-06-23: Added TSDoc and clarifying comments to critical core/domain modules, updated the story template convention, and added AI-state ignore rules.
- 2026-06-23: Added clarifying comments to the filament and printer feature components.
