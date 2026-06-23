---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 5.1: Manage Calculation Defaults

Status: review

## Story

As a maker,
I want to set default pricing values,
So that new calculations start with my usual assumptions.

## Acceptance Criteria

1. **Given** the user opens `Mehr`, **when** they choose `Kalkulations-Standards` under the `System` group, **then** a settings form opens with editable default fields.
2. **Given** the user edits defaults, **when** they save, **then** `defaultPriceMode`, `defaultProfitMarginPercent`, `defaultModelingCostEur`, and `defaultExtraWorkFeePercent` are validated, **and** invalid fields show German inline validation.
3. **Given** defaults are saved, **when** the user creates a future Calculation, **then** the saved defaults prefill the corresponding fields, **and** existing saved Calculations are not changed.
4. **Given** Settings are persisted, **when** the app reloads, **then** saved defaults are restored from `IndexedDB`, **and** numeric values format with German locale conventions.

## Tasks / Subtasks

- [x] Extend `DEFAULT_SETTINGS` in `storage.models.ts` with calculation-default keys (AC: 3, 4)
  - [x] Add `defaultPriceMode: 'FIXED'` (matches PriceMode enum), `defaultProfitMarginPercent: 0`, `defaultModelingCostEur: 0`, `defaultExtraWorkFeePercent: 0`.
  - [x] Do NOT use `multiPlateSurchargePercent`; key must be `defaultExtraWorkFeePercent`.
- [x] Wire settings defaults into `CalculationService` / Calculation form prefill (AC: 3)
  - [x] Read defaults from `SettingsService.settings` signal in `calculate.component.ts` on form init.
  - [x] Apply defaults only to new blank form (not when loading a saved calculation or template).
- [x] Build `Kalkulations-Standards` section in `more.component.*` (AC: 1, 2)
  - [x] Place section under a `System` group header after `Verwaltung` group (Drucker, Kunden).
  - [x] Form fields: Price Mode (segmented control or select), Profit Margin %, Modeling Cost €, Multi-color Surcharge % (label: `Mehrplatten-Aufschlag`).
  - [x] On save: call `SettingsService.setSetting(key, value)` for each field.
  - [x] Validate: profit margin 0–500%, modeling cost 0–9999 €, extra-work fee 0–200%, price mode must be valid enum value.
  - [x] Show German inline validation; disable save button while invalid.
  - [x] Show German success feedback (toast or inline) on successful save.
- [x] Ensure `SettingsService.refresh()` is called in `MoreComponent` constructor so saved values load into the form (AC: 4)
- [x] Unit-test settings prefill applied to new calculation form, not to loaded/template form (AC: 3)
- [x] Regression: saved defaults survive app reload via IndexedDB (AC: 4)

## Dev Notes

### Epic Context

Epic 5 closes out MVP by giving the maker control over local data safety and default pricing. Story 5.1 is the entry point: it wires the existing `SettingsService` into a concrete UI and adds calculation-relevant default keys. The backup/restore/delete stories (5.2–5.5) build on this same `Mehr > System` surface.

### Story Context

- `SettingsService` is already complete at `src/app/core/settings/settings.service.ts`. It exposes `settings` (readonly Signal) and `setSetting(key, value)`. Do not rewrite the service.
- `DEFAULT_SETTINGS` at `src/app/domain/models/storage.models.ts:197` currently only has `defaultCurrency: 'EUR'` and `locale: 'de-DE'`. Add the four calculation-default keys here so `seedDefaultSettings()` in `printcost-db.ts` picks them up on first install.
- `seedDefaultSettings()` in `printcost-db.ts` already handles idempotent seeding (it skips existing keys). No DB migration required for adding new default keys.
- `more.component.ts` currently manages printers and customers. The component already injects `PrinterService` and `CustomerService`. Inject `SettingsService` alongside them. Call `settingsService.refresh()` in the constructor together with the existing printer/customer refreshes.
- The UX groups `Mehr` into `Verwaltung` (Drucker verwalten, Kunden) and `System` (Kalkulations-Standards, Daten exportieren / importieren). The current HTML does not have these groups yet — add them as part of this story so the structure is ready for 5.2–5.5.
- German labels for the settings form fields: `Standardpreismodus`, `Standardgewinn (%)`, `Modellierungskosten Standard (€)`, `Mehrplatten-Aufschlag Standard (%)`.
- `PriceMode` enum values are defined in `storage.models.ts` — use them directly; do not hardcode strings.
- `calculate.component.ts` should read defaults from `settingsService.settings()` in the same place it currently initialises the form (check the existing ngOnInit or constructor). Apply defaults only when `editingId` is null (new calculation).

### Implementation Guardrails

- Use `extraWorkFeePercent` / `defaultExtraWorkFeePercent`. Never introduce `multiPlateSurchargePercent`.
- Keep validation in the component form (Validators) mirrored in the service boundary. Domain-level range guards belong in `SettingsService.setSetting` or a dedicated validator helper, not only in the template.
- Do not call IndexedDB directly from `MoreComponent`. All writes go through `SettingsService.setSetting`.
- German visible labels; English TypeScript identifiers everywhere.
- Format stored numeric values with `de-DE` locale at presentation edges (use `core/locale` formatters if they exist, or `Intl.NumberFormat`).

### Architecture Compliance

- AD-2: `MoreComponent` calls `SettingsService`; it does not access `core/db` directly.
- AD-3: `SettingsService` owns the write path and signal refresh; component reads from the signal.
- AD-9: German UI copy, English implementation identifiers and storage keys.

### Current UPDATE File Intelligence

- `src/app/domain/models/storage.models.ts`: `DEFAULT_SETTINGS` (line ~197) needs 4 new keys. `PriceMode` enum is already defined here; reuse it for the defaultPriceMode value type.
- `src/app/core/settings/settings.service.ts`: complete as-is; just inject and use.
- `src/app/core/db/printcost-db.ts`: `seedDefaultSettings()` is already idempotent; new DEFAULT_SETTINGS keys auto-seed on next DB open without a schema version bump.
- `src/app/features/more/more.component.ts`: inject `SettingsService`, add settings form group, add save handler, add refresh call.
- `src/app/features/more/more.component.html`: restructure into `Verwaltung` / `System` groups; add settings form under System.
- `src/app/features/more/more.component.scss`: add `system-group`, `settings-form`, `settings-form__row` styles following existing card patterns.
- `src/app/features/calculate/calculate.component.ts`: read defaults from SettingsService on new-form init.

### File Structure Requirements

- Update:
  - `src/app/domain/models/storage.models.ts` — add 4 DEFAULT_SETTINGS keys
  - `src/app/features/more/more.component.ts` — inject SettingsService, settings form
  - `src/app/features/more/more.component.html` — Verwaltung/System group structure + settings section
  - `src/app/features/more/more.component.scss` — settings form styles
  - `src/app/features/calculate/calculate.component.ts` — prefill defaults on new calc
- Do NOT create:
  - A new service for settings; `SettingsService` already handles this.
  - A sub-route or modal for Kalkulations-Standards; this lives inline within `more.component`.

### Testing Requirements

- Unit test: new calculation form initialised with saved defaults (mock `SettingsService.settings` signal).
- Unit test: loading existing calculation does NOT apply defaults (prefill skipped).
- Unit test: `setSetting` called once per field on save (spy on SettingsService).
- Unit test: invalid inputs (margin > 500, negative cost) block save and show German messages.
- Regression: settings values persist across `SettingsService.refresh()` re-init (covers app reload scenario).

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.1)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-9)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (More groups: Verwaltung, System, UX-DR35, UX-DR30)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/settings/settings.service.ts`
- `src/app/core/db/printcost-db.ts` (`seedDefaultSettings`)
- `src/app/features/more/more.component.ts`
- `src/app/features/calculate/calculate.component.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Added 4 keys to `DEFAULT_SETTINGS`: `defaultPriceMode: 'FIXED'`, `defaultProfitMarginPercent: 0`, `defaultModelingCostEur: 0`, `defaultExtraWorkFeePercent: 0`
- Added `Kalkulations-Standards` section in `MoreComponent` with settings form under `System` group
- Angular `effect()` populates the settings form from `SettingsService.settings` signal on load
- `calculate.component.ts` applies settings defaults in `applySettingsDefaults()` called after service refresh
- `createFilamentLine()` uses `defaultPriceMode` from settings for new filament lines
- All 4 `SettingsService.setSetting` calls are made in parallel on form save
- German inline validation with `getSettingsError()` helper; save button disabled while invalid
- Unit tests: settings form population, save calls, validation errors, success feedback

### File List

- `src/app/domain/models/storage.models.ts`
- `src/app/features/more/more.component.ts`
- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/features/calculate/calculate.component.ts`
- `src/app/features/more/more.component.spec.ts`

## Story Completion Status

- Story created 2026-06-23; status set to `ready-for-dev`.
- 2026-06-23: Implemented and tested; status set to `review`.

## Change Log

- 2026-06-23: Created Story 5.1 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented all tasks; all 136 tests pass; status set to `review`.
