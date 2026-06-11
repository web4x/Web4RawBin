// [impl:uuid:07474cf1-9581-4ae3-8a00-3931f4297da4] T74 room SSH keys
// [impl:uuid:c37ebdba-1310-4f6a-9a35-2a2d5d43084d] ClassRegistry.get(name): ClassLoader
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export function getRoomDir(userToken: string, roomId: string): string {
  return path.join(USERS_DIR, userToken, 'rooms', roomId);
}

function getRoomSshDir(userToken: string, roomId: string): string {
  return path.join(getRoomDir(userToken, roomId), '.ssh');
}

export function createRoomHome(userToken: string, roomId: string): void {
  const roomDir = getRoomDir(userToken, roomId);
  const sshDir = getRoomSshDir(userToken, roomId);
  mkdirSafe(roomDir);
  mkdirSafe(sshDir);
  mkdirSafe(path.join(sshDir, 'public_keys'));
  mkdirSafe(path.join(sshDir, 'private_key'));
  const authKeysPath = path.join(sshDir, 'authorized_keys');
  if (!fs.existsSync(authKeysPath)) writeKeySafe(authKeysPath, '');
}

export function generateRoomKeypair(userToken: string, roomId: string): { publicKey: string; privateKey: string } {
  const sshDir = getRoomSshDir(userToken, roomId);
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
  const sshDir = getRoomSshDir(userToken, roomId);
  return fs.existsSync(path.join(sshDir, 'id_rsa')) && fs.existsSync(path.join(sshDir, 'id_rsa.pub'));
}

export function getRoomPublicKey(userToken: string, roomId: string): string | null {
  const p = path.join(getRoomSshDir(userToken, roomId), 'id_rsa.pub');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

export function getRoomPrivateKey(userToken: string, roomId: string): string | null {
  const p = path.join(getRoomSshDir(userToken, roomId), 'id_rsa');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
}

export function getRoomAuthorizedKeys(userToken: string, roomId: string): string[] {
  const p = path.join(getRoomSshDir(userToken, roomId), 'authorized_keys');
  if (!fs.existsSync(p)) return [];
  const content = fs.readFileSync(p, 'utf-8').trim();
  return content ? content.split('\n').filter(l => l.trim()) : [];
}

export function addRoomAuthorizedKey(userToken: string, roomId: string, key: string): void {
  const p = path.join(getRoomSshDir(userToken, roomId), 'authorized_keys');
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

// [impl:uuid:7144f6ca-a1b2-4c3d-8e4f-5a6b7c8d9e0f] Room.persistAsSymlink R19.22.A
export function writeRoomJson(userToken: string, roomId: string, data: RoomJsonData): void {
  const roomDir = getRoomDir(userToken, roomId);
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
  const p = path.join(getRoomDir(userToken, roomId), 'room.json');
  if (!fs.existsSync(p)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    if (raw.ior && raw.model) return raw.model as RoomJsonData;
    return raw;
  } catch { return null; }
}

export function scanAllRooms(): { userToken: string; roomId: string; data: RoomJsonData }[] {
  const results: { userToken: string; roomId: string; data: RoomJsonData }[] = [];
  if (!fs.existsSync(USERS_DIR)) return results;
  for (const userDir of fs.readdirSync(USERS_DIR)) {
    results.push(...scanUserRooms(userDir));
  }
  return results;
}

// Scan one user's rooms only — used on IDENTIFY so an owner's full room set loads when
// they connect, without walking every user's directory (NFR-2).
export function scanUserRooms(userToken: string): { userToken: string; roomId: string; data: RoomJsonData }[] {
  const results: { userToken: string; roomId: string; data: RoomJsonData }[] = [];
  const roomsDir = path.join(USERS_DIR, userToken, 'rooms');
  if (!fs.existsSync(roomsDir)) return results;
  for (const roomDir of fs.readdirSync(roomsDir)) {
    const data = readRoomJson(userToken, roomDir);
    if (data) results.push({ userToken, roomId: roomDir, data });
  }
  return results;
}
