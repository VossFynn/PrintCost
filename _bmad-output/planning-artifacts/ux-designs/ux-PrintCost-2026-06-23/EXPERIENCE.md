---
name: PrintCost
status: final
sources:
  - ../../../prd.md
  - DESIGN.md
  - imports/PrintCost Wireframes - Standalone.html
  - mockups/printcost-wireframes-v4.html
updated: 2026-06-23
---

# PrintCost - Experience Spine

Spines win on conflict with imported mockups. The standalone HTML is the visual reference; this document is the behavioral and interaction contract.

## Foundation

PrintCost is a mobile-first responsive PWA for a single maker/operator. The app has German user-facing copy and English implementation identifiers. `DESIGN.md` owns visual identity tokens; this spine owns surfaces, behavior, state patterns, microcopy, interaction rules, and accessibility requirements.

Primary form factor is phone-sized mobile web/PWA. Desktop is supported as responsive web, but the core workflows remain a constrained single-column tool surface rather than a wide dashboard.

## Information Architecture

| Surface | German UI Label | Route | Reached from | Purpose | Mock coverage |
| --- | --- | --- | --- | --- | --- |
| Calculate | `Kalkulation` | `/calculate` | App open, bottom nav | Create and save a Calculation with live result card | `mockups/printcost-wireframes-v4.html` screen 1 |
| Inventory | `Bestand` | `/inventory` | Bottom nav | View saved Calculations, print counts, sale status, and Parts | `mockups/printcost-wireframes-v4.html` screen 2 |
| Filaments | `Filamente` | `/filaments` | Bottom nav | Search, filter, inspect, and create Filaments | `mockups/printcost-wireframes-v4.html` screen 3 |
| More | `Mehr` | `/more` | Bottom nav | Customers, Printer Profiles, Settings, backup/import/export, data deletion | `mockups/printcost-wireframes-v4.html` screen 4 |

The bottom navigation is persistent across the four primary surfaces. Deep flows such as Printer Profile edit, Customer edit, Backup import confirmation, Calculation detail, Sale recording, and Template management are reached from these surfaces as route details, modal sheets, or full-screen forms. Modal stacks must not exceed one level.

## Voice and Tone

Microcopy is German, practical, and short. The product should sound like a workshop tool: direct labels, clear outcomes, no hype.

| Do | Don't |
| --- | --- |
| `Neue Kalkulation` | `Let's calculate your print!` |
| `Kein Kunde - Für mich` | `No customer selected` |
| `3 Platten werden benötigt` | `Your job requires multiple build plates!` |
| `Verkaufspreis wird nach dem Speichern eingetragen` | `You can add sales later if you want` |
| `Daten werden ersetzt. Vorher Backup exportieren?` | `Warning: destructive import operation` |

Currency and numbers use German formatting: `11 €`, `3,31 €`, `0,022 €/g`, `18. Jun`, and comma decimal separators.

## Component Patterns

Visual specs live in `DESIGN.md.Components`.

| Component | Used on | Behavioral rules |
| --- | --- | --- |
| Bottom navigation | All primary surfaces | Tap switches surface. Active item uses active state. Current surface remains highlighted after deep-flow close. |
| Section label | Forms and lists | Groups related fields. Do not make section labels interactive. |
| Selector row | Calculate, More | Row opens a picker or detail surface. Chevron indicates drill-in or selection. |
| Text/number input row | Calculate, forms | Tap focuses field. Numeric fields use numeric keyboard on mobile. |
| Segmented control | Calculate, Settings | Exactly one option active unless explicitly designed as multi-select. Used for Price Mode and binary options. |
| Filter chip row | Inventory, Filaments | Horizontally scrollable. One active filter at a time in MVP. |
| Filament chip | Calculate | Tap selects/deselects filament. Selected chip exposes grams line below. |
| Filament grams line | Calculate | Each selected Filament has a numeric grams row. Sum row updates immediately and shows valid state. |
| Result card | Calculate | Updates live on every input change. Final rounded `Preis` is visually dominant. |
| Primary action | Calculate/forms | Executes main save/create/confirm action. Disabled until required fields are valid. |
| Secondary action | Calculate/forms | Non-destructive alternative such as `Als Vorlage` or `Vorlage laden`. |
| Inventory card | Inventory | Tap opens detail; `+1` increments `timesPrinted` without opening detail. |
| Floating action | Filaments and list surfaces | Creates the current resource (`+ Filament`, eventually `+ Teil`, `+ Kunde`). Must not cover critical row actions. |
| Settings row | More | Tap opens management surface. Subtitle gives count/default preview. |
| Customer preview row | More and Customers | Tap opens Customer detail. Initials avatar generated from Customer name. |

## State Patterns

| State | Surface | Treatment |
| --- | --- | --- |
| First launch, no Printer Profiles | Calculate | Replace printer selector with German empty prompt and CTA: `Erst Drucker anlegen`. |
| First launch, no Filaments | Calculate / Filaments | Show German empty state with CTA `Filament hinzufügen`. |
| Calculation valid | Calculate | Result card updates immediately; `Speichern` enabled. |
| Calculation invalid | Calculate | Keep result card visible if possible, but mark missing/invalid fields inline in German. Do not show a global error wall. |
| Multi-color valid sum | Calculate | Sum row shows success state, e.g. `48 g` with success color. |
| Multi-color incomplete | Calculate | Sum row stays neutral and affected grams row shows German helper/error text. |
| Multiple plates | Calculate | Inline plate explanation appears before surcharge control, e.g. `3 Platten werden benötigt`. |
| Save success | Calculate | German toast or inline confirmation. Saved Calculation appears in Inventory. |
| Offline | Global | Core flows continue. If a network update check fails, do not block. If a user expects sync, clarify local-only behavior in German. |
| Update available | Global | Non-blocking banner/toast: `Update verfügbar - jetzt neu laden`. |
| Backup import | More | Confirmation dialog explains that import replaces local data. |
| Empty Inventory | Inventory | German empty state with CTA back to Calculate. |
| Search no results | Filaments | German no-results message; keep filter chips visible. |
| Low/zero filament amount | Filaments | Keep row selectable; show remaining amount and optional low-stock visual state. |
| Data deletion | More | Require explicit confirmation and recommend Backup export first. |

## Interaction Primitives

- Tap is the primary action. Long-press has no MVP behavior.
- Horizontal scroll is allowed for chip rows only; primary forms remain vertical.
- Bottom navigation controls primary surface switching.
- Form inputs recalculate live without a submit button.
- Destructive actions require confirmation.
- File import uses native file picker and validates before replacement.
- Keyboard support on desktop follows reading order; Enter activates focused buttons where appropriate, Escape closes the topmost sheet/dialog.
- Hover-only affordances are forbidden because the primary form factor is touch.

## Accessibility Floor

Behavioral requirements; visual contrast belongs to `DESIGN.md`.

- All controls have German accessible names.
- Bottom navigation announces current selected surface.
- Result card updates should not spam screen readers on every keystroke. Announce final price on explicit focus or after a short debounce.
- Inline validation messages are associated with their fields.
- Numeric inputs expose units in labels or accessible descriptions, e.g. `Minuten`, `Gramm`, `Euro pro Gramm`, `Prozent`.
- Touch targets are at least 44 x 44 px.
- Focus order follows visual reading order.
- Reduced motion disables non-essential animation and transitions.
- Color is never the only indicator for selected Filaments, valid sums, or low stock; use label, icon, or state text too.

## Responsive & Platform

| Viewport | Behavior |
| --- | --- |
| Phone / PWA install | Primary target. Bottom nav persistent. One-column forms. FABs stay above bottom nav. |
| Small tablet | Still single column; increase side margins and keep result card in flow. |
| Desktop | Constrain content to a phone/tool-width column or a modest two-pane shell only when detail views need context. Do not stretch calculation inputs across full desktop width. |

PWA installation should feel native enough on iOS, Android, and desktop, but the app remains responsive web. Browser back should close deep flows before leaving the app when possible.

## German UI Copy Inventory

These labels are established by the PRD and imported wireframe:

| Area | Required visible copy examples |
| --- | --- |
| Navigation | `Kalkulation`, `Bestand`, `Filamente`, `Mehr` |
| Calculate title/actions | `Neue Kalkulation`, `Vorlage laden`, `Speichern`, `Als Vorlage` |
| Calculate sections | `Projekt`, `Filament`, `Druck` |
| Calculation fields | `Drucker`, `Kein Kunde - Für mich`, `Minuten`, `Teile pro Platte`, `Anzahl Drucke`, `Modell vorhanden?` |
| Price modes | `Fester Preis`, `Bezahlt`, `Ø Schnitt` |
| Result card | `Materialkosten`, `Stromkosten`, `AfA`, `Modellierung`, `Mehrplatten-Aufschlag`, `Zwischensumme`, `Gewinn`, `Preis` |
| Inventory filters | `Alle`, `Auf Lager`, `Teilweise`, `Vollständig`, `Verschenkt` |
| Filament filters | `Alle`, `PLA`, `PETG`, `ABS`, `TPU`, `Anderes` |
| More groups | `Verwaltung`, `System`, `Drucker verwalten`, `Kunden`, `Kalkulations-Standards`, `Daten exportieren / importieren` |

## Key Flows

### Flow 1 - Alex prices a multi-color print at the printer

1. Alex opens the PWA and lands on `Kalkulation`.
2. Alex enters the project name, keeps `Prusa MK4` selected, and leaves Customer as `Kein Kunde - Für mich`.
3. Alex selects two Filaments, enters grams for each, and sees the `Summe` line update to a valid total.
4. Alex chooses `Ø Schnitt`, enters print minutes, quantity, and parts per plate.
5. The app shows `3 Platten werden benötigt` and exposes `Mehrplatten-Aufschlag`.
6. Alex answers `Modell vorhanden?` and reviews the result card.
7. **Climax:** The large `Preis` value updates to the rounded selling price (`11 €`) without a submit step.
8. Alex taps `Speichern`; the saved Calculation becomes visible in `Bestand`.

Failure: if a required field is missing or invalid, the relevant section shows German inline validation and `Speichern` remains disabled.

### Flow 2 - Alex updates print inventory after another run

1. Alex opens `Bestand`.
2. The `Drucke` tab is active.
3. Alex filters to `Auf Lager` or stays on `Alle`.
4. Alex finds `Benchy v2 - Halterung`.
5. Alex taps `+1`.
6. **Climax:** The card count updates immediately, proving one more print was added without recalculating.

Failure: if the update cannot be persisted locally, the UI reverts the count and shows a German error toast.

### Flow 3 - Alex checks filament stock before a job

1. Alex opens `Filamente`.
2. Alex searches or filters by `PLA`, `PETG`, `ABS`, `TPU`, or `Anderes`.
3. Each row shows color swatch, name, manufacturer, price per gram, material tag, and remaining amount.
4. Alex sees `Natural` is low at `180g / 1000g`.
5. **Climax:** Alex can decide whether enough material remains before starting the job.

Failure: no search result keeps filter chips visible and shows a German empty state.

### Flow 4 - Alex manages defaults and customer records

1. Alex opens `Mehr`.
2. Under `Verwaltung`, Alex opens `Drucker verwalten` or `Kunden`.
3. Under `System`, Alex opens `Kalkulations-Standards` or `Daten exportieren / importieren`.
4. Customer preview rows show initials, name, and short contact/note text.
5. **Climax:** Alex can update defaults or backup data without leaving the app or signing in.

Failure: Backup import shows a confirmation dialog before replacing local data.

## Inspiration & Anti-patterns

- **Lifted from the supplied wireframe:** four-tab mobile IA, dense calculation form, prominent result card, bottom navigation, warm tool palette, terracotta active state, and German copy.
- **Lifted from native mobile conventions:** persistent bottom nav, sheets/detail flows, numeric keyboards, and large touch targets.
- **Rejected - spreadsheet-like table UI:** PrintCost is replacing Excel on mobile; avoid wide grids as the primary UX.
- **Rejected - dashboard-first navigation:** the user opens the app to calculate a price, not to inspect analytics.
- **Rejected - account/cloud-first onboarding:** MVP is local-only and offline-first.

## Open UX Items

1. Confirm whether Filament remaining amount is automatically deducted after saving a Calculation or only adjusted manually.
2. Confirm whether desktop should remain a centered mobile-width tool or add a secondary detail pane for Inventory/More management screens.
3. Confirm whether CSV export is visible in MVP copy; the PRD currently treats CSV as post-MVP while the wireframe says `CSV - Backup`.
4. Confirm exact German error and confirmation copy before implementation.

