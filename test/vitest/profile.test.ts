/**
 * Task 7.7: User Editor / Profile unit tests
 * Tests UPDATE_PROFILE, GET_USER_INFO, profileCommitted, secretCode validation, backfill.
 *
 * Unit tests — replicates handler logic from server.ts without requiring a running server.
 * Handler logic extracted from server.ts lines 796-818.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Replicate types from server.ts ──────────────────────────────────────────

interface UserProfile {
  token: string;
  name: string;
  phone: string;
  url: string;
  avatar: string;
  secretCode: string;
  profileCommitted: boolean;
  consolidatedFrom: string[];
  redirectTo?: string;
  bugReports: { date: string; text: string; status: string }[];
}

// ── Handler functions extracted from server.ts switch/case ───────────────────

function handleUpdateProfile(
  msg: any,
  clientId: string,
  tokenToClient: Map<string, string>,
  userProfiles: Map<string, UserProfile>,
  send: (data: any) => void,
): void {
  const myToken = [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
  if (!myToken) { send({ type: 'ERROR', message: 'Not identified' }); return; }
  const profile = userProfiles.get(myToken);
  if (!profile) { send({ type: 'ERROR', message: 'No profile' }); return; }
  if (typeof msg.name === 'string') profile.name = msg.name.slice(0, 20);
  if (typeof msg.phone === 'string') profile.phone = msg.phone.slice(0, 30);
  if (typeof msg.url === 'string') profile.url = msg.url.slice(0, 200);
  if (typeof msg.avatar === 'string') profile.avatar = msg.avatar.slice(0, 50000);
  if (typeof msg.secretCode === 'string' && /^\d{4}$/.test(msg.secretCode)) profile.secretCode = msg.secretCode;
  if (profile.name) profile.profileCommitted = true;
  send({ type: 'PROFILE_UPDATED', profile: { token: profile.token, name: profile.name, phone: profile.phone, url: profile.url, avatar: profile.avatar, secretCode: profile.secretCode, profileCommitted: profile.profileCommitted } });
}

function handleGetUserInfo(
  msg: any,
  userProfiles: Map<string, UserProfile>,
  send: (data: any) => void,
): void {
  const targetToken = msg.playerToken;
  if (!targetToken) { send({ type: 'ERROR', message: 'No token provided' }); return; }
  const target = userProfiles.get(targetToken);
  if (!target) { send({ type: 'ERROR', message: 'User not found' }); return; }
  send({ type: 'USER_INFO', user: { name: target.name, phone: target.phone, url: target.url, avatar: target.avatar, playerToken: target.token } });
}

function createProfile(token: string, name = ''): UserProfile {
  return {
    token, name, phone: '', url: '', avatar: '',
    secretCode: '0000', profileCommitted: false,
    consolidatedFrom: [], bugReports: [],
  };
}

function backfillProfile(raw: any): UserProfile {
  return {
    token: raw.token,
    name: raw.name || '',
    phone: raw.phone || '',
    url: raw.url || '',
    avatar: raw.avatar || '',
    secretCode: raw.secretCode || '0000',
    profileCommitted: raw.profileCommitted || false,
    consolidatedFrom: raw.consolidatedFrom || [],
    redirectTo: raw.redirectTo,
    bugReports: raw.bugReports || [],
  };
}

// ── Test fixtures ───────────────────────────────────────────────────────────

let userProfiles: Map<string, UserProfile>;
let tokenToClient: Map<string, string>;
let sent: any[];
let send: (data: any) => void;
const CLIENT_ID = 'client-1';
const TOKEN = 'test-token-42';

beforeEach(() => {
  userProfiles = new Map();
  tokenToClient = new Map();
  sent = [];
  send = (data: any) => sent.push(data);

  // Default: identified client with profile
  tokenToClient.set(TOKEN, CLIENT_ID);
  userProfiles.set(TOKEN, createProfile(TOKEN, 'TestUser'));
});

// ── TC-7.7.1: UPDATE_PROFILE saves all fields and returns PROFILE_UPDATED ───

describe('TC-7.7.1: UPDATE_PROFILE saves and responds', () => {

  it('UPDATE_PROFILE returns PROFILE_UPDATED with all fields', () => {
    handleUpdateProfile(
      { name: 'UpdatedName', phone: '+49 123 456', url: 'https://example.com', avatar: 'data:image/png;base64,abc', secretCode: '1234' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    expect(sent.length).toBe(1);
    const msg = sent[0];
    expect(msg.type).toBe('PROFILE_UPDATED');
    expect(msg.profile.name).toBe('UpdatedName');
    expect(msg.profile.phone).toBe('+49 123 456');
    expect(msg.profile.url).toBe('https://example.com');
    expect(msg.profile.avatar).toBe('data:image/png;base64,abc');
    expect(msg.profile.secretCode).toBe('1234');
  });

  it('updated fields persist in the Map', () => {
    handleUpdateProfile(
      { name: 'PersistName', phone: '+1 555 0100', url: 'https://persist.test', avatar: '', secretCode: '9876' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    const profile = userProfiles.get(TOKEN)!;
    expect(profile.name).toBe('PersistName');
    expect(profile.phone).toBe('+1 555 0100');
    expect(profile.url).toBe('https://persist.test');
    expect(profile.secretCode).toBe('9876');
  });

  it('partial update preserves other fields', () => {
    // Set all fields first
    handleUpdateProfile(
      { name: 'PartialUser', phone: '+49 111', url: 'https://first.test', avatar: 'avatar1', secretCode: '1111' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    sent = [];

    // Update only name
    handleUpdateProfile(
      { name: 'NewName' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    const msg = sent[0];
    expect(msg.profile.name).toBe('NewName');
    expect(msg.profile.phone).toBe('+49 111');
    expect(msg.profile.url).toBe('https://first.test');
    expect(msg.profile.avatar).toBe('avatar1');
    expect(msg.profile.secretCode).toBe('1111');
  });
});

// ── TC-7.7.2: profileCommitted set true when name non-empty ─────────────────

describe('TC-7.7.2: profileCommitted flag', () => {

  it('profileCommitted=false before any profile save', () => {
    const profile = createProfile('fresh-token');
    expect(profile.profileCommitted).toBe(false);
  });

  it('profileCommitted=true after UPDATE_PROFILE with non-empty name', () => {
    // Start with empty name
    userProfiles.set(TOKEN, createProfile(TOKEN, ''));

    handleUpdateProfile(
      { name: 'CommittedUser', phone: '', url: '', avatar: '', secretCode: '0000' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    const msg = sent[0];
    expect(msg.profile.profileCommitted).toBe(true);
    expect(userProfiles.get(TOKEN)!.profileCommitted).toBe(true);
  });

  it('profileCommitted stays false if name is empty', () => {
    userProfiles.set(TOKEN, createProfile(TOKEN, ''));

    handleUpdateProfile(
      { name: '', phone: '+49 222', url: '', avatar: '', secretCode: '0000' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    const msg = sent[0];
    expect(msg.profile.profileCommitted).toBe(false);
    expect(userProfiles.get(TOKEN)!.profileCommitted).toBe(false);
  });
});

// ── TC-7.7.3: GET_USER_INFO returns public subset only ──────────────────────

describe('TC-7.7.3: GET_USER_INFO public subset', () => {

  it('returns name, phone, url, avatar, playerToken', () => {
    const profile = createProfile('target-token', 'PublicUser');
    profile.phone = '+49 333';
    profile.url = 'https://public.test';
    profile.avatar = 'avatar-public';
    profile.secretCode = '5555';
    profile.bugReports = [{ date: '2026-01-01', text: 'a bug', status: 'open' }];
    userProfiles.set('target-token', profile);

    handleGetUserInfo({ playerToken: 'target-token' }, userProfiles, send);

    const msg = sent[0];
    expect(msg.type).toBe('USER_INFO');
    expect(msg.user.name).toBe('PublicUser');
    expect(msg.user.phone).toBe('+49 333');
    expect(msg.user.url).toBe('https://public.test');
    expect(msg.user.avatar).toBe('avatar-public');
    expect(msg.user.playerToken).toBe('target-token');
  });

  it('does NOT include secretCode', () => {
    const profile = createProfile('secret-target', 'SecretKeeper');
    profile.secretCode = '7777';
    userProfiles.set('secret-target', profile);

    handleGetUserInfo({ playerToken: 'secret-target' }, userProfiles, send);

    const info = sent[0].user;
    expect(info.secretCode).toBeUndefined();
  });

  it('does NOT include bugReports', () => {
    const profile = createProfile('bug-target', 'BugReporter');
    profile.bugReports = [{ date: '2026-01-01', text: 'test bug', status: 'open' }];
    userProfiles.set('bug-target', profile);

    handleGetUserInfo({ playerToken: 'bug-target' }, userProfiles, send);

    const info = sent[0].user;
    expect(info.bugReports).toBeUndefined();
    expect(info.consolidatedFrom).toBeUndefined();
  });

  it('does NOT include devices or redirectTo', () => {
    const profile = createProfile('device-target', 'DeviceUser');
    profile.redirectTo = 'other-token';
    userProfiles.set('device-target', profile);

    handleGetUserInfo({ playerToken: 'device-target' }, userProfiles, send);

    const info = sent[0].user;
    expect(info.devices).toBeUndefined();
    expect(info.redirectTo).toBeUndefined();
  });
});

// ── TC-7.7.4: GET_USER_INFO for unknown token returns error ─────────────────

describe('TC-7.7.4: GET_USER_INFO unknown token', () => {

  it('returns ERROR for non-existent token', () => {
    handleGetUserInfo({ playerToken: 'nonexistent-token-999' }, userProfiles, send);

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('ERROR');
    expect(sent[0].message).toBe('User not found');
  });

  it('returns ERROR for empty token', () => {
    handleGetUserInfo({ playerToken: '' }, userProfiles, send);

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('ERROR');
    expect(sent[0].message).toBe('No token provided');
  });

  it('returns ERROR for missing token field', () => {
    handleGetUserInfo({}, userProfiles, send);

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('ERROR');
    expect(sent[0].message).toBe('No token provided');
  });
});

// ── TC-7.7.5: secretCode validation — must be 4 digits ──────────────────────

describe('TC-7.7.5: secretCode validation', () => {

  it('accepts valid 4-digit code', () => {
    handleUpdateProfile(
      { name: 'ValidCode', secretCode: '4321' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    expect(sent[0].profile.secretCode).toBe('4321');
    expect(userProfiles.get(TOKEN)!.secretCode).toBe('4321');
  });

  it('rejects non-numeric code — keeps old code', () => {
    userProfiles.get(TOKEN)!.secretCode = '9999';

    handleUpdateProfile(
      { name: 'BadCode', secretCode: 'abcd' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    expect(sent[0].profile.secretCode).toBe('9999');
    expect(userProfiles.get(TOKEN)!.secretCode).toBe('9999');
  });

  it('rejects code shorter than 4 digits — keeps old code', () => {
    userProfiles.get(TOKEN)!.secretCode = '8888';

    handleUpdateProfile(
      { name: 'ShortCode', secretCode: '12' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    expect(sent[0].profile.secretCode).toBe('8888');
    expect(userProfiles.get(TOKEN)!.secretCode).toBe('8888');
  });

  it('rejects code longer than 4 digits — keeps old code', () => {
    userProfiles.get(TOKEN)!.secretCode = '7777';

    handleUpdateProfile(
      { name: 'LongCode', secretCode: '123456' },
      CLIENT_ID, tokenToClient, userProfiles, send,
    );

    expect(sent[0].profile.secretCode).toBe('7777');
    expect(userProfiles.get(TOKEN)!.secretCode).toBe('7777');
  });
});

// ── TC-7.7.6: Backfill — existing profiles get defaults ─────────────────────

describe('TC-7.7.6: Backfill defaults', () => {

  it('existing profile gets phone/url/profileCommitted defaults', () => {
    // Simulate a pre-upgrade profile from JSON (no phone, url, profileCommitted)
    const raw = {
      token: 'legacy-1',
      name: 'LegacyUser',
      avatar: 'old-avatar',
      secretCode: '1234',
      consolidatedFrom: [],
      bugReports: [],
    };
    const profile = backfillProfile(raw);

    expect(profile.phone).toBe('');
    expect(profile.url).toBe('');
    expect(profile.profileCommitted).toBe(false);
    expect(profile.name).toBe('LegacyUser');
    expect(profile.avatar).toBe('old-avatar');
    expect(profile.secretCode).toBe('1234');
  });

  it('backfilled profile can be updated normally', () => {
    const raw = { token: 'legacy-2', name: 'BackfillUpdate' };
    const profile = backfillProfile(raw);
    userProfiles.set('legacy-2', profile);
    tokenToClient.set('legacy-2', 'client-legacy');

    handleUpdateProfile(
      { name: 'BackfillUpdate', phone: '+49 999', url: 'https://backfill.test', secretCode: '0042' },
      'client-legacy', tokenToClient, userProfiles, send,
    );

    const msg = sent[0];
    expect(msg.type).toBe('PROFILE_UPDATED');
    expect(msg.profile.name).toBe('BackfillUpdate');
    expect(msg.profile.phone).toBe('+49 999');
    expect(msg.profile.url).toBe('https://backfill.test');
    expect(msg.profile.profileCommitted).toBe(true);
  });
});
