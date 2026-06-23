import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const match = html.match(/<meta http-equiv="Content-Security-Policy"\s+content="([^"]+)"/);

if (!match) {
  console.error('CSP meta tag missing from src/index.html');
  process.exit(1);
}

const csp = match[1];
const required = [
  "connect-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:"
];

for (const directive of required) {
  if (!csp.includes(directive)) {
    console.error(`CSP directive missing: ${directive}`);
    process.exit(1);
  }
}

console.log('CSP verification passed');

