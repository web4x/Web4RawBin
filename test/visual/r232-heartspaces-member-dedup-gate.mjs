// v0.6.84 gate — Heartspaces member list shows ONE Marcel Donges (was 2 consolidated
// tombstones) + the Marcel badge carries the PRIMARY token (Link Account can't target a
// tombstone). Fix a30315bcc: Room.allMemberInfo() dedups members by resolveToken(redirectTo).
//
// Uses the canonical SystemTester identity (ce981242 — NO new user). Connects, joins the
// public Heartspaces room, reads the served allMemberInfo() (ROOM_JOINED.members), leaves.
//   (1) exactly 1 member named "Marcel Donges"
//   (2) that member's playerToken === primary 8f74dfba (resolved, not a tombstone)

import WebSocket from 'ws';

const WSS = 'wss://prod.wo-da.de:4444';
const ST = 'ce981242-74fe-4d44-b5b6-43c641e224df';      // SystemTester (canonical, reused)
const HEARTSPACES = '6c04f959-f3d6-42eb-818f-5e2e4498bf91';
const PRIMARY = '8f74dfba-ccf6-4f52-9c0d-b3c327ee53dd';  // merged Marcel primary
const TOMBSTONES = ['3effa1fc-a548-4619-a3ff-fb96382eca22', '2703628c-4de9-43da-adf8-7d4e19e6acc8'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// one full connect → identify(SystemTester) → commit profile → JOIN Heartspaces →
// capture ROOM_JOINED.members → LEAVE. Returns the served member list.
function joinAndGetMembers(ms = 7000) {
  return new Promise((resolve) => {
    const ws = new WebSocket(WSS, { rejectUnauthorized: false });
    let committed = false, joinSent = false, members = null;
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw.toString()); } catch { return; }
      if (m.type === 'welcome') ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: ST, deviceId: 'st' }));
      else if (m.type === 'PROFILE' && !committed) {
        committed = true;
        ws.send(JSON.stringify({ type: 'UPDATE_PROFILE', name: 'SystemTester', secretCode: '4242' })); // ensure committed (idempotent)
        setTimeout(() => { if (!joinSent) { joinSent = true; ws.send(JSON.stringify({ type: 'JOIN_ROOM', roomId: HEARTSPACES, playerName: 'SystemTester', playerToken: ST })); } }, 1500);
      } else if (m.type === 'ROOM_JOINED' && members === null) {
        members = m.members || [];
        ws.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
        setTimeout(() => { try { ws.close(); } catch {} resolve(members); }, 300);
      }
    });
    ws.on('error', () => {});
    setTimeout(() => { try { ws.close(); } catch {} resolve(members); }, ms);
  });
}

const results = [];
for (let run = 1; run <= 3; run++) {
  const members = await joinAndGetMembers();
  const marcels = (members || []).filter(x => x.name === 'Marcel Donges');
  const oneMarcel = marcels.length === 1;                                   // (1)
  const tok = marcels[0]?.playerToken;
  const primaryBadge = tok === PRIMARY && !TOMBSTONES.includes(tok);        // (2)
  const pass = !!members && oneMarcel && primaryBadge;
  results.push(pass);
  console.log(`run ${run}: members=${members ? members.length : 'NONE'} marcelCount=${marcels.length} marcelToken=${tok ? tok.slice(0, 8) : '-'} primary(8f74dfba)=${primaryBadge} => ${pass ? 'GREEN' : 'RED'}`);
  await sleep(500);
}

console.log('\n=== VERDICT Heartspaces member dedup (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
