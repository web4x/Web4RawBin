/**
 * T37.21 defect-3 — byte-format single-source gate (Tron: the sunburst showed raw "10916416 / 43 / 4717922"). Enforce.
 *
 * INVARIANT: human byte formatting lives in EXACTLY ONE place — src/public/ts/format-bytes.ts (formatBytes). No other
 *   client module may hand-roll `size / 1024` size math (the ad-hoc `Math.round(size/1024) KB` / `(size/1024).toFixed(1)`
 *   copies + the sunburst's raw integers were the exact defect). A 4th copy cannot drift back in undetected.
 * FAILS (exit 1): a `/ 1024` byte-size division anywhere in src/public/ts except format-bytes.ts (comments stripped so a
 *   doc-mention of the old pattern does not trip it). Self-bites first.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'src/public/ts');
const ALLOWED = path.join(PUBLIC, 'format-bytes.ts');
const IDIOM = /\/\s*1024/; // the byte-size division idiom

function findTs(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...findTs(p));
    else if (/\.ts$/.test(ent.name)) out.push(p);
  }
  return out;
}

// strip a trailing // line-comment and full-line /* */ so a doc-mention of "/1024" isn't flagged (crude but sufficient here).
function stripComments(line) {
  return line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
}

// --- SELF-BITE: the detector must catch a real division, and must NOT catch a comment mention ---
if (!IDIOM.test(stripComments('const kb = size / 1024;'))) { console.error('✗ SELF-BITE FAILED — the idiom matcher is inert.'); process.exit(1); }
if (IDIOM.test(stripComments('// was an inline /1024 copy'))) { console.error('✗ SELF-BITE FAILED — the matcher flags comments (false positives).'); process.exit(1); }

const violations = [];
for (const f of findTs(PUBLIC)) {
  if (f === ALLOWED) continue;
  const lines = fs.readFileSync(f, 'utf-8').split('\n');
  lines.forEach((line, i) => { if (IDIOM.test(stripComments(line))) violations.push([path.relative(ROOT, f), i + 1, line.trim().slice(0, 90)]); });
}

console.log(`=== T37.21 byte-format single-source (the ONE formatter: ${path.relative(ROOT, ALLOWED)}) ===`);
if (violations.length) {
  console.error('\n✗ FAIL — hand-rolled byte-size math outside format-bytes.ts (use formatBytes()):');
  for (const [f, ln, txt] of violations) console.error(`  ${f}:${ln}  ${txt}`);
  process.exit(1);
}
console.log('\n✓ PASS — 0 hand-rolled `/1024` byte formatting in the client outside format-bytes.ts (formatBytes is the single source).');
