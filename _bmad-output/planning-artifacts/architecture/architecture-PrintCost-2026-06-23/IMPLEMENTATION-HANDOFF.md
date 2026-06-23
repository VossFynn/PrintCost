---
name: PrintCost
type: implementation-handoff
purpose: builder-agent handoff
status: final
created: 2026-06-23
updated: 2026-06-23
sources:
  - ARCHITECTURE-SPINE.md
  - ../../../prd.md
  - ../ux-designs/ux-PrintCost-2026-06-23/DESIGN.md
  - ../ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md
---

# PrintCost Implementation Handoff

Use `ARCHITECTURE-SPINE.md` as the governing contract. This handoff exists for builder agents so they can start without re-deriving boundaries.

## Build Order

1. Scaffold Angular 22 PWA with strict TypeScript, standalone routing, SCSS, service worker, manifest, and GitHub Pages-compatible production build.
2. Add design tokens and shell: warm app surface, bottom navigation, update banner, local DM Sans, Lucide icon registration.
3. Create `domain/models`, `core/db`, schema v1 stores, migration hook, and seed settings.
4. Implement `domain/calculation/calculate()` with tests before UI wiring.
5. Implement services around readonly Signals and async commands: printers, filaments, calculations, customers, settings, templates, backup.
6. Build routes in this order: `calculate`, `filaments`, `inventory`, `more`.
7. Add backup export/import, full data delete, PWA/offline checks, bundle budget, Lighthouse/PWA pass.

## Non-Negotiable Builder Rules

- Do not call IndexedDB from route components.
- Do not put German words in TypeScript model, enum, service, route, or store names.
- Do not render user input through `innerHTML`.
- Do not deduct filament when saving a Calculation.
- Do not multiply cost by plate count.
- Do not use `multiPlateSurchargePercent`; use `extraWorkFeePercent`.
- Do not deduct filament on Sale.
- Do not add backend, analytics, runtime external fonts, cloud sync, or network calls.
- Do not implement merge import for MVP.

## Correct Calculation Formula

`printMinutes` and `gramsUsed` are total job values. `plates` only explains runs and unlocks an optional extra-work fee.

```text
plates = ceil(printQuantity / partsPerPlate)
materialCost = sum(gramsUsed[i] * pricePerGram[i])
electricityCost = ((powerWatts / 1000) * electricityPriceEurKwh / 60 + annualBaseFeeEur / 365 / 24 / 60) * printMinutes
depreciationCost = (purchasePriceEur / (lifetimeHours * 60)) * printMinutes
modelingCost = modelExists ? 0 : modelingCostEur
subtotalBeforeFee = materialCost + electricityCost + depreciationCost + modelingCost
extraWorkFee = plates > 1 ? subtotalBeforeFee * extraWorkFeePercent / 100 : 0
subtotal = subtotalBeforeFee + extraWorkFee
finalPrice = subtotal * (1 + profitMarginPercent / 100)
roundedFinalPrice = ceil(finalPrice)
```

## Stock And Inventory Semantics

- Save Calculation: store snapshots and result, show under `Bestand > Drucke`, allow `timesPrinted = 0`.
- Print occurrence (`+1` or `Druck verbuchen`): increment `timesPrinted`, deduct saved total `gramsUsed` once from current Filament stock, resolving by saved `filamentId` even when soft-deleted.
- Low stock on print occurrence: do not block; clamp `remainingG` to `0` and show a German warning. Missing Filament record blocks with a German data error.
- Sale/Gift: record transaction against a Calculation and reduce available printed count; no filament deduction.
- Manual Part: lives under `Bestand > Teile`; may optionally link to Calculation.

## Source Tree Seed

```text
src/app/
  shell/
  core/db/
  core/backup/
  core/locale/
  domain/models/
  domain/calculation/
  domain/validation/
  features/calculate/
  features/inventory/
  features/filaments/
  features/more/
  shared/ui/
  shared/icons/
```

## Test Floor

- Unit-test calculation formula, especially plate count, price modes, modeling cost, extra-work fee, profit margin, and rounding.
- Unit-test backup import validation rejects invalid schema before mutation.
- Unit-test print occurrence stock deduction and sale no-deduction behavior.
- E2E or component-test first launch empty states: no printer, no filament, valid save disabled.
- Production build must keep lazy routes and pass PWA/offline smoke checks.

## Open Builder Inputs

- Final PWA icon assets.
- CSV export stays post-MVP unless product pulls it forward.
- Desktop can stay centered single-column unless inventory management proves too constrained.
- Sale edit/delete correction policy is deferred unless required in MVP.
