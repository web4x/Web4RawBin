// R21.6 E.164 normalization edge gate — locks the architect's PDCA gap fix (normalizePhone,
// PhoneIndex.ts). v0.6.72. Tests the EXACT cases the architect flagged.
//
// Zero-pollution: /api/phone/<raw> echoes `key: normalizePhone(raw)` in BOTH 200 and 404
// bodies (server.ts:1043/1045), so we assert normalizePhone's OUTPUT directly without
// creating any user. Canonical contract (PhoneIndex.normalizePhone):
//   '+' prefix      -> '+' + digits           (passthrough)
//   '00' intl prefix-> strip 00 -> '+' + rest  (normalize)
//   bare national   -> ''  (REJECT — no resolvable country code; "no bare 0152...")
//
// PO cases:
//   (1) '015253844085'   bare national  -> key === ''           (rejected) + 404
//   (2) '00491525384085' intl 00 prefix -> key === '+491525384085' (normalized 00->+)
//   (3) '+4915253844085' already E.164   -> key === '+4915253844085' + 200 -> Tron 3effa1fc
// Plus canonicalization-equivalence on Tron's REAL number: the 00-form and the +-form
// must produce the SAME key AND resolve to the SAME profile.

import https from 'https';
const HOST = 'prod.wo-da.de', PORT = 4444;
const TRON_UUID = '3effa1fc-a548-4619-a3ff-fb96382eca22';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const _get1 = (p) => new Promise((res) => {
  const req = https.get({ host: HOST, port: PORT, path: p, rejectUnauthorized: false, timeout: 8000 }, (r) => {
    let d = ''; r.on('data', (c) => d += c); r.on('end', () => { let j = null; try { j = JSON.parse(d); } catch {} res({ status: r.statusCode, json: j, body: d }); });
  });
  req.on('error', () => res({ status: 0, json: null })); req.on('timeout', () => { req.destroy(); res({ status: 0, json: null }); });
});
const apiGet = async (p) => { let r; for (let t = 0; t < 4; t++) { r = await _get1(p); if (r.status !== 0) return r; await sleep(300); } return r; };
const phone = (raw) => apiGet('/api/phone/' + encodeURIComponent(raw));

// One full deterministic pass of all cases. Returns {pass, lines}.
async function pass() {
  const lines = [];
  // (1) bare national -> rejected (key '', 404)
  const c1 = await phone('015253844085');
  const c1ok = c1.status === 404 && c1.json && c1.json.key === '';
  lines.push(`  (1) '015253844085' bare national -> status=${c1.status} key=${JSON.stringify(c1.json?.key)} => ${c1ok ? 'GREEN (rejected)' : 'RED'}`);

  // (2) 00 intl prefix -> normalized '+491525384085'
  const c2 = await phone('00491525384085');
  const c2ok = c2.json && c2.json.key === '+491525384085';
  lines.push(`  (2) '00491525384085' 00-intl -> key=${JSON.stringify(c2.json?.key)} (expect '+491525384085') => ${c2ok ? 'GREEN (normalized)' : 'RED'}`);

  // (3) already E.164 -> passthrough + resolves to Tron
  const c3 = await phone('+4915253844085');
  const c3ok = c3.status === 200 && c3.json?.key === '+4915253844085' && c3.json?.profileUuid === TRON_UUID;
  lines.push(`  (3) '+4915253844085' E.164 -> status=${c3.status} key=${JSON.stringify(c3.json?.key)} uuid=${c3.json?.profileUuid?.slice(0, 8)} => ${c3ok ? 'GREEN (passthrough+resolves)' : 'RED'}`);

  // (canon) Tron's number as 00-form and +-form -> same key AND same profile
  const t00 = await phone('004915253844085');
  const tplus = await phone('+4915253844085');
  const canonOk = t00.json?.key === '+4915253844085' && tplus.json?.key === '+4915253844085'
    && t00.json?.profileUuid === TRON_UUID && tplus.json?.profileUuid === TRON_UUID;
  lines.push(`  (canon) 004915253844085 & +4915253844085 -> keys ${JSON.stringify(t00.json?.key)}/${JSON.stringify(tplus.json?.key)} uuids ${t00.json?.profileUuid?.slice(0, 8)}/${tplus.json?.profileUuid?.slice(0, 8)} => ${canonOk ? 'GREEN (canonical-equivalent)' : 'RED'}`);

  return { pass: c1ok && c2ok && c3ok && canonOk, lines };
}

console.log(`=== R21.6 E.164 normalization edge gate @ https://${HOST}:${PORT} (v0.6.72) ===`);
const verdicts = [];
for (let i = 1; i <= 3; i++) {
  const r = await pass();
  console.log(`--- DET pass ${i} ---`); r.lines.forEach(l => console.log(l));
  verdicts.push(r.pass);
}
console.log('\n=== VERDICT R21.6 E.164 (DET-3x) ===');
verdicts.forEach((v, i) => console.log(`  pass ${i + 1}: ${v ? 'GREEN' : 'RED'}`));
const green = verdicts.length === 3 && verdicts.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
