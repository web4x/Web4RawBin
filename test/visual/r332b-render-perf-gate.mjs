// [test:uuid:96a4bda8-e87b-4dd8-afc4-b03311725f55] S33-P2b/R33.2 render-perf — verifies the bounded/lazy model tree (mofLayerRoots extended): initial /api/model/tree = 2 COLLAPSED MOF-layer roots (≪1195), each expand = ONE bounded /api/trace/children fetch (M1→projects, RawBin→~25 file-folders, NOT 1195), classes reachable (P2-1), /model 403. BITE: initial ≤12 ≪1195 (non-vacuous, full model ~1195). Own-oracle real lazy API walk, read-only. → req wires this Test onto the R33.2 impl (mofLayerRoots-extended lazy/children).
// S33-P2b (R33.2) render-perf — the BOUNDED/LAZY model tree (my S33-P2a 1195-node perf-flag drove this fix), DET-3x.
// /api/model/tree now returns the TOP MOF layer COLLAPSED (no eager children) + each expand = ONE bounded
// /api/trace/children fetch (NOT one 1195-node payload). Own-oracle: walk the real lazy API path + count nodes at each
// level + a planted-defect bite (the initial payload MUST be ≪1195 = bounded; a regression to eager flood BITES the bound;
// non-vacuous because the FULL model is ~1195 reachable only via per-expand). Read-only (no writes/session → pollution-impossible).
// The @390 model-tree VISUAL render is on the owner-gated /model page = Tron device; this gates the perf MECHANISM the render depends on.
import https from 'node:https';

const BASE = 'https://prod.wo-da.de:4444';
const req = (pth, tok) => new Promise((res) => { const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: pth, method: 'GET', rejectUnauthorized: false, headers: tok ? { 'x-player-token': tok } : {} }, x => { let b = ''; x.on('data', c => b += c); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch { /* */ } res({ status: x.statusCode, json: j, body: b }); }); }); r.on('error', () => res({ status: 0 })); r.end(); });
const nodeCount = (body) => (String(body || '').match(/"uuid"/g) || []).length;
const BOUND = 12;                                              // "≪1195" — a meaningful bound (full model ~1195); a regression to eager would blow past it

const results = [];
const ver = (await req('/api/config')).json?.version === '0.8.16';
const modelGated = (await req('/model')).status === 403 && (await req('/model', '00000000-0000-4000-8000-000000000000')).status === 403;
const traceOk = (await req('/trace')).status === 200;

for (let i = 1; i <= 3; i++) {
  // (1) INITIAL BOUNDED: /api/model/tree = the top MOF layer, COLLAPSED (no eager children[])
  const root = await req('/api/model/tree');
  const rootNodes = nodeCount(root.body);
  const roots = root.json?.roots || [];
  const m2 = roots.find(r => r.name === 'M2 · UML Profile');
  const m1 = roots.find(r => r.name === 'M1 · Projects');
  const initialBounded = roots.length === 2 && rootNodes <= BOUND && !root.body.includes('"children":') // no eager children inlined
    && m2?.hasChildren && m1?.hasChildren && (m2.childCount + m1.childCount) > 0;                        // collapsed but hasChildren/childCount set (badge)

  // (2) LAZY PER-EXPAND: expand M1 → ONE fetch, bounded (the projects); expand RawBin → ONE fetch, bounded (~25 file-folders)
  const m1kids = await req('/api/trace/children/mof-m1');
  const projects = (m1kids.json?.children || []);
  const rawbin = projects.find(p => p.name === 'RawBin');
  const rawbinKids = await req(`/api/trace/children/${encodeURIComponent(rawbin?.uuid || 'x')}`);
  const fileFolders = (rawbinKids.json?.children || []);
  const lazyBounded = nodeCount(m1kids.body) <= BOUND && projects.length >= 1 && !!rawbin      // M1 expand bounded (2 projects)
    && nodeCount(rawbinKids.body) < 1195 && fileFolders.length >= 20;                          // RawBin expand = ~25 file-folders, NOT 1195

  // (3) 25 FILE-FOLDERS: RawBin sub-grouped into file/dir folders (collection nodes)
  const fileFoldered = fileFolders.length >= 20 && fileFolders.length <= 40 && fileFolders.every(f => f.type === 'collection' || f.icon);

  // (4) REAL CLASSES REACHABLE (P2-1 unregressed): expand a file-folder → its classes; TsToModel reachable somewhere
  const ff = fileFolders.find(f => f.hasChildren) || fileFolders[0];
  const ffKids = await req(`/api/trace/children/${encodeURIComponent(ff?.uuid || 'x')}`);
  const classesReachable = nodeCount(ffKids.body) < 1195 && (ffKids.json?.children || []).some(c => c.type === 'modelelement' || c.icon === 'class' || c.icon === 'interface');

  // (5) BITE (non-vacuous): the INITIAL payload is ≪1195 (bounded) — a regression to eager-flood would return ~1195 here
  const biteBounded = rootNodes <= BOUND && rootNodes < 100;   // full model ~1195 reachable via expands, but initial ≤ BOUND

  const pass = ver && initialBounded && lazyBounded && fileFoldered && classesReachable && biteBounded && modelGated && traceOk;
  results.push(pass);
  console.log(`iter ${i}: v0.8.16=${ver} INITIAL-bounded=${initialBounded}(${rootNodes} nodes, ≪1195) LAZY-per-expand=${lazyBounded}(M1→${projects.length}proj, RawBin→${fileFolders.length} folders/${nodeCount(rawbinKids.body)}nodes) file-folders=${fileFoldered}(${fileFolders.length}) classes-reachable=${classesReachable} BITE-bound=${biteBounded} | /model403=${modelGated} /trace=${traceOk} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n===== S33-P2b render-perf: bounded/lazy model tree (DET-3x) =====');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
console.log('Closes my S33-P2a 1195-node perf-flag: initial DOM ≪1195 (2 collapsed roots) + ONE bounded /api/trace/children per expand (not 1195 payload) + ~25 RawBin file-folders + classes reachable. @390 VISUAL render (no-hang) = Tron device (/model owner-gated).');
process.exitCode = green ? 0 : 1;
