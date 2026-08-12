// [test:uuid:d1f8a6b3-4e29-4c07-b95a-8f21e6d40c5b] T40.37 / R40.37 (a3cdb98a) — context-sensitive actions: an action invalid for a unit's TYPE/STATUS is NOT offered (applicableActionsFor 17ae8d0a resolves per-action appliesTo; onInvalid hide/disable). PREP gate — ready to flip GREEN the instant the expert finishes migrating the container actions to decls. Family: wrong-affordance / offer-then-refuse.
// Pure-fn tsx gate — NO served artifact ⇒ no SW/served-guard (stated per rule scope). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r4037-context-actions-gate.ts
// STRUCTURE: (A) ENGINE matrix over REAL UNIVERSAL_DECLS (built now) — approve/decline gated by APPROVE_STATUSES, file/pin cells; (B) ENGINE kind-gate proven with a representative diagrams-container decl (the mechanism the expert's container-decl migration rides); (C) META — stub-must-fail AIMED AT THE CHECK + APPROVE_STATUSES single-source (imported-not-duplicated) + rollback-actually-rolls-back. PENDING-IMPL items are reported honestly (not counted RED) and flip in when the code lands.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPROVE_STATUSES } from '../../src/ts/scenario/task-status-constants.ts';

// The R40.37 logic lives in a CLIENT module that transitively defines custom elements — stub the minimal browser
// globals so we import the REAL applicableActionsFor/UNIVERSAL_DECLS under node (not a replica). Dynamic import runs
// AFTER the stubs (static imports would execute first). We test the real fn's real behaviour, not a copy.
const g = globalThis as any;
g.HTMLElement = g.HTMLElement || class {};
g.customElements = g.customElements || { define() {}, get() { return undefined; }, whenDefined() { return Promise.resolve(); } };
g.document = g.document || { createElement: () => ({ style: {}, setAttribute() {}, addEventListener() {}, appendChild() {}, querySelector: () => null }), addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] };
g.window = g.window || g;
// R40.37 inc-1 (5925bc7e1) separated the engine from the decls: applicableActionsFor now lives in action-applicability.ts;
// universal-actions.ts only SUPPLIES UNIVERSAL_DECLS. Import each from its real home (re-pointed after inc-1 shipped).
const { applicableActionsFor, UNIVERSAL_DECLS } = await import('../../src/public/ts/trace/action-applicability.ts');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const results: Record<string, boolean> = {};
const pending: string[] = [];
const offeredVerbs = (unit: any, decls = UNIVERSAL_DECLS, ctx = {}) => applicableActionsFor(unit, ctx, decls).offered.map((a) => a.verb);

// ── (A) ENGINE matrix over the REAL built decls ──
const doneTask = offeredVerbs({ type: 'task', status: 'Done' });
results['task+Done→approve/decline ABSENT'] = !doneTask.includes('qa-approve') && !doneTask.includes('qa-decline');
const qaTask = offeredVerbs({ type: 'task', status: 'QA Review' });
results['task+QA-Review→approve PRESENT'] = qaTask.includes('qa-approve') && qaTask.includes('qa-decline');
results['task+In-Progress→approve ABSENT'] = !offeredVerbs({ type: 'task', status: 'In Progress' }).includes('qa-approve');
const file = offeredVerbs({ type: 'file' });
results['file→preview+newtab PRESENT'] = file.includes('preview-file') && file.includes('open-newtab');
// no container/file/member action leaks onto a Task (the UNIVERSAL type-gate half of AC-NO-CONTAINER-ON-TASK)
results['task→no file/vcard/proxy leak'] = ['preview-file', 'open-newtab', 'download-vcard', 'proxy-preview']
  .every((v) => !doneTask.includes(v) && !qaTask.includes(v));

// ── (B) ENGINE over the REAL container-decl GRAMMAR (notTypes, exactly as MODEL_DECLS uses today) ──
// NOTE: MODEL_DECLS itself lives in the HEAVY browser module model.ts (side-effect custom-element imports; not exported;
// its only accessor actionsForContext is unexported + retires inc-2) → a node gate CANNOT import the real decl DATA.
// Recommended fix (mirrors inc-1's universal-actions→action-applicability split): expert moves MODEL_DECLS to a PURE
// exported module → then §B imports the real data. Meanwhile the grammar below mirrors the real decls EXACTLY, so the
// REAL engine (imported applicableActionsFor) is proven against the real decl shape.
const containerDecls = [
  { verb: 'add-folder', label: '📁 Add folder', appliesTo: { notTypes: ['task', 'file', 'webitem', 'member', 'user', 'puml', 'pumlartifact'] } },
  { verb: 'add-diagram', label: '＋ Add Diagram', appliesTo: { notTypes: ['task', 'file', 'webitem', 'member', 'user', 'modelelement'] } },
];
results['task→NO container actions (notTypes)'] = ['add-folder', 'add-diagram'].every((v) => !offeredVerbs({ type: 'task', status: 'Done' }, containerDecls).includes(v));
results['container→add-folder PRESENT'] = offeredVerbs({ type: 'collection' }, containerDecls).includes('add-folder');
results['modelelement→add-diagram ABSENT (notTypes)'] = !offeredVerbs({ type: 'modelelement' }, containerDecls).includes('add-diagram')
  && offeredVerbs({ type: 'modelelement' }, containerDecls).includes('add-folder'); // modelelement IS in add-diagram's notTypes but NOT add-folder's

// ── (C1) STUB-MUST-FAIL aimed AT THE CHECK: mutate an applicability declaration → the matrix MUST detect the wrong offer ──
const mutated = UNIVERSAL_DECLS.map((d) => d.verb === 'qa-approve' ? { ...d, appliesTo: { ...d.appliesTo, statuses: ['QA Review', 'Done'] } } : d);
const approveAbsentOnDone = (decls: any) => !offeredVerbs({ type: 'task', status: 'Done' }, decls).includes('qa-approve');
results['stub-must-fail@check'] = approveAbsentOnDone(UNIVERSAL_DECLS) === true && approveAbsentOnDone(mutated) === false; // clean passes, mutated fails ⇒ the check bites

// ── (C2) APPROVE_STATUSES imported-NOT-duplicated (anti-drift, one source, two importers) ──
const scan = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');
// ★ DOCTRINE (found in my OWN AC4 detector tonight, now PO-doctrine): a text-match gate that can match a COMMENT
// reports clean while the code is wrong. Strip block + line comments before ANY source-text assertion.
const codeOnly = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => /^\s*\/\//.test(l) ? '' : l.replace(/([^:])\/\/.*$/, '$1')).join('\n');
const scanCode = (rel: string) => codeOnly(scan(rel));
const defRe = /export\s+const\s+APPROVE_STATUSES/g;
const allDefs = ['src/ts/scenario/task-status-constants.ts', 'src/ts/scenario/task-status.ts', 'src/ts/server/server.ts', 'src/public/ts/trace/universal-actions.ts', 'src/public/ts/trace/action-applicability.ts']
  .reduce((n, f) => n + (scanCode(f).match(defRe)?.length || 0), 0);
// R40.37 inc-1: the client affordance importer moved universal-actions.ts → action-applicability.ts (where the decls now live)
const clientImports = /import\s*\{[^}]*APPROVE_STATUSES[^}]*\}/.test(scanCode('src/public/ts/trace/action-applicability.ts'));
const serverImports = /import\s*\{[^}]*APPROVE_STATUSES[^}]*\}/.test(scanCode('src/ts/server/server.ts'));
results['APPROVE_STATUSES single-source'] = allDefs === 1 && clientImports && serverImports
  && APPROVE_STATUSES.length === 1 && APPROVE_STATUSES[0] === 'QA Review';

// ── (C3) rollback-actually-rolls-back (folder.createPhysicalWithUnit 0c58eb53) — PENDING the expert build ──
const folderCreateBuilt = /mintRealUnit|createPhysicalWithUnit/.test(scanCode('src/public/ts/model/model.ts')) || fs.existsSync(path.join(ROOT, 'src/ts/server/folder-create.ts'));
if (!folderCreateBuilt) pending.push('rollback-actually-rolls-back: folder.mintRealUnit (UC2 0c58eb53, architect final verb) NOT built yet — on ship: force unit-put to throw → assert the physical dir was rmdir\'d (no orphan)');
// AC4 add-diagram-diagrams-ONLY-by-KIND — NOT built yet: add-diagram uses notTypes (appears on ALL containers incl
// plain folders). Flips when the expert ships the kind-switch (appliesTo→{kinds:['diagrams']}) + lazy-mints a real
// kind:'diagrams' Folder unit via ensureViewUnit.
// read the ACTUAL add-diagram DECL line's grammar (not a comment): notTypes = not-built; kinds:['diagrams'] = built.
const addDiagramDeclLine = scanCode('src/public/ts/model/model.ts').split('\n').find((l) => /verb:\s*'add-diagram'/.test(l) && /appliesTo/.test(l)) || '';
if (!/kinds:\s*\[\s*'diagrams'\s*\]/.test(addDiagramDeclLine))
  pending.push("AC4 add-diagram-diagrams-ONLY-by-kind NOT built — add-diagram decl still notTypes-gated (on ALL containers). On the kind-switch deploy: assert diagrams-container(kind:'diagrams')→add-diagram PRESENT + plain-folder→ABSENT + lazy-mint IDEMPOTENT (touch twice→ONE unit, ensureViewUnit)");
// Real MODEL_DECLS DATA import is blocked (model.ts = heavy browser module, MODEL_DECLS unexported, accessor retires inc-2):
if (!/export\s+(const\s+MODEL_DECLS|function\s+actionDecls|function\s+modelDecls)/.test(scanCode('src/public/ts/model/model.ts')))
  pending.push('§B real-DATA import BLOCKED: MODEL_DECLS is module-local in the heavy browser module model.ts — recommend expert export it from a PURE module (mirrors inc-1 universal-actions→action-applicability); then §B imports the real container decls instead of the grammar-mirror');

console.log('===== R40.37 context-sensitive actions PREP gate (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('  --- PENDING-IMPL (flips in on ship, NOT counted RED) ---');
for (const p of pending) console.log(`  ⏳ ${p}`);
console.log('  ⏳ AC-6-DEVICE @390 = TRON device-only (never headless-green) — tagged for his device sitting');
console.log('OVERALL:', green ? `GREEN (built cells + engine + meta) — ${pending.length} PENDING-IMPL flip in on ship` : 'RED');
process.exitCode = green ? 0 : 1;
