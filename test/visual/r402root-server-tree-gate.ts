// [test:uuid:a3f9c1d7-2b48-4e91-8c05-6f1a9d3b74e2] R40.2-root graceful-degradation-is-LOUD — DISTINCT intent (not the
// render-contract e9b21f74): OtmuxBridge.buildRootedTree fail-opens LOUD — a missing / non-`node` unit yields a VISIBLE
// ⚠ notice row naming the uuid + a server WARN, flat sessions still wrapped, NEVER a silent slide to the bare flat list.
// Rides the extracted buildRootedTree Impl (req to mint the Impl unit + adopt this Test — R5 no-invent).
//
// R40.2 Server-Manager-ROOT — now gates the REAL extracted function (buildRootedTree), NOT a [REPLICATED] copy. SURFACE-LABELLED.
//   [REAL·non-owner] /api/server-manager/tree 403s a non-owner, leaks no tree content.
//   [REAL·function] OtmuxBridge.buildRootedTree(realSessions, real fc327458 unit, NODE_UUID) → single ROOT deploymentNode
//     WODA.prod with children [4 deploymentRef rows, ...session rows (otmuxSession→Window→Pane)].
//   [REAL·INV-T] pure composer: does NOT mutate its inputs + deterministic → byte-diff==0.
//   [REAL·function·LOUD] node null / not-a-node → a VISIBLE type:'notice' ⚠ row naming the uuid + a server console.warn;
//     stub-must-fail: strip the notice → roots[0].type flips to 'otmuxSession' (silent flat) → RED.
//   [OWNER-PAGE → Tron] the VISUAL @390 render of the rooted tree.
import fs from 'node:fs';
import https from 'node:https';
import { OtmuxBridge } from '../../src/ts/server/OtmuxBridge.js';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE_UUID = 'fc327458-03d1-4b90-847d-ab52a7d82237';
const httpGet = (p: string, h = {}): Promise<{ status: number; body: string }> => new Promise((res) => {
  const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method: 'GET', headers: h, rejectUnauthorized: false }, (x) => { let b = ''; x.on('data', (c) => b += c); x.on('end', () => res({ status: x.statusCode || 0, body: b })); });
  r.on('error', () => res({ status: 0, body: 'ERR' })); r.end();
});

async function main() {
  // [REAL] served == committed (phantom-guard)
  let served = ''; try { served = JSON.parse((await httpGet('/api/config')).body).version; } catch { /* */ }
  const servedOk = served === '0.8.70';

  // [REAL·non-owner] 403 + no tree-content leak
  const noTok = await httpGet('/api/server-manager/tree');
  const leaks = (s: string) => /otmuxSession|otmuxPane|deploymentNode|"sess:|deploymentRef/.test(s);
  const ac403 = noTok.status === 403 && !leaks(noTok.body);

  // real inputs: live-lens sessions + the real fc327458 node unit
  const sessions: any[] = await OtmuxBridge.readSessionTree();
  const shard = `${ROOT}/scenario/index/${NODE_UUID.slice(0, 5).split('').join('/')}/${NODE_UUID}.scenario.json`;
  const nodeUnit = { model: JSON.parse(fs.readFileSync(shard, 'utf8')).model };
  const nRefs = (nodeUnit.model.deploymentRefs || []).length;
  const nSessions = sessions.length;

  // [REAL·function] compose the rooted tree from the REAL fn
  const roots: any[] = OtmuxBridge.buildRootedTree(sessions as any, nodeUnit as any, NODE_UUID);
  const root = roots[0];
  const composed = roots.length === 1 && root.type === 'deploymentNode' && root.name === 'WODA.prod'
    && root.children.filter((c: any) => c.type === 'deploymentRef').length === nRefs && nRefs === 4
    && root.children.filter((c: any) => c.type === 'otmuxSession').length === nSessions
    && root.children.some((c: any) => c.type === 'otmuxSession' && c.children?.some((w: any) => w.type === 'otmuxWindow' && w.children?.some((p: any) => p.type === 'otmuxPane'))); // nested lens

  // [REAL·INV-T] pure — no input mutation + deterministic
  const sBefore = JSON.stringify(sessions), uBefore = JSON.stringify(nodeUnit);
  const roots2 = OtmuxBridge.buildRootedTree(sessions as any, nodeUnit as any, NODE_UUID);
  const invT = JSON.stringify(sessions) === sBefore && JSON.stringify(nodeUnit) === uBefore && JSON.stringify(roots2) === JSON.stringify(roots);

  // [REAL·function·LOUD] node null / not-a-node → VISIBLE notice + server WARN; stub-must-fail
  const warns: string[] = []; const orig = console.warn; console.warn = (m?: any) => { warns.push(String(m)); };
  const missing = OtmuxBridge.buildRootedTree(sessions as any, null, NODE_UUID);
  const notNode = OtmuxBridge.buildRootedTree(sessions as any, { model: { kind: 'file' } } as any, NODE_UUID);
  console.warn = orig;
  const loud = (r: any[]) => r.length === 1 && r[0].type === 'notice' && /⚠/.test(r[0].name) && r[0].name.includes(NODE_UUID.slice(0, 8)) && r[0].children.length === nSessions; // loud notice, sessions preserved
  const failOpenLoud = loud(missing) && loud(notNode) && warns.length === 2 && warns.every((w) => w.includes(NODE_UUID) && /WARN/.test(w));

  console.log(`[REAL] served==committed==0.8.70 = ${servedOk} (${served})`);
  console.log(`[REAL·non-owner] tree 403+no-leak = ${ac403} (${noTok.status})`);
  console.log(`[REAL·function] composed single-root WODA.prod + ${nRefs} refs + ${nSessions} sessions (nested) = ${composed}`);
  console.log(`[REAL·INV-T] no-mutation + deterministic (byte-diff==0) = ${invT}`);
  console.log(`★ [REAL·function·LOUD] null+not-a-node → notice ⚠ + WARN(uuid) = ${failOpenLoud} (roots[0].type: missing=${missing[0].type} notNode=${notNode[0].type}, warns=${warns.length})`);
  const green = servedOk && ac403 && composed && invT && failOpenLoud;
  console.log(`\n★ R40.2-root REAL-FUNCTION gate = ${green ? 'GREEN — [REAL] end-to-end, zero replicas' : 'RED'}`);
  console.log('OWNER-PAGE → TRON: the VISUAL @390 render of the rooted tree. Test marker a3f9c1d7 → req (rides buildRootedTree Impl).');
  process.exitCode = green ? 0 : 1;
}
main();
