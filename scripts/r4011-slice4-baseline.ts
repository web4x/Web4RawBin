// R40.11 slice-4 — capture the CURRENT-live baseline tree (OLD array-driven resolver) as the INV-T target,
// and list the EXACT units the old resolver matches (in idx.list() order) so the back-ref is minted on
// precisely that set (same set + same iteration → same row order → INV-T byte-identical). Read-only.
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { OtmuxBridge } from '../src/ts/server/OtmuxBridge.js';
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const NODE = 'fc327458-03d1-4b90-847d-ab52a7d82237';
const idx = new ScenarioIndex(path.join(REPO, 'scenario/index'));

// replicate the OLD resolver's matched set + order (buildServerManagerTree:99-108) exactly
const nm = (idx.get(NODE)?.model || {}) as Record<string, unknown>;
const roles = new Set<string>((Array.isArray(nm.deploymentRefs) ? nm.deploymentRefs : []).map((d: any) => String(d.role)));
const matched: { uuid: string; sourceRole: string }[] = [];
for (const key of idx.list()) {
  const u = idx.get(key);
  if (!u || u.ior !== 'ior:class:ModelElement') continue;
  const m = (u.model || {}) as Record<string, unknown>;
  if (m.sourceRole && roles.has(String(m.sourceRole))) matched.push({ uuid: String(m.uuid), sourceRole: String(m.sourceRole) });
}

const baseline = JSON.stringify(OtmuxBridge.buildServerManagerTree([], idx, NODE));
const OUT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/27b4d618-4c8c-495b-a72b-518b683ccd63/scratchpad/r4011-slice4-baseline.json';
fs.writeFileSync(OUT, baseline);
console.log('roles from array   :', [...roles].join(', '));
console.log('matched units (idx.list() order — MINT back-ref on EXACTLY these):');
matched.forEach((x, i) => console.log(`  [${i}] ${x.uuid} sourceRole=${x.sourceRole}`));
console.log('matched count      :', matched.length);
console.log('baseline tree saved:', OUT, `(${baseline.length} bytes)`);
