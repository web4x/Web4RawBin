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
}

// [impl:uuid:028eb22f-41bf-4d3b-a35e-88cd5b28e13c] Room.persistAsSymlink R19.22.A
export function writeRoomJson(userToken: string, roomId: string, data: RoomJsonData): void {
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
