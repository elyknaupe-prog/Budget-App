// Bakes pdf.js (library + worker) into template.html as base64, producing a
// single self-contained index.html with zero external dependencies.
//
//   node build.mjs
//
// Requires pdfjs-dist to be resolvable (it is vendored under ./vendor, and
// falls back to the client app's node_modules if present).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

function resolvePdfjs(name) {
  const candidates = [
    join(here, 'vendor', name),
    join(here, '..', 'client', 'node_modules', 'pdfjs-dist', 'build', name),
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(`Could not find ${name}. Run "npm install pdfjs-dist" or vendor the files under ./vendor.`);
}

const libB64 = readFileSync(resolvePdfjs('pdf.min.mjs')).toString('base64');
const workerB64 = readFileSync(resolvePdfjs('pdf.worker.min.mjs')).toString('base64');

const html = readFileSync(join(here, 'template.html'), 'utf8')
  .replace('__PDFJS_B64__', libB64)
  .replace('__WORKER_B64__', workerB64);

writeFileSync(join(here, 'index.html'), html);
console.log(`Wrote index.html (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
