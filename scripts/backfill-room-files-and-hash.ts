/**
 * One-time backfill: (1) room.json files[] from on-disk file symlinks,
 * (2) contentHash (SHA-256) into FileUnit scenarios, (3) clean stale unitLinks.
 *
 * Usage:
 *   npx tsx scripts/backfill-room-files-and-hash.ts --report
 *   npx tsx scripts/backfill-room-files-and-hash.ts --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const SCENARIO_INDEX = path.join(__dirname, '../scenario/index');
const mode = process.argv[2] || '--report';

let filesBackfilled = 0, hashesAdded = 0, staleLinksRemoved = 0, filesScanned = 0;

function prefixPath(uuid: string): string {
  const hex = uuid.replace(/-/g, '');
  return path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
}

function getScenario(uuid: string): any {
  const fp = path.join(SCENARIO_INDEX, prefixPath(uuid), `${uuid}.scenario.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

function putScenario(uuid: string, data: any): void {
  const fp = path.join(SCENARIO_INDEX, prefixPath(uuid), `${uuid}.scenario.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

// --- Pass 1: Backfill room.json files[] from on-disk file symlinks ---
const usersDir = path.join(DATA_DIR, 'users');
if (fs.existsSync(usersDir)) {
  for (const userToken of fs.readdirSync(usersDir)) {
    const roomsDir = path.join(usersDir, userToken, 'rooms');
    if (!fs.existsSync(roomsDir) || !fs.statSync(roomsDir).isDirectory()) continue;
    for (const roomId of fs.readdirSync(roomsDir)) {
      const filesDir = path.join(roomsDir, roomId, 'files');
      if (!fs.existsSync(filesDir) || !fs.statSync(filesDir).isDirectory()) continue;
      const fileUuids = fs.readdirSync(filesDir)
        .filter(f => f.endsWith('.scenario.json'))
        .map(f => f.replace('.scenario.json', ''));
      if (fileUuids.length === 0) continue;

      const roomJsonPath = path.join(roomsDir, roomId, 'room.json');
      if (!fs.existsSync(roomJsonPath)) continue;
      let roomData = JSON.parse(fs.readFileSync(roomJsonPath, 'utf-8'));
      const isWrapped = !!roomData.ior;
      const model = isWrapped ? roomData.model : roomData;

      const existingFiles: string[] = model.files || [];
      const existingUuids = new Set(existingFiles.map((f: string) => f.replace('ior:instance:', '')));
      let added = 0;
      for (const fuuid of fileUuids) {
        if (!existingUuids.has(fuuid)) {
          existingFiles.push(`ior:instance:${fuuid}`);
          added++;
        }
      }
      if (added > 0) {
        model.files = existingFiles;
        if (mode === '--apply') {
          if (isWrapped) { roomData.model = model; }
          fs.writeFileSync(roomJsonPath, JSON.stringify(roomData, null, 2));
        }
        console.log(`${mode === '--apply' ? 'BACKFILLED' : 'WOULD BACKFILL'}: ${userToken.slice(0, 8)}/${roomId.slice(0, 8)} +${added} files (total ${existingFiles.length})`);
        filesBackfilled += added;
      }
    }
  }
}

// --- Pass 2: contentHash backfill on FileUnit scenarios ---
function walkIndex(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...walkIndex(path.join(dir, entry.name)));
    else if (entry.name.endsWith('.scenario.json')) files.push(path.join(dir, entry.name));
  }
  return files;
}

for (const fp of walkIndex(SCENARIO_INDEX)) {
  try {
    const d = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    if (d.ior !== 'ior:class:File') continue;
    filesScanned++;
    const m = d.model;

    // contentHash
    if (!m.contentHash && m.contentPath) {
      const contentFile = path.join(__dirname, '../scenario', m.contentPath);
      if (fs.existsSync(contentFile)) {
        const hash = crypto.createHash('sha256').update(fs.readFileSync(contentFile)).digest('hex');
        if (mode === '--apply') {
          m.contentHash = hash;
          fs.writeFileSync(fp, JSON.stringify(d, null, 2));
        }
        console.log(`${mode === '--apply' ? 'HASHED' : 'WOULD HASH'}: ${m.uuid?.slice(0, 8)} → ${hash.slice(0, 12)}...`);
        hashesAdded++;
      }
    }

    // Clean stale unitLinks
    if (Array.isArray(m.unitLinks)) {
      const cleaned = m.unitLinks.filter((l: string) => !l.includes('sprints.json/rooms/') && !l.includes('rooms/'));
      if (cleaned.length < m.unitLinks.length) {
        const removed = m.unitLinks.length - cleaned.length;
        if (mode === '--apply') {
          m.unitLinks = cleaned;
          fs.writeFileSync(fp, JSON.stringify(d, null, 2));
        }
        console.log(`${mode === '--apply' ? 'CLEANED' : 'WOULD CLEAN'}: ${m.uuid?.slice(0, 8)} −${removed} stale unitLinks`);
        staleLinksRemoved += removed;
      }
    }
  } catch {}
}

console.log(`\n=== Summary ===`);
console.log(`Files backfilled into room.json: ${filesBackfilled}`);
console.log(`FileUnits scanned: ${filesScanned}`);
console.log(`contentHash added: ${hashesAdded}`);
console.log(`Stale unitLinks removed: ${staleLinksRemoved}`);
if (mode !== '--apply') console.log('Dry run. Use --apply to write.');
