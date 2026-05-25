import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_DIR = path.join(__dirname, '../../../data/users');

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
  maxMembers: number;
  isPrivate: boolean;
  roomKey: string;
  state: string;
  createdAt: number;
  sshKeysGenerated: boolean;
  sshPublicKey: string;
  chatHistory: { senderId: string; senderName: string; text: string; timestamp: number }[];
}

export function writeRoomJson(userToken: string, roomId: string, data: RoomJsonData): void {
  const roomDir = getRoomDir(userToken, roomId);
  mkdirSafe(roomDir);
  fs.writeFileSync(path.join(roomDir, 'room.json'), JSON.stringify(data, null, 2));
}

export function readRoomJson(userToken: string, roomId: string): RoomJsonData | null {
  const p = path.join(getRoomDir(userToken, roomId), 'room.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; }
}

export function scanAllRooms(): { userToken: string; roomId: string; data: RoomJsonData }[] {
  const results: { userToken: string; roomId: string; data: RoomJsonData }[] = [];
  if (!fs.existsSync(USERS_DIR)) return results;
  for (const userDir of fs.readdirSync(USERS_DIR)) {
    const roomsDir = path.join(USERS_DIR, userDir, 'rooms');
    if (!fs.existsSync(roomsDir)) continue;
    for (const roomDir of fs.readdirSync(roomsDir)) {
      const data = readRoomJson(userDir, roomDir);
      if (data) results.push({ userToken: userDir, roomId: roomDir, data });
    }
  }
  return results;
}
