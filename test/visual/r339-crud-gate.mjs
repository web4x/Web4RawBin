// R33.9 element CRUD (unit verbs) — server gate, DET-3x independent (served==HEAD==0.8.36; R33.9 shipped v0.8.35, unchanged).
// POST /api/model/element/{new,rename,delete} (server newElement 7ecb9a8d + rename/delete impls). Gates: (A) 400-VALIDATE
// reject-first (bad/empty body → 400, NO write); (B) create→rename→delete ROUND-TRIP (pollution-safe: nets to zero, robust
// finally-cleanup) proving delete≠R33.8 remove-view — element/delete removes the M1 UNIT (/api/ior stops resolving),
// whereas remove-view keeps it (INV-RM1). Store-only (prod scenario/index untouched). No browser — raw HTTPS on the live server.
import https from 'node:https';
// [test:uuid:380dcce5-dd78-4476-8738-b75db64fee97] R33.9 server.newElement (Impl 7ecb9a8d) — POST /api/model/element/new mints an M1 unit (200+uuid, /api/ior resolves); empty/blank name → 400. DET-3x, pollution-safe round-trip.
// [test:uuid:bf05f07a-8136-4131-a4cc-9886d155aa07] R33.9 server.renameElement (Impl 0dca728f) — POST /api/model/element/rename sets model.name (200, unit stays); missing uuid/name → 400. DET-3x.
// [test:uuid:be636b74-1a99-4b3c-9b6a-f03e81826940] R33.9 server.deleteElement (Impl 14b7004a, DESTRUCTIVE) — POST /api/model/element/delete removes the M1 UNIT (/api/ior stops resolving = delete≠R33.8 remove-view); missing uuid → 400. DET-3x, create→delete net-zero.
const HOST = 'prod.wo-da.de', PORT = 4444, TARGET = '0.8.36';
const req = (method, path, body) => new Promise((res) => {
  const data = body === undefined ? null : JSON.stringify(body);
  const q = https.request({ host: HOST, port: PORT, path, method, rejectUnauthorized: false, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => { let j = null; try { j = JSON.parse(b); } catch {} res({ code: r.statusCode, j }); }); });
  q.on('error', () => res({ code: 0, j: null })); if (data) q.write(data); q.end();
});
const iorExists = async (u) => { const r = await req('GET', `/api/ior/ior:instance:${u}`); return r.code === 200 && !!(r.j?.unit?.model); };

const served = (await req('GET', '/api/config')).j?.version;
if (served !== TARGET) { console.log(`⚠ PHANTOM-GUARD: served=${served} != ${TARGET} — ABORT.`); process.exit(1); }
console.log(`served==${TARGET} verified.`);

async function runOnce(i) {
  const R = {};
  // (A) 400-VALIDATE — reject-first, no write
  R.newEmpty = (await req('POST', '/api/model/element/new', {})).code === 400;
  R.newBlankName = (await req('POST', '/api/model/element/new', { name: '   ' })).code === 400;
  R.renameNoUuid = (await req('POST', '/api/model/element/rename', { name: 'x' })).code === 400;
  R.renameNoName = (await req('POST', '/api/model/element/rename', { elementUuid: 'nope' })).code === 400;
  R.deleteNoUuid = (await req('POST', '/api/model/element/delete', {})).code === 400;

  // (B) create → rename → delete ROUND-TRIP (pollution-safe, robust cleanup)
  let uuid = null;
  try {
    const name = `R339-crud-test-${i}-${Date.now()}`;
    const cr = await req('POST', '/api/model/element/new', { name });
    R.createCode = cr.code; uuid = cr.j?.uuid || null;
    R.created = cr.code === 200 && !!uuid && await iorExists(uuid);           // element unit now exists
    if (uuid) {
      const rn = await req('POST', '/api/model/element/rename', { elementUuid: uuid, name: name + '-renamed' });
      R.renamed = rn.code === 200 && await iorExists(uuid);                    // still exists, renamed
      const del = await req('POST', '/api/model/element/delete', { elementUuid: uuid });
      R.deleteCode = del.code;
      R.deletedUnitGone = del.code === 200 && !(await iorExists(uuid));        // ★ delete≠remove-view: the UNIT is GONE
      if (R.deletedUnitGone) uuid = null;                                       // cleaned up
    }
  } finally {
    if (uuid) { await req('POST', '/api/model/element/delete', { elementUuid: uuid }); } // safety cleanup — never leak a test unit
  }
  return R;
}

const runs = [];
for (let i = 1; i <= 3; i++) runs.push(await runOnce(i));

console.log('\n===== R33.9 element CRUD (server, DET-3x) =====');
runs.forEach((R, i) => console.log(`iter ${i + 1}: ${JSON.stringify(R)}`));
const g = k => runs.length === 3 && runs.every(R => R[k] === true);
const validate = ['newEmpty', 'newBlankName', 'renameNoUuid', 'renameNoName', 'deleteNoUuid'].every(g);
const roundtrip = g('created') && g('renamed') && g('deletedUnitGone');
const ownerGated = runs.every(R => R.createCode === 403 || R.createCode === 401);
const green = validate && roundtrip;
console.log(`\n(A) 400-VALIDATE reject-first: ${validate ? 'GREEN' : 'RED'}`);
console.log(`(B) create→rename→delete round-trip (delete≠remove-view, UNIT gone): ${roundtrip ? 'GREEN' : (ownerGated ? 'OWNER-GATED (createCode 401/403 → mock-owner/hold)' : 'RED')}`);
console.log('OVERALL R33.9-CRUD:', green ? 'GREEN DET-3x' : (validate && ownerGated ? 'VALIDATE-GREEN + round-trip owner-gated (flag)' : 'RED'));
process.exitCode = green ? 0 : 1;
