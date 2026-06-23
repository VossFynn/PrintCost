---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 5.3: Validate and Import Backup With Replace Strategy

Status: review

## Story

As a maker,
I want to import a backup safely,
So that I can restore data without corrupting current records.

## Acceptance Criteria

1. **Given** the user chooses import, **when** the native file picker opens, **then** the user can select a JSON backup file and the app reads it without sending it to a backend.
2. **Given** a backup file is selected, **when** validation runs, **then** schema version, required top-level fields, all stores, and Settings are validated before any local data is cleared.
3. **Given** validation fails, **when** import stops, **then** no current IndexedDB data is mutated and a German error explains that the backup is invalid.
4. **Given** validation succeeds, **when** the user sees the confirmation dialog, **then** German copy explains that import replaces local data (`Daten werden ersetzt. Vorher Backup exportieren?`) and recommends exporting a backup first.
5. **Given** the user confirms import, **when** replacement runs, **then** all app stores are replaced with backup data and the app refreshes service Signals from the imported data.
6. **Given** the user cancels the confirmation, **when** the dialog closes, **then** no local data is changed.

## Tasks / Subtasks

- [x] Add `validateBackup(payload: unknown): BackupFormat` and `importBackup(backup: BackupFormat): Promise<void>` to `BackupService` (AC: 2, 3, 5)
  - [x] `validateBackup`: assert `version === DB_VERSION`, presence of `exportedAt` (string), and all 8 store arrays (`printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, `settings`). Throw with a descriptive English message on failure.
  - [x] `importBackup`: inside a single transaction sequence — clear each store, then populate from backup arrays using `db.put`. Clear and repopulate `settings` store using `SettingRecord` key path (`key` not `id`).
  - [x] After all stores replaced, call `seedDefaultSettings(db)` to ensure any keys absent from the backup get default values.
  - [x] Do NOT clear any data before `validateBackup` passes (AC: 3).
- [x] Wire file picker + validation + confirmation in `MoreComponent` (AC: 1, 2, 3, 4, 6)
  - [x] Hidden `<input type="file" accept=".json,application/json">` triggered by import button click.
  - [x] On file select: read via `FileReader.readAsText`; parse JSON; call `backupService.validateBackup()`.
  - [x] On validation failure: show German error inline; do not open confirmation.
  - [x] On validation success: open confirmation dialog/section (inline or `<dialog>` element — max one modal level per UX rule).
  - [x] Confirmation text (German): `Daten werden ersetzt. Vorher Backup exportieren?`; primary action: `Importieren`; cancel action: `Abbrechen`.
  - [x] On confirm: call `backupService.importBackup(validatedBackup)`; then refresh all active services.
  - [x] On cancel: close dialog, no mutation.
- [x] Refresh all service Signals after successful import (AC: 5)
  - [x] Call `refresh()` on all injected services in `MoreComponent` after `importBackup()` resolves: `printerService`, `customerService`, `settingsService`, plus any other services injected by any feature component that holds Signal state (`filamentService`, `calculationService`, `inventoryService`, `templateService` etc.).
  - [x] Use `await Promise.all([...refreshes])` pattern.
  - [x] Navigate to `/more` or stay on page; show German success feedback.
- [x] Unit-test `validateBackup()` (AC: 2, 3)
  - [x] Rejects missing `version` field.
  - [x] Rejects wrong version number.
  - [x] Rejects missing store array.
  - [x] Accepts a valid `BackupFormat` payload and returns typed object.
- [x] Unit-test `importBackup()` (AC: 5)
  - [x] All stores are cleared before repopulation.
  - [x] All store arrays from backup are inserted.
  - [x] `settings` store receives items with `key`/`value` shape (not `id`).
  - [x] `seedDefaultSettings` called after import.
  - [x] No mutation occurs if validation was not called first (document: caller is responsible for ordering).
- [x] Unit-test `MoreComponent` import flow (AC: 1–6)
  - [x] File picker hidden; import button triggers click.
  - [x] Invalid JSON shows German error without opening dialog.
  - [x] Cancel on dialog prevents `importBackup` call.
  - [x] Confirm on dialog calls `importBackup` and then all `refresh()` methods.

## Dev Notes

### Epic Context

Story 5.3 depends on Story 5.2 (`BackupService` + `BackupFormat`). The dev agent must verify 5.2 is merged/complete before starting 5.3, or implement both services in sequence in the same work session.

### Story Context

- `BackupService` was created in Story 5.2. This story extends it with `validateBackup` and `importBackup`. Do not duplicate `exportBackup` logic.
- Replace-only strategy (no merge): MVP explicitly forbids merge import (architecture handoff: "Do not implement merge import for MVP").
- Validation must happen entirely before ANY mutation. The guard sequence is: parse JSON → validate structure → open confirmation dialog → user confirms → mutate. Never clear a store speculatively.
- `FileReader.readAsText` is the correct API for reading the file client-side. Do not use `file.text()` unless you verify browser compatibility in the target Angular 22 / PWA context — `FileReader` is universally available.
- The confirmation UI: use a native `<dialog>` element or an inline conditional block that expands. UX rule: max one modal stack level. A `<dialog>` opened from `MoreComponent` is acceptable. Do not open a nested second modal.
- German microcopy (from EXPERIENCE.md): `Daten werden ersetzt. Vorher Backup exportieren?` for the warning text.
- After `importBackup()` succeeds, every service with in-memory Signal state must refresh. The services that need refreshing are: `PrinterService`, `FilamentService`, `CalculationService`, `CustomerService`, `SettingsService`, `TemplateService`, `InventoryService` (if it has a `refresh()` method), and any other service with a `refresh()`. Inject them into `MoreComponent` for the post-import refresh, or call a global refresh event if such a bus exists. Check which services have `refresh()` methods in `src/app/core/`.
- `seedDefaultSettings(db)` is already exported from `printcost-db.ts` — call it after populating the settings store to ensure any keys absent in older backups get defaults.
- The `settings` store uses `{ keyPath: 'key' }`, not `{ keyPath: 'id' }`. When clearing and repopulating settings, use the correct `SettingRecord` shape (`{ key: string, value: unknown }`).
- CSP: file reading is local — no network involved. Blob URL for download is 5.2's concern; 5.3 uses only `FileReader`.

### Implementation Guardrails

- NEVER clear any IndexedDB store before `validateBackup` returns successfully.
- Do not render backup file content through `innerHTML`.
- Do not send the backup file to any external URL.
- Do not use merge/partial import. Full replace only.
- Do not skip the user confirmation step even during automated tests — test the cancel path explicitly.
- The `<input type="file">` element must be hidden in the DOM; only the styled button should be visible.

### Architecture Compliance

- AD-2: `BackupService` owns all store access via `core/db`. `MoreComponent` only calls `backupService.importBackup()`.
- AD-3: `importBackup()` is an async command; it clears/repopulates via `core/db` then calling callers are responsible for signal refresh.
- AD-7: After replace import, all Signal state is refreshed so the app renders imported data immediately.
- AD-8: Validate `version`, `exportedAt`, all stores, Settings before clearing data — exactly what this story implements.
- AD-9: German UI copy, English TypeScript identifiers.
- AD-10: no network transfer; FileReader is local.

### Current UPDATE File Intelligence

- `src/app/core/backup/backup.service.ts` (created in Story 5.2): add `validateBackup(unknown): BackupFormat` and `importBackup(BackupFormat): Promise<void>` methods.
- `src/app/core/db/printcost-db.ts`: `seedDefaultSettings` is already exported and called during DB init. Call it again after import to patch missing keys. Also check if `deleteDB` is used anywhere — `importBackup` does NOT call `deleteDB`; it clears stores in-place.
- `src/app/features/more/more.component.ts`: add hidden file input ref, validation state signals (`isImporting`, `importError`, `pendingBackup`, `showImportConfirm`), and methods for file-select handler, confirm, cancel.
- `src/app/features/more/more.component.html`: add file input, import button, validation error display, and confirmation dialog/block.
- The existing `more.component.html` uses `@if` / `@for` Angular 17+ control flow syntax — continue with that pattern.

### File Structure Requirements

- Update:
  - `src/app/core/backup/backup.service.ts` — add `validateBackup`, `importBackup`
  - `src/app/features/more/more.component.ts` — file picker logic, confirmation state, post-import refresh
  - `src/app/features/more/more.component.html` — import UI, confirmation dialog
  - `src/app/features/more/more.component.scss` — confirmation dialog styles if using `<dialog>`
- Do NOT create:
  - A sub-route for backup import; it stays inline in `more.component`.
  - A separate confirmation component; keep the modal stack at one level.

### Testing Requirements

- Unit tests for `validateBackup`:
  - Throws on `null`, `undefined`, non-object.
  - Throws when `version !== DB_VERSION`.
  - Throws when `exportedAt` is missing or non-string.
  - Throws when any of the 8 store arrays is missing.
  - Returns typed `BackupFormat` for a valid fixture payload.
- Unit tests for `importBackup`:
  - Clears all 8 stores before inserting (verify `db.clear(storeName)` called for each).
  - Inserts all records from fixture backup.
  - Calls `seedDefaultSettings` after insert.
  - `settings` records use `key` path (not `id`).
- Unit test: `importBackup` called ONLY after `validateBackup` passes (ordering test).
- Component tests:
  - Cancel on confirmation dialog: `importBackup` not called.
  - Invalid file: German error shown, no dialog opened.
  - Successful import: all `refresh()` methods called, success feedback shown.
- Use `fake-indexeddb/auto` for DB interactions.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.3)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-7, AD-8, AD-9, AD-10)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (UX-DR22: backup import confirmation, UX-DR34: deep flow / modal rules)
- `src/app/core/backup/backup.service.ts` (from Story 5.2)
- `src/app/domain/models/storage.models.ts` (`BackupFormat`, `SettingRecord`, `DB_VERSION`)
- `src/app/core/db/printcost-db.ts` (`seedDefaultSettings`)
- `src/app/features/more/more.component.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- `validateBackup()` added to `BackupService`: validates `version === DB_VERSION`, ISO `exportedAt`, and all 8 store arrays present; throws descriptive English messages on failure
- `importBackup()` added to `BackupService`: clears all stores in sequence, re-populates from backup arrays using per-store transactions, then calls `seedDefaultSettings()` to fill missing keys
- `MoreComponent` uses a hidden `<input type="file">` triggered by import button; `onImportFileChange()` handles `FileReader.readAsText` → JSON.parse → `validateBackup` → show confirmation overlay
- Confirmation overlay uses CSS `.confirm-backdrop` + `.confirm-dialog` pattern (consistent with printer delete dialog); text: `Daten werden ersetzt. Vorher Backup exportieren?`
- `confirmImport()` calls `importBackup()` then `refreshAllServices()` which refreshes all 7 services
- Cancel path sets `showImportConfirm` signal to false without any mutation
- `isImporting` signal disables the confirm button during operation; German success/error feedback via signals

### File List

- `src/app/core/backup/backup.service.ts`
- `src/app/features/more/more.component.ts`
- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/core/backup/backup.service.spec.ts`
- `src/app/features/more/more.component.spec.ts`

## Story Completion Status

- Story created 2026-06-23; status set to `ready-for-dev`.
- 2026-06-23: Implemented and tested; status set to `review`.

## Change Log

- 2026-06-23: Created Story 5.3 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented all tasks; all tests pass; status set to `review`.
