---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 4.6: Manage Customer Records

Status: review

## Story

As a maker,
I want to manage customer records locally,
So that calculations and sales can be associated with repeat buyers.

## Acceptance Criteria

1. **Given** the user opens `Mehr`, **when** they choose `Kunden`, **then** they can view Customer records, **and** each preview row shows generated initials, name, and contact/note preview when present.
2. **Given** the user creates or edits a Customer, **when** they save, **then** `name`, optional `contact`, and optional `note` are validated against the domain contract, **and** invalid fields show German inline validation.
3. **Given** a Customer exists, **when** the user soft-deletes it, **then** a German confirmation is shown, **and** the Customer is hidden from active selectors while historical Calculation and Sale references remain readable.
4. **Given** the Calculation or Sale flow needs a Customer, **when** the user opens the selector, **then** active Customers can be selected, **and** null Customer remains valid as personal/no-customer.

## Tasks / Subtasks

- [x] Implement Customer list and preview row rendering in `Mehr > Kunden` (AC: 1)
  - [x] Show generated initials, display name, and contact/note preview in each row.
  - [x] Keep customer listing scoped to active (non-deleted) records for selection surfaces.
- [x] Implement Customer create/edit flow with domain validation (AC: 2)
  - [x] Validate `name`, optional `contact`, and optional `note` against the domain contract before persist.
  - [x] Show German inline validation messages for invalid input.
- [x] Implement Customer soft-delete behavior and historical safety (AC: 3)
  - [x] Show German delete confirmation before persistence.
  - [x] Hide soft-deleted customers from active selectors while preserving historical readability in existing Calculation/Sale records.
- [x] Wire Customer selectors into Calculation and Sale flows (AC: 4)
  - [x] Allow selecting active customers in both flows.
  - [x] Preserve null/no-customer as a valid option.
- [x] Add focused regression checks for Customer CRUD, selector behavior, and soft-delete visibility (AC: 1-4)
  - [x] Cover preview row rendering and form validation behavior.
  - [x] Cover selector filtering and null-customer path.
- [x] Documentation requirement
  - [x] Add TSDoc for customer service/store contracts and selector integration boundaries.
  - [x] Add clarifying comments only where referential integrity or soft-delete behavior is non-obvious.

## Dev Notes

### Epic Context

This story introduces customer management as a local-only capability in Epic 4 so repeat buyers can be associated with calculations and sales without adding account/auth complexity.

### Story Context

- Customer management lives under `Mehr` and must align with the existing German management UX.
- Customer assignment is optional in both calculation and sale flows.
- Soft-delete behavior must preserve historical readability where old records reference deleted customers.

### Implementation Guardrails

- Keep all visible labels, validation, and confirmation copy in German.
- Enforce validation in service/domain boundaries, not only in template-level checks.
- Keep soft-delete semantics; do not hard-delete customers referenced by history.
- Do not add server/network dependencies; this remains local IndexedDB-only.

### Architecture Compliance

- AD-2: keep feature-layer boundaries (`features/more`, calculation/sale selectors) without leaking persistence logic into components.
- AD-3: service-owned writes and signal refresh for customer mutations.
- AD-7: preserve referential integrity with soft-delete and readable historical references.
- AD-9: German UI copy with English implementation identifiers.

### Current UPDATE File Intelligence

- `src/app/domain/models/storage.models.ts` currently defines `CustomerRecord` minimally (`id`, `deleted`) and needs full FR-11 fields.
- `src/app/core/db/printcost-db.ts` already has a `customers` store and `deleted` index; schema alignment for customer fields must stay compatible.
- `src/app/features/more/more.component.*` currently implements printer management only; customer list/form entry points are not present yet.
- `src/app/core/calculations/calculation.service.ts` and stored records already include optional `customerId`, so customer selector integration should reuse existing optional semantics.
- Sale persistence structures already include `customerId`; selector/filter behavior must align with active-customer-only rules.

### File Structure Requirements

- Update:
  - `src/app/domain/models/storage.models.ts`
  - `src/app/core/db/printcost-db.ts` (only if index/schema wiring adjustments are required)
  - `src/app/features/more/*` (customer list + form UX)
  - `src/app/features/calculate/*` and sale/inventory flow files where customer selectors are surfaced
  - `src/app/core/*` customer-focused service(s) for CRUD + soft-delete + query filtering
- Avoid:
  - introducing a parallel customer store
  - embedding persistence logic directly in components

### Testing Requirements

- Regression checks must cover:
  - customer list row preview rendering (initials, name, contact/note preview)
  - create/edit validation and German inline error behavior
  - soft-delete confirmation + active selector filtering
  - historical readability with deleted customer references
  - optional/null customer flow in calculation and sale selectors

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.6)
- `_bmad-output/prd.md` (FR-11)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-7, AD-9)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (More/Kunden flow, customer preview row)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md` (customer preview row treatment)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/features/more/more.component.ts`

## Story Completion Status

- Implementation complete and review-ready with automated AC coverage.

## Change Log

- 2026-06-23: Created Story 4.6 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented customer CRUD, selector integration, and focused regression coverage; status set to `review`.
