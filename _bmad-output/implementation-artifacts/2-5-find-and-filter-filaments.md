---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 2.5: Find and Filter Filaments

Status: review

## Story

As a maker,
I want to search and filter filament inventory,
so that I can quickly pick or inspect material before a job.

## Acceptance Criteria

1. **Given** Filament list is visible, **when** filter chips render, **then** available filters are `Alle`, `PLA`, `PETG`, `ABS`, `TPU`, and `Anderes`, **and** one filter is active at a time.
2. **Given** user searches Filaments, **when** no records match, **then** German no-results message appears, **and** filter chips remain visible.
3. **Given** Filament rows render, **when** user scans list, **then** each row shows color swatch, name, manufacturer when present, price per gram, material tag, and remaining amount.
4. **Given** Filament has low or zero stock, **when** row renders, **then** it remains selectable, **and** low/zero stock is indicated by label, icon, or state text in addition to color.

## Tasks / Subtasks

- [x] Build search + filter state on Filaments surface (AC: 1, 2)
  - [x] Add chip row with one-active-at-a-time behavior.
  - [x] Add search input and derived filtered list.
- [x] Render complete filament row summary (AC: 3)
  - [x] Show swatch, names, manufacturer optional, material tag, per-gram value, remaining amount.
- [x] Implement no-results and low-stock states (AC: 2, 4)
  - [x] Keep chips visible when no result.
  - [x] Keep low/zero rows selectable with explicit text/icon state.
- [x] Add tests (AC: 1, 2, 3, 4)
  - [x] Chip exclusivity tests.
  - [x] No-results state test preserving chips.
  - [x] Row content rendering tests.
  - [x] Low-stock non-color indicator and selectability tests.

## Dev Notes

### Epic Context

Story 2.5 turns filament data into usable inventory discovery UI and directly supports quick pre-job selection behavior from UX flow.

### Previous Story Intelligence

- Story 2.3 provides source filament records.
- Story 2.4 provides per-gram price basis; this story should display computed/readable price without redefining formula logic.

### Implementation Guardrails

- Filter chips text and labels must be German exactly as specified.
- Keep chip row horizontally scrollable and visible in no-result state.
- Use one active filter at a time in MVP.
- Do not block selection for low/zero stock entries.

### Architecture Compliance

- AD-2/AD-3: component orchestrates query state; service remains source of truth.
- AD-9: German visible copy and accessibility naming.
- UX-DR24 and UX-DR25: required no-results and low-stock states.

### Current UPDATE File Intelligence

- `filaments.component.ts/.html` currently placeholder; story implements primary list behavior here or in local child components.
- `printcost-db.ts` includes `type` index; can support efficient filter query if needed.
- No locale formatting helper is currently used in filaments view; keep formatting strategy consistent with existing project conventions.

### File Structure Requirements

- Update:
  - `src/app/features/filaments/filaments.component.ts`
  - `src/app/features/filaments/filaments.component.html`
  - `src/app/features/filaments/filaments.component.scss` (if needed)
  - `src/app/core/filaments/filament.service.ts` (query helpers)
- Avoid introducing cross-feature coupling to inventory/calculate stories.

### Library and Framework Requirements

- Angular signal-based derived state for search/filter.
- Maintain touch-first behavior; avoid hover-only interactions.

### Testing Requirements

- Verify one-active-chip contract.
- Verify no-results message in German with chips still visible.
- Verify row content completeness and low-stock a11y indicator beyond color.

### Git Intelligence Summary

- Existing app shell patterns are simple and direct. Keep filaments list implementation incremental, test-backed, and route-local.

### Latest Tech Information

- Angular 22 guidance favors explicit signal-derived view state over mutable imperative lists.
- Accessibility best practice: pair color cues with text/icon semantic indicator for stock states.

### Project Context Reference

- No `project-context.md` file found in repository during discovery.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.5)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (Filaments flow, UX-DR24, UX-DR25, chip behavior)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (chip and row component design language)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-9)
- `src/app/features/filaments/filaments.component.html`
- `src/app/core/db/printcost-db.ts`

## Story Completion Status

- Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex (gpt-5.3-codex)

### Debug Log References

- Added signal-driven search and one-at-a-time filter chips to the Filaments surface.
- Added derived filtered lists, German no-results handling, row price-per-gram display, and explicit material tags.
- Preserved low-stock selectability and verified the Angular test suite plus production build after the change.

### Completion Notes List

- Implemented Filament inventory search and chip-based filtering with one active filter at a time.
- Added German no-results handling, material tags, and per-gram price display using the service price-basis helper.
- Kept low-stock rows selectable and non-color dependent.
- Added regression tests for chip exclusivity, no-results preservation, row content, and low-stock presentation.

### File List

- `_bmad-output/implementation-artifacts/2-5-find-and-filter-filaments.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/features/filaments/filaments.component.ts`
- `src/app/features/filaments/filaments.component.html`
- `src/app/features/filaments/filaments.component.scss`
- `src/app/features/filaments/filaments.component.spec.ts`

## Change Log

- 2026-06-23: Created Story 2.5 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented Filament search/filter UI and tests; marked the story ready for review.
