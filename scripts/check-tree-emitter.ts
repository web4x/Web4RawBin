/**
 * R40.11 slice-2/3 GATE (PATH-UNIFIED). The server-manager tree must emit REAL typed-unit iors for the node's
 * deployment refs, NEVER the synthetic 'depref:'+role that hung the drawer. ★ This gate asserts the SERVED
 * composition — OtmuxBridge.buildServerManagerTree, the SAME fn /api/server-manager/tree calls — against the
 * REAL scenario/index, NOT an isolated fn with hand-passed fakes. (The prior gate tested buildRootedTree in
 * isolation while the served route never called it = a GREEN gate over code the server never runs. That
 * armed-but-inert / gate-points-at-an-uncalled-fn blindness is the whole point of this fix.)
 *
 * Run: /opt/node22/bin/node --import tsx scripts/check-tree-emitter.ts   (exits 1 on any failure)
 */
// [test:uuid:e2b8f574-1a3c-4d9e-b06f-8c47a1e5d3b2] R40.11 AC-2 emitter — OtmuxBridge.buildServerManagerTree (Impl 792be0fd) emits REAL typed-unit iors for the node's deployment refs (0 synthetic depref:), INV-T session-subtree stable, stub-must-fail (a planted depref: IS detected). SERVED-path gate: exercises the SAME fn /api/server-manager/tree calls, vs the REAL scenario/index. DISTINCT-INTENT from 5c7e0a91 (graph+disk typed-model on e009ace7) — this verifies the EMISSION (real-ior, no synthetic), not the typed model.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OtmuxBridge } from '../src/ts/server/OtmuxBridge.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NODE = 'fc327458-03d1-4b90-847d-ab52a7d82237';
const sessions: any = [{ name: 'projectTeam', windows: [{ index: '0', name: '', active: true, panes: [{ paneId: '%13', index: '0', title: 'robbin-expert', active: true, label: 'expert' }] }] }];
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));

const fails: string[] = [];
const check = (c: boolean, m: string): void => { if (!c) fails.push(m); };

// SERVED composition — the SAME fn the route calls (path-unify: the gate now tests what the server RUNS).
const served = OtmuxBridge.buildServerManagerTree(sessions, idx, NODE);
const json = JSON.stringify(served);

// (1) the synthetic path is GONE from the SERVED output — a regression re-introducing depref: goes RED.
check(!/depref:/.test(json), 'SERVED tree still contains a synthetic depref: id (the drawer-hang shape)');
// (2) the RESOLUTION actually ran against real data: real 'deploymentUnit' rows carry the 5 slice-1 typed units
//     (ssh-service resolves to BOTH the Service and its configuredBy ConfigFile — the 1→2 split).
const refRows = (served[0]?.children || []).filter((r: any) => r.type === 'deploymentUnit');
const EXPECT = ['71bd2de9', 'fb4de69d', '9a67e869', 'b49a18ff', '0e6884ef'];
check(refRows.length >= 5 && EXPECT.every(p => refRows.some((r: any) => String(r.uuid).startsWith(p))), `SERVED tree missing real typed-unit rows (got ${refRows.length} deploymentUnit rows; expect the 5 slice-1 units)`);
// (3) INV-T — the session subtree is byte-identical whether or not the ref rows are present.
const node = idx.get(NODE);
const noUnits = OtmuxBridge.buildRootedTree(sessions, node, NODE, []);
const sess = (t: any) => JSON.stringify((t[0]?.children || []).filter((r: any) => r.type === 'otmuxSession'));
check(sess(served) === sess(noUnits), 'INV-T VIOLATED: session subtree changed with the ref rows');
// (4) stub-must-fail — the no-depref: assertion CAN fire: a planted depref: id IS detected.
const stub = OtmuxBridge.buildRootedTree(sessions, node, NODE, [{ uuid: 'depref:ssh', name: 'x' }]);
check(/depref:/.test(JSON.stringify(stub)), 'stub-must-fail broken: a planted depref: was not detectable');

if (fails.length) { console.error('✗ check-tree-emitter FAILED:'); for (const f of fails) console.error('  - ' + f); process.exit(1); }
console.log(`✓ check-tree-emitter PASS (SERVED path) — ${refRows.length} real deploymentUnit rows, 0 synthetic depref:, INV-T stable, stub-must-fail holds.`);
