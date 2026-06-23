---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 5.4: Delete All Local Data Safely

Status: review

## Story

As a maker,
I want to delete all local data with clear warnings,
So that I can reset the app intentionally.

## Acceptance Criteria

1. **Given** the user opens `Mehr > System`, **when** they choose full local data deletion, **then** a German confirmation explains that all local PrintCost data will be removed and recommends exporting a Backup first.
2. **Given** the confirmation is visible, **when** the user cancels, **then** no local data is changed.
3. **Given** the user explicitly confirms deletion, **when** deletion completes, **then** all app stores are cleared and default Settings are re-seeded.
4. **Given** deletion completes, **when** the app returns to primary surfaces, **then** first-launch empty states appear for missing Printer Profiles, Filaments, and Inventory and German feedback confirms reset.

## Tasks / Subtasks

- [x] Add `clearAllData(): Promise<void>` to `BackupService` (or `core/db` helper) (AC: 3)
  - [x] Clear all 8 stores: `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, `settings`.
  - [x] After clearing, call `seedDefaultSettings(db)` to restore default settings keys.
  - [x] Operation is atomic per-store (each `db.clear(storeName)` is awaited sequentially or in parallel — parallel is fine as IndexedDB store clears are independent).
  - [x] The method should NOT call `deleteDB()` — clearing stores in-place preserves the DB handle and avoids re-init race conditions.
- [x] Wire delete confirmation flow in `MoreComponent` (AC: 1, 2, 4)
  - [x] Show `Alle Daten löschen` action under `System` group.
  - [x] On click: open confirmation inline block or `<dialog>` (max one modal level, consistent with import confirmation pattern from Story 5.3).
  - [x] German confirmation copy: `Alle lokalen PrintCost-Daten werden unwiderruflich gelöscht. Bitte vorher ein Backup exportieren.`; primary action: `Alles löschen`; cancel: `Abbrechen`.
  - [x] On cancel: close without mutation (AC: 2).
  - [x] On confirm: call `backupService.clearAllData()` (or the helper); then refresh all service Signals; show German success feedback.
- [x] Refresh all service Signals after successful deletion (AC: 4)
  - [x] Same refresh pattern as Story 5.3 post-import: call `refresh()` on all services (`PrinterService`, `FilamentService`, `CalculationService`, `CustomerService`, `SettingsService`, `TemplateService`, and any others with Signal state).
  - [x] Empty states in `Filamente`, `Bestand`, and `Kalkulation` depend on services returning empty arrays — this is automatic once Signals are refreshed.
- [x] German success feedback after deletion (AC: 4)
  - [x] Toast or inline message: `Alle Daten wurden gelöscht. Die App wurde zurückgesetzt.`
  - [x] Optionally navigate to `/calculate` so the user sees empty states immediately (discuss with UX; either staying or navigating is acceptable).
- [x] Unit-test `clearAllData()` (AC: 3)
  - [x] All 8 stores are cleared.
  - [x] `seedDefaultSettings` called after clearing.
  - [x] `deleteDB` is NOT called.
- [x] Unit-test `MoreComponent` deletion flow (AC: 1, 2, 4)
  - [x] Cancel prevents `clearAllData` call.
  - [x] Confirm calls `clearAllData` and all `refresh()` methods.
  - [x] German success feedback appears after completion.

## Dev Notes

### Epic Context

Story 5.4 is the last destructive data operation in Epic 5. It reuses the `BackupService` pattern from 5.2/5.3 and the same confirmation UX pattern. The dev agent should align the delete confirmation UI visually with the import confirmation (5.3) so both destructive actions feel consistent.

### Story Context

- `clearAllData()` should live in `BackupService` alongside `exportBackup` / `importBackup`. This keeps all destructive data operations in one service.
- Do NOT call `deleteDB(DB_NAME)` from `idb`. Deleting the database requires a page reload to re-open a fresh connection, which breaks Angular's DI cycle. Instead, clear each store in-place using `db.clear(storeName)` and re-seed settings.
- `seedDefaultSettings(db)` is already exported from `printcost-db.ts`. Call it after all clears to restore the minimal settings keys so the app boots normally after reset.
- After clearing, refreshing service Signals gives empty arrays to all feature components, which then show their first-launch empty states (these already exist from earlier epics: no-printer prompt in Calculate, no-filament state in Filamente, empty inventory in Bestand).
- The UX groups in `Mehr`: the delete action sits under `System`, below the backup/import section. Visual treatment: use a danger/destructive button variant (e.g., red or outlined with caution token) — check `shared/ui` for existing danger-action patterns or use a local SCSS modifier `.delete-button--danger`.
- German microcopy (UX-DR26): data deletion confirmation must recommend backup first. The delete button itself can be labeled `Alle Daten löschen`.
- Signal refresh after delete is identical to the post-import refresh in Story 5.3. Consider extracting a private `refreshAllServices()` method in `MoreComponent` to avoid duplication if both stories are implemented in the same component.

### Implementation Guardrails

- Do NOT call `deleteDB()`. Clear stores in-place only.
- No data is mutated until the user explicitly confirms (AC: 2).
- Re-seed settings after clear so the app does not boot with an empty settings store (which would break locale formatting).
- German UI copy throughout. No English error/success messages shown to user.
- Keep modal stack at one level (consistent with Story 5.3 confirmation).

### Architecture Compliance

- AD-2: `BackupService` (in `core/backup`) handles the clear; `MoreComponent` only calls the service.
- AD-3: `clearAllData()` is an async command; service owns the write path.
- AD-9: German UI copy, English TypeScript identifiers.
- AD-10: local-only operation; no network.

### Current UPDATE File Intelligence

- `src/app/core/backup/backup.service.ts` (created in Story 5.2, extended in 5.3): add `clearAllData()` method. Use the same `initializePrintCostDatabase` factory to obtain the `IDBPDatabase` handle.
- `src/app/core/db/printcost-db.ts`: `seedDefaultSettings` is already exported — import it into `BackupService` for post-clear re-seeding. Also confirm `deleteDB` is NOT called anywhere in the delete path.
- `src/app/features/more/more.component.ts`: add `isDeletingData = signal(false)`, `deleteDataError = signal<string | null>(null)`, `showDeleteConfirm = signal(false)`, and the confirm/cancel handlers.
- `src/app/features/more/more.component.html`: add delete action under System section. The confirmation block can reuse the same inline pattern as the import confirmation from Story 5.3, or use a separate `<dialog>` — keep consistent.
- `src/app/features/more/more.component.scss`: add `.delete-button--danger` modifier or reuse an existing danger token from the design system.

### File Structure Requirements

- Update:
  - `src/app/core/backup/backup.service.ts` — add `clearAllData()`
  - `src/app/features/more/more.component.ts` — delete confirmation state + handlers
  - `src/app/features/more/more.component.html` — delete action and confirmation UI
  - `src/app/features/more/more.component.scss` — danger button styles if not already present
- Do NOT create:
  - A separate delete service; `clearAllData()` belongs in `BackupService`.
  - A sub-route; the deletion flow stays inline in `more.component`.

### Testing Requirements

- Unit tests for `BackupService.clearAllData()`:
  - Calls `db.clear(storeName)` for all 8 stores.
  - Does NOT call `deleteDB`.
  - Calls `seedDefaultSettings(db)` after clearing.
- Component tests for `MoreComponent` delete flow:
  - Delete button triggers confirmation open.
  - Cancel: `clearAllData` not called.
  - Confirm: `clearAllData` called, then all `refresh()` methods called.
  - German success message visible after confirm.
  - German error message visible if `clearAllData` throws.
- Use `fake-indexeddb/auto` for DB interactions.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.4)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-2, AD-3, AD-9, AD-10)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (UX-DR26: data deletion confirmation and backup recommendation)
- `src/app/core/backup/backup.service.ts` (from Stories 5.2, 5.3)
- `src/app/core/db/printcost-db.ts` (`seedDefaultSettings`, `deleteDB` import to avoid)
- `src/app/features/more/more.component.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- `clearAllData()` added to `BackupService`: clears all 8 stores in parallel using `Promise.all`, then calls `seedDefaultSettings(db)` to restore default keys; `deleteDB()` is never called
- `MoreComponent` wires `showDeleteConfirm`, `isDeletingData`, `deleteDataError`, `deleteDataSuccess` signals for the deletion flow
- Confirmation overlay uses CSS `.confirm-backdrop` + `.confirm-dialog` (same pattern as import confirmation) with German copy: `Alle lokalen PrintCost-Daten werden unwiderruflich gelöscht. Bitte vorher ein Backup exportieren.`
- `confirmDeleteAllData()` calls `clearAllData()` then `refreshAllServices()` (shared private method); success message: `Alle Daten wurden gelöscht. Die App wurde zurückgesetzt.`
- Cancel path just sets `showDeleteConfirm` to false without mutation
- Danger button uses `.data-actions__btn--danger` with `background: #aa2f2f`

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

- 2026-06-23: Created Story 5.4 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented all tasks; all tests pass; status set to `review`.
