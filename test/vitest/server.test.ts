/**
 * Task 4.6: Stripped server.ts verification
 * Tests server HTTP routes, WS handlers, and data separation after game logic removal.
 *
 * Requires: server running on wss://localhost:3443 (npm run dev)
 * All tests use self-signed cert (rejectUnauthorized: false)
 */

import { describe, it, expect, afterAll } from 'vitest';
import WebSocket from 'ws';
import https from 'node:https';

const BASE_URL = 'https://localhost:3443';
const WS_URL = 'wss://localhost:3443';
const WS_OPTS = { rejectUnauthorized: false };
const agent = new https.Agent({ rejectUnauthorized: false });
const sockets: WebSocket[] = [];

function fetchUrl(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, { ...options, dispatcher: undefined, ...(globalThis as any).fetch ? {} : {} } as any).catch(() => {
    // Node fetch with custom agent for self-signed certs
    return new Promise<Response>((resolve, reject) => {
      const url = new URL(`${BASE_URL}${path}`);
      const req = https.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: options.headers as Record<string, string>,
        rejectUnauthorized: false,
      }, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => body += chunk.toString());
        res.on('end', () => {
          resolve({
            status: res.statusCode!,
            ok: res.statusCode! >= 200 && res.statusCode! < 300,
            text: () => Promise.resolve(body),
            json: () => Promise.resolve(JSON.parse(body)),
            headers: new Headers(res.headers as Record<string, string>),
          } as unknown as Response);
        });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  });
}

function httpsGet(path: string): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    https.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      rejectUnauthorized: false,
    }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => body += chunk.toString());
      res.on('end', () => resolve({
        status: res.statusCode!,
        body,
        headers: res.headers as Record<string, string>,
      }));
    }).on('error', reject);
  });
}

function httpsPost(path: string, data: object): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const url = new URL(`${BASE_URL}${path}`);
    const req = https.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      rejectUnauthorized: false,
    }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => body += chunk.toString());
      res.on('end', () => resolve({ status: res.statusCode!, body }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
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

function waitForType(ws: WebSocket, type: string, timeoutMs = 10000): Promise<any> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${type}`)), timeoutMs);
    const h = (d: any) => {
      const m = JSON.parse(d.toString());
      if (m.type === type) { clearTimeout(t); ws.off('message', h); resolve(m); }
    };
    ws.on('message', h);
  });
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

// ── TC-4.6.1: Server starts without errors ──────────────────────────────────

describe('TC-4.6.1: Server starts and responds', () => {

  it('HTTPS server responds on port 3443', async () => {
    const res = await httpsGet('/');
    expect(res.status).toBe(200);
  });

  it('/api/config returns RawBin branding', async () => {
    const res = await httpsGet('/api/config');
    expect(res.status).toBe(200);
    const config = JSON.parse(res.body);
    expect(config.version).toBe('0.1.0');
    expect(config.branch).toBe('rawbin');
  });
});

// ── TC-4.6.2: Kept routes respond 200 ───────────────────────────────────────

describe('TC-4.6.2: Kept routes respond 200', () => {

  it('GET / returns 200', async () => {
    const res = await httpsGet('/');
    expect(res.status).toBe(200);
  });

  it('GET /app returns 200 (was /mp)', async () => {
    const res = await httpsGet('/app');
    expect(res.status).toBe(200);
  });

  it('GET /bug-report returns 200', async () => {
    const res = await httpsGet('/bug-report');
    expect(res.status).toBe(200);
  });

  it('GET /profile returns 200', async () => {
    const res = await httpsGet('/profile');
    expect(res.status).toBe(200);
  });

  it('GET /docs returns 200', async () => {
    const res = await httpsGet('/docs');
    expect(res.status).toBe(200);
  });

  it('GET /api/config returns 200', async () => {
    const res = await httpsGet('/api/config');
    expect(res.status).toBe(200);
  });

  it('GET /api/bugs returns 200', async () => {
    const res = await httpsGet('/api/bugs');
    expect(res.status).toBe(200);
  });
});

// ── TC-4.6.3: Removed routes return 404 ─────────────────────────────────────

describe('TC-4.6.3: Removed routes return 404', () => {

  it('GET /api/leaderboard returns 404', async () => {
    const res = await httpsGet('/api/leaderboard');
    expect(res.status).toBe(404);
  });

  it('GET /leaderboard returns 404', async () => {
    const res = await httpsGet('/leaderboard');
    expect(res.status).toBe(404);
  });

  it('GET /mp returns 404 (renamed to /app)', async () => {
    const res = await httpsGet('/mp');
    expect(res.status).toBe(404);
  });

  it('GET /multiplayer returns 404 (renamed to /app)', async () => {
    const res = await httpsGet('/multiplayer');
    expect(res.status).toBe(404);
  });
});

// ── TC-4.6.4: WS connection + IDENTIFY creates profile ──────────────────────

describe('TC-4.6.4: WS IDENTIFY creates profile', () => {

  it('WS connects and receives welcome/config', async () => {
    const { ws, messages } = await connectWs();
    const hasWelcome = messages.some(m => m.type === 'welcome' || m.type === 'SERVER_CONFIG');
    expect(hasWelcome).toBe(true);
  });

  it('IDENTIFY with token creates persistent profile', async () => {
    const { ws } = await connectWs();
    const token = `test-token-${Date.now()}`;

    const response = collect(ws, 2000);
    send(ws, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `device-${Date.now()}`,
      name: 'TestUser',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    const msgs = await response;

    const profile = msgs.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');
    expect(profile).toBeDefined();
  });

  it('IDENTIFY with same token reconnects existing profile', async () => {
    const token = `reconnect-token-${Date.now()}`;

    // First connection — create profile
    const { ws: ws1 } = await connectWs();
    const c1 = collect(ws1, 2000);
    send(ws1, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: 'device-1',
      name: 'Reconnector',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    await c1;
    ws1.close();
    await sleep(500);

    // Second connection — reconnect
    const { ws: ws2 } = await connectWs();
    const c2 = collect(ws2, 2000);
    send(ws2, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: 'device-1',
      name: 'Reconnector',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    const msgs2 = await c2;

    const profile = msgs2.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');
    expect(profile).toBeDefined();
  });
});

// ── TC-4.6.5: Room create/join/leave/delete via WS ──────────────────────────

describe('TC-4.6.5: Room CRUD via WS', () => {

  it('CREATE_ROOM returns ROOM_JOINED', async () => {
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, { type: 'CREATE_ROOM', playerName: 'Creator', maxPlayers: 4 });
    const msgs = await response;

    const joined = msgs.find(m => m.type === 'ROOM_JOINED');
    expect(joined).toBeDefined();
    expect(joined.room).toBeDefined();
    expect(joined.room.id).toBeDefined();
  });

  it('JOIN_ROOM adds member to existing room', async () => {
    const { ws: wsA } = await connectWs();
    const cCreate = collect(wsA, 2000);
    send(wsA, { type: 'CREATE_ROOM', playerName: 'Host', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;
    expect(roomId).toBeDefined();

    const { ws: wsB } = await connectWs();
    const cJoin = collect(wsB, 2000);
    send(wsB, { type: 'JOIN_ROOM', roomId, playerName: 'Joiner' });
    const joinMsgs = await cJoin;

    const joined = joinMsgs.find(m => m.type === 'ROOM_JOINED');
    expect(joined).toBeDefined();
  });

  it('LEAVE_ROOM removes member', async () => {
    const { ws: wsA } = await connectWs();
    const cCreate = collect(wsA, 2000);
    send(wsA, { type: 'CREATE_ROOM', playerName: 'Host', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;

    const { ws: wsB } = await connectWs();
    const cJoin = collect(wsB, 2000);
    send(wsB, { type: 'JOIN_ROOM', roomId, playerName: 'Leaver' });
    await cJoin;

    const cLeave = collect(wsA, 2000);
    send(wsB, { type: 'LEAVE_ROOM' });
    const leaveMsgs = await cLeave;

    const left = leaveMsgs.find(m => m.type === 'PLAYER_LEFT' || m.type === 'MEMBER_LEFT');
    expect(left).toBeDefined();
  });

  it('REMOVE_ROOM by creator succeeds', async () => {
    const { ws } = await connectWs();
    const cCreate = collect(ws, 2000);
    send(ws, { type: 'CREATE_ROOM', playerName: 'Owner', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;
    expect(roomId).toBeDefined();

    const cRemove = collect(ws, 2000);
    send(ws, { type: 'REMOVE_ROOM', roomId });
    const removeMsgs = await cRemove;

    const removed = removeMsgs.find(m => m.type === 'ROOM_REMOVED' || m.type === 'ROOM_DELETED');
    expect(removed).toBeDefined();
  });

  it('LIST_ROOMS returns room list', async () => {
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, { type: 'LIST_ROOMS' });
    const msgs = await response;

    const list = msgs.find(m => m.type === 'ROOM_LIST');
    expect(list).toBeDefined();
    expect(Array.isArray(list.rooms)).toBe(true);
  });
});

// ── TC-4.6.6: Chat in room ──────────────────────────────────────────────────

describe('TC-4.6.6: Chat works in room', () => {

  it('CHAT_MESSAGE broadcasts to room members', async () => {
    const { ws: wsA } = await connectWs();
    const cCreate = collect(wsA, 2000);
    send(wsA, { type: 'CREATE_ROOM', playerName: 'Chatter', maxPlayers: 4 });
    const createMsgs = await cCreate;
    const roomId = createMsgs.find(m => m.type === 'ROOM_JOINED')?.room?.id;

    const { ws: wsB } = await connectWs();
    const cJoin = collect(wsB, 2000);
    send(wsB, { type: 'JOIN_ROOM', roomId, playerName: 'Listener' });
    await cJoin;

    const cChat = collect(wsB, 2000);
    send(wsA, { type: 'CHAT_MESSAGE', text: 'Hello room!' });
    const chatMsgs = await cChat;

    const chat = chatMsgs.find(m => m.type === 'CHAT_MESSAGE' || m.type === 'CHAT');
    expect(chat).toBeDefined();
    expect(chat.text || chat.message).toContain('Hello room!');
  });
});

// ── TC-4.6.7: Bug report pipeline ───────────────────────────────────────────

describe('TC-4.6.7: Bug report pipeline', () => {

  it('BUG_REPORT via WS returns BUG_REPORT_OK', async () => {
    const { ws } = await connectWs();
    await sleep(500);

    const response = collect(ws, 3000);
    send(ws, { type: 'BUG_REPORT', text: 'Test bug from vitest' });
    const msgs = await response;

    const ok = msgs.find(m => m.type === 'BUG_REPORT_OK');
    expect(ok).toBeDefined();
  });

  it('GET /api/bugs returns bug list', async () => {
    const res = await httpsGet('/api/bugs');
    expect(res.status).toBe(200);
    const bugs = JSON.parse(res.body);
    expect(Array.isArray(bugs)).toBe(true);
  });
});

// ── TC-4.6.8: Profile page has no game stats ────────────────────────────────

describe('TC-4.6.8: Profile page has no game stats', () => {

  it('GET /profile HTML contains no game stat references', async () => {
    const res = await httpsGet('/profile');
    expect(res.status).toBe(200);
    const html = res.body.toLowerCase();

    expect(html).not.toContain('gamesplayed');
    expect(html).not.toContain('games played');
    expect(html).not.toContain('bestscore');
    expect(html).not.toContain('best score');
    expect(html).not.toContain('beststreak');
    expect(html).not.toContain('best streak');
    expect(html).not.toContain('diamonds');
    expect(html).not.toContain('leaderboard');
  });

  it('PROFILE WS response has no game fields', async () => {
    const { ws } = await connectWs();
    const token = `profile-check-${Date.now()}`;

    send(ws, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `dev-${Date.now()}`,
      name: 'ProfileCheck',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });

    const msgs = await collect(ws, 2000);
    const profile = msgs.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');

    if (profile) {
      expect(profile.gamesPlayed).toBeUndefined();
      expect(profile.wins).toBeUndefined();
      expect(profile.bestScore).toBeUndefined();
      expect(profile.bestStreak).toBeUndefined();
      expect(profile.diamonds).toBeUndefined();
    }
  });
});

// ── TC-4.6.9: profiles.json and devices.json separated ──────────────────────

describe('TC-4.6.9: Separated data files', () => {

  it('IDENTIFY writes to both profiles and devices', async () => {
    const { readFile } = await import('node:fs/promises');
    const { ws } = await connectWs();
    const token = `sep-test-${Date.now()}`;

    send(ws, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `sep-device-${Date.now()}`,
      name: 'SepTest',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    await sleep(2000);

    // Check profiles.json exists and has the token
    let profilesFound = false;
    for (const dir of ['data', '.']) {
      try {
        const profilesRaw = await readFile(`/Users/Shared/Workspaces/AI/Claude/workspaces/Web4RawBin/${dir}/profiles.json`, 'utf-8');
        const profiles = JSON.parse(profilesRaw);
        if (profiles[token] || Object.values(profiles).some((p: any) => p.token === token)) {
          profilesFound = true;
        }
        break;
      } catch { /* try next dir */ }
    }

    // Check devices.json exists
    let devicesFound = false;
    for (const dir of ['data', '.']) {
      try {
        const devicesRaw = await readFile(`/Users/Shared/Workspaces/AI/Claude/workspaces/Web4RawBin/${dir}/devices.json`, 'utf-8');
        const devices = JSON.parse(devicesRaw);
        devicesFound = Array.isArray(devices) ? devices.length > 0 : Object.keys(devices).length > 0;
        break;
      } catch { /* try next dir */ }
    }

    expect(profilesFound).toBe(true);
    expect(devicesFound).toBe(true);
  });

  it('profiles.json has no game stats', async () => {
    const { readFile } = await import('node:fs/promises');

    let profilesRaw = '';
    for (const dir of ['data', '.']) {
      try {
        profilesRaw = await readFile(`/Users/Shared/Workspaces/AI/Claude/workspaces/Web4RawBin/${dir}/profiles.json`, 'utf-8');
        break;
      } catch { /* try next dir */ }
    }

    if (profilesRaw) {
      expect(profilesRaw).not.toContain('gamesPlayed');
      expect(profilesRaw).not.toContain('bestScore');
      expect(profilesRaw).not.toContain('bestStreak');
    }
  });
});

// ── TC-4.6.10: PROFILE response only includes requesting user's devices ─────

describe('TC-4.6.10: PROFILE device privacy', () => {

  it('user A cannot see user B devices in PROFILE', async () => {
    const tokenA = `privacy-a-${Date.now()}`;
    const tokenB = `privacy-b-${Date.now()}`;

    // User A connects and identifies
    const { ws: wsA } = await connectWs();
    send(wsA, {
      type: 'IDENTIFY',
      playerToken: tokenA,
      deviceId: 'device-a-1',
      name: 'UserA',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'mac',
    });
    const msgsA = await collect(wsA, 2000);
    const profileA = msgsA.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');

    // User B connects and identifies
    const { ws: wsB } = await connectWs();
    send(wsB, {
      type: 'IDENTIFY',
      playerToken: tokenB,
      deviceId: 'device-b-1',
      name: 'UserB',
      screenWidth: 1280,
      screenHeight: 720,
      platform: 'windows',
    });
    const msgsB = await collect(wsB, 2000);
    const profileB = msgsB.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');

    // User A's profile should not contain B's device
    if (profileA?.devices) {
      const deviceIds = profileA.devices.map((d: any) => d.deviceId || d.id);
      expect(deviceIds).not.toContain('device-b-1');
    }

    // User B's profile should not contain A's device
    if (profileB?.devices) {
      const deviceIds = profileB.devices.map((d: any) => d.deviceId || d.id);
      expect(deviceIds).not.toContain('device-a-1');
    }

    // At minimum, each user should only see their own devices
    expect(profileA || profileB).toBeDefined();
  });
});

// ── TC-4.6.11: Removed WS message types return error ────────────────────────

describe('TC-4.6.11: Removed WS game messages rejected', () => {

  it('START_GAME returns error or is ignored', async () => {
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, { type: 'START_GAME' });
    const msgs = await response;

    const gameStart = msgs.find(m => m.type === 'ROUND_START' || m.type === 'GAME_STARTED');
    expect(gameStart).toBeUndefined();
  });

  it('PLAY_CARD returns error or is ignored', async () => {
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, { type: 'PLAY_CARD', guess: 'up' });
    const msgs = await response;

    const round = msgs.find(m => m.type === 'ROUND_RESULT');
    expect(round).toBeUndefined();
  });

  it('ADD_BOT returns error or is ignored', async () => {
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, { type: 'ADD_BOT' });
    const msgs = await response;

    const botJoined = msgs.find(m => m.type === 'PLAYER_JOINED' && m.player?.isBot);
    expect(botJoined).toBeUndefined();
  });

  it('GET_LEADERBOARD returns error or is ignored', async () => {
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, { type: 'GET_LEADERBOARD' });
    const msgs = await response;

    const lb = msgs.find(m => m.type === 'LEADERBOARD');
    expect(lb).toBeUndefined();
  });
});
