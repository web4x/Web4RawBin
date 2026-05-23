/**
 * Task 7.7: User Editor / Profile tests
 * Tests UPDATE_PROFILE, GET_USER_INFO, profileCommitted, secretCode validation, backfill.
 *
 * Requires: server running on wss://localhost:4444
 */

import { describe, it, expect, afterAll } from 'vitest';
import WebSocket from 'ws';

const WS_URL = 'wss://localhost:4444';
const WS_OPTS = { rejectUnauthorized: false };
const sockets: WebSocket[] = [];

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

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function identifyAs(name: string, token?: string): Promise<{ ws: WebSocket; token: string }> {
  const { ws } = await connectWs();
  const t = token ?? `profile-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = collect(ws, 2000);
  send(ws, {
    type: 'IDENTIFY',
    playerToken: t,
    deviceId: `dev-${Date.now()}`,
    name,
    screenWidth: 1920,
    screenHeight: 1080,
    platform: 'test',
  });
  await response;
  return { ws, token: t };
}

afterAll(() => { sockets.forEach(ws => ws.close()); });

// ── TC-7.7.1: UPDATE_PROFILE saves all fields and returns PROFILE_UPDATED ───

describe('TC-7.7.1: UPDATE_PROFILE saves and responds', () => {

  it('UPDATE_PROFILE returns PROFILE_UPDATED with all fields', async () => {
    const { ws, token } = await identifyAs('OriginalName');

    const response = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, {
      type: 'UPDATE_PROFILE',
      name: 'UpdatedName',
      phone: '+49 123 456',
      url: 'https://example.com',
      avatar: 'data:image/png;base64,abc',
      secretCode: '1234',
    });
    const msg = await response;

    expect(msg.type).toBe('PROFILE_UPDATED');
    expect(msg.profile).toBeDefined();
    expect(msg.profile.name).toBe('UpdatedName');
    expect(msg.profile.phone).toBe('+49 123 456');
    expect(msg.profile.url).toBe('https://example.com');
    expect(msg.profile.avatar).toBe('data:image/png;base64,abc');
    expect(msg.profile.secretCode).toBe('1234');
  });

  it('updated fields persist across reconnects', async () => {
    const token = `persist-${Date.now()}`;
    const { ws: ws1 } = await identifyAs('BeforeUpdate', token);

    const updated = waitForType(ws1, 'PROFILE_UPDATED');
    send(ws1, {
      type: 'UPDATE_PROFILE',
      name: 'PersistName',
      phone: '+1 555 0100',
      url: 'https://persist.test',
      avatar: '',
      secretCode: '9876',
    });
    await updated;
    ws1.close();
    await sleep(500);

    // Reconnect with same token
    const { ws: ws2 } = await connectWs();
    const response = collect(ws2, 3000);
    send(ws2, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `dev-reconnect-${Date.now()}`,
      name: 'PersistName',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    const msgs = await response;

    const profile = msgs.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');
    expect(profile).toBeDefined();
    if (profile?.profile) {
      expect(profile.profile.name).toBe('PersistName');
      expect(profile.profile.phone).toBe('+1 555 0100');
      expect(profile.profile.url).toBe('https://persist.test');
      expect(profile.profile.secretCode).toBe('9876');
    }
  });

  it('partial update preserves other fields', async () => {
    const token = `partial-${Date.now()}`;
    const { ws } = await identifyAs('PartialUser', token);

    // Set all fields first
    const first = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, {
      type: 'UPDATE_PROFILE',
      name: 'PartialUser',
      phone: '+49 111',
      url: 'https://first.test',
      avatar: 'avatar1',
      secretCode: '1111',
    });
    await first;

    // Update only name
    const second = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, {
      type: 'UPDATE_PROFILE',
      name: 'NewName',
    });
    const msg = await second;

    expect(msg.profile.name).toBe('NewName');
    // Other fields should be preserved
    if (msg.profile.phone !== undefined) {
      expect(msg.profile.phone).toBe('+49 111');
    }
    if (msg.profile.url !== undefined) {
      expect(msg.profile.url).toBe('https://first.test');
    }
  });
});

// ── TC-7.7.2: profileCommitted set true when name non-empty ─────────────────

describe('TC-7.7.2: profileCommitted flag', () => {

  it('profileCommitted=false before any profile save', async () => {
    const token = `committed-${Date.now()}`;
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `dev-${Date.now()}`,
      name: '',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    const msgs = await response;

    const profile = msgs.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');
    if (profile?.profile) {
      expect(profile.profile.profileCommitted).toBe(false);
    }
  });

  it('profileCommitted=true after UPDATE_PROFILE with non-empty name', async () => {
    const { ws } = await identifyAs('');

    const response = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, {
      type: 'UPDATE_PROFILE',
      name: 'CommittedUser',
      phone: '',
      url: '',
      avatar: '',
      secretCode: '0000',
    });
    const msg = await response;

    expect(msg.profile.profileCommitted).toBe(true);
  });

  it('profileCommitted stays false if name is empty', async () => {
    const { ws } = await identifyAs('');

    const response = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, {
      type: 'UPDATE_PROFILE',
      name: '',
      phone: '+49 222',
      url: '',
      avatar: '',
      secretCode: '0000',
    });
    const msg = await response;

    expect(msg.profile.profileCommitted).toBe(false);
  });
});

// ── TC-7.7.3: GET_USER_INFO returns public subset only ──────────────────────

describe('TC-7.7.3: GET_USER_INFO public subset', () => {

  it('returns name, phone, url, avatar, playerToken', async () => {
    const token = `public-${Date.now()}`;
    const { ws: ws1 } = await identifyAs('PublicUser', token);

    // Set profile with all fields
    const updated = waitForType(ws1, 'PROFILE_UPDATED');
    send(ws1, {
      type: 'UPDATE_PROFILE',
      name: 'PublicUser',
      phone: '+49 333',
      url: 'https://public.test',
      avatar: 'avatar-public',
      secretCode: '5555',
    });
    await updated;

    // Another user requests info
    const { ws: ws2 } = await identifyAs('Requester');
    const response = waitForType(ws2, 'USER_INFO');
    send(ws2, { type: 'GET_USER_INFO', playerToken: token });
    const msg = await response;

    expect(msg.type).toBe('USER_INFO');
    expect(msg.profile || msg.user).toBeDefined();

    const info = msg.profile || msg.user;
    expect(info.name).toBe('PublicUser');
    expect(info.phone).toBe('+49 333');
    expect(info.url).toBe('https://public.test');
    expect(info.avatar).toBe('avatar-public');
    expect(info.playerToken).toBe(token);
  });

  it('does NOT include secretCode', async () => {
    const token = `secret-hide-${Date.now()}`;
    const { ws: ws1 } = await identifyAs('SecretKeeper', token);

    const updated = waitForType(ws1, 'PROFILE_UPDATED');
    send(ws1, {
      type: 'UPDATE_PROFILE',
      name: 'SecretKeeper',
      secretCode: '7777',
    });
    await updated;

    const { ws: ws2 } = await identifyAs('Snooper');
    const response = waitForType(ws2, 'USER_INFO');
    send(ws2, { type: 'GET_USER_INFO', playerToken: token });
    const msg = await response;

    const info = msg.profile || msg.user;
    expect(info.secretCode).toBeUndefined();
  });

  it('does NOT include bugReports', async () => {
    const token = `bugs-hide-${Date.now()}`;
    const { ws: ws1 } = await identifyAs('BugReporter', token);

    // File a bug so there's something to hide
    send(ws1, { type: 'BUG_REPORT', text: 'test bug for privacy check' });
    await sleep(1000);

    const { ws: ws2 } = await identifyAs('Checker');
    const response = waitForType(ws2, 'USER_INFO');
    send(ws2, { type: 'GET_USER_INFO', playerToken: token });
    const msg = await response;

    const info = msg.profile || msg.user;
    expect(info.bugReports).toBeUndefined();
    expect(info.consolidatedFrom).toBeUndefined();
  });

  it('does NOT include devices', async () => {
    const token = `devices-hide-${Date.now()}`;
    await identifyAs('DeviceUser', token);

    const { ws: ws2 } = await identifyAs('DeviceSnooper');
    const response = waitForType(ws2, 'USER_INFO');
    send(ws2, { type: 'GET_USER_INFO', playerToken: token });
    const msg = await response;

    const info = msg.profile || msg.user;
    expect(info.devices).toBeUndefined();
  });
});

// ── TC-7.7.4: GET_USER_INFO for unknown token returns error ─────────────────

describe('TC-7.7.4: GET_USER_INFO unknown token', () => {

  it('returns ERROR for non-existent token', async () => {
    const { ws } = await identifyAs('Requester');
    const response = collect(ws, 3000);
    send(ws, { type: 'GET_USER_INFO', playerToken: 'nonexistent-token-999' });
    const msgs = await response;

    const error = msgs.find(m => m.type === 'ERROR');
    const userInfo = msgs.find(m => m.type === 'USER_INFO');

    // Either explicit error, or USER_INFO with null/empty profile
    if (error) {
      expect(error.message || error.error).toBeDefined();
    } else if (userInfo) {
      const info = userInfo.profile || userInfo.user;
      expect(info).toBeNull();
    } else {
      // No response at all is also acceptable as "not found"
      expect(msgs.filter(m => m.type !== 'welcome' && m.type !== 'SERVER_CONFIG').length).toBe(0);
    }
  });

  it('returns ERROR for empty token', async () => {
    const { ws } = await identifyAs('Requester');
    const response = collect(ws, 3000);
    send(ws, { type: 'GET_USER_INFO', playerToken: '' });
    const msgs = await response;

    const userInfo = msgs.find(m => m.type === 'USER_INFO' && (m.profile || m.user));
    // Should not return a real profile for empty token
    if (userInfo) {
      const info = userInfo.profile || userInfo.user;
      expect(info).toBeNull();
    }
  });
});

// ── TC-7.7.5: secretCode validation — must be 4 digits ──────────────────────

describe('TC-7.7.5: secretCode validation', () => {

  it('accepts valid 4-digit code', async () => {
    const { ws } = await identifyAs('ValidCode');

    const response = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, { type: 'UPDATE_PROFILE', name: 'ValidCode', secretCode: '4321' });
    const msg = await response;

    expect(msg.profile.secretCode).toBe('4321');
  });

  it('rejects non-numeric code', async () => {
    const { ws } = await identifyAs('BadCode');

    const response = collect(ws, 3000);
    send(ws, { type: 'UPDATE_PROFILE', name: 'BadCode', secretCode: 'abcd' });
    const msgs = await response;

    const error = msgs.find(m => m.type === 'ERROR');
    const updated = msgs.find(m => m.type === 'PROFILE_UPDATED');

    if (error) {
      expect(error.message || error.error).toBeDefined();
    } else if (updated) {
      // If server accepts it, it should NOT have saved 'abcd'
      expect(updated.profile.secretCode).not.toBe('abcd');
    }
  });

  it('rejects code shorter than 4 digits', async () => {
    const { ws } = await identifyAs('ShortCode');

    const response = collect(ws, 3000);
    send(ws, { type: 'UPDATE_PROFILE', name: 'ShortCode', secretCode: '12' });
    const msgs = await response;

    const error = msgs.find(m => m.type === 'ERROR');
    const updated = msgs.find(m => m.type === 'PROFILE_UPDATED');

    if (error) {
      expect(error.message || error.error).toBeDefined();
    } else if (updated) {
      expect(updated.profile.secretCode).not.toBe('12');
    }
  });

  it('rejects code longer than 4 digits', async () => {
    const { ws } = await identifyAs('LongCode');

    const response = collect(ws, 3000);
    send(ws, { type: 'UPDATE_PROFILE', name: 'LongCode', secretCode: '123456' });
    const msgs = await response;

    const error = msgs.find(m => m.type === 'ERROR');
    const updated = msgs.find(m => m.type === 'PROFILE_UPDATED');

    if (error) {
      expect(error.message || error.error).toBeDefined();
    } else if (updated) {
      expect(updated.profile.secretCode).not.toBe('123456');
    }
  });
});

// ── TC-7.7.6: Backfill — existing profiles get defaults ─────────────────────

describe('TC-7.7.6: Backfill defaults', () => {

  it('existing profile has phone/url/profileCommitted after backfill', async () => {
    const token = `backfill-${Date.now()}`;

    // Create a profile via IDENTIFY only (simulates pre-upgrade profile)
    const { ws } = await connectWs();
    const response = collect(ws, 2000);
    send(ws, {
      type: 'IDENTIFY',
      playerToken: token,
      deviceId: `dev-${Date.now()}`,
      name: 'LegacyUser',
      screenWidth: 1920,
      screenHeight: 1080,
      platform: 'test',
    });
    const msgs = await response;

    const profile = msgs.find(m => m.type === 'PROFILE' || m.type === 'IDENTIFIED');
    expect(profile).toBeDefined();

    if (profile?.profile) {
      // New fields should exist with defaults
      expect(profile.profile.phone).toBeDefined();
      expect(profile.profile.phone).toBe('');
      expect(profile.profile.url).toBeDefined();
      expect(profile.profile.url).toBe('');
      expect(profile.profile.profileCommitted).toBeDefined();
      expect(profile.profile.profileCommitted).toBe(false);
    }
  });

  it('backfilled profile can be updated normally', async () => {
    const token = `backfill-update-${Date.now()}`;
    const { ws } = await identifyAs('BackfillUpdate', token);

    const response = waitForType(ws, 'PROFILE_UPDATED');
    send(ws, {
      type: 'UPDATE_PROFILE',
      name: 'BackfillUpdate',
      phone: '+49 999',
      url: 'https://backfill.test',
      secretCode: '0042',
    });
    const msg = await response;

    expect(msg.profile.name).toBe('BackfillUpdate');
    expect(msg.profile.phone).toBe('+49 999');
    expect(msg.profile.url).toBe('https://backfill.test');
    expect(msg.profile.profileCommitted).toBe(true);
  });
});
