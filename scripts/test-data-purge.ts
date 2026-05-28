/**
 * T118 — One-shot backfill purge of E2E orphan users.
 *
 * Usage:
 *   npx tsx scripts/test-data-purge.ts --report   # dry-run: list matches + preserved
 *   npx tsx scripts/test-data-purge.ts --apply    # delete matched dirs
 *
 * Safety: Token-based + name-based NEGATIVE-MATCH guard preserves real owner accounts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_USERS = path.join(__dirname, '../data/users');

const REAL_OWNER_TOKENS = new Set([
  '3dca7f5e-6fca-43ba-b8e0-cde6415b2498',
  'f4798dae-cfab-4a43-b8db-c548e893a120',
]);

const REAL_OWNER_NAMES = [
  'Marcel Donges',
  'Admins',
  'Marcel Donges Surfac',
  'Marcel Donges Surface Mini',
  'Krista',
  'Vladislav Tsyao',
  'Tanya Kelen',
  'James Woodward-Caradonna',
  'OrderDbg',
];

const TEST_PATTERN = /^(SelfUser|EditSelf|VcardSelf|OwnerA|GuestB|RegUser|EditAvatarUser|BadgeOwner|E2E-.+|OwnerMulti|OwnerReconnect|OwnerDelete|OwnerVisible|OtherViewer|RoomE2E|SshE2E|NameE2E|DeleteE2E|VisibleE2E|SyncOwner|SyncViewer|OrderUser|.+E2E.*)$/;

const mode = process.argv[2] || '--report';

if (!fs.existsSync(DATA_USERS)) {
  console.log('data/users/ not found');
  process.exit(1);
}

const dirs = fs.readdirSync(DATA_USERS);
const matched: { dir: string; name: string }[] = [];
const preserved: { dir: string; name: string }[] = [];
const unknown: { dir: string; name: string }[] = [];

for (const dir of dirs) {
  if (REAL_OWNER_TOKENS.has(dir)) {
    preserved.push({ dir, name: '(token-preserved)' });
    continue;
  }
  const profilePath = path.join(DATA_USERS, dir, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    const hasRooms = fs.existsSync(path.join(DATA_USERS, dir, 'rooms'));
    const hasFiles = fs.existsSync(path.join(DATA_USERS, dir, 'files'));
    if (hasRooms || hasFiles) {
      unknown.push({ dir, name: '(no profile, has data)' });
    } else {
      matched.push({ dir, name: '(empty — no profile)' });
    }
    continue;
  }
  try {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
    const name: string = profile.name || '(unnamed)';
    if (REAL_OWNER_NAMES.includes(name)) {
      preserved.push({ dir, name });
    } else if (TEST_PATTERN.test(name)) {
      matched.push({ dir, name });
    } else {
      unknown.push({ dir, name });
    }
  } catch {
    matched.push({ dir, name: '(corrupt profile)' });
  }
}

console.log(`\n=== E2E Test Data Purge ===`);
console.log(`Total user dirs: ${dirs.length}`);
console.log(`\nPRESERVED (real owners): ${preserved.length}`);
for (const p of preserved) console.log(`  [KEEP] ${p.dir} — ${p.name}`);
console.log(`\nMATCHED (test users): ${matched.length}`);
for (const m of matched) console.log(`  [${mode === '--apply' ? 'DELETE' : 'WOULD DELETE'}] ${m.dir} — ${m.name}`);
if (unknown.length > 0) {
  console.log(`\nUNKNOWN (not matched, not real owner): ${unknown.length}`);
  for (const u of unknown) console.log(`  [SKIP] ${u.dir} — ${u.name}`);
}
console.log(`\nSummary: ${matched.length} to remove, ${preserved.length} preserved, ${unknown.length} unknown`);

if (mode === '--apply') {
  let removed = 0;
  for (const m of matched) {
    fs.rmSync(path.join(DATA_USERS, m.dir), { recursive: true, force: true });
    removed++;
  }
  const remaining = fs.readdirSync(DATA_USERS).length;
  console.log(`\nPurged ${removed} dirs. Remaining: ${remaining}`);
} else {
  console.log(`\nDry run complete. Use --apply to delete.`);
}
