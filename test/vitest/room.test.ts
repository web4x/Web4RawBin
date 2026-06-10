/**
 * Task 3.3: Room.ts unit tests
 * [test:uuid:f7abd9f6-bbd1-4614-9280-19696c506de1] T3 Room.ts unit tests
 * [verifies:uuid:b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e] R-R1 room unit
 * [verifies:uuid:4428b21f-8317-4340-a670-aa3b14582d4f] S1 Foundation room tests
 * Tests Room class and RoomManager against interfaces from task-3-room-ts.md
 *
 * Interfaces under test:
 *   RoomMember { id, ws, name, avatarUrl, playerToken, disconnected }
 *   RoomInfo   { id, name, hostId, hostConnected, memberCount, maxMembers, isPrivate, state, createdAt }
 *   RoomState  = 'active' | 'archived'
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Room, RoomManager } from '../../src/ts/server/Room.js';
import type { RoomMember, RoomInfo } from '../../src/ts/server/Room.js';
import { WebSocket } from 'ws';

function mockWs(open = true): WebSocket {
  return {
    send: vi.fn(),
    readyState: open ? 1 : 3,
    close: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as WebSocket;
}

function makeMember(overrides: Partial<RoomMember> = {}): RoomMember {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    ws: overrides.ws ?? mockWs(),
    name: overrides.name ?? 'TestUser',
    avatarUrl: overrides.avatarUrl ?? '',
    playerToken: overrides.playerToken ?? `token-${Date.now()}`,
    disconnected: overrides.disconnected ?? false,
  };
}

// ── TC-3.3.1: Create Room ────────────────────────────────────────────────────

describe('TC-3.3.1: Create room → verify RoomInfo', () => {

  it('creates a room with correct defaults', () => {
    const creator = makeMember({ name: 'Alice' });
    const room = new Room('Alice\'s Room', creator, { maxMembers: 6 });

    const info: RoomInfo = room.info();
    expect(info.id).toBeDefined();
    expect(info.id.length).toBeGreaterThan(0);
    expect(info.name).toBe('Alice\'s Room');
    expect(info.hostId).toBe(creator.id);
    expect(info.hostConnected).toBe(true);
    expect(info.memberCount).toBe(1);
    expect(info.maxMembers).toBe(6);
    expect(info.isPrivate).toBe(false);
    expect(info.state).toBe('active');
    expect(info.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it('creates a private room when isPrivate=true', () => {
    const creator = makeMember({ name: 'Bob' });
    const room = new Room('Secret Room', creator, { maxMembers: 4, isPrivate: true });

    const info = room.info();
    expect(info.isPrivate).toBe(true);
  });

  it('room id is unique across instances', () => {
    const c1 = makeMember();
    const c2 = makeMember();
    const room1 = new Room('Room1', c1, { maxMembers: 4 });
    const room2 = new Room('Room2', c2, { maxMembers: 4 });

    expect(room1.info().id).not.toBe(room2.info().id);
  });
});

// ── TC-3.3.2: Add/Remove Member ──────────────────────────────────────────────

describe('TC-3.3.2: Add/remove member → verify member count', () => {

  it('adds a member and increments count', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TestRoom', creator, { maxMembers: 4 });
    expect(room.info().memberCount).toBe(1);

    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);
    expect(room.info().memberCount).toBe(2);
  });

  it('removes a member and decrements count', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TestRoom', creator, { maxMembers: 4 });
    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);

    room.removeMember(joiner.id);
    expect(room.info().memberCount).toBe(1);
  });

  it('rejects add when room is full', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TinyRoom', creator, { maxMembers: 2 });
    const m2 = makeMember({ name: 'Second' });
    room.addMember(m2);
    expect(room.info().memberCount).toBe(2);

    const m3 = makeMember({ name: 'Third' });
    const result = room.addMember(m3);
    expect(result).toBe(false);
    expect(room.info().memberCount).toBe(2);
  });

  it('removing non-existent member is a no-op or throws', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TestRoom', creator, { maxMembers: 4 });

    // Either no-op or throws — both acceptable, just shouldn't crash unhandled
    try {
      room.removeMember('nonexistent-id');
      expect(room.info().memberCount).toBe(1);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

// ── TC-3.3.3: Creator Lifecycle ──────────────────────────────────────────────

describe('TC-3.3.3: Creator lifecycle → only creator can delete', () => {

  it('creator is the host on room creation', () => {
    const creator = makeMember({ name: 'Creator' });
    const room = new Room('MyRoom', creator, { maxMembers: 4 });

    expect(room.info().hostId).toBe(creator.id);
  });

  it('creator can delete the room', () => {
    const creator = makeMember({ name: 'Creator' });
    const manager = new RoomManager();
    const room = manager.createRoom('MyRoom', creator, { maxMembers: 4 });
    const roomId = room.info().id;

    const result = manager.removeRoom(roomId, creator.id);
    expect(result).toBe(true);
    expect(manager.getRoom(roomId)).toBeUndefined();
  });

  it('non-creator cannot delete the room', () => {
    const creator = makeMember({ name: 'Creator' });
    const other = makeMember({ name: 'Other' });
    const manager = new RoomManager();
    const room = manager.createRoom('MyRoom', creator, { maxMembers: 4 });
    room.addMember(other);
    const roomId = room.info().id;

    const result = manager.removeRoom(roomId, other.id);
    expect(result).toBe(false);
    expect(manager.getRoom(roomId)).toBeDefined();
  });

  it('setCreator transfers host to another member', () => {
    const creator = makeMember({ name: 'OldHost' });
    const newHost = makeMember({ name: 'NewHost' });
    const room = new Room('TestRoom', creator, { maxMembers: 4 });
    room.addMember(newHost);

    room.setCreator(newHost.id);
    expect(room.info().hostId).toBe(newHost.id);
  });
});

// ── TC-3.3.4: Archive Room ───────────────────────────────────────────────────

describe('TC-3.3.4: Archive room → state change + can\'t join', () => {

  it('archive() sets state to archived', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ArchiveMe', creator, { maxMembers: 4 });
    expect(room.info().state).toBe('active');

    room.archive();
    expect(room.info().state).toBe('archived');
  });

  it('archived room rejects new members', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ArchiveMe', creator, { maxMembers: 4 });
    room.archive();

    const joiner = makeMember({ name: 'LateJoiner' });
    const result = room.addMember(joiner);
    expect(result).toBe(false);
    expect(room.info().memberCount).toBe(1);
  });

  it('archive() notifies existing members', () => {
    const creator = makeMember({ name: 'Host' });
    const m2 = makeMember({ name: 'Member' });
    const room = new Room('ArchiveMe', creator, { maxMembers: 4 });
    room.addMember(m2);

    room.archive();

    expect(creator.ws.send).toHaveBeenCalled();
    expect(m2.ws.send).toHaveBeenCalled();

    const lastCallCreator = (creator.ws.send as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
    const parsed = JSON.parse(lastCallCreator as string);
    expect(parsed.type).toMatch(/ROOM_ARCHIVED|ROOM_STATE/);
  });
});

// ── TC-3.3.5: Broadcast ─────────────────────────────────────────────────────

describe('TC-3.3.5: Broadcast → all members receive message', () => {

  it('broadcast sends to all connected members', () => {
    const creator = makeMember({ name: 'Host' });
    const m2 = makeMember({ name: 'Alice' });
    const m3 = makeMember({ name: 'Bob' });
    const room = new Room('BroadcastRoom', creator, { maxMembers: 4 });
    room.addMember(m2);
    room.addMember(m3);

    room.broadcast({ type: 'TEST_MSG', data: 'hello' });

    expect(creator.ws.send).toHaveBeenCalled();
    expect(m2.ws.send).toHaveBeenCalled();
    expect(m3.ws.send).toHaveBeenCalled();

    const sent = JSON.parse((creator.ws.send as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as string);
    expect(sent.type).toBe('TEST_MSG');
    expect(sent.data).toBe('hello');
  });

  it('broadcast skips disconnected members (readyState !== 1)', () => {
    const creator = makeMember({ name: 'Host' });
    const disconnected = makeMember({ name: 'Ghost', ws: mockWs(false) });
    const room = new Room('BroadcastRoom', creator, { maxMembers: 4 });
    room.addMember(disconnected);

    room.broadcast({ type: 'PING' });

    expect(creator.ws.send).toHaveBeenCalled();
    expect(disconnected.ws.send).not.toHaveBeenCalled();
  });

  it('broadcast with exclude skips the excluded member', () => {
    const creator = makeMember({ name: 'Host' });
    const m2 = makeMember({ name: 'Other' });
    const room = new Room('BroadcastRoom', creator, { maxMembers: 4 });
    room.addMember(m2);

    (creator.ws.send as ReturnType<typeof vi.fn>).mockClear();
    (m2.ws.send as ReturnType<typeof vi.fn>).mockClear();
    room.broadcast({ type: 'NOTIFY' }, creator.id);

    expect(creator.ws.send).not.toHaveBeenCalled();
    expect(m2.ws.send).toHaveBeenCalled();
  });
});

// ── TC-3.3.6: Chat ───────────────────────────────────────────────────────────

describe('TC-3.3.6: Chat → chatHistory append + limit', () => {

  it('chat message appends to chatHistory', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    room.addChat(creator.id, creator.name, 'Hello world');
    room.addChat(creator.id, creator.name, 'Second message');

    const history = room.getChatHistory();
    expect(history.length).toBe(2);
    expect(history[0].text).toBe('Hello world');
    expect(history[1].text).toBe('Second message');
  });

  it('chat message includes sender name and timestamp', () => {
    const creator = makeMember({ name: 'Alice' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    room.addChat(creator.id, creator.name, 'Hi');

    const msg = room.getChatHistory()[0];
    expect(msg.senderName).toBe('Alice');
    expect(msg.timestamp).toBeDefined();
    expect(msg.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('chat history respects max limit', () => {
    const creator = makeMember({ name: 'Spammer' });
    const room = new Room('ChatRoom', creator, { maxMembers: 4 });

    for (let i = 0; i < 200; i++) {
      room.addChat(creator.id, creator.name, `msg-${i}`);
    }

    const history = room.getChatHistory();
    expect(history.length).toBeLessThanOrEqual(100);
    // Most recent messages should be kept
    expect(history[history.length - 1].text).toBe('msg-199');
  });
});

// ── TC-3.3.7: Per-user persistence (T99 — replaces legacy data/rooms) ───────

vi.mock('../../src/ts/server/RoomKeys.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/ts/server/RoomKeys.js')>();
  return { ...orig, writeRoomJson: vi.fn(), getRoomPublicKey: vi.fn(() => '') };
});
import { writeRoomJson, getRoomPublicKey } from '../../src/ts/server/RoomKeys.js';
const mockWriteRoomJson = vi.mocked(writeRoomJson);
const mockGetRoomPublicKey = vi.mocked(getRoomPublicKey);

describe('TC-3.3.7: Per-user persistence (T99)', () => {

  beforeEach(() => { mockWriteRoomJson.mockClear(); mockGetRoomPublicKey.mockClear(); });

  it('persists to per-user dir on create when creatorToken is set', () => {
    const creator = makeMember({ name: 'Persist', playerToken: 'tok-persist' });
    const manager = new RoomManager();
    const room = manager.createRoom('PersistRoom', creator, { maxMembers: 4, creatorToken: 'tok-persist' });

    expect(mockWriteRoomJson).toHaveBeenCalledTimes(1);
    const [token, roomId, data] = mockWriteRoomJson.mock.calls[0];
    expect(token).toBe('tok-persist');
    expect(roomId).toBe(room.info().id);
    expect(data.name).toBe('PersistRoom');
    expect(data.ownerToken).toBe('tok-persist');
    expect(data.maxMembers).toBe(4);
  });

  it('does NOT persist when creatorToken is empty', () => {
    const creator = makeMember({ name: 'Anon' });
    const manager = new RoomManager();
    manager.createRoom('NoToken', creator, { maxMembers: 4 });

    expect(mockWriteRoomJson).not.toHaveBeenCalled();
  });

  it('removeRoom drops in-memory entry (disk cleanup is server handler)', () => {
    const creator = makeMember({ name: 'Host' });
    const manager = new RoomManager();
    const room = manager.createRoom('DeleteMe', creator, { maxMembers: 4, creatorToken: 'tok-del' });
    const roomId = room.info().id;

    const removed = manager.removeRoom(roomId, creator.id);
    expect(removed).toBe(true);
    expect(manager.getRoom(roomId)).toBeUndefined();
  });

  it('re-persists on member change', () => {
    const creator = makeMember({ name: 'Host', playerToken: 'tok-host' });
    const manager = new RoomManager();
    const room = manager.createRoom('UpdateMe', creator, { maxMembers: 4, creatorToken: 'tok-host' });
    mockWriteRoomJson.mockClear();

    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);

    expect(mockWriteRoomJson).toHaveBeenCalled();
    const [token, , data] = mockWriteRoomJson.mock.calls[0];
    expect(token).toBe('tok-host');
    expect(data.name).toBe('UpdateMe');
  });
});

// ── TC-3.3.8: Spectator ─────────────────────────────────────────────────────

describe('TC-3.3.8: Spectator → add/remove/promote', () => {

  it('adds a spectator without increasing member count', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('SpecRoom', creator, { maxMembers: 4 });
    const spec = makeMember({ name: 'Watcher' });

    room.addSpectator(spec);
    expect(room.info().memberCount).toBe(1);
  });

  it('spectator receives broadcasts', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('SpecRoom', creator, { maxMembers: 4 });
    const spec = makeMember({ name: 'Watcher' });
    room.addSpectator(spec);

    room.broadcast({ type: 'SPEC_TEST' });

    expect(spec.ws.send).toHaveBeenCalled();
  });

  it('removes a spectator', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('SpecRoom', creator, { maxMembers: 4 });
    const spec = makeMember({ name: 'Watcher' });
    room.addSpectator(spec);

    room.removeSpectator(spec.id);

    // After removal, spectator should not receive broadcasts
    (spec.ws.send as ReturnType<typeof vi.fn>).mockClear();
    room.broadcast({ type: 'AFTER_REMOVE' });
    expect(spec.ws.send).not.toHaveBeenCalled();
  });

  it('promotes spectator to member', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('SpecRoom', creator, { maxMembers: 4 });
    const spec = makeMember({ name: 'PromoteMe' });
    room.addSpectator(spec);

    expect(room.info().memberCount).toBe(1);
    room.promoteSpectator(spec.id);
    expect(room.info().memberCount).toBe(2);
  });

  it('promote fails if room is full', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TinyRoom', creator, { maxMembers: 2 });
    const m2 = makeMember({ name: 'Second' });
    room.addMember(m2);

    const spec = makeMember({ name: 'PromoteMe' });
    room.addSpectator(spec);

    const result = room.promoteSpectator(spec.id);
    expect(result).toBe(false);
    expect(room.info().memberCount).toBe(2);
  });
});

// ── TC-3.3.9: RoomManager ────────────────────────────────────────────────────

describe('TC-3.3.9: RoomManager operations', () => {

  it('listRooms returns all active rooms', () => {
    const manager = new RoomManager();
    const c1 = makeMember({ name: 'Host1' });
    const c2 = makeMember({ name: 'Host2' });
    manager.createRoom('Room1', c1, { maxMembers: 4 });
    manager.createRoom('Room2', c2, { maxMembers: 4 });

    const rooms = manager.listRooms();
    expect(rooms.length).toBe(2);
    expect(rooms.map((r: RoomInfo) => r.name)).toContain('Room1');
    expect(rooms.map((r: RoomInfo) => r.name)).toContain('Room2');
  });

  it('findMemberRoom locates which room a member is in', () => {
    const manager = new RoomManager();
    const host = makeMember({ name: 'Host' });
    const joiner = makeMember({ name: 'Joiner' });
    const room = manager.createRoom('FindMe', host, { maxMembers: 4 });
    room.addMember(joiner);

    const found = manager.findMemberRoom(joiner.id);
    expect(found).toBeDefined();
    expect(found!.info().name).toBe('FindMe');
  });

  it('findSpectatorRoom locates which room a spectator is in', () => {
    const manager = new RoomManager();
    const host = makeMember({ name: 'Host' });
    const spec = makeMember({ name: 'Watcher' });
    const room = manager.createRoom('SpecFind', host, { maxMembers: 4 });
    room.addSpectator(spec);

    const found = manager.findSpectatorRoom(spec.id);
    expect(found).toBeDefined();
    expect(found!.info().name).toBe('SpecFind');
  });

  it('cleanupStale removes rooms older than threshold', async () => {
    const manager = new RoomManager();
    const host = makeMember({ name: 'Host' });
    manager.createRoom('OldRoom', host, { maxMembers: 4 });

    // Cleanup with 0ms threshold should remove all
    const removed = manager.cleanupStale(0);
    expect(removed).toBe(1);
    expect(manager.listRooms().length).toBe(0);
  });
});

describe('S19 — visibility + mode (T-visibility/T-persistent/T-default-flip)', () => {
  it('T-default-flip R19.10: new room defaults to mode=persistent', () => {
    const r = new Room('r1', makeMember({ id: 'a' }));
    expect(r.mode).toBe('persistent');
    expect(r.info().mode).toBe('persistent');
  });
  it('T-visibility R19.3: setVisibility switches visibility and syncs isPrivate', () => {
    const r = new Room('r2', makeMember({ id: 'a' }));
    expect(r.visibility).toBe('public');
    r.setVisibility('by-invite');
    expect(r.visibility).toBe('by-invite');
    expect(r.isPrivate).toBe(false);
    r.setVisibility('private');
    expect(r.visibility).toBe('private');
    expect(r.isPrivate).toBe(true);
  });
  it('T-persistent R19.7: setMode switches between live and persistent', () => {
    const r = new Room('r3', makeMember({ id: 'a' }), { mode: 'live' });
    expect(r.mode).toBe('live');
    r.setMode('persistent');
    expect(r.mode).toBe('persistent');
  });
});
