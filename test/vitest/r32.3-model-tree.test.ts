// R32.3 gate (vitest — tester/CI; expert measured via tsx). Model tree = SHARED rb-trace-tree over MDA units,
// DATA+CONFIG only: ModelElement forward-key=members, relatesTo NOT a child, node type=M2 model-facet (icon),
// badge=members.length, shared-tree unregressed, deterministic. NO tree-mechanics fork.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TsToModel } from '../../src/ts/scenario/TsToModel.js';
import { forwardKeysForMode } from '../../src/ts/shared/chain-model.js';
import { TRACE_ICONS } from '../../src/public/ts/trace/icons.js';

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'r32.2-sample.ts');
const SEED = path.join(ROOT, 'scenario', 'index', 'a', '1', 'd', '2', 'e');
const TMP = path.join(ROOT, 'test', 'vitest', '.r32.3-tmp');
const IDX = path.join(TMP, 'scenario', 'index');

let byName: Map<string, ReturnType<TsToModel['generate']>['units'][number]['model']>;
const M2NAME = new Map<string, string>();

beforeAll(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
  const seedTmp = path.join(IDX, 'a', '1', 'd', '2', 'e');
  fs.mkdirSync(seedTmp, { recursive: true });
  for (const f of fs.readdirSync(SEED)) { fs.copyFileSync(path.join(SEED, f), path.join(seedTmp, f)); const u = JSON.parse(fs.readFileSync(path.join(seedTmp, f), 'utf-8')); M2NAME.set(u.model.uuid, u.model.name); }
  byName = new Map(new TsToModel(ROOT).generate([FIXTURE], { indexDir: IDX }).units.map((u) => [u.model.name, u.model]));
});
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));

const U = (n: string) => { const m = byName.get(n); expect(m, n).toBeTruthy(); return m!; };
const facetOf = (m: { instanceOf: string[] }): string => { for (const r of m.instanceOf) { const n = M2NAME.get(r.replace('ior:instance:', '')) || ''; if (n.startsWith('Uml')) return n; } return 'ModelElement'; };

describe('R32.3 MDA model tree (data+config over shared rb-trace-tree)', () => {
  it('AC-2: ModelElement forward-key = [members] (all modes), additive', () => {
    expect(forwardKeysForMode('ModelElement', 'scenario')).toEqual(['members']);
    expect(forwardKeysForMode('ModelElement', 'trace')).toEqual(['members']);
    expect(forwardKeysForMode('Class', 'scenario')).toEqual(['methods']); // other types unregressed
  });
  it('AC-5: relatesTo is NOT a child forward-key', () => {
    expect(forwardKeysForMode('ModelElement', 'scenario')).not.toContain('relatesTo');
    expect(U('center').relatesTo).toContain(`ior:instance:${U('Point').uuid}`); // edge exists (detail/R32.6)
    expect((U('Circle').members || []).map((r) => r.replace('ior:instance:', ''))).not.toContain(U('Point').uuid); // not a child
  });
  it('AC-3: Uml* model-facet icons present; node type = model-facet metaclass', () => {
    for (const k of ['umlclass', 'umlinterface', 'umlattribute', 'umlmethod', 'umlproperty', 'umlfunction']) expect(TRACE_ICONS[k]).toBeTruthy();
    expect(facetOf(U('Circle'))).toBe('UmlClass');
    expect(facetOf(U('area'))).toBe('UmlMethod');
    expect(TRACE_ICONS[facetOf(U('Circle')).toLowerCase()]).toBeTruthy();
  });
  it('AC-4: class members[] composition + badge = members.length', () => {
    const c = U('Circle');
    for (const m of ['center', '_r', 'radius', 'area']) expect((c.members || []).map((r) => r.replace('ior:instance:', ''))).toContain(U(m).uuid);
    expect((c.members || []).length).toBe(4);
    expect(U('area').memberOf).toBe(`ior:instance:${c.uuid}`);
  });
  it('AC-6: deterministic re-run = 0 churn (stable tree)', () => {
    expect(new TsToModel(ROOT).generate([FIXTURE], { indexDir: IDX }).wrote).toBe(0);
  });
});
