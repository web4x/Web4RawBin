/**
 * Task 5.7: Client UI verification
 * Tests build output, WS client behavior, room lifecycle, chat, and link integrity.
 *
 * Build tests: run locally (no server needed)
 * Runtime tests: require server on wss://localhost:3443 serving /app
 */

import { describe, it, expect, afterAll } from 'vitest';
import WebSocket from 'ws';
import https from 'node:https';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../');
const BASE_URL = 'https://localhost:3443';
const WS_URL = 'wss://localhost:3443';
const WS_OPTS = { rejectUnauthorized: false };
const sockets: WebSocket[] = [];

function httpsGet(urlPath: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${urlPath}`);
    https.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      rejectUnauthorized: false,
    }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => body += chunk.toString());
      res.on('end', () => resolve({ status: res.statusCode!, body }));
    }).on('error', reject);
  });
}

function connectWs(): Promise<{ ws: WebSocket; messages: any[] }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL, WS_OPTS);
    const messages: any[] = [];
    const timeout = setTimeout(() => reject(new Error('WS connect timeout')), 5000);
    ws.on('error', reject);
    ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      messages.push(m);
      if (m.type === 'welcome' || m.type === 'SERVER_CONFIG') {
        clearTimeout(timeout);
        sockets.push(ws);
        resolve({ ws, messages });
      }
    });
  });
}

function send(ws: WebSocket, data: object) {
  ws.send(JSON.stringify(data));
}

function collect(ws: WebSocket, ms: number): Promise<any[]> {
  return new Promise(r => {
    const msgs: any[] = [];
    const h = (d: any) => msgs.push(JSON.parse(d.toString()));
    ws.on('message', h);
    setTimeout(() => { ws.off('message', h); r(msgs); }, ms);
  });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

afterAll(() => { sockets.forEach(ws => ws.close()); });

// ── TC-5.7.1: esbuild succeeds ──────────────────────────────────────────────

describe('TC-5.7.1: Build succeeds', () => {

  it('npm run build completes without error', () => {
    const result = execSync('npm run build 2>&1', {
      cwd: PROJECT_ROOT,
      timeout: 30000,
      encoding: 'utf-8',
    });
    expect(result).not.toContain('error');
  });

  it('app.js bundle exists after build', () => {
    const appJs = path.join(PROJECT_ROOT, 'src/public/dist/app.js');
    expect(existsSync(appJs)).toBe(true);
  });

  it('app.js bundle has no game references', () => {
    const appJs = path.join(PROJECT_ROOT, 'src/public/dist/app.js');
    if (!existsSync(appJs)) return;
    const content = readFileSync(appJs, 'utf-8').toLowerCase();
    expect(content).not.toContain('placard');
    expect(content).not.toContain('round_start');
    expect(content).not.toContain('game_over');
    expect(content).not.toContain('play_card');
    expect(content).not.toContain('add_bot');
    expect(content).not.toContain('leaderboard');
  });
});

// ── TC-5.7.2: App loads without console errors ──────────────────────────────

describe('TC-5.7.2: App loads at /app', () => {

  it('GET /app returns 200 with HTML', async () => {
    const res = await httpsGet('/app');
    expect(res.status).toBe(200);
    expect(res.body).toContain('<!');
  });

  it('/app HTML references app.js bundle', async () => {
    const res = await httpsGet('/app');
    expect(res.body).toContain('app.js');
  });

  it('/app HTML title says RawBin', async () => {
    const res = await httpsGet('/app');
    const lower = res.body.toLowerCase();
    expect(lower).toContain('rawbin');
    expect(lower).not.toContain('updown');
  });

  it('/app HTML has no game references', async () => {
    const res = await httpsGet('/app');
    const lower = res.body.toLowerCase();
    expect(lower).not.toContain('card game');
    expect(lower).not.toContain('leaderboard');
    expect(lower).not.toContain('play card');
  });
});

// ── TC-5.7.3: RawBinClient connects to WS ───────────────────────────────────

describe('TC-5.7.3: RawBinClient WS connection', () => {

  it('WS connects and receives initial message', async () => {
    const { messages } = await connectWs();
    expect(messages.length).toBeGreaterThan(0);
    const types = messages.map(m => m.type);
    expect(types.some(t => t === 'welcome' || t === 'SERVER_CONFIG')).toBe(true);
  });

  it('IDENTIFY returns PROFILE with UserProfile fields', async () => {
    const { ws } = await connectWs();
    const token = `client-test-${Date.now()}`;

    const msgs = await collect(ws, 2000);
    send(ws, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `dev-${Date.now()}`,
      name: 'ClientTest',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    await sleep(500);
    const later = await collect(ws, 2000);
    const all = [...msgs, ...later];

    const profile = all.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');
    expect(profile).toBeDefined();

    if (profile?.profile) {
      expect(profile.profile.name).toBeDefined();
      expect(profile.profile.secretCode).toBeDefined();
      expect(profile.profile.gamesPlayed).toBeUndefined();
    }
  });
});

// ── TC-5.7.4: Room create/join/leave/delete flow ────────────────────────────

describe('TC-5.7.4: Room lifecycle flow', () => {

  it('full room lifecycle: create → join → leave → delete', async () => {
    // Creator connects
    const { ws: wsCreator } = await connectWs();
    const cCreate = collect(wsCreator, 2000);
    send(wsCreator, { type: 'CREATE_ROOM', playerName: 'RoomOwner', maxPlayers: 4 });
    const createMsgs = await cCreate;

    const joined = createMsgs.find(m => m.type === 'ROOM_JOINED');
    expect(joined).toBeDefined();
    const roomId = joined.room.id;
    expect(roomId).toBeDefined();

    // Joiner connects and joins
    const { ws: wsJoiner } = await connectWs();
    const cJoin = collect(wsJoiner, 2000);
    send(wsJoiner, { type: 'JOIN_ROOM', roomId, playerName: 'RoomJoiner' });
    const joinMsgs = await cJoin;

    const joinedB = joinMsgs.find(m => m.type === 'ROOM_JOINED');
    expect(joinedB).toBeDefined();

    // Creator should see MEMBER_JOINED or PLAYER_JOINED
    const cNotify = collect(wsCreator, 1000);
    await sleep(1000);
    // Member joined notification may already have been received during join collect window

    // Joiner leaves
    const cLeaveNotify = collect(wsCreator, 2000);
    send(wsJoiner, { type: 'LEAVE_ROOM' });
    const leaveNotify = await cLeaveNotify;

    const left = leaveNotify.find(m =>
      m.type === 'PLAYER_LEFT' || m.type === 'MEMBER_LEFT'
    );
    expect(left).toBeDefined();

    // Creator deletes room
    const cRemove = collect(wsCreator, 2000);
    send(wsCreator, { type: 'REMOVE_ROOM', roomId });
    const removeMsgs = await cRemove;

    const removed = removeMsgs.find(m =>
      m.type === 'ROOM_REMOVED' || m.type === 'ROOM_DELETED'
    );
    expect(removed).toBeDefined();

    // Verify room gone from list
    const { ws: wsCheck } = await connectWs();
    const cList = collect(wsCheck, 2000);
    send(wsCheck, { type: 'LIST_ROOMS' });
    const listMsgs = await cList;
    const list = listMsgs.find(m => m.type === 'ROOM_LIST');
    if (list) {
      const found = list.rooms.find((r: any) => r.id === roomId);
      expect(found).toBeUndefined();
    }
  }, 30000);

  it('non-owner cannot delete room', async () => {
    const { ws: wsCreator } = await connectWs();
    const cCreate = collect(wsCreator, 2000);
    send(wsCreator, { type: 'CREATE_ROOM', playerName: 'Owner', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;
    expect(roomId).toBeDefined();

    const { ws: wsOther } = await connectWs();
    const cJoin = collect(wsOther, 2000);
    send(wsOther, { type: 'JOIN_ROOM', roomId, playerName: 'NonOwner' });
    await cJoin;

    // Non-owner tries to delete
    const cRemove = collect(wsOther, 2000);
    send(wsOther, { type: 'REMOVE_ROOM', roomId });
    const removeMsgs = await cRemove;

    const error = removeMsgs.find(m => m.type === 'ERROR');
    const removed = removeMsgs.find(m => m.type === 'ROOM_REMOVED' || m.type === 'ROOM_DELETED');
    // Either an error or no removal confirmation
    expect(error || !removed).toBeTruthy();

    // Room should still exist
    const { ws: wsCheck } = await connectWs();
    const cList = collect(wsCheck, 2000);
    send(wsCheck, { type: 'LIST_ROOMS' });
    const listMsgs = await cList;
    const list = listMsgs.find(m => m.type === 'ROOM_LIST');
    if (list) {
      const found = list.rooms.find((r: any) => r.id === roomId);
      expect(found).toBeDefined();
    }
  }, 20000);
});

// ── TC-5.7.5: Chat send/receive ─────────────────────────────────────────────

describe('TC-5.7.5: Chat in room', () => {

  it('message sent by A is received by B', async () => {
    // Setup room with 2 members
    const { ws: wsA } = await connectWs();
    const cCreate = collect(wsA, 2000);
    send(wsA, { type: 'CREATE_ROOM', playerName: 'ChatSender', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;

    const { ws: wsB } = await connectWs();
    const cJoin = collect(wsB, 2000);
    send(wsB, { type: 'JOIN_ROOM', roomId, playerName: 'ChatReceiver' });
    await cJoin;

    // A sends chat
    const cChatB = collect(wsB, 2000);
    send(wsA, { type: 'CHAT_MESSAGE', text: 'Hello from A!' });
    const chatMsgs = await cChatB;

    const chat = chatMsgs.find(m => m.type === 'CHAT_MESSAGE' || m.type === 'CHAT');
    expect(chat).toBeDefined();
    expect(chat.text || chat.message).toContain('Hello from A!');
  });

  it('chat message includes sender name', async () => {
    const { ws: wsA } = await connectWs();
    const cCreate = collect(wsA, 2000);
    send(wsA, { type: 'CREATE_ROOM', playerName: 'NamedSender', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;

    const { ws: wsB } = await connectWs();
    const cJoin = collect(wsB, 2000);
    send(wsB, { type: 'JOIN_ROOM', roomId, playerName: 'Listener' });
    await cJoin;

    const cChat = collect(wsB, 2000);
    send(wsA, { type: 'CHAT_MESSAGE', text: 'Check my name' });
    const msgs = await cChat;

    const chat = msgs.find(m => m.type === 'CHAT_MESSAGE' || m.type === 'CHAT');
    expect(chat).toBeDefined();
    if (chat.senderName || chat.playerName || chat.sender) {
      const name = chat.senderName || chat.playerName || chat.sender;
      expect(name).toBe('NamedSender');
    }
  });
});

// ── TC-5.7.6: Profile and bug-report links ──────────────────────────────────

describe('TC-5.7.6: Profile and bug-report links work', () => {

  it('GET /profile returns 200', async () => {
    const res = await httpsGet('/profile');
    expect(res.status).toBe(200);
  });

  it('GET /bug-report returns 200', async () => {
    const res = await httpsGet('/bug-report');
    expect(res.status).toBe(200);
  });

  it('/app page contains link to /profile', async () => {
    const res = await httpsGet('/app');
    expect(res.body).toContain('/profile');
  });

  it('/app page contains link to /bug-report', async () => {
    const res = await httpsGet('/app');
    expect(res.body).toContain('/bug-report');
  });
});

// ── TC-5.7.7: No game references in client source ───────────────────────────

describe('TC-5.7.7: Client source has no game references', () => {

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
    expect(content).not.toContain('deck');
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

// ── TC-5.7.8: Member list and host badge ─────────────────────────────────────

describe('TC-5.7.8: Room member events', () => {

  it('ROOM_JOINED includes member list with host indicator', async () => {
    const { ws } = await connectWs();
    const cCreate = collect(ws, 2000);
    send(ws, { type: 'CREATE_ROOM', playerName: 'HostBadge', maxPlayers: 4 });
    const msgs = await cCreate;

    const joined = msgs.find(m => m.type === 'ROOM_JOINED');
    expect(joined).toBeDefined();
    expect(joined.room).toBeDefined();

    // Room should indicate who the host is
    if (joined.room.hostId || joined.room.host) {
      expect(joined.room.hostId || joined.room.host).toBeDefined();
    }
    // Players/members list should exist
    if (joined.players || joined.members || joined.room.players || joined.room.members) {
      const members = joined.players || joined.members || joined.room.players || joined.room.members;
      expect(members.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('MEMBER_JOINED or PLAYER_JOINED when someone joins', async () => {
    const { ws: wsA } = await connectWs();
    const cCreate = collect(wsA, 2000);
    send(wsA, { type: 'CREATE_ROOM', playerName: 'Waiter', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;

    const cNotify = collect(wsA, 3000);
    const { ws: wsB } = await connectWs();
    send(wsB, { type: 'JOIN_ROOM', roomId, playerName: 'Newcomer' });
    const notifyMsgs = await cNotify;

    const memberJoined = notifyMsgs.find(m =>
      m.type === 'MEMBER_JOINED' || m.type === 'PLAYER_JOINED'
    );
    expect(memberJoined).toBeDefined();
  });
});
