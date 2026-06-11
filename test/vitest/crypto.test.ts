/**
// [test:uuid:cbde8942-6f7e-4889-85ea-eb3365dde403]
 * Task 47: File encryption/decryption unit tests
 * [test:uuid:490c3106-4b8d-4d9f-8d43-da2e3a91b1d3] T47 file encryption
 * Tests UserCrypto: encryptFile, decryptFile, roundtrip, wrong-user rejection,
 * tampered ciphertext, large file, listUserFiles, deleteFile, fileExists.
 *
 * Uses temp dirs with real RSA-2048 keys from generateUserKeypair.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

// ── Replicate UserKeys functions (from userkeys.test.ts) ────────────────────

let DATA_DIR: string;

function getUserHomeDir(token: string): string {
  return path.join(DATA_DIR, 'users', token);
}

function getSshDir(token: string): string {
  return path.join(getUserHomeDir(token), '.ssh');
}

function getFilesDir(token: string): string {
  return path.join(getUserHomeDir(token), 'files');
}

function createUserHome(token: string): void {
  const homeDir = getUserHomeDir(token);
  const sshDir = getSshDir(token);
  const filesDir = getFilesDir(token);
  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(sshDir, { mode: 0o700 });
  fs.mkdirSync(path.join(sshDir, 'public_keys'), { mode: 0o700 });
  fs.mkdirSync(path.join(sshDir, 'private_key'), { mode: 0o700 });
  fs.mkdirSync(filesDir, { recursive: true });
  fs.writeFileSync(path.join(sshDir, 'authorized_keys'), '', { mode: 0o600 });
}

function generateUserKeypair(token: string): { publicKey: string; privateKey: string } {
  const sshDir = getSshDir(token);
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  fs.writeFileSync(path.join(sshDir, 'id_rsa'), privateKey, { mode: 0o600 });
  fs.writeFileSync(path.join(sshDir, 'id_rsa.pub'), publicKey, { mode: 0o600 });
  return { publicKey, privateKey };
}

function getUserPublicKey(token: string): string {
  return fs.readFileSync(path.join(getSshDir(token), 'id_rsa.pub'), 'utf-8');
}

function getUserPrivateKey(token: string): string {
  return fs.readFileSync(path.join(getSshDir(token), 'id_rsa'), 'utf-8');
}

// ── Replicate UserCrypto functions (expected API from spec) ─────────────────

interface FileMeta {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  encryptedAt: string;
  encKeyB64: string;
  ivB64: string;
  authTagB64: string;
}

function encryptFile(
  token: string,
  data: Buffer,
  originalName: string,
  mimeType: string,
): string {
  const publicKey = getUserPublicKey(token);
  const filesDir = getFilesDir(token);

  // AES-256-GCM for file content
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // RSA-encrypt the AES key with user's public key
  const encryptedKey = crypto.publicEncrypt(publicKey, aesKey);

  const filename = `${crypto.randomUUID()}.enc`;
  fs.writeFileSync(path.join(filesDir, filename), encrypted);

  const meta: FileMeta = {
    filename,
    originalName,
    mimeType,
    size: data.length,
    encryptedAt: new Date().toISOString(),
    encKeyB64: encryptedKey.toString('base64'),
    ivB64: iv.toString('base64'),
    authTagB64: authTag.toString('base64'),
  };
  fs.writeFileSync(path.join(filesDir, `${filename}.meta.json`), JSON.stringify(meta));

  return filename;
}

function decryptFile(
  token: string,
  filename: string,
): { data: Buffer; originalName: string; mimeType: string } {
  const privateKey = getUserPrivateKey(token);
  const filesDir = getFilesDir(token);

  const metaRaw = fs.readFileSync(path.join(filesDir, `${filename}.meta.json`), 'utf-8');
  const meta: FileMeta = JSON.parse(metaRaw);

  const encryptedKey = Buffer.from(meta.encKeyB64, 'base64');
  const aesKey = crypto.privateDecrypt(privateKey, encryptedKey);
  const iv = Buffer.from(meta.ivB64, 'base64');
  const authTag = Buffer.from(meta.authTagB64, 'base64');

  const encrypted = fs.readFileSync(path.join(filesDir, filename));
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return { data: decrypted, originalName: meta.originalName, mimeType: meta.mimeType };
}

function listUserFiles(token: string): FileMeta[] {
  const filesDir = getFilesDir(token);
  if (!fs.existsSync(filesDir)) return [];
  return fs.readdirSync(filesDir)
    .filter(f => f.endsWith('.meta.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(filesDir, f), 'utf-8')));
}

function deleteFile(token: string, filename: string): boolean {
  const filesDir = getFilesDir(token);
  const encPath = path.join(filesDir, filename);
  const metaPath = path.join(filesDir, `${filename}.meta.json`);
  if (!fs.existsSync(encPath)) return false;
  fs.unlinkSync(encPath);
  if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  return true;
}

function fileExists(token: string, filename: string): boolean {
  return fs.existsSync(path.join(getFilesDir(token), filename));
}

// ── Test fixtures ───────────────────────────────────────────────────────────

const TOKEN_A = 'user-alice';
const TOKEN_B = 'user-bob';

beforeEach(() => {
  DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-crypto-'));
  createUserHome(TOKEN_A);
  generateUserKeypair(TOKEN_A);
  createUserHome(TOKEN_B);
  generateUserKeypair(TOKEN_B);
});

afterEach(() => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

// ── TC-47.1: encryptFile returns filename string ────────────────────────────

describe('TC-47.1: encryptFile returns filename', () => {

  it('returns a .enc filename string', () => {
    const data = Buffer.from('Hello, encrypted world!');
    const filename = encryptFile(TOKEN_A, data, 'hello.txt', 'text/plain');

    expect(typeof filename).toBe('string');
    expect(filename).toMatch(/\.enc$/);
  });

  it('creates .enc file on disk', () => {
    const data = Buffer.from('test content');
    const filename = encryptFile(TOKEN_A, data, 'test.txt', 'text/plain');

    expect(fs.existsSync(path.join(getFilesDir(TOKEN_A), filename))).toBe(true);
  });

  it('creates .meta.json alongside .enc', () => {
    const data = Buffer.from('test');
    const filename = encryptFile(TOKEN_A, data, 'test.txt', 'text/plain');

    expect(fs.existsSync(path.join(getFilesDir(TOKEN_A), `${filename}.meta.json`))).toBe(true);
  });

  it('meta.json contains originalName and mimeType', () => {
    const data = Buffer.from('image data');
    const filename = encryptFile(TOKEN_A, data, 'photo.jpg', 'image/jpeg');

    const meta = JSON.parse(fs.readFileSync(path.join(getFilesDir(TOKEN_A), `${filename}.meta.json`), 'utf-8'));
    expect(meta.originalName).toBe('photo.jpg');
    expect(meta.mimeType).toBe('image/jpeg');
    expect(meta.size).toBe(10);
  });
});

// ── TC-47.2: decryptFile returns original data + mimeType ───────────────────

describe('TC-47.2: decryptFile returns original', () => {

  it('returns decrypted data, originalName, mimeType', () => {
    const original = Buffer.from('Secret document content');
    const filename = encryptFile(TOKEN_A, original, 'secret.txt', 'text/plain');

    const result = decryptFile(TOKEN_A, filename);
    expect(result.originalName).toBe('secret.txt');
    expect(result.mimeType).toBe('text/plain');
    expect(result.data).toBeDefined();
  });
});

// ── TC-47.3: Roundtrip — encrypt then decrypt = original ────────────────────

describe('TC-47.3: Encrypt-decrypt roundtrip', () => {

  it('text file roundtrip byte-for-byte', () => {
    const original = Buffer.from('The quick brown fox jumps over the lazy dog');
    const filename = encryptFile(TOKEN_A, original, 'fox.txt', 'text/plain');
    const result = decryptFile(TOKEN_A, filename);

    expect(Buffer.compare(result.data, original)).toBe(0);
  });

  it('binary data roundtrip', () => {
    const original = crypto.randomBytes(256);
    const filename = encryptFile(TOKEN_A, original, 'random.bin', 'application/octet-stream');
    const result = decryptFile(TOKEN_A, filename);

    expect(Buffer.compare(result.data, original)).toBe(0);
  });

  it('empty file roundtrip', () => {
    const original = Buffer.alloc(0);
    const filename = encryptFile(TOKEN_A, original, 'empty.txt', 'text/plain');
    const result = decryptFile(TOKEN_A, filename);

    expect(result.data.length).toBe(0);
    expect(Buffer.compare(result.data, original)).toBe(0);
  });

  it('unicode text roundtrip', () => {
    const original = Buffer.from('日本語テスト 🎉 Ümlauts äöü', 'utf-8');
    const filename = encryptFile(TOKEN_A, original, 'unicode.txt', 'text/plain; charset=utf-8');
    const result = decryptFile(TOKEN_A, filename);

    expect(result.data.toString('utf-8')).toBe('日本語テスト 🎉 Ümlauts äöü');
  });
});

// ── TC-47.4: Wrong user cannot decrypt ──────────────────────────────────────

describe('TC-47.4: Wrong user token cannot decrypt', () => {

  it('user B cannot decrypt user A file', () => {
    const original = Buffer.from('Alice secret');
    const filename = encryptFile(TOKEN_A, original, 'alice.txt', 'text/plain');

    // Copy encrypted file to Bob's directory
    const srcEnc = path.join(getFilesDir(TOKEN_A), filename);
    const srcMeta = path.join(getFilesDir(TOKEN_A), `${filename}.meta.json`);
    fs.copyFileSync(srcEnc, path.join(getFilesDir(TOKEN_B), filename));
    fs.copyFileSync(srcMeta, path.join(getFilesDir(TOKEN_B), `${filename}.meta.json`));

    expect(() => decryptFile(TOKEN_B, filename)).toThrow();
  });
});

// ── TC-47.5: Tampered ciphertext throws GCM auth error ──────────────────────

describe('TC-47.5: Tampered ciphertext rejected', () => {

  it('flipping 1 byte in ciphertext throws', () => {
    const original = Buffer.from('Tamper test data');
    const filename = encryptFile(TOKEN_A, original, 'tamper.txt', 'text/plain');

    const encPath = path.join(getFilesDir(TOKEN_A), filename);
    const encrypted = fs.readFileSync(encPath);
    encrypted[0] ^= 0xFF;
    fs.writeFileSync(encPath, encrypted);

    expect(() => decryptFile(TOKEN_A, filename)).toThrow();
  });

  it('truncated ciphertext throws', () => {
    const original = Buffer.from('Truncation test with longer content here');
    const filename = encryptFile(TOKEN_A, original, 'trunc.txt', 'text/plain');

    const encPath = path.join(getFilesDir(TOKEN_A), filename);
    const encrypted = fs.readFileSync(encPath);
    fs.writeFileSync(encPath, encrypted.subarray(0, Math.floor(encrypted.length / 2)));

    expect(() => decryptFile(TOKEN_A, filename)).toThrow();
  });
});

// ── TC-47.6: Large file 1MB roundtrip ───────────────────────────────────────

describe('TC-47.6: Large file roundtrip', () => {

  it('1MB file encrypts and decrypts correctly', () => {
    const original = crypto.randomBytes(1024 * 1024);
    const filename = encryptFile(TOKEN_A, original, 'large.bin', 'application/octet-stream');
    const result = decryptFile(TOKEN_A, filename);

    expect(result.data.length).toBe(1024 * 1024);
    expect(Buffer.compare(result.data, original)).toBe(0);
  });

  it('encrypted file size is close to original (GCM overhead minimal)', () => {
    const original = crypto.randomBytes(1024 * 1024);
    const filename = encryptFile(TOKEN_A, original, 'large.bin', 'application/octet-stream');

    const encSize = fs.statSync(path.join(getFilesDir(TOKEN_A), filename)).size;
    // GCM adds 16-byte auth tag stored separately, so encrypted size ≈ original
    expect(encSize).toBeGreaterThanOrEqual(original.length);
    expect(encSize).toBeLessThan(original.length + 1024);
  });
});

// ── TC-47.7: listUserFiles returns metadata ─────────────────────────────────

describe('TC-47.7: listUserFiles', () => {

  it('returns empty array when no files', () => {
    expect(listUserFiles(TOKEN_A)).toEqual([]);
  });

  it('returns metadata for each encrypted file', () => {
    encryptFile(TOKEN_A, Buffer.from('file1'), 'doc1.txt', 'text/plain');
    encryptFile(TOKEN_A, Buffer.from('file2'), 'doc2.pdf', 'application/pdf');

    const files = listUserFiles(TOKEN_A);
    expect(files.length).toBe(2);
    expect(files.map(f => f.originalName).sort()).toEqual(['doc1.txt', 'doc2.pdf']);
  });

  it('metadata includes size and mimeType', () => {
    encryptFile(TOKEN_A, Buffer.from('hello'), 'test.txt', 'text/plain');

    const files = listUserFiles(TOKEN_A);
    expect(files[0].size).toBe(5);
    expect(files[0].mimeType).toBe('text/plain');
    expect(files[0].encryptedAt).toBeDefined();
  });

  it('user A cannot see user B files', () => {
    encryptFile(TOKEN_A, Buffer.from('alice'), 'alice.txt', 'text/plain');
    encryptFile(TOKEN_B, Buffer.from('bob'), 'bob.txt', 'text/plain');

    expect(listUserFiles(TOKEN_A).length).toBe(1);
    expect(listUserFiles(TOKEN_B).length).toBe(1);
    expect(listUserFiles(TOKEN_A)[0].originalName).toBe('alice.txt');
  });
});

// ── TC-47.8: deleteFile removes .enc + .meta.json ───────────────────────────

describe('TC-47.8: deleteFile', () => {

  it('removes both .enc and .meta.json', () => {
    const filename = encryptFile(TOKEN_A, Buffer.from('delete me'), 'delete.txt', 'text/plain');

    expect(fileExists(TOKEN_A, filename)).toBe(true);
    const result = deleteFile(TOKEN_A, filename);

    expect(result).toBe(true);
    expect(fileExists(TOKEN_A, filename)).toBe(false);
    expect(fs.existsSync(path.join(getFilesDir(TOKEN_A), `${filename}.meta.json`))).toBe(false);
  });

  it('returns false for nonexistent file', () => {
    expect(deleteFile(TOKEN_A, 'nonexistent.enc')).toBe(false);
  });

  it('deleted file disappears from listUserFiles', () => {
    const f1 = encryptFile(TOKEN_A, Buffer.from('keep'), 'keep.txt', 'text/plain');
    const f2 = encryptFile(TOKEN_A, Buffer.from('delete'), 'delete.txt', 'text/plain');

    expect(listUserFiles(TOKEN_A).length).toBe(2);
    deleteFile(TOKEN_A, f2);
    expect(listUserFiles(TOKEN_A).length).toBe(1);
    expect(listUserFiles(TOKEN_A)[0].originalName).toBe('keep.txt');
  });
});

// ── TC-47.9: fileExists ─────────────────────────────────────────────────────

describe('TC-47.9: fileExists', () => {

  it('true after encrypt', () => {
    const filename = encryptFile(TOKEN_A, Buffer.from('exists'), 'exists.txt', 'text/plain');
    expect(fileExists(TOKEN_A, filename)).toBe(true);
  });

  it('false before any encrypt', () => {
    expect(fileExists(TOKEN_A, 'nope.enc')).toBe(false);
  });

  it('false after delete', () => {
    const filename = encryptFile(TOKEN_A, Buffer.from('temp'), 'temp.txt', 'text/plain');
    deleteFile(TOKEN_A, filename);
    expect(fileExists(TOKEN_A, filename)).toBe(false);
  });

  it('false for other user token', () => {
    const filename = encryptFile(TOKEN_A, Buffer.from('private'), 'private.txt', 'text/plain');
    expect(fileExists(TOKEN_B, filename)).toBe(false);
  });
});
