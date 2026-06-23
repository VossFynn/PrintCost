---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
extractionStatus: confirmed
inputDocuments:
  - ../../prd.md
  - ../specs/spec-printcost/SPEC.md
  - ../specs/spec-printcost/domain-contract.md
  - architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md
  - architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md
  - ux-designs/ux-PrintCost-2026-06-23/DESIGN.md
  - ux-designs/ux-PrintCost-2026-06-23/EXPERIENCE.md
---

# PrintCost - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for PrintCost, decomposing the requirements from the PRD, SPEC, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create and edit Printer Profiles with validated name, power draw, purchase price, lifetime hours, electricity price, annual base fee, and note fields.

FR2: Deleting a Printer Profile used by saved Calculations soft-deletes the profile, hides it from new selection, and preserves historical `printerSnapshot` data.

FR3: Users can create and edit Filaments with validated name, material type, color, manufacturer, roll weight, remaining grams, purchase history, multi-color surcharge, and optional fixed price.

FR4: The system calculates Filament price basis per line using `WEIGHTED_AVERAGE`, `PAID`, or `FIXED`, updates weighted average when purchase history changes, and stores selected Price Mode on each Calculation line.

FR5: Users can enter Calculation inputs for project, printer, optional customer, one or more Filament lines, grams, Price Mode, fixed price when required, print minutes, quantity, parts per plate, extra work fee, model state, modeling cost, and profit margin.

FR6: The system calculates live cost breakdown and rounded price using total `printMinutes` and total `gramsUsed`; plate count does not multiply material or time costs and only enables `extraWorkFeePercent`.

FR7: Saving a Calculation stores printer snapshot, filament snapshots, selected Price Modes, calculated per-gram prices, inputs, and computed outputs without deducting Filament stock.

FR8: Users can view saved Calculations under `Bestand > Drucke`, filter print inventory by status, see project/count/sold/price/date data, and use `+1` or equivalent print occurrence action.

FR9: Users can record Sales and Gifts against saved Calculations with optional Customer, sale price, gift flag, date, and note; Sales update sold/remaining counts but never deduct Filament.

FR10: Users can create manual Part records under `Bestand > Teile` with name, optional linked Calculation, quantity, note, and inline quantity adjustment.

FR11: Users can create, edit, soft-delete, and select optional local Customers with validated name, contact, and note fields; Calculation and Sale can have no Customer.

FR12: Users can manage global defaults for Price Mode, profit margin, modeling cost, and multi-color surcharge; defaults apply to future records and remain overrideable.

FR13: Users can save a Calculation as a Template and load a Template into the Calculation form while all prefilled fields remain editable.

FR14: Users can export all local data as versioned `printcost-backup-YYYY-MM-DD.json` containing schema version, export timestamp, all stores, and Settings.

FR15: Users can import Backup JSON through schema validation and German confirmation; MVP import uses replace-all strategy and merge import is deferred.

### NonFunctional Requirements

NFR1: Time to Interactive must be under 3 seconds on a typical mobile 4G connection.

NFR2: Calculation result updates must complete within 100 ms after input changes.

NFR3: Initial gzipped bundle size should stay under 200 KB.

NFR4: Typical IndexedDB read/write operations should complete within 50 ms.

NFR5: Production build must use lazy-loaded feature routes.

NFR6: UI must be mobile-first and fully usable at 320 px viewport width.

NFR7: Interactive controls must meet WCAG 2.2 AA contrast requirements.

NFR8: App must support keyboard navigation with visible focus states.

NFR9: Icon-only controls and toggles must have accessible labels.

NFR10: Motion must respect `prefers-reduced-motion`.

NFR11: Touch targets must be at least 44 x 44 px.

NFR12: App must have no runtime analytics, tracking, external fonts, or external runtime dependencies.

NFR13: User data must remain on the user's device unless manually exported by the user.

NFR14: All text inputs must be trimmed and length-limited before storage.

NFR15: User input must not be rendered through unsafe `innerHTML`.

NFR16: App must not use `eval()`.

NFR17: JSON import must validate schema before writing to IndexedDB.

NFR18: Hosted deployments should use strict Content Security Policy with `connect-src 'none'`.

NFR19: Core workflows must work offline after initial app load.

NFR20: Service Worker caching must use app-shell precache and local assets only.

NFR21: When a new service worker version is available, the app shows a non-blocking update banner and lets the user choose when to reload.

NFR22: HTTPS is required for hosted PWA deployment.

NFR23: Supported browsers are iOS Safari 15.4+, Android Chrome 90+, desktop Chrome/Edge 90+, Firefox 90+, and Safari 15.4+.

NFR24: Lighthouse PWA score should be >= 90 and mobile performance score should be >= 85 on production build unless explicitly waived.

### Additional Requirements

- Use Angular 22 standalone components/routes, strict TypeScript, Angular Signals, Typed Reactive Forms, SCSS/CSS custom properties, `idb`, Angular service worker, Lucide Angular, and Sass.
- Use feature-sliced layered architecture: shell, core, domain, features, shared UI/icons.
- Feature screens may orchestrate UI state and call services, but must not call IndexedDB directly.
- `core/db` is the only IndexedDB adapter and owns schema v1 stores, migrations, and store helpers.
- Services expose readonly Signals for query state and async command methods for writes.
- Every write path validates/sanitizes input before storage, writes through `core/db`, then refreshes affected Signals.
- `domain/calculation` contains pure calculation logic with no Angular or storage dependency.
- `core/backup` owns BackupFormat validation, export, and replace import, and reaches all stores only through `core/db`.
- `core/locale` owns `de-DE` currency, date, decimal, and unit formatters.
- Implementation identifiers, routes, filenames, interfaces, enum values, store names, tests, backup fields, and internal documentation stay English.
- Use field name `extraWorkFeePercent`; do not implement new code or backup fields with `multiPlateSurchargePercent`.
- IndexedDB v1 stores are `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, and `settings`.
- IndexedDB has no foreign keys; services must enforce referential behavior.
- Printer Profiles, Filaments, Customers, and Calculations use soft delete where historical references may exist.
- Backup import validates the full object and schema version before clearing data; future schema changes require IndexedDB migrations and backup version bumps.
- MVP deploys as static files, defaulting to GitHub Pages.
- Hosted CSP denies network connections and allows only local fonts/assets plus `data:` images.
- Angular service worker precaches app shell/local assets only; no runtime network caching of user data.
- CI should run unit tests, production build, bundle budget check, and Lighthouse/PWA checks where practical.
- Calculation formula tests must cover plate count, price modes, modeling cost, extra-work fee, profit margin, rounding, stock deduction, and sale no-deduction behavior.
- No backend, accounts, login, permissions, cloud sync, runtime analytics, external runtime fonts, hidden network calls, invoicing, tax, payments, ERP, telemetry integration, web push, photo attachments, merge import, CSV export, or runtime language switcher in MVP.
- Final PWA icon assets remain an implementation input; placeholders may serve during early implementation.
- Sale edit/delete correction policy remains deferred unless pulled into MVP.

### UX Design Requirements

UX-DR1: Implement four primary German-labeled surfaces with persistent bottom navigation: `Kalkulation`, `Bestand`, `Filamente`, and `Mehr`.

UX-DR2: Use `/calculate`, `/inventory`, `/filaments`, and `/more` route paths with English implementation identifiers.

UX-DR3: The default/opening workflow is `Kalkulation`, not a dashboard or landing page.

UX-DR4: Keep the app mobile-first with phone-sized one-column primary workflows; desktop remains constrained rather than stretched across the viewport.

UX-DR5: Implement local bundled DM Sans typography with the UX-defined compact type ramp and no viewport-scaled font sizing.

UX-DR6: Implement design tokens for warm cream app surface, white cards, terracotta primary accent, slate ink, muted taupe dividers, success green, and Filament content colors.

UX-DR7: Use terracotta for active navigation, primary actions, selected controls, active filter chips, and segmented controls; do not use Filament colors as action/navigation colors.

UX-DR8: Implement spacing/radius tokens including mobile margin, section gaps, row gaps, input radius, card radius, result radius, sheet radius, and full-pill radius.

UX-DR9: Avoid gradients, decorative blobs, saturated multi-color chrome, heavy borders, large shadows, and nested cards.

UX-DR10: Implement bottom navigation with icon above label, active selected state, German labels, and current-surface announcement.

UX-DR11: Implement primary button, secondary button, segmented control, filter chip, Filament chip, result card, inventory card, settings row, customer preview row, and floating action patterns from UX.

UX-DR12: Calculation screen preserves vertical order: project context, Filament selection, print inputs, model/plate controls, result card, and save actions.

UX-DR13: Result card updates live on every valid input change and makes final rounded `Preis` the visual climax.

UX-DR14: First launch with no Printer Profiles replaces printer selector with German empty prompt and CTA `Erst Drucker anlegen`.

UX-DR15: First launch with no Filaments shows German empty state and CTA `Filament hinzufügen` on relevant surfaces.

UX-DR16: Invalid Calculation keeps result area visible where possible, marks missing/invalid fields inline in German, and keeps primary save disabled.

UX-DR17: Multi-color Filament selection supports selectable chips, per-Filament grams rows, total grams feedback, neutral incomplete state, and success valid state.

UX-DR18: Multiple plates show inline explanation such as `3 Platten werden benötigt` and expose extra-work fee control.

UX-DR19: Save success uses German toast or inline confirmation and makes saved Calculation visible in `Bestand`.

UX-DR20: Offline state must not block core flows; if user expects sync, clarify local-only behavior in German.

UX-DR21: Update available state uses non-blocking German banner/toast: `Update verfügbar - jetzt neu laden`.

UX-DR22: Backup import confirmation explains that import replaces local data and recommends export before destructive replacement.

UX-DR23: Empty Inventory shows German empty state with CTA back to Calculate.

UX-DR24: Search no-results in Filaments shows German no-results message while keeping filter chips visible.

UX-DR25: Low/zero Filament amount remains selectable, shows remaining amount, and uses label/icon/state text in addition to color.

UX-DR26: Data deletion requires explicit German confirmation and recommends Backup export first.

UX-DR27: Tap is primary; long-press has no MVP behavior; horizontal scroll is allowed for chip rows only.

UX-DR28: Desktop keyboard support follows reading order; Enter activates focused buttons where appropriate; Escape closes topmost sheet/dialog.

UX-DR29: Hover-only affordances are forbidden because primary target is touch.

UX-DR30: All controls have German accessible names; inline validation messages associate with fields; numeric inputs expose units in labels/descriptions.

UX-DR31: Result card screen-reader announcements are debounced or focus-triggered, not every keystroke.

UX-DR32: Reduced motion disables non-essential animations and transitions.

UX-DR33: Browser back closes deep flows before leaving the app when possible.

UX-DR34: Deep flows for Printer edit, Customer edit, Backup confirmation, Calculation detail, Sale recording, and Template management use route details, modal sheets, or full-screen forms with max one modal stack level.

UX-DR35: Required German visible copy includes navigation labels, calculation titles/actions/sections/fields, Price Mode labels, result card labels, Inventory filters, Filament filters, and More groups from EXPERIENCE.md.

### FR Coverage Map

FR1: Epic 2 - Printer profile CRUD.

FR2: Epic 2 - Printer soft delete and historical snapshots.

FR3: Epic 2 - Filament CRUD and inventory data.

FR4: Epic 2 - Filament price basis and purchase-history pricing.

FR5: Epic 3 - Calculation input form.

FR6: Epic 3 - Correct live pricing formula.

FR7: Epic 3 - Saved Calculation snapshots.

FR8: Epic 4 - Saved print inventory under `Bestand > Drucke`.

FR9: Epic 4 - Sales and gifts.

FR10: Epic 4 - Manual parts under `Bestand > Teile`.

FR11: Epic 4 - Customers.

FR12: Epic 5 - Defaults and Settings.

FR13: Epic 3 - Calculation Templates.

FR14: Epic 5 - Backup export.

FR15: Epic 5 - Backup import.

### UX Design Coverage Map

UX-DR1: Stories 1.1, 1.2 - Four primary German surfaces and persistent bottom navigation.

UX-DR2: Story 1.1 - English route paths `/calculate`, `/inventory`, `/filaments`, `/more`.

UX-DR3: Story 1.1 - Default route opens `Kalkulation`.

UX-DR4: Stories 1.2, 5.5 - Mobile-first constrained layout and desktop expectations.

UX-DR5: Story 1.2 - Local DM Sans typography and compact type ramp.

UX-DR6: Story 1.2 - Design token system.

UX-DR7: Story 1.2 - Terracotta action/active-state use and Filament color restrictions.

UX-DR8: Story 1.2 - Spacing and radius tokens.

UX-DR9: Story 1.2 - Avoid heavy/decorative visual patterns.

UX-DR10: Story 1.1 - Bottom navigation behavior and selected-state accessibility.

UX-DR11: Stories 1.2, 2.5, 3.2, 3.4, 4.1, 4.6 - Shared UI component patterns.

UX-DR12: Story 3.1 - Calculation screen vertical order.

UX-DR13: Story 3.4 - Live result card and dominant final price.

UX-DR14: Story 3.1 - No-printer empty prompt and CTA.

UX-DR15: Stories 2.3, 3.2 - No-filament empty/selection handling.

UX-DR16: Story 3.1 - Invalid calculation inline validation and disabled save.

UX-DR17: Story 3.2 - Multi-color Filament chips, grams rows, and total feedback.

UX-DR18: Story 3.4 - Multiple-plate explanation and extra-work fee control.

UX-DR19: Story 3.5 - Save success and visibility in `Bestand`.

UX-DR20: Stories 1.4, 5.5 - Offline state and local-only clarification.

UX-DR21: Stories 1.4, 5.5 - Update available banner/toast.

UX-DR22: Story 5.3 - Backup import replacement confirmation.

UX-DR23: Story 4.1 - Empty Inventory state and CTA.

UX-DR24: Story 2.5 - Filament no-results state.

UX-DR25: Stories 2.3, 2.5, 4.2 - Low/zero Filament amount state.

UX-DR26: Story 5.4 - Data deletion confirmation and backup recommendation.

UX-DR27: Stories 1.1, 2.5, 4.1 - Tap-first behavior and chip-row horizontal scroll.

UX-DR28: Stories 1.1, 4.3 - Keyboard order, Enter activation, Escape/back close behavior.

UX-DR29: Story 1.2 - No hover-only affordances.

UX-DR30: Stories 1.1, 2.1, 2.3, 3.1, 5.1 - German accessible names, field associations, and units.

UX-DR31: Story 3.4 - Debounced/focus-triggered result card announcements.

UX-DR32: Story 1.2 - Reduced motion support.

UX-DR33: Story 4.3 - Browser back closes deep flow before leaving app.

UX-DR34: Stories 2.1, 4.3, 4.4, 4.6, 5.3 - Deep-flow routing/sheets/full-screen forms with shallow modal stack.

UX-DR35: Stories 1.1, 2.5, 3.1, 3.2, 3.4, 4.1, 5.1 - Required German visible copy.

### Story Requirement Traceability

Story 2.1: FR1.

Story 2.2: FR2.

Story 2.3: FR3.

Story 2.4: FR4.

Story 2.5: FR3, FR4.

Story 2.6: FR3, FR7.

Story 2.7: NFR-6, NFR-7.

Story 3.1: FR5.

Story 3.2: FR5, FR4.

Story 3.3: FR6.

Story 3.4: FR6.

Story 3.5: FR7, FR8.

Story 3.6: FR13.

Story 4.1: FR8.

Story 4.2: FR8.

Story 4.3: FR8, FR9.

Story 4.4: FR9.

Story 4.5: FR10.

Story 4.6: FR11.

Story 5.1: FR12.

Story 5.2: FR14.

Story 5.3: FR15.

Story 5.4: FR15.

Story 5.5: FR12, FR14, FR15.

## Epic List

### Epic 1: App Shell, Local Data, and Offline Foundation

Users can open/install PrintCost, navigate the four German surfaces, persist local data, and use the app shell offline.

**FRs covered:** none directly; supports NFR19-NFR22 and platform constraints

**Implementation notes:** Carries Angular 22 PWA setup, IndexedDB v1 foundation, German bottom navigation, design tokens, service worker, GitHub Pages static hosting, strict CSP, and CI/build checks.

### Epic 2: Printer and Filament Cost Inputs

Users can maintain the printer and filament data needed for reliable cost calculation.

**FRs covered:** FR1, FR2, FR3, FR4

**Implementation notes:** Includes Printer Profile CRUD, Filament CRUD, soft delete, historical snapshot readiness, weighted/paid/fixed price basis, purchase history, filters/search, and low/zero stock display.

### Epic 3: Live Print Pricing and Saved Calculations

Users can calculate a print price live, save planned/completed calculations, and reuse Templates.

**FRs covered:** FR5, FR6, FR7, FR13

**Implementation notes:** Central calculation workflow. Must use corrected formula semantics: total `printMinutes`, total `gramsUsed`, no plate multipliers, and `extraWorkFeePercent`.

### Epic 4: Printed Inventory, Parts, Sales, and Customers

Users can track saved calculations in `Bestand > Drucke`, record print occurrences, manage manual parts, record sales/gifts, and associate Customers.

**FRs covered:** FR8, FR9, FR10, FR11

**Implementation notes:** Explicit print occurrence deducts Filament. Saving a Calculation and recording a Sale do not deduct Filament. Manual Parts live in `Bestand > Teile`.

### Epic 5: Settings, Backup, Restore, and Data Safety

Users can manage defaults, safely export/import local data, delete local data with confirmation, and handle update prompts.

**FRs covered:** FR12, FR14, FR15

**Implementation notes:** Replace-only import, schema validation before mutation, German destructive confirmations, backup-first warnings, and service-worker update UX.

## Epic 1: App Shell, Local Data, and Offline Foundation

Users can open/install PrintCost, navigate the four German surfaces, persist local data, and use the app shell offline.

### Story 1.1: Create Installable Angular PWA Shell

As a maker,
I want to open PrintCost as an installable app with German navigation,
So that I can start from the main calculation workflow on phone or desktop.

**Acceptance Criteria:**

**Given** a fresh project workspace
**When** the app is scaffolded
**Then** Angular 22 standalone app structure exists with strict TypeScript enabled
**And** the production build command succeeds.

**Given** a user opens the app at the root URL
**When** routing initializes
**Then** the user is redirected to `/calculate`
**And** the visible surface label is `Kalkulation`.

**Given** the app shell is visible
**When** the user uses the bottom navigation
**Then** routes exist for `/calculate`, `/inventory`, `/filaments`, and `/more`
**And** the visible labels are `Kalkulation`, `Bestand`, `Filamente`, and `Mehr`.

**Given** a screen reader or keyboard user navigates the bottom navigation
**When** a navigation item is focused or selected
**Then** each item has a German accessible name
**And** the current route announces selected/current state.

### Story 1.2: Apply Design Tokens and Shared Shell UI

As a maker,
I want the app shell to look and feel like the PrintCost design,
So that every feature starts from a consistent mobile-first interface.

**Acceptance Criteria:**

**Given** the app shell renders
**When** styles load
**Then** local DM Sans typography is applied
**And** no external runtime font request is required.

**Given** the design token system is implemented
**When** the shell and bottom navigation render
**Then** warm cream app surface, white cards, terracotta primary accent, slate ink, muted taupe dividers, spacing, radius, and type tokens match `DESIGN.md`.

**Given** the viewport width is 320 px
**When** the user views the app shell
**Then** no horizontal page scrolling is required
**And** bottom navigation remains usable.

**Given** shared shell UI is implemented
**When** future features add screens
**Then** they can use the shared page container and tokenized styles without redefining app-level colors, spacing, or typography.

### Story 1.3: Initialize Local IndexedDB Schema and Settings

As a maker,
I want PrintCost to store my data locally,
So that my records stay on my device and work offline.

**Acceptance Criteria:**

**Given** the app starts for the first time
**When** local storage initializes
**Then** `core/db` opens IndexedDB schema version 1
**And** stores exist for `printers`, `filaments`, `calculations`, `sales`, `customers`, `templates`, `parts`, and `settings`.

**Given** Settings do not exist yet
**When** the database initializes
**Then** default Settings are seeded exactly once
**And** later app starts do not duplicate or overwrite user-edited Settings.

**Given** a feature component needs data
**When** it reads or writes local data
**Then** it uses a service API
**And** no feature component imports or calls the IndexedDB adapter directly.

**Given** a local database smoke test runs
**When** it writes and reads a test settings value through `core/db`
**Then** the stored value round-trips successfully
**And** typical read/write operations complete within the target budget where test environment timing is meaningful.

### Story 1.4: Enable Offline App Shell and Update Banner

As a maker,
I want PrintCost to keep loading after first visit and tell me when an update is available,
So that I can keep working without surprise reloads.

**Acceptance Criteria:**

**Given** a production build has been loaded once
**When** the browser goes offline and the user reloads the app
**Then** the app shell and local assets still load
**And** the user can reach the four primary routes.

**Given** the Angular service worker is configured
**When** cache rules are inspected
**Then** app shell and local assets are precached
**And** user-created IndexedDB data is not cached through runtime network caching.

**Given** a new service worker version is available
**When** the app detects the update
**Then** a German non-blocking banner or toast appears
**And** the user can choose when to reload.

**Given** update checking fails while offline
**When** the app handles the failure
**Then** core workflows are not blocked
**And** no global error wall is shown.

### Story 1.5: Add Static Hosting, CSP, and Build Checks

As a maker,
I want PrintCost deployed as a safe static app,
So that my data never leaves my browser unless I export it.

**Acceptance Criteria:**

**Given** deployment configuration exists
**When** the production app is built
**Then** output is compatible with GitHub Pages static hosting
**And** no backend service is required.

**Given** hosted security settings are documented or configured
**When** the app is deployed
**Then** the intended CSP includes `connect-src 'none'`
**And** only self-hosted scripts, styles, fonts, local images, and `data:` images are allowed.

**Given** CI or local verification scripts run
**When** the project is checked
**Then** unit tests, production build, and bundle-budget checks run where practical
**And** failures are visible to implementers.

**Given** PWA quality verification runs
**When** Lighthouse or equivalent checks are executed
**Then** PWA score target >= 90 and mobile performance target >= 85 are recorded
**And** any waiver is explicit in project documentation.

## Epic 2: Printer and Filament Cost Inputs

Users can maintain the printer and filament data needed for reliable cost calculation.

### Story 2.1: Manage Printer Profiles

As a maker,
I want to create and edit printer cost profiles,
So that electricity, depreciation, and base costs are available for calculations.

**Acceptance Criteria:**

**Given** the user is on `Mehr`
**When** they open `Drucker verwalten`
**Then** they can view existing active Printer Profiles
**And** they can start creating a new Printer Profile.

**Given** the user enters Printer Profile data
**When** they save the form
**Then** `name`, `powerWatts`, `purchasePriceEur`, `lifetimeHours`, `electricityPriceEurKwh`, optional `annualBaseFeeEur`, and optional `note` are validated against the domain contract
**And** invalid fields show German inline validation.

**Given** the Printer Profile form is valid
**When** the user saves
**Then** `PrinterService` writes the profile through `core/db`
**And** the printer appears in the active Printer Profile list.

**Given** a Printer Profile already exists
**When** the user edits and saves it
**Then** updated values are persisted
**And** later calculation flows can select the active profile.

### Story 2.2: Soft-Delete Printer Profiles Safely

As a maker,
I want deleted printers hidden from new calculations but preserved historically,
So that old saved calculations remain reproducible.

**Acceptance Criteria:**

**Given** an active Printer Profile exists
**When** the user chooses delete
**Then** a German confirmation is shown before mutation
**And** canceling leaves the profile unchanged.

**Given** the user confirms deletion
**When** deletion completes
**Then** the profile is marked `deleted: true`
**And** it is hidden from active lists and future Calculation selection defaults.

**Given** a saved Calculation contains a `printerSnapshot`
**When** the source Printer Profile is soft-deleted
**Then** the saved Calculation remains readable and reproducible from its snapshot.

### Story 2.3: Manage Filament Records and Purchase History

As a maker,
I want to create and edit filament rolls with purchase data,
So that material cost basis and stock state are accurate enough for pricing.

**Acceptance Criteria:**

**Given** the user opens `Filamente`
**When** the list loads
**Then** active Filaments are shown
**And** the user can start creating a Filament.

**Given** the user enters Filament data
**When** they save the form
**Then** `name`, `type`, `colorHex`, optional `manufacturer`, `rollWeightG`, `remainingG`, `purchases`, `multiColorSurchargeEurKg`, and optional `fixedPriceEurG` are validated against the domain contract
**And** invalid fields show German inline validation.

**Given** the user creates or edits purchases
**When** the form is saved
**Then** at least one purchase with valid price, quantity, and ISO date is required
**And** purchase data is persisted with the Filament.

**Given** a Filament has low or zero `remainingG`
**When** the Filament appears in the list
**Then** it remains selectable and visible
**And** low/zero state is shown with text or icon, not color alone.

### Story 2.4: Calculate Filament Price Basis

As a maker,
I want filament price modes to produce correct per-gram cost,
So that calculations can use weighted average, last paid, or fixed prices.

**Acceptance Criteria:**

**Given** a Filament has one or more purchases
**When** weighted average price is requested
**Then** `FilamentService` returns `sum(priceEur * quantityKg) / sum(quantityKg) / 1000`
**And** unit tests cover one-purchase and multi-purchase cases.

**Given** a Filament has multiple purchases
**When** last paid price is requested
**Then** `FilamentService` uses the latest purchase date
**And** returns that purchase price per gram.

**Given** a Calculation line uses fixed price mode
**When** `fixedPriceEurG` is missing or <= 0
**Then** validation fails
**And** the user sees a German inline error.

**Given** a purchase is added, edited, or removed
**When** the Filament is saved
**Then** weighted average output updates for future Calculation use
**And** historical Calculation snapshots are not mutated.

### Story 2.5: Find and Filter Filaments

As a maker,
I want to search and filter filament inventory,
So that I can quickly pick or inspect material before a job.

**Acceptance Criteria:**

**Given** the Filament list is visible
**When** filter chips render
**Then** the available filters are `Alle`, `PLA`, `PETG`, `ABS`, `TPU`, and `Anderes`
**And** one filter is active at a time.

**Given** the user searches Filaments
**When** no records match
**Then** a German no-results message appears
**And** filter chips remain visible.

**Given** Filament rows render
**When** the user scans the list
**Then** each row shows color swatch, name, manufacturer when present, price per gram, material tag, and remaining amount.

**Given** a Filament has low or zero stock
**When** the row renders
**Then** it remains selectable
**And** low/zero stock is indicated by label, icon, or state text in addition to color.

### Story 2.6: Soft-Delete Filaments Safely

As a maker,
I want deleted filaments hidden from new selection but preserved for saved calculations,
So that old pricing stays reproducible.

**Acceptance Criteria:**

**Given** an active Filament exists
**When** the user chooses delete
**Then** a German confirmation is shown before mutation
**And** canceling leaves the Filament unchanged.

**Given** the user confirms deletion
**When** deletion completes
**Then** the Filament is marked `deleted: true`
**And** it is hidden from active lists and future Calculation selection defaults.

**Given** a saved Calculation contains a `filamentSnapshot`
**When** the source Filament is soft-deleted
**Then** the saved Calculation remains readable and reproducible from its snapshot.

**Given** a print occurrence later references a soft-deleted Filament by saved `filamentId`
**When** the Filament record still exists
**Then** the system can resolve it for stock deduction
**And** missing records are handled by a German data error in the print occurrence flow.

### Story 2.7: Add TSDoc and Clarifying Documentation for Existing Code

As a maker and maintainer,
I want important functions, stores, and complex logic documented with TSDoc and targeted clarifying comments,
So that implementation intent stays clear and future development is safer.

**Acceptance Criteria:**

**Given** existing TypeScript services, store-like state holders, and utility functions exist
**When** documentation pass is completed
**Then** public methods, critical private methods, state/store structures, and non-obvious business rules have concise TSDoc
**And** comments explain intent and constraints, not line-by-line mechanics.

**Given** documentation is added
**When** developers read feature and core modules
**Then** they can understand purpose, inputs/outputs, side effects, invariants, and error expectations without tracing every call path
**And** comments avoid noise and duplication of obvious code.

**Given** new tickets are created after this story
**When** task and dev-note sections are generated
**Then** each ticket includes explicit requirement for TSDoc on difficult-to-understand functions, stores, and important logic blocks
**And** guidance states to document sections/functions only, not every line.

### Story 2.8: Restyle Existing Filaments List Component

As a maker,
I want the existing Filaments list component restyled to the updated visual guide,
So that the inventory surface matches the new PrintCost look without changing behavior.

**Acceptance Criteria:**

**Given** the Filaments surface renders
**When** the updated style guide is applied
**Then** list rows, filter chips, empty state, and low-stock state use the revised tokens, spacing, radius, and typography from `DESIGN.md`
**And** the component keeps the existing layout density appropriate for mobile.

**Given** the existing Filaments interactions are used
**When** the restyle ships
**Then** search, filter, selection, create, and edit behavior remain unchanged
**And** no new data contract is introduced.

**Given** low/zero stock rows render
**When** the new style is applied
**Then** the state remains readable with non-color indicator text or icon
**And** contrast stays consistent with the accessibility floor.

**Given** the surface renders at mobile and desktop widths
**When** the restyled component is shown
**Then** touch targets remain usable
**And** no horizontal overflow is introduced.

## Epic 3: Live Print Pricing and Saved Calculations

Users can calculate a print price live, save planned/completed calculations, and reuse Templates.

### Story 3.1: Build Calculation Form With Required Inputs

As a maker,
I want to enter all print pricing inputs in the calculation screen,
So that I can price a print job without spreadsheet setup.

**Acceptance Criteria:**

**Given** the user opens `/calculate`
**When** the Calculation screen renders
**Then** it shows German sections for `Projekt`, `Filament`, and `Druck`
**And** the visible order follows project context, Filament selection, print inputs, model/plate controls, result card, and save actions.

**Given** active Printer Profiles exist
**When** the user opens the printer selector
**Then** only active Printer Profiles are selectable
**And** the last used active Printer Profile is selected when available.

**Given** no active Printer Profile exists
**When** the Calculation screen renders
**Then** the printer selector is replaced with a German empty prompt and CTA `Erst Drucker anlegen`
**And** saving remains disabled.

**Given** the user enters Calculation inputs
**When** required fields are missing or invalid
**Then** German inline validation appears on affected fields
**And** the primary save action remains disabled.

### Story 3.2: Add Multi-Filament Lines and Price Mode Selection

As a maker,
I want to select one or more filaments with grams and price mode,
So that multi-color jobs price material correctly.

**Acceptance Criteria:**

**Given** active Filaments exist
**When** the Calculation screen renders Filament choices
**Then** the user can select and deselect Filament chips
**And** each selected Filament exposes a grams input row.

**Given** selected Filament rows are visible
**When** the user chooses a Price Mode
**Then** options are shown with German labels `Ø Schnitt`, `Bezahlt`, and `Fester Preis`
**And** the stored value uses English enum values.

**Given** a selected Filament uses `FIXED` mode
**When** fixed price is missing or invalid
**Then** the row shows a German inline validation error
**And** the Calculation cannot be saved.

**Given** multiple Filaments are selected
**When** grams values change
**Then** the total grams line updates immediately
**And** valid and invalid states are indicated with text or icon in addition to color.

### Story 3.3: Implement Pure Calculation Engine

As a maker,
I want PrintCost to calculate a correct breakdown instantly,
So that the final price is trustworthy.

**Acceptance Criteria:**

**Given** valid Calculation input is passed to `domain/calculation/calculate()`
**When** the function runs
**Then** it returns material, electricity, depreciation, modeling, extra-work fee, subtotal, final price, rounded price, plate count, and total grams
**And** the function has no Angular or IndexedDB dependency.

**Given** `printMinutes`, `gramsUsed`, `printQuantity`, and `partsPerPlate` are provided
**When** plate count is greater than 1
**Then** plate count does not multiply material, electricity, base fee, or depreciation costs
**And** only `extraWorkFeePercent` can add an extra fee.

**Given** Price Modes are used
**When** the calculation runs
**Then** weighted average, paid, and fixed prices produce expected material costs
**And** unit tests cover each mode.

**Given** profit margin and rounding are applied
**When** the calculation returns the final result
**Then** `finalPriceEur` applies profit margin
**And** `roundedFinalPriceEur` uses ceiling rounding.

### Story 3.4: Render Live Result Card and Plate Explanation

As a maker,
I want to see cost breakdown and final price while editing,
So that I can adjust inputs with immediate feedback.

**Acceptance Criteria:**

**Given** Calculation input is valid
**When** any input changes
**Then** the result card updates without a submit step
**And** typical update time remains within 100 ms.

**Given** the result card renders
**When** costs are displayed
**Then** it shows German labels for `Materialkosten`, `Stromkosten`, `AfA`, `Modellierung`, extra-work fee, `Zwischensumme`, `Gewinn`, and `Preis`
**And** the final `Preis` is visually dominant.

**Given** `plates` is greater than 1
**When** model/plate controls render
**Then** an inline German explanation such as `3 Platten werden benötigt` appears
**And** the extra-work fee control is available.

**Given** a screen reader is active
**When** the result updates during typing
**Then** announcements are debounced or focus-triggered
**And** the screen reader is not spammed on every keystroke.

### Story 3.5: Save Calculation With Snapshots

As a maker,
I want to save a planned calculation without deducting filament,
So that I can print it later and keep the price reproducible.

**Acceptance Criteria:**

**Given** the Calculation form is valid
**When** the user saves it
**Then** the saved Calculation stores `printerSnapshot`, each `filamentSnapshot`, selected Price Modes, calculated price per gram, inputs, and computed outputs.

**Given** the Calculation is saved
**When** persistence completes
**Then** `timesPrinted` can be `0`
**And** no Filament `remainingG` value is deducted.

**Given** source Printer Profiles, Filaments, Settings, or purchases later change
**When** the saved Calculation is opened
**Then** historical pricing remains readable and reproducible from snapshots.

**Given** save succeeds
**When** feedback is shown
**Then** the user sees German confirmation
**And** the saved Calculation appears under `Bestand > Drucke`.

### Story 3.6: Save and Load Calculation Templates

As a maker,
I want to save and load reusable calculation templates,
So that repeat jobs start from known inputs.

**Acceptance Criteria:**

**Given** the user has entered reusable Calculation inputs
**When** they choose `Als Vorlage`
**Then** a Template can be saved with a Template name independent of `projectName`
**And** it is persisted in the `templates` store.

**Given** at least one Template exists
**When** the user chooses `Vorlage laden`
**Then** they can select a Template
**And** the Calculation form is prefilled from that Template.

**Given** a Template has been loaded
**When** the user edits any prefilled field
**Then** the field remains editable
**And** changes do not mutate the stored Template unless explicitly saved again.

**Given** Template data references unavailable active records
**When** the Template is loaded
**Then** the form shows German inline guidance for records needing reselection
**And** save remains disabled until required selections are valid.

## Epic 4: Printed Inventory, Parts, Sales, and Customers

Users can track saved calculations in `Bestand > Drucke`, record print occurrences, manage manual parts, record sales/gifts, and associate Customers.

### Story 4.1: Show Saved Calculations in Drucke Inventory

As a maker,
I want saved calculations listed under `Bestand > Drucke`,
So that planned and printed jobs are easy to find.

**Acceptance Criteria:**

**Given** the user opens `/inventory`
**When** the Inventory screen renders
**Then** it provides `Drucke` and `Teile` areas or tabs
**And** `Drucke` is available for saved Calculations.

**Given** saved Calculations exist
**When** `Drucke` is active
**Then** saved Calculations are listed, including entries with `timesPrinted = 0`
**And** each card shows project name, quantity printed, quantity sold, rounded price, and last update date.

**Given** the user filters `Drucke`
**When** they choose `Alle`, `Auf Lager`, `Teilweise`, `Vollständig`, or `Verschenkt`
**Then** the list updates to matching saved Calculations
**And** one filter is active at a time.

**Given** no saved Calculations exist
**When** the Inventory screen renders
**Then** a German empty state appears
**And** it offers a CTA back to `Kalkulation`.

### Story 4.2: Record Print Occurrence With Stock Deduction

As a maker,
I want to tap `+1` or record a print occurrence,
So that printed count and filament stock stay aligned.

**Acceptance Criteria:**

**Given** a saved Calculation exists
**When** the user taps `+1` or confirms `Druck verbuchen`
**Then** `timesPrinted` increments by one
**And** no new Calculation is created.

**Given** the saved Calculation has Filament lines
**When** the print occurrence is recorded
**Then** the saved total `gramsUsed` for each line is deducted once from current Filament `remainingG`
**And** deduction resolves by saved `filamentId`, including soft-deleted Filament records.

**Given** current `remainingG` is lower than required grams
**When** the print occurrence is recorded
**Then** the print occurrence is not blocked
**And** `remainingG` is clamped to `0` with a German warning.

**Given** a referenced Filament record is missing
**When** the print occurrence is attempted
**Then** the command is blocked
**And** a German data error explains that stock deduction cannot be completed.

### Story 4.3: Open Calculation Detail and Sale History

As a maker,
I want to inspect a saved calculation and its sales,
So that I can understand stock, price, and transaction history.

**Acceptance Criteria:**

**Given** the user is viewing a `Drucke` inventory card
**When** they tap the card outside quick actions
**Then** a Calculation detail route, sheet, or full-screen view opens
**And** the current bottom navigation state remains associated with `Bestand`.

**Given** the Calculation detail is open
**When** data renders
**Then** it shows snapshot-based printer, filament, input, and cost breakdown data
**And** historical totals do not change when source records were edited later.

**Given** Sales or Gifts exist for the Calculation
**When** the detail view renders
**Then** it shows printed, sold, gifted, and remaining counts
**And** it lists sale/gift records with date, price/gift state, optional Customer, and note when present.

**Given** the detail view is open
**When** the user presses browser back or Escape where supported
**Then** the detail view closes before the app leaves the Inventory surface.

### Story 4.4: Record Sales and Gifts

As a maker,
I want to record a sale or gift against a saved calculation,
So that available printed inventory and customer history stay accurate.

**Acceptance Criteria:**

**Given** a saved Calculation exists
**When** the user starts recording a Sale
**Then** the form supports optional Customer, sale price, gift flag, date, and note.

**Given** the user marks the transaction as a Gift
**When** the Sale is saved
**Then** sale price `0` is valid
**And** the saved record is marked `gifted: true`.

**Given** the Sale form is valid
**When** the user saves
**Then** a Sale record is persisted against the Calculation
**And** sold/gifted/remaining counts update on the inventory card and detail view.

**Given** a Sale or Gift is saved
**When** persistence completes
**Then** no Filament `remainingG` value is deducted
**And** German confirmation or inline success feedback is shown.

### Story 4.5: Manage Manual Parts in Teile

As a maker,
I want to track manual parts separately from saved calculations,
So that non-calculated inventory still has a count.

**Acceptance Criteria:**

**Given** the user opens `Bestand > Teile`
**When** the Parts area renders
**Then** manual Part records are shown separately from saved Calculation records.

**Given** the user creates a Part
**When** they save name, quantity, optional linked Calculation, and optional note
**Then** the Part is persisted
**And** a Part without linked Calculation remains valid.

**Given** a Part exists
**When** the user uses inline increment or decrement controls
**Then** the quantity updates locally
**And** quantity cannot be reduced below zero.

**Given** invalid Part input is entered
**When** the user attempts to save
**Then** German inline validation appears
**And** invalid data is not persisted.

### Story 4.6: Manage Customer Records

As a maker,
I want to manage customer records locally,
So that calculations and sales can be associated with repeat buyers.

**Acceptance Criteria:**

**Given** the user opens `Mehr`
**When** they choose `Kunden`
**Then** they can view Customer records
**And** each preview row shows generated initials, name, and contact/note preview when present.

**Given** the user creates or edits a Customer
**When** they save
**Then** `name`, optional `contact`, and optional `note` are validated against the domain contract
**And** invalid fields show German inline validation.

**Given** a Customer exists
**When** the user soft-deletes it
**Then** a German confirmation is shown
**And** the Customer is hidden from active selectors while historical Calculation and Sale references remain readable.

**Given** the Calculation or Sale flow needs a Customer
**When** the user opens the selector
**Then** active Customers can be selected
**And** null Customer remains valid as personal/no-customer.

## Epic 5: Settings, Backup, Restore, and Data Safety

Users can manage defaults, safely export/import local data, delete local data with confirmation, and handle update prompts.

### Story 5.1: Manage Calculation Defaults

As a maker,
I want to set default pricing values,
So that new calculations start with my usual assumptions.

**Acceptance Criteria:**

**Given** the user opens `Mehr`
**When** they choose `Kalkulations-Standards`
**Then** the Settings screen opens
**And** default calculation fields are editable.

**Given** the user edits defaults
**When** they save
**Then** default Price Mode, profit margin, modeling cost, and multi-color surcharge are validated
**And** invalid fields show German inline validation.

**Given** defaults are saved
**When** the user creates a future Calculation or Filament where applicable
**Then** the saved defaults prefill the new record
**And** existing records are not changed.

**Given** Settings are persisted
**When** the app reloads
**Then** saved defaults are restored from local storage
**And** formatting uses German locale conventions.

### Story 5.2: Export Versioned Backup JSON

As a maker,
I want to export all local data,
So that I can back up or move my PrintCost records manually.

**Acceptance Criteria:**

**Given** the user opens `Daten exportieren / importieren`
**When** they choose export
**Then** a JSON backup is generated with `version`, `exportedAt`, all IndexedDB stores, and Settings.

**Given** export succeeds
**When** the browser downloads the file
**Then** the filename follows `printcost-backup-YYYY-MM-DD.json`
**And** German success feedback is shown.

**Given** backup export runs
**When** data is gathered
**Then** no backend request or hidden network transfer occurs
**And** data remains on the user's device unless they save/share the file.

**Given** export fails
**When** the failure is handled
**Then** a German error explains the problem
**And** existing local data is unchanged.

### Story 5.3: Validate and Import Backup With Replace Strategy

As a maker,
I want to import a backup safely,
So that I can restore data without corrupting current records.

**Acceptance Criteria:**

**Given** the user chooses import
**When** the native file picker opens
**Then** the user can select a JSON backup file
**And** the app reads it without sending it to a backend.

**Given** a backup file is selected
**When** validation runs
**Then** schema version, required top-level fields, all stores, and Settings are validated before any local data is cleared.

**Given** validation fails
**When** import stops
**Then** no current IndexedDB data is mutated
**And** a German error explains that the backup is invalid.

**Given** validation succeeds
**When** the user sees the confirmation dialog
**Then** German copy explains that import replaces local data
**And** recommends exporting a backup first.

**Given** the user confirms import
**When** replacement runs
**Then** all app stores are replaced with backup data
**And** the app refreshes service Signals from the imported data.

### Story 5.4: Delete All Local Data Safely

As a maker,
I want to delete all local data with clear warnings,
So that I can reset the app intentionally.

**Acceptance Criteria:**

**Given** the user opens `Mehr > System`
**When** they choose full local data deletion
**Then** a German confirmation explains that all local PrintCost data will be removed
**And** recommends Backup export first.

**Given** the confirmation is visible
**When** the user cancels
**Then** no local data is changed.

**Given** the user explicitly confirms deletion
**When** deletion completes
**Then** all app stores are cleared
**And** default Settings are re-seeded.

**Given** deletion completes
**When** the app returns to primary surfaces
**Then** first-launch empty states appear for missing Printer Profiles, Filaments, and Inventory
**And** German feedback confirms reset.

### Story 5.5: Final PWA Data-Safety and Update Polish

As a maker,
I want the app to communicate local-only, offline, and update behavior clearly,
So that I trust where my data lives.

**Acceptance Criteria:**

**Given** a user may expect sync
**When** the app presents backup, import, install, or offline messaging
**Then** German copy clarifies that MVP data is local-only and account-free
**And** no cloud sync is implied.

**Given** browser storage risk is relevant
**When** the user reaches backup/system areas
**Then** German copy or reminder encourages periodic Backup export
**And** does not block normal use.

**Given** an app update is available
**When** the user sees update messaging in the shell or More/System area
**Then** the message remains non-blocking
**And** the user controls reload timing.

**Given** MVP scope is enforced
**When** data-safety polish is completed
**Then** CSV export, merge import, cloud sync, runtime language switching, and account flows remain absent unless a later approved change pulls them into scope.
