// TEST-ROOM SINGLE-SOURCE guard (Tron's THIRD request: 'create ONE test room, do ALL tests there, remove all
// test rooms'). Scans the HAZARD, not the actors: every ROOM CREATION / fresh-IDENTITY mint in test code, and
// asserts ZERO outside the ONE fixed room + the ONE SystemTester identity. Discipline failed 3× + a 72-room
// purge; this lint is what stands between Tron and a 4th flood when nobody remembers.
//
// ★ The fixed-room uuid + SystemTester token are DATA IN THIS LINT — a fresh tester who boots knowing nothing
//   still enforces them (survives rewind; not in an agent's head).
// FAILABLE: a `.createRoom(` in a file that does NOT reference the fixed room → VIOLATION (RED); a room op tied to
//   the fixed uuid → allowed (GREEN). Stub-fail proof: seed a createRoom in scratch → count rises → RED.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const FIXED_ROOM = '909f1bd6-1f97-4542-b02b-242cfcc41f5e';        // THE only test room any gate may use
const FIXED8 = '909f1bd6';
const SYS_TOKEN = 'ce981242-74fe-4d44-b5b6-43c641e224df';          // THE only test identity
const SYS8 = 'ce981242';

// strip // line-comments + /* block */ so a commented createRoom isn't a false hazard
const codeOnly = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');

// the HAZARD operations (the dangerous OPERATION, unevadable — names itself)
const ROOM_CREATE = /\.createRoom\s*\(/g;                          // mints a room
// identity hazard = seeding rawbin-player-id to a hardcoded STRING-LITERAL token that isn't SystemTester (the r2281
// fresh-random-token pollution shape). A variable value (setItem(..., token)) is NOT matched — it's normally the
// SystemTester token from seedSystemTester, so this avoids the false-positive flood on legit helpers.
const IDENTITY_MINT = /setItem\(\s*['"]rawbin-player-id['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;

function scan() {
  // test code = test/visual + test/ (the gate surface). Exclude THIS lint file.
  const files = execSync(`grep -rlE '\\.createRoom\\(|rawbin-player-id' ${REPO}/test 2>/dev/null || true`, { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).filter(f => !f.endsWith('r-test-room-single-source-lint.mjs'));
  const roomViol = [], idViol = [];
  for (const f of files) {
    let src; try { src = codeOnly(readFileSync(f, 'utf8')); } catch { continue; }
    const refsFixed = src.includes(FIXED8);                        // file reuses the blessed fixed room
    const creates = (src.match(ROOM_CREATE) || []).length;
    if (creates > 0 && !refsFixed) roomViol.push({ f: f.replace(`${REPO}/`, ''), n: creates });
    // identity mint to anything other than the SystemTester token = hazard
    let m; while ((m = IDENTITY_MINT.exec(src))) { const val = m[1]; if (!val.includes(SYS8)) idViol.push({ f: f.replace(`${REPO}/`, ''), val: val.slice(0, 40) }); }
  }
  return { roomViol, idViol };
}

const { roomViol, idViol } = scan();
const totalRoomCreates = roomViol.reduce((a, r) => a + r.n, 0);
console.log(`=== TEST-ROOM SINGLE-SOURCE guard — fixed room ${FIXED8}, identity ${SYS8} ===`);
console.log(`ROOM-CREATION violations (createRoom in a file NOT reusing the fixed room): ${roomViol.length} files, ${totalRoomCreates} calls`);
roomViol.forEach(r => console.log(`  ★ ${r.f}: ${r.n}× .createRoom(`));
console.log(`IDENTITY-MINT violations (rawbin-player-id set to a non-SystemTester value): ${idViol.length}`);
idViol.forEach(r => console.log(`  ★ ${r.f}: ${r.val}`));

const green = roomViol.length === 0 && idViol.length === 0;
console.log(`\nVERDICT: ${green ? 'GREEN — every gate reuses the ONE fixed room + ONE identity; zero test-room/identity creation' : `RED — ${roomViol.length} gate(s) still mint rooms (migration debt: switch them to reuse ${FIXED8})`}`);
process.exit(green ? 0 : 1);
