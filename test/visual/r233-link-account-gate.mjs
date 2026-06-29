// T23.3 — Link Account (CONSOLIDATE) flow. Tron's original complaint: "link did not work
// though my secret number was correct." Gate (DET-3x), SystemTester = the LINKER:
//   (3) Link with CORRECT secret code -> CONSOLIDATE_OK.
//   (4) Link with WRONG secret code  -> CONSOLIDATE_FAILED.
//   (5) No phantom profile created during a link attempt (count before == count after).
// CONSOLIDATE_OK is one-shot per target (sets redirectTo), so each iter links a fresh tagged
// target (committed with a known secret code, joined to the System Test Room, deleted after).
// Linker = canonical SystemTester (ce981242). Server: CONSOLIDATE needs both in same room +
// friend.secretCode === msg.secretCode (server.ts:2057).

import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const WSS = 'wss://prod.wo-da.de:4444';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';
const ROOM = '68d0f039-8668-4d2f-a904-2a23c5d6ecc3'; // System Test Room (SystemTester's)
const PROFILES = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/data/profiles.json';
const IDX = '/var/dev/Workspaces/2cuGitHub/Web4RawBin/scenario/index';
const CORRECT = '1357', WRONG = '9999', RUN = randomUUID().slice(0, 8);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const profCount = () => { try { return JSON.parse(fs.readFileSync(PROFILES, 'utf8')).length; } catch { return -1; } };
const shardPath = (u) => path.join(IDX, ...u.slice(0, 5).split(''), u + '.scenario.json');

// connection that identifies, commits a profile, then CREATEs (mode:create) or JOINs a room.
function conn(token, commit, mode, roomId) {
  const msgs = []; const ws = new WebSocket(WSS, { rejectUnauthorized: false });
  let joined = false, resolveJoined, joinedRoomId = null;
  const joinedP = new Promise(r => resolveJoined = r);
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw.toString()); } catch { return; }
    msgs.push(m);
    if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: 'st' }));
    else if (m.type === 'PROFILE' && !ws.__c) {
      ws.__c = true;
      ws.send(JSON.stringify({ type: 'UPDATE_PROFILE', name: commit.name, secretCode: commit.secret }));
      setTimeout(() => {
        if (mode === 'create') ws.send(JSON.stringify({ type: 'CREATE_ROOM', roomName: commit.name + '-room', playerName: commit.name, playerToken: token }));
        else ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId, playerName: commit.name, playerToken: token }));
      }, 1500);
    } else if (m.type === 'ROOM_JOINED' && !joined) { joined = true; joinedRoomId = m.room?.id; resolveJoined(); }
  });
  ws.on('error', () => {});
  return { ws, msgs, token, joinedP, get roomId() { return joinedRoomId; }, send: (o) => ws.send(JSON.stringify(o)), close: () => { try { ws.close(); } catch {} } };
}
const waitMsg = async (c, type, ms = 5000) => { for (let t = 0; t < ms / 200; t++) { const m = c.msgs.find(x => x.type === type); if (m) return m; await sleep(200); } return null; };

// SystemTester (linker) creates a fresh test room
const st = conn(ST, { name: 'SystemTester', secret: '4242' }, 'create');
await Promise.race([st.joinedP, sleep(15000)]);
const testRoom = st.roomId;
console.log('SystemTester room:', testRoom?.slice(0, 8));

const created = [], results = [];
for (let i = 1; i <= 3; i++) {
  const tgt = randomUUID();
  const target = conn(tgt, { name: `LinkTarget-${RUN}-${i}`, secret: CORRECT }, 'join', testRoom);
  await Promise.race([target.joinedP, sleep(12000)]);
  created.push(tgt);
  await sleep(800);

  const before = profCount();
  // (4) WRONG code -> CONSOLIDATE_FAILED
  st.msgs.length = 0;
  st.send({ type: 'CONSOLIDATE', targetToken: tgt, secretCode: WRONG });
  const failed = await waitMsg(st, 'CONSOLIDATE_FAILED');
  const wrongOk = !!failed && /wrong secret/i.test(failed.reason || '');
  const midCount = profCount();
  // (3) CORRECT code -> CONSOLIDATE_OK
  st.msgs.length = 0;
  st.send({ type: 'CONSOLIDATE', targetToken: tgt, secretCode: CORRECT });
  const ok = await waitMsg(st, 'CONSOLIDATE_OK');
  const correctOk = !!ok;
  await sleep(600);
  const after = profCount();
  // (5) no phantom: count unchanged across both link attempts (target already counted)
  const noPhantom = before > 0 && before === midCount && midCount === after;

  const pass = correctOk && wrongOk && noPhantom;
  results.push(pass);
  console.log(`iter ${i}: (4)wrong->FAILED=${wrongOk} | (3)correct->OK=${correctOk} | (5)noPhantom[${before}==${midCount}==${after}]=${noPhantom} => ${pass ? 'GREEN' : 'RED'}`);
  target.close();
  await sleep(400);
}
// cleanup: delete the test room + tagged target scenario units
if (testRoom) st.send({ type: 'DELETE_ROOM', roomId: testRoom });
await sleep(800);
st.close();
let removed = 0; for (const u of [...created, testRoom].filter(Boolean)) { try { fs.unlinkSync(shardPath(u)); removed++; } catch {} }
console.log(`\ncleanup: removed ${removed}/${created.length} target scenario units (LinkTarget-${RUN}-*). NOTE: target profiles in data/profiles.json + SystemTester.consolidatedFrom mutated (in-memory) — flag for purge.`);

console.log('\n=== VERDICT Link Account (DET-3x) ===');
results.forEach((p, i) => console.log(`  iter ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
