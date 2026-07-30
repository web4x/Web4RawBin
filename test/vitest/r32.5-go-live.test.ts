// R32.5 gate (vitest — tester/CI; expert measured via tsx). GO-LIVE generate half: TsToModel.generate(indexDir=STORE,
// diagram:true) → M1/M2 + demo Diagram view-links in an ISOLATED store; prod scenario/index NEVER mutated; idempotent
// re-drop. Server reroute + POST /api/model/generate = tester live gate + architect backstop.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TsToModel } from '../../src/ts/scenario/TsToModel.js';

const ROOT = path.resolve(__dirname, '..', '..');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'r32.2-sample.ts');
const PROD = path.join(ROOT, 'scenario', 'index');
const SEED = path.join(PROD, 'a', '1', 'd', '2', 'e');
const STORE = path.join(ROOT, 'test', 'vitest', '.r32.5-store', 'index');

const countME = (dir: string): number => { let n = 0; const st = [dir]; while (st.length) { const d = st.pop()!; if (!fs.existsSync(d)) continue; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) st.push(p); else if (e.name.endsWith('.scenario.json')) { try { if (JSON.parse(fs.readFileSync(p, 'utf-8')).ior === 'ior:class:ModelElement') n++; } catch { /* */ } } } } return n; };
const readShard = (base: string, uuid: string): any => { try { return JSON.parse(fs.readFileSync(path.join(base, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`), 'utf-8')); } catch { return null; } };

let r: ReturnType<TsToModel['generate']>; let prodBefore = 0;
beforeAll(() => {
  fs.rmSync(path.dirname(STORE), { recursive: true, force: true });
  const seedDst = path.join(STORE, 'a', '1', 'd', '2', 'e');
  fs.mkdirSync(seedDst, { recursive: true });
  for (const f of fs.readdirSync(SEED)) fs.copyFileSync(path.join(SEED, f), path.join(seedDst, f));
  prodBefore = countME(PROD);
  r = new TsToModel(ROOT).generate([FIXTURE], { indexDir: STORE, write: true, diagram: true });
});
afterAll(() => fs.rmSync(path.dirname(STORE), { recursive: true, force: true }));

describe('R32.5 drop→generate→view (go-live, isolated store)', () => {
  it('generate writes M1 to the STORE + returns a demo Diagram', () => {
    const circle = r.units.find((u) => u.model.name === 'Circle');
    expect(circle).toBeTruthy();
    expect(readShard(STORE, circle!.model.uuid)).toBeTruthy();
    expect(r.diagramUuid).toBeTruthy();
  });
  it('demo Diagram = Layer-2 view-links (class/interface, viewKind class, grid x,y on the link)', () => {
    const d = readShard(STORE, r.diagramUuid!);
    expect(d.ior).toBe('ior:class:Diagram');
    expect(d.model.views.length).toBe(3);
    expect(d.model.views.every((v: any) => v.unit.startsWith('modelelement:') && v.viewKind === 'class' && Number.isFinite(v.x) && Number.isFinite(v.y))).toBe(true);
    expect([d.model.views[1].x, d.model.views[1].y]).toEqual([240, 20]);
  });
  it('★ ISOLATION: prod scenario/index ModelElement count UNCHANGED (writes hit store only)', () => {
    expect(countME(PROD)).toBe(prodBefore);
    expect(countME(STORE)).toBeGreaterThan(prodBefore);
  });
  it('idempotent re-drop: same UUIDs → 0 churn, same diagram', () => {
    const r2 = new TsToModel(ROOT).generate([FIXTURE], { indexDir: STORE, write: true, diagram: true });
    expect(r2.wrote).toBe(0);
    expect(r2.diagramUuid).toBe(r.diagramUuid);
  });
});
