---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
documentInventory:
  prd:
    - /Users/U730282/.private/PrintCost/_bmad-output/prd.md
  architecture:
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/reviews/review-adversarial-divergence.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/reviews/review-input-reconciliation.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/reviews/review-rubric-walker.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/reviews/review-version-currentness.md
  epics:
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/epics.md
  ux:
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md
    - /Users/U730282/.private/PrintCost/_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/reconcile-standalone-html.md
---
# Implementation Readiness Assessment Report

**Date:** 2026-06-23
**Project:** PrintCost

## Document Discovery

### Confirmed Assessment Inputs

- PRD: `_bmad-output/prd.md`
- Architecture: full folder `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- UX: full folder `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/`

### Notes

- Supporting artifacts under `_bmad-output/` may be referenced where relevant.
- No blocking whole-vs-sharded conflict remained after user confirmation.

## PRD Analysis

### Functional Requirements

FR-1: Create and edit Printer Profiles, including validated fields for `name`, `powerWatts`, `purchasePriceEur`, `lifetimeHours`, `electricityPriceEurKwh`, optional `annualBaseFeeEur`, and optional `note`. The system must reject invalid or missing required values, and the calculation screen must block with an empty-state prompt when no active printer profile exists.

FR-2: Preserve historical printer costs by soft-deleting printer profiles referenced by saved calculations and retaining each calculation's `printerSnapshot`, while hiding deleted profiles from future selection.

FR-3: Create and edit Filaments with validated fields for `name`, `type`, `colorHex`, optional `manufacturer`, `rollWeightG`, `remainingG`, required `purchases`, optional `multiColorSurchargeEurKg`, and optional `fixedPriceEurG`. Filaments with zero remaining material must remain selectable, and deleted referenced filaments must be soft-deleted with snapshots preserved.

FR-4: Calculate filament cost basis using `WEIGHTED_AVERAGE`, `PAID`, or `FIXED` price modes per filament line. Weighted average must update whenever a purchase changes, and the chosen price mode must be stored on each calculation line.

FR-5: Enter calculation inputs for project name, printer profile, optional customer, one or more filament lines, print duration, quantity, parts per plate, optional multi-plate surcharge, model existence, modeling cost, and profit margin, with the defaults and validations defined in the PRD.

FR-6: Calculate cost breakdown and rounded price using the exact plate, electricity, base fee, depreciation, material, surcharge, modeling, subtotal, final price, and ceiling-rounding formula in the PRD. Visible results must update from any input change and display a full breakdown including total grams for multi-color jobs.

FR-7: Save calculation snapshots, including printer snapshot, filament snapshots, selected price modes, calculated price per gram, full inputs, and computed outputs so historical calculations remain stable after later edits.

FR-8: Manage saved print inventory via an Inventory screen with a Prints tab, filters for inventory and sale status, visible project and quantity metadata, and a `+1` action that increments `timesPrinted` without creating a new calculation.

FR-9: Record sales and gifts against saved calculations with optional customer, sale price, gift flag, date, and note, while updating sold and remaining counts on the inventory card.

FR-10: Track manual parts with optional linked calculations and inline quantity adjustment, while allowing parts to remain valid without a linked calculation.

FR-11: Manage Customers with validated `name`, optional `contact`, and optional `note`, supporting create, edit, soft-delete, and selection, while allowing calculations and sales to have no associated customer.

FR-12: Manage calculation defaults for default price mode, profit margin, modeling cost, and multi-color surcharge, applying those defaults only to future entries unless users explicitly edit an existing record.

FR-13: Save and load Templates so a calculation can be stored as a reusable template and later loaded back into the form with all fields still editable.

FR-14: Export Backup JSON as `printcost-backup-YYYY-MM-DD.json`, including schema version, export timestamp, all stores, and settings.

FR-15: Import Backup JSON using a replace strategy after schema validation and explicit confirmation, with merge import explicitly deferred beyond MVP.

Total FRs: 15

### Non-Functional Requirements

NFR-1: Time to Interactive must be under 3 seconds on a typical mobile 4G connection.
NFR-2: Calculation result updates must complete within 100 ms after input changes.
NFR-3: Initial gzipped bundle size should stay under 200 KB.
NFR-4: Typical IndexedDB read/write operations should complete within 50 ms.
NFR-5: Production build must use lazy-loaded feature routes.
NFR-6: The UI must be mobile-first and fully usable at 320 px viewport width.
NFR-7: Interactive controls must meet WCAG 2.2 AA contrast requirements.
NFR-8: The app must support keyboard navigation with visible focus states.
NFR-9: Icon-only controls and toggles must have accessible labels.
NFR-10: Motion must respect `prefers-reduced-motion`.
NFR-11: Touch targets must be at least 44 x 44 px.
NFR-12: No runtime analytics, tracking, external fonts, or external runtime dependencies.
NFR-13: User data must remain on the user's device unless the user manually exports it.
NFR-14: All text inputs must be trimmed and length-limited before storage.
NFR-15: User input must not be rendered through unsafe `innerHTML`.
NFR-16: The app must not use `eval()`.
NFR-17: JSON import must validate schema before writing to IndexedDB.
NFR-18: A strict Content Security Policy should be used for hosted deployments.
NFR-19: Calculation, Inventory, Filaments, Customers, Settings, Templates, export, and import must work offline after initial app load.
NFR-20: Service Worker caching uses app-shell precache and local assets only.
NFR-21: When a new service worker version is available, the app shows a non-blocking update banner and lets the user choose when to reload.
NFR-22: HTTPS is required for hosted PWA deployment.

Total NFRs: 22

### Additional Requirements

- Angular 18+ with standalone components and strict TypeScript
- Angular Signals for reactive feature state and derived calculation state
- Typed Reactive Forms for major forms
- SCSS and CSS custom properties
- Lucide Angular or equivalent tree-shakeable icon set
- IndexedDB via a small typed wrapper or `idb`
- Angular service worker and web app manifest
- Static hosting target
- Build and optional static deployment on push to main
- Open question: filament `remainingG` auto-deduction versus manual tracking
- Open question: preferred static hosting target
- Open question: final PWA icon requirement before MVP release
- Open question: whether CSV export stays post-MVP or is needed in MVP
- Assumption: single-user MVP with no authentication
- Assumption: all data remains local unless manually exported
- Assumption: FDM gram-based pricing is the primary MVP model
- Assumption: import replace strategy is acceptable for MVP
- Assumption: English identifiers remain the implementation contract
- Assumption: German is the only MVP UI language

### PRD Completeness Assessment

The PRD is implementation-usable. It defines scope, target user, explicit FRs and NFRs, data model contracts, route structure, technology constraints, localization rules, success metrics, and a starter delivery plan. The main residual ambiguity is operational rather than structural: the open questions on filament auto-deduction, hosting target, icon readiness, and CSV timing should be resolved before implementation starts because they influence backlog ordering and acceptance criteria.

## Epic Coverage Validation

### Coverage Matrix

| FR Number | PRD Requirement | Epic Coverage | Status |
| --- | --- | --- | --- |
| FR-1 | Printer profile CRUD and validation | Epic 2, Story 2.1 | Covered |
| FR-2 | Printer soft-delete with historical snapshots | Epic 2, Story 2.2 | Covered |
| FR-3 | Filament CRUD, validation, and historical preservation | Epic 2, Stories 2.3 and 2.6 | Covered |
| FR-4 | Filament price basis modes and persistence | Epic 2, Stories 2.4 and 2.5 | Covered |
| FR-5 | Calculation inputs and validation | Epic 3, Stories 3.1 and 3.2 | Covered |
| FR-6 | PRD formula using total job `printMinutes`, total `gramsUsed`, and optional `extraWorkFeePercent` | Epic 3, Stories 3.3 and 3.4 | Covered |
| FR-7 | Save calculation snapshots | Epic 3, Story 3.5 | Covered |
| FR-8 | Inventory list, filters, `+1` print count | Epic 4, Stories 4.1 and 4.2 | Covered |
| FR-9 | Record sales and gifts | Epic 4, Story 4.4 | Covered |
| FR-10 | Manual parts tracking | Epic 4, Story 4.5 | Covered |
| FR-11 | Customer management | Epic 4, Story 4.6 | Covered |
| FR-12 | Calculation defaults/settings | Epic 5, Story 5.1 | Covered |
| FR-13 | Templates | Epic 3, Story 3.6 | Covered |
| FR-14 | Backup export | Epic 5, Story 5.2 | Covered |
| FR-15 | Backup import with replace strategy | Epic 5, Story 5.3 | Covered |

### Missing Requirements

No PRD functional requirement is absent from the epics and stories set.

### Coverage Defects

- Resolved: FR numbering now matches PRD FR-1 through FR-15 directly.
- Resolved: PRD FR-6 now matches the architecture and epic rule set around total job inputs and `extraWorkFeePercent`.
- Minor: print-occurrence stock deduction is now explicit in the PRD under FR-8, but implementation acceptance criteria should still be reviewed carefully to keep edge-case behavior consistent.

### Coverage Statistics

- Total PRD FRs: 15
- Fully covered: 15
- Covered with traceability drift: 0
- Completely missing: 0
- Materially conflicting: 0

### FRs In Epics But Not In PRD

- None after reconciliation. Offline/PWA behavior remains captured in scope and NFRs rather than the functional requirement inventory.

## UX Alignment Assessment

### UX Document Status

Found.

Reviewed UX package:
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md`

### Alignment Strengths

- PRD, UX, and architecture align on the product being a German-language user interface with English implementation identifiers.
- PRD, UX, and architecture align on the four core surfaces: calculation, inventory, filaments, and more.
- Offline-first, local-only data handling is consistent across PRD, UX, and architecture.
- Mobile-first and accessibility intent are consistently present across PRD and UX.

### Alignment Issues

- No remaining critical PRD/UX/architecture alignment conflict after the PRD was reconciled to the canonical pricing model.

### Warnings

- UX documentation exists and is sufficient for implementation planning.
- Remaining readiness risk is now structural story quality rather than cross-document UX/business-rule divergence.

## Epic Quality Review

### Critical Violations

- Epic 1 is only partially user-value shaped. Its user-facing wrapper is acceptable, but Story 1.3 (`Initialize Local IndexedDB Schema and Settings`) and Story 1.5 (`Add Static Hosting, CSP, and Build Checks`) are technical implementation tasks, not independently valuable user stories.
- Story 1.3 creates all IndexedDB stores up front. This violates the workflow standard that data structures should be introduced when first needed by a user-delivering slice rather than as a broad technical milestone.
- Story 3.3 (`Implement Pure Calculation Engine`) is framed as a user story but is actually a technical component story. It is necessary engineering work, but it is not independently user-visible.

### Major Issues

- Several stories blend multiple concerns and are likely oversized for a single implementation pass:
  - Story 2.3 combines filament CRUD, validation, purchase-history management, and low/zero-stock state handling.
  - Story 3.1 combines full calculation form structure, validation behavior, empty states, and save gating.
  - Story 5.3 combines file ingestion, schema validation, destructive confirmation, full data replacement, and signal refresh.
- Epic traceability is weakened by requirement renumbering and requirement mutation. This is already a readiness defect and also a quality defect because story-to-requirement mapping is no longer clean.
- Epic 4 bundles four user domains together: printed inventory, print occurrence, sales, parts, and customers. The epic still represents user value, but its scope is broad enough that sequencing and testing risk rise materially.

### Minor Concerns

- Acceptance criteria quality is generally strong and testable. The document uses consistent Given/When/Then structure and includes failure states more often than not.
- There are no obvious forward references to future stories inside acceptance criteria. The sequential dependency shape is largely sane: platform foundation before data entry, data entry before calculation, calculation before inventory workflows.
- Epic titles are mostly user-facing, but a few story titles still reveal implementation-first decomposition rather than user-observable outcomes.

### Best-Practice Compliance Summary

- Epic delivers user value: mixed
- Epic can function independently: mostly yes at epic level, weaker at story level in Epic 1
- Stories appropriately sized: mixed
- No forward dependencies: mostly yes
- Database tables created when needed: no
- Clear acceptance criteria: yes
- Traceability to FRs maintained: no

### Recommendations

- Re-slice Story 1.3 so storage setup is introduced incrementally by the first user-facing feature that actually needs each store.
- Reframe Story 1.5 and Story 3.3 as enabling tasks under user-facing stories, or split them into thinner vertical stories that expose clear user value.
- Split Story 2.3 and Story 5.3 into narrower slices if implementation parallelism or reviewability matters.
- Reconcile epic FR numbering and semantics back to the PRD before implementation starts.

## Summary and Recommendations

**Date:** 2026-06-23  
**Assessor:** Codex

### Overall Readiness Status

NEEDS WORK

### Critical Issues Requiring Immediate Action

- Rework technical milestone stories that currently masquerade as user stories, especially Story 1.3, Story 1.5, and Story 3.3.
- Revisit the up-front database-schema story. The current plan creates all stores before the user-facing slices that need them, which conflicts with the workflow's staged-entity guidance.

### Recommended Next Steps

1. Split or reframe technical stories into thinner user-visible slices, especially storage setup, calculation engine, hosting/CSP/build checks, and backup import.
2. Re-slice database setup so stores are introduced with the first user-facing workflow that needs them.
3. Keep the reconciled pricing rule set and FR numbering as the canonical baseline for any future artifact regeneration.
4. Re-run readiness review after the story-structure corrections.

### Final Note

This assessment originally found major traceability and business-rule consistency defects, and those have now been reconciled in the planning artifacts. The remaining issues are concentrated in story slicing and implementation-structure quality. The artifacts are closer to implementation-ready, but they still need story-level cleanup before execution.
