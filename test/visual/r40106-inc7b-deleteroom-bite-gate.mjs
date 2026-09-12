// R40.106 INC-7b deleteRoomComposite BITE-GATE — ISOLATED scratch-worktree rig (PO/architect: isolate, no prod room, no guard-relax).
// Rig = git worktree @38e6fa06b (v0.8.224, GUARD#6 CREATE_ROOM fix) + committed 7b patch = the faithful 7b SHIP-BASE.
// Own tracked scenario/index (isolation PROVEN by inode/nlink), booted via tsx on :4601, isolated DATA_DIR.
// CREATE_ROOM WORKS on v0.8.224 → roomId from ROOM_JOINED directly (no log-acquire). Topology via real HTTP (x-player-token).
// FOUR bites, each failable / stub-must-fail:
//  (1) FOLDER-LINK closure: u in R linked into B's FOLDER (children[] edge, NOT B.fileUnits) SURVIVES deleteRoom(R); exclusive → GONE.
//  (2) DOUBLY-SHARED: u under folder F, F in BOTH R and B → after deleteRoom(R): u RESOLVES in B AND still RENDERS under F in B
//      (F.children[] still holds u = placement, not just resolves); exclusive → GONE.
//  (3) PROTECTED-CONTENTS: room whose closure holds a model.protected unit → deleteRoom REFUSED (room+unit survive); unmark → proceeds (GONE).
//  (4) 0-DANGLING + RESTORE (dedicated EXCLUSIVE-only room): deleteRoom → all units GONE + room GONE + 0 refs to room in index + git pre-image RESTORES room (/api/ior 200, verified not sha-trusted).
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
const IDX = path.join(WT, 'scenario/index');
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const relShard = (u) => `scenario/index/${u.slice(0, 5).split('').join('/')}/${u}.scenario.json`;
const shard = (u) => path.join(WT, relShard(u));
const readUnit = (u) => { try { return JSON.parse(readFileSync(shard(u), 'utf8')); } catch { return null; } };
const resolves = (u) => new Promise((res) => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { try { res(!!JSON.parse(b)?.unit?.model?.uuid); } catch { res(false); } }); }).on('error', () => res(false)); });
const post = (p, body, ct) => new Promise((res) => { const u = new URL(BASE + p); const req = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'content-type': ct, 'x-player-token': ST, 'content-length': Buffer.byteLength(body) } }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { let j = {}; try { j = JSON.parse(b); } catch {} res({ status: r.statusCode, body: j }); }); }); req.on('error', () => res({ status: 0, body: {} })); req.write(body); req.end(); });
const jpost = (p, obj) => post(p, JSON.stringify(obj), 'application/json');
const upload = async (roomId, tag) => { const B = '----b7b'; const body = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${ST}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="7b-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('7b-' + tag + '-' + randomUUID()), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]); const r = await post(`/api/room/${roomId}/upload`, body, `multipart/form-data; boundary=${B}`); return r.body?.uuid || ''; };
const waitShard = async (u) => { for (let i = 0; i < 40; i++) { if (existsSync(shard(u))) return true; await sleep(300); } return false; };
const childHas = (fj, uu) => (fj?.model?.children || []).some(c => String(c).includes(uu.slice(0, 8)));
// refs to a ROOM in the index (excluding the room's own shard) — for 0-dangling on a clean exclusive-only delete
const refsToRoom = (roomId) => { try { return execFileSync('grep', ['-rl', roomId, IDX], { encoding: 'utf8' }).split('\n').filter(Boolean).filter(f => !f.includes(roomId)).length; } catch { return 0; } };

function stConn() { const ws = new WebSocket(WSS, { rejectUnauthorized: false }); const msgs = []; let ready, readyP = new Promise(r => ready = r);
  ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } msgs.push(m); if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'st7b' })); else if (m.type === 'PROFILE' && !ws.__c) { ws.__c = true; ws.send(JSON.stringify({ type: 'UPDATE_PROFILE', name: 'SystemTester', secretCode: '4242' })); setTimeout(ready, 1200); } });
  ws.on('error', () => {}); return { ws, msgs, send: (o) => ws.send(JSON.stringify(o)), readyP, close: () => { try { ws.close(); } catch {} } }; }
// CREATE_ROOM works on v0.8.224 → capture room.id from the next ROOM_JOINED
const createRoom = async (c, name) => { const since = c.msgs.length; c.send({ type: 'CREATE_ROOM', roomName: name, playerName: 'SystemTester', playerToken: ST }); for (let t = 0; t < 25; t++) { await sleep(250); const j = c.msgs.slice(since).find(m => m.type === 'ROOM_JOINED'); if (j) return j.room?.id; } return null; };

const R = {};
const st = stConn();
await Promise.race([st.readyP, sleep(15000)]);
try {
  // ═══ (1) FOLDER-LINK closure ═══
  const R1 = await createRoom(st, '7b-R1'); const B1 = await createRoom(st, '7b-B1');
  const u1 = await upload(R1, 'shared-into-Bfolder'); const u1x = await upload(R1, 'exclusive-ctrl1'); await waitShard(u1); await waitShard(u1x);
  const fB = `HolderF-${randomUUID().slice(0, 6)}`;
  await jpost(`/api/room/${B1}/folder`, { name: fB, nestedPath: '', playerToken: ST });
  const lk = await jpost(`/api/room/${B1}/link-unit`, { unit: u1, target: `folder:roomcoll:${B1}:files/${fB}`, playerToken: ST }); await sleep(700);
  R.b1_setup = R1 && B1 && (await resolves(u1)) && (await resolves(u1x)) && lk.status === 200;
  st.send({ type: 'DELETE_ROOM', roomId: R1 }); await sleep(2800);
  const u1s = await resolves(u1), u1xg = !(await resolves(u1x));
  R.b1 = R.b1_setup && u1s && u1xg;
  console.log(`  ${R.b1 ? 'PASS' : '★RED '} (1) folder-link closure: shared-into-B-folder SURVIVES=${u1s} + exclusive GONE=${u1xg} (setup=${R.b1_setup} R1=${R1?.slice(0,8)})`);

  // ═══ (2) DOUBLY-SHARED renders under F in B ═══
  const R2 = await createRoom(st, '7b-R2'); const B2 = await createRoom(st, '7b-B2');
  const fName = `SharedF-${randomUUID().slice(0, 6)}`;
  const mkF = await jpost(`/api/room/${R2}/folder`, { name: fName, nestedPath: '', playerToken: ST });
  const Fu = mkF.body?.uuid || mkF.body?.folder?.uuid || mkF.body?.unit?.uuid || '';
  const u2 = await upload(R2, 'doubly-shared'); const u2x = await upload(R2, 'exclusive-ctrl2'); await waitShard(u2); await waitShard(u2x);
  await jpost(`/api/room/${R2}/link-unit`, { unit: u2, target: `folder:roomcoll:${R2}:files/${fName}`, playerToken: ST });
  await jpost(`/api/room/${B2}/link-unit`, { unit: Fu, target: `folder:roomcoll:${B2}:files`, playerToken: ST }); await sleep(700);
  R.b2_setup = R2 && B2 && Fu && (await resolves(u2)) && childHas(readUnit(Fu), u2);
  st.send({ type: 'DELETE_ROOM', roomId: R2 }); await sleep(2800);
  const u2s = await resolves(u2), Fs = await resolves(Fu), renders = childHas(readUnit(Fu), u2), u2xg = !(await resolves(u2x));
  R.b2 = R.b2_setup && u2s && Fs && renders && u2xg;
  console.log(`  ${R.b2 ? 'PASS' : '★RED '} (2) doubly-shared: RESOLVES=${u2s} + RENDERS-under-F(F.children kept)=${renders} + F survives=${Fs} + exclusive GONE=${u2xg} (setup=${R.b2_setup})`);

  // ═══ (3) PROTECTED-CONTENTS refuse; unmark → proceeds ═══
  const P = await createRoom(st, '7b-P'); const uP = await upload(P, 'protected'); await waitShard(uP);
  const pj = readUnit(uP); pj.model.protected = true; writeFileSync(shard(uP), JSON.stringify(pj, null, 2)); await sleep(500);
  st.send({ type: 'DELETE_ROOM', roomId: P }); await sleep(2500);
  const refuse = (await resolves(P)) && (await resolves(uP));
  // stub-must-fail: unmark model.protected AND (guard against owner-identity protection) neutralize owner → proceeds
  const pj2 = readUnit(uP); delete pj2.model.protected; pj2.model.uploaderToken = ''; pj2.model.ownerToken = ''; pj2.ownerIor = `ior:instance:${P}`; writeFileSync(shard(uP), JSON.stringify(pj2, null, 2)); await sleep(600);
  st.send({ type: 'DELETE_ROOM', roomId: P });
  await sleep(4000); // settle full teardown, then assert gone AND stays-gone (resurrection window)
  const pg1 = !(await resolves(P)) && !(await resolves(uP));
  await sleep(3000);
  const pGone = pg1 && !(await resolves(P)) && !(await resolves(uP));
  R.b3 = refuse && pGone;
  console.log(`  ${R.b3 ? 'PASS' : '★RED '} (3) protected-contents: REFUSED(P+uP survive)=${refuse} | STUB unmark→proceeds GONE=${pGone}`);

  // ═══ (4) 0-DANGLING + RESTORE (dedicated exclusive-only room) ═══
  const R4 = await createRoom(st, '7b-R4-exclusive');
  const e1 = await upload(R4, 'excl-a'); const e2 = await upload(R4, 'excl-b'); await waitShard(e1); await waitShard(e2);
  R.b4_setup = R4 && (await resolves(e1)) && (await resolves(e2));
  st.send({ type: 'DELETE_ROOM', roomId: R4 });
  await sleep(4000); // WAIT for the full teardown to settle (broadcast ROOM_DELETED + removeRoom) — resurrection fired DURING teardown pre-fix
  const gone1 = !(await resolves(R4)) && !existsSync(shard(R4));
  await sleep(3000); // resurrection window — assert it STAYS gone (the deleted-flag fix)
  const staysGone = !(await resolves(R4)) && !existsSync(shard(R4));
  const e1g = !(await resolves(e1)), e2g = !(await resolves(e2)), roomGone = gone1 && staysGone;
  const dangling = refsToRoom(R4);
  R.b4_clean = R.b4_setup && e1g && e2g && roomGone && dangling === 0;
  // restore: git pre-image (deleteUnitWithScan committed it) → git show → write → resolves
  let sha = '', restored = false;
  try { sha = execFileSync('git', ['log', '-1', '--format=%H', '--', relShard(R4)], { cwd: WT, encoding: 'utf8' }).trim(); } catch {}
  if (sha) { try { const content = execFileSync('git', ['show', `${sha}:${relShard(R4)}`], { cwd: WT }); writeFileSync(shard(R4), content); await sleep(700); restored = await resolves(R4); } catch (e) { R.b4_err = String(e.message).slice(0, 80); } }
  R.b4 = R.b4_clean && !!sha && restored;
  console.log(`  ${R.b4 ? 'PASS' : '★RED '} (4) exclusive-only: units GONE=${e1g && e2g} + room GONE&STAYS-gone(post-teardown)=${roomGone} + 0-dangling(refs=${dangling}) + pre-image RESTORES /api/ior=${restored}${R.b4_err ? ' err=' + R.b4_err : ''}`);

  R.pass = R.b1 && R.b2 && R.b3 && R.b4;
} catch (e) { R.error = String(e.message || e); R.pass = false; }
finally { st.close(); }
console.log(`\n=== INC-7b deleteRoomComposite BITE-GATE — isolated rig ${BASE} (v0.8.224 + 7b patch = ship-base) ===`);
if (R.error) console.log('ERROR:', R.error);
console.log(R.pass ? '★ INC-7b BITE-GATE = ALL 4 GREEN (closure + doubly-shared-renders + protected-refuse/proceeds + 0-dangling+restore). Architect may sign.' : '★ INC-7b BITE-GATE = RED');
process.exit(R.pass ? 0 : 1);
