// [test:uuid:f494cdd4-ca11-4115-9981-108f7cf19d9a] R21.4 resolveOrEnroll — known-key -> KNOWN_KEY_CHALLENGE, no mint
// R21.4 gate — connecting with a phone/email ALREADY in the alt-UUID index does NOT
// mint a new user; the server challenges for the existing user's secret code instead.
// Impl 3b6dcc83c (v0.6.67). Server: IDENTIFY -> resolveKeyToProfile(phone,email) ->
// KNOWN_KEY_CHALLENGE before mint (server.ts:1845, break -> NO userProfiles.set).
//
// Faithful wss probe (the real client handshake): connect -> welcome -> IDENTIFY with
// a FRESH random playerToken + the known phone. The known-key path sends ONLY
// KNOWN_KEY_CHALLENGE and breaks; the mint path (unknown key) sends MSG.PROFILE
// (server.ts:1893). So:
//   - challenge present + PROFILE absent  => "challenged, not minted"  (GREEN)
//   - PROFILE present + challenge absent  => minted a new user
//
// Discriminator proof bundled: a NEGATIVE control (fresh token, NO phone) must take
// the mint path (PROFILE, no challenge) — proving the challenge is triggered by the
// KNOWN key, not always emitted.
//
// Pollution: the known-phone probe mints ZERO users (break before set). The single
// negative control mints ONE phantom uncommitted profile (random token) — flagged.

import WebSocket from 'ws';
import { randomUUID } from 'crypto';

const WSS = (process.env.GATE_BASE || 'wss://prod.wo-da.de:4444').replace(/^http/, 'ws');
const KNOWN_PHONE = '+4915253844085';
const TRON_UUID = '3effa1fc-a548-4619-a3ff-fb96382eca22';

// One IDENTIFY round-trip. Returns the collected server messages + the token used.
function probe({ phone, email }, ms = 3000) {
  return new Promise((resolve) => {
    const token = randomUUID();
    const msgs = [];
    const ws = new WebSocket(WSS, { rejectUnauthorized: false });
    let identified = false;
    const sendIdentify = () => {
      if (identified) return; identified = true;
      ws.send(JSON.stringify({ type: 'IDENTIFY', playerToken: token, deviceId: '', name: '', ...(phone ? { phone } : {}), ...(email ? { email } : {}) }));
    };
    ws.on('open', () => setTimeout(sendIdentify, 250)); // fallback if no welcome
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw.toString()); } catch { return; }
      if (m.type === 'welcome') { sendIdentify(); return; }
      msgs.push(m);
    });
    ws.on('error', () => {});
    setTimeout(() => { try { ws.close(); } catch {} resolve({ token, msgs }); }, ms);
  });
}

const results = [];
console.log(`=== R21.4 device-link known-key gate @ ${WSS} ===`);

// --- POSITIVE: known phone -> KNOWN_KEY_CHALLENGE(3effa1fc), no mint. DET-3x ---
for (let i = 1; i <= 3; i++) {
  const { token, msgs } = await probe({ phone: KNOWN_PHONE });
  const challenge = msgs.find(m => m.type === 'KNOWN_KEY_CHALLENGE');
  const minted = msgs.find(m => m.type === 'PROFILE');
  const types = msgs.map(m => m.type).join(',') || '(none)';
  const pass = !!challenge && challenge.profileUuid === TRON_UUID && !minted;
  results.push({ i, pass });
  console.log(`iter ${i}: token=${token.slice(0, 8)} challenge=${challenge ? challenge.profileUuid : 'NONE'} masked=${challenge?.maskedName ?? '-'} minted(PROFILE)=${!!minted} | msgs=[${types}] => ${pass ? 'GREEN' : 'RED'}`);
}

// --- NEGATIVE control (1x): no phone -> mint path (PROFILE), no challenge ---
const neg = await probe({});
const negChallenge = neg.msgs.find(m => m.type === 'KNOWN_KEY_CHALLENGE');
const negMint = neg.msgs.find(m => m.type === 'PROFILE');
const negOk = !negChallenge && !!negMint;
console.log(`negctl: no-phone token=${neg.token.slice(0, 8)} challenge=${!!negChallenge} minted(PROFILE)=${!!negMint} => ${negOk ? 'discriminates OK (unknown key mints, no challenge)' : 'WEAK (did not mint as expected)'}`);
console.log(`  NOTE: negative control minted 1 phantom uncommitted profile token=${neg.token} — flag for purge.`);

console.log('\n=== VERDICT R21.4 (DET-3x) ===');
results.forEach(r => console.log(`  iter ${r.i}: ${r.pass ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(r => r.pass) && negOk;
console.log('OVERALL:', green ? 'GREEN DET-3x (challenge-not-mint, discriminated)' : 'RED');
process.exit(green ? 0 : 1);
