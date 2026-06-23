import { readFileSync } from 'node:fs';

const path = new URL('../docs/quality/lighthouse-baseline.json', import.meta.url);
const report = JSON.parse(readFileSync(path, 'utf8'));

const performance = report.mobile_performance_score;
const pwa = report.pwa_score;
const hasWaiver = Boolean(report.waiver?.active && report.waiver?.reason);

if (typeof performance === 'number' && typeof pwa === 'number') {
  if (performance < 85 || pwa < 90) {
    console.error(`Lighthouse scores below target. Performance=${performance}, PWA=${pwa}`);
    process.exit(1);
  }

  console.log(`Lighthouse scores valid. Performance=${performance}, PWA=${pwa}`);
  process.exit(0);
}

if (!hasWaiver) {
  console.error('Lighthouse scores missing and no explicit waiver present in docs/quality/lighthouse-baseline.json');
  process.exit(1);
}

console.log(`Lighthouse waiver active: ${report.waiver.reason}`);

