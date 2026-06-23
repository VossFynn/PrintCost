# Static hosting and CSP

## GitHub Pages build

Use project root commands:

```bash
npm run build:pages
```

This creates static output compatible with repository-path hosting (`/PrintCost/`) and does not require backend services.

## Content Security Policy

PrintCost uses CSP in `src/index.html`:

```text
default-src 'self';
connect-src 'none';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
manifest-src 'self';
worker-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

Policy allows only self-hosted scripts/styles/fonts/assets plus `data:` images. Network connections are disabled with `connect-src 'none'`.

## Verification commands

```bash
npm run verify:quality
npm run verify:csp
npm run verify:lighthouse
npm run verify:release
```

`verify:release` is main gate. It runs tests, production build, CSP validation, and Lighthouse baseline validation.

## SPA refresh behavior

GitHub Pages must serve `index.html` for client routes (`/calculate`, `/inventory`, `/filaments`, `/more`) on refresh. Configure Pages 404 fallback to app shell if required by deployment setup.

