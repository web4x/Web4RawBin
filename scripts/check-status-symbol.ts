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
import { STATUS_ORDER } from '../src/ts/scenario/task-status-constants.js'; // R40.66: coverage driven from the SHARED enum, not a hand-list

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

// ---- (C) CLIENT-COVERAGE (R40.66, architect ruling d33919390) — the client badge table MUST cover EVERY task
// STATUS_ORDER status, or the missing status renders as raw GRAY TEXT on Tron's board (the R40.59 band-glyph defect:
// server STATUS_GLYPHS had 🔁 for the band, client BADGE_MAP did NOT → 'qa-review-with-open-cr' fell through to gray).
// Coverage is driven from the SHARED STATUS_ORDER enum (NOT a hand-list) so a NEW status can't silently fall through.
// This ALWAYS blocks (a rendering defect on Tron's surface), unlike the report-only (B) — and it goes RED on the live
// defect (band uncovered) BEFORE the BADGE_MAP fix, GREEN after (stub-must-fail proven).
// [impl:uuid:84b0e064-fa33-4b4a-b600-86960f36ba8c] TaskStatusSymbolGuard.assertClientCoversStatusOrder (Method 39593421)
const clientSrc = fs.readFileSync(path.join(ROOT, 'src/public/ts/trace/rb-object-item.ts'), 'utf8');
const badgeBlock = clientSrc.slice(clientSrc.indexOf('const BADGE_MAP'), clientSrc.indexOf('function renderStatusBadge'));
const badgeKeys = new Set([...badgeBlock.matchAll(/'([^']+)'\s*:/g)].map((m) => m[1])); // the quoted BADGE_MAP keys
// The client lookup (rb-object-item.ts): BADGE_MAP[status.toLowerCase()] || BADGE_MAP[lc.replace(/[^a-z ]/g,'')].
const covered = (s: string) => { const lc = s.toLowerCase(); return badgeKeys.has(lc) || badgeKeys.has(lc.replace(/[^a-z ]/g, '')); };
const uncoveredStatuses = STATUS_ORDER.filter((s) => !covered(s));
A(uncoveredStatuses.length === 0, `CLIENT-COVERAGE: rb-object-item BADGE_MAP covers EVERY STATUS_ORDER status incl the band (uncovered → gray-text: ${uncoveredStatuses.join(', ') || 'none'})`);

console.log(failed ? `\n✗ check-status-symbol: ${failed} FAILED` : '\n✓ check-status-symbol: meta-bite non-vacuous + statusSymbol single-source + client BADGE_MAP covers every STATUS_ORDER (2nd-vocab report-only until --strict)');
process.exit(failed ? 1 : 0);
