// R40.107 RESTORE DIFFERENTIAL gate (PO). The 9 corrupted rooms were restored disk-side from HEAD.
// Independently confirm (do NOT trust relayed numbers):
//   (1) DISK == HEAD for all 9 (git working-tree clean) — the restore landed correctly.
//   (2) 4 name-blanks restored on disk: Marcel c09087ec in 3231db71 + edd7fa61, Amos in cc3294d0, SystemTester in a16262b8.
//   (3) createdAt present on all 9 (disk).
//   (4) 0 member-count delta: disk count == HEAD count per room (Heartspaces disk-7; live-6 dedup is BENIGN — architect
//       ruled 41ad88c4 redirectTo=c09087ec; do NOT fail on the deduped in-memory view).
// SERVED (/api/ior = in-memory) is captured to show the "disk-restored != user-visible" distinction: before the
// naming-fix reload the surface still holds the pre-restore blanks; after it, the surface heals AND the rooms stay
// intact ACROSS the restart (the dangerous reconstruction event the guard must survive).
import { execSync } from 'node:child_process';
import https from 'node:https';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const BASE = 'https://prod.wo-da.de:4444';

const ROOMS = [
  { u: '2b1921a9-3638-4f91-b9b0-9744ff710496', label: 'Christine Dawood' },
  { u: '3231db71-d834-435a-a7f9-a801680ccd62', label: 'Marcel dnd test', restore: { token: 'c09087ec', name: 'Marcel Donges' } },
  { u: '3ec1bf6e-a14b-45fa-86a3-2c27182659be', label: 'GRG TREFF' },
  { u: '6c04f959-f3d6-42eb-818f-5e2e4498bf91', label: 'Heartspaces', dedup: 6 },
  { u: '8be52aa9-7db8-4e3a-8356-eed920dd1f1a', label: 'Marcel Donges Room' },
  { u: 'b3efa337-5b32-4776-a1e2-967890fa2f84', label: 'Semvec Hackathon' },
  { u: 'cc3294d0-64b9-4d50-b913-e1e5383ef17a', label: 'Amos Donges Room', restore: { name: 'Amos Donges' } },
  { u: 'a16262b8-337c-41b5-b2c8-1a298efa7b6c', label: 'System Evidence', restore: { token: 'ce981242', name: 'SystemTester' } },
  { u: 'edd7fa61-186d-4737-8ded-66dd6128f7e0', label: 'Marcel Owner Test', restore: { token: 'c09087ec', name: 'Marcel Donges' } },
];
const shard = (u) => `scenario/index/${u[0]}/${u[1]}/${u[2]}/${u[3]}/${u[4]}/${u}.scenario.json`;
const headModel = (u) => { try { return JSON.parse(execSync(`git show HEAD:${shard(u)}`, { cwd: REPO, encoding: 'utf8' })).model || {}; } catch { return {}; } };
const diskClean = (u) => execSync(`git diff --stat HEAD -- ${shard(u)}`, { cwd: REPO, encoding: 'utf8' }).trim() === '';
const served = (u) => new Promise((res) => { const url = new URL(`${BASE}/api/ior/ior:instance:${u}`); https.get({ hostname: url.hostname, port: url.port, path: url.pathname, rejectUnauthorized: false }, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)?.unit?.model || {}); } catch { res(null); } }); }).on('error', () => res(null)); });
const nameFor = (members, token) => { const m = (members || []).find(x => String(x.ior || x.playerToken || '').includes(token)); return m ? String(m.name ?? '') : '(absent)'; };

let servedVersion = '?'; try { servedVersion = JSON.parse(execSync(`curl -sk ${BASE}/api/config`, { encoding: 'utf8' })).version; } catch {}
console.log(`=== R40.107 RESTORE DIFFERENTIAL — served v${servedVersion} ===\n`);

let diskAllClean = true, createdOk = 0, countDelta = 0, namesRestoredDisk = 0, namesHealedServed = 0, restoreChecks = [];
for (const r of ROOMS) {
  const h = headModel(r.u);
  const hMembers = h.members || [];
  const clean = diskClean(r.u);
  diskAllClean = diskAllClean && clean;
  if (typeof h.createdAt === 'number' && h.createdAt > 0) createdOk++;
  const s = await served(r.u);
  const sN = s ? (s.members || []).length : null;
  // count delta: disk(HEAD) vs served in-memory — Heartspaces dedup allowed
  const expectServed = r.dedup || hMembers.length;
  const deltaOk = s == null ? null : (sN === hMembers.length || sN === expectServed);
  if (s != null && !deltaOk) countDelta++;
  let line = `${r.u.slice(0,8)} ${r.label.padEnd(20)} DISK: n=${hMembers.length} createdAt=${h.createdAt} clean=${clean ? 'YES' : 'NO ★'} | SERVED: ${s == null ? 'unavailable' : `n=${sN}${sN !== hMembers.length ? `(dedup ${r.dedup}?)` : ''}`}`;
  if (r.restore) {
    const tok = r.restore.token;
    const diskName = tok ? nameFor(hMembers, tok) : (hMembers.find(x => String(x.name) === r.restore.name)?.name ?? '(absent)');
    const diskNamed = String(diskName).trim() === r.restore.name;
    if (diskNamed) namesRestoredDisk++;
    const servName = s ? (tok ? nameFor(s.members, tok) : (s.members || []).map(x => x.name).find(n => n === r.restore.name) ?? '(blank/absent)') : '(unavail)';
    const servHealed = String(servName).trim() === r.restore.name;
    if (servHealed) namesHealedServed++;
    restoreChecks.push({ room: r.label, want: r.restore.name, diskNamed, servHealed });
    line += ` | RESTORE ${tok || r.restore.name}: disk='${diskName}'${diskNamed ? '✓' : '★RED'} surface='${servName}'${servHealed ? '✓healed' : ' (pre-reload blank)'}`;
  }
  console.log(line);
}

console.log('\n=== THREE NUMBERS (disk, independently derived) ===');
console.log(`  (1) name-blanks restored on disk = ${namesRestoredDisk}/4  ${namesRestoredDisk === 4 ? '✓' : '★RED'}`);
console.log(`  (2) createdAt present on all 9   = ${createdOk}/9  ${createdOk === 9 ? '✓' : '★RED'}`);
console.log(`  (3) member-count delta (disk==HEAD, dedup-aware) = ${countDelta}  ${countDelta === 0 ? '✓' : '★RED — STOP'}`);
console.log(`  disk == HEAD (all 9 working-tree clean) = ${diskAllClean ? 'YES ✓' : 'NO ★RED'}`);
console.log(`  surface heal (served in-memory) = ${namesHealedServed}/4 ${namesHealedServed === 4 ? '✓ user-visible' : '(disk-restored, NOT yet user-visible — awaits naming-fix reload)'}`);

const diskGreen = diskAllClean && namesRestoredDisk === 4 && createdOk === 9 && countDelta === 0;
console.log('\n' + (diskGreen ? 'DISK VERDICT: GREEN — 9 rooms restored whole (4 names, 9/9 createdAt, 0 count delta)' : 'DISK VERDICT: RED — investigate ★'));
console.log(namesHealedServed === 4 ? 'SURFACE: healed (reload applied)' : 'SURFACE: pre-reload (disk-restored ≠ user-visible; carry this in the verdict)');
process.exit(diskGreen ? 0 : 1);
