// R40.106 INC-7 (MOVE+DELETE) RED→GREEN differential — the SAME INSTRUMENT, run RED now @v0.8.222 (before INC-7),
// re-run GREEN after. INC-7's whole claim is it fixes things ACTUALLY BROKEN; a delete gate green all along proves nothing.
// PO/expert baselines (MEASURE, do not inherit; membership-filter everything — never flag a live member):
//   (1) DANGLING = a room files[] ref whose unit does NOT resolve (/api/ior null) — the T34.3 remove-index-not-links class.
//   (2) ORPHANS  = a location-bearing unit whose room (roomcoll:<id>) no longer resolves (parentFolder→deleted room debris).
//   (3) deleteRoom NO-OP + (4) T34.3 half-false — recorded (see commit msg; deleteRoom no-op proven 09-07, canonical unit survives).
// RED today: dangling>0, orphans>0. GREEN after INC-7: dangling=0 (real), orphans cleared, AND nothing that is a LIVE member deleted.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = 'https://prod.wo-da.de:4444', REPO = '/var/dev/Workspaces/web4x/Web4RawBin', FIXED = '909f1bd6';
const bare = (r) => String(r || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
const g = (u) => new Promise(r => { https.get(`${BASE}/api/ior/ior:instance:${u}`, { rejectUnauthorized: false }, s => { let b = ''; s.on('data', c => b += c); s.on('end', () => { try { r(JSON.parse(b)); } catch { r(null); } }); }).on('error', () => r(null)); });
let served = '?'; try { served = JSON.parse(execSync(`curl -sk ${BASE}/api/config`, { encoding: 'utf8' })).version; } catch {}

// (1) DANGLING — from every Room unit's files[], a ref whose unit doesn't resolve. Split real-room vs fixed-test-room.
const roomUnitFiles = execSync(`grep -ral '"ior": "ior:class:Room"' ${REPO}/scenario/index 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const refToRooms = new Map(); const roomResolvesCache = new Map();
for (const f of roomUnitFiles) { let u; try { u = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; } const rid = String(u.model?.uuid || ''); (u.model?.files || []).forEach(fr => { const b = bare(fr); if (!refToRooms.has(b)) refToRooms.set(b, []); refToRooms.get(b).push(rid.slice(0, 8)); }); }
const dangling = [];
for (const [ref, rooms] of refToRooms) { const j = await g(ref); if (!(j && j.unit)) dangling.push({ ref: ref.slice(0, 8), rooms, real: rooms.some(r => !r.startsWith(FIXED)) }); }
const danglingReal = dangling.filter(d => d.real);
const danglingTest = dangling.filter(d => !d.real);

// (2) ORPHANS — a location-bearing unit whose room (roomcoll:<id>) no longer resolves (parentFolder→deleted-room debris).
const locFiles = execSync(`grep -ral '"location": "roomcoll:' ${REPO}/scenario/index 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const orphans = [];
for (const f of locFiles) { let u; try { u = JSON.parse(readFileSync(f, 'utf8')); } catch { continue; } const m = u.model || {}; const roomId = (String(m.location || '').match(/roomcoll:([^:]+):/) || [])[1]; if (!roomId) continue; if (!roomResolvesCache.has(roomId)) roomResolvesCache.set(roomId, !!(await g(roomId))?.unit); if (!roomResolvesCache.get(roomId)) orphans.push({ uuid: String(m.uuid || '').slice(0, 8), ior: String(u.ior).split(':')[2], roomId: roomId.slice(0, 8) }); }

console.log(`=== R40.106 INC-7 DELETE RED-BASELINE — SERVED v${served} (READ-ONLY; membership/room-filtered) ===`);
console.log(`  (1) DANGLING files[] refs (unit /api/ior null) = ${dangling.length}: LIVE-REAL-room=${danglingReal.length}, fixed-test-room(${FIXED})=${danglingTest.length}`);
for (const d of dangling) console.log(`      ${d.ref} ref-by=[${d.rooms.join(',')}] ${d.real ? '★LIVE-REAL' : 'test-debris'}`);
console.log(`  (2) ORPHANS (location→deleted room) = ${orphans.length}:`);
for (const o of orphans) console.log(`      ${o.ior} ${o.uuid} → room ${o.roomId} (gone)`);
console.log(`  (3) deleteRoom NO-OP: proven 09-07 (removeRoom returns false for unloaded rooms + canonical unit survives) — the ${dangling.length} dangling refs + orphans ARE the persistent evidence delete doesn't fully remove. No fresh destructive call (0 expendable rooms; will NOT risk the fixed room).`);
console.log(`  (4) T34.3 accepted-Done-but-HALF-FALSE: /api/model/element/delete removes the index unit but LEAVES the room files[] link (dangling) — the LIVE-REAL dangling (${danglingReal.map(d=>d.ref).join(',')||'none'}) is exactly this class.`);
// RED baseline = there IS something broken to fix (else INC-7's green proves nothing)
const redBaseline = dangling.length > 0 || orphans.length > 0;
console.log(`\n★ RED BASELINE @v${served}: dangling=${dangling.length} (real=${danglingReal.length}) orphans=${orphans.length} → ${redBaseline ? 'RED CAPTURED (there is real breakage for INC-7 to fix — differential is measurable)' : 'nothing broken (differential would be hollow)'}`);
console.log(`  POST-INC-7 GREEN ACCEPTANCE (re-run this same gate): dangling-real=0, orphans=0, + deleteRoom VERIFIED GONE + NO live member deleted.`);
process.exit(0); // RED-baseline capture always exits 0 (it RECORDS the number; the number is the artifact, not pass/fail)
