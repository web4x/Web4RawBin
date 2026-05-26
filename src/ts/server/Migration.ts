/**
 * S14 — Legacy data migration (COPY-then-verify, idempotent, never-overwrite, legacy UNTOUCHED).
 *
 * T96 migrateLegacyRooms: reconcile flat data/rooms/<id>.json into the per-user model. Every id
 *   already present per-user is SKIPPED (per-user is authoritative — never overwritten). A genuine
 *   legacy-only orphan (no resolvable owner) is quarantined under data/users/_unowned/ and reported.
 * T97 migrateTokenDirs: copy each data/users/token-<ts>/ → a fresh UUIDv4 dir, rewrite ownerToken/
 *   creatorId/creatorToken in the COPY's rooms, persist an old→new remap for T98. Originals untouched.
 *
 * Nothing is moved or deleted here — removal is T99 (Tron-gated). All writes are atomic (temp+rename).
 *
 * [impl:uuid:96a1c3e5-2b7d-4f10-9a46-1c3e5f7a9b96] R14.1 migrate legacy rooms
 * [impl:uuid:97b2d4f6-3c8e-4a11-8b57-2d4f6a8b9c97] R14.2 migrate user dirs to UUIDv4
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function atomicWriteJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

function copyDirRecursive(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function perUserRoomIds(usersDir: string): Set<string> {
  const ids = new Set<string>();
  if (!fs.existsSync(usersDir)) return ids;
  for (const u of fs.readdirSync(usersDir)) {
    const rooms = path.join(usersDir, u, 'rooms');
    if (!fs.existsSync(rooms)) continue;
    for (const rid of fs.readdirSync(rooms)) {
      if (fs.existsSync(path.join(rooms, rid, 'room.json'))) ids.add(rid);
    }
  }
  return ids;
}

export interface RoomReport {
  skipped: number;            // already per-user (authoritative) — left untouched
  quarantined: number;        // legacy-only orphans copied to _unowned
  orphanIds: string[];
  log: string[];
}

// [impl:uuid:96a1c3e5-2b7d-4f10-9a46-1c3e5f7a9b96]
export function migrateLegacyRooms(dataDir: string): RoomReport {
  const roomsDir = path.join(dataDir, 'rooms');
  const usersDir = path.join(dataDir, 'users');
  const report: RoomReport = { skipped: 0, quarantined: 0, orphanIds: [], log: [] };
  if (!fs.existsSync(roomsDir)) return report;
  const perUser = perUserRoomIds(usersDir);

  for (const file of fs.readdirSync(roomsDir)) {
    if (!file.endsWith('.json')) continue;
    const id = file.replace(/\.json$/, '');
    if (perUser.has(id)) { report.skipped++; report.log.push(`skipped(already-per-user): ${id}`); continue; }

    // legacy-only orphan — quarantine (never overwrite, never invent an owner, never delete legacy)
    const target = path.join(usersDir, '_unowned', 'rooms', id, 'room.json');
    if (fs.existsSync(target)) { report.skipped++; report.log.push(`skipped(already-quarantined): ${id}`); continue; }
    let flat: any = {};
    try { flat = JSON.parse(fs.readFileSync(path.join(roomsDir, file), 'utf-8')); } catch { /* tolerate */ }
    const forward = {
      id: flat.id || id,
      name: flat.name || '(legacy room)',
      ownerToken: '_unowned',
      maxMembers: flat.maxMembers || 10,
      isPrivate: !!flat.isPrivate,
      roomKey: flat.roomKey || '',
      state: flat.state || 'active',
      createdAt: flat.createdAt || Date.now(),
      sshKeysGenerated: false,
      sshPublicKey: '',
      chatHistory: flat.chatHistory || [],
    };
    atomicWriteJson(target, forward);
    report.quarantined++;
    report.orphanIds.push(id);
    report.log.push(`orphan-quarantined: ${id} → _unowned`);
  }
  return report;
}

export interface UserDirReport {
  migrated: number;           // token-* dirs copied to fresh UUID dirs
  skipped: number;            // already migrated / already-UUID
  roomsRewritten: number;     // room.json ownerToken/creator* rewritten in copies
  profilesRekeyed: number;    // defensive — 0 on current data
  remap: Record<string, string>;
  remapPath: string;
  log: string[];
}

// [impl:uuid:97b2d4f6-3c8e-4a11-8b57-2d4f6a8b9c97]
export function migrateTokenDirs(dataDir: string): UserDirReport {
  const usersDir = path.join(dataDir, 'users');
  const remapPath = path.join(dataDir, 'migration', 'token-remap.json');
  const remap: Record<string, string> = fs.existsSync(remapPath)
    ? JSON.parse(fs.readFileSync(remapPath, 'utf-8')) : {};
  const report: UserDirReport = { migrated: 0, skipped: 0, roomsRewritten: 0, profilesRekeyed: 0, remap, remapPath, log: [] };
  if (!fs.existsSync(usersDir)) return report;

  for (const dir of fs.readdirSync(usersDir)) {
    if (!dir.startsWith('token-')) continue; // only legacy token-<ts> dirs (UUID + _unowned skipped)
    let newUuid = remap[dir];
    if (newUuid && fs.existsSync(path.join(usersDir, newUuid))) { report.skipped++; report.log.push(`skipped(already-migrated): ${dir} → ${newUuid}`); continue; }
    if (!newUuid) newUuid = crypto.randomUUID();
    const dst = path.join(usersDir, newUuid);
    if (fs.existsSync(dst)) { report.skipped++; report.log.push(`skipped(target-exists): ${dir}`); continue; }

    copyDirRecursive(path.join(usersDir, dir), dst); // COPY — original left untouched

    // rewrite owner refs in the COPY's rooms only
    const dstRooms = path.join(dst, 'rooms');
    if (fs.existsSync(dstRooms)) {
      for (const rid of fs.readdirSync(dstRooms)) {
        const rj = path.join(dstRooms, rid, 'room.json');
        if (!fs.existsSync(rj)) continue;
        let room: any;
        try { room = JSON.parse(fs.readFileSync(rj, 'utf-8')); } catch { continue; }
        let changed = false;
        for (const k of ['ownerToken', 'creatorToken', 'creatorId']) {
          if (room[k] === dir) { room[k] = newUuid; changed = true; }
        }
        if (changed) { atomicWriteJson(rj, room); report.roomsRewritten++; }
      }
    }

    report.profilesRekeyed += rekeyProfileIfPresent(dataDir, dir, newUuid);
    remap[dir] = newUuid;
    report.migrated++;
    report.log.push(`migrated: ${dir} → ${newUuid}`);
  }

  atomicWriteJson(remapPath, remap);
  return report;
}

/**
 * Defensive (no-op on current data — 0 token-* profiles): if profiles.json has an entry for the old
 * token, add a UUID-keyed copy with the new token and leave a forward redirect on the old entry
 * (reuses the existing redirectTo / TOKEN_REDIRECT mechanism) so no live device is orphaned.
 * Strictly additive — never mutates a UUID-keyed real profile.
 */
function rekeyProfileIfPresent(dataDir: string, oldToken: string, newUuid: string): number {
  const profilesPath = path.join(dataDir, 'profiles.json');
  if (!fs.existsSync(profilesPath)) return 0;
  let profiles: any[];
  try { profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf-8')); } catch { return 0; }
  if (!Array.isArray(profiles)) return 0;
  const old = profiles.find(p => p && p.token === oldToken);
  if (!old) return 0; // no-op today
  if (profiles.some(p => p && p.token === newUuid)) return 0; // already migrated
  profiles.push({ ...old, token: newUuid });
  old.redirectTo = newUuid;
  atomicWriteJson(profilesPath, profiles);
  return 1;
}
