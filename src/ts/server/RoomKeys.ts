// [impl:uuid:07474cf1-9581-4ae3-8a00-3931f4297da4] T74 room SSH keys
// [impl:uuid:c37ebdba-1310-4f6a-9a35-2a2d5d43084d] ClassRegistry.get(name): ClassLoader
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homeKeyFor, homePathFor } from './storage-id.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// T100: configurable via DATA_DIR env (isolated test data). INVARIANT: unset → exact prod path.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const USERS_DIR = path.join(DATA_DIR, 'users');

function mkdirSafe(dir: string, mode: number = 0o700): void {
  fs.mkdirSync(dir, { recursive: true, mode });
  try { fs.chmodSync(dir, mode); } catch {}
}

function writeKeySafe(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch {}
}

// R40.22: the home key routes through homeKeyFor+homePathFor (the ONE chokepoint). mint:true = a WRITE
// (create/mint the storageId home) → always a string; mint:false = a READ (get-only) → string, or NULL when
// the token has no home (never falls back to the token, never resolves to the users root — homePathFor
// throws on empty). READ callers MUST handle null (compile-enforced). INERT until REKEY_APPLIED (returns the
// token path, current behavior).
export function getRoomDir(userToken: string, roomId: string, opts: { mint: true }): string;
export function getRoomDir(userToken: string, roomId: string, opts?: { mint: false }): string | null;
export function getRoomDir(userToken: string, roomId: string, opts: { mint: boolean } = { mint: false }): string | null {
  const key = opts.mint ? homeKeyFor(userToken, { mint: true }) : homeKeyFor(userToken, { mint: false });
  if (key === null) return null;
  return homePathFor(USERS_DIR, key, 'rooms', roomId);
}

function getRoomSshDir(userToken: string, roomId: string, opts: { mint: true }): string;
function getRoomSshDir(userToken: string, roomId: string, opts?: { mint: false }): string | null;
function getRoomSshDir(userToken: string, roomId: string, opts: { mint: boolean } = { mint: false }): string | null {
  const dir = opts.mint ? getRoomDir(userToken, roomId, { mint: true }) : getRoomDir(userToken, roomId, { mint: false });
  return dir === null ? null : path.join(dir, '.ssh');
}

export function createRoomHome(userToken: string, roomId: string): void {
  const roomDir = getRoomDir(userToken, roomId, { mint: true });   // WRITE: mint the storageId home
  const sshDir = getRoomSshDir(userToken, roomId, { mint: true });
  mkdirSafe(roomDir);
  mkdirSafe(sshDir);
  mkdirSafe(path.join(sshDir, 'public_keys'));
  mkdirSafe(path.join(sshDir, 'private_key'));
  const authKeysPath = path.join(sshDir, 'authorized_keys');
  if (!fs.existsSync(authKeysPath)) writeKeySafe(authKeysPath, '');
}

export function generateRoomKeypair(userToken: string, roomId: string): { publicKey: string; privateKey: string } {
  const sshDir = getRoomSshDir(userToken, roomId, { mint: true });   // WRITE: creates the keypair home
  const idRsaPath = path.join(sshDir, 'id_rsa');
  const idRsaPubPath = path.join(sshDir, 'id_rsa.pub');

  if (fs.existsSync(idRsaPath) && fs.existsSync(idRsaPubPath)) {
    return { publicKey: fs.readFileSync(idRsaPubPath, 'utf-8'), privateKey: fs.readFileSync(idRsaPath, 'utf-8') };
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  writeKeySafe(idRsaPath, privateKey);
  writeKeySafe(idRsaPubPath, publicKey);
  writeKeySafe(path.join(sshDir, 'public_keys', `${roomId}.public_key`), publicKey);
  writeKeySafe(path.join(sshDir, 'private_key', `${roomId}.private_key`), privateKey);

  return { publicKey, privateKey };
}

export function hasRoomKeys(userToken: string, roomId: string): boolean {
  const sshDir = getRoomSshDir(userToken, roomId);   // READ
  if (!sshDir) return false;
  return fs.existsSync(path.join(sshDir, 'id_rsa')) && fs.existsSync(path.join(sshDir, 'id_rsa.pub'));
}

export function getRoomPublicKey(userToken: string, roomId: string): string | null {
  const sshDir = getRoomSshDir(userToken, roomId);   // READ
  if (!sshDir) return null;
  const p = path.join(sshDir, 'id_rsa.pub');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

export function getRoomPrivateKey(userToken: string, roomId: string): string | null {
  const sshDir = getRoomSshDir(userToken, roomId);   // READ
  if (!sshDir) return null;
  const p = path.join(sshDir, 'id_rsa');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

export function getRoomAuthorizedKeys(userToken: string, roomId: string): string[] {
  const sshDir = getRoomSshDir(userToken, roomId);   // READ
  if (!sshDir) return [];
  const p = path.join(sshDir, 'authorized_keys');
  if (!fs.existsSync(p)) return [];
  const content = fs.readFileSync(p, 'utf-8').trim();
  return content ? content.split('\n').filter(l => l.trim()) : [];
}

export function addRoomAuthorizedKey(userToken: string, roomId: string, key: string): void {
  const sshDir = getRoomSshDir(userToken, roomId, { mint: true });   // WRITE (adds a key)
  const p = path.join(sshDir, 'authorized_keys');
  const existing = getRoomAuthorizedKeys(userToken, roomId);
  const trimmed = key.trim();
  if (existing.includes(trimmed)) return;
  writeKeySafe(p, [...existing, trimmed].join('\n') + '\n');
}

export interface RoomJsonData {
  id: string;
  name: string;
  ownerToken: string;
  isPrivate: boolean;
  visibility?: string;
  mode?: string;
  roomKey: string;
  state: string;
  createdAt: number;
  sshKeysGenerated: boolean;
  sshPublicKey: string;
  chatHistory: { senderId: string; senderName: string; text: string; timestamp: number }[];
  files?: string[];
  members?: { ior: string; name: string; role?: string; status?: string; joinedAt?: number }[];
  lastMessageIor?: string | null;
  firstMessageIor?: string | null;
  messageCount?: number;
}

// [impl:uuid:028eb22f-41bf-4d3b-a35e-88cd5b28e13c] Room.persistAsSymlink R19.22.A
// R40.107 ROOM-PERSIST CORRUPTION GUARDS (architect 58175f768). writeRoomJson is the ONE chokepoint every room
// save flows through, so the identity-preserving invariants live here, once, for all callers. The incident:
// Room.persist() serializes `name: m.name` (blanks a good stored name when the in-memory member is profile-less)
// and `joinedAt: Date.now()` + a reconstructed createdAt (churns/rewrites creation facts). These guards make that
// class of loss impossible by construction: #1 read-before-write preserves a non-empty stored name; #2 keeps
// createdAt + each member's original joinedAt immutable across re-saves; #5 REFUSES (throws) any write that would
// still blank a name or move createdAt — the persist-invariant BITE (a destructive identity write cannot land).
// R40.107 guard #6 (identity-aware member-drop) needs to resolve a member token to its PRIMARY. RoomKeys cannot import
// Room (Room imports RoomKeys → circular), so server.ts INJECTS the same chained redirect resolver it builds for
// Room.resolveToken. Until injected (tests/default), it is null and the drop-check is SKIPPED — never refuse a drop
// we cannot classify (that would brick saving, the "#5 alone bricks 49 rooms" hazard). A test injects it to exercise #6.
let guardResolveToken: ((token: string) => string) | null = null;
export function setGuardResolveToken(fn: ((token: string) => string) | null): void { guardResolveToken = fn; }
const bareTok = (ior: string): string => String(ior || '').replace('ior:instance:', '').split('@')[0];

// [impl:uuid:PENDING-req-mint] roomPersistIdentity.preserve — R40.107 guards #1 (non-destructive name) + #2 (immutable timestamps).
// Read-before-write reconciliation: never downgrade a stored non-empty member name to "", and carry createdAt +
// each member's original joinedAt forward unchanged. Mutates `data` in place. Pure (no fs) → directly unit-testable.
export function preserveRoomIdentity(stored: RoomJsonData | null, data: RoomJsonData): void {
  if (!stored) return; // first-ever persist: createdAt/joinedAt/names are genuine originals — nothing to preserve
  if (typeof stored.createdAt === 'number' && stored.createdAt > 0) data.createdAt = stored.createdAt; // #2 createdAt = creation fact
  const storedByIor = new Map<string, NonNullable<RoomJsonData['members']>[number]>();
  for (const s of stored.members || []) storedByIor.set(String(s.ior), s);
  for (const m of data.members || []) {
    const s = storedByIor.get(String(m.ior));
    if (!s) continue; // a genuinely new member — its name + first joinedAt stand as given
    if ((!m.name || !String(m.name).trim()) && s.name && String(s.name).trim()) m.name = s.name; // #1 never blank a stored name
    if (typeof s.joinedAt === 'number' && s.joinedAt > 0) m.joinedAt = s.joinedAt;                // #2 joinedAt = original join fact
  }
}

// [impl:uuid:PENDING-req-mint] roomPersistInvariant.assert — R40.107 guard #5 (persist-invariant BITE / class-killer).
// The last line of defence: REFUSE (throw) any room write that would still destroy identity — a stored non-empty
// member name going empty, or createdAt moving on an existing unit — EVEN IF #1/#2 regressed. A destructive
// identity write cannot land. Pure (no fs) → the drift-injection BITE test calls it directly. Add to ci:gates.
export function assertRoomPersistInvariant(stored: RoomJsonData | null, data: RoomJsonData, roomId: string, explicitMembers = true): void {
  if (!stored) return;
  const storedByIor = new Map<string, NonNullable<RoomJsonData['members']>[number]>();
  for (const s of stored.members || []) storedByIor.set(String(s.ior), s);
  for (const m of data.members || []) {
    const s = storedByIor.get(String(m.ior));
    if (s && s.name && String(s.name).trim() && (!m.name || !String(m.name).trim())) {
      const msg = `[writeRoomJson GUARD#5] REFUSED room ${roomId}: member ${m.ior} name would blank "${s.name}"→"" (persist-invariant)`;
      console.error(msg); throw new Error(msg);
    }
  }
  if (typeof stored.createdAt === 'number' && stored.createdAt > 0 && typeof data.createdAt === 'number' && data.createdAt !== stored.createdAt) {
    const msg = `[writeRoomJson GUARD#5] REFUSED room ${roomId}: createdAt would move ${stored.createdAt}→${data.createdAt} (immutable)`;
    console.error(msg); throw new Error(msg);
  }
  // #6 IDENTITY-AWARE MEMBER-DROP (pairs with #5): a stored member missing from the write is REFUSED unless it is a
  // BENIGN consolidation — it HAS a redirect (resolves to a different primary) AND that primary is STILL represented
  // among the written members. A distinct identity (no redirect) vanishing, or one whose primary also vanished, is a
  // REAL silent drop → refuse. Benign dedup (stub dropped, primary present) PASSES → no brick. Skipped if no resolver injected.
  // ★ PARTIAL-WRITE FIX (all CREATE_ROOM broken since v0.8.212): run the drop-detection ONLY on an EXPLICIT members write —
  // a caller that OMITS members (e.g. server.ts:4805 after Room.persist() already wrote them) is a partial update, NOT "drop all";
  // reading data.members||[]=[] as a full drop false-refused every new-room create (writeRoomJson preserves stored members on omit).
  if (guardResolveToken && explicitMembers) {
    const writtenTokens = new Set((data.members || []).map((m) => bareTok(m.ior)));
    const writtenPrimaries = new Set([...writtenTokens].map((t) => guardResolveToken!(t)));
    for (const s of stored.members || []) {
      const st = bareTok(s.ior);
      if (writtenTokens.has(st)) continue;                       // still present → fine
      const prim = guardResolveToken(st);
      const benign = prim !== st && (writtenTokens.has(prim) || writtenPrimaries.has(prim)); // has redirect AND primary present
      if (!benign) {
        const why = prim === st ? 'no redirect (distinct identity)' : `primary ${prim.slice(0, 8)} absent from room`;
        const msg = `[writeRoomJson GUARD#6] REFUSED room ${roomId}: member ${st.slice(0, 8)} would be silently dropped — ${why}`;
        console.error(msg); throw new Error(msg);
      }
    }
  }
}

export function writeRoomJson(userToken: string, roomId: string, data: RoomJsonData): void {
  const stored = readRoomJson(userToken, roomId);   // R40.107: read-before-write for the identity guards
  const explicitMembers = 'members' in data;        // PARTIAL-WRITE: a caller (server.ts:4805 after Room.persist() wrote members) may OMIT members — that is NOT "drop all"
  preserveRoomIdentity(stored, data);               // #1/#2 — preserve non-empty name + createdAt/joinedAt
  if (!explicitMembers && stored && Array.isArray(stored.members)) data.members = stored.members; // PARTIAL: preserve stored members wholesale (non-destructive) — the omit must not persist as a drop
  assertRoomPersistInvariant(stored, data, roomId, explicitMembers); // #5 always; #6 member-drop ONLY on an explicit members write (never on ||[])
  const roomDir = getRoomDir(userToken, roomId, { mint: true });   // WRITE
  mkdirSafe(roomDir);
  const roomJsonPath = path.join(roomDir, 'room.json');
  const scenarioDir = path.resolve(DATA_DIR, '../scenario/index');
  const hex = roomId.replace(/-/g, '');
  if (hex.length >= 5) {
    const prefix = path.join(hex[0], hex[1], hex[2], hex[3], hex[4]);
    const canonDir = path.join(scenarioDir, prefix);
    const canonPath = path.join(canonDir, `${roomId}.scenario.json`);
  // [impl:uuid:2a29b3da-c0a5-4f32-b172-af8dafaa147a] RbRoomDetail.editCanonical R19.30
    const sourceFile = `scenario/index/${prefix}/${roomId}.scenario.json`;
    const unit = { ior: 'ior:class:Room', model: { uuid: roomId, ...data, sourceFile, unitLinks: [`sprints.json/rooms/${userToken}/${roomId}.json`] }, ownerIor: `ior:instance:${userToken}` };
    if (data.chatHistory?.length > 0) console.log(`[writeRoomJson] ${roomId.slice(0,8)} writing ${data.chatHistory.length} chat messages`);
    try {
      mkdirSafe(canonDir);
      fs.writeFileSync(canonPath, JSON.stringify(unit, null, 2));
      try { fs.unlinkSync(roomJsonPath); } catch {}
      const relTarget = path.relative(roomDir, canonPath);
      fs.symlinkSync(relTarget, roomJsonPath);
    } catch {
      fs.writeFileSync(roomJsonPath, JSON.stringify(data, null, 2));
    }
  } else {
    fs.writeFileSync(roomJsonPath, JSON.stringify(data, null, 2));
  }
}

export function readRoomJson(userToken: string, roomId: string): RoomJsonData | null {
  const dir = getRoomDir(userToken, roomId);   // READ
  if (!dir) return null;
  const p = path.join(dir, 'room.json');
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    if (raw.ior && raw.model) return raw.model as RoomJsonData;
    return raw;
  } catch { return null; }
}

// Scan an ON-DISK home directory (its name is ALREADY the home key — a storageId post-rekey, a token pre-
// rekey). Does NOT re-resolve through homeKeyFor — the caller already holds the resolved dir. `reportAs` is
// what to return as userToken (the original token for scanUserRooms; the dir name for scanAllRooms).
function scanRoomsInHomeDir(homeDirName: string, reportAs: string): { userToken: string; roomId: string; data: RoomJsonData }[] {
  const results: { userToken: string; roomId: string; data: RoomJsonData }[] = [];
  const roomsDir = homePathFor(USERS_DIR, homeDirName, 'rooms');
  if (!fs.existsSync(roomsDir)) return results;
  for (const roomDir of fs.readdirSync(roomsDir)) {
    const p = path.join(roomsDir, roomDir, 'room.json');
    if (!fs.existsSync(p)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      const data = (raw.ior && raw.model) ? raw.model as RoomJsonData : raw as RoomJsonData;
      if (data) results.push({ userToken: reportAs, roomId: roomDir, data });
    } catch { /* skip unreadable */ }
  }
  return results;
}

export function scanAllRooms(): { userToken: string; roomId: string; data: RoomJsonData }[] {
  const results: { userToken: string; roomId: string; data: RoomJsonData }[] = [];
  if (!fs.existsSync(USERS_DIR)) return results;
  // Each dir under USERS_DIR IS a home key on disk (storageId post-rekey); scan it DIRECTLY (do NOT
  // re-resolve — a storageId is not a homeKeyFor KEY). b1 leaves only storageId homes here post-convergence.
  for (const userDir of fs.readdirSync(USERS_DIR)) {
    results.push(...scanRoomsInHomeDir(userDir, userDir));
  }
  return results;
}

// Scan one user's rooms — used on IDENTIFY. Given a TOKEN → resolve to its home key (READ, map-only) →
// scan that home directly. No home → no rooms (never falls back to the token).
export function scanUserRooms(userToken: string): { userToken: string; roomId: string; data: RoomJsonData }[] {
  const key = homeKeyFor(userToken, { mint: false });   // READ: token → storageId (or null = no home)
  if (key === null) return [];
  return scanRoomsInHomeDir(key, userToken);
}
