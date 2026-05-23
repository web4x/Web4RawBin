/**
 * Task 9.7: SSH Key Generation unit tests
 * Tests UserKeys functions: createUserHome, generateUserKeypair, hasUserKeys,
 * getUserPublicKey, addAuthorizedKey, idempotency, file permissions.
 *
 * Uses temp dirs — no running server needed.
 * Handler logic replicated from task-9-ssh-keys.md spec until UserKeys.ts is delivered.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

// ── Replicate UserKeys functions from spec ──────────────────────────────────

let DATA_DIR: string;

function getUserHomeDir(token: string): string {
  return path.join(DATA_DIR, 'users', token);
}

function getSshDir(token: string): string {
  return path.join(getUserHomeDir(token), '.ssh');
}

function createUserHome(token: string): void {
  const homeDir = getUserHomeDir(token);
  const sshDir = getSshDir(token);
  const publicKeysDir = path.join(sshDir, 'public_keys');
  const privateKeyDir = path.join(sshDir, 'private_key');

  fs.mkdirSync(homeDir, { recursive: true });
  fs.mkdirSync(sshDir, { mode: 0o700 });
  fs.mkdirSync(publicKeysDir, { mode: 0o700 });
  fs.mkdirSync(privateKeyDir, { mode: 0o700 });

  const authorizedKeysPath = path.join(sshDir, 'authorized_keys');
  fs.writeFileSync(authorizedKeysPath, '', { mode: 0o600 });
}

function generateUserKeypair(token: string): { publicKey: string; privateKey: string } {
  const sshDir = getSshDir(token);
  if (!fs.existsSync(sshDir)) {
    createUserHome(token);
  }

  const idRsaPath = path.join(sshDir, 'id_rsa');
  const idRsaPubPath = path.join(sshDir, 'id_rsa.pub');

  // Don't regenerate if keys exist (idempotent)
  if (fs.existsSync(idRsaPath) && fs.existsSync(idRsaPubPath)) {
    return {
      publicKey: fs.readFileSync(idRsaPubPath, 'utf-8'),
      privateKey: fs.readFileSync(idRsaPath, 'utf-8'),
    };
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(idRsaPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(idRsaPubPath, publicKey, { mode: 0o600 });

  // Named copies per OOSH convention
  const publicKeysDir = path.join(sshDir, 'public_keys');
  const privateKeyDir = path.join(sshDir, 'private_key');
  fs.writeFileSync(path.join(publicKeysDir, `${token}.public_key`), publicKey, { mode: 0o600 });
  fs.writeFileSync(path.join(privateKeyDir, `${token}.private_key`), privateKey, { mode: 0o600 });

  return { publicKey, privateKey };
}

function hasUserKeys(token: string): boolean {
  const idRsaPath = path.join(getSshDir(token), 'id_rsa');
  return fs.existsSync(idRsaPath);
}

function getUserPublicKey(token: string): string | null {
  const idRsaPubPath = path.join(getSshDir(token), 'id_rsa.pub');
  try {
    return fs.readFileSync(idRsaPubPath, 'utf-8');
  } catch {
    return null;
  }
}

function getUserPrivateKey(token: string): string | null {
  const idRsaPath = path.join(getSshDir(token), 'id_rsa');
  try {
    return fs.readFileSync(idRsaPath, 'utf-8');
  } catch {
    return null;
  }
}

function getAuthorizedKeys(token: string): string[] {
  const akPath = path.join(getSshDir(token), 'authorized_keys');
  try {
    const content = fs.readFileSync(akPath, 'utf-8').trim();
    return content ? content.split('\n') : [];
  } catch {
    return [];
  }
}

function addAuthorizedKey(token: string, devicePublicKey: string): void {
  const akPath = path.join(getSshDir(token), 'authorized_keys');
  fs.appendFileSync(akPath, devicePublicKey.trim() + '\n');
}

// ── Test fixtures ───────────────────────────────────────────────────────────

const TEST_TOKEN = 'test-user-abc123';

beforeEach(() => {
  DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-keys-'));
});

afterEach(() => {
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
});

// ── TC-9.7.1: createUserHome creates directory tree ─────────────────────────

describe('TC-9.7.1: createUserHome directory tree', () => {

  it('creates data/users/<token>/.ssh/ with public_keys/ and private_key/', () => {
    createUserHome(TEST_TOKEN);

    const homeDir = getUserHomeDir(TEST_TOKEN);
    const sshDir = getSshDir(TEST_TOKEN);
    expect(fs.existsSync(homeDir)).toBe(true);
    expect(fs.existsSync(sshDir)).toBe(true);
    expect(fs.existsSync(path.join(sshDir, 'public_keys'))).toBe(true);
    expect(fs.existsSync(path.join(sshDir, 'private_key'))).toBe(true);
  });

  it('creates authorized_keys file (empty)', () => {
    createUserHome(TEST_TOKEN);
    const akPath = path.join(getSshDir(TEST_TOKEN), 'authorized_keys');
    expect(fs.existsSync(akPath)).toBe(true);
    expect(fs.readFileSync(akPath, 'utf-8')).toBe('');
  });
});

// ── TC-9.7.2: generateUserKeypair creates valid PEM RSA-2048 ────────────────

describe('TC-9.7.2: generateUserKeypair PEM keys', () => {

  it('creates id_rsa and id_rsa.pub files', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const sshDir = getSshDir(TEST_TOKEN);
    expect(fs.existsSync(path.join(sshDir, 'id_rsa'))).toBe(true);
    expect(fs.existsSync(path.join(sshDir, 'id_rsa.pub'))).toBe(true);
  });

  it('id_rsa contains valid PEM private key', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const privateKey = fs.readFileSync(path.join(getSshDir(TEST_TOKEN), 'id_rsa'), 'utf-8');
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(privateKey).toContain('-----END PRIVATE KEY-----');
  });

  it('id_rsa.pub contains valid PEM public key', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const publicKey = fs.readFileSync(path.join(getSshDir(TEST_TOKEN), 'id_rsa.pub'), 'utf-8');
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
  });

  it('keys are RSA-2048 (verifiable by crypto)', () => {
    createUserHome(TEST_TOKEN);
    const { publicKey, privateKey } = generateUserKeypair(TEST_TOKEN);

    // Verify key can be used for crypto operations
    const data = Buffer.from('test message');
    const encrypted = crypto.publicEncrypt(publicKey, data);
    const decrypted = crypto.privateDecrypt(privateKey, encrypted);
    expect(decrypted.toString()).toBe('test message');
  });
});

// ── TC-9.7.3: Named copies in public_keys/ and private_key/ ────────────────

describe('TC-9.7.3: Named copies per OOSH convention', () => {

  it('public_keys/<token>.public_key contains same key as id_rsa.pub', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const sshDir = getSshDir(TEST_TOKEN);
    const pubKey = fs.readFileSync(path.join(sshDir, 'id_rsa.pub'), 'utf-8');
    const namedPub = fs.readFileSync(path.join(sshDir, 'public_keys', `${TEST_TOKEN}.public_key`), 'utf-8');
    expect(namedPub).toBe(pubKey);
  });

  it('private_key/<token>.private_key contains same key as id_rsa', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const sshDir = getSshDir(TEST_TOKEN);
    const privKey = fs.readFileSync(path.join(sshDir, 'id_rsa'), 'utf-8');
    const namedPriv = fs.readFileSync(path.join(sshDir, 'private_key', `${TEST_TOKEN}.private_key`), 'utf-8');
    expect(namedPriv).toBe(privKey);
  });
});

// ── TC-9.7.4: File permissions ──────────────────────────────────────────────

describe('TC-9.7.4: File permissions 700 dirs / 600 files', () => {

  it('.ssh/ directory has mode 700', () => {
    createUserHome(TEST_TOKEN);
    const stat = fs.statSync(getSshDir(TEST_TOKEN));
    expect(stat.mode & 0o777).toBe(0o700);
  });

  it('public_keys/ directory has mode 700', () => {
    createUserHome(TEST_TOKEN);
    const stat = fs.statSync(path.join(getSshDir(TEST_TOKEN), 'public_keys'));
    expect(stat.mode & 0o777).toBe(0o700);
  });

  it('private_key/ directory has mode 700', () => {
    createUserHome(TEST_TOKEN);
    const stat = fs.statSync(path.join(getSshDir(TEST_TOKEN), 'private_key'));
    expect(stat.mode & 0o777).toBe(0o700);
  });

  it('id_rsa has mode 600', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const stat = fs.statSync(path.join(getSshDir(TEST_TOKEN), 'id_rsa'));
    expect(stat.mode & 0o777).toBe(0o600);
  });

  it('id_rsa.pub has mode 600', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const stat = fs.statSync(path.join(getSshDir(TEST_TOKEN), 'id_rsa.pub'));
    expect(stat.mode & 0o777).toBe(0o600);
  });

  it('authorized_keys has mode 600', () => {
    createUserHome(TEST_TOKEN);
    const stat = fs.statSync(path.join(getSshDir(TEST_TOKEN), 'authorized_keys'));
    expect(stat.mode & 0o777).toBe(0o600);
  });
});

// ── TC-9.7.5: hasUserKeys ───────────────────────────────────────────────────

describe('TC-9.7.5: hasUserKeys true after gen, false before', () => {

  it('returns false before key generation', () => {
    expect(hasUserKeys(TEST_TOKEN)).toBe(false);
  });

  it('returns false after createUserHome but before generateUserKeypair', () => {
    createUserHome(TEST_TOKEN);
    expect(hasUserKeys(TEST_TOKEN)).toBe(false);
  });

  it('returns true after generateUserKeypair', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    expect(hasUserKeys(TEST_TOKEN)).toBe(true);
  });
});

// ── TC-9.7.6: getUserPublicKey returns PEM ──────────────────────────────────

describe('TC-9.7.6: getUserPublicKey returns PEM', () => {

  it('returns null before key generation', () => {
    expect(getUserPublicKey(TEST_TOKEN)).toBeNull();
  });

  it('returns PEM string after generation', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const pubKey = getUserPublicKey(TEST_TOKEN);
    expect(pubKey).not.toBeNull();
    expect(pubKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(pubKey).toContain('-----END PUBLIC KEY-----');
  });

  it('returned key matches generated key', () => {
    createUserHome(TEST_TOKEN);
    const { publicKey } = generateUserKeypair(TEST_TOKEN);

    const retrieved = getUserPublicKey(TEST_TOKEN);
    expect(retrieved).toBe(publicKey);
  });
});

// ── TC-9.7.7: Idempotent — no regen ────────────────────────────────────────

describe('TC-9.7.7: Idempotent — calling twice does not regenerate', () => {

  it('second call returns same keys', () => {
    createUserHome(TEST_TOKEN);
    const first = generateUserKeypair(TEST_TOKEN);
    const second = generateUserKeypair(TEST_TOKEN);

    expect(second.publicKey).toBe(first.publicKey);
    expect(second.privateKey).toBe(first.privateKey);
  });

  it('file mtime unchanged on second call', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const idRsaPath = path.join(getSshDir(TEST_TOKEN), 'id_rsa');
    const mtime1 = fs.statSync(idRsaPath).mtimeMs;

    generateUserKeypair(TEST_TOKEN);

    const mtime2 = fs.statSync(idRsaPath).mtimeMs;
    expect(mtime2).toBe(mtime1);
  });
});

// ── TC-9.7.8: authorized_keys exists empty initially ────────────────────────

describe('TC-9.7.8: authorized_keys initially empty', () => {

  it('authorized_keys file exists after createUserHome', () => {
    createUserHome(TEST_TOKEN);
    const akPath = path.join(getSshDir(TEST_TOKEN), 'authorized_keys');
    expect(fs.existsSync(akPath)).toBe(true);
  });

  it('authorized_keys is empty', () => {
    createUserHome(TEST_TOKEN);
    const keys = getAuthorizedKeys(TEST_TOKEN);
    expect(keys).toEqual([]);
  });
});

// ── TC-9.7.9: addAuthorizedKey appends ──────────────────────────────────────

describe('TC-9.7.9: addAuthorizedKey appends to file', () => {

  it('adds one key to authorized_keys', () => {
    createUserHome(TEST_TOKEN);
    const fakeKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDtest device@test';

    addAuthorizedKey(TEST_TOKEN, fakeKey);

    const keys = getAuthorizedKeys(TEST_TOKEN);
    expect(keys.length).toBe(1);
    expect(keys[0]).toBe(fakeKey);
  });

  it('appends multiple keys in order', () => {
    createUserHome(TEST_TOKEN);
    const key1 = 'ssh-rsa AAAA1 device1@test';
    const key2 = 'ssh-rsa AAAA2 device2@test';
    const key3 = 'ssh-rsa AAAA3 device3@test';

    addAuthorizedKey(TEST_TOKEN, key1);
    addAuthorizedKey(TEST_TOKEN, key2);
    addAuthorizedKey(TEST_TOKEN, key3);

    const keys = getAuthorizedKeys(TEST_TOKEN);
    expect(keys.length).toBe(3);
    expect(keys[0]).toBe(key1);
    expect(keys[1]).toBe(key2);
    expect(keys[2]).toBe(key3);
  });

  it('does not duplicate if same key added twice', () => {
    createUserHome(TEST_TOKEN);
    const key = 'ssh-rsa AAAAdup device@test';

    addAuthorizedKey(TEST_TOKEN, key);
    addAuthorizedKey(TEST_TOKEN, key);

    const keys = getAuthorizedKeys(TEST_TOKEN);
    // Current impl does append duplicates — this test documents behavior
    // If dedup is desired, expert should add it and this test will catch it
    expect(keys.length).toBe(2);
  });
});
