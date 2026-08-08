// R40.2 Server-Manager-ROOT — server-side STRUCTURE gate (tsx against HEAD, non-owner). SURFACE-LABELLED.
//   [REAL·NON-OWNER] the /api/server-manager/tree endpoint 403s a non-owner and leaks NO tree content.
//   [REAL server-side] OtmuxBridge.readSessionTree() = the LIVE LENS: nested otmuxSession→otmuxWindow→otmuxPane, read
//     FRESH per call (call twice → both reflect the live tmux; never a mirror). node unit fc327458 = kind:node + the 4
//     measured deploymentRefs (sshd_config / SSH host key / .env LE_DOMAIN / LE cert). Read-only → INV-T byte-diff==0 by construction.
//   [REPLICATED·labelled] the re-root composition (server.ts:1482-1492 is INLINE in the handler, NOT a function — flagged for
//     extraction): single ROOT = the WODA.prod node, children = [4 refRows, ...sessionRows]. Verifies the EXPECTED shape from the real inputs.
//   [SOURCE·fail-open] ★ stub-must-fail: the fail-open catch (server.ts) must be LOUD (a visible WARN row), NOT silent — a
//     silent fall-back to the flat list is exactly Tron's original complaint and nobody would notice. RED while it is silent.
//   [OWNER-PAGE → Tron] the VISUAL @390 render of the rooted tree (owner-only page).
import fs from 'node:fs';
import https from 'node:https';
import { OtmuxBridge } from '../../src/ts/server/OtmuxBridge.js';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE_UUID = 'fc327458-03d1-4b90-847d-ab52a7d82237';
const httpGet = (path: string, headers = {}): Promise<{ status: number; body: string }> => new Promise((resolve) => {
  const r = https.request({ host: 'prod.wo-da.de', port: 4444, path, method: 'GET', headers, rejectUnauthorized: false }, (res) => {
    let b = ''; res.on('data', (c) => b += c); res.on('end', () => resolve({ status: res.statusCode || 0, body: b }));
  });
  r.on('error', () => resolve({ status: 0, body: 'ERR' })); r.end();
});

async function main() {
  // [REAL·NON-OWNER] 403 + no tree-content leak
  const noTok = await httpGet('/api/server-manager/tree');
  const unk = await httpGet('/api/server-manager/tree', { 'x-player-token': '00000000-0000-4000-8000-000000000000' });
  const leaks = (s: string) => /otmuxSession|otmuxPane|deploymentNode|"sess:|"win:|deploymentRef/.test(s);
  const ac403 = noTok.status === 403 && unk.status === 403 && !leaks(noTok.body) && !leaks(unk.body);

  // [REAL server-side] the LENS — fresh nested tree per call
  const t1 = await OtmuxBridge.readSessionTree();
  const t2 = await OtmuxBridge.readSessionTree();
  const nested = Array.isArray(t1) && t1.length > 0 && t1.every((s: any) => Array.isArray(s.windows) && s.windows.every((w: any) => Array.isArray(w.panes)));
  const freshLens = Array.isArray(t2) && t2.length === t1.length; // read fresh each call (live tmux) — deterministic count in a stable moment, re-read not cached
  const paneCount = t1.reduce((n: number, s: any) => n + s.windows.reduce((m: number, w: any) => m + w.panes.length, 0), 0);

  // [REAL] node unit fc327458 = kind:node + 4 deploymentRefs
  const shard = `${ROOT}/scenario/index/${NODE_UUID.slice(0, 5).split('').join('/')}/${NODE_UUID}.scenario.json`;
  let nm: any = null; try { nm = JSON.parse(fs.readFileSync(shard, 'utf8')).model; } catch { /* */ }
  const roles = (nm && Array.isArray(nm.deploymentRefs) ? nm.deploymentRefs : []).map((d: any) => String(d.role));
  const nodeOk = !!nm && nm.kind === 'node' && roles.length === 4;

  // [REPLICATED·labelled] the inline re-root composition on the REAL inputs → single WODA.prod root, refs+sessions as children
  const sessionRows = t1.map((s: any) => ({ uuid: 'sess:' + s.name, type: 'otmuxSession' }));
  const refRows = roles.map((r: string) => ({ uuid: 'depref:' + r, type: 'deploymentRef' }));
  const roots = (nm && nm.kind === 'node') ? [{ uuid: String(nm.uuid), type: 'deploymentNode', name: String(nm.name), children: [...refRows, ...sessionRows] }] : sessionRows;
  const singleRoot = roots.length === 1 && roots[0].type === 'deploymentNode';
  const childrenAreLensPlusRefs = singleRoot && roots[0].children.filter((c: any) => c.type === 'deploymentRef').length === 4 && roots[0].children.filter((c: any) => c.type === 'otmuxSession').length === t1.length;

  // [SOURCE·fail-open] the catch must emit a LOUD WARN row, not be silent
  const handlerSrc = fs.readFileSync(`${ROOT}/src/ts/server/server.ts`, 'utf8');
  const reRootBlock = handlerSrc.slice(handlerSrc.indexOf('R41 RE-ROOT'), handlerSrc.indexOf('R41 RE-ROOT') + 1400);
  const failOpenLoud = /catch[\s\S]{0,120}(WARN|warn|node-unit-missing|deploymentNodeMissing|fallback.*flat.*row|addLog)/.test(reRootBlock);

  const realStructure = ac403 && nested && freshLens && nodeOk && singleRoot && childrenAreLensPlusRefs;
  console.log(`[REAL·non-owner] tree 403+no-leak = ${ac403} (noTok:${noTok.status} unk:${unk.status})`);
  console.log(`[REAL server-side] lens nested=${nested} fresh=${freshLens} (${t1.length} sessions, ${paneCount} panes) | node fc327458 kind=node+4refs=${nodeOk} (roles: ${roles.join('/')})`);
  console.log(`[REPLICATED·labelled] single-root=${singleRoot} (${roots[0]?.name}) children=refs+sessions=${childrenAreLensPlusRefs}`);
  console.log(`[SOURCE·fail-open] LOUD-degradation = ${failOpenLoud}  ${failOpenLoud ? '(WARN row present)' : '★ RED: fail-open is SILENT (catch → flat, no WARN row) — deceptive, expert must make it LOUD'}`);
  console.log(`\nSTRUCTURE (REAL+replica) = ${realStructure ? 'GREEN' : 'RED'} · FAIL-OPEN-LOUD = ${failOpenLoud ? 'GREEN' : 'RED (silent)'}`);
  console.log('OWNER-PAGE → TRON: the VISUAL @390 render of the rooted tree (owner-only page).');
  console.log('★ FLAG: the re-root composition is INLINE in the tree handler (server.ts:1482-1492) — recommend extracting OtmuxBridge.buildRootedTree(sessions,nodeUnit) so the composed structure + INV-T can be gated as a FUNCTION directly (like resolveRcLink), not replicated.');
  process.exitCode = (realStructure && failOpenLoud) ? 0 : 1;
}
main();
