// PRE-MIGRATION BEHAVIOURAL BASELINE — the runtime OUTPUTS git cannot replay (file-state is covered by the model-store
// snapshot + git-tracked scenario/index). Captures the ACTUAL /api/trace/children output for every ref reachable in the
// MODEL subtree (mof-m1 → projects → dirs → classes → methods/attributes — the paths that READ MODEL_STORE) plus the authored
// artefact listings (rawbin:diagram, rawbin:puml) and a scenario/index side sample. Records child uuid/name/type/size +
// childCount at each node so post-migration we DIFF exactly: any changed listing that is not explicitly intended = REGRESSION.
// Read-only GET (no mutation). Reads the LIVE disk data being migrated → data-determined, not server-version-determined.
import fs from 'node:fs';
import https from 'node:https';

const BASE = process.env.BASE || 'https://prod.wo-da.de:4444';
const NODE_CAP = Number(process.env.NODE_CAP || 1200);   // bound the model-subtree walk
const agent = new https.Agent({ rejectUnauthorized: false });

const getJson = (ref) => new Promise((resolve) => {
  const url = `${BASE}/api/trace/children/${encodeURIComponent(ref)}`;
  https.get(url, { agent }, (res) => { let s = ''; res.on('data', (d) => (s += d)); res.on('end', () => { try { resolve(JSON.parse(s)); } catch { resolve(null); } }); }).on('error', () => resolve(null));
});

// deterministic child summary (sorted by uuid so ordering noise never shows as a diff)
const summarize = (j) => {
  const kids = (j?.children || []).map((c) => ({ uuid: String(c.uuid), name: String(c.name ?? ''), type: String(c.type ?? ''), size: Number(c.size ?? 0) || 0, hasChildren: !!c.hasChildren, childCount: Number(c.childCount ?? (c.children ? c.children.length : 0)) || 0 }));
  kids.sort((a, b) => a.uuid.localeCompare(b.uuid));
  return { type: String(j?.type ?? ''), name: String(j?.name ?? ''), hasChildren: !!j?.hasChildren, childCount: Number(j?.childCount ?? kids.length) || kids.length, children: kids };
};

// BFS the MODEL subtree from mof-m1 (reads MODEL_STORE). Cap total nodes; record each node's listing keyed by ref.
const captured = {};
async function bfsModel() {
  const seen = new Set(), queue = ['mof-m1'];
  while (queue.length && Object.keys(captured).length < NODE_CAP) {
    const ref = queue.shift();
    if (seen.has(ref)) continue; seen.add(ref);
    const j = await getJson(ref);
    if (!j) { captured[ref] = { error: 'no-response-or-parse' }; continue; }
    const s = summarize(j);
    captured[ref] = s;
    // enqueue children that are model-subtree refs (synthetic refs, not leaf uuids) so we walk the STRUCTURE deterministically
    for (const c of s.children) {
      const cref = c.uuid;
      if (/^(project:|rawbin:|dir:|file:|mof-)/.test(cref) && !seen.has(cref)) queue.push(cref);
      // one level into a class's members (methods/attributes read MODEL_STORE) — class refs look like bare uuids under a file
    }
  }
  return seen.size;
}

// fixed scenario/index-side refs (the OTHER store) — a stable sample so we also baseline the scenario read path
const SCENARIO_REFS = ['rawbin:traceability', 'current-sprint-singleton-0000-000000000001'];

const modelNodes = await bfsModel();
for (const ref of SCENARIO_REFS) { if (!captured[ref]) { const j = await getJson(ref); captured[ref] = j ? summarize(j) : { error: 'no-response' }; } }

// authored-artefact focus: pull the diagram + puml listings out explicitly (class-B artefacts) for a headline count
const diagrams = captured['rawbin:diagram']?.children || [];
const pumls = captured['rawbin:puml']?.children || [];

const artifact = {
  capturedAt: process.env.CAPTURED_AT || 'unstamped',
  base: BASE,
  servedVersion: process.env.SERVED_VERSION || 'unknown',
  nodeCap: NODE_CAP,
  modelNodesWalked: modelNodes,
  refsCaptured: Object.keys(captured).length,
  authoredListings: { diagrams: diagrams.map((d) => ({ uuid: d.uuid, name: d.name })), pumls: pumls.map((p) => ({ uuid: p.uuid, name: p.name })) },
  trees: captured,
};
fs.writeFileSync('test/baseline/premigration-behavioural.json', JSON.stringify(artifact, null, 2) + '\n');

console.log('═══ PRE-MIGRATION BEHAVIOURAL BASELINE (' + BASE + ', v' + artifact.servedVersion + ') ═══');
console.log(`  model-subtree refs captured : ${Object.keys(captured).length} (cap ${NODE_CAP})`);
console.log(`  mof-m1 children             : ${(captured['mof-m1']?.children || []).map((c) => c.uuid).join(', ')}`);
console.log(`  project:RawBin children     : ${(captured['project:RawBin']?.children || []).map((c) => c.uuid).join(', ')}`);
console.log(`  rawbin:diagram (authored)   : ${diagrams.length} diagrams — ${diagrams.map((d) => d.name || d.uuid.slice(0, 8)).join(', ')}`);
console.log(`  rawbin:puml (authored)      : ${pumls.length} pumls`);
console.log('  → artifact: test/baseline/premigration-behavioural.json (per-ref child uuid/name/type/size for exact post-migration diff)');
