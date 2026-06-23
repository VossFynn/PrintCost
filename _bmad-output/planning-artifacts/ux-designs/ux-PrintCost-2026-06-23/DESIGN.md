---
name: PrintCost
status: final
description: Mobile-first German PWA for fast, practical 3D print price calculation and local inventory tracking.
sources:
  - ../../../prd.md
  - imports/PrintCost Wireframes - Standalone.html
  - mockups/printcost-wireframes-v4.html
updated: 2026-06-23
colors:
  canvas-board: '#EFE7DC'
  surface-app: '#FAF7F2'
  surface-card: '#FFFFFF'
  surface-muted: '#F1EADF'
  surface-accent-soft: '#F7EAE0'
  border-subtle: '#ECE3D5'
  border-muted: '#F2ECE1'
  border-dashed: '#DAC9B3'
  ink-primary: '#2C3E50'
  ink-secondary: '#7A8794'
  ink-muted: '#8C97A2'
  ink-label: '#9B8F7D'
  ink-section: '#A99C88'
  primary: '#C4622D'
  primary-foreground: '#FFFFFF'
  success: '#3E9E6B'
  filament-orange: '#E8843B'
  filament-purple: '#4B3B6B'
  filament-black: '#23262B'
typography:
  app-title:
    fontFamily: 'DM Sans'
    fontSize: 23px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: '0'
  section-label:
    fontFamily: 'DM Sans'
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: '0.12em'
  body:
    fontFamily: 'DM Sans'
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '1.35'
    letterSpacing: '0'
  body-strong:
    fontFamily: 'DM Sans'
    fontSize: 15px
    fontWeight: '700'
    lineHeight: '1.35'
    letterSpacing: '0'
  meta:
    fontFamily: 'DM Sans'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.35'
    letterSpacing: '0'
  nav-label:
    fontFamily: 'DM Sans'
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: '0'
  price-display:
    fontFamily: 'DM Sans'
    fontSize: 42px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: '0'
rounded:
  xs: 3px
  sm: 5px
  md: 10px
  input: 12px
  card: 16px
  result: 18px
  sheet: 24px
  phone-frame: 34px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  '8': 32px
  mobile-margin: 20px
  section-gap: 22px
  row-gap: 10px
components:
  app-shell:
    background: '{colors.surface-app}'
    radius: '{rounded.phone-frame}'
  bottom-nav:
    background: '{colors.surface-card}'
    borderTop: '{colors.border-muted}'
  primary-button:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.input}'
  floating-action:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.full}'
  card:
    background: '{colors.surface-card}'
    radius: '{rounded.card}'
    border: '{colors.border-subtle}'
  input:
    background: '{colors.surface-card}'
    border: '{colors.border-subtle}'
    radius: '{rounded.input}'
  segmented-control:
    background: '{colors.surface-muted}'
    activeBackground: '{colors.primary}'
    activeForeground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  chip-active:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.full}'
  chip-selected-soft:
    background: '{colors.surface-accent-soft}'
    border: '{colors.primary}'
    radius: '{rounded.full}'
---

# PrintCost - Design Spine

## Brand & Style

PrintCost is a focused maker utility, not a marketplace, finance suite, or consumer lifestyle app. The visual language should feel practical, compact, and warm: a small workshop tool that gives a clear price without spreadsheet friction.

The supplied wireframe establishes a warm cream app canvas, white functional cards, a terracotta primary action color, slate text, and quiet taupe dividers. The product should stay dense enough for repeated mobile use while preserving enough spacing for forms, price summaries, and inventory rows to scan quickly.

The app UI is German. This document defines visual tokens in English for implementation, but visible labels, validation text, dialogs, and accessibility labels use German copy.

## Colors

- **Surface App (`{colors.surface-app}`)** is the main in-app background. It should be warm and non-clinical, avoiding plain gray or stark white.
- **Surface Card (`{colors.surface-card}`)** is used for form controls, grouped settings, inventory cards, and result panels.
- **Primary Terracotta (`{colors.primary}`)** is the only dominant brand/action color. It marks primary actions, active navigation, active filter chips, active segmented controls, and selected filament lines.
- **Slate Ink (`{colors.ink-primary}`)** is the main text color. It should carry headings, values, and important labels.
- **Muted Taupes (`{colors.ink-section}`, `{colors.ink-label}`, `{colors.border-subtle}`)** separate sections without making the product feel heavy.
- **Success Green (`{colors.success}`)** is reserved for confirmed totals, valid sums, or positive completion states.
- **Filament Colors** are content colors, not brand colors. They represent physical filament swatches and may vary per Filament record.

Avoid gradients, decorative blobs, saturated multi-color chrome, and using filament colors as navigation or primary action colors.

## Typography

DM Sans is the product typeface. It should be bundled locally for the PWA. The ramp is compact and utility-oriented:

- `{typography.app-title}` for screen titles such as `Neue Kalkulation`, `Bestand`, `Filamente`, and `Mehr`.
- `{typography.section-label}` for uppercase section labels such as `Projekt`, `Filament`, `Druck`, `Verwaltung`, and `System`.
- `{typography.body}` for form values, row labels, and list content.
- `{typography.body-strong}` for item titles, saved Calculation names, Customer names, and important values.
- `{typography.price-display}` only for the final rounded price in the result card.

Do not scale type with viewport width. Letter spacing is 0 except for section labels, which intentionally use tracking to separate groups.

## Layout & Spacing

Mobile is the anchor. The mockup uses a 390 px viewport with 20 px side margins, stacked sections, and a persistent bottom navigation. The layout should translate to responsive web by keeping the primary workflow in a constrained single column on desktop rather than stretching forms across the full viewport.

Use `{spacing.mobile-margin}` for mobile side padding, `{spacing.section-gap}` between major form groups, and `{spacing.row-gap}` inside repeated rows. Form sections should read as compact clusters: label, related controls, then immediate feedback.

The calculation screen is the densest surface. Preserve the vertical order from the wireframe: project context, filament selection, print inputs, model/plate controls, result card, save actions.

## Elevation & Depth

Depth is subtle and functional. Cards and phone-frame mockups use soft shadows from the wireframe, but production UI should not rely on shadow alone for hierarchy. Prefer tonal contrast, borders, and spacing.

Use larger shadow only for floating action buttons or modal/sheet surfaces. Repeated list cards use low-opacity shadows or a border, not both at high strength.

## Shapes

The shape language is soft and approachable:

- `{rounded.input}` for inputs, selectors, and compact controls.
- `{rounded.card}` for grouped list cards and settings groups.
- `{rounded.result}` for the calculation result card.
- `{rounded.full}` for chips, filament swatches, avatars, and floating actions.

Avoid deeply nested cards. A group card may contain rows, but a repeated card should not contain another card-like surface unless it is the result summary.

## Components

- **Bottom navigation** - Four items with icon above label. Active item uses `{colors.primary}` and stronger label weight; inactive items use muted gray/taupe. Labels: `Kalkulation`, `Bestand`, `Filamente`, `Mehr`.
- **Primary button** - Solid `{colors.primary}` with white text. Used for `Speichern`, creation actions, and confirmation actions.
- **Secondary button** - White or transparent surface with `{colors.primary}` text and subtle border. Used for `Vorlage laden`, `Als Vorlage`, and non-destructive secondary actions.
- **Segmented control** - Muted container with active segment filled by `{colors.primary}`. Used for Price Mode and binary/option sets such as `Modell vorhanden?`.
- **Filter chip** - Horizontal scrollable chip row. Active chip uses primary fill; inactive chips use white background and subtle border.
- **Filament chip** - Shows color swatch plus shortened material name. Selected chips use soft terracotta background and primary border.
- **Result card** - White raised summary card with line-item breakdown and final price display. The final `Preis` value is the visual climax of the calculation flow.
- **Inventory card** - Saved Calculation row/card with title, printer/material/date metadata, count badges, status, and `+1` action.
- **Settings row** - Icon tile, title, subtitle, and chevron. Rows group under section labels like `Verwaltung` and `System`.
- **Customer preview row** - Initial avatar, Customer name, and short contact/note line.

## Do's and Don'ts

| Do | Don't |
| --- | --- |
| Keep UI copy German and implementation tokens English | Mix German implementation identifiers into TypeScript models or services |
| Use terracotta for active navigation, primary actions, and selected controls | Use filament colors as action or navigation colors |
| Keep calculation feedback close to the inputs that drive it | Hide the final price behind a submit-only workflow |
| Preserve compact mobile density with clear section labels | Turn the app into a marketing-style landing page |
| Use `de-DE` number and currency formatting | Display English decimal/currency conventions in the UI |
| Use soft cards and quiet dividers | Add heavy borders, large shadows, gradients, or decorative background elements |

