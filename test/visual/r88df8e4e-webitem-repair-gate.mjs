// BUG 88df8e4e — WebItem repair in room 3231db71 (live 0.8.211, read-only). The 4 restored units must be
// present+resolving with the right class-names; the real human name preserved; the junk unit gone. DET-3x.
//   files[]=33 · adf1a8c0+dc48165b='Youtube Watch' · cf45d317='Email message' · 96f54cc2 NAME PRESERVED
//   (real email-subject, NOT auto-renamed to a class name) · junk 3f80f8c8 GONE (unit null, 0 files[] refs).
// RED if any of the 4 missing/unresolved, junk present or resolvable, 96f54cc2 renamed to a class name, or files!=33.
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444';
const ROOM = '3231db71-d834-435a-a7f9-a801680ccd62';
const get = (u) => new Promise((r) => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, (s) => { let d = ''; s.on('data', c => d += c); s.on('end', () => { try { r(JSON.parse(d)); } catch { r(null); } }); }).on('error', () => r(null)); });
const CLASS_NAMES = ['Youtube Watch', 'Email message']; // auto-derived class names — 96f54cc2 must NOT be one of these

async function run() {
  const room = await get(ROOM);
  const files = (room?.unit?.model?.files || []).map(String);
  const inFiles = (p) => files.some(f => f.includes(p));
  const fullRef = (p) => (files.find(f => f.includes(p)) || '').replace('ior:instance:', ''); // full uuid from files[]
  const nameOf = async (p) => { const full = fullRef(p); if (!full) return { resolves: false, name: undefined }; const j = await get(full); return { resolves: !!(j && j.unit), name: j?.unit?.model?.name }; };

  const a = await nameOf('adf1a8c0'); const d = await nameOf('dc48165b'); const c = await nameOf('cf45d317');
  const p = await nameOf('96f54cc2'); const junk = await get('3f80f8c8-0000-0000-0000-000000000000');

  const checks = {
    filesCount33: files.length === 33,
    adf1a8c0: inFiles('adf1a8c0') && a.resolves && a.name === 'Youtube Watch',
    dc48165b: inFiles('dc48165b') && d.resolves && d.name === 'Youtube Watch',
    cf45d317: inFiles('cf45d317') && c.resolves && c.name === 'Email message',
    p96f54c2_present: inFiles('96f54cc2') && p.resolves,
    p96f54c2_name_preserved: !!p.name && !CLASS_NAMES.includes(String(p.name)) && String(p.name).includes('@'), // a real email-subject name, not auto-renamed
    junk_gone: !inFiles('3f80f8c8') && !(junk && junk.unit),
  };
  return { files: files.length, names: { adf1a8c0: a.name, dc48165b: d.name, cf45d317: c.name, p96f54cc2: p.name }, checks, pass: Object.values(checks).every(Boolean) };
}

let allGreen = true;
for (let i = 1; i <= 3; i++) {
  const r = await run();
  const fails = Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k);
  allGreen = allGreen && r.pass;
  console.log(`run ${i}: files=${r.files} 96f54cc2='${r.names.p96f54cc2}' => ${r.pass ? 'GREEN' : 'RED [' + fails.join(',') + ']'}`);
}
console.log('\n=== BUG 88df8e4e WebItem repair (3231db71, DET-3x) ===');
console.log(allGreen ? 'GREEN — 4 units present+correctly-named, real name preserved, junk gone, files=33' : 'RED');
process.exit(allGreen ? 0 : 1);
