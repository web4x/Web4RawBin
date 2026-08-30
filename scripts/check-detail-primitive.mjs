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

// A (R37.26 gate-widen, architect design 0f6437824) — GLOB-DISCOVERY hazard scan, INHERITANCE-AGNOSTIC. The OLD A keyed
// on `this.graph` (a proxy for "renders unit fields") → it was BLIND to escapees that render unit fields via their OWN
// fetch(/api/ior) and never touch this.graph (rb-file/webitem/feature/modelelement — AND rb-profile would have hidden the
// same way). New rule: glob EVERY trace/*-detail.ts that REGISTERS a custom element; each MUST either extend RbDetailBase
// (the primitive: ONE funnel + one-model-source + fail-loud) OR be a declared DETAIL_ARTIFACT (own-source content, NOT a
// scenario-unit-field read — each reason must satisfy that STRUCTURAL test, earned not grandfathered). Anything else =
// an escapee rolling its own funnel/fetch/fail → RED. Keys on extends-RbDetailBase STRUCTURALLY + glob, NEVER a name
// pattern (else the gate is specimen #5 of its own family). So a future non-inheritor is SEEN, not blind-passed.
const DETAIL_ARTIFACTS = {
  'rb-terminal-detail': 'live ws /terminal pty — own source, not a scenario-unit',
  'rb-diagram-detail': 'diagram artifact SVG render — own source, not a scenario-unit',
  'rb-profile-detail': 'feature-manager granted-user masked view — own source, not a scenario-unit',
};
const ARTIFACT_CEILING = 3; // delta-gate: the exempt set may only SHRINK; raising this is a deliberate reviewed edit
const classifyDetail = (src) => {
  if (!/customElements\.(define|get)\s*\(/.test(src)) return { kind: 'unregistered' }; // not a registered element → out of scope
  const tag = (src.match(/customElements\.define\s*\(\s*['"]([^'"]+)['"]/) || [])[1] || '';
  if (/class\s+\w+\s+extends\s+RbDetailBase\b/.test(src)) return { kind: 'primitive', tag };
  if (tag && Object.prototype.hasOwnProperty.call(DETAIL_ARTIFACTS, tag)) return { kind: 'artifact', tag };
  return { kind: 'escapee', tag };
};
// SELF-BITE: the classifier MUST flag a planted escapee (extends HTMLElement, tag NOT listed), pass a base-extender, and
// exempt a listed artifact — else the glob-discovery is inert (a gate that can't catch a planted non-inheritor is vacuous).
const _bE = classifyDetail(`class RbZzzDetail extends HTMLElement {}\ncustomElements.define('rb-zzz-detail', RbZzzDetail);`);
const _bP = classifyDetail(`class RbZzzDetail extends RbDetailBase {}\ncustomElements.define('rb-zzz-detail', RbZzzDetail);`);
const _bA = classifyDetail(`class RbTerminalDetail extends HTMLElement {}\ncustomElements.define('rb-terminal-detail', RbTerminalDetail);`);
if (_bE.kind !== 'escapee' || _bP.kind !== 'primitive' || _bA.kind !== 'artifact') {
  console.error(`✗ check-detail-primitive A SELF-BITE FAILED (escapee=${_bE.kind}, primitive=${_bP.kind}, artifact=${_bA.kind}) — the glob-discovery classifier is INERT.`); process.exit(1);
}
const detailFiles = readdirSync(TRACE).filter((f) => f.endsWith('-detail.ts') && f !== 'rb-detail-base.ts');
const A = { scanned: [], primitive: [], artifact: [], escapee: [] };
for (const f of detailFiles) {
  const c = classifyDetail(read(f));
  if (c.kind === 'unregistered') continue;
  A.scanned.push(f);
  if (c.kind === 'primitive') A.primitive.push(f);
  else if (c.kind === 'artifact') A.artifact.push(`${c.tag}: ${DETAIL_ARTIFACTS[c.tag]}`);
  else A.escapee.push(`${f}${c.tag ? ` [${c.tag}]` : ''}`);
}
if (A.escapee.length) fails.push(`A GLOB-DISCOVERY: ${A.escapee.length} *-detail element(s) neither extend RbDetailBase nor are a declared DETAIL_ARTIFACT → migrate to the primitive OR add to DETAIL_ARTIFACTS with a structural (own-source, not-a-scenario-unit) reason: ${A.escapee.join(', ')}`);
if (Object.keys(DETAIL_ARTIFACTS).length > ARTIFACT_CEILING) fails.push(`A DELTA-GATE: DETAIL_ARTIFACTS has ${Object.keys(DETAIL_ARTIFACTS).length} entries > CEILING ${ARTIFACT_CEILING} — the exempt set may only SHRINK; raise the ceiling only as a deliberate reviewed edit`);

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
console.log(`✓ check-detail-primitive GREEN — A(glob-discovery): ${A.scanned.length} *-detail scanned / ${A.primitive.length} on RbDetailBase / ${A.artifact.length} exempt artifact(s) [${A.artifact.join(' ; ')}] / 0 escapees (self-bite live, ceiling ${ARTIFACT_CEILING}) · B: _shownRef/_shownType single-writer (1 site each) · C: base announces on every render (${announceCalls}×).`);
