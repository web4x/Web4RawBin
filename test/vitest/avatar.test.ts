/**
 * T48+T49: Avatar storage and serving tests
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
