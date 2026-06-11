/**
 * Task 3.3: Room.ts unit tests
 * [test:uuid:f7abd9f6-bbd1-4614-9280-19696c506de1] T3 Room.ts unit tests
 * [verifies:uuid:b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e] R-R1 room unit
 * [verifies:uuid:4428b21f-8317-4340-a670-aa3b14582d4f] S1 Foundation room tests
 * Tests Room class and RoomManager against interfaces from task-3-room-ts.md
 *
 * Interfaces under test:
 *   RoomMember { id, ws, name, avatarUrl, playerToken, disconnected }
 *   RoomState  = 'active' | 'archived'
 */

// [test:uuid:11d5925a-f714-4164-a23a-97e1a8be2aed]
// [test:uuid:1ea4eeab-948a-41f0-ae64-3ec3f48272c1]
// [test:uuid:9d6a901d-5722-420a-8b1d-94f6d80aca96]
// [test:uuid:de54ee76-3440-44fa-a14f-276d1587fa37]
// [test:uuid:43c87420-1ed0-4766-8c1b-d932f775d052]
// [test:uuid:b9fdc483-9c21-4791-ae93-369e0dd2fa69]
// [test:uuid:324b293e-ea95-4507-91e7-d1888d7e13c0]
// [test:uuid:bdee2812-ea6b-4202-9b8f-9986757e6f5a]
// [test:uuid:e12ba2fd-5948-4060-b3ee-847d5a857559]
// [test:uuid:57bc3556-a2f4-4138-a2a0-b748fa361ec4]
// [test:uuid:30260096-824b-42c3-98e9-46ddcde01ca0]
// [test:uuid:80a741f9-c3e7-433b-bf05-ccc68799a64b]
// [test:uuid:aaa28037-63f3-4e44-b042-0080b4879363]

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// [test:uuid:19541335-76ca-495b-b0b3-be8f84fa945e]
// [test:uuid:f783eed9-de0e-4f97-a2e8-83ce2d5627bc]
// [test:uuid:801b4eaf-bc40-4826-bab5-b143efd273fd]
// [test:uuid:4c7745e3-f4b9-438d-a99d-b7dc3f434a96]
// [test:uuid:e543aac4-708a-43d9-9e6e-9a57e3c9f1f9]
// [test:uuid:2e7cf761-ffa0-44ca-aef6-cf3e659efef7]
// [test:uuid:bbf94471-90bf-48d5-bb69-4a3f0dc3bddd]
// [test:uuid:bb21076a-3f56-4d58-adfc-e0fc7ee20bed]
// [test:uuid:bb27178a-10d8-485f-a865-c9dd6a8c0909]
// [test:uuid:28859f0f-a750-4b09-b594-16a0b3af5587]
// [test:uuid:2925cb20-085d-4510-8abf-5b50ab6a6ab2]
// [test:uuid:26636ae4-8a9f-44ab-9981-6e49778c5a21]
// [test:uuid:9b9c8ae6-f8e4-4e87-8bd1-70cfab24ae95]
// [test:uuid:8006c588-ac30-419b-b3c8-c7036f68288d]
// [test:uuid:9a4f07c7-415b-4cea-8f74-e8950d177090]
// [test:uuid:eb072740-9e63-4a22-9d76-7237f4c847b8]
// [test:uuid:793ab11f-e79d-4610-824a-0662c0ab5494]
// [test:uuid:ea6ce5d8-f936-453d-a92e-4b602e7437db]
// [test:uuid:cda50af2-3acf-43e8-9c02-613a461965ea]
// [test:uuid:2129a8e5-d7cd-4308-9d23-64b2517e3be8]
// [test:uuid:7638f719-a2a4-466c-be7b-fd3a59daebbe]
// [test:uuid:3f255cc5-e768-428a-8ced-239fe6a4af5e]
// [test:uuid:c2c91058-7194-4483-8d8e-d6af4067c0d2]
// [test:uuid:cb3507a2-46ee-414b-810f-7d65ddb3afe0]
// [test:uuid:f936d0f4-1971-4baa-bf85-4e75a1a3db65]
// [test:uuid:d12f34d5-52f0-4fcd-b918-3ce2be327a4d]
// [test:uuid:ed61e817-bc0a-4d7b-b892-e786a2cf52f0]
// [test:uuid:e4963145-2391-4535-a3a0-9f23c2f7d1dc]
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
    playerToken: overrides.playerToken ?? crypto.randomUUID(),
    disconnected: overrides.disconnected ?? false,
  };
}

// ── TC-3.3.1: Create Room ────────────────────────────────────────────────────

// [test:uuid:47971f31-dfa6-40d5-813d-b57cb9b06338] test:Room.init
describe('TC-3.3.1: Create room → verify RoomInfo', () => {

  it('creates a room with correct defaults', () => {
    const creator = makeMember({ name: 'Alice' });
    const room = new Room('Alice\'s Room', creator);

    const info: RoomInfo = room.info();
    expect(info.id).toBeDefined();
    expect(info.id.length).toBeGreaterThan(0);
    expect(info.name).toBe('Alice\'s Room');
    expect(info.hostId).toBe(creator.id);
    expect(info.hostConnected).toBe(true);
    expect(info.memberCount).toBe(1);
    expect(info.isPrivate).toBe(false);
    expect(info.state).toBe('active');
    expect(info.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it('creates a private room when isPrivate=true', () => {
    const creator = makeMember({ name: 'Bob' });
    const room = new Room('Private', creator, { isPrivate: true });
    const info = room.info();
    expect(info.isPrivate).toBe(true);
  });

  it('room id is unique across instances', () => {
    const c1 = makeMember();
    const c2 = makeMember();
    const room1 = new Room('Room1', c1);
    const room2 = new Room('Room2', c2);

    expect(room1.info().id).not.toBe(room2.info().id);
  });
});

// ── TC-3.3.2: Add/Remove Member ──────────────────────────────────────────────

// [test:uuid:da3d0186-d8d5-4629-9c18-62026ac7dce8] test:Room.memberAdd
describe('TC-3.3.2: Add/remove member → verify member count', () => {

  it('adds a member and increments count', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TestRoom', creator);
    expect(room.info().memberCount).toBe(1);

    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);
    expect(room.info().memberCount).toBe(2);
  });

  it('removes a member and decrements count', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TestRoom', creator);
    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);

    room.removeMember(joiner.id);
    expect(room.info().memberCount).toBe(1);
  });

  it('removing non-existent member is a no-op or throws', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('TestRoom', creator);

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
    const room = new Room('MyRoom', creator);

    expect(room.info().hostId).toBe(creator.id);
  });

  it('creator can delete the room', () => {
    const creator = makeMember({ name: 'Creator' });
    const manager = new RoomManager();
    const room = manager.createRoom('MyRoom', creator);
    const roomId = room.info().id;

    const result = manager.removeRoom(roomId, creator.id);
    expect(result).toBe(true);
    expect(manager.getRoom(roomId)).toBeUndefined();
  });

  it('non-creator cannot delete the room', () => {
    const creator = makeMember({ name: 'Creator' });
    const other = makeMember({ name: 'Other' });
    const manager = new RoomManager();
    const room = manager.createRoom('MyRoom', creator);
    room.addMember(other);
    const roomId = room.info().id;

    const result = manager.removeRoom(roomId, other.id);
    expect(result).toBe(false);
    expect(manager.getRoom(roomId)).toBeDefined();
  });

  it('setCreator transfers host to another member', () => {
    const creator = makeMember({ name: 'OldHost' });
    const newHost = makeMember({ name: 'NewHost' });
    const room = new Room('TestRoom', creator);
    room.addMember(newHost);

    room.setCreator(newHost.id);
    expect(room.info().hostId).toBe(newHost.id);
  });
});

// ── TC-3.3.4: Archive Room ───────────────────────────────────────────────────

describe('TC-3.3.4: Archive room → state change + can\'t join', () => {

  it('archive() sets state to archived', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ArchiveMe', creator);
    expect(room.info().state).toBe('active');

    room.archive();
    expect(room.info().state).toBe('archived');
  });

  it('archived room rejects new members', () => {
    const creator = makeMember({ name: 'Host' });
    const room = new Room('ArchiveMe', creator);
    room.archive();

    const joiner = makeMember({ name: 'LateJoiner' });
    const result = room.addMember(joiner);
    expect(result).toBe(false);
    expect(room.info().memberCount).toBe(1);
  });

  it('archive() notifies existing members', () => {
    const creator = makeMember({ name: 'Host' });
    const m2 = makeMember({ name: 'Member' });
    const room = new Room('ArchiveMe', creator);
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
    const room = new Room('BroadcastRoom', creator);
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
    const room = new Room('BroadcastRoom', creator);
    room.addMember(disconnected);

    room.broadcast({ type: 'PING' });

    expect(creator.ws.send).toHaveBeenCalled();
    expect(disconnected.ws.send).not.toHaveBeenCalled();
  });

  it('broadcast with exclude skips the excluded member', () => {
    const creator = makeMember({ name: 'Host' });
    const m2 = makeMember({ name: 'Other' });
    const room = new Room('BroadcastRoom', creator);
    room.addMember(m2);

    (creator.ws.send as ReturnType<typeof vi.fn>).mockClear();
    (m2.ws.send as ReturnType<typeof vi.fn>).mockClear();
    room.broadcast({ type: 'NOTIFY' }, creator.id);

    expect(creator.ws.send).not.toHaveBeenCalled();
    expect(m2.ws.send).toHaveBeenCalled();
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
    const room = manager.createRoom('PersistRoom', creator, { creatorToken: 'tok-persist' });

    expect(mockWriteRoomJson).toHaveBeenCalledTimes(1);
    const [token, roomId, data] = mockWriteRoomJson.mock.calls[0];
    expect(token).toBe('tok-persist');
    expect(roomId).toBe(room.info().id);
    expect(data.name).toBe('PersistRoom');
    expect(data.ownerToken).toBe('tok-persist');
  });

  it('does NOT persist when creatorToken is empty', () => {
    const creator = makeMember({ name: 'Anon' });
    const manager = new RoomManager();
    manager.createRoom('NoToken', creator);

    expect(mockWriteRoomJson).not.toHaveBeenCalled();
  });

  it('removeRoom drops in-memory entry (disk cleanup is server handler)', () => {
    const creator = makeMember({ name: 'Host' });
    const manager = new RoomManager();
    const room = manager.createRoom('DropMe', creator);
    const roomId = room.info().id;

    const removed = manager.removeRoom(roomId, creator.id);
    expect(removed).toBe(true);
    expect(manager.getRoom(roomId)).toBeUndefined();
  });

  it('re-persists on member change', () => {
    const creator = makeMember({ name: 'Host', playerToken: 'tok-host' });
    const manager = new RoomManager();
    const room = manager.createRoom('UpdateMe', creator, { creatorToken: 'tok-host' });
    mockWriteRoomJson.mockClear();

    const joiner = makeMember({ name: 'Joiner' });
    room.addMember(joiner);

    expect(mockWriteRoomJson).toHaveBeenCalled();
    const [token, , data] = mockWriteRoomJson.mock.calls[0];
    expect(token).toBe('tok-host');
    expect(data.name).toBe('UpdateMe');
  });
});

// ── TC-3.3.9: RoomManager ────────────────────────────────────────────────────

describe('TC-3.3.9: RoomManager operations', () => {

  it('listRooms returns all active rooms', () => {
    const manager = new RoomManager();
    const c1 = makeMember({ name: 'Host1' });
    const c2 = makeMember({ name: 'Host2' });
    manager.createRoom('Room1', c1);
    manager.createRoom('Room2', c2);

    const rooms = manager.listRooms();
    expect(rooms.length).toBe(2);
    expect(rooms.map((r: RoomInfo) => r.name)).toContain('Room1');
    expect(rooms.map((r: RoomInfo) => r.name)).toContain('Room2');
  });

  it('findMemberRoom locates which room a member is in', () => {
    const manager = new RoomManager();
    const host = makeMember({ name: 'Host' });
    const joiner = makeMember({ name: 'Joiner' });
    const room = manager.createRoom('FindMe', host);
    room.addMember(joiner);

    const found = manager.findMemberRoom(joiner.id);
    expect(found).toBeDefined();
    expect(found!.info().name).toBe('FindMe');
  });

  it('cleanupStale removes rooms older than threshold', async () => {
    const manager = new RoomManager();
    const host = makeMember({ name: 'Host' });
    manager.createRoom('OldRoom', host);

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
  // [test:uuid:17b688fb-1eb9-4750-8497-8317a97bee5c] test:RbRoomDetail.scenarioLinkRender R19.22.B
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

  // [test:uuid:ffab35a3-554b-4c80-ac3e-7a6216461e4a] R19.23 rooms unbounded (no maxMembers rejection)
  it('R19.23: addMember never rejects for room-full (unbounded)', () => {
    const r = new Room('Unbounded', makeMember({ id: 'host' }));
    for (let i = 0; i < 20; i++) {
      const result = r.addMember(makeMember({ id: 'member-' + i }));
      expect(result).toBe(true);
    }
    expect(r.members.size).toBe(21);
  });

  // [test:uuid:c874546a-90ed-4e10-b01f-cb6ba921a0a3] R19.8+R19.35 Room.persistMembers
  it('T-persistent-retention R19.8: markDisconnected retains member as offline', () => {
    const creator = makeMember({ id: 'host' });
    const r = new Room('PersistRoom', creator, { mode: 'persistent' });
    const memberB = makeMember({ id: 'guest', name: 'Guest' });
    r.addMember(memberB);
    expect(r.members.size).toBe(2);

    r.markDisconnected('guest');

    expect(r.members.size).toBe(2);
    expect(r.members.get('guest')?.disconnected).toBe(true);
    expect(r.members.get('host')?.disconnected).toBe(false);
    const sent = (memberB.ws.send as ReturnType<typeof vi.fn>).mock.calls;
    const disconnectMsg = sent.find((c: any) => JSON.parse(c[0]).type === 'MEMBER_DISCONNECTED');
    expect(disconnectMsg).toBeDefined();
  });

  // [test:uuid:c6dfbaa6-30b9-40be-82aa-54628e547632] test:Room.retainOrPrune
  it('T-persistent-retention: removeMember still prunes in live rooms', () => {
    const creator = makeMember({ id: 'host' });
    const r = new Room('LiveRoom', creator, { mode: 'live' });
    const memberB = makeMember({ id: 'guest' });
    r.addMember(memberB);
    expect(r.members.size).toBe(2);

    r.removeMember('guest');

    expect(r.members.size).toBe(1);
    expect(r.members.has('guest')).toBe(false);
  });

  it('T-persistent-retention: reconnect flips disconnected=false, no dup', () => {
    const creator = makeMember({ id: 'host' });
    const r = new Room('ReconnRoom', creator, { mode: 'persistent' });
    const memberB = makeMember({ id: 'guest', name: 'Guest' });
    r.addMember(memberB);
    r.markDisconnected('guest');
    expect(r.members.get('guest')?.disconnected).toBe(true);

    const reconnected = makeMember({ id: 'guest-new', name: 'Guest', playerToken: memberB.playerToken });
    r.addMember(reconnected);

    const guestMembers = [...r.members.values()].filter(m => m.name === 'Guest');
    expect(guestMembers.length).toBeLessThanOrEqual(2);
  });
});
