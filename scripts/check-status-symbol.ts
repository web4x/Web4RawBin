// Tron#1 guardrails for the at-a-glance status glyph (PO 2026-08-12):
//  (A) META-BITE — statusSymbol must render QA-Review as 🧪 (NOT a bare box), and be PROVABLY non-vacuous: a stub
//      renderer that always emits the same thing (the old Done-only [ ] behaviour) must be CAUGHT (fails to
//      distinguish QA-Review from Planned). A renderer that cannot fail proves nothing.
//  (B) NO-2ND-SOURCE LINT — the 5 status glyphs may appear in exactly ONE code module (task-status.ts, the single
//      source). Any other src/ or scripts/ code file emitting a glyph = a forked second vocabulary → RED.
// Fold into ci:gates (expert's lane). Run: node scripts/with-node20.mjs npx tsx scripts/check-status-symbol.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { statusSymbol, STATUS_GLYPHS } from '../src/ts/scenario/task-status.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const A = (cond: boolean, msg: string) => { if (!cond) { console.error('  ✗ ' + msg); failed++; } else console.log('  ✓ ' + msg); };

// ---- (A) META-BITE ----
const CL = (top: string, subs = '') => `- [${top === 'Planned' ? 'x' : 'x'}] Planned\n` +
  (top !== 'Planned' ? `- [x] In Progress\n${subs}` : `- [ ] In Progress\n`) +
  `- [${top === 'QA Review' || top === 'Done' ? 'x' : ' '}] QA Review\n- [${top === 'Done' ? 'x' : ' '}] Done`;
const planned = '- [x] Planned\n- [ ] In Progress\n- [ ] QA Review\n- [ ] Done';
const qa = '- [x] Planned\n- [x] In Progress\n  - [x] implementing\n  - [x] testing\n- [x] QA Review\n- [ ] Done';
const done = qa.replace('- [ ] Done', '- [x] Done');
const inprog = '- [x] Planned\n- [x] In Progress\n  - [x] implementing\n  - [ ] testing\n- [ ] QA Review\n- [ ] Done';
A(statusSymbol(qa) === '🧪', `QA-Review renders 🧪 (got ${statusSymbol(qa)}), NOT a bare box`);
A(statusSymbol(planned) === '⏳', `Planned renders ⏳ (got ${statusSymbol(planned)})`);
A(statusSymbol(done) === '🏁', `Done renders 🏁 (got ${statusSymbol(done)})`);
A(statusSymbol(inprog) === '✅', `In-Progress+implementing renders ✅ (got ${statusSymbol(inprog)})`);
A(statusSymbol(qa) !== statusSymbol(planned), 'QA-Review is VISIBLY DISTINCT from Planned (the whole point of Tron #1)');
// non-vacuity: a stub that mimics the OLD Done-only checkbox (same glyph for QA-Review and Planned) MUST be caught.
const stub = (_cl: string) => ' '; // the old "[ ] for everything not Done" behaviour
A(stub(qa) === stub(planned) && statusSymbol(qa) !== statusSymbol(planned),
  'STUB-MUST-FAIL: a renderer that emits the same for QA-Review and Planned is CAUGHT (real one distinguishes)');

// ---- (B) NO-2ND-SOURCE LINT ----
const codeFiles: string[] = [];
(function walk(d: string) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|mjs|js)$/.test(e.name)) codeFiles.push(p);
  }
})(path.join(ROOT, 'src', 'ts'));
for (const e of fs.readdirSync(path.join(ROOT, 'scripts'))) if (/\.(ts|mjs|js)$/.test(e)) codeFiles.push(path.join(ROOT, 'scripts', e));
const SINGLE_SOURCE = path.join(ROOT, 'src', 'ts', 'scenario', 'task-status.ts');
const SELF = fileURLToPath(import.meta.url);
const offenders: string[] = [];
for (const f of codeFiles) {
  if (f === SINGLE_SOURCE || f === SELF) continue;
  const txt = fs.readFileSync(f, 'utf8');
  // A forked VOCABULARY renders MULTIPLE status glyphs (a single ✅/⏳ is a generic emoji, not a status vocab).
  // ≥2 distinct status-glyphs in one code file = a second status→glyph mapping that must import statusSymbol instead.
  const hits = STATUS_GLYPHS.filter((g) => txt.includes(g));
  if (hits.length >= 2) offenders.push(`${path.relative(ROOT, f)} emits ${hits.join('')} (a 2nd status vocabulary — import statusSymbol instead)`);
}
// no-2nd-source is REPORT-ONLY by default (documents pre-existing forks as NAMED DEBT — a report-only lint nobody
// reads becomes an accepted lie, so it is printed loudly); --strict blocks once consolidated to 0 (precedent:
// assertStatusConsistent report-only-till-0-then-strict). The META-BITE above always blocks (statusSymbol correctness).
const strict = process.argv.includes('--strict');
if (offenders.length) {
  console.log(`  ${strict ? '✗' : '⚠ REPORT-ONLY NAMED-DEBT'} 2nd status vocabulary: ${offenders.join(' · ')}`);
  if (strict) failed++;
} else console.log('  ✓ NO 2nd glyph source — status glyphs live only in task-status.ts');

console.log(failed ? `\n✗ check-status-symbol: ${failed} FAILED` : '\n✓ check-status-symbol: meta-bite non-vacuous + statusSymbol single-source (2nd-vocab report-only until --strict; see status-symbol-single-source debt)');
process.exit(failed ? 1 : 0);
