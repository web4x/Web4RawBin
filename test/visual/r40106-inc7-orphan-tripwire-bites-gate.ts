// COMMITTED sweep-op/tripwire bite gate — RUNS ON THE ISOLATED SCRATCH-WORKTREE RIG (git worktree + additive EOF export of the fns, boots server.ts in-process). Signed: step-2 54978124d + tripwire 95a38d1f0. See anchor. Not a prod/standalone gate — needs the rig harness setup.
// v0.8.229 ORPHAN-ONLY TRIPWIRE bites (both directions), in-process on real shipped fns (via the 1-line EOF export).
// (a) a ROOM-LINKED unit (live room.fileUnits member) in a sweep list → sweepEnumerated PHASE-1 ABORT, 0 deletions, unit SURVIVES.
//     (stub-must-fail: remove the roomManager.allRooms().find room-member predicate → it passes → RED — architect's negative.)
// (b) deleteRoomComposite STILL deletes a room-linked unit (legit path unbroken — tripwire is sweep-only, NOT in deleteUnitWithScan).
import { sweepEnumerated, deleteRoomComposite } from '../../src/ts/server/server.js';
import WebSocket from 'ws'; import https from 'node:https';
import { existsSync } from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { randomUUID } from 'node:crypto';
const BASE = 'https://localhost:4601', WSS = 'wss://localhost:4601', ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const IDX = path.join(process.cwd(), 'scenario/index');
const shard = (u: string) => path.join(IDX, ...u.slice(0, 5).split(''), u + '.scenario.json');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const shaOf = (list: string[]) => crypto.createHash('sha256').update([...new Set(list)].sort().join('\n')).digest('hex');
const post = (p: string, body: Buffer | string, ct: string) => new Promise<any>((res) => { const u = new URL(BASE + p); const rq = https.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', rejectUnauthorized: false, headers: { 'content-type': ct, 'x-player-token': ST, 'content-length': Buffer.byteLength(body as any) } }, (r) => { let b = ''; r.on('data', (c) => b += c); r.on('end', () => { let j: any = {}; try { j = JSON.parse(b); } catch {} res({ status: r.statusCode, body: j }); }); }); rq.on('error', () => res({ status: 0, body: {} })); rq.write(body); rq.end(); });
const upload = async (room: string, tag: string) => { const B = '----tw'; const body = Buffer.concat([Buffer.from(`--${B}\r\nContent-Disposition: form-data; name="playerToken"\r\n\r\n${ST}\r\n--${B}\r\nContent-Disposition: form-data; name="file"; filename="tw-${tag}.bin"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf8'), Buffer.from('tw-' + tag + '-' + randomUUID()), Buffer.from(`\r\n--${B}--\r\n`, 'utf8')]); const r = await post(`/api/room/${room}/upload`, body, `multipart/form-data; boundary=${B}`); return r.body?.uuid || ''; };
const waitShard = async (u: string) => { for (let i = 0; i < 40; i++) { if (existsSync(shard(u))) return true; await sleep(300); } return false; };

await sleep(4000); // let the imported server.ts finish booting (roomManager load)
const ws = new WebSocket(WSS, { rejectUnauthorized: false }); const msgs: any[] = []; let ready: any, readyP = new Promise((r) => ready = r);
ws.on('message', (raw) => { let m: any; try { m = JSON.parse(raw.toString()); } catch { return; } msgs.push(m); if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'tw' })); else if (m.type === 'PROFILE' && !(ws as any).__c) { (ws as any).__c = true; ws.send(JSON.stringify({ type: 'UPDATE_PROFILE', name: 'SystemTester', secretCode: '4242' })); setTimeout(ready, 1400); } });
ws.on('error', () => {});
const createRoom = async (name: string) => { const s0 = msgs.length; ws.send(JSON.stringify({ type: 'CREATE_ROOM', roomName: name, playerName: 'SystemTester', playerToken: ST })); for (let t = 0; t < 25; t++) { await sleep(250); const j = msgs.slice(s0).find((m) => m.type === 'ROOM_JOINED'); if (j) return j.room?.id; } return null; };

const R: any = {};
await Promise.race([readyP, sleep(15000)]);
try {
  // ── (a) room-linked unit → sweep PHASE-1 ABORT ──
  const roomA = await createRoom('tw-roomA'); const uA = await upload(roomA, 'member-A'); await waitShard(uA);
  const a = sweepEnumerated([uA], { dryRun: false, setSha: shaOf([uA]) });
  const roomLinkedReason = (a.refused || []).some((x: any) => /room-linked/.test(x.reason || ''));
  R.a = a.ok === false && a.phase === 1 && roomLinkedReason && existsSync(shard(uA)); // ABORT + named room-linked + SURVIVES
  console.log(`  (a) room-linked unit in sweep → ok=${a.ok} phase=${a.phase} refused-room-linked=${roomLinkedReason} + unit SURVIVES=${existsSync(shard(uA))} => ${R.a ? 'PASS' : 'RED'} (orphan-only tripwire fires; stub=remove predicate→passes→RED)`);

  // ── (b) deleteRoomComposite STILL deletes a room-linked unit (legit path) ──
  const roomB = await createRoom('tw-roomB'); const uB = await upload(roomB, 'member-B'); await waitShard(uB);
  const before = existsSync(shard(uB));
  const comp = deleteRoomComposite(roomB); await sleep(500);
  const uBgone = !existsSync(shard(uB));
  R.b = before && comp.ok !== false && uBgone; // legit room-delete path DID delete the room-linked unit (not over-refused)
  console.log(`  (b) deleteRoomComposite(roomB) → room-linked unit present-before=${before} + DELETED=${uBgone} (comp.ok=${comp.ok}, exclusiveDestroyed=${comp.exclusiveDestroyed}) => ${R.b ? 'PASS' : 'RED'} (legit path unbroken; over-refusing build would leave it)`);

  R.pass = R.a && R.b;
} catch (e: any) { R.error = String(e?.message || e); R.pass = false; }
finally { try { ws.close(); } catch {} }
console.log('\n=== v0.8.229 ORPHAN-ONLY TRIPWIRE BITES (in-process) ===');
if (R.error) console.log('ERROR:', R.error);
console.log(R.pass ? '★ BOTH GREEN — (a) sweep ABORTS on a room-linked unit (0-del, survives, named) + (b) deleteRoomComposite STILL deletes a room-linked unit (legit path unbroken)' : '★ RED');
process.exit(R.pass ? 0 : 1);
