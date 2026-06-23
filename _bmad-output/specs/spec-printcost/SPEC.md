---
id: SPEC-printcost
companions:
  - domain-contract.md
  - ../../planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md
  - ../../planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md
  - ../../planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md
sources:
  - ../../prd.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only.

# PrintCost

## Why

PrintCost solves spreadsheet-fragile pricing for individual FDM makers and very small 3D-print sellers who need a reliable price, stock context, and sales record on mobile without accounts, cloud sync, app-store distribution, or ERP overhead.

## Capabilities

- **CAP-1**
  - **intent:** User can price a print job from printer, customer, filament, material, time, quantity, plate, model, profit, and extra-work inputs.
  - **success:** Any valid input change updates the visible German cost breakdown and rounded EUR price within 100 ms.

- **CAP-2**
  - **intent:** User can manage printer cost profiles used by calculations.
  - **success:** Printer profiles can be created, edited, selected, and soft-deleted while saved calculations retain historical printer snapshots.

- **CAP-3**
  - **intent:** User can manage filament inventory, purchase history, remaining material, color, type, and price basis.
  - **success:** Weighted average, last paid, and fixed price modes produce correct per-gram costs, and historical calculations retain filament snapshots after edits or deletion.

- **CAP-4**
  - **intent:** User can save calculations and reusable templates without forcing immediate production.
  - **success:** Saved calculations preserve inputs, snapshots, selected price modes, computed results, and can be loaded or reused later without changing historical totals.

- **CAP-5**
  - **intent:** User can track printed inventory, manual parts, sales, and gifts.
  - **success:** Saved calculations appear under `Bestand > Drucke`, manual parts under `Bestand > Teile`, explicit print occurrences deduct filament once, and sales/gifts update sold/available counts without deducting filament.

- **CAP-6**
  - **intent:** User can manage optional local customers for calculations and sales.
  - **success:** Customer records can be created, edited, soft-deleted, selected, and left null for personal/no-customer workflows.

- **CAP-7**
  - **intent:** User can manage calculation defaults, data deletion, and service-worker update prompts.
  - **success:** Defaults prefill future records only, destructive actions require German confirmation, and update reload stays user-controlled.

- **CAP-8**
  - **intent:** User can manually back up and restore all local data without an account.
  - **success:** Export creates versioned JSON containing all stores and settings; import validates the full schema before replace-all mutation.

- **CAP-9**
  - **intent:** User can install and use the app offline after first load.
  - **success:** Calculation, inventory, filaments, customers, settings, templates, export, and import work offline after initial app load on supported browsers.

## Constraints

- MVP is a local-only installable PWA: no backend, accounts, login, cloud sync, runtime analytics, external runtime fonts, or hidden network transfer.
- User-facing UI, validation, dialogs, toasts, empty states, and accessibility labels are German; implementation identifiers and backup fields are English.
- Locale formatting uses `de-DE`, EUR, comma decimals, and day-month-year dates.
- The calculation contract uses total `printMinutes` and total `gramsUsed`; plate count never multiplies material or time costs and only gates `extraWorkFeePercent`.
- Saving a Calculation never deducts filament; only explicit print occurrence deducts total saved `gramsUsed`.
- Sales and gifts never deduct filament; they consume printed inventory count only.
- Historical correctness depends on Calculation snapshots for printer, filament, price mode, per-gram price, inputs, and outputs.
- Backup import is replace-only for MVP and must validate before clearing or writing local data.
- Architecture companion is binding for stack, boundaries, state mutation, persistence, deployment, CSP, and verification.
- UX companions are binding for four-surface IA, German copy, mobile-first responsive behavior, design tokens, and accessibility floor.

## Non-goals

- Backend storage, accounts, cloud sync, multi-user workflows, permissions, or shared devices.
- Invoicing, taxes, accounting, payments, ERP, monthly revenue analytics, or statistics dashboard.
- Resin-specific volume pricing, OctoPrint/printer telemetry, automatic scale measurement, photo attachments, web push notifications, merge import, or CSV export in MVP.
- Runtime language switching; German is the only MVP UI language.

## Success signal

A maker can install PrintCost, go offline, create printer and filament data, calculate a defensible print price in under 30 seconds, save it for later, record a print occurrence that deducts filament, and export a restorable JSON backup. Production build reaches Lighthouse PWA >= 90 and mobile performance >= 85 or the waiver is explicit.
