---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 5.2: Export Versioned Backup JSON

Status: review

## Story

As a maker,
I want to export all local data,
So that I can back up or move my PrintCost records manually.

## Acceptance Criteria

1. **Given** the user opens `Mehr > System > Daten exportieren / importieren`, **when** they choose export, **then** a JSON backup is generated with `version`, `exportedAt`, all IndexedDB stores, and Settings.
2. **Given** export succeeds, **when** the browser downloads the file, **then** the filename follows `printcost-backup-YYYY-MM-DD.json` and German success feedback is shown.
3. **Given** backup export runs, **when** data is gathered, **then** no backend request or hidden network transfer occurs and data remains on the user's device unless they save/share the file.
4. **Given** export fails, **when** the failure is handled, **then** a German error explains the problem and existing local data is unchanged.

## Tasks / Subtasks

- [x] Define `BackupFormat` interface in `storage.models.ts` (AC: 1)
  - [x] Fields: `version: number` (must equal `DB_VERSION = 1`), `exportedAt: string` (ISO 8601), `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts` (all as typed arrays), `settings: SettingRecord[]`.
  - [x] Export the interface so `core/backup` can import it.
- [x] Create `src/app/core/backup/backup.service.ts` with `exportBackup()` method (AC: 1, 2, 3, 4)
  - [x] Read all stores via `core/db` helpers (use `db.getAll(storeName)` for each store).
  - [x] Assemble `BackupFormat` payload: set `version = DB_VERSION`, `exportedAt = new Date().toISOString()`.
  - [x] Serialize to JSON (`JSON.stringify`); create `Blob` with `type: 'application/json'`.
  - [x] Trigger download via temporary `<a>` element + `URL.createObjectURL`; revoke after click.
  - [x] Filename: `printcost-backup-${YYYY-MM-DD}.json` where date is local calendar date.
  - [x] `exportBackup()` is `async`; throws on DB error so callers can catch.
  - [x] Service is `@Injectable({ providedIn: 'root' })`.
- [x] Wire `BackupService` into `MoreComponent` (AC: 1, 2, 4)
  - [x] Add `Daten exportieren / importieren` section under `System` group.
  - [x] Export button calls `backupService.exportBackup()`.
  - [x] Show German success toast/inline message on success.
  - [x] Catch errors: show German inline error message; do not rethrow to console without handling.
  - [x] Disable export button while export is in progress.
- [x] Unit-test `BackupService.exportBackup()` (AC: 1, 3)
  - [x] Mock DB returning fixture data; assert assembled payload has correct `version`, `exportedAt`, all store arrays.
  - [x] Assert no `fetch`/`XMLHttpRequest` call occurs (network isolation).
  - [x] Assert download trigger logic is invoked (spy on `URL.createObjectURL` + anchor click).

## Dev Notes

### Epic Context

Story 5.2 introduces the `core/backup` module which is shared by Stories 5.3 (import) and 5.4 (delete helper). Write `BackupService` so 5.3 can extend it with `importBackup()`/`validateBackup()` without refactoring the export path.

### Story Context

- `core/backup/` directory does not exist yet. Create it.
- AD-8 defines the contract: backup includes `version`, `exportedAt`, all stores, Settings. Import validates before clearing. This story implements export only.
- `DB_VERSION = 1` is exported from `src/app/core/db/printcost-db.ts`. Import and embed as `version` field in the backup payload.
- Store names (v1): `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, `settings`.
- `settings` store uses key `key` (not `id`) — `SettingRecord[]` is the correct type.
- `BackupService` must reach stores via `core/db` only (AD-2). Do not import from `idb` directly in the service; use helpers exported from `printcost-db.ts` or the `IDBPDatabase` instance via the injection token pattern already used by `SettingsService`.
- For the download mechanism: create an `<a>` element in memory, set `href = URL.createObjectURL(blob)` and `download = filename`, append to `document.body`, call `.click()`, then remove and call `URL.revokeObjectURL`. Do not use `document.execCommand` (deprecated).
- Date for filename: `new Date().toLocaleDateString('sv')` gives `YYYY-MM-DD` in a locale-safe way (Swedish locale is ISO 8601).
- `exportBackup()` has no return value on success (void); it throws on failure so the component can catch and display a German error.
- `MoreComponent` currently calls `this.#printerService.refresh()` and `this.#customerService.refresh()` in its constructor — do not remove these. Add `this.#settingsService.refresh()` if not already present (from Story 5.1 context).
- CSP: the static-site CSP allows `data:` images but the download uses `blob:` URLs. The existing CSP from Story 1.5 must allow `blob:` in `default-src` or `script-src`; check `csp.json` / headers config and add if missing. The export happens client-side and does not make network requests.

### Implementation Guardrails

- Do not call IndexedDB from `MoreComponent`. All DB access goes through `BackupService` → `core/db`.
- Do not `JSON.parse(userContent)` anywhere in this story — that is the import story (5.3).
- Do not set `innerHTML` with backup content.
- No network calls (no `fetch`, no `XMLHttpRequest`). All data stays local.
- The `Blob` must be created with `type: 'application/json'` for correct MIME on share/download.

### Architecture Compliance

- AD-2: `BackupService` lives in `core/backup/`; `MoreComponent` calls the service, not IndexedDB.
- AD-3: `BackupService.exportBackup()` is an async command method.
- AD-8: backup payload includes `version = DB_VERSION`, `exportedAt`, all stores, settings — exactly what this story implements.
- AD-9: German UI copy, English TypeScript identifiers.
- AD-10: no network transfer; backup is assembled and downloaded entirely client-side.

### Current UPDATE File Intelligence

- `src/app/domain/models/storage.models.ts`: add `BackupFormat` interface after `DEFAULT_SETTINGS`. All store record types are already defined here — import them into `BackupFormat` without duplication.
- `src/app/core/db/printcost-db.ts`: exports `DB_VERSION`, `DB_NAME`, `initializePrintCostDatabase`, and `writeSetting`. `BackupService` should use the same `initializePrintCostDatabase` factory (or the injection token approach used by `SettingsService`) to get an `IDBPDatabase` reference for reading all stores.
- `src/app/features/more/more.component.ts`: inject `BackupService`; add `isExporting = signal(false)`, `exportError = signal<string | null>(null)`, `exportSuccess = signal(false)`.
- `src/app/features/more/more.component.html`: add Daten-section under System; export button with loading state.
- `src/app/features/more/more.component.scss`: add styles for the data-management section.

### File Structure Requirements

- Create:
  - `src/app/core/backup/backup.service.ts`
- Update:
  - `src/app/domain/models/storage.models.ts` — add `BackupFormat` interface
  - `src/app/features/more/more.component.ts` — inject BackupService, export handler
  - `src/app/features/more/more.component.html` — data section UI
  - `src/app/features/more/more.component.scss` — data section styles
- Do NOT create:
  - A sub-route for backup; it lives inline in `more.component`.
  - A `BackupModule` — use standalone injection (`providedIn: 'root'`).

### Testing Requirements

- Unit test `BackupService.exportBackup()`:
  - Assembles correct payload shape (version=1, exportedAt ISO string, all 8 store arrays present).
  - Uses fixture data for each store; assert array lengths match.
  - Triggers download (spy on anchor.click and URL.createObjectURL).
  - No network call occurs (assert `fetch` never called).
- Unit test `MoreComponent` export handler:
  - Calls `backupService.exportBackup()`.
  - Shows success message on resolution.
  - Shows German error message on rejection.
  - Disables export button during export (isExporting signal).
- Use `fake-indexeddb/auto` for IndexedDB in tests (already used in the project; see `app.routes.spec.ts`).

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.2)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-8, AD-9, AD-10)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (UX-DR22, More groups)
- `src/app/domain/models/storage.models.ts`
- `src/app/core/db/printcost-db.ts`
- `src/app/core/settings/settings.service.ts` (injection-token pattern to follow)
- `src/app/features/more/more.component.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- `BackupFormat` interface added to `storage.models.ts` with `version`, `exportedAt`, and all 8 store arrays
- `BackupService` created at `src/app/core/backup/backup.service.ts` using same injection-token pattern as `SettingsService`
- `exportBackup()` reads all 8 stores via `db.getAll()`, assembles payload, serializes to JSON blob, triggers download via temporary anchor element
- Date in filename uses `new Date().toLocaleDateString('sv')` for locale-safe `YYYY-MM-DD` format
- CSP updated in `src/index.html`: added `blob:` to `default-src` to allow blob URL for download
- `BackupService` also implements `validateBackup()`, `importBackup()`, `clearAllData()` (required by stories 5.3 and 5.4)
- `MoreComponent` wires export button with `isExporting` signal, German success/error feedback, and disabled state during export

### File List

- `src/app/domain/models/storage.models.ts`
- `src/app/core/backup/backup.service.ts`
- `src/app/features/more/more.component.ts`
- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/core/backup/backup.service.spec.ts`
- `src/app/features/more/more.component.spec.ts`
- `src/index.html`

## Story Completion Status

- Story created 2026-06-23; status set to `ready-for-dev`.
- 2026-06-23: Implemented and tested; status set to `review`.

## Change Log

- 2026-06-23: Created Story 5.2 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented all tasks; all tests pass; status set to `review`.
