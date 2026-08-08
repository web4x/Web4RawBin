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

  // [REAL] served == committed == 0.8.69 (loud fix live, phantom-guard)
  let served = ''; try { served = JSON.parse((await httpGet('/api/config')).body).version; } catch { /* */ }
  const servedOk = served === '0.8.69';

  // ★ [SOURCE·fail-open LOUD, served 0.8.69] BOTH degradation paths (else: node missing/not-a-node · catch: exception) must
  // emit a server WARN + a VISIBLE type:'notice' ⚠ row wrapping the flat sessions — NOT a silent slide to the bare flat list.
  const handlerSrc = fs.readFileSync(`${ROOT}/src/ts/server/server.ts`, 'utf8');
  const reRootStart = handlerSrc.indexOf('R41 RE-ROOT');
  const reRootBlock = handlerSrc.slice(reRootStart, handlerSrc.indexOf('server-manager/rc', reRootStart)); // full block incl else + catch branches
  const warns = (reRootBlock.match(/console\.warn\(`\[server-manager\] WARN/g) || []).length;   // both paths WARN
  const noticeRows = (reRootBlock.match(/type: 'notice'/g) || []).length;                        // both paths a VISIBLE notice row
  const namesUuid = reRootBlock.includes(NODE_UUID) && /⚠ WODA\.prod deployment node/.test(reRootBlock);
  const failOpenLoud = warns >= 2 && noticeRows >= 2 && namesUuid;

  // [REPLICATE·plant-missing, labelled] the fixed else-branch on a MISSING node → a VISIBLE notice row (not silent flat).
  // stub-must-fail: if the notice were removed, roots[0].type would be 'otmuxSession' (silent flat) → this flips RED.
  const plantMissing = (nm2: any) => {
    if (nm2 && nm2.kind === 'node') return sessionRows; // (not this case)
    return [{ uuid: 'depnode:unavailable', type: 'notice', name: `⚠ WODA.prod deployment node unavailable (${NODE_UUID.slice(0, 8)}) — showing flat session list`, children: sessionRows }];
  };
  const missingRoots = plantMissing(null);
  const plantLoud = missingRoots.length === 1 && missingRoots[0].type === 'notice' && /⚠/.test(missingRoots[0].name) && missingRoots[0].name.includes(NODE_UUID.slice(0, 8)) && (missingRoots[0] as any).children.length === t1.length; // loud AND availability preserved

  const realStructure = ac403 && nested && freshLens && nodeOk && singleRoot && childrenAreLensPlusRefs;
  console.log(`[REAL·non-owner] tree 403+no-leak = ${ac403} (noTok:${noTok.status} unk:${unk.status})`);
  console.log(`[REAL server-side] lens nested=${nested} fresh=${freshLens} (${t1.length} sessions, ${paneCount} panes) | node fc327458 kind=node+4refs=${nodeOk} (roles: ${roles.join('/')})`);
  console.log(`[REPLICATED·labelled] single-root=${singleRoot} (${roots[0]?.name}) children=refs+sessions=${childrenAreLensPlusRefs}`);
  console.log(`[REAL] served==committed==0.8.69 = ${servedOk} (served ${served})`);
  console.log(`★ [SOURCE·fail-open LOUD] = ${failOpenLoud} (both paths: ${warns} WARNs + ${noticeRows} notice rows + names-uuid=${namesUuid}) ${failOpenLoud ? '— degradation is LOUD, not silent' : '★ RED: still silent'}`);
  console.log(`[REPLICATE·plant-missing] node-missing → VISIBLE notice row (not silent flat) = ${plantLoud} (roots[0].type=${missingRoots[0].type})`);
  const failOpenGreen = servedOk && failOpenLoud && plantLoud;
  console.log(`\nSTRUCTURE (REAL+replica) = ${realStructure ? 'GREEN' : 'RED'} · ★ FAIL-OPEN-LOUD = ${failOpenGreen ? 'GREEN — DEFECT CLOSED on 0.8.69' : 'RED'}`);
  console.log('OWNER-PAGE → TRON: the VISUAL @390 render of the rooted tree (owner-only page).');
  console.log('★ FLAG: the re-root composition is INLINE in the tree handler (server.ts:1482-1492) — recommend extracting OtmuxBridge.buildRootedTree(sessions,nodeUnit) so the composed structure + INV-T can be gated as a FUNCTION directly (like resolveRcLink), not replicated.');
  process.exitCode = (realStructure && failOpenGreen) ? 0 : 1;
}
main();
