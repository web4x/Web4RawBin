import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Chain } from '../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const c: any = new Chain(new ScenarioIndex(path.join(REPO, 'scenario/index')), path.join(REPO, 'src'), path.join(REPO, 'test'));
const { hasRealImpl, hasRealTest } = c.markerScanners();
const implRefs = c.implRefCounts();
// resolve R19.2/R19.8 req uuids by altId/name
const all = c.idx.list();
function findReq(tag: string): string | null {
  for (const u of all) {
    if (c.unitType ? c.unitType(u) !== 'Requirement' : false) continue;
    const m = c.model(u); if (!m) continue;
    const t = String(m.name||'')+' '+String(m.altId||'');
    if (t.startsWith(tag+':') || t.includes(' '+tag+' ') || String(m.altId)===tag || String(m.name).startsWith(tag+':')) return u;
  }
  return null;
}
for (const tag of ['R20.13']) {
  const req = findReq(tag);
  console.log(`\n===== ${tag} req=${req?.slice(0,8)} =====`);
  if (!req) { console.log('  NOT FOUND'); continue; }
  const rows = c.walkReq(req, hasRealImpl, hasRealTest, implRefs);
  for (const r of rows) {
    console.log(`  ROW method=${r.method} methodUuid=${(r.methodUuid||'').slice(0,8)} impl=${r.impl} test=${r.test} complete=${r.complete}`);
    if (r.openNodes && r.openNodes.length) for (const o of r.openNodes) console.log(`     OPEN ${o.node} owner=${o.owner} ${o.action}`);
  }
  const s = c.summarize(req, hasRealImpl, hasRealTest, implRefs);
  console.log(`  >>> SUMMARIZE: complete=${s.isComplete} representative-method=${s.row.method} impl=${s.row.impl} test=${s.row.test}`);
}
