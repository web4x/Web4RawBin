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
const { applicableActionsFor, UNIVERSAL_DECLS } = await import('../../src/public/ts/trace/universal-actions.ts');

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

// ── (B) ENGINE kind-gate proven with a representative diagrams-container decl (the mechanism the container migration rides) ──
const addDiagramDecl = [{ verb: 'add-diagram', label: '＋ Add Diagram', appliesTo: { kinds: ['diagrams'] } }];
results['diagrams-container→add-diagram PRESENT'] = offeredVerbs({ type: 'collection', kind: 'diagrams' }, addDiagramDecl).includes('add-diagram');
results['plain-folder→add-diagram ABSENT'] = !offeredVerbs({ type: 'collection', kind: 'folder' }, addDiagramDecl).includes('add-diagram');
results['task→add-diagram ABSENT'] = !offeredVerbs({ type: 'task', status: 'Done' }, addDiagramDecl).includes('add-diagram');

// ── (C1) STUB-MUST-FAIL aimed AT THE CHECK: mutate an applicability declaration → the matrix MUST detect the wrong offer ──
const mutated = UNIVERSAL_DECLS.map((d) => d.verb === 'qa-approve' ? { ...d, appliesTo: { ...d.appliesTo, statuses: ['QA Review', 'Done'] } } : d);
const approveAbsentOnDone = (decls: any) => !offeredVerbs({ type: 'task', status: 'Done' }, decls).includes('qa-approve');
results['stub-must-fail@check'] = approveAbsentOnDone(UNIVERSAL_DECLS) === true && approveAbsentOnDone(mutated) === false; // clean passes, mutated fails ⇒ the check bites

// ── (C2) APPROVE_STATUSES imported-NOT-duplicated (anti-drift, one source, two importers) ──
const scan = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');
const defRe = /export\s+const\s+APPROVE_STATUSES/g;
const allDefs = ['src/ts/scenario/task-status-constants.ts', 'src/ts/scenario/task-status.ts', 'src/ts/server/server.ts', 'src/public/ts/trace/universal-actions.ts']
  .reduce((n, f) => n + (scan(f).match(defRe)?.length || 0), 0);
const clientImports = /import\s*\{[^}]*APPROVE_STATUSES[^}]*\}/.test(scan('src/public/ts/trace/universal-actions.ts'));
const serverImports = /import\s*\{[^}]*APPROVE_STATUSES[^}]*\}/.test(scan('src/ts/server/server.ts'));
results['APPROVE_STATUSES single-source'] = allDefs === 1 && clientImports && serverImports
  && APPROVE_STATUSES.length === 1 && APPROVE_STATUSES[0] === 'QA Review';

// ── (C3) rollback-actually-rolls-back (folder.createPhysicalWithUnit 0c58eb53) — PENDING the expert build ──
const folderCreateBuilt = /createPhysicalWithUnit/.test(scan('src/public/ts/model/model.ts')) || fs.existsSync(path.join(ROOT, 'src/ts/server/folder-create.ts'));
if (!folderCreateBuilt) pending.push('rollback-actually-rolls-back: folder.createPhysicalWithUnit (0c58eb53) NOT built yet — on ship: force unit-put to throw → assert the physical dir was rmdir\'d (no orphan)');
// Also flag the container-action DECL migration (model.ts still per-context arrays, not ActionDecl+appliesTo):
if (!/appliesTo/.test(scan('src/public/ts/model/model.ts'))) pending.push('container-action decl migration: model.ts add-diagram/add-folder/import-puml still per-context arrays (not ActionDecl+appliesTo) — on migration, import the REAL container decls and assert AC-DIAGRAMS-SPECIAL + AC-NO-CONTAINER-ON-TASK against them (§B currently proves the ENGINE, not the real decls)');

console.log('===== R40.37 context-sensitive actions PREP gate (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
console.log('  --- PENDING-IMPL (flips in on ship, NOT counted RED) ---');
for (const p of pending) console.log(`  ⏳ ${p}`);
console.log('  ⏳ AC-6-DEVICE @390 = TRON device-only (never headless-green) — tagged for his device sitting');
console.log('OVERALL:', green ? `GREEN (built cells + engine + meta) — ${pending.length} PENDING-IMPL flip in on ship` : 'RED');
process.exitCode = green ? 0 : 1;
