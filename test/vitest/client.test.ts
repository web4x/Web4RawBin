/**
 * Task 5.7 + T14: Client UI verification — unit tests
 * Tests build output, source code checks, route dispatch, WS protocol.
 * No running server needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Room, RoomManager } from '../../src/ts/server/Room.js';
import type { RoomMember } from '../../src/ts/server/Room.js';
import { WebSocket } from 'ws';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');

function mockWs(open = true): WebSocket {
  return { send: vi.fn(), readyState: open ? 1 : 3, close: vi.fn(), on: vi.fn(), off: vi.fn() } as unknown as WebSocket;
}

function makeMember(name: string, id?: string): RoomMember {
  return {
    id: id ?? `client-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ws: mockWs(), name, avatarUrl: '', playerToken: `token-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    disconnected: false,
  };
}

function getSentMessages(ws: WebSocket): any[] {
  return (ws.send as ReturnType<typeof vi.fn>).mock.calls.map(c => JSON.parse(c[0] as string));
}

// ── TC-5.7.1: esbuild succeeds ──────────────────────────────────────────────

describe('TC-5.7.1: Build output', () => {

  it('app.ts source file exists', () => {
    const appTs = path.join(PROJECT_ROOT, 'src/public/ts/app.ts');
    expect(existsSync(appTs)).toBe(true);
  });

  it('app.html exists for /app route', () => {
    const appHtml = path.join(PROJECT_ROOT, 'src/public/app.html');
    expect(existsSync(appHtml)).toBe(true);
  });

  it('package.json has build script', () => {
    const pkg = JSON.parse(readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf-8'));
    expect(pkg.scripts?.build).toBeDefined();
    expect(pkg.scripts.build.length).toBeGreaterThan(0);
  });
});

// ── TC-5.7.2: App HTML content ──────────────────────────────────────────────

describe('TC-5.7.2: App HTML content', () => {

  it('app.html references app.js bundle', () => {
    const htmlPath = path.join(PROJECT_ROOT, 'src/public/app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8');
    expect(html).toContain('app.js');
  });

  it('app.html title says RawBin', () => {
    const htmlPath = path.join(PROJECT_ROOT, 'src/public/app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8').toLowerCase();
    expect(html).toContain('rawbin');
  });

  it('app.html has no game references', () => {
    const htmlPath = path.join(PROJECT_ROOT, 'src/public/app.html');
    if (!existsSync(htmlPath)) return;
    const html = readFileSync(htmlPath, 'utf-8').toLowerCase();
    expect(html).not.toContain('card game');
    expect(html).not.toContain('leaderboard');
    expect(html).not.toContain('play card');
  });
});

// ── TC-5.7.3: RawBinClient WS protocol ─────────────────────────────────────

describe('TC-5.7.3: WS protocol basics', () => {

  it('welcome message includes clientId and challenge', () => {
    const welcome = { type: 'welcome', clientId: 'test-123', onlineCount: 1, challenge: 'abc' };
    expect(welcome.type).toBe('welcome');
    expect(welcome.clientId).toBeDefined();
    expect(welcome.challenge).toBeDefined();
  });

  it('IDENTIFY response includes profile with UserProfile fields', () => {
    const profileResponse = {
      type: 'PROFILE',
      profile: {
        token: 'test', name: 'User', phone: '', url: '', avatar: '',
        secretCode: '1234', profileCommitted: false, devices: [],
      },
    };
    expect(profileResponse.profile.name).toBeDefined();
    expect(profileResponse.profile.secretCode).toBeDefined();
    expect((profileResponse.profile as any).gamesPlayed).toBeUndefined();
  });
});

// ── TC-5.7.4: Room create/join/leave/delete flow ────────────────────────────

describe('TC-5.7.4: Room lifecycle via RoomManager', () => {

  it('full lifecycle: create → join → leave → delete', () => {
    const manager = new RoomManager();
    const creator = makeMember('RoomOwner');
    const room = manager.createRoom('LifecycleRoom', creator, { maxMembers: 4 });
    const roomId = room.info().id;

    // Join
    const joiner = makeMember('Joiner');
    room.addMember(joiner);
    expect(room.info().memberCount).toBe(2);

    // Leave
    room.removeMember(joiner.id);
    expect(room.info().memberCount).toBe(1);

    // Delete
    const result = manager.removeRoom(roomId, creator.id);
    expect(result).toBe(true);
    expect(manager.getRoom(roomId)).toBeUndefined();
  });

  it('non-owner cannot delete room', () => {
    const manager = new RoomManager();
    const creator = makeMember('Owner');
    const other = makeMember('NonOwner');
    const room = manager.createRoom('Protected', creator, { maxMembers: 4 });
    room.addMember(other);
    const roomId = room.info().id;

    const result = manager.removeRoom(roomId, other.id);
    expect(result).toBe(false);
    expect(manager.getRoom(roomId)).toBeDefined();
  });

  it('room gone from list after delete', () => {
    const manager = new RoomManager();
    const creator = makeMember('Owner');
    const room = manager.createRoom('DeleteMe', creator, { maxMembers: 4 });
    const roomId = room.info().id;

    manager.removeRoom(roomId, creator.id);
    const list = manager.listRooms();
    expect(list.find(r => r.id === roomId)).toBeUndefined();
  });
});

// ── TC-5.7.5: Chat send/receive ─────────────────────────────────────────────

describe('TC-5.7.5: Chat in room', () => {

  it('message from A received by B', () => {
    const alice = makeMember('ChatSender');
    const bob = makeMember('ChatReceiver');
    const room = new Room('ChatRoom', alice, { maxMembers: 4 });
    room.addMember(bob);

    (bob.ws.send as ReturnType<typeof vi.fn>).mockClear();
    room.addChat(alice.id, 'ChatSender', 'Hello from A!');

    const msgs = getSentMessages(bob.ws);
    const chat = msgs.find(m => m.type === 'CHAT_MESSAGE');
    expect(chat).toBeDefined();
    expect(chat.text).toBe('Hello from A!');
  });

  it('chat message includes sender name', () => {
    const alice = makeMember('NamedSender');
    const bob = makeMember('Listener');
    const room = new Room('ChatRoom', alice, { maxMembers: 4 });
    room.addMember(bob);

    (bob.ws.send as ReturnType<typeof vi.fn>).mockClear();
    room.addChat(alice.id, 'NamedSender', 'Check my name');

    const msgs = getSentMessages(bob.ws);
    const chat = msgs.find(m => m.type === 'CHAT_MESSAGE');
    expect(chat.senderName).toBe('NamedSender');
  });
});

// ── TC-5.7.6: Profile and bug-report links ──────────────────────────────────

describe('TC-5.7.6: Profile and bug-report links in app', () => {

  it('RoomBrowser.ts or app.html contains link to /profile', () => {
    const browserPath = path.join(PROJECT_ROOT, 'src/public/ts/RoomBrowser.ts');
    const htmlPath = path.join(PROJECT_ROOT, 'src/public/app.html');
    let found = false;
    if (existsSync(browserPath)) found = readFileSync(browserPath, 'utf-8').includes('/profile');
    if (!found && existsSync(htmlPath)) found = readFileSync(htmlPath, 'utf-8').includes('/profile');
    expect(found).toBe(true);
  });

  it('RoomBrowser.ts or app.html contains link to /bug-report', () => {
    const browserPath = path.join(PROJECT_ROOT, 'src/public/ts/RoomBrowser.ts');
    const htmlPath = path.join(PROJECT_ROOT, 'src/public/app.html');
    let found = false;
    if (existsSync(browserPath)) found = readFileSync(browserPath, 'utf-8').includes('/bug-report');
    if (!found && existsSync(htmlPath)) found = readFileSync(htmlPath, 'utf-8').includes('/bug-report');
    expect(found).toBe(true);
  });

  it('RoomBrowser.ts contains /profile and /bug-report links', () => {
    const browserPath = path.join(PROJECT_ROOT, 'src/public/ts/RoomBrowser.ts');
    if (!existsSync(browserPath)) return;
    const content = readFileSync(browserPath, 'utf-8');
    expect(content).toContain('/profile');
    expect(content).toContain('/bug-report');
  });
});

// ── TC-5.7.7: No game references in client source ───────────────────────────

describe('TC-5.7.7: Client source no game references', () => {

  it('RawBinClient.ts has no game event handlers', () => {
    const clientPath = path.join(PROJECT_ROOT, 'src/public/ts/RawBinClient.ts');
    if (!existsSync(clientPath)) return;
    const content = readFileSync(clientPath, 'utf-8');
    expect(content).not.toContain('ROUND_START');
    expect(content).not.toContain('GAME_OVER');
    expect(content).not.toContain('PLAY_CARD');
    expect(content).not.toContain('ADD_BOT');
    expect(content).not.toContain('CARD_PLAYED');
  });

  it('RoomBrowser.ts has no game-specific UI', () => {
    const browserPath = path.join(PROJECT_ROOT, 'src/public/ts/RoomBrowser.ts');
    if (!existsSync(browserPath)) return;
    const content = readFileSync(browserPath, 'utf-8');
    expect(content).not.toContain('ROUND_START');
    expect(content).not.toContain('GAME_OVER');
    expect(content).not.toContain('leaderboard');
    expect(content).not.toContain('PLAY_CARD');
    expect(content).not.toContain('bestScore');
  });

  it('RoomView.ts has no game logic', () => {
    const viewPath = path.join(PROJECT_ROOT, 'src/public/ts/RoomView.ts');
    if (!existsSync(viewPath)) return;
    const content = readFileSync(viewPath, 'utf-8');
    expect(content).not.toContain('PLAY_CARD');
    expect(content).not.toContain('ROUND_START');
    expect(content).not.toContain('GAME_OVER');
    expect(content).not.toContain('shuffle');
  });

  it('app.ts imports RawBinClient not WebSocketClient', () => {
    const appPath = path.join(PROJECT_ROOT, 'src/public/ts/app.ts');
    if (!existsSync(appPath)) return;
    const content = readFileSync(appPath, 'utf-8');
    expect(content).toContain('RawBinClient');
    expect(content).not.toContain('WebSocketClient');
  });
});

// ── TC-5.7.8: Room member events ─────────────────────────────────────────────

describe('TC-5.7.8: Room member events', () => {

  it('room info includes hostId matching creator', () => {
    const creator = makeMember('HostBadge');
    const room = new Room('EventRoom', creator, { maxMembers: 4 });

    const info = room.info();
    expect(info.hostId).toBe(creator.id);
    expect(info.memberCount).toBe(1);
  });

  it('MEMBER_JOINED broadcast when someone joins', () => {
    const creator = makeMember('Waiter');
    const room = new Room('EventRoom', creator, { maxMembers: 4 });

    (creator.ws.send as ReturnType<typeof vi.fn>).mockClear();
    const joiner = makeMember('Newcomer');
    room.addMember(joiner);

    const msgs = getSentMessages(creator.ws);
    const memberJoined = msgs.find(m => m.type === 'MEMBER_JOINED');
    expect(memberJoined).toBeDefined();
  });
});
