// S37 folder-unit repair — ROOM case (architect 2026-09-05): a room folder appears in the items-tree only if it gets the
// SAME two things a room FILE gets — (1) a symlink in the room files dir (getRoomDir(creator)/files/<uuid>.scenario.json →
// the scenario/index canonical), (2) registration in room.model.files[] (addFileUnit). NOT the model-store symlink.
// Bounded to the actual nested room folders (roomcoll:<uuid>:files/<name>). dry-run default; --apply gated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { getRoomDir } from '../src/ts/server/RoomKeys.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SI = path.join(ROOT, 'scenario/index');
const APPLY = process.argv.includes('--apply');
const siPath = (uuid: string) => path.join(SI, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);

// find actual nested room folders among the repaired Folder units
const folderFiles = execSync(`grep -rl '"ior": "ior:class:Folder"' ${SI} 2>/dev/null || true`).toString().trim().split('\n').filter(Boolean);
const roomFolders: Array<{ uuid: string; roomId: string; name: string }> = [];
for (const f of folderFiles) {
  const m = JSON.parse(fs.readFileSync(f, 'utf8')).model;
  const mm = /^roomcoll:([^:]+):files\/(.+)$/.exec(String(m.location || ''));
  if (mm) roomFolders.push({ uuid: m.uuid, roomId: mm[1], name: mm[2] });
}
console.log(`=== ROOM-folder representation ${APPLY ? '(APPLY)' : '(DRY-RUN)'} — ${roomFolders.length} nested room folder(s) ===`);

for (const rf of roomFolders) {
  const roomUnitPath = siPath(rf.roomId);
  if (!fs.existsSync(roomUnitPath)) { console.log(`  ${rf.name} (${rf.uuid.slice(0, 8)}) — room unit ${rf.roomId.slice(0, 8)} NOT in scenario/index, SKIP`); continue; }
  const roomUnit = JSON.parse(fs.readFileSync(roomUnitPath, 'utf8'));
  const creator = String(roomUnit.model.ownerToken || String(roomUnit.ownerIor || '').replace('ior:instance:', ''));
  const roomDir = creator ? getRoomDir(creator, rf.roomId, { mint: false }) : null;
  const filesDir = roomDir ? path.join(roomDir, 'files') : '';
  const linkPath = filesDir ? path.join(filesDir, `${rf.uuid}.scenario.json`) : '';
  const iorRef = `ior:instance:${rf.uuid}`;
  const inFiles = Array.isArray(roomUnit.model.files) && roomUnit.model.files.includes(iorRef);
  const linkExists = !!linkPath && fs.existsSync(linkPath);
  console.log(`  ${rf.name} (${rf.uuid.slice(0, 8)}) room=${rf.roomId.slice(0, 8)} creator=${creator.slice(0, 8)}`);
  console.log(`    roomFilesDir=${filesDir || '(unresolved)'} · linkExists=${linkExists} · inFiles[]=${inFiles}`);
  if (!APPLY) continue;
  if (!filesDir) { console.log('    ✗ cannot resolve room files dir (no creator home) — SKIP'); continue; }
  // (1) symlink into the room files dir → the scenario/index canonical (relative)
  if (!linkExists) {
    fs.mkdirSync(filesDir, { recursive: true });
    const rel = path.relative(filesDir, siPath(rf.uuid));
    const tmp = linkPath + '.migrating';
    try { fs.lstatSync(tmp); fs.unlinkSync(tmp); } catch {}
    fs.symlinkSync(rel, tmp); fs.renameSync(tmp, linkPath);
    console.log(`    ✓ symlinked ${linkPath} → ${rel}`);
  }
  // (2) register in room.model.files[]
  if (!inFiles) {
    roomUnit.model.files = Array.isArray(roomUnit.model.files) ? roomUnit.model.files : [];
    roomUnit.model.files.push(iorRef);
    fs.writeFileSync(roomUnitPath, JSON.stringify(roomUnit, null, 2) + '\n');
    console.log(`    ✓ addFileUnit → room.model.files[] now ${roomUnit.model.files.length}`);
  }
}
if (!APPLY) console.log('\nDRY-RUN only. --apply to write the room symlink + files[] registration.');
