// [test:uuid:4c93e285-1cd5-4be2-a051-a3a1891b26ee] R21.3 registerSymlink — phone alt-symlink resolves (GET /api/phone -> token)
// [test:uuid:1fd43df9-5703-4012-ad93-bc22da3548db] R21.5 mintAndLink — email unit minted + device-link challenge
// [test:uuid:2d069fd0-ce5d-428f-a6df-01b021d0fad3] R21.6 mintAndLink — phone unit minted + Profile.phones[] + resolves
// R21.5 + R21.6 gate — emails & phones as scenario units + alt-UUID index, v0.6.69.
// R21.5 d4aad5081 (Email units) + R21.6 f420c79de (Phone units).
//
// Server facts (server.ts): Profile unit uuid === token (line 203). On committed
// UPDATE_PROFILE: indexProfilePhone -> PhoneIndex.mintAndLink (Phone unit +
// Profile.phones[] + alt/phone symlink); indexProfileEmail -> Email units + alt/email
// symlinks. resolveKeyToProfile(phone,email) drives the IDENTIFY KNOWN_KEY_CHALLENGE.
// No /api/email REST exists (404) — email lookup is verified via the device-link
// challenge, exactly as the PO specified.
//
// Faithful, mostly wire-level. ONE committed test user; across 3 iters we add a
// distinct phone+email each time (exercises multiple-per-profile) and verify:
//   R21.6: GET /api/phone/<phone_i> resolves to our token (404 before = RED baseline)
//   R21.5: fresh-token IDENTIFY{email_i} -> KNOWN_KEY_CHALLENGE{profileUuid===token}, no mint
// Plus standalone: phone regression (Tron +49... -> 3effa1fc) and Tron's seeded gmail
// -> challenge -> 3effa1fc.

import WebSocket from 'ws';
import https from 'https';
import { randomUUID } from 'crypto';

const HOST = 'prod.wo-da.de', PORT = 4444;
const WSS = `wss://${HOST}:${PORT}`;
const TRON_UUID = '3effa1fc-a548-4619-a3ff-fb96382eca22';
const TRON_PHONE = '+4915253844085';
const TRON_GMAIL = 'marcel.donges@gmail.com';
const RUN = randomUUID().slice(0, 8); // unique per process run
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const _get1 = (p) => new Promise((res) => {
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => {
    let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, body: d, json: j }); });
  });
  req.on('error', () => res({ status: 0, body: '', json: null }));
  req.on('timeout', () => { req.destroy(); res({ status: 0, body: '', json: null }); });
});
// Retry transient TCP errors (status 0) so a connection blip never causes a false RED.
const apiGet = async (p) => { let r; for (let t = 0; t < 4; t++) { r = await _get1(p); if (r.status !== 0) return r; await sleep(300); } return r; };

// A persistent identified ws session (fresh token). IDENTIFY with no phone -> mint.
function session() {
  const token = randomUUID(); const msgs = [];
  const ws = new WebSocket(WSS, { rejectUnauthorized: false });
  const ready = new Promise((resolve) => {
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw.toString()); } catch { return; }
      if (m.type === 'welcome') { ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '' })); resolve(); return; }
      msgs.push(m);
    });
    ws.on('error', () => {});
  });
  return { token, msgs, ready, send: (o) => ws.send(JSON.stringify(o)), close: () => { try { ws.close(); } catch {} } };
}

// One-shot challenge probe: fresh token + key -> collect server messages.
function _probe1({ phone, email }, ms = 2800) {
  return new Promise((resolve) => {
    const token = randomUUID(); const msgs = [];
    const ws = new WebSocket(WSS, { rejectUnauthorized: false });
    let sent = false; const ident = () => { if (sent) return; sent = true; ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '', ...(phone ? { phone } : {}), ...(email ? { email } : {}) })); };
    ws.on('open', () => setTimeout(ident, 250));
    ws.on('message', (raw) => { let m; try { m = JSON.parse(raw.toString()); } catch { return; } if (m.type === 'welcome') return ident(); msgs.push(m); });
    ws.on('error', () => {});
    setTimeout(() => { try { ws.close(); } catch {} resolve({ token, msgs }); }, ms);
  });
}
// Retry if NO server messages arrived at all (SERVER_CONFIG/ROOM_LIST always come on a
// healthy connection) — empty = a connection/timing blip, not a real logic result.
async function probe(key, ms) { let r; for (let t = 0; t < 3; t++) { r = await _probe1(key, ms); if (r.msgs.length > 0) return r; await sleep(400); } return r; }

console.log(`=== R21.5+R21.6 email/phone-units gate @ ${WSS} (run ${RUN}) ===`);

// --- standalone A: phone regression (PO #1) ---
const phoneReg = await apiGet(`/api/phone/${encodeURIComponent(TRON_PHONE)}`);
const phoneRegOk = phoneReg.status === 200 && phoneReg.json?.profileUuid === TRON_UUID;
console.log(`A) phone regression ${TRON_PHONE} -> ${phoneReg.json?.profileUuid || phoneReg.status} => ${phoneRegOk ? 'GREEN' : 'RED'}`);

// --- standalone B: Tron seeded gmail -> KNOWN_KEY_CHALLENGE -> 3effa1fc (R21.5 PO #2) ---
const tg = await probe({ email: TRON_GMAIL });
const tgCh = tg.msgs.find(m => m.type === 'KNOWN_KEY_CHALLENGE');
const tgMint = tg.msgs.find(m => m.type === 'PROFILE');
const tronEmailOk = !!tgCh && tgCh.profileUuid === TRON_UUID && !tgMint;
console.log(`B) Tron gmail email-link -> challenge=${tgCh?.profileUuid || 'NONE'} masked=${tgCh?.maskedName ?? '-'} mint=${!!tgMint} => ${tronEmailOk ? 'GREEN' : 'RED'}`);

// --- bootstrap one committed test user ---
const u = session();
await u.ready;
u.send({ type: 'UPDATE_PROFILE', name: `r2156-gate-${RUN}`, secretCode: '1234' });
await sleep(1500);
console.log(`bootstrap test user token=${u.token}`);

// --- DET-3x: add a distinct phone+email each iter; verify unit + email device-link ---
const results = [];
for (let i = 1; i <= 3; i++) {
  const phone = `+49991${RUN.replace(/\D/g, '').padEnd(6, '0').slice(0, 6)}${i}`; // unique fake +49 number
  const email = `r2156.${RUN}.${i}@example.com`;

  const baseline = await apiGet(`/api/phone/${encodeURIComponent(phone)}`); // expect 404 pre-update
  u.send({ type: 'UPDATE_PROFILE', name: `r2156-gate-${RUN}`, phone, email });
  await sleep(1800); // async self-healing index writes

  const phoneHit = await apiGet(`/api/phone/${encodeURIComponent(phone)}`);
  const phoneOk = phoneHit.status === 200 && phoneHit.json?.profileUuid === u.token; // R21.6

  const ep = await probe({ email });                                  // R21.5 email device-link
  const epCh = ep.msgs.find(m => m.type === 'KNOWN_KEY_CHALLENGE');
  const epMint = ep.msgs.find(m => m.type === 'PROFILE');
  const emailOk = !!epCh && epCh.profileUuid === u.token && !epMint;

  const pass = baseline.status === 404 && phoneOk && emailOk;
  results.push({ i, pass });
  console.log(`iter ${i}: phone=${phone} base=${baseline.status} phone->${phoneHit.json?.profileUuid?.slice(0,8) || phoneHit.status}(R21.6 ${phoneOk?'OK':'X'}) | email=${email} challenge->${epCh?.profileUuid?.slice(0,8) || 'NONE'} mint=${!!epMint}(R21.5 ${emailOk?'OK':'X'}) => ${pass ? 'GREEN' : 'RED'}`);
}
u.close();

console.log('\n=== VERDICT R21.5 + R21.6 (DET-3x) ===');
console.log(`  A phone regression: ${phoneRegOk ? 'GREEN' : 'RED'}`);
console.log(`  B Tron gmail email-link: ${tronEmailOk ? 'GREEN' : 'RED'}`);
results.forEach(r => console.log(`  iter ${r.i} (phone-unit + email-link): ${r.pass ? 'GREEN' : 'RED'}`));
console.log(`  POLLUTION: 1 committed test user (${u.token}) + 3 phone units + 3 email units (tagged r2156-${RUN}) — flag for purge.`);
const green = phoneRegOk && tronEmailOk && results.length === 3 && results.every(r => r.pass);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
