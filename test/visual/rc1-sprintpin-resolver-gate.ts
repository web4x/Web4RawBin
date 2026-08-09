// [test:uuid:fc28b6f1-12de-4e86-8408-c6379914c74b] R-C1 resolveSprintPin af97137f — GOLDEN pin (current/last/next number-keyed) + DRIFT-invariance (rename→unchanged, INV-C1-8) + AMBIGUITY fail-loud (>1 Active throws, INV-C1-4) + FAIL-CLOSED unresolvable task ref throws (INV-C1-6). GREEN DET-3x.
// [test:uuid:507d7f41-537a-4b79-8371-85ca04013a45] R-C1 deriveSprintStatus 303639ce — status rollup via R-C5; empty tasks[] is NOT Closed (INV-C1-6 vacuous fail-closed; Done/Superseded kept distinct). GREEN DET-3x.
// [test:uuid:a5e5b856-9fdf-4bd3-88e6-c5d34fe0401d] R-C1 sprintSlugOf f326509a — 2-facet: (a) slug-from-on-disk-path NEVER slugify(model.name) (AC-no-name-derivation); (b) fail-closed-on-unresolvable-dir (no existing dir → null refuse, never fabricate — S20 vacuous-family sibling). GREEN DET-3x.
// [test:uuid:e6f99c46-23c9-4fa9-9717-404f6e0384e5] R-C1 sprintNumOf e0f62b6c — number from model.number|sprint-<N> path, NEVER parsed from free-text model.name (INV-C1-8). GREEN DET-3x.
// R-C1 SprintPinResolver gate (req GATES-READY on 65b93ad3f) — own-oracle, imports the REAL resolver, DET-3x.
// Verifies the 4 built impls: sprintNumOf e0f62b6c / sprintSlugOf f326509a / deriveSprintStatus 303639ce /
// resolveSprintPin af97137f. Facets (req's list): GOLDEN pin (current/last/next), DRIFT-invariance (rename → output
// unchanged), AMBIGUITY fail-loud (>1 Active throws), FAIL-CLOSED (unresolvable task ref throws; empty tasks ≠ Closed),
// sprintSlugOf 2-facet (slug-from-path-never-name + fail-closed-on-unresolvable-dir), sprintNumOf no-name-parse,
// and the INV-C1-8 no-name-parse STATIC LINT (0 slugify(...) + num/slug bodies never read .name). Pure + static = DET.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sprintNumOf, sprintSlugOf, deriveSprintStatus, resolveSprintPin } from '../../src/ts/scenario/sprint-pin-resolver.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RESOLVER_SRC = path.join(HERE, '../../src/ts/scenario/sprint-pin-resolver.ts');
const REAL_S37_DIR = 'sprint-37-consistency-by-construction'; // a real on-disk /sprints/ dir (verified live)

// ── fixture builders ──
type U = { ior: string; model: Record<string, unknown> };
const task = (uuid: string, status: 'Planned' | 'In Progress' | 'QA Review' | 'Done', supersededBy?: string): U => ({
  ior: 'ior:class:Task',
  model: {
    uuid,
    // deriveStatusEnum = highest-order CHECKED top-level box; check up to the target status
    statusChecklist: ['Planned', 'In Progress', 'QA Review', 'Done'].slice(0, ['Planned', 'In Progress', 'QA Review', 'Done'].indexOf(status) + 1).map((s) => `- [x] ${s}`).join('\n'),
    ...(supersededBy ? { supersededBy } : {}),
  },
});
const sprint = (uuid: string, number: number, name: string, taskUuids: string[]): U => ({
  ior: 'ior:class:Sprint',
  model: { uuid, number, name, tasks: taskUuids.map((t) => `ior:instance:${t}`) },
});
const mkIndex = (units: U[]) => {
  const map = new Map(units.map((u) => [String(u.model.uuid), u]));
  return { list: () => [...map.keys()], get: (u: string) => map.get(u) } as any;
};

function runChecks() {
  const c: Record<string, boolean> = {};

  // ── CHECK 1 — GOLDEN: S35 Closed / S36 QA-pending / S37 Active → current=S37, last=S35, next=none ──
  const golden = [
    sprint('s35', 35, 'Sprint 35 anything', ['t35a', 't35b']), task('t35a', 'Done'), task('t35b', 'Done'),
    sprint('s36', 36, 'Sprint 36 anything', ['t36a']), task('t36a', 'QA Review'),
    sprint('s37', 37, 'Sprint 37 anything', ['t37a', 't37b']), task('t37a', 'In Progress'), task('t37b', 'Done'),
  ];
  const gi = mkIndex(golden);
  const pin = resolveSprintPin(gi);
  c.golden = pin.current?.uuid === 's37' && pin.lastCompleted?.uuid === 's35' && pin.nextBacklog === null;
  // (also proves INV-C1-3: the QA-pending S36 is NOT current)
  c.qaPendingNotCurrent = pin.current?.uuid !== 's36';

  // ── CHECK 2 — DRIFT-invariance: rename every sprint/task name → pin IDENTICAL (identity is number-keyed) ──
  const renamed = golden.map((u) => ({ ...u, model: { ...u.model, name: 'ZZZ totally different renamed garbage' } }));
  const pin2 = resolveSprintPin(mkIndex(renamed));
  c.driftInvariant = pin2.current?.uuid === pin.current?.uuid && pin2.current?.number === pin.current?.number &&
    pin2.lastCompleted?.uuid === pin.lastCompleted?.uuid && pin2.nextBacklog === pin.nextBacklog;

  // ── CHECK 3 — AMBIGUITY (INV-C1-4): two Active sprints → resolveSprintPin THROWS fail-loud (never silent-pick) ──
  const ambig = [
    sprint('s40', 40, 'A', ['t40']), task('t40', 'In Progress'),
    sprint('s41', 41, 'B', ['t41']), task('t41', 'In Progress'),
  ];
  try { resolveSprintPin(mkIndex(ambig)); c.ambiguityThrows = false; }
  catch (e) { c.ambiguityThrows = /INV-C1-4|Active|ambiguous/i.test(String((e as Error).message)); }

  // ── CHECK 4 — FAIL-CLOSED unresolvable task ref → THROWS (never silent-skip) ──
  const dangling = [sprint('s50', 50, 'C', ['ghost-task-not-in-index'])];
  try { resolveSprintPin(mkIndex(dangling)); c.unresolvableThrows = false; }
  catch (e) { c.unresolvableThrows = /FAIL-CLOSED|unresolvable/i.test(String((e as Error).message)); }

  // ── CHECK 5 — VACUOUS: empty tasks[] is NOT 'Closed' (INV-C1-6, empty ≠ Done) ──
  const emptySprint = sprint('s60', 60, 'D', []);
  c.emptyNotClosed = deriveSprintStatus(emptySprint as any, mkIndex([emptySprint])).status !== 'Closed';

  // ── CHECK 6 — sprintSlugOf 2-facet ──
  // (a) slug-from-path-NEVER-slugify(name): path points at a REAL dir; name is bogus → returns the path slug, not the name
  const slugFromPath = { ior: 'ior:class:Sprint', model: { uuid: 'sp', number: 37, name: 'Bogus Name That Would Slugify Wrong', sourceFile: `scrum.pmo/sprints/${REAL_S37_DIR}/requirements.md` } };
  c.slugFromPathNotName = sprintSlugOf(slugFromPath as any) === REAL_S37_DIR;
  // (b) fail-closed-on-unresolvable-dir: slug/number resolve to NO existing dir → null (refuse, never fabricate)
  const slugNoDir = { ior: 'ior:class:Sprint', model: { uuid: 'sp2', number: 999, name: 'X', slug: 'sprint-999-nonexistent', sourceFile: 'nowhere/at/all' } };
  c.slugFailClosed = sprintSlugOf(slugNoDir as any) === null;

  // ── CHECK 7 — sprintNumOf no-name-parse: name mentions a number but no numbered source → null; path → the number ──
  c.numNeverFromName = sprintNumOf({ ior: 'ior:class:Sprint', model: { uuid: 'n1', name: 'Sprint 42 mentioned in the name only' } } as any) === null;
  c.numFromPath = sprintNumOf({ ior: 'ior:class:Sprint', model: { uuid: 'n2', sourceFile: `x/sprints/${REAL_S37_DIR}/y.md` } } as any) === 37;

  // ── CHECK 8 — INV-C1-8 STATIC LINT: 0 slugify(...) + num/slug function bodies never read .name ──
  const raw = fs.readFileSync(RESOLVER_SRC, 'utf8');
  // strip comments FIRST — the invariant is about CODE, and the source explains itself with "NEVER slugify(model.name)"
  // / "NEVER parse model.name" comments; a lint that matched those would false-RED correct code (rule #4: gate the code).
  const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  const src = stripComments(raw);
  const noSlugify = (src.match(/slugify\s*\(/g) || []).length === 0;
  const bodyOf = (fn: string) => { const s = src.indexOf(`export function ${fn}`); const e = src.indexOf('\nexport function ', s + 1); return src.slice(s, e === -1 ? undefined : e); };
  const numBody = bodyOf('sprintNumOf'), slugBody = bodyOf('sprintSlugOf');
  c.lintNoNameDerivation = noSlugify && !/\.name\b/.test(numBody) && !/\.name\b/.test(slugBody);

  // ── ★ META-BITE (retrofit sweep, PO doctrine — prove THIS gate can fail, not vacuously green) ──
  // A STUB sprintNumOf that PARSED the free-text name (the exact INV-C1-8 anti-pattern the fix forbids) returns a number
  // for a name-only unit → the numNeverFromName check would flip RED. Real returns null (passes) while the stub returns 42
  // (fails) → the gate is proven ABLE TO FAIL on a name-parsing regression. (FAMILY: identity-from-name derivation.)
  const stubNumFromName = (u: any) => { const h = /(\d+)/.exec(String(u.model?.name || '')); return h ? +h[1] : null; };
  const nameOnly = { ior: 'ior:class:Sprint', model: { uuid: 'z', name: 'Sprint 42 name-only, no numbered source' } };
  c.metaBite_stubNameParserFails = sprintNumOf(nameOnly as any) === null && stubNumFromName(nameOnly) === 42;

  return c;
}

const results: boolean[] = [];
let last: Record<string, boolean> = {};
for (let i = 1; i <= 3; i++) {
  const c = runChecks();
  last = c;
  const pass = Object.values(c).every(Boolean);
  results.push(pass);
  console.log(`iter ${i}: ${Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ')} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R-C1 SprintPinResolver gate (DET-3x, own-oracle) =====');
const failed = Object.entries(last).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) console.log('FAILING CHECKS:', failed.join(', '));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('markers on GREEN → req: golden/drift/ambiguity/fail-closed → resolveSprintPin af97137f; empty-not-closed → deriveSprintStatus 303639ce; slug 2-facet → sprintSlugOf f326509a; num no-name → sprintNumOf e0f62b6c; INV-C1-8 lint = cross-cutting.');
process.exitCode = green ? 0 : 1;
