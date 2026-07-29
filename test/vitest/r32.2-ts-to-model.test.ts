// R32.2 gate (vitest — tester/CI; expert measured the same via tsx since local vitest is env-broken).
// TS→M1 generation on the R32.1 foundation: AST→M2 multi-facet map, get+set→ONE property, members/memberOf
// composition, typed→relatesTo(+UmlAssociation), implements→UmlGeneralization, deterministic 0-churn re-run,
// ModelValidator(generated)=0. Chain (req two-key): onto TsToModel.generate (Class/Method/Impl/Test).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TsToModel, keyToUuid } from '../../src/ts/scenario/TsToModel.js';
import { ModelValidator } from '../../src/ts/scenario/ModelValidator.js';

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'r32.2-sample.ts');
const REL = 'test/fixtures/r32.2-sample.ts';
const SEED = path.join(ROOT, 'scenario', 'index', 'a', '1', 'd', '2', 'e');
const TMP = path.join(ROOT, 'test', 'vitest', '.r32.2-tmp');
const IDX = path.join(TMP, 'scenario', 'index');

let res: ReturnType<TsToModel['generate']>;
let byName: Map<string, ReturnType<TsToModel['generate']>['units'][number]['model']>;

beforeAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
  const seedTmp = path.join(IDX, 'a', '1', 'd', '2', 'e');
  fs.mkdirSync(seedTmp, { recursive: true });
  for (const f of fs.readdirSync(SEED)) fs.copyFileSync(path.join(SEED, f), path.join(seedTmp, f));
  res = new TsToModel(ROOT).generate([FIXTURE], { indexDir: IDX });
  byName = new Map(res.units.map((u) => [u.model.name, u.model]));
});
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));

const U = (n: string) => { const m = byName.get(n); expect(m, n).toBeTruthy(); return m!; };

describe('R32.2 TS→M1 generation', () => {
  it('AST→M2 multi-facet instanceOf [model, code]', () => {
    expect(U('Circle').instanceOf).toEqual(expect.arrayContaining(['ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000003', 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000013']));
    expect(U('Shape').instanceOf).toEqual(expect.arrayContaining(['ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000004', 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000015']));
    expect(U('makeId').kind).toBe('function');
    expect(U('Id').instanceOf).toEqual(expect.arrayContaining(['ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000009', 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000020']));
  });
  it('get+set of the same name → ONE property', () => {
    expect(res.units.filter((u) => u.model.name === 'radius').length).toBe(1);
    expect(U('radius').kind).toBe('property');
  });
  it('class members[] composition + reverse memberOf', () => {
    const c = U('Circle');
    for (const m of ['center', 'radius', 'area', '_r']) expect(c.members).toContain(`ior:instance:${U(m).uuid}`);
    expect(U('area').memberOf).toBe(`ior:instance:${c.uuid}`);
  });
  it('typed attribute → relatesTo + UmlAssociation; implements → UmlGeneralization', () => {
    expect(U('center').relatesTo).toContain(`ior:instance:${U('Point').uuid}`);
    expect(U('center').relations).toEqual(expect.arrayContaining([{ to: `ior:instance:${U('Point').uuid}`, type: 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000010' }]));
    expect(U('Circle').relations).toEqual(expect.arrayContaining([{ to: `ior:instance:${U('Shape').uuid}`, type: 'ior:instance:a1d2e3f4-0000-4a1b-8c2d-000000000011' }]));
  });
  it('deterministic uuid = keyToUuid(sourceFile::qualifiedName)', () => {
    expect(U('Circle').uuid).toBe(keyToUuid(`${REL}::Circle`));
    expect(U('area').uuid).toBe(keyToUuid(`${REL}::Circle.area`));
  });
  it('idempotent re-run → 0 churn', () => {
    const r2 = new TsToModel(ROOT).generate([FIXTURE], { indexDir: IDX });
    expect(r2.wrote).toBe(0);
    expect(r2.removed).toBe(0);
  });
  it('ModelValidator(generated) = 0 violations', () => {
    const list = (): string[] => { const out: string[] = []; const st = [IDX]; while (st.length) { const d = st.pop()!; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) st.push(p); else if (e.name.endsWith('.scenario.json')) out.push(e.name.replace('.scenario.json', '')); } } return out; };
    const get = (u: string) => { try { return JSON.parse(fs.readFileSync(path.join(IDX, ...u.slice(0, 5).split(''), `${u}.scenario.json`), 'utf-8')); } catch { return null; } };
    expect(new ModelValidator().validate({ list, get })).toEqual([]);
  });
});
