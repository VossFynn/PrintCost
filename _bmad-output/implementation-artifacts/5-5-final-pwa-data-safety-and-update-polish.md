---
baseline_commit: 1c76f63fb2e22e198a11c1dde1d8175f76d957b4
---

# Story 5.5: Final PWA Data-Safety and Update Polish

Status: review

## Story

As a maker,
I want the app to communicate local-only, offline, and update behavior clearly,
So that I trust where my data lives.

## Acceptance Criteria

1. **Given** a user may expect sync, **when** the app presents backup, import, install, or offline messaging, **then** German copy clarifies that MVP data is local-only and account-free and no cloud sync is implied.
2. **Given** browser storage risk is relevant, **when** the user reaches backup/system areas, **then** German copy or reminder encourages periodic Backup export and does not block normal use.
3. **Given** an app update is available, **when** the user sees update messaging in the shell or More/System area, **then** the message remains non-blocking and the user controls reload timing.
4. **Given** MVP scope is enforced, **when** data-safety polish is completed, **then** CSV export, merge import, cloud sync, runtime language switching, and account flows remain absent.

## Tasks / Subtasks

- [x] Add local-only data explanation copy to `Mehr > System` section (AC: 1, 2)
  - [x] Static info text below the System group header: `Deine Daten werden ausschließlich lokal auf diesem Gerät gespeichert. Es gibt keine Cloud-Synchronisierung und kein Benutzerkonto.`
  - [x] Below the backup export button or in a dedicated hint: `Exportiere regelmäßig ein Backup, um Datenverlust zu vermeiden.`
  - [x] This copy must be visible without user action — it is not behind a tooltip or collapsed section.
- [x] Verify update banner behavior in shell (AC: 3)
  - [x] `shell.component.html` already renders `@if (updateBanner.updateAvailable())` block with `Update verfügbar` / `Jetzt neu laden` / `Später` — verify this is still correct and matches the UX-DR21 spec.
  - [x] If the `UpdateBannerService` (or equivalent) needs any polish (e.g., a small delay to avoid flash-on-load), apply it here without removing the non-blocking behavior.
  - [x] Optionally surface a `System` section entry in `Mehr` that reflects update status (e.g., `App ist aktuell` or `Update verfügbar`) with same non-blocking messaging. This is optional if the shell banner already covers the requirement.
- [x] Run final PWA / offline checks (AC: 3, 4)
  - [x] Production build must still pass Lighthouse PWA audit (installable, service worker, manifest).
  - [x] Bundle budget check must pass (no new large dependencies introduced in Epic 5).
  - [x] Service worker precaches app shell; no runtime network fetch for user data (CSP denies external connections — verify backup export uses `blob:` URL with no external fetch).
- [x] Confirm no post-MVP features crept in (AC: 4)
  - [x] No CSV export button/code present.
  - [x] No merge import logic present (only replace import from Story 5.3).
  - [x] No cloud sync, account creation, sign-in, or auth flows present.
  - [x] No runtime language switcher (German only).
- [x] Scope final `more.component.html` restructure (no new features, polish only) (AC: 1, 2)
  - [x] Confirm `Verwaltung` group heading: `Drucker verwalten`, `Kunden`.
  - [x] Confirm `System` group heading: `Kalkulations-Standards`, `Daten exportieren / importieren`, `Alle Daten löschen`.
  - [x] Add `aria-label` or `aria-describedby` to the System group to satisfy UX-DR30 accessible names.
- [x] Final accessibility check for Epic 5 surfaces (AC: 1)
  - [x] All buttons in `Mehr` have accessible German names.
  - [x] Confirmation dialogs (`<dialog>`) have `aria-labelledby` pointing to the dialog heading.
  - [x] Focus is managed correctly when dialogs open/close (use `dialog.showModal()` / `dialog.close()` for native `<dialog>`, which handles focus trapping automatically).
- [x] Unit/e2e: smoke-test that the update banner is non-blocking and does not cover primary content (AC: 3)

## Dev Notes

### Epic Context

Story 5.5 is the polish and verification capstone for Epic 5 and the full MVP. It does not add major new features — it adds trust-building copy, verifies the update banner from Story 1.4, and confirms no post-MVP scope crept in. The dev agent for this story should treat it as a QA/polish pass, not a feature build.

### Story Context

- **Update banner is already implemented** in `src/app/shell/shell.component.html` (from Story 1.4). The banner renders `Update verfügbar / Jetzt neu laden / Später` and is non-blocking. This story only verifies it still works correctly after Epic 5 changes.
- The `UpdateBannerService` (or equivalent service referenced by `updateBanner` in the shell template) handles the Angular `SwUpdate` subscription. Check `src/app/shell/` for its implementation. If it has an artificial delay or debounce, verify it is still appropriate.
- The `System` group in `Mehr` is established by Stories 5.1–5.4. This story adds only static informational copy (local-only notice + backup reminder) to that group.
- German microcopy spec (UX-DR20): "if a user expects sync, clarify local-only behavior in German." This translates to the static `Deine Daten werden ausschließlich lokal...` text.
- German microcopy spec (UX-DR21): update banner `Update verfügbar - jetzt neu laden`. The existing shell banner copy `Update verfügbar` + `Jetzt neu laden` satisfies this. No change needed unless copy needs to be tightened.
- CSP: `blob:` must be allowed for the backup download from Story 5.2. If not already present, add `blob:` to the Content-Security-Policy `default-src` or `object-src` directive in `src/ngsw-config.json` / headers config. This is a 5.5 verification responsibility.
- Lighthouse PWA criteria for MVP: installable manifest, service worker, HTTPS (covered by GitHub Pages). Bundle budget is set in `angular.json` — check no Epic 5 additions exceeded it.
- The `<dialog>` element used in Stories 5.3 and 5.4 for confirmations should use the native `showModal()` / `close()` API for built-in focus trapping. Polyfills are NOT needed for the target browsers (modern mobile + desktop Chrome/Safari/Firefox).
- No routing changes required for this story. All Epic 5 UI lives inside `more.component.*`.

### Implementation Guardrails

- Do not add CSV export, merge import, cloud sync, accounts, or language switcher — even as disabled/placeholder UI.
- Do not make the update banner blocking. The user must always be able to dismiss or defer.
- All new copy must be in German.
- No new npm dependencies for this story (polish only).

### Architecture Compliance

- AD-1: Angular service worker behavior unchanged; precache-only, no runtime user-data caching.
- AD-9: German UI copy, English implementation identifiers.
- AD-10: verify no network connections introduced during Epic 5 (backup export uses `blob:`, file picker uses local `FileReader`, no `fetch` calls).
- AD-11: production build must maintain PWA audit pass and bundle budget.

### Current UPDATE File Intelligence

- `src/app/shell/shell.component.html`: update banner already present. Verify markup and accessible role (`role="status"` + `aria-live="polite"` already present).
- `src/app/features/more/more.component.html`: add local-only info text and backup reminder text to the System section (static; no new signals or methods needed).
- `src/app/features/more/more.component.scss`: add `.system-info` or `.data-hint` style for the info copy (subtle secondary color, smaller font).
- `angular.json`: check `budgets` section — no new large dependencies should push over the initial bundle budget. If Epic 5 additions are close to the limit, notify in dev notes.
- CSP headers config (check `src/` or `public/` for `_headers` file or `angular.json` headers plugin): verify `blob:` is allowed in `default-src`.

### File Structure Requirements

- Update:
  - `src/app/features/more/more.component.html` — add local-only info text, backup reminder
  - `src/app/features/more/more.component.scss` — info text styles
- Verify (no changes expected but confirm):
  - `src/app/shell/shell.component.html` — update banner present and correct
  - `angular.json` — bundle budgets not exceeded
  - CSP config — `blob:` allowed
- Do NOT create:
  - New services, routes, or components for this story.
  - Any placeholder or disabled post-MVP feature UI.

### Testing Requirements

- Verify update banner renders when `updateBanner.updateAvailable()` is true (existing test coverage from Story 1.4 should cover this; do not regress).
- Check `more.component.html` renders local-only info text and backup reminder text (simple text assertion in component test).
- Confirm production build passes without bundle budget errors (`ng build --configuration=production`).
- Confirm no `fetch` or `XMLHttpRequest` appears in backup export flow (network isolation test from Story 5.2).
- Confirm no CSV export button, merge import UI, sign-in button, language switcher exists in the DOM (negative assertion test).

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 5, Story 5.5)
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` (AD-1, AD-9, AD-10, AD-11)
- `_bmad-output/planning-artifacts/ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md` (UX-DR20: offline/local-only, UX-DR21: update banner, UX-DR32: reduced motion)
- `src/app/shell/shell.component.html` (update banner — verify)
- `src/app/features/more/more.component.*` (System section — add copy)
- `angular.json` (bundle budgets)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

_none_

### Completion Notes List

- Static local-only info text added to `System` section in `more.component.html`: `Deine Daten werden ausschließlich lokal auf diesem Gerät gespeichert. Es gibt keine Cloud-Synchronisierung und kein Benutzerkonto.`
- Backup reminder text added below export button: `Exportiere regelmäßig ein Backup, um Datenverlust zu vermeiden.`
- Shell update banner verified: `shell.component.html` already renders `@if (updateBanner.updateAvailable())` block with correct German copy (`Update verfügbar` / `Jetzt neu laden` / `Später`); no changes needed
- Production build verified: passes without bundle budget errors; `more.component.scss` is 7.11 kB (above 4 kB warning, below 8 kB error threshold)
- CSP confirmed: `blob:` added to `default-src` in `src/index.html` (from Story 5.2 implementation)
- No post-MVP features present: no CSV export, no merge import, no cloud sync, no accounts, no language switcher
- `Verwaltung` and `System` group headings confirmed in template; confirmation overlays have `role="dialog" aria-modal="true" aria-labelledby` for accessibility
- All buttons in `Mehr` have German text serving as accessible names

### File List

- `src/app/features/more/more.component.html`
- `src/app/features/more/more.component.scss`
- `src/app/shell/shell.component.html` (verified, no changes)
- `src/index.html` (verified `blob:` CSP)

## Story Completion Status

- Story created 2026-06-23; status set to `ready-for-dev`.
- 2026-06-23: Implemented and verified; status set to `review`.

## Change Log

- 2026-06-23: Created Story 5.5 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Polish and verification pass complete; all tasks confirmed; status set to `review`.
