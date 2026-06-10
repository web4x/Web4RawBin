/**
 * T-room-symlink: one-shot backfill — convert existing room.json to canonical
 * scenario units + replace with symlinks.
 *
 * Usage:
 *   npx tsx scripts/backfill-room-symlinks.ts --report
 *   npx tsx scripts/backfill-room-symlinks.ts --apply
 *
 * [impl:uuid:7144f6ca-a1b2-4c3d-8e4f-5a6b7c8d9e0f] R19.22.A
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const USERS_DIR = path.join(DATA_DIR, 'users');
const SCENARIO_INDEX = path.join(__dirname, '../scenario/index');
const mode = process.argv[2] || '--report';

let converted = 0, skipped = 0, alreadyLinked = 0;

if (!fs.existsSync(USERS_DIR)) { console.log('No data/users/ dir'); process.exit(0); }

for (const userToken of fs.readdirSync(USERS_DIR)) {
  const roomsDir = path.join(USERS_DIR, userToken, 'rooms');
  if (!fs.existsSync(roomsDir)) continue;
  for (const roomId of fs.readdirSync(roomsDir)) {
    const roomJsonPath = path.join(roomsDir, roomId, 'room.json');
    if (!fs.existsSync(roomJsonPath)) continue;
    const stat = fs.lstatSync(roomJsonPath);
    if (stat.isSymbolicLink()) { alreadyLinked++; continue; }

    let data: any;
    try { data = JSON.parse(fs.readFileSync(roomJsonPath, 'utf-8')); } catch { skipped++; continue; }
    if (data.ior) { alreadyLinked++; continue; }

    const hex = roomId.replace(/-/g, '');
    if (hex.length < 5) { skipped++; continue; }
    const prefix = path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
    const canonDir = path.join(SCENARIO_INDEX, prefix);
    const canonPath = path.join(canonDir, `${roomId}.scenario.json`);
    const unit = { ior: 'ior:class:Room', model: { uuid: roomId, ...data, unitLinks: [`sprints.json/rooms/${userToken}/${roomId}.json`] }, ownerIor: `ior:instance:${userToken}` };

    if (mode === '--apply') {
      fs.mkdirSync(canonDir, { recursive: true });
      fs.writeFileSync(canonPath, JSON.stringify(unit, null, 2));
      fs.unlinkSync(roomJsonPath);
      const relTarget = path.relative(path.join(roomsDir, roomId), canonPath);
      fs.symlinkSync(relTarget, roomJsonPath);
    }
    console.log(`${mode === '--apply' ? 'CONVERTED' : 'WOULD CONVERT'}: ${userToken.slice(0, 8)}/${roomId.slice(0, 8)} → ${canonPath}`);
    converted++;
  }
}

console.log(`\n${converted} converted, ${alreadyLinked} already linked, ${skipped} skipped`);
if (mode !== '--apply') console.log('Dry run. Use --apply to convert.');
