// S36 part-2 COUNTERPART-ENRICHMENT re-gate — reconcileCanonical merges a scenario Class with its ts-code counterpart
// into ONE canonical node: instanceOf = UNION [UmlClass, ts-class-code], members = merged, usedIn = None until placed.
// DET-3x, SERVED-verified (compute-on-read INV-T: 3 reads byte-identical, no write). Screenshots/results → DISK.
// Flagship Chain 0bbe576f (members 30) + 4 counterparts (ClassRegistry/AgentMessage/ScenarioIndex/TsToModel).
// The two M2 metaclasses of the UNION: UmlClass …0003, ts-class-code …0013.
// [test:uuid:fb5ae5eb-2736-4abc-b3c9-2473a186d3f1] S36 part-2 server.reconcileCanonical (Impl 37c08fd5) — counterpart-enrichment:
// each scenario Class with a ts-code counterpart merges into ONE canonical node (instanceOf = UNION [UmlClass, ts-class-code],
// members = merged, usedIn = None until placed); DET-3x served-verified, INV-T compute-on-read (3 reads byte-identical, no write).
// Chain 0bbe576f members=30 + 4 counterparts (ClassRegistry/AgentMessage/ScenarioIndex/TsToModel). renderFacet-paint + where-used
// bidi + Scenario/Edit stay GREEN in r36-canonical-webkit-gate.mjs (same served 0.8.58).
import fs from 'node:fs'; import path from 'node:path'; import https from 'node:https';
const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const TARGET = process.env.R36_TARGET || '0.8.58';
const OUT = path.join(ROOT, 'test-results/r36b-counterpart') + '/'; fs.mkdirSync(OUT, { recursive: true });
const UML_CLASS = '000000000003', TS_CLASS = '000000000013';   // UNION facets (instanceOf tails)
const UNITS = [
  { uuid: '0bbe576f-d527-42c7-bf80-a72c87f76767', name: 'Chain', members: 30 },
  { uuid: '40475f3e-6cef-476b-9749-777888cb169c', name: 'ClassRegistry', members: 4 },
  { uuid: '8758e33a-5ce2-4afc-8029-f1eaa01ae35b', name: 'AgentMessage', members: 6 },
  { uuid: 'c8bdae18-88e1-4829-813b-0e5ecc21c56c', name: 'ScenarioIndex', members: 18 },
  { uuid: 'fc2f97c9-a2e2-4599-9c9a-a9657d31b051', name: 'TsToModel', members: 5 },
];
const get = (p) => new Promise((res) => { const q = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, rejectUnauthorized: false }, (r) => { let b = ''; r.on('data', c => b += c); r.on('end', () => res(b)); }); q.on('error', () => res('')); q.end(); });
const model = (raw) => { try { const j = JSON.parse(raw); const u = j.unit || {}; return u.model || u; } catch { return {}; } };

const cfg = JSON.parse(await get('/api/config') || '{}');
console.log(cfg.version === TARGET ? `served==${TARGET} verified — SERVED verdict.` : `⚠ PHANTOM-GUARD: served=${cfg.version} != ${TARGET}`);

const results = [];
for (const u of UNITS) {
  // DET-3x + INV-T: read /api/ior THREE times, assert byte-identical (compute-on-read never writes) + the merged shape
  const reads = [await get('/api/ior/' + u.uuid), await get('/api/ior/' + u.uuid), await get('/api/ior/' + u.uuid)];
  const invT = reads[0] === reads[1] && reads[1] === reads[2] && reads[0].length > 0;
  const m = model(reads[0]);
  const io = (m.instanceOf || []).map(String);
  const unionUml = io.some(x => x.includes(UML_CLASS));
  const unionTs = io.some(x => x.includes(TS_CLASS));
  const isUnion = io.length === 2 && unionUml && unionTs;                 // instanceOf = UNION [UmlClass, ts-class-code]
  const membersOk = (m.members || []).length === u.members;              // merged member count
  const unplaced = m.usedIn == null || (Array.isArray(m.usedIn) && m.usedIn.length === 0); // usedIn = None (legit-unplaced)
  const nameOk = m.name === u.name;
  const pass = invT && isUnion && membersOk && unplaced && nameOk;
  results.push({ name: u.name, uuid: u.uuid.slice(0, 8), invT, isUnion, instanceOfLen: io.length, members: (m.members || []).length, wantMembers: u.members, unplaced, nameOk, pass });
  console.log(`${u.name.padEnd(14)} INV-T=${invT} UNION=${isUnion}(io=${io.length}) members=${(m.members || []).length}/${u.members} usedIn=None:${unplaced} => ${pass ? 'GREEN' : 'RED'}`);
}

const green = results.length === 5 && results.every(r => r.pass);
fs.writeFileSync(OUT + 'results.json', JSON.stringify({ target: TARGET, served: cfg.version, green, results }, null, 2));
console.log('\n===== S36 counterpart-enrichment (5 units, DET-3x served-verified) =====');
console.log('results → ' + OUT + 'results.json');
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
