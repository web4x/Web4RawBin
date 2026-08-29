// R37.24 inc2 HAZARD-GATE (by-CONSTRUCTION, scan-the-hazard by DERIVED PROPERTY — never an 8-list, which is the hand-list
// that let Tron's original defect ship past check:pin-single-source). Makes the ONE-detail-primitive elimination hold
// against DECAY instead of by discipline. Three assertions (architect 041c6f7b3 + backstop of e55e5de7e):
//   A  UNIT-FIELD FUNNEL UNEVADABLE: a component that renders a scenario-graph UNIT's fields (it reads `this.graph` for
//      the head) MUST extend RbDetailBase. A NEW chain-unit-detail rolling its OWN funnel (extends HTMLElement + reads
//      this.graph) REDs automatically. Artifact elements (file bytes / terminal / SVG / profile form / room collection —
//      their content comes from their OWN source, NOT a scenario-unit-field read) are OUT by the stated criterion.
//   B  _shownRef SINGLE-WRITER: exactly ONE assignment site each for _shownRef/_shownType in rb-detail-drawer.ts. A 2nd
//      writer reopens the split-holder class the moment it is added in good faith → RED (the memo is safe by construction,
//      not by convention).
//   C  BASE DISPATCHES ON EVERY RENDER: RbDetailBase announces rb-drawer-detail-shown on BOTH render paths (content AND
//      honest-empty) — announceShown called ≥2, the dispatch present. A render-without-dispatch = the bar memo goes stale
//      vs the content → RED.
// Run: node scripts/check-detail-primitive.mjs   (exit 0 GREEN / 1 RED). STUB-MUST-FAIL: add a 2nd `this._shownRef =`
// (B REDs), remove an announceShown call (C REDs), or add a rb-x-detail reading this.graph without extending the base (A REDs).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TRACE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/public/ts/trace');
const read = (f) => readFileSync(path.join(TRACE, f), 'utf-8');
const fails = [];

// A — unit-field elements must be on the primitive. Key on the DERIVED property (renders unit fields ⇒ reads this.graph),
// NOT a name-list. Artifacts render own-source content (no this.graph unit-field read) ⇒ excluded by criterion.
const detailFiles = readdirSync(TRACE).filter((f) => (f.endsWith('-detail.ts') || f === 'rb-detail-view.ts') && f !== 'rb-detail-base.ts');
const hazards = detailFiles.filter((f) => { const s = read(f); return !/extends\s+RbDetailBase/.test(s) && /this\.graph\b/.test(s); });
const onBase = detailFiles.filter((f) => /extends\s+RbDetailBase/.test(read(f)));
if (hazards.length) fails.push(`A UNIT-FIELD-FUNNEL: ${hazards.length} unit-field detail element(s) render a scenario unit's fields (read this.graph) with their OWN funnel instead of extending RbDetailBase — migrate to the primitive: ${hazards.join(', ')}`);

// B — single-writer memo, by construction.
const drawer = read('rb-detail-drawer.ts');
const sr = (drawer.match(/this\._shownRef\s*=/g) || []).length;
const st = (drawer.match(/this\._shownType\s*=/g) || []).length;
if (sr !== 1) fails.push(`B _shownRef SINGLE-WRITER: expected EXACTLY 1 assignment site, found ${sr} (a 2nd writer reopens the split-holder class → the bar can target a unit the user is not reading)`);
if (st !== 1) fails.push(`B _shownType SINGLE-WRITER: expected EXACTLY 1 assignment site, found ${st}`);

// C — base announces on every render path.
const base = read('rb-detail-base.ts');
const announceCalls = (base.match(/this\.announceShown\(/g) || []).length;
if (!/rb-drawer-detail-shown/.test(base)) fails.push('C BASE-DISPATCH: RbDetailBase no longer dispatches rb-drawer-detail-shown → the action-bar memo goes stale vs the content');
if (announceCalls < 2) fails.push(`C BASE-DISPATCH-EVERY-RENDER: announceShown called ${announceCalls}× — EVERY render path (content + honest-empty) must announce (≥2), else a render leaves the bar showing the previous unit's verbs`);

if (fails.length) { console.error('✗ check-detail-primitive FAILED (R37.24 inc2 elimination has DECAYED):\n' + fails.map((x) => '  ✗ ' + x).join('\n')); process.exit(1); }
console.log(`✓ check-detail-primitive GREEN — A: ${onBase.length} unit-field detail elements on RbDetailBase, 0 own-funnel hazards (${detailFiles.length} scanned; artifacts excluded by the no-unit-field-read criterion) · B: _shownRef/_shownType single-writer (1 site each) · C: base announces on every render (${announceCalls}×).`);
