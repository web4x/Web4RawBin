// [test:uuid:7f3e9b14-ec33-4b5e-afa1-80292acf947b] R33.1 MOF-folder structure — verifies mofLayerRoots (Impl 5afeafe9): /api/model/tree returns MOF-LAYER FOLDER roots (INV-MOF1 M2·UML Profile + M1·Projects, not flat) + M2 metaclass→M1 instances via reverse instanceOf (INV-MOF2 cross-level) + M1→project→classes+members+Diagram + INV-MOF3 no-dup/same-uuid identity + INV-MOF4 isolation (store-only + /model 403). Own-oracle: real tree structure + /api/ior + prod-shard-absence, read-only. → req wires this Test onto Impl 5afeafe9 (mofLayerRoots).
// R33.1 MOF-folder STRUCTURE + cross-level nav, DET-3x. /api/model/tree now returns MOF-LAYER FOLDER roots (grouped by
// metaLevel), not a flat list. INV-MOF1 folders (M2·UML Profile + M1·Projects); INV-MOF2 M2 metaclass → its M1 instances
// (reverse instanceOf, cross-level); M1 → project → classes+members + Diagram; INV-MOF3 no-dup / same-uuid identity;
// INV-MOF4 isolation (store-only + /model 403). Own-oracle: real /api/model/tree structure + /api/ior instanceOf +
// prod-shard-absence + route gates. Read-only (no writes, no session → pollution-impossible). GATES structure+nav, not loads.
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const PROD_INDEX = path.join(ROOT, 'scenario', 'index');
const FAA = 'faa4acad-41a6-48fc-ad0d-dd0044c123f7';           // a MODEL_STORE Diagram unit (must NOT be in prod)
const shardOf = (base, u) => path.join(base, ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const strip = (r) => String(r).replace(/^ior:instance:/, '').replace(/^modelelement:/, '');
const req = (pth, tok) => new Promise((res) => { const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pth, method: 'GET', rejectUnauthorized: false, headers: tok ? { 'x-player-token': tok } : {} }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: x.statusCode, json: j }); }); }); r.on('error', () => res({ status: 0 })); r.end(); });
const iorModel = (u) => req(`/api/ior/ior:instance:${u}`).then(r => r.json?.unit?.model || null);

// collect (uuid → count) + per-node child-uuid uniqueness over the whole tree
function walk(nodes, seen, dupSibling, acc) { for (const n of nodes || []) { acc.push(n); seen.set(n.uuid, (seen.get(n.uuid) || 0) + 1); if (n.children) { const kids = n.children.map(c => c.uuid); if (new Set(kids).size !== kids.length) dupSibling.push(n.uuid); walk(n.children, seen, dupSibling, acc); } } }

const results = [];
const ver = (await req('/api/config')).json?.version === '0.8.12';
const prodClean = !fs.existsSync(shardOf(PROD_INDEX, FAA));   // INV-MOF4: the store's Diagram is NOT in prod scenario/index
const modelGated = (await req('/model')).status === 403 && (await req('/model', '00000000-0000-4000-8000-000000000000')).status === 403;
const traceOk = (await req('/trace')).status === 200;

for (let i = 1; i <= 3; i++) {
  const tree = (await req('/api/model/tree')).json;
  const roots = tree?.roots || [];

  // INV-MOF1: two MOF-layer FOLDER roots (not flat)
  const m2Root = roots.find(r => r.name === 'M2 · UML Profile');
  const m1Root = roots.find(r => r.name === 'M1 · Projects');
  const invMof1 = roots.length === 2 && !!m2Root && !!m1Root && m2Root.type === 'mof-layer' && m1Root.type === 'mof-layer' && m2Root.hasChildren && m1Root.hasChildren;

  // INV-MOF2: an M2 metaclass → M1 instances; a listed instance's instanceOf (via /api/ior) includes that metaclass (cross-level)
  const mc = (m2Root?.children || []).find(c => c.hasChildren && (c.children || []).length > 0);
  const inst = mc?.children?.[0];
  const instModel = inst ? await iorModel(inst.uuid) : null;
  const invMof2 = !!mc && !!inst && Array.isArray(instModel?.instanceOf) && instModel.instanceOf.map(strip).includes(mc.uuid);

  // M1 → project → classes(+members) + Diagram
  const proj = (m1Root?.children || [])[0];
  const projClass = (proj?.children || []).find(c => c.type === 'modelelement' && c.hasChildren);
  const projDiagram = (proj?.children || []).find(c => c.type === 'diagram');
  const m1Project = !!proj && !!projClass && (projClass.children || []).length > 0 && !!projDiagram;

  // INV-MOF3 (BITE): (a) no duplicate sibling uuid anywhere; (b) an element referenced in ≥2 places carries the SAME uuid (identity, not a fork)
  const seen = new Map(), dupSibling = [], all = [];
  walk(roots, seen, dupSibling, all);
  const crossRef = [...seen.entries()].find(([u, n]) => n >= 2 && /^[0-9a-f-]{16,40}$/.test(u)); // a real element uuid appearing under both M2-instance + M1-member = same uuid
  const invMof3 = dupSibling.length === 0 && !!crossRef;

  const pass = ver && invMof1 && invMof2 && m1Project && invMof3 && prodClean && modelGated && traceOk;
  results.push(pass);
  console.log(`iter ${i}: v0.8.12=${ver} INV-MOF1-folders=${invMof1}(roots=${roots.length},M2=${m2Root?.childCount},M1=${m1Root?.childCount}) INV-MOF2-crosslevel=${invMof2}(mc=${mc?.name}→inst=${inst?.name}) M1-project=${m1Project}(class=${projClass?.name},diagram=${!!projDiagram}) INV-MOF3(no-dup-sibling=${dupSibling.length === 0},same-uuid-identity=${!!crossRef})=${invMof3} | INV-MOF4(prodClean=${prodClean},/model403=${modelGated}) /trace=${traceOk} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== R33.1 MOF-folder structure + cross-level nav (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('Read-only structure gate (no writes/session → pollution-impossible). @390 rb-trace-tree render = Tron device visual.');
process.exitCode = green ? 0 : 1;
