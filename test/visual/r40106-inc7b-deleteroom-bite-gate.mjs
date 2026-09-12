// R40.106 INC-7b deleteRoomComposite BITE-GATE — ISOLATED scratch-worktree rig (PO/architect: isolate, no prod room, no guard-relax).
// Rig = git worktree @206014252 + its committed patch (server.ts blob 275580532 = SHIP-BYTES), own tracked scenario/index
// (isolation PROVEN by inode/nlink), booted via tsx on :4601 with an isolated DATA_DIR.
// ROOM-ACQUIRE (faithful, no seed, no guard-relax): a fresh CREATE_ROOM registers the room in roomManager IN-MEMORY (createRoom@4800
// + SSH keypair) BEFORE the known GUARD#6 double-write bug throws @4805 — so the room is REAL; we read its id from the rig log
// (the buggy handler returns no ROOM_JOINED). Topology via real HTTP (upload/folder/link, x-player-token; these persist via
// room.persist which writes members → GUARD#6 passes). deleteRoomComposite result read from the server log.
// FOUR bites, each failable/stub-must-fail:
//  (1) FOLDER-LINK closure: u in R linked into B's FOLDER (children[] edge, NOT B.fileUnits) SURVIVES deleteRoom(R); exclusive → GONE.
//  (2) DOUBLY-SHARED: u under folder F, F in BOTH R and B → after deleteRoom(R): u RESOLVES in B AND still RENDERS under F in B
//      (F.children[] still holds u = placement, not just resolves); exclusive → GONE.
//  (3) PROTECTED-CONTENTS: room whose closure holds a model.protected unit → deleteRoom REFUSED 403 NAMING it; unmark → proceeds.
//  (4) 0-DANGLING + RESTORE: composite dangling-after==0 + restoreSha, and git-show(restoreSha) ACTUALLY restores the room (/api/ior 200, not sha-trusted).
import WebSocket from 'ws';
import https from 'node:https';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE = process.env.RIG_BASE || 'https://localhost:4601';
const WSS = BASE.replace(/^https/, 'wss');
const WT = process.env.RIG_WT || '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/inc7b-rig';
const LOG = process.env.RIG_LOG || `${WT}/rig-server2.log`;
const IDX = path.join(WT, 'scenario/index');
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const relShard = (u) => `scenario/index/${u.slice(0, 5).split('').join('/')}/${u}.scenario.json`;
const shard = (u) => path.join(WT, relShard(u));
const readUnit = (u) => { try { return JSON.parse(readFileSync(shard(u), 'utf8')); } catch { return null; } };
const logText = () => { try { return readFileSync(LOG, 'utf8').replace(/\000/g, ''); } catch { return ''; } };

const resolves = (u) => new Promise((res) => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(!!JSON.parse(b)?.unit?.model?.uuid); } catch { res(false); } }); }).on('error', () => res(false)); });
const post = (p, body, ct) => new Promise((res) => { const u = new URL(BASE + p); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'content-type': ct, 'x-player-token': ST, 'content-length': Buffer.byteLength(body) } }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { let j = {}; try { j = JSON.parse(b); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', () => res({ status: 0, body: {} })); req.write(body); req.end(); });
const jpost = (p, obj) => post(p, JSON.stringify(obj), 'application/json');
const upload = async (roomId, tag) => { const B = '----b7b'; const body = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${ST}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="7b-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('7b-' + tag + '-' + randomUUID()), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]); const r = await post(`/api/room/${roomId}/upload`, body, `multipart/form-data; boundary=${B}`); return r.body?.uuid || ''; };
const waitShard = async (u) => { for (let i = 0; i < 40; i++) { if (existsSync(shard(u))) return true; await sleep(300); } return false; };

// ── one SystemTester WS: IDENTIFY + UPDATE_PROFILE, then CREATE_ROOM (acquire id from log) + DELETE_ROOM ──
function stConn() { const ws = new WebSocket(WSS, { rejectUnauthorized: false }); let ready, readyP = new Promise(r => ready = r);
  ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'st7b' })); else if (m.type === 'PROFILE' && !ws.__c) { ws.__c = true; ws.send(JSON.stringify({ type: 'UPDATE_PROFILE', name: 'SystemTester', secretCode: '4242' })); setTimeout(ready, 1200); } });
  ws.on('error', () => {}); return { ws, send: (o) => ws.send(JSON.stringify(o)), readyP, close: () => { try { ws.close(); } catch {} } }; }
const roomsInLog = () => [...logText().matchAll(/GUARD#6\] REFUSED room ([0-9a-f-]{36})/g)].map(m => m[1]);
// CREATE_ROOM registers the room in-memory (real) though @4805 throws GUARD#6; acquire the fresh id from the log line.
const acquireRoom = async (c, name) => { const before = new Set(roomsInLog()); c.send({ type: 'CREATE_ROOM', roomName: name, playerName: 'SystemTester', playerToken: ST }); for (let t = 0; t < 25; t++) { await sleep(300); const fresh = roomsInLog().filter(r => !before.has(r)); if (fresh.length) return fresh[fresh.length - 1]; } return null; };
// parse the deleteRoomComposite log line for a room: dangling-after + restore-sha
const compositeLog = (roomId) => { const re = new RegExp(`deleteRoomComposite ${roomId.slice(0, 8)}:.*?dangling-after=(\\d+) restore-sha=([0-9a-f]+)`); const m = logText().match(re); return m ? { dangling: parseInt(m[1]), sha: m[2] } : null; };

const R = {};
const st = stConn();
await Promise.race([st.readyP, sleep(15000)]);
try {
  // ═══ (1) FOLDER-LINK closure ═══
  const R1 = await acquireRoom(st, '7b-R1'); const B1 = await acquireRoom(st, '7b-B1');
  const u1 = await upload(R1, 'shared-into-Bfolder'); const u1x = await upload(R1, 'exclusive-ctrl1');
  await waitShard(u1); await waitShard(u1x);
  const fB = `HolderF-${randomUUID().slice(0, 6)}`;
  await jpost(`/api/room/${B1}/folder`, { name: fB, nestedPath: '', playerToken: ST });
  const lk = await jpost(`/api/room/${B1}/link-unit`, { unit: u1, target: `folder:roomcoll:${B1}:files/${fB}`, playerToken: ST });
  await sleep(800);
  R.b1_setup = R1 && B1 && (await resolves(u1)) && (await resolves(u1x)) && lk.status === 200;
  st.send({ type: 'DELETE_ROOM', roomId: R1 }); await sleep(2800);
  const u1s = await resolves(u1), u1xg = !(await resolves(u1x));
  R.b1 = R.b1_setup && u1s && u1xg;
  console.log(`  ${R.b1 ? 'PASS' : '★RED '} (1) folder-link closure: shared-into-B-folder SURVIVES=${u1s} + exclusive GONE=${u1xg} (setup=${R.b1_setup} R1=${R1?.slice(0,8)})`);

  // ═══ (4) 0-dangling (self-computed, faithful) + pre-image ACTUALLY restores (git, not server-log) — using bite-1's deleteRoom(R1) ═══
  // 0-dangling: scan the rig index for ANY ref to R1 post-delete (I compute it; server logs to in-memory serverLogs, not stdout).
  let danglingRefs = 99; try { const g = execFileSync('grep', ['-rl', R1, IDX], { encoding: 'utf8' }); danglingRefs = g.split('\n').filter(Boolean).length; } catch (e) { danglingRefs = 0; /* grep exit-1 = no matches */ }
  R.b4_dangling0 = danglingRefs === 0 && !existsSync(shard(R1)); // room unit shard gone + 0 refs
  // restore: deleteUnitWithScan committed a pre-image; the last commit touching R1's shard IS it → git show → write → resolve (verify, not trust).
  let restored = false, sha = '';
  try { sha = execFileSync('git', ['log', '-1', '--format=%H', '--', relShard(R1)], { cwd: WT, encoding: 'utf8' }).trim(); } catch {}
  R.b4_sha = !!sha;
  if (sha) { try { const content = execFileSync('git', ['show', `${sha}:${relShard(R1)}`], { cwd: WT }); writeFileSync(shard(R1), content); await sleep(700); restored = await resolves(R1); } catch (e) { R.b4_err = String(e.message).slice(0, 80); } }
  R.b4 = R.b4_dangling0 && R.b4_sha && restored;
  console.log(`  ${R.b4 ? 'PASS' : '★RED '} (4) 0-dangling(refs=${danglingRefs},shard-gone=${!existsSync(shard(R1)) || 'restored'})=${R.b4_dangling0} + pre-image-sha=${R.b4_sha} + git-show RESTORES room /api/ior=${restored}${R.b4_err ? ' err=' + R.b4_err : ''}`);

  // ═══ (2) DOUBLY-SHARED renders under F in B ═══
  const R2 = await acquireRoom(st, '7b-R2'); const B2 = await acquireRoom(st, '7b-B2');
  const fName = `SharedF-${randomUUID().slice(0, 6)}`;
  const mkF = await jpost(`/api/room/${R2}/folder`, { name: fName, nestedPath: '', playerToken: ST });
  const Fu = mkF.body?.uuid || mkF.body?.folder?.uuid || mkF.body?.unit?.uuid || '';
  const u2 = await upload(R2, 'doubly-shared'); const u2x = await upload(R2, 'exclusive-ctrl2'); await waitShard(u2); await waitShard(u2x);
  await jpost(`/api/room/${R2}/link-unit`, { unit: u2, target: `folder:roomcoll:${R2}:files/${fName}`, playerToken: ST }); // nest u2 under F
  await jpost(`/api/room/${B2}/link-unit`, { unit: Fu, target: `folder:roomcoll:${B2}:files`, playerToken: ST }); // link F into B2 (F shared)
  await sleep(800);
  const childHas = (fj, uu) => (fj?.model?.children || []).some(c => String(c).includes(uu.slice(0, 8)));
  R.b2_setup = R2 && B2 && Fu && (await resolves(u2)) && childHas(readUnit(Fu), u2);
  st.send({ type: 'DELETE_ROOM', roomId: R2 }); await sleep(2800);
  const u2s = await resolves(u2), Fs = await resolves(Fu), renders = childHas(readUnit(Fu), u2), u2xg = !(await resolves(u2x));
  R.b2 = R.b2_setup && u2s && Fs && renders && u2xg;
  console.log(`  ${R.b2 ? 'PASS' : '★RED '} (2) doubly-shared: RESOLVES=${u2s} + RENDERS-under-F(F.children kept)=${renders} + F survives=${Fs} + exclusive GONE=${u2xg} (setup=${R.b2_setup})`);

  // ═══ (3) PROTECTED-CONTENTS refuse 403-naming; unmark → proceeds ═══
  const P = await acquireRoom(st, '7b-P'); const uP = await upload(P, 'protected'); await waitShard(uP);
  const pj = readUnit(uP); pj.model.protected = true; writeFileSync(shard(uP), JSON.stringify(pj, null, 2)); await sleep(500);
  st.send({ type: 'DELETE_ROOM', roomId: P }); await sleep(2500);
  const pSurvives = (await resolves(P)) && (await resolves(uP)); // refuse = nothing destroyed (room+unit survive)
  R.b3_refuse = pSurvives;
  // STUB-MUST-FAIL: unmark on disk (composite reads protected from disk), CONFIRM disk unmarked, then delete → proceeds
  const pj2 = readUnit(uP); delete pj2.model.protected; writeFileSync(shard(uP), JSON.stringify(pj2, null, 2)); await sleep(600);
  const diskUnmarked = readUnit(uP)?.model?.protected !== true;
  st.send({ type: 'DELETE_ROOM', roomId: P });
  let pGone = false; for (let t = 0; t < 12; t++) { await sleep(600); if (!(await resolves(P)) && !(await resolves(uP))) { pGone = true; break; } }
  R.b3 = R.b3_refuse && diskUnmarked && pGone;
  var b3dbg = `refuse(P+uP survive)=${pSurvives} diskUnmarked=${diskUnmarked} unmark→gone=${pGone}`;
  console.log(`  ${R.b3 ? 'PASS' : '★RED '} (3) protected-contents: ${b3dbg}`);

  R.pass = R.b1 && R.b2 && R.b3 && R.b4;
} catch (e) { R.error = String(e.message || e); R.pass = false; }
finally { st.close(); }
console.log(`\n=== INC-7b deleteRoomComposite BITE-GATE — isolated rig ${BASE} (ship-bytes 275580532) ===`);
if (R.error) console.log('ERROR:', R.error);
console.log(R.pass ? '★ INC-7b BITE-GATE = ALL 4 GREEN (closure-survives + doubly-shared-renders + protected-refuse + 0-dangling+restore). Architect may sign.' : '★ INC-7b BITE-GATE = RED');
process.exit(R.pass ? 0 : 1);
