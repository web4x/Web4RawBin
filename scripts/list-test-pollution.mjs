#!/usr/bin/env node
// Consolidation phase 1 — READ-ONLY inventory of test pollution in a RawBin data dir (default ./data).
// Lists rooms and users that tests created, so the owner can review them BEFORE anything is deleted.
// It never deletes or writes. Usage: node scripts/list-test-pollution.mjs [DATA_DIR] [--json]
import fs from 'node:fs';
import path from 'node:path';

const DATA = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || process.env.DATA_DIR || 'data');
const asJson = process.argv.includes('--json');
const SYSTEM_TESTER = 'ce981242-74fe-4d44-b5b6-43c641e224df';
// Names the test suites use (test/e2e ensureLobby names, test/visual createRoom names, gate-created users).
const TEST_NAME = /(\(temp\)|^E2E|E2E$|^SysTester|SystemTester|^T\d{2,}[ .]|^R\d{2,}|^LinkTarget-|^Repro |^canary-|^brace-bite|^ac1-private|^tw-room|^Contact-|^Owner[A-Z]$|^E2E-|^D[A-Za-z]*E2E|Owner(Delete|Multi|Reconnect)|^(BadgeOwner|DeleteE2E|EditAvatarUser|EditSelf|NameE2E|OrderUser|RegUser|RoomE2E|SelfUser|SshE2E|VcardSelf|VisibleE2E)$)/;

const readJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const profiles = readJson(path.join(DATA, 'profiles.json'));
const list = Array.isArray(profiles) ? profiles : Object.values(profiles || {});
const byToken = new Map(list.map(p => [p.token, p]));

const users = list.filter(p => p && !p.redirectTo && (p.token === SYSTEM_TESTER || TEST_NAME.test(p.name || '') || (!p.profileCommitted && !p.name)))
  .map(p => ({ token: p.token, name: p.name || '(no name)', committed: !!p.profileCommitted }));

const testUserTokens = new Set(users.map(u => u.token));
const rooms = [];
const usersDir = path.join(DATA, 'users');
for (const owner of fs.existsSync(usersDir) ? fs.readdirSync(usersDir) : []) {
  const roomsDir = path.join(usersDir, owner, 'rooms');
  if (!fs.existsSync(roomsDir)) continue;
  for (const id of fs.readdirSync(roomsDir)) {
    const raw = readJson(path.join(roomsDir, id, 'room.json'));
    if (!raw) continue;
    const r = raw.model || raw; // room.json is a scenario unit ({ ior, model }) on current servers
    const ownerName = byToken.get(owner)?.name || '';
    const testOwned = owner === SYSTEM_TESTER || testUserTokens.has(owner);
    if (testOwned || TEST_NAME.test(r.name || '')) rooms.push({ id, name: r.name, owner, ownerName, state: r.state, createdAt: (r.createdAt || raw.createdAt) ? new Date(r.createdAt || raw.createdAt).toISOString().slice(0, 10) : '' });
  }
}

if (asJson) { console.log(JSON.stringify({ dataDir: DATA, users, rooms }, null, 2)); process.exit(0); }
console.log(`Test pollution in ${DATA} (read-only, nothing deleted)\n`);
console.log(`Rooms (${rooms.length}):`);
for (const r of rooms.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) console.log(`  ${r.createdAt}  ${r.id.slice(0, 8)}  ${r.state || ''}  "${r.name}"  owner ${r.ownerName || r.owner.slice(0, 8)}`);
console.log(`\nUsers (${users.length}):`);
for (const u of users) console.log(`  ${u.token.slice(0, 8)}  ${u.committed ? 'committed  ' : 'uncommitted'}  "${u.name}"`);
