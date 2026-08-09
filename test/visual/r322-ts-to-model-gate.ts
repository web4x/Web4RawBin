// [test:uuid:ba762f5a-3eae-4bde-bccc-16de66c6682d] R32.2 TsToModel — INDEPENDENT gate GREEN DET-3x (my own tsx harness + synthetic fixture + planted-defect bite; NOT vitest, NOT the expert's r32.2-gate.ts). 4 ACs: (a) TS AST->M1 ModelElement multi-facet instanceOf; (b) get+set->ONE property + members/memberOf; (c) typed->relatesTo + M2 UmlAssociation, extends->UmlGeneralization; (d) deterministic same-uuid re-parse identical + 0-churn re-write (w1=8,w2=0) + ModelValidator(generated+seed)=0. BITE: planted broken M1 (empty instanceOf) CAUGHT by validator. -> req wires onto TsToModel.generate impl.
// R32.2 TsToModel — INDEPENDENT gate (NOT a re-run of test/manual/r32.2-gate.ts nor the vitest harness). My OWN synthetic
// TS fixture + my OWN assertions + PLANTED-DEFECT bites. Structural (no device). generate(write:false) returns units w/o
// writing → zero pollution; the 0-churn write test uses a scratchpad indexDir. DET-3x.
// ACs: (a) TS AST→M1 ModelElement, multi-facet instanceOf; (b) get+set→ONE property + members/memberOf; (c) typed→relatesTo
// + M2 UmlAssociation / extends→UmlGeneralization; (d) deterministic same-uuid re-parse=identical + 0-churn re-write +
// ModelValidator(generated+seed)=0. BITES: content-derived-uuid non-vacuous, 0-churn, ModelValidator catches a broken M1.
import { TsToModel, keyToUuid } from '../../src/ts/scenario/TsToModel.ts';
import { ModelValidator } from '../../src/ts/scenario/ModelValidator.ts';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const FIXDIR = path.join(SCRATCH, 'r322-fix'), IDXDIR = path.join(SCRATCH, 'r322-idx');
const UML_ASSOC = 'a1d2e3f4-0000-4a1b-8c2d-000000000010', UML_GEN = 'a1d2e3f4-0000-4a1b-8c2d-000000000011';
const FIXTURE = `class Base {}
interface Baz { q: number; }
class Foo extends Base {
  private _x = 0;
  get x(): number { return this._x; }
  set x(v: number) { this._x = v; }
  bar: Baz;
  greet(): string { return 'hi'; }
}
`;
// on-disk seed M2/M3 facets (so a generated M1's multi-facet instanceOf resolves one level up)
const seedUnits = execSync(`grep -rl '"ior": *"ior:class:ModelElement"' scenario/`, { cwd: REPO, encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(f => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8')));
const mkIndex = (arr: any[]) => ({ list: () => arr.map(u => u.model.uuid as string), get: (u: string) => arr.find(x => x.model.uuid === u) || null });

fs.mkdirSync(FIXDIR, { recursive: true });
fs.writeFileSync(path.join(FIXDIR, 'Foo.ts'), FIXTURE);
const FIX = path.join(FIXDIR, 'Foo.ts');

const results: boolean[] = [];
for (let iter = 1; iter <= 3; iter++) {
  const gen = new TsToModel(FIXDIR).generate([FIX], { write: false }).units;
  const byName = (k: string, n: string) => gen.filter(u => u.model.kind === k && u.model.name === n);
  const foo = byName('class', 'Foo')[0], base = byName('class', 'Base')[0], baz = byName('interface', 'Baz')[0];
  const xs = byName('property', 'x'), bar = byName('attribute', 'bar')[0];
  const jsonOf = (u: any) => JSON.stringify(u);

  // (a) multi-facet instanceOf
  const acA = !!foo && foo.model.metaLevel === 'M1' && Array.isArray(foo.model.instanceOf) && foo.model.instanceOf.length >= 2;
  // (b) get+set → EXACTLY ONE property + members/memberOf (one property draft, memberOf→class, class members includes it once)
  const x = xs[0];
  const acB = xs.length === 1 && !!x && !!foo && String(x.model.memberOf || '').includes(foo.model.uuid) && (foo.model.members || []).filter((m: string) => m.includes(x.model.uuid)).length === 1;
  // (c) typed → relatesTo + M2 assoc; extends → M2 generalization
  const acC = !!bar && !!baz && (bar.model.relatesTo || []).some((r: string) => r.includes(baz.model.uuid)) && jsonOf(bar).includes(UML_ASSOC)
    && !!base && (foo.model.relatesTo || []).some((r: string) => r.includes(base.model.uuid)) && jsonOf(foo).includes(UML_GEN);
  // (d1) deterministic: re-parse identical
  const gen2 = new TsToModel(FIXDIR).generate([FIX], { write: false }).units;
  const acDidentical = JSON.stringify(gen) === JSON.stringify(gen2);
  // (d2) content-derived uuid — non-vacuous BITE: same key→same, different key→different
  const uuidNonVacuous = keyToUuid('Foo.ts::Foo.x') === keyToUuid('Foo.ts::Foo.x') && keyToUuid('Foo.ts::Foo.x') !== keyToUuid('Foo.ts::Foo.y');
  // (d3) 0-churn re-write (scratchpad indexDir)
  fs.rmSync(IDXDIR, { recursive: true, force: true });
  const w1 = new TsToModel(FIXDIR).generate([FIX], { write: true, indexDir: IDXDIR }).wrote;
  const w2 = new TsToModel(FIXDIR).generate([FIX], { write: true, indexDir: IDXDIR }).wrote;
  const acDchurn = w1 > 0 && w2 === 0;
  // (d4) ModelValidator(generated + seed) = 0
  const vClean = new ModelValidator().validate(mkIndex([...gen, ...seedUnits]) as any);
  const acDvalidate = vClean.length === 0;
  // BITE: corrupt a generated M1 (empty instanceOf) → validator MUST catch
  const broken = JSON.parse(JSON.stringify(gen[0])); broken.model.instanceOf = [];
  const vBroken = new ModelValidator().validate(mkIndex([broken, ...gen.slice(1), ...seedUnits]) as any);
  const biteCaught = vBroken.some((x: any) => x.uuid === broken.model.uuid && x.assertion === 'instanceof-nonempty');

  const pass = acA && acB && acC && acDidentical && uuidNonVacuous && acDchurn && acDvalidate && biteCaught;
  results.push(pass);
  if (iter === 1) console.log(`detail: a=${acA} b=${acB} c=${acC} | d-identical=${acDidentical} uuid-nonvacuous=${uuidNonVacuous} churn(w1=${w1},w2=${w2})=${acDchurn} validate0=${acDvalidate}(${vClean.length}) BITE-caught=${biteCaught} | units=${gen.length} props-x=${xs.length}`);
  console.log(`iter ${iter}: ${pass ? 'GREEN' : 'RED'}`);
}
fs.rmSync(IDXDIR, { recursive: true, force: true }); fs.rmSync(FIXDIR, { recursive: true, force: true });

console.log('\n===== R32.2 TsToModel (independent, DET-3x) =====');
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN — AST→M1 multi-facet, get/set→1 property, typed→relatesTo+M2, deterministic+0-churn+validates; planted defect CAUGHT' : 'RED');
process.exitCode = green ? 0 : 1;
