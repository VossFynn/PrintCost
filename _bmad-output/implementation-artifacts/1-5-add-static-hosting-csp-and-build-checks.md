---
baseline_commit: a26f68e81cff34b78d3cf1546b0e53de6fc81d82
---

# Story 1.5: Add Static Hosting, CSP, and Build Checks

Status: review

## Story

As a maker,  
I want PrintCost deployed as a safe static app,  
so that my data never leaves my browser unless I export it.

## Acceptance Criteria

1. **Given** deployment configuration exists, **when** production app is built, **then** output is compatible with GitHub Pages static hosting, **and** no backend service is required.
2. **Given** hosted security settings are documented or configured, **when** app is deployed, **then** intended CSP includes `connect-src 'none'`, **and** only self-hosted scripts/styles/fonts/local images plus `data:` images are allowed.
3. **Given** CI or local verification scripts run, **when** project is checked, **then** unit tests, production build, and bundle-budget checks run where practical, **and** failures are visible to implementers.
4. **Given** PWA quality verification runs, **when** Lighthouse or equivalent checks execute, **then** PWA score target >= 90 and mobile performance target >= 85 are recorded, **and** waiver is explicit in project docs if unmet.

## Tasks / Subtasks

- [x] Configure static-hosting output for GitHub Pages compatibility (AC: 1)
  - [x] Confirm/adjust build base-href/deploy-url strategy for static path hosting.
  - [x] Ensure no runtime dependency on backend/API availability.
- [x] Add and document CSP baseline (AC: 2)
  - [x] Define static-host compatible CSP with `connect-src 'none'`.
  - [x] Allow only required self/data sources for current PWA assets and local fonts.
  - [x] Document deployment instructions and CSP placement (headers/meta, hosting notes).
- [x] Add visible verification workflow (AC: 3)
  - [x] Ensure repeatable commands/scripts for tests + production build + budget checks.
  - [x] Keep output actionable so failures are obvious to implementers.
- [x] Add PWA/performance quality check path (AC: 4)
  - [x] Add Lighthouse (or equivalent) execution/documentation for PWA/performance targets.
  - [x] Capture baseline result and waiver mechanism when targets missed.

## Dev Notes

### Epic Context

Story 1.5 hardens deployability and trust boundaries for local-only MVP. It finishes foundation phase by enforcing static-host and quality gate discipline.

### Implementation Guardrails

- MVP is static-hosted and local-only; no backend or hidden data transfer.  
  [Source: ARCHITECTURE-SPINE AD-10]
- CSP must deny network connections (`connect-src 'none'`) for hosted envelope.
- Keep PWA shell/build behavior from Stories 1.1 and 1.4 intact.
- Failures in checks must be visible; no silent pass-through.

### Technical Requirements

- Static hosting:
  - Build artifacts runnable from GitHub Pages path
  - Correct handling for SPA route refresh fallback strategy in docs/config
- Security:
  - CSP source constraints aligned with self-hosted scripts/styles/fonts/assets and `data:` images only
  - No external runtime fonts/analytics/scripts
- Verification:
  - Unit tests + production build + bundle budget checks in repeatable command set
  - Lighthouse/PWA checks and documented score thresholds

### File Structure Requirements

- Likely touched:
  - Build/deployment configuration (`angular.json`, package scripts, optional workflow files)
  - Hosting docs/config files
  - CSP documentation/headers config
- Avoid changes to domain/business feature code.

### Testing Requirements

- Validate:
  - Static-host production build output
  - Existing unit tests remain green
  - Bundle budgets enforced
  - Lighthouse/PWA quality report path works

### Previous Story Intelligence

- Story 1.1 established shell + build baseline.
- Story 1.4 adds service worker/offline behavior; Story 1.5 must preserve it while adding deployment/security constraints.
- Keep local-only promise explicit and testable.

### References

- `_bmad-output/planning-artifacts/epics.md` — Story 1.5 acceptance criteria
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/ARCHITECTURE-SPINE.md` — AD-10, AD-11
- `_bmad-output/planning-artifacts/architecture/architecture-PrintCost-2026-06-23/IMPLEMENTATION-HANDOFF.md` — Build order step 7; hosted/local-only constraints
- `_bmad-output/prd.md` — Delivery plan + success metrics/budget expectations

## Dev Agent Record

### Agent Model Used

OpenAI GPT-5.3-Codex

### Debug Log References

- Story derived from Epic 1 final hardening requirements and architecture hosted envelope constraints.
- Story auto-selected from sprint status first ready story (`1-5-add-static-hosting-csp-and-build-checks`) and moved to `in-progress`.
- Red phase: strengthened route-shell tests for CSP requirement and confirmed failure before CSP implementation.
- Added CSP meta policy to `src/index.html` with `connect-src 'none'` and self-hosted asset directives.
- Added static-host and verification scripts to package scripts (`build:pages`, `verify:*`).
- Added verification utilities for CSP and Lighthouse baseline/waiver checks under `tools/`.
- Added deployment/CSP guidance and Lighthouse baseline waiver artifact in `docs/`.
- Added GitHub Pages workflow using `verify:release` + `build:pages` and deploy-pages action.
- Final validation run: `npm test`, `npm run verify:csp`, `npm run verify:lighthouse`, `npm run verify:quality`, and production build via Node 22 wrapper.

### Completion Notes List

- Context includes static-host + CSP contract and practical quality-gate expectations for implementation.
- Added explicit static-hosting build path for GitHub Pages via `npm run build:pages` (`--base-href /PrintCost/`).
- Added CSP with `connect-src 'none'` and source restrictions for scripts/styles/fonts/images/worker/manifest.
- Added repeatable verification workflow scripts so failures surface in terminal and CI (`verify:quality`, `verify:csp`, `verify:lighthouse`, `verify:release`).
- Added Lighthouse quality record path with explicit waiver mechanism when browser-capable runtime unavailable.
- Added CI deploy workflow that runs verification gates before publishing static artifact.

### File List

- `package.json`
- `package-lock.json`
- `angular.json`
- `src/index.html`
- `src/app/app.routes.spec.ts`
- `tools/verify-csp.mjs`
- `tools/verify-lighthouse-report.mjs`
- `docs/deployment/static-hosting.md`
- `docs/quality/lighthouse-baseline.json`
- `.github/workflows/pages.yml`
- `_bmad-output/implementation-artifacts/1-5-add-static-hosting-csp-and-build-checks.md`

## Change Log

- 2026-06-23: Created Story 1.5 implementation context; status set to `ready-for-dev`.
- 2026-06-23: Implemented static hosting build/deploy config, CSP hardening, release verification scripts, and Lighthouse baseline/waiver path; status set to `review`.
