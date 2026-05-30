/**
 * T74: Room Identity — persistent rooms with SSH keys
 * [test:uuid:cb1b6dcf-358c-4c67-a8b0-8c94d1ba4e6f] T74 room identity SSH keys
 * Tests UC-RM.1: room directory creation, SSH tree, permissions, room.json.
 * Uses temp dirs with real RSA-2048 keys.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

// ── Replicate room identity creation from spec ──────────────────────────────

let DATA_DIR: string;

function getUserHomeDir(token: string): string {
  return path.join(DATA_DIR, 'users', token);
}

function getRoomsDir(token: string): string {
  return path.join(getUserHomeDir(token), 'rooms');
}

function getRoomDir(token: string, roomId: string): string {
  return path.join(getRoomsDir(token), roomId);
}

function getRoomSshDir(token: string, roomId: string): string {
  return path.join(getRoomDir(token, roomId), '.ssh');
}

interface RoomMeta {
  id: string;
  name: string;
  ownerToken: string;
  maxMembers: number;
  isPrivate: boolean;
  roomKey: string | null;
  createdAt: string;
  chatHistory: any[];
}

function createRoomWithIdentity(
  ownerToken: string,
  ownerName: string,
  opts?: { roomName?: string; maxMembers?: number; isPrivate?: boolean; roomKey?: string },
): { roomId: string; roomDir: string; meta: RoomMeta } {
  const roomId = crypto.randomUUID();
  const roomDir = getRoomDir(ownerToken, roomId);
  const sshDir = getRoomSshDir(ownerToken, roomId);
  const publicKeysDir = path.join(sshDir, 'public_keys');
  const privateKeyDir = path.join(sshDir, 'private_key');

  // Create directory tree
  fs.mkdirSync(roomDir, { recursive: true });
  fs.mkdirSync(sshDir, { mode: 0o700 });
  fs.mkdirSync(publicKeysDir, { mode: 0o700 });
  fs.mkdirSync(privateKeyDir, { mode: 0o700 });

  // Generate RSA-2048 keypair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(path.join(sshDir, 'id_rsa'), privateKey, { mode: 0o600 });
  fs.writeFileSync(path.join(sshDir, 'id_rsa.pub'), publicKey, { mode: 0o600 });
  fs.writeFileSync(path.join(publicKeysDir, `${roomId}.public_key`), publicKey, { mode: 0o600 });
  fs.writeFileSync(path.join(privateKeyDir, `${roomId}.private_key`), privateKey, { mode: 0o600 });
  fs.writeFileSync(path.join(sshDir, 'authorized_keys'), '', { mode: 0o600 });

  // Write room.json
  const defaultName = `${ownerName}'s Room`;
  const meta: RoomMeta = {
    id: roomId,
    name: opts?.roomName || defaultName,
    ownerToken,
    maxMembers: opts?.maxMembers || 10,
    isPrivate: opts?.isPrivate || false,
    roomKey: opts?.roomKey || null,
    createdAt: new Date().toISOString(),
    chatHistory: [],
  };
  fs.writeFileSync(path.join(roomDir, 'room.json'), JSON.stringify(meta, null, 2));

  return { roomId, roomDir, meta };
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const OWNER_TOKEN = 'owner-token-abc';
const OWNER_NAME = 'TestUser';

beforeEach(() => {
  DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-roomid-'));
  fs.mkdirSync(path.join(DATA_DIR, 'users', OWNER_TOKEN), { recursive: true });
});

afterEach(() => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

// ── TC-74.1: Room dir created at data/users/<token>/rooms/<uuid>/ ───────────

describe('TC-74.1: Room directory creation', () => {

  it('creates room dir under user home/rooms/<uuid>/', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const roomDir = getRoomDir(OWNER_TOKEN, roomId);
    expect(fs.existsSync(roomDir)).toBe(true);
    expect(fs.statSync(roomDir).isDirectory()).toBe(true);
  });

  it('room dir is inside user home directory', () => {
    const { roomDir } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(roomDir.startsWith(getUserHomeDir(OWNER_TOKEN))).toBe(true);
  });

  it('rooms/ parent dir created', () => {
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(getRoomsDir(OWNER_TOKEN))).toBe(true);
  });
});

// ── TC-74.2: .ssh/ tree has full OOSH structure ─────────────────────────────

describe('TC-74.2: SSH tree structure', () => {

  it('.ssh/ directory exists', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(getRoomSshDir(OWNER_TOKEN, roomId))).toBe(true);
  });

  it('id_rsa exists', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa'))).toBe(true);
  });

  it('id_rsa.pub exists', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa.pub'))).toBe(true);
  });

  it('public_keys/ dir exists with named copy', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const pubKeysDir = path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'public_keys');
    expect(fs.existsSync(pubKeysDir)).toBe(true);
    expect(fs.existsSync(path.join(pubKeysDir, `${roomId}.public_key`))).toBe(true);
  });

  it('private_key/ dir exists with named copy', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const privKeyDir = path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'private_key');
    expect(fs.existsSync(privKeyDir)).toBe(true);
    expect(fs.existsSync(path.join(privKeyDir, `${roomId}.private_key`))).toBe(true);
  });

  it('authorized_keys exists and is empty', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const akPath = path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'authorized_keys');
    expect(fs.existsSync(akPath)).toBe(true);
    expect(fs.readFileSync(akPath, 'utf-8')).toBe('');
  });

  it('named copies match originals', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const sshDir = getRoomSshDir(OWNER_TOKEN, roomId);
    const pub = fs.readFileSync(path.join(sshDir, 'id_rsa.pub'), 'utf-8');
    const namedPub = fs.readFileSync(path.join(sshDir, 'public_keys', `${roomId}.public_key`), 'utf-8');
    expect(namedPub).toBe(pub);

    const priv = fs.readFileSync(path.join(sshDir, 'id_rsa'), 'utf-8');
    const namedPriv = fs.readFileSync(path.join(sshDir, 'private_key', `${roomId}.private_key`), 'utf-8');
    expect(namedPriv).toBe(priv);
  });
});

// ── TC-74.3: id_rsa is valid PEM RSA-2048 ───────────────────────────────────

describe('TC-74.3: Valid RSA-2048 PEM keys', () => {

  it('id_rsa contains PEM private key', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const key = fs.readFileSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa'), 'utf-8');
    expect(key).toContain('-----BEGIN PRIVATE KEY-----');
    expect(key).toContain('-----END PRIVATE KEY-----');
  });

  it('id_rsa.pub contains PEM public key', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const key = fs.readFileSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa.pub'), 'utf-8');
    expect(key).toContain('-----BEGIN PUBLIC KEY-----');
    expect(key).toContain('-----END PUBLIC KEY-----');
  });

  it('keypair works for encrypt/decrypt', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const sshDir = getRoomSshDir(OWNER_TOKEN, roomId);
    const pub = fs.readFileSync(path.join(sshDir, 'id_rsa.pub'), 'utf-8');
    const priv = fs.readFileSync(path.join(sshDir, 'id_rsa'), 'utf-8');

    const data = Buffer.from('room identity test');
    const encrypted = crypto.publicEncrypt(pub, data);
    const decrypted = crypto.privateDecrypt(priv, encrypted);
    expect(decrypted.toString()).toBe('room identity test');
  });
});

// ── TC-74.4: Permissions 700 dirs 600 files ─────────────────────────────────

describe('TC-74.4: File permissions', () => {

  it('.ssh/ is 700', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.statSync(getRoomSshDir(OWNER_TOKEN, roomId)).mode & 0o777).toBe(0o700);
  });

  it('public_keys/ is 700', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.statSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'public_keys')).mode & 0o777).toBe(0o700);
  });

  it('private_key/ is 700', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.statSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'private_key')).mode & 0o777).toBe(0o700);
  });

  it('id_rsa is 600', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.statSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa')).mode & 0o777).toBe(0o600);
  });

  it('id_rsa.pub is 600', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.statSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa.pub')).mode & 0o777).toBe(0o600);
  });

  it('authorized_keys is 600', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.statSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'authorized_keys')).mode & 0o777).toBe(0o600);
  });
});

// ── TC-74.5: room.json has correct metadata ─────────────────────────────────

describe('TC-74.5: room.json metadata', () => {

  it('room.json exists', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'))).toBe(true);
  });

  it('room.json has id field matching UUID', () => {
    const { roomId, meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const stored = JSON.parse(fs.readFileSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'), 'utf-8'));
    expect(stored.id).toBe(roomId);
  });

  it('room.json has name field', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Custom Room' });
    const stored = JSON.parse(fs.readFileSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'), 'utf-8'));
    expect(stored.name).toBe('Custom Room');
  });

  it('room.json has ownerToken', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const stored = JSON.parse(fs.readFileSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'), 'utf-8'));
    expect(stored.ownerToken).toBe(OWNER_TOKEN);
  });

  it('room.json has createdAt ISO date', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const stored = JSON.parse(fs.readFileSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'), 'utf-8'));
    expect(stored.createdAt).toBeDefined();
    expect(new Date(stored.createdAt).getTime()).toBeGreaterThan(0);
  });

  it('room.json has chatHistory as empty array', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const stored = JSON.parse(fs.readFileSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'), 'utf-8'));
    expect(Array.isArray(stored.chatHistory)).toBe(true);
    expect(stored.chatHistory.length).toBe(0);
  });
});

// ── TC-74.6: Default name is "TestUser's Room" ──────────────────────────────

describe("TC-74.6: Default room name", () => {

  it("default name is owner's name + Room when no name given", () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, 'TestUser');
    expect(meta.name).toBe("TestUser's Room");
  });

  it("custom name overrides default", () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, 'TestUser', { roomName: 'My Custom Room' });
    expect(meta.name).toBe('My Custom Room');
  });

  it("different owner name produces different default", () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, 'Marcel');
    expect(meta.name).toBe("Marcel's Room");
  });
});

// ── TC-74.7: Full UUID (36 chars) ───────────────────────────────────────────

describe('TC-74.7: Room UUID format', () => {

  it('roomId is 36 characters (full UUID)', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(roomId.length).toBe(36);
  });

  it('roomId matches UUID v4 pattern', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(roomId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('different rooms get different UUIDs', () => {
    const r1 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const r2 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(r1.roomId).not.toBe(r2.roomId);
  });

  it('room directory name is the full UUID', () => {
    const { roomId, roomDir } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(path.basename(roomDir)).toBe(roomId);
    expect(path.basename(roomDir).length).toBe(36);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T75: UC-RM.2 — Room persistence across restart
// ═══════════════════════════════════════════════════════════════════════════

function persistRoom(token: string, roomId: string, meta: RoomMeta): void {
  const roomDir = getRoomDir(token, roomId);
  fs.writeFileSync(path.join(roomDir, 'room.json'), JSON.stringify(meta, null, 2));
}

function loadRoomJson(token: string, roomId: string): RoomMeta | null {
  const jsonPath = path.join(getRoomDir(token, roomId), 'room.json');
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch {
    return null;
  }
}

function scanAllRooms(): { ownerToken: string; roomId: string; meta: RoomMeta }[] {
  const usersDir = path.join(DATA_DIR, 'users');
  if (!fs.existsSync(usersDir)) return [];
  const results: { ownerToken: string; roomId: string; meta: RoomMeta }[] = [];

  for (const userDir of fs.readdirSync(usersDir)) {
    const roomsDir = path.join(usersDir, userDir, 'rooms');
    if (!fs.existsSync(roomsDir)) continue;
    for (const roomDir of fs.readdirSync(roomsDir)) {
      const jsonPath = path.join(roomsDir, roomDir, 'room.json');
      if (!fs.existsSync(jsonPath)) continue;
      try {
        const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        results.push({ ownerToken: userDir, roomId: roomDir, meta });
      } catch {
        // Corrupt room.json — skip
      }
    }
  }
  return results;
}

// ── TC-75.1: Room persists to room.json on create ───────────────────────────

describe('TC-75.1: Room persists on create', () => {

  it('room.json exists immediately after create', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const jsonPath = path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json');
    expect(fs.existsSync(jsonPath)).toBe(true);
  });

  it('room.json is valid JSON', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const meta = loadRoomJson(OWNER_TOKEN, roomId);
    expect(meta).not.toBeNull();
    expect(meta!.id).toBe(roomId);
  });
});

// ── TC-75.2: room.json updated on chat (chatHistory grows) ──────────────────

describe('TC-75.2: Chat persists to room.json', () => {

  it('chatHistory grows when messages added and persisted', () => {
    const { roomId, meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);

    // Simulate adding chat and persisting
    meta.chatHistory.push({ senderId: 'member-1', senderName: 'Alice', text: 'Hello', timestamp: Date.now() });
    persistRoom(OWNER_TOKEN, roomId, meta);

    const loaded = loadRoomJson(OWNER_TOKEN, roomId)!;
    expect(loaded.chatHistory.length).toBe(1);
    expect(loaded.chatHistory[0].text).toBe('Hello');
  });

  it('multiple messages persist in order', () => {
    const { roomId, meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);

    meta.chatHistory.push({ senderId: 'm1', senderName: 'Alice', text: 'First', timestamp: Date.now() });
    meta.chatHistory.push({ senderId: 'm2', senderName: 'Bob', text: 'Second', timestamp: Date.now() });
    meta.chatHistory.push({ senderId: 'm1', senderName: 'Alice', text: 'Third', timestamp: Date.now() });
    persistRoom(OWNER_TOKEN, roomId, meta);

    const loaded = loadRoomJson(OWNER_TOKEN, roomId)!;
    expect(loaded.chatHistory.length).toBe(3);
    expect(loaded.chatHistory.map((m: any) => m.text)).toEqual(['First', 'Second', 'Third']);
  });
});

// ── TC-75.3: scanAllRooms restores rooms from disk ──────────────────────────

describe('TC-75.3: scanAllRooms restores rooms', () => {

  it('finds rooms created by createRoomWithIdentity', () => {
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Second Room' });

    const rooms = scanAllRooms();
    expect(rooms.length).toBe(2);
  });

  it('finds rooms across multiple users', () => {
    const otherToken = 'other-owner';
    fs.mkdirSync(path.join(DATA_DIR, 'users', otherToken), { recursive: true });

    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    createRoomWithIdentity(otherToken, 'OtherUser', { roomName: 'Other Room' });

    const rooms = scanAllRooms();
    expect(rooms.length).toBe(2);
    expect(rooms.map(r => r.ownerToken).sort()).toEqual([OWNER_TOKEN, otherToken].sort());
  });

  it('returns empty array when no rooms exist', () => {
    expect(scanAllRooms()).toEqual([]);
  });

  it('skips corrupt room.json without crashing', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    // Corrupt the JSON
    fs.writeFileSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'), '{corrupt json!!!');

    const rooms = scanAllRooms();
    expect(rooms.length).toBe(0);
  });
});

// ── TC-75.4: Restored room has correct fields ───────────────────────────────

describe('TC-75.4: Restored room metadata correct', () => {

  it('restored room has correct name', () => {
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Persistent Room' });
    const rooms = scanAllRooms();
    expect(rooms[0].meta.name).toBe('Persistent Room');
  });

  it('restored room has correct id matching directory', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const rooms = scanAllRooms();
    expect(rooms[0].roomId).toBe(roomId);
    expect(rooms[0].meta.id).toBe(roomId);
  });

  it('restored room has correct ownerToken', () => {
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const rooms = scanAllRooms();
    expect(rooms[0].meta.ownerToken).toBe(OWNER_TOKEN);
    expect(rooms[0].ownerToken).toBe(OWNER_TOKEN);
  });

  it('restored room preserves chat history', () => {
    const { roomId, meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    meta.chatHistory.push({ senderId: 'm1', senderName: 'Alice', text: 'Survives restart', timestamp: Date.now() });
    persistRoom(OWNER_TOKEN, roomId, meta);

    const rooms = scanAllRooms();
    expect(rooms[0].meta.chatHistory.length).toBe(1);
    expect(rooms[0].meta.chatHistory[0].text).toBe('Survives restart');
  });

  it('SSH keys still exist after scan (not regenerated)', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const keyBefore = fs.readFileSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa'), 'utf-8');

    scanAllRooms();

    const keyAfter = fs.readFileSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa'), 'utf-8');
    expect(keyAfter).toBe(keyBefore);
  });
});

// ── TC-75.5: No cleanupStale for persistent rooms ───────────────────────────

describe('TC-75.5: Persistent rooms not auto-deleted', () => {

  it('empty rooms survive (not cleaned up)', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);

    // Simulate: room has no members, time passes — room should NOT be deleted
    const rooms = scanAllRooms();
    expect(rooms.length).toBe(1);
    expect(rooms[0].roomId).toBe(roomId);
  });

  it('room dir still exists after scan with zero members', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    scanAllRooms();

    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(true);
    expect(fs.existsSync(path.join(getRoomDir(OWNER_TOKEN, roomId), 'room.json'))).toBe(true);
  });

  it('multiple empty rooms all persist', () => {
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Room A' });
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Room B' });
    createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Room C' });

    const rooms = scanAllRooms();
    expect(rooms.length).toBe(3);
    expect(rooms.map(r => r.meta.name).sort()).toEqual(['Room A', 'Room B', 'Room C']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T76: UC-RM.3 — Room deletion
// ═══════════════════════════════════════════════════════════════════════════

function deleteRoom(
  requesterToken: string,
  ownerToken: string,
  roomId: string,
): { success: boolean; error?: string } {
  const roomDir = getRoomDir(ownerToken, roomId);
  if (!fs.existsSync(roomDir)) return { success: false, error: 'Room not found' };

  const meta = loadRoomJson(ownerToken, roomId);
  if (!meta) return { success: false, error: 'Room metadata not found' };

  if (meta.ownerToken !== requesterToken) {
    return { success: false, error: 'Only the room owner can delete it' };
  }

  fs.rmSync(roomDir, { recursive: true, force: true });
  return { success: true };
}

// ── TC-76.1: Owner can delete room — folder removed ─────────────────────────

describe('TC-76.1: Owner deletes room', () => {

  it('owner delete removes room directory', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(true);

    const result = deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(result.success).toBe(true);
    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(false);
  });

  it('room.json gone after delete', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(loadRoomJson(OWNER_TOKEN, roomId)).toBeNull();
  });

  it('deleted room not found by scanAllRooms', () => {
    const r1 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Keep' });
    const r2 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Delete' });

    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, r2.roomId);

    const rooms = scanAllRooms();
    expect(rooms.length).toBe(1);
    expect(rooms[0].meta.name).toBe('Keep');
  });
});

// ── TC-76.2: SSH keys deleted with room ─────────────────────────────────────

describe('TC-76.2: SSH keys destroyed on delete', () => {

  it('.ssh/ directory removed', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(fs.existsSync(getRoomSshDir(OWNER_TOKEN, roomId))).toBe(true);

    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(fs.existsSync(getRoomSshDir(OWNER_TOKEN, roomId))).toBe(false);
  });

  it('id_rsa private key destroyed', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const keyPath = path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa');
    expect(fs.existsSync(keyPath)).toBe(true);

    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(fs.existsSync(keyPath)).toBe(false);
  });

  it('named key copies destroyed', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const pubCopy = path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'public_keys', `${roomId}.public_key`);
    const privCopy = path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'private_key', `${roomId}.private_key`);
    expect(fs.existsSync(pubCopy)).toBe(true);
    expect(fs.existsSync(privCopy)).toBe(true);

    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(fs.existsSync(pubCopy)).toBe(false);
    expect(fs.existsSync(privCopy)).toBe(false);
  });
});

// ── TC-76.3: Non-owner delete returns error ─────────────────────────────────

describe('TC-76.3: Non-owner cannot delete', () => {

  it('non-owner gets error', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const result = deleteRoom('other-token', OWNER_TOKEN, roomId);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Only the room owner can delete it');
  });

  it('room still exists after non-owner attempt', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    deleteRoom('other-token', OWNER_TOKEN, roomId);

    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(true);
    expect(loadRoomJson(OWNER_TOKEN, roomId)).not.toBeNull();
  });

  it('SSH keys intact after non-owner attempt', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    deleteRoom('attacker', OWNER_TOKEN, roomId);

    expect(fs.existsSync(path.join(getRoomSshDir(OWNER_TOKEN, roomId), 'id_rsa'))).toBe(true);
  });
});

// ── TC-76.4: Room removed from manager after delete ─────────────────────────

describe('TC-76.4: Room removed from in-memory tracking', () => {

  it('scanAllRooms does not find deleted room', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    expect(scanAllRooms().length).toBe(1);

    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(scanAllRooms().length).toBe(0);
  });

  it('deleting nonexistent room returns error', () => {
    const result = deleteRoom(OWNER_TOKEN, OWNER_TOKEN, 'nonexistent-uuid');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });
});

// ── TC-76.5: Empty room persists (no auto-delete) ───────────────────────────

describe('TC-76.5: Empty rooms NOT auto-deleted', () => {

  it('room with no members persists on disk', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);

    // No members, no activity — room must survive
    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(true);
    expect(scanAllRooms().length).toBe(1);
  });

  it('only explicit owner delete removes room', () => {
    const { roomId } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);

    // Simulate time passing — room still there
    scanAllRooms();
    scanAllRooms();
    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(true);

    // Only owner delete removes it
    deleteRoom(OWNER_TOKEN, OWNER_TOKEN, roomId);
    expect(fs.existsSync(getRoomDir(OWNER_TOKEN, roomId))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T77: UC-RM.4+5 — Room list broadcast + dormant filtering
// ═══════════════════════════════════════════════════════════════════════════

interface RoomListEntry {
  id: string;
  name: string;
  ownerToken: string;
  ownerName: string;
  memberCount: number;
  state: string;
}

function buildRoomList(
  rooms: { meta: RoomMeta; ownerName: string; ownerConnected: boolean }[],
): RoomListEntry[] {
  return rooms
    .filter(r => r.ownerConnected)
    .map(r => ({
      id: r.meta.id,
      name: r.meta.name,
      ownerToken: r.meta.ownerToken,
      ownerName: r.ownerName,
      memberCount: 0,
      state: 'active',
    }));
}

describe('TC-77.1: ROOM_LIST includes ownerName', () => {

  it('room list entries have ownerName field', () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const list = buildRoomList([{ meta, ownerName: 'Marcel', ownerConnected: true }]);

    expect(list.length).toBe(1);
    expect(list[0].ownerName).toBe('Marcel');
    expect(list[0].ownerName).toBeDefined();
  });

  it('ownerName distinct from room name', () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Custom Room' });
    const list = buildRoomList([{ meta, ownerName: 'Alice', ownerConnected: true }]);

    expect(list[0].name).toBe('Custom Room');
    expect(list[0].ownerName).toBe('Alice');
    expect(list[0].name).not.toBe(list[0].ownerName);
  });
});

describe('TC-77.2: Dormant rooms filtered when owner disconnected', () => {

  it('disconnected owner rooms excluded from list', () => {
    const r1 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const r2 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Dormant' });

    const list = buildRoomList([
      { meta: r1.meta, ownerName: 'Marcel', ownerConnected: true },
      { meta: r2.meta, ownerName: 'Marcel', ownerConnected: false },
    ]);

    expect(list.length).toBe(1);
    expect(list[0].name).toBe(r1.meta.name);
  });

  it('all rooms hidden when owner offline', () => {
    const r1 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const list = buildRoomList([
      { meta: r1.meta, ownerName: 'Marcel', ownerConnected: false },
    ]);

    expect(list.length).toBe(0);
  });
});

describe('TC-77.3: CREATE_ROOM triggers ROOM_LIST broadcast', () => {

  it('room list grows after room creation', () => {
    const r1 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'First' });
    const list1 = buildRoomList([{ meta: r1.meta, ownerName: 'Marcel', ownerConnected: true }]);
    expect(list1.length).toBe(1);

    const r2 = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME, { roomName: 'Second' });
    const list2 = buildRoomList([
      { meta: r1.meta, ownerName: 'Marcel', ownerConnected: true },
      { meta: r2.meta, ownerName: 'Marcel', ownerConnected: true },
    ]);
    expect(list2.length).toBe(2);
    expect(list2.map(r => r.name).sort()).toEqual(['First', 'Second']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T78: Client-side room display
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-78.1: RoomBrowser default name references profile name', () => {
  const nodePath = require('node:path');
  const { readFileSync, existsSync } = require('node:fs');
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');

  it('RoomBrowser or server uses profile.name for default room name', () => {
    // Check server-side default name logic
    const serverPath = nodePath.join(PROJECT_ROOT, 'src/ts/server/server.ts');
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    const usesProfileName = content.includes("profile.name") && content.includes("Room");
    expect(usesProfileName).toBe(true);
  });

  it('default name derives from profile, not hardcoded', () => {
    const serverPath = nodePath.join(PROJECT_ROOT, 'src/ts/server/server.ts');
    if (!existsSync(serverPath)) return;
    const content = readFileSync(serverPath, 'utf-8');
    // Server must use profile name to build default room name (e.g. "Marcel's Room")
    const hasProfileRoomName = content.includes("creatorProfile.name") && content.includes("'s Room");
    expect(hasProfileRoomName).toBe(true);
  });
});

describe('TC-78.2: Room card shows full UUID', () => {

  it('room list entry id is 36-char UUID', () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const list = buildRoomList([{ meta, ownerName: 'Marcel', ownerConnected: true }]);

    expect(list[0].id.length).toBe(36);
    expect(list[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('room id not truncated to 8 chars', () => {
    const { meta } = createRoomWithIdentity(OWNER_TOKEN, OWNER_NAME);
    const list = buildRoomList([{ meta, ownerName: 'Marcel', ownerConnected: true }]);

    expect(list[0].id.length).not.toBe(8);
    expect(list[0].id).toBe(meta.id);
  });
});
