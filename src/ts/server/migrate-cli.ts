/**
 * S14 migration CLI (COPY-only, idempotent, legacy untouched). Honors DATA_DIR (T100).
 *   tsx src/ts/server/migrate-cli.ts rooms     # T96
 *   tsx src/ts/server/migrate-cli.ts userdirs  # T97
 *   tsx src/ts/server/migrate-cli.ts all        # T96 + T97
 *
 * [impl:uuid:b571be43-05f8-4f59-bac9-0f2ac46b8b89]
 * [impl:uuid:bc75b1c1-707c-443a-a2f8-2d776e9062c6]
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateLegacyRooms, migrateTokenDirs } from './Migration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const mode = (process.argv[2] || 'all').toLowerCase();

console.log(`S14 migration (DATA_DIR=${DATA_DIR}) mode=${mode}`);

if (mode === 'rooms' || mode === 'all') {
  const r = migrateLegacyRooms(DATA_DIR);
  console.log(`T96 rooms: skipped(already-per-user)=${r.skipped} quarantined-orphans=${r.quarantined}`);
  if (r.orphanIds.length) console.log(`  orphan ids: ${r.orphanIds.join(', ')}`);
}
if (mode === 'userdirs' || mode === 'all') {
  const u = migrateTokenDirs(DATA_DIR);
  console.log(`T97 userdirs: migrated=${u.migrated} skipped=${u.skipped} roomsRewritten=${u.roomsRewritten} profilesRekeyed=${u.profilesRekeyed}`);
  console.log(`  remap table: ${u.remapPath} (${Object.keys(u.remap).length} entries)`);
}
console.log('Done — legacy data left UNTOUCHED (removal is T99, gated).');
