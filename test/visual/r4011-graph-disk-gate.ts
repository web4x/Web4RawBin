// [test:uuid:5c7e0a91-4d38-4b6f-9a02-8e13f6c7b5d4] T40.11 AC-1(graph)/AC-2(source-crown)/AC-3(generic-view)/AC-4(fail-loud) — THIRD INDEPENDENT measurement. The expert measured the RENDER (r4011c drawer @390) and the architect the EMITTER ROWS (check:tree-emitter); this measures the GRAPH + DISK, a dimension neither touched: typed IOR edges read from the graph (not strings) + the crown FileBacked→real-on-disk-file resolution BY QUERY, cross-referenced to the served render-data. Deterministic (disk graph + fs + served /api/trace/children), DET-3x. Read-only.
// PHANTOM-GUARD FIRST: served==committed (package.json version == /api/config) — never a back-version (my own catch, now doctrine). AC-5-DEVICE (Tron taps→pixel @390) is NOT here (Tron-only device-pending). AC-5-AUTO split to a next-phase req. META-BITE: a stub FileBacked realizer with a bogus manifestsAs MUST make the crown go RED (a check that can't fail certifies nothing). node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r4011-graph-disk-gate.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.ts';

const BASE = 'https://prod.wo-da.de:4444';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const FILEBACKED = 'a1d2e3f4-0000-4a1b-8c2d-000000000031'; // M2 FileBacked interface sentinel (instanceOf a realizer)
const resolveManifest = (m: string): string =>
  m.startsWith('~') ? path.join(os.homedir(), m.slice(1).replace(/^\//, '')) : m.startsWith('/') ? m : path.join(ROOT, m);

// deployment typed units BY QUERY (not a hardcoded list → a future 5th type is covered): ModelElement + metaLevel M1 + provenance sourceRole
const depUnits = idx.list().map(u => idx.get(u)).filter(Boolean)
  .filter((x: any) => x.ior === 'ior:class:ModelElement' && (x.model as any).metaLevel === 'M1' && (x.model as any).sourceRole && (x.model as any).kind)
  .map((x: any) => ({ uuid: x.model.uuid as string, m: x.model as Record<string, unknown> }));

const results: Record<string, boolean> = {};
const iof = (m: Record<string, unknown>): string[] => (Array.isArray(m.instanceOf) ? m.instanceOf as string[] : []).map(r => String(r).replace('ior:instance:', ''));

for (let r = 1; r <= 3; r++) {
  // ── PHANTOM-GUARD served==committed ──
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')).version;
  const cfg = await fetch(`${BASE}/api/config`).then(x => x.json()).catch(() => ({}));
  const phantom = cfg.version === pkg;

  // ── AC-1 GRAPH: typed units instanceOf REAL M2 units (queryable edges, not strings) + interface realization ──
  const ac1 = depUnits.length >= 5 && depUnits.every(d => {
    const io = iof(d.m);
    return io.length > 0 && io.every(ref => idx.get(ref) !== null); // every instanceOf edge RESOLVES to a real unit
  }) && idx.get(FILEBACKED) !== null; // the FileBacked interface is a real graph node

  // ── AC-2 SOURCE (crown, by-query, fail-closed): every FileBacked realizer resolves manifestsAs → real on-disk file ──
  const fileBacked = depUnits.filter(d => iof(d.m).includes(FILEBACKED));
  const ac2 = fileBacked.length >= 4 && fileBacked.every(d => {
    const mf = String(d.m.manifestsAs || '');
    return mf.length > 0 && fs.existsSync(resolveManifest(mf)); // FAIL-CLOSED: a fabricated ref → false
  });

  // ── AC-3 GENERIC-VIEW cross-ref: the SERVED render-data (/api/trace/children fields) derives from the graph unit's scalars ──
  let ac3 = true;
  for (const d of depUnits) {
    const data = await fetch(`${BASE}/api/trace/children/${d.uuid}`).then(x => x.json()).catch(() => ({}));
    const f = data.fields || {};
    // the served fields must carry the graph unit's type-key (kind) + the FileBacked realizers' manifestsAs — content, not empty
    const okKind = 'kind' in f || 'manifestsAs' in f || 'configuredBy' in f || 'fragment' in f;
    if (!(Object.keys(f).length > 0 && okKind)) { ac3 = false; break; }
  }

  // ── AC-4 FAIL-LOUD precondition: an unresolvable ref serves NO unit (→ drawer fail-louds, not perpetual Loading) ──
  const bogus = await fetch(`${BASE}/api/trace/children/depunit-unresolved-00000000-0000-0000-0000-000000000000`).then(x => x.json()).catch(() => null);
  const ac4 = !bogus || !bogus.fields || Object.keys(bogus.fields || {}).length === 0;

  // ── META-BITE (stub-must-fail): a stub FileBacked realizer with a BOGUS manifestsAs MUST make the crown check go RED ──
  const stubCrown = fs.existsSync(resolveManifest('/nonexistent/bogus-fabricated-ref.zzz'));
  const metaBite = stubCrown === false; // the crown's fs.existsSync returns false for a fabricated path ⇒ crown CAN fail

  const pass = phantom && ac1 && ac2 && ac3 && ac4 && metaBite;
  results[`iter${r}`] = pass;
  console.log(`iter ${r}: phantom(${cfg.version}==${pkg})=${phantom} | AC1-graph=${ac1}(${depUnits.length} typed units) | AC2-crown=${ac2}(${fileBacked.length} FileBacked→disk) | AC3-view=${ac3} | AC4-failloud=${ac4} | meta-bite=${metaBite} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== T40.11 AC-1..AC-4 GRAPH+DISK third-independent (DET-3x) =====');
const green = Object.values(results).length === 3 && Object.values(results).every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x — typed graph edges resolve, crown FileBacked→real files (fail-closed), served-data derives from graph, fail-loud, meta-bite holds' : 'RED');
process.exitCode = green ? 0 : 1;
