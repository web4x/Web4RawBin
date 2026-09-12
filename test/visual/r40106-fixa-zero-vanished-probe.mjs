// R40.106 FIX-A 0-VANISHED probe (PO) — READ-ONLY, no writes, no room creation. @served v0.8.218.
// The union render exists SPECIFICALLY so legacy FOLDER-NESTED LOCATION-ONLY units (in a folder by physical location,
// ABSENT from that folder's children[] edge) don't vanish. Expert baseline (r40106-pure-edge-backfill-endstate.md) = 4.
// (1) RE-DERIVE the folder-nested location-only strand from scenario/index (independent; expect count==4).
// (2) Confirm EACH still RENDERS under its folder on 218: /api/trace/children/<folderLoc> INCLUDES the unit (union honors location).
// (3) Spot-check a couple real folders' child-counts for sanity. ANY of the strand NOT rendering = live disappearance → RED loud.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const bare = (r) => String(r || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
const rendered = (ref) => new Promise(res => { const x = new URL(`${BASE}/api/trace/children/${encodeURIComponent(ref)}`); https.get({ hostname: x.hostname, port: x.port, path: x.pathname, rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res((JSON.parse(b).children || []).map(c => bare(c.uuid || ''))); } catch { res([]); } }); }).on('error', () => res([])); });
let served = '?'; try { served = JSON.parse(execSync(`curl -sk ${BASE}/api/config`, { encoding: 'utf8' })).version; } catch {}

// build Folder map: location → { uuid, children:Set } ; and collect non-folder units with a nested room location
const folderFiles = execSync(`grep -ral '"ior": "ior:class:Folder"' ${REPO}/scenario/index 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const folderByLoc = new Map();
for (const f of folderFiles) { try { const m = JSON.parse(readFileSync(f, 'utf8')).model || {}; if (m.location) folderByLoc.set(String(m.location), { uuid: String(m.uuid || ''), children: new Set((m.children || []).map(bare)) }); } catch {} }

const roomMembers = async (roomId) => { const m = await new Promise(res => { https.get(`${BASE}/api/ior/ior:instance:${roomId}`, { rejectUnauthorized: false }, r => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(JSON.parse(b)?.unit?.model || null); } catch { res(null); } }); }).on('error', () => res(null)); }); return new Set((m?.files || []).map(bare)); };
const memberCache = new Map();
const locFiles = execSync(`grep -ral '"location": "roomcoll:' ${REPO}/scenario/index 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const atRisk = []; let nestedTotal = 0;
for (const f of locFiles) {
  let u; try { u = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; }
  const m = u.model || {}; if (String(u.ior) === 'ior:class:Folder') continue; // folders aren't the vanishing risk
  const loc = String(m.location || ''); const uuid = String(m.uuid || ''); if (!loc.includes(':files/') || !uuid) continue;
  const containingFolder = loc.slice(0, loc.lastIndexOf('/'));         // strip the unit's own segment → its folder path
  if (containingFolder.endsWith(':files')) continue;                    // room-root (renders via room.fileUnits, not a folder edge) — NOT the strand
  nestedTotal++;
  const folder = folderByLoc.get(containingFolder);
  const inEdges = folder ? folder.children.has(uuid) : false;
  if (!inEdges) {
    const roomId = (loc.match(/roomcoll:([^:]+):/) || [])[1] || '';
    if (!memberCache.has(roomId)) memberCache.set(roomId, await roomMembers(roomId));
    const isMember = memberCache.get(roomId).has(uuid);              // live containment vs a removed unit with a STALE location
    const testRoom = roomId.startsWith('909f1bd6');
    atRisk.push({ uuid, loc, folderLoc: containingFolder, folderUuid: folder?.uuid || '(folder-unresolved)', isMember, testRoom });
  }
}
// the TRUE 0-vanished risk = a LIVE room member (not a removed unit with stale location), and on Tron's real tree (not the test room)
const liveReal = atRisk.filter(a => a.isMember && !a.testRoom);
const removedLeftover = atRisk.filter(a => !a.isMember);

console.log(`=== R40.106 FIX-A 0-VANISHED probe — SERVED v${served} (READ-ONLY) ===`);
console.log(`  folder-nested units total=${nestedTotal} | folder-nested LOCATION-ONLY (no edge) = ${atRisk.length}  [LIVE-member=${atRisk.filter(a=>a.isMember).length}, removed-stale-location=${removedLeftover.length}, in-test-room-909f1bd6=${atRisk.filter(a=>a.testRoom).length}]`);
// ── the TRUE 0-vanished check: LIVE real-room members must still render (a removed unit with a stale location is NOT a disappearance) ──
let allRealRender = true;
console.log(`\n  LIVE real-room folder-nested location-only (the genuine disappearance risk) = ${liveReal.length}:`);
for (const a of liveReal) { const kids = await rendered(a.folderLoc); const renders = kids.includes(a.uuid); if (!renders) allRealRender = false; console.log(`    ${a.uuid.slice(0,8)} ${a.loc.replace('roomcoll:','')} → renders=${renders ? 'YES' : '★NO — LIVE DISAPPEARANCE, REPORT NOW'}`); }
if (!liveReal.length) console.log(`    (none — no LIVE real-room unit is folder-nested-location-only → real user data has ZERO disappearance risk from the union flip)`);
// ── the 4 that matched the count are removed test leftovers with a stale location (unlink cleared parent+edge+membership, NOT location) ──
console.log(`\n  removed/stale-location leftovers (NOT a disappearance — non-members, correctly not rendered) = ${removedLeftover.length}:`);
for (const a of removedLeftover) console.log(`    ${a.uuid.slice(0,8)} ${a.loc.replace('roomcoll:','')} member=${a.isMember} testRoom=${a.testRoom}`);

// ── FOLDER STRAND (PO 2026-09-12: folders were the BLIND SPOT — a location-only child FOLDER (nested under a parent
//    folder by location, ABSENT from that parent's children[] edge) would ALSO vanish on the pure-edge flip, taking its
//    contents unreachable. The old probe `continue`d past folders = the gate-blindness class. Fold it in PERMANENTLY. ──
// predicate: a Folder nested UNDER ANOTHER folder whose parent's children[] does NOT contain it = location-only-no-edge.
const folderAtRiskP = (uuid, loc) => { if (!loc.includes(':files/')) return false; const containing = loc.slice(0, loc.lastIndexOf('/')); if (containing.endsWith(':files')) return false; const parent = folderByLoc.get(containing); return !(parent && parent.children.has(uuid)); };
const folderAtRisk = [];
for (const [loc, folder] of folderByLoc) { if (folderAtRiskP(folder.uuid, loc)) { const roomId = (loc.match(/roomcoll:([^:]+):/) || [])[1] || ''; folderAtRisk.push({ uuid: folder.uuid, loc, testRoom: roomId.startsWith('909f1bd6') }); } }
const folderLiveReal = folderAtRisk.filter(a => !a.testRoom);
console.log(`\n  FOLDER STRAND (nested child folders): total-nested-folders=${[...folderByLoc.keys()].filter(l => l.includes(':files/') && !l.slice(0, l.lastIndexOf('/')).endsWith(':files')).length} | location-only-no-edge = ${folderAtRisk.length} [live-real=${folderLiveReal.length}, test-room=${folderAtRisk.filter(a=>a.testRoom).length}]`);
for (const a of folderLiveReal) console.log(`    ★ LIVE-REAL child folder ${a.uuid.slice(0,8)} ${a.loc.replace('roomcoll:','')} = location-only, WOULD VANISH on flip → REPORT`);
if (!folderLiveReal.length) console.log(`    (none — every nested child folder carries its parent children[] edge → 0 folder disappearance risk)`);

// ── FAILABLE CONTROL (PO: prove the folder-detection is NOT blind — a synthetic location-only child folder MUST read at-risk=1) ──
const CTRL_PARENT = 'roomcoll:__ctrl__:files/P', CTRL_CHILD = 'ctrl-loconly-folder', CTRL_LOC = 'roomcoll:__ctrl__:files/P/C';
folderByLoc.set(CTRL_PARENT, { uuid: 'ctrl-parent', children: new Set() });   // a parent with NO edge to the synthetic child
const ctrlDetected = folderAtRiskP(CTRL_CHILD, CTRL_LOC);                       // same predicate the real scan uses
folderByLoc.delete(CTRL_PARENT);
console.log(`  FAILABLE control: synthetic location-only child folder → at-risk=${ctrlDetected ? 1 : 0} (want 1) ${ctrlDetected ? '✓ folder-detection sees folders' : '★ BLIND — the probe would miss a vanishing folder'}`);

console.log(`\n  ★ RECONCILE-WITH-EXPERT: my strand count=${atRisk.length} matches the boarded baseline of 4, BUT all ${removedLeftover.length} are NON-MEMBER removed units w/ stale location (mostly test room 909f1bd6) — NOT live legacy data. Confirm the expert's baseline-4 are THESE (→ strand is stale-location cleanup, real-data risk=0) or DIFFERENT real units (→ send uuids).`);
// GREEN = zero LIVE real-room FILES vanish AND zero LIVE real-room nested FOLDERS location-only AND the failable control fires.
const green = allRealRender && folderLiveReal.length === 0 && ctrlDetected;
console.log(green
  ? `\n★ 0-VANISHED = GREEN @v${served} — FILES: ${liveReal.length} live-real location-only (all render); FOLDERS: ${folderLiveReal.length} live-real nested location-only; failable control fires (at-risk=1). Real-data disappearance risk (files AND folders) = 0. Test-room/removed-stale-location leftovers are not disappearances.`
  : `\n★ RED @v${served} — ${!ctrlDetected ? 'FAILABLE CONTROL DID NOT FIRE (folder-detection blind — instrument broken)' : (folderLiveReal.length ? 'a LIVE real-room CHILD FOLDER is location-only = WOULD VANISH on flip' : 'a LIVE real-room FILE does not render = disappearance')}. REPORT IMMEDIATELY.`);
process.exit(green ? 0 : 1);
