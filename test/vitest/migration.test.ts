/**
 * S14 — Migration unit tests (T96/T97). All against a tmp DATA_DIR — never prod.
 * Proves: skip-already-per-user (never overwrite), orphan quarantine, token-dir copy +
 * owner-ref rewrite, remap table, idempotency, legacy left untouched.
 *
 * [test:uuid:14c3d4e5-f6a7-4b81-9c92-0d1e2f3a4b14] R14.1/R14.2
 * [verifies:uuid:91d85d5a-64d3-4520-a9fc-f2e24110b07b] R14.2 legacy migration
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { migrateLegacyRooms, migrateTokenDirs } from '../../src/ts/server/Migration.js';

let DATA: string;
beforeEach(() => {
  DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-mig-'));
});
afterEach(() => { try { fs.rmSync(DATA, { recursive: true, force: true }); } catch { /* ignore */ } });

function writeJson(p: string, o: unknown) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(o, null, 2)); }
function perUserRoom(token: string, id: string, o: unknown) { writeJson(path.join(DATA, 'users', token, 'rooms', id, 'room.json'), o); }
function legacyRoom(id: string, o: unknown) { writeJson(path.join(DATA, 'rooms', `${id}.json`), o); }

describe('T96 migrateLegacyRooms', () => {
  it('SKIPS a legacy room already present per-user — never overwrites the authoritative copy', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    perUserRoom('owner-uuid', id, { id, name: 'NEW schema', ownerToken: 'owner-uuid', sshKeysGenerated: true });
    legacyRoom(id, { id, name: 'OLD schema', creatorId: 'dormant' });
    const r = migrateLegacyRooms(DATA);
    expect(r.skipped).toBe(1);
    expect(r.quarantined).toBe(0);
    const perUser = JSON.parse(fs.readFileSync(path.join(DATA, 'users', 'owner-uuid', 'rooms', id, 'room.json'), 'utf-8'));
    expect(perUser.name).toBe('NEW schema'); // NOT overwritten by the old flat copy
  });

  it('quarantines a legacy-only orphan under _unowned and reports it', () => {
    const id = 'ffffffff-1111-4222-8333-444444444444';
    legacyRoom(id, { id, name: 'Orphan', creatorId: 'dormant', chatHistory: [] });
    const r = migrateLegacyRooms(DATA);
    expect(r.quarantined).toBe(1);
    expect(r.orphanIds).toEqual([id]);
    const q = JSON.parse(fs.readFileSync(path.join(DATA, 'users', '_unowned', 'rooms', id, 'room.json'), 'utf-8'));
    expect(q.ownerToken).toBe('_unowned');
    expect(q.sshKeysGenerated).toBe(false);
  });

  it('is idempotent and leaves legacy files UNTOUCHED', () => {
    const id = 'ffffffff-1111-4222-8333-444444444444';
    legacyRoom(id, { id, name: 'Orphan' });
    const before = fs.readFileSync(path.join(DATA, 'rooms', `${id}.json`), 'utf-8');
    migrateLegacyRooms(DATA);
    const r2 = migrateLegacyRooms(DATA); // re-run
    expect(r2.quarantined).toBe(0);      // nothing new
    expect(r2.skipped).toBe(1);          // already quarantined
    expect(fs.readFileSync(path.join(DATA, 'rooms', `${id}.json`), 'utf-8')).toBe(before); // legacy untouched
  });
});

describe('T97 migrateTokenDirs', () => {
  it('copies a token-<ts> dir to a UUID dir and rewrites owner refs in the copy', () => {
    const tok = 'token-1779716085746';
    const rid = 'room-uuid-1';
    perUserRoom(tok, rid, { id: rid, name: "Seed's Room", ownerToken: tok, creatorId: tok });
    const r = migrateTokenDirs(DATA);
    expect(r.migrated).toBe(1);
    expect(r.roomsRewritten).toBe(1);
    const newUuid = r.remap[tok];
    expect(newUuid).toMatch(/^[0-9a-f-]{36}$/);
    // copy has rewritten owner
    const copied = JSON.parse(fs.readFileSync(path.join(DATA, 'users', newUuid, 'rooms', rid, 'room.json'), 'utf-8'));
    expect(copied.ownerToken).toBe(newUuid);
    expect(copied.creatorId).toBe(newUuid);
    // original token dir left UNTOUCHED
    const orig = JSON.parse(fs.readFileSync(path.join(DATA, 'users', tok, 'rooms', rid, 'room.json'), 'utf-8'));
    expect(orig.ownerToken).toBe(tok);
    // remap table persisted
    expect(JSON.parse(fs.readFileSync(path.join(DATA, 'migration', 'token-remap.json'), 'utf-8'))[tok]).toBe(newUuid);
  });

  it('is idempotent — re-run migrates nothing new, already-UUID dirs untouched', () => {
    const tok = 'token-1779716085746';
    perUserRoom(tok, 'r1', { id: 'r1', ownerToken: tok });
    const r1 = migrateTokenDirs(DATA);
    const r2 = migrateTokenDirs(DATA);
    expect(r2.migrated).toBe(0);
    expect(r2.skipped).toBe(1);
    expect(Object.keys(r2.remap)).toHaveLength(1); // same single mapping
  });

  it('defensive profile rekey is a no-op when no token-* profile exists', () => {
    const tok = 'token-1779716085746';
    perUserRoom(tok, 'r1', { id: 'r1', ownerToken: tok });
    writeJson(path.join(DATA, 'profiles.json'), [{ token: 'real-uuid', name: 'Real User' }]);
    const r = migrateTokenDirs(DATA);
    expect(r.profilesRekeyed).toBe(0);
    const profiles = JSON.parse(fs.readFileSync(path.join(DATA, 'profiles.json'), 'utf-8'));
    expect(profiles).toHaveLength(1); // real profile untouched
    expect(profiles[0].token).toBe('real-uuid');
  });
});
