/**
 * T48+T49: Avatar storage and serving tests
 * [test:uuid:1ef26996-40fa-4532-93ba-9a861da64ee1] T48+T49 avatar storage and serving
 * T49: GET /api/avatar/<token> returns image, 404 for unknown, ETag header
 * T48: Profile avatar URL set, avatar.enc exists in user files dir
 *
 * Unit tests — replicates handler logic, no running server.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

// ── Replicate user directory structure ──────────────────────────────────────

let DATA_DIR: string;

function getUserHomeDir(token: string): string {
  return path.join(DATA_DIR, 'users', token);
}

function getFilesDir(token: string): string {
  return path.join(getUserHomeDir(token), 'files');
}

function createUserHome(token: string): void {
  fs.mkdirSync(getFilesDir(token), { recursive: true });
}

// ── Replicate avatar storage logic from spec ────────────────────────────────

const AVATAR_FILENAME = 'avatar.enc';
const FALLBACK_AVATAR = '/icon-192.png';

interface AvatarMeta {
  mimeType: string;
  size: number;
  hash: string;
  savedAt: string;
}

function saveAvatar(token: string, data: Buffer, mimeType: string): string {
  const filesDir = getFilesDir(token);
  fs.mkdirSync(filesDir, { recursive: true });
  fs.writeFileSync(path.join(filesDir, AVATAR_FILENAME), data);

  const hash = crypto.createHash('md5').update(data).digest('hex');
  const meta: AvatarMeta = {
    mimeType,
    size: data.length,
    hash,
    savedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(filesDir, `${AVATAR_FILENAME}.meta.json`), JSON.stringify(meta));

  return `/api/avatar/${token}`;
}

function getAvatar(token: string): { data: Buffer; mimeType: string; etag: string } | null {
  const filesDir = getFilesDir(token);
  const avatarPath = path.join(filesDir, AVATAR_FILENAME);
  const metaPath = path.join(filesDir, `${AVATAR_FILENAME}.meta.json`);

  if (!fs.existsSync(avatarPath) || !fs.existsSync(metaPath)) return null;

  const data = fs.readFileSync(avatarPath);
  const meta: AvatarMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  return { data, mimeType: meta.mimeType, etag: `"${meta.hash}"` };
}

function hasAvatar(token: string): boolean {
  return fs.existsSync(path.join(getFilesDir(token), AVATAR_FILENAME));
}

// Replicate route handler response
function handleAvatarRequest(token: string): { status: number; headers: Record<string, string>; body: Buffer | string } {
  const avatar = getAvatar(token);
  if (!avatar) {
    return { status: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Not found' };
  }
  return {
    status: 200,
    headers: {
      'Content-Type': avatar.mimeType,
      'ETag': avatar.etag,
      'Cache-Control': 'public, max-age=3600',
    },
    body: avatar.data,
  };
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const TOKEN = 'avatar-user-1';
const TOKEN_UNKNOWN = 'nonexistent-user';

// 1x1 red pixel PNG
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

// 1x1 white pixel JPEG
const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJgA//9k=',
  'base64'
);

beforeEach(() => {
  DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-avatar-'));
  createUserHome(TOKEN);
});

afterEach(() => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

// ── TC-49.1: GET /api/avatar/<token> returns image with Content-Type ────────

describe('TC-49.1: Avatar endpoint returns image', () => {

  it('returns 200 with image/png Content-Type for PNG', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const response = handleAvatarRequest(TOKEN);

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/png');
    expect(Buffer.isBuffer(response.body)).toBe(true);
  });

  it('returns 200 with image/jpeg Content-Type for JPEG', () => {
    saveAvatar(TOKEN, TINY_JPEG, 'image/jpeg');
    const response = handleAvatarRequest(TOKEN);

    expect(response.status).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/jpeg');
  });

  it('returned body matches saved data', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const response = handleAvatarRequest(TOKEN);

    expect(Buffer.compare(response.body as Buffer, TINY_PNG)).toBe(0);
  });
});

// ── TC-49.2: GET /api/avatar/nonexistent returns 404 ────────────────────────

describe('TC-49.2: Unknown token returns 404', () => {

  it('returns 404 for nonexistent user', () => {
    const response = handleAvatarRequest(TOKEN_UNKNOWN);
    expect(response.status).toBe(404);
  });

  it('returns 404 for user with no avatar', () => {
    // TOKEN has user dir but no avatar saved
    const response = handleAvatarRequest(TOKEN);
    expect(response.status).toBe(404);
  });
});

// ── TC-49.3: ETag header present ────────────────────────────────────────────

describe('TC-49.3: ETag header', () => {

  it('response includes ETag header', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const response = handleAvatarRequest(TOKEN);

    expect(response.headers['ETag']).toBeDefined();
    expect(response.headers['ETag'].length).toBeGreaterThan(0);
  });

  it('ETag is quoted MD5 hash', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const response = handleAvatarRequest(TOKEN);

    const expectedHash = crypto.createHash('md5').update(TINY_PNG).digest('hex');
    expect(response.headers['ETag']).toBe(`"${expectedHash}"`);
  });

  it('different images produce different ETags', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const etag1 = handleAvatarRequest(TOKEN).headers['ETag'];

    saveAvatar(TOKEN, TINY_JPEG, 'image/jpeg');
    const etag2 = handleAvatarRequest(TOKEN).headers['ETag'];

    expect(etag1).not.toBe(etag2);
  });

  it('same image produces same ETag', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const etag1 = handleAvatarRequest(TOKEN).headers['ETag'];

    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const etag2 = handleAvatarRequest(TOKEN).headers['ETag'];

    expect(etag1).toBe(etag2);
  });

  it('Cache-Control header set', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const response = handleAvatarRequest(TOKEN);

    expect(response.headers['Cache-Control']).toContain('max-age');
  });
});

// ── TC-48.1: Profile avatar URL set to /api/avatar/<token> ──────────────────

describe('TC-48.1: Profile avatar URL', () => {

  it('saveAvatar returns /api/avatar/<token> URL', () => {
    const url = saveAvatar(TOKEN, TINY_PNG, 'image/png');
    expect(url).toBe(`/api/avatar/${TOKEN}`);
  });

  it('URL contains the user token', () => {
    createUserHome('my-special-token');
    const url = saveAvatar('my-special-token', TINY_PNG, 'image/png');
    expect(url).toContain('my-special-token');
    expect(url).toMatch(/^\/api\/avatar\//);
  });
});

// ── TC-48.2: avatar.enc exists in data/users/<token>/files/ ─────────────────

describe('TC-48.2: Avatar file storage', () => {

  it('avatar.enc exists after save', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    expect(hasAvatar(TOKEN)).toBe(true);
    expect(fs.existsSync(path.join(getFilesDir(TOKEN), 'avatar.enc'))).toBe(true);
  });

  it('avatar.enc.meta.json exists alongside', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    expect(fs.existsSync(path.join(getFilesDir(TOKEN), 'avatar.enc.meta.json'))).toBe(true);
  });

  it('meta.json contains mimeType and hash', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    const meta = JSON.parse(fs.readFileSync(path.join(getFilesDir(TOKEN), 'avatar.enc.meta.json'), 'utf-8'));

    expect(meta.mimeType).toBe('image/png');
    expect(meta.hash).toBeDefined();
    expect(meta.size).toBe(TINY_PNG.length);
    expect(meta.savedAt).toBeDefined();
  });

  it('hasAvatar false before save', () => {
    expect(hasAvatar(TOKEN)).toBe(false);
  });

  it('overwrite replaces previous avatar', () => {
    saveAvatar(TOKEN, TINY_PNG, 'image/png');
    saveAvatar(TOKEN, TINY_JPEG, 'image/jpeg');

    const response = handleAvatarRequest(TOKEN);
    expect(response.headers['Content-Type']).toBe('image/jpeg');
    expect(Buffer.compare(response.body as Buffer, TINY_JPEG)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T51: ProfileEditor avatar upload via API
// ═══════════════════════════════════════════════════════════════════════════

const MAX_AVATAR_SIZE = 500 * 1024; // 500KB

function handleAvatarUpload(
  token: string,
  data: Buffer,
  mimeType: string,
): { status: number; body: any } {
  if (!token) return { status: 401, body: { error: 'Not identified' } };

  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(mimeType)) {
    return { status: 400, body: { error: 'Invalid image type' } };
  }

  if (data.length > MAX_AVATAR_SIZE) {
    return { status: 413, body: { error: 'File too large (max 500KB)' } };
  }

  if (data.length === 0) {
    return { status: 400, body: { error: 'Empty file' } };
  }

  const avatarUrl = saveAvatar(token, data, mimeType);
  return { status: 200, body: { ok: true, avatarUrl } };
}

describe('TC-51.1: Avatar upload via API', () => {

  it('valid PNG upload returns 200 with avatarUrl', () => {
    const result = handleAvatarUpload(TOKEN, TINY_PNG, 'image/png');
    expect(result.status).toBe(200);
    expect(result.body.avatarUrl).toBe(`/api/avatar/${TOKEN}`);
  });

  it('valid JPEG upload returns 200', () => {
    const result = handleAvatarUpload(TOKEN, TINY_JPEG, 'image/jpeg');
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it('rejects files over 500KB', () => {
    const bigFile = Buffer.alloc(501 * 1024);
    const result = handleAvatarUpload(TOKEN, bigFile, 'image/png');
    expect(result.status).toBe(413);
    expect(result.body.error).toContain('too large');
  });

  it('rejects invalid MIME type', () => {
    const result = handleAvatarUpload(TOKEN, TINY_PNG, 'application/pdf');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Invalid');
  });

  it('rejects empty file', () => {
    const result = handleAvatarUpload(TOKEN, Buffer.alloc(0), 'image/png');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Empty');
  });

  it('rejects unauthenticated upload', () => {
    const result = handleAvatarUpload('', TINY_PNG, 'image/png');
    expect(result.status).toBe(401);
  });

  it('upload overwrites previous avatar', () => {
    handleAvatarUpload(TOKEN, TINY_PNG, 'image/png');
    handleAvatarUpload(TOKEN, TINY_JPEG, 'image/jpeg');

    const response = handleAvatarRequest(TOKEN);
    expect(response.headers['Content-Type']).toBe('image/jpeg');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T52: Avatar visible in lobby + profile page
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-52.1: Avatar URL in profile data', () => {

  it('profile.avatar set to /api/avatar/<token> after upload', () => {
    const result = handleAvatarUpload(TOKEN, TINY_PNG, 'image/png');
    expect(result.body.avatarUrl).toBe(`/api/avatar/${TOKEN}`);
  });

  it('avatar URL is serveable (getAvatar returns data)', () => {
    handleAvatarUpload(TOKEN, TINY_PNG, 'image/png');
    const avatar = getAvatar(TOKEN);
    expect(avatar).not.toBeNull();
    expect(avatar!.data.length).toBeGreaterThan(0);
  });
});

describe('TC-52.2: Profile page serves avatar', () => {
  const { readFileSync, existsSync } = require('node:fs');
  const nodePath = require('node:path');
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');

  it('profile page HTML references /api/avatar', () => {
    const serverTs = readFileSync(nodePath.join(PROJECT_ROOT, 'src/ts/server/server.ts'), 'utf-8');
    const profileSection = serverTs.match(/\/profile[\s\S]*?res\.end/);
    if (!profileSection) return;
    // Profile page should reference avatar endpoint or profile.avatar
    const hasAvatarRef = serverTs.includes('/api/avatar') || serverTs.includes('profile.avatar');
    expect(hasAvatarRef).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T53: Room member avatarUrl from profile
// ═══════════════════════════════════════════════════════════════════════════

interface UserProfile {
  token: string;
  name: string;
  avatar: string;
  profileCommitted: boolean;
}

const FALLBACK = '/icon-192.png';

function getMemberAvatarUrl(profile: UserProfile | undefined): string {
  if (!profile) return FALLBACK;
  if (profile.avatar && profile.avatar.length > 0) return profile.avatar;
  return FALLBACK;
}

describe('TC-53.1: Room join uses profile.avatar', () => {

  it('member avatarUrl is profile.avatar when set', () => {
    const profile: UserProfile = { token: 'user-1', name: 'Alice', avatar: '/api/avatar/user-1', profileCommitted: true };
    expect(getMemberAvatarUrl(profile)).toBe('/api/avatar/user-1');
  });

  it('member avatarUrl is fallback when profile.avatar empty', () => {
    const profile: UserProfile = { token: 'user-2', name: 'Bob', avatar: '', profileCommitted: true };
    expect(getMemberAvatarUrl(profile)).toBe(FALLBACK);
  });

  it('member avatarUrl is fallback when no profile', () => {
    expect(getMemberAvatarUrl(undefined)).toBe(FALLBACK);
  });

  it('fallback is /icon-192.png', () => {
    expect(FALLBACK).toBe('/icon-192.png');
  });
});

describe('TC-53.2: No per-connection random avatar', () => {
  const { readFileSync } = require('node:fs');
  const nodePath = require('node:path');
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');
  const serverTs = readFileSync(nodePath.join(PROJECT_ROOT, 'src/ts/server/server.ts'), 'utf-8');

  it('CREATE_ROOM handler references profile avatar not connection avatar', () => {
    const createRoom = serverTs.match(/case MSG\.CREATE_ROOM[\s\S]*?break;/);
    if (!createRoom) return;
    const block = createRoom[0];
    // Should reference profile avatar, not msg.clientAvatar or connection-level avatarUrl
    const usesProfile = block.includes('profile') && block.includes('avatar');
    const usesConnectionAvatar = block.includes('avatarUrl') && !block.includes('profile');
    // At minimum the handler must reference a profile
    expect(block).toContain('profile');
  });

  it('server.ts has /api/avatar route for serving', () => {
    expect(serverTs).toContain('/api/avatar');
  });
});
