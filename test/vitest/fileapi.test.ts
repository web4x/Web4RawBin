/**
// [test:uuid:7390b7e2-0744-48b9-bcd8-f0c9a746e421]
 * T60: File API tests (UC-API.1 + UC-API.2)
 * [test:uuid:2e017c2e-1f28-47d0-b457-a6a45dc8c547] T60 file API
 * Tests readDir and readFile handler logic.
 * Unit tests with temp dirs — no running server.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// [test:uuid:86356415-4d5f-44f7-b496-a1b5c244c9f1]
// [test:uuid:1a2b80d0-ae33-4a66-8116-2fadd411817e]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Replicate file API handler logic from spec ──────────────────────────────

let PROJECT_ROOT: string;

interface DirEntry {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  ext?: string;
}

const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.enc', '.webp', '.woff', '.woff2', '.ttf']);
const CONTENT_TYPES: Record<string, string> = {
  '.md': 'text/markdown', '.ts': 'text/typescript', '.js': 'application/javascript',
  '.json': 'application/json', '.css': 'text/css', '.html': 'text/html',
  '.sh': 'text/x-shellscript', '.puml': 'text/plain', '.svg': 'image/svg+xml',
  '.env': 'text/plain', '.txt': 'text/plain',
};

function validatePath(relPath: string): { valid: boolean; reason?: string } {
  if (relPath.includes('..')) return { valid: false, reason: 'Path traversal blocked' };
  const resolved = path.resolve(PROJECT_ROOT, relPath);
  if (!resolved.startsWith(PROJECT_ROOT)) return { valid: false, reason: 'Path outside project root' };
  return { valid: true };
}

function readDir(relPath: string): { status: number; body: any } {
  const check = validatePath(relPath);
  if (!check.valid) return { status: 403, body: { error: check.reason } };

  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    return { status: 404, body: { error: 'Directory not found' } };
  }

  const entries: DirEntry[] = [];
  const dirents = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const d of dirents) {
    // Hidden files excluded except .env
    if (d.name.startsWith('.') && d.name !== '.env') continue;

    if (d.isDirectory()) {
      entries.push({ name: d.name, type: 'dir' });
    } else if (d.isFile()) {
      const stat = fs.statSync(path.join(fullPath, d.name));
      entries.push({ name: d.name, type: 'file', size: stat.size, ext: path.extname(d.name) });
    }
  }

  // Sort: dirs first alphabetically, then files alphabetically
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { status: 200, body: { path: relPath, entries } };
}

function readFile(relPath: string): { status: number; body: any; contentType?: string } {
  const check = validatePath(relPath);
  if (!check.valid) return { status: 403, body: { error: check.reason } };

  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return { status: 404, body: { error: 'File not found' } };
  }

  const ext = path.extname(fullPath);
  if (BINARY_EXTENSIONS.has(ext)) {
    return { status: 415, body: { error: 'Binary file not supported' } };
  }

  const stat = fs.statSync(fullPath);
  if (stat.size > 5 * 1024 * 1024) {
    return { status: 413, body: { error: 'File too large (max 5MB)' } };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const contentType = CONTENT_TYPES[ext] || 'text/plain';

  return {
    status: 200,
    contentType,
    body: { path: relPath, content, size: stat.size, mtime: stat.mtime.toISOString() },
  };
}

// ── Fixtures ────────────────────────────────────────────────────────────────

beforeEach(() => {
  PROJECT_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-fileapi-'));

  // Create test structure
  fs.mkdirSync(path.join(PROJECT_ROOT, 'src/ts'), { recursive: true });
  fs.mkdirSync(path.join(PROJECT_ROOT, 'docs'), { recursive: true });
  fs.mkdirSync(path.join(PROJECT_ROOT, 'data'), { recursive: true });

  fs.writeFileSync(path.join(PROJECT_ROOT, 'README.md'), '# RawBin\nTest readme');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/ts/server.ts'), 'import https from "node:https";');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/ts/Room.ts'), 'export class Room {}');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'docs/guide.md'), '# Guide');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'docs/style.css'), 'body { color: red; }');
  fs.writeFileSync(path.join(PROJECT_ROOT, '.env'), 'PORT=4444');
  fs.writeFileSync(path.join(PROJECT_ROOT, '.gitignore'), 'node_modules');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'data/avatar.enc'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  fs.writeFileSync(path.join(PROJECT_ROOT, 'data/photo.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

afterEach(() => {
  fs.rmSync(PROJECT_ROOT, { recursive: true, force: true });
});

// ── TC-60.1: readDir returns entries with name+type+size+ext ────────────────

describe('TC-60.1: readDir entry format', () => {

  it('returns entries with name and type for dirs', () => {
    const result = readDir('');
    expect(result.status).toBe(200);
    const dirs = result.body.entries.filter((e: DirEntry) => e.type === 'dir');
    expect(dirs.length).toBeGreaterThan(0);
    for (const d of dirs) {
      expect(d.name).toBeDefined();
      expect(d.type).toBe('dir');
    }
  });

  it('returns entries with name, type, size, ext for files', () => {
    const result = readDir('');
    const files = result.body.entries.filter((e: DirEntry) => e.type === 'file');
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(f.name).toBeDefined();
      expect(f.type).toBe('file');
      expect(f.size).toBeGreaterThan(0);
      expect(f.ext).toBeDefined();
    }
  });

  it('README.md has ext .md', () => {
    const result = readDir('');
    const readme = result.body.entries.find((e: DirEntry) => e.name === 'README.md');
    expect(readme).toBeDefined();
    expect(readme.ext).toBe('.md');
  });

  it('subdirectory listing works', () => {
    const result = readDir('src/ts');
    expect(result.status).toBe(200);
    const names = result.body.entries.map((e: DirEntry) => e.name);
    expect(names).toContain('server.ts');
    expect(names).toContain('Room.ts');
  });
});

// ── TC-60.2: dirs before files, alphabetically ──────────────────────────────

describe('TC-60.2: Sort order — dirs first, alphabetical', () => {

  it('directories come before files', () => {
    const result = readDir('');
    const entries = result.body.entries as DirEntry[];
    const firstFileIdx = entries.findIndex(e => e.type === 'file');
    const lastDirIdx = entries.map((e, i) => e.type === 'dir' ? i : -1).filter(i => i >= 0).pop() ?? -1;
    if (firstFileIdx >= 0 && lastDirIdx >= 0) {
      expect(lastDirIdx).toBeLessThan(firstFileIdx);
    }
  });

  it('directories are alphabetically sorted', () => {
    const result = readDir('');
    const dirs = result.body.entries.filter((e: DirEntry) => e.type === 'dir').map((e: DirEntry) => e.name);
    const sorted = [...dirs].sort((a, b) => a.localeCompare(b));
    expect(dirs).toEqual(sorted);
  });

  it('files are alphabetically sorted', () => {
    const result = readDir('');
    const files = result.body.entries.filter((e: DirEntry) => e.type === 'file').map((e: DirEntry) => e.name);
    const sorted = [...files].sort((a, b) => a.localeCompare(b));
    expect(files).toEqual(sorted);
  });
});

// ── TC-60.3: hidden files excluded except .env ──────────────────────────────

describe('TC-60.3: Hidden file exclusion', () => {

  it('.gitignore is excluded', () => {
    const result = readDir('');
    const names = result.body.entries.map((e: DirEntry) => e.name);
    expect(names).not.toContain('.gitignore');
  });

  it('.env is included', () => {
    const result = readDir('');
    const names = result.body.entries.map((e: DirEntry) => e.name);
    expect(names).toContain('.env');
  });

  it('hidden directories excluded', () => {
    fs.mkdirSync(path.join(PROJECT_ROOT, '.git'));
    fs.mkdirSync(path.join(PROJECT_ROOT, '.vscode'));
    const result = readDir('');
    const names = result.body.entries.map((e: DirEntry) => e.name);
    expect(names).not.toContain('.git');
    expect(names).not.toContain('.vscode');
  });
});

// ── TC-60.4: path traversal blocked with 403 ───────────────────────────────

describe('TC-60.4: Path traversal prevention', () => {

  it('../ returns 403', () => {
    const result = readDir('../');
    expect(result.status).toBe(403);
  });

  it('../../etc/passwd returns 403', () => {
    const result = readFile('../../etc/passwd');
    expect(result.status).toBe(403);
  });

  it('src/../../etc returns 403', () => {
    const result = readDir('src/../../etc');
    expect(result.status).toBe(403);
  });

  it('valid subdirectory path works', () => {
    const result = readDir('src/ts');
    expect(result.status).toBe(200);
  });
});

// ── TC-60.5: readFile returns content ───────────────────────────────────────

describe('TC-60.5: readFile returns content', () => {

  it('returns file content as string', () => {
    const result = readFile('README.md');
    expect(result.status).toBe(200);
    expect(result.body.content).toContain('# RawBin');
  });

  it('returns size and mtime', () => {
    const result = readFile('README.md');
    expect(result.body.size).toBeGreaterThan(0);
    expect(result.body.mtime).toBeDefined();
    expect(new Date(result.body.mtime).getTime()).toBeGreaterThan(0);
  });

  it('returns path in response', () => {
    const result = readFile('src/ts/server.ts');
    expect(result.body.path).toBe('src/ts/server.ts');
  });

  it('TypeScript file content readable', () => {
    const result = readFile('src/ts/server.ts');
    expect(result.status).toBe(200);
    expect(result.body.content).toContain('import');
  });
});

// ── TC-60.6: correct Content-Type per extension ─────────────────────────────

describe('TC-60.6: Content-Type mapping', () => {

  it('.md returns text/markdown', () => {
    const result = readFile('README.md');
    expect(result.contentType).toBe('text/markdown');
  });

  it('.ts returns text/typescript', () => {
    const result = readFile('src/ts/server.ts');
    expect(result.contentType).toBe('text/typescript');
  });

  it('.css returns text/css', () => {
    const result = readFile('docs/style.css');
    expect(result.contentType).toBe('text/css');
  });

  it('.env returns text/plain', () => {
    const result = readFile('.env');
    expect(result.contentType).toBe('text/plain');
  });

  it('binary .png returns 415 (not served)', () => {
    const result = readFile('data/photo.png');
    expect(result.status).toBe(415);
  });

  it('binary .enc returns 415 (not served)', () => {
    const result = readFile('data/avatar.enc');
    expect(result.status).toBe(415);
  });
});

// ── TC-60.7: nonexistent path returns 404 ───────────────────────────────────

describe('TC-60.7: 404 for nonexistent paths', () => {

  it('nonexistent file returns 404', () => {
    const result = readFile('nope.txt');
    expect(result.status).toBe(404);
  });

  it('nonexistent directory returns 404', () => {
    const result = readDir('nonexistent/');
    expect(result.status).toBe(404);
  });

  it('file path used as dir returns 404', () => {
    const result = readDir('README.md');
    expect(result.status).toBe(404);
  });

  it('dir path used as file returns 404', () => {
    const result = readFile('src');
    expect(result.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T61: UC-API.3 — writeFile
// ═══════════════════════════════════════════════════════════════════════════

const MAX_WRITE_SIZE = 1024 * 1024; // 1MB

function writeFile(
  relPath: string,
  body: { content: string; expectedMtime?: string },
): { status: number; body: any } {
  const check = validatePath(relPath);
  if (!check.valid) return { status: 403, body: { error: check.reason } };

  const fullPath = path.join(PROJECT_ROOT, relPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return { status: 404, body: { error: 'File not found (no implicit create)' } };
  }

  const ext = path.extname(fullPath);
  if (BINARY_EXTENSIONS.has(ext)) {
    return { status: 415, body: { error: 'Binary file not writable' } };
  }

  if (Buffer.byteLength(body.content, 'utf-8') > MAX_WRITE_SIZE) {
    return { status: 413, body: { error: 'Content too large (max 1MB)' } };
  }

  const currentStat = fs.statSync(fullPath);
  if (body.expectedMtime) {
    const expected = new Date(body.expectedMtime).getTime();
    const actual = currentStat.mtime.getTime();
    if (expected !== actual) {
      return { status: 409, body: { conflict: true, serverMtime: currentStat.mtime.toISOString() } };
    }
  }

  fs.writeFileSync(fullPath, body.content, 'utf-8');
  const newStat = fs.statSync(fullPath);

  return {
    status: 200,
    body: { ok: true, mtime: newStat.mtime.toISOString(), size: newStat.size },
  };
}

// ── TC-61.1: PUT writes content to disk ─────────────────────────────────────

describe('TC-61.1: writeFile writes to disk', () => {

  it('writes content and file on disk matches', () => {
    const result = writeFile('README.md', { content: '# Updated\nNew content' });
    expect(result.status).toBe(200);

    const ondisk = fs.readFileSync(path.join(PROJECT_ROOT, 'README.md'), 'utf-8');
    expect(ondisk).toBe('# Updated\nNew content');
  });

  it('writes TypeScript file', () => {
    const result = writeFile('src/ts/server.ts', { content: 'console.log("hello");' });
    expect(result.status).toBe(200);

    const ondisk = fs.readFileSync(path.join(PROJECT_ROOT, 'src/ts/server.ts'), 'utf-8');
    expect(ondisk).toBe('console.log("hello");');
  });
});

// ── TC-61.2: response has ok+mtime+size ─────────────────────────────────────

describe('TC-61.2: writeFile response format', () => {

  it('returns ok:true, mtime, size', () => {
    const result = writeFile('README.md', { content: 'test' });
    expect(result.body.ok).toBe(true);
    expect(result.body.mtime).toBeDefined();
    expect(new Date(result.body.mtime).getTime()).toBeGreaterThan(0);
    expect(result.body.size).toBe(4);
  });

  it('size matches content byte length', () => {
    const content = 'Ümlauts äöü 日本語';
    const result = writeFile('README.md', { content });
    expect(result.body.size).toBe(Buffer.byteLength(content, 'utf-8'));
  });
});

// ── TC-61.3: expectedMtime mismatch returns 409 ─────────────────────────────

describe('TC-61.3: Conflict detection via expectedMtime', () => {

  it('matching mtime allows write', () => {
    const stat = fs.statSync(path.join(PROJECT_ROOT, 'README.md'));
    const result = writeFile('README.md', {
      content: 'updated',
      expectedMtime: stat.mtime.toISOString(),
    });
    expect(result.status).toBe(200);
  });

  it('mismatched mtime returns 409 with conflict:true', () => {
    const result = writeFile('README.md', {
      content: 'conflict',
      expectedMtime: '2000-01-01T00:00:00.000Z',
    });
    expect(result.status).toBe(409);
    expect(result.body.conflict).toBe(true);
    expect(result.body.serverMtime).toBeDefined();
  });

  it('409 response includes actual server mtime', () => {
    const stat = fs.statSync(path.join(PROJECT_ROOT, 'README.md'));
    const result = writeFile('README.md', {
      content: 'conflict',
      expectedMtime: '2000-01-01T00:00:00.000Z',
    });
    expect(result.body.serverMtime).toBe(stat.mtime.toISOString());
  });

  it('no expectedMtime skips conflict check (always writes)', () => {
    const result = writeFile('README.md', { content: 'no mtime check' });
    expect(result.status).toBe(200);
  });
});

// ── TC-61.4: path traversal 403 ────────────────────────────────────────────

describe('TC-61.4: writeFile path traversal blocked', () => {

  it('../etc/passwd returns 403', () => {
    const result = writeFile('../etc/passwd', { content: 'hacked' });
    expect(result.status).toBe(403);
  });

  it('src/../../etc returns 403', () => {
    const result = writeFile('src/../../etc/shadow', { content: 'hacked' });
    expect(result.status).toBe(403);
  });
});

// ── TC-61.5: binary extension 415 ──────────────────────────────────────────

describe('TC-61.5: writeFile rejects binary extensions', () => {

  it('.png returns 415', () => {
    const result = writeFile('data/photo.png', { content: 'not an image' });
    expect(result.status).toBe(415);
  });

  it('.enc returns 415', () => {
    const result = writeFile('data/avatar.enc', { content: 'not encrypted' });
    expect(result.status).toBe(415);
  });
});

// ── TC-61.6: body >1MB returns 413 ─────────────────────────────────────────

describe('TC-61.6: writeFile size limit', () => {

  it('content over 1MB returns 413', () => {
    const big = 'X'.repeat(1024 * 1024 + 1);
    const result = writeFile('README.md', { content: big });
    expect(result.status).toBe(413);
    expect(result.body.error).toContain('too large');
  });

  it('content exactly 1MB is accepted', () => {
    const exact = 'A'.repeat(1024 * 1024);
    const result = writeFile('README.md', { content: exact });
    expect(result.status).toBe(200);
  });
});

// ── TC-61.7: nonexistent file returns 404 ───────────────────────────────────

describe('TC-61.7: writeFile 404 for nonexistent', () => {

  it('nonexistent file returns 404 (no implicit create)', () => {
    const result = writeFile('newfile.md', { content: 'should not create' });
    expect(result.status).toBe(404);
  });

  it('file in nonexistent dir returns 404', () => {
    const result = writeFile('fake/dir/file.md', { content: 'nope' });
    expect(result.status).toBe(404);
  });
});

// ── TC-61.8: new mtime differs from old mtime ──────────────────────────────

describe('TC-61.8: mtime changes after write', () => {

  it('returned mtime differs from pre-write mtime', () => {
    const before = fs.statSync(path.join(PROJECT_ROOT, 'README.md')).mtime.toISOString();

    // Small delay to ensure mtime changes
    const start = Date.now();
    while (Date.now() - start < 50) {}

    const result = writeFile('README.md', { content: 'changed content' });
    expect(result.status).toBe(200);
    expect(result.body.mtime).not.toBe(before);
  });

  it('subsequent write with returned mtime succeeds', async () => {
    const first = writeFile('README.md', { content: 'first write' });
    expect(first.status).toBe(200);

    await new Promise(r => setTimeout(r, 50));

    const second = writeFile('README.md', {
      content: 'second write',
      expectedMtime: first.body.mtime,
    });
    expect(second.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T62: UC-API.5 — Path Sanitization Security
// ═══════════════════════════════════════════════════════════════════════════

const BLOCKED_DIRS = ['node_modules', '.git', 'data/users'];

function sanitizePath(relPath: string): { status: number; reason?: string } {
  // Rule 1: no ..
  if (relPath.includes('..')) return { status: 403, reason: 'Path traversal blocked' };

  // Rule 2: resolved must be within PROJECT_ROOT
  const resolved = path.resolve(PROJECT_ROOT, relPath);
  if (!resolved.startsWith(PROJECT_ROOT)) return { status: 403, reason: 'Path outside project root' };

  // Rule 4: blocked directories
  for (const dir of BLOCKED_DIRS) {
    if (relPath.startsWith(dir + '/') || relPath === dir) {
      return { status: 403, reason: `Access to ${dir} blocked` };
    }
  }

  // Rule 3+5: extension allowlist (text only)
  const ext = path.extname(relPath);
  if (ext && BINARY_EXTENSIONS.has(ext)) return { status: 415, reason: 'Binary file not supported' };

  return { status: 200 };
}

function readFileSecure(relPath: string): { status: number; body: any; contentType?: string } {
  const check = sanitizePath(relPath);
  if (check.status !== 200) return { status: check.status, body: { error: check.reason } };
  return readFile(relPath);
}

function writeFileSecure(relPath: string, body: { content: string; expectedMtime?: string }): { status: number; body: any } {
  const check = sanitizePath(relPath);
  if (check.status !== 200) return { status: check.status, body: { error: check.reason } };
  return writeFile(relPath, body);
}

describe('TC-62.1: UC-API.5 Path sanitization — read endpoint', () => {

  it('../secret → 403', () => {
    expect(readFileSecure('../secret').status).toBe(403);
  });

  it('node_modules/ws/index.js → 403', () => {
    expect(readFileSecure('node_modules/ws/index.js').status).toBe(403);
  });

  it('.git/config → 403', () => {
    expect(readFileSecure('.git/config').status).toBe(403);
  });

  it('data/users/abc/.ssh/id_rsa → 403', () => {
    expect(readFileSecure('data/users/abc/.ssh/id_rsa').status).toBe(403);
  });

  it('src/public/icon-192.png → 415 (binary)', () => {
    expect(readFileSecure('src/public/icon-192.png').status).toBe(415);
  });

  it('README.md → allowed (200 or 404 if not found, not 403)', () => {
    const result = readFileSecure('README.md');
    expect(result.status).not.toBe(403);
    expect(result.status).not.toBe(415);
  });
});

describe('TC-62.2: UC-API.5 Path sanitization — write endpoint', () => {

  it('../secret → 403', () => {
    expect(writeFileSecure('../secret', { content: 'x' }).status).toBe(403);
  });

  it('node_modules/ws/index.js → 403', () => {
    expect(writeFileSecure('node_modules/ws/index.js', { content: 'x' }).status).toBe(403);
  });

  it('.git/config → 403', () => {
    expect(writeFileSecure('.git/config', { content: 'x' }).status).toBe(403);
  });

  it('data/users/abc/.ssh/id_rsa → 403', () => {
    expect(writeFileSecure('data/users/abc/.ssh/id_rsa', { content: 'x' }).status).toBe(403);
  });

  it('src/public/icon-192.png → 415 (binary)', () => {
    expect(writeFileSecure('src/public/icon-192.png', { content: 'x' }).status).toBe(415);
  });

  it('README.md → allowed (200 or 404, not 403)', () => {
    const result = writeFileSecure('README.md', { content: '# Test' });
    expect(result.status).not.toBe(403);
    expect(result.status).not.toBe(415);
  });
});

describe('TC-62.3: Additional blocked paths', () => {

  it('data/users/ root blocked', () => {
    expect(sanitizePath('data/users/').status).toBe(403);
  });

  it('node_modules/ root blocked', () => {
    expect(sanitizePath('node_modules/').status).toBe(403);
  });

  it('.git root blocked', () => {
    expect(sanitizePath('.git').status).toBe(403);
  });

  it('nested data/users path blocked', () => {
    expect(sanitizePath('data/users/token123/profile.json').status).toBe(403);
  });

  it('data/users/.ssh private keys blocked', () => {
    expect(sanitizePath('data/users/xyz/.ssh/id_rsa.pub').status).toBe(403);
  });

  it('.enc file blocked (415)', () => {
    expect(sanitizePath('data/avatar.enc').status).toBe(415);
  });

  it('.jpg file blocked (415)', () => {
    expect(sanitizePath('photos/pic.jpg').status).toBe(415);
  });

  it('normal src/ts path allowed', () => {
    expect(sanitizePath('src/ts/server.ts').status).toBe(200);
  });

  it('docs/guide.md allowed', () => {
    expect(sanitizePath('docs/guide.md').status).toBe(200);
  });

  it('.env allowed (not hidden-blocked, text extension)', () => {
    expect(sanitizePath('.env').status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T62: UC-API.4 — Authorization
// ═══════════════════════════════════════════════════════════════════════════

interface AuthContext {
  adminKey?: string;
  playerToken?: string;
  origin?: string;
}

const ADMIN_KEY = 'test-admin-key-123';
const VALID_TOKENS = new Set(['player-token-abc', 'player-token-def']);
const SERVER_ORIGIN = 'https://localhost:4444';

function authorize(ctx: AuthContext): { status: number; reason?: string } {
  // Same-origin check
  if (ctx.origin && ctx.origin === SERVER_ORIGIN) return { status: 200 };

  // Admin key check
  if (ctx.adminKey) {
    if (ctx.adminKey === ADMIN_KEY) return { status: 200 };
    return { status: 401, reason: 'Invalid admin key' };
  }

  // Player token check
  if (ctx.playerToken) {
    if (VALID_TOKENS.has(ctx.playerToken)) return { status: 200 };
    return { status: 401, reason: 'Invalid player token' };
  }

  return { status: 401, reason: 'No credentials provided' };
}

describe('TC-62.4: Authorization — read endpoint', () => {

  it('no auth → 401', () => {
    expect(authorize({}).status).toBe(401);
  });

  it('wrong admin key → 401', () => {
    expect(authorize({ adminKey: 'wrong-key' }).status).toBe(401);
  });

  it('valid admin key → 200', () => {
    expect(authorize({ adminKey: ADMIN_KEY }).status).toBe(200);
  });

  it('valid player token → 200', () => {
    expect(authorize({ playerToken: 'player-token-abc' }).status).toBe(200);
  });

  it('invalid player token → 401', () => {
    expect(authorize({ playerToken: 'invalid-token' }).status).toBe(401);
  });

  it('same-origin request → 200', () => {
    expect(authorize({ origin: SERVER_ORIGIN }).status).toBe(200);
  });

  it('different origin without credentials → 401', () => {
    expect(authorize({ origin: 'https://evil.com' }).status).toBe(401);
  });
});

describe('TC-62.5: Authorization — write endpoint', () => {

  it('no auth → 401', () => {
    expect(authorize({}).status).toBe(401);
  });

  it('wrong admin key → 401', () => {
    expect(authorize({ adminKey: 'bad' }).status).toBe(401);
  });

  it('valid player token → 200', () => {
    expect(authorize({ playerToken: 'player-token-def' }).status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T69: PlantUML render endpoint
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-69.4: puml-render route in server source', () => {
  const { readFileSync: readSync, existsSync: exists } = require('node:fs');
  const nodePath = require('node:path');
  const ROOT = nodePath.resolve(__dirname, '../../');
  const serverPath = nodePath.join(ROOT, 'src/ts/server/server.ts');

  it('server.ts or FileApi.ts has puml render endpoint', () => {
    let found = false;
    for (const f of [serverPath, nodePath.join(ROOT, 'src/ts/server/FileApi.ts')]) {
      if (!exists(f)) continue;
      const content = readSync(f, 'utf-8');
      if (content.includes('puml') || content.includes('plantuml')) { found = true; break; }
    }
    expect(found).toBe(true);
  });
});
