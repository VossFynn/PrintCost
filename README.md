# 🖨️ PrintCost

> A privacy-first PWA for 3D print hobbyists and small-batch sellers to calculate accurate print costs and track their inventory — no account, no server, no data leaving the device.

## 🧪 The Story Behind This

This is the first product I built **entirely with AI** — from initial idea and PRD through architecture, UX wireframes, and every line of code. The workflow combined several strategies: BMAD for structured product and architecture thinking, Claude Code for implementation, and a lot of trial and error in a live greenfield environment.

The whole thing took roughly **12 hours** spread across a few sessions. Not because the problem is complex, but because I wanted to understand what it actually feels like to ship something real this way — not a toy demo, but a tool I personally need and will actually use.

The verdict: it went pretty well. Genuinely well. And now I'm more excited than ever to try different architectures, different stacks, different AI-assisted workflows, and see how far this goes.

If you want to fork it, adapt it, or contribute — go for it.

> **Note:** The codebase is due for a manual refactoring pass soon — some rough edges are expected from a 12-hour AI-assisted sprint. New features are also on the horizon (see [Roadmap](#-roadmap) below).

---

## ✨ Features

- **Accurate cost breakdown** — material, electricity, printer depreciation, modeling fees, and profit margin in one formula
- **Flexible filament pricing** — choose between weighted average, last-paid price, or a fixed price per gram for each filament line
- **Printer profiles** — store printer specs (power draw, purchase price, expected lifetime) and reuse them across calculations
- **Saved calculations & inventory** — track how many times each project has been printed, sold, or gifted
- **Customer management** — assign calculations to customers with payment method and discount metadata
- **Templates** — save a calculation as a reusable template to prefill new jobs instantly
- **Full data portability** — export the entire database to JSON and re-import it at any time; all data lives in the browser's IndexedDB
- **Installable PWA** — works offline, installs to the home screen on desktop and mobile

## 🚀 Demo / Screenshots

<!-- TODO: Add screenshot or demo GIF here -->

## 🛠 Tech Stack

| Technology | Role |
|---|---|
| Angular 22 (standalone components) | UI framework |
| Angular Router | Client-side routing |
| Angular Service Worker | Offline / PWA caching |
| Angular Reactive Forms | Form state and validation |
| IndexedDB via `idb` | Local-only persistence (no backend) |
| RxJS | Reactive state bridges |
| TypeScript 6 | Type-safe domain model |
| Vitest | Unit tests |
| Prettier | Code formatting |
| GitHub Actions + GitHub Pages | CI/CD and static hosting |

## 📦 Getting Started

### Prerequisites

- Node.js 22+
- npm 11+

### Installation

```bash
git clone https://github.com/<your-username>/PrintCost.git
cd PrintCost
npm install
npm start
```

Open `http://localhost:4200` in your browser. The app runs fully in-browser — no backend required.

## ⚙️ Configuration

PrintCost is entirely client-side. There are no environment variables or external services to configure.

Default settings (electricity price, currency, profit margin defaults, etc.) are seeded into IndexedDB on first launch via `DEFAULT_SETTINGS` in `src/app/domain/models/storage.models.ts` and can be changed per-device from the **More** tab in the app.

## 🗂 Project Structure

```
src/app/
├── features/
│   ├── calculate/     # Cost calculator — main entry point
│   ├── filaments/     # Filament library with purchase history
│   ├── inventory/     # Saved print jobs, sales, and gifted tracking
│   └── more/          # Printer profiles, customers, settings, backup
├── core/
│   ├── db/            # IndexedDB schema and open/seed helpers
│   ├── backup/        # JSON export and import service
│   ├── calculations/  # Calculation CRUD service
│   ├── filaments/     # Filament CRUD and price-mode resolution
│   ├── printers/      # Printer profile CRUD
│   ├── customers/     # Customer CRUD
│   └── settings/      # Per-device settings persistence
├── domain/
│   ├── calculation/   # Pure calculation engine (no Angular deps)
│   └── models/        # IndexedDB record types and backup format
└── shared/            # Page header component, number-input directive
docs/
├── deployment/        # Static hosting and CSP notes
└── quality/           # Lighthouse baseline config
```

## 🔒 Privacy & Security

All data is stored locally in the browser's IndexedDB. The CSP in `src/index.html` blocks all outbound network connections (`connect-src 'none'`), so no data can be sent to any server — including during normal app operation.

## 🗺 Roadmap

These are ideas being explored — nothing is committed or scheduled yet.

- **Manual refactor** — clean up the AI-sprint rough edges, improve code structure and consistency
- **Optional cloud sync** — self-hosted or bring-your-own-cloud backup so data can move between devices without sacrificing the privacy-first model
- **Bambu Lab integration** — pull print time, material usage, or job data directly from a Bambu printer (subject to API availability)
- **More to explore** — different architectures, new features, and whatever else turns out to be useful in practice

## 🤝 Contributing

Pull requests are welcome. Before submitting:

```bash
npm run verify:release   # tests + production build + CSP check + Lighthouse baseline
```

All checks must pass. There is no `CONTRIBUTING.md` yet — open an issue first for non-trivial changes.

## 📄 License

<!-- TODO: Add license file and specify license here -->
