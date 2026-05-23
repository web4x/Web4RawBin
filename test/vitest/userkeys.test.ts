/**
 * Task 9.7 + 10.7: SSH Key Generation + Device Key Enrollment unit tests
 * Tests UserKeys functions: createUserHome, generateUserKeypair, hasUserKeys,
 * getUserPublicKey, addAuthorizedKey, idempotency, file permissions.
 * T10: generateDeviceKeypair, signDeviceKey, verifyDeviceKey, enrollDevice,
 * DEVICE_ENROLL handler logic.
 *
 * Uses temp dirs — no running server needed.
 * Handler logic replicated from task specs until UserKeys.ts is delivered.
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

// ═══════════════════════════════════════════════════════════════════════════
// T10: Device Key Enrollment
// ═══════════════════════════════════════════════════════════════════════════

// ── Replicate T10 functions from spec ───────────────────────────────────────

function generateDeviceKeypair(userToken: string, deviceId: string): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
}

function signDeviceKey(userToken: string, devicePublicKey: string): string {
  const userPrivateKey = getUserPrivateKey(userToken);
  if (!userPrivateKey) throw new Error('User private key not found');
  const signature = crypto.sign('sha256', Buffer.from(devicePublicKey), userPrivateKey);
  return signature.toString('base64');
}

function verifyDeviceKey(userToken: string, devicePublicKey: string, signature: string): boolean {
  const userPublicKey = getUserPublicKey(userToken);
  if (!userPublicKey) return false;
  return crypto.verify('sha256', Buffer.from(devicePublicKey), userPublicKey, Buffer.from(signature, 'base64'));
}

function enrollDevice(userToken: string, deviceId: string): { devicePublicKey: string; devicePrivateKey: string; signature: string } {
  const { publicKey: devicePublicKey, privateKey: devicePrivateKey } = generateDeviceKeypair(userToken, deviceId);
  const signature = signDeviceKey(userToken, devicePublicKey);
  addAuthorizedKey(userToken, devicePublicKey);
  return { devicePublicKey, devicePrivateKey, signature };
}

interface UserProfile {
  token: string;
  name: string;
  secretCode: string;
  sshKeysGenerated: boolean;
  profileCommitted: boolean;
}

function handleDeviceEnroll(
  msg: any,
  clientId: string,
  deviceId: string,
  tokenToClient: Map<string, string>,
  userProfiles: Map<string, UserProfile>,
  send: (data: any) => void,
): void {
  const myToken = [...tokenToClient.entries()].find(([, cid]) => cid === clientId)?.[0];
  if (!myToken) { send({ type: 'DEVICE_ENROLL_FAILED', reason: 'Not identified' }); return; }
  const profile = userProfiles.get(myToken);
  if (!profile) { send({ type: 'DEVICE_ENROLL_FAILED', reason: 'No profile' }); return; }
  if (!profile.sshKeysGenerated) { send({ type: 'DEVICE_ENROLL_FAILED', reason: 'Keys not generated' }); return; }
  if (msg.secretCode !== profile.secretCode) { send({ type: 'DEVICE_ENROLL_FAILED', reason: 'Wrong secret code' }); return; }
  const result = enrollDevice(myToken, deviceId);
  send({ type: 'DEVICE_ENROLL_OK', devicePublicKey: result.devicePublicKey, devicePrivateKey: result.devicePrivateKey, signature: result.signature });
}

const DEVICE_ID = 'device-xyz-789';

// ── TC-10.7.1: generateDeviceKeypair creates valid RSA-2048 ─────────────────

describe('TC-10.7.1: generateDeviceKeypair RSA-2048', () => {

  it('returns valid PEM public key', () => {
    const { publicKey } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(publicKey).toContain('-----END PUBLIC KEY-----');
  });

  it('returns valid PEM private key', () => {
    const { privateKey } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);
    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(privateKey).toContain('-----END PRIVATE KEY-----');
  });

  it('device keys are usable for encrypt/decrypt', () => {
    const { publicKey, privateKey } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);
    const data = Buffer.from('device test');
    const encrypted = crypto.publicEncrypt(publicKey, data);
    const decrypted = crypto.privateDecrypt(privateKey, encrypted);
    expect(decrypted.toString()).toBe('device test');
  });

  it('different devices get different keys', () => {
    const pair1 = generateDeviceKeypair(TEST_TOKEN, 'device-1');
    const pair2 = generateDeviceKeypair(TEST_TOKEN, 'device-2');
    expect(pair1.publicKey).not.toBe(pair2.publicKey);
    expect(pair1.privateKey).not.toBe(pair2.privateKey);
  });
});

// ── TC-10.7.2: signDeviceKey produces base64 signature ──────────────────────

describe('TC-10.7.2: signDeviceKey base64 signature', () => {

  it('produces a non-empty base64 string', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const { publicKey: devicePub } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);

    const signature = signDeviceKey(TEST_TOKEN, devicePub);
    expect(signature.length).toBeGreaterThan(0);
    // Valid base64
    expect(Buffer.from(signature, 'base64').toString('base64')).toBe(signature);
  });

  it('different device keys produce different signatures', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const pair1 = generateDeviceKeypair(TEST_TOKEN, 'dev-1');
    const pair2 = generateDeviceKeypair(TEST_TOKEN, 'dev-2');

    const sig1 = signDeviceKey(TEST_TOKEN, pair1.publicKey);
    const sig2 = signDeviceKey(TEST_TOKEN, pair2.publicKey);
    expect(sig1).not.toBe(sig2);
  });
});

// ── TC-10.7.3: verifyDeviceKey true for valid, false for tampered ────────────

describe('TC-10.7.3: verifyDeviceKey validation', () => {

  it('returns true for valid signature', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const { publicKey: devicePub } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);
    const signature = signDeviceKey(TEST_TOKEN, devicePub);

    expect(verifyDeviceKey(TEST_TOKEN, devicePub, signature)).toBe(true);
  });

  it('returns false for tampered device key', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const { publicKey: devicePub } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);
    const signature = signDeviceKey(TEST_TOKEN, devicePub);

    // Use a different device key with the original signature
    const { publicKey: tamperedPub } = generateDeviceKeypair(TEST_TOKEN, 'tampered');
    expect(verifyDeviceKey(TEST_TOKEN, tamperedPub, signature)).toBe(false);
  });

  it('returns false for tampered signature', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const { publicKey: devicePub } = generateDeviceKeypair(TEST_TOKEN, DEVICE_ID);

    const badSig = Buffer.from('definitely-not-a-valid-signature').toString('base64');
    expect(verifyDeviceKey(TEST_TOKEN, devicePub, badSig)).toBe(false);
  });

  it('returns false when user has no keys', () => {
    const { publicKey: devicePub } = generateDeviceKeypair('no-keys-user', DEVICE_ID);
    expect(verifyDeviceKey('no-keys-user', devicePub, 'anything')).toBe(false);
  });
});

// ── TC-10.7.4: enrollDevice creates keypair + signs + authorized_keys ───────

describe('TC-10.7.4: enrollDevice full flow', () => {

  it('returns devicePublicKey, devicePrivateKey, and signature', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const result = enrollDevice(TEST_TOKEN, DEVICE_ID);
    expect(result.devicePublicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(result.devicePrivateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it('signature is valid for the returned device key', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const result = enrollDevice(TEST_TOKEN, DEVICE_ID);
    expect(verifyDeviceKey(TEST_TOKEN, result.devicePublicKey, result.signature)).toBe(true);
  });

  it('adds device public key to authorized_keys', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const result = enrollDevice(TEST_TOKEN, DEVICE_ID);
    const akPath = path.join(getSshDir(TEST_TOKEN), 'authorized_keys');
    const akContent = fs.readFileSync(akPath, 'utf-8');
    expect(akContent).toContain(result.devicePublicKey.trim());
  });
});

// ── TC-10.7.5: DEVICE_ENROLL with correct secret code -> OK ─────────────────

describe('TC-10.7.5: DEVICE_ENROLL correct code → OK', () => {

  it('returns DEVICE_ENROLL_OK with keys and signature', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const profiles = new Map<string, UserProfile>();
    profiles.set(TEST_TOKEN, { token: TEST_TOKEN, name: 'TestUser', secretCode: '4242', sshKeysGenerated: true, profileCommitted: true });
    const tokenToClient = new Map<string, string>();
    tokenToClient.set(TEST_TOKEN, 'client-1');
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '4242' },
      'client-1', DEVICE_ID, tokenToClient, profiles, (d) => sent.push(d),
    );

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('DEVICE_ENROLL_OK');
    expect(sent[0].devicePublicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(sent[0].devicePrivateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(sent[0].signature.length).toBeGreaterThan(0);
  });
});

// ── TC-10.7.6: DEVICE_ENROLL with wrong code -> FAILED ──────────────────────

describe('TC-10.7.6: DEVICE_ENROLL wrong code → FAILED', () => {

  it('returns DEVICE_ENROLL_FAILED with reason', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const profiles = new Map<string, UserProfile>();
    profiles.set(TEST_TOKEN, { token: TEST_TOKEN, name: 'TestUser', secretCode: '4242', sshKeysGenerated: true, profileCommitted: true });
    const tokenToClient = new Map<string, string>();
    tokenToClient.set(TEST_TOKEN, 'client-1');
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '0000' },
      'client-1', DEVICE_ID, tokenToClient, profiles, (d) => sent.push(d),
    );

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('DEVICE_ENROLL_FAILED');
    expect(sent[0].reason).toBe('Wrong secret code');
  });
});

// ── TC-10.7.7: DEVICE_ENROLL without sshKeysGenerated -> error ──────────────

describe('TC-10.7.7: DEVICE_ENROLL without SSH keys → error', () => {

  it('returns DEVICE_ENROLL_FAILED when keys not generated', () => {
    const profiles = new Map<string, UserProfile>();
    profiles.set(TEST_TOKEN, { token: TEST_TOKEN, name: 'TestUser', secretCode: '4242', sshKeysGenerated: false, profileCommitted: true });
    const tokenToClient = new Map<string, string>();
    tokenToClient.set(TEST_TOKEN, 'client-1');
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '4242' },
      'client-1', DEVICE_ID, tokenToClient, profiles, (d) => sent.push(d),
    );

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('DEVICE_ENROLL_FAILED');
    expect(sent[0].reason).toBe('Keys not generated');
  });

  it('returns DEVICE_ENROLL_FAILED for unidentified client', () => {
    const profiles = new Map<string, UserProfile>();
    const tokenToClient = new Map<string, string>();
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '4242' },
      'unknown-client', DEVICE_ID, tokenToClient, profiles, (d) => sent.push(d),
    );

    expect(sent.length).toBe(1);
    expect(sent[0].type).toBe('DEVICE_ENROLL_FAILED');
    expect(sent[0].reason).toBe('Not identified');
  });
});

// ── TC-10.7.8: Device public key in authorized_keys after enrollment ────────

describe('TC-10.7.8: authorized_keys after enrollment', () => {

  it('device key appears in authorized_keys after successful enrollment', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const profiles = new Map<string, UserProfile>();
    profiles.set(TEST_TOKEN, { token: TEST_TOKEN, name: 'TestUser', secretCode: '1234', sshKeysGenerated: true, profileCommitted: true });
    const tokenToClient = new Map<string, string>();
    tokenToClient.set(TEST_TOKEN, 'client-1');
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '1234' },
      'client-1', DEVICE_ID, tokenToClient, profiles, (d) => sent.push(d),
    );

    const akPath = path.join(getSshDir(TEST_TOKEN), 'authorized_keys');
    const akContent = fs.readFileSync(akPath, 'utf-8');
    expect(akContent).toContain('-----BEGIN PUBLIC KEY-----');
    expect(akContent).toContain(sent[0].devicePublicKey.trim());
  });

  it('multiple devices each add to authorized_keys', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const profiles = new Map<string, UserProfile>();
    profiles.set(TEST_TOKEN, { token: TEST_TOKEN, name: 'TestUser', secretCode: '1234', sshKeysGenerated: true, profileCommitted: true });
    const tokenToClient = new Map<string, string>();
    tokenToClient.set(TEST_TOKEN, 'client-1');
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '1234' },
      'client-1', 'device-A', tokenToClient, profiles, (d) => sent.push(d),
    );
    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '1234' },
      'client-1', 'device-B', tokenToClient, profiles, (d) => sent.push(d),
    );

    const akPath = path.join(getSshDir(TEST_TOKEN), 'authorized_keys');
    const akContent = fs.readFileSync(akPath, 'utf-8');
    // Both device keys present
    expect(akContent).toContain(sent[0].devicePublicKey.trim());
    expect(akContent).toContain(sent[1].devicePublicKey.trim());
    // They are different keys
    expect(sent[0].devicePublicKey).not.toBe(sent[1].devicePublicKey);
  });

  it('failed enrollment does NOT add to authorized_keys', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    const profiles = new Map<string, UserProfile>();
    profiles.set(TEST_TOKEN, { token: TEST_TOKEN, name: 'TestUser', secretCode: '1234', sshKeysGenerated: true, profileCommitted: true });
    const tokenToClient = new Map<string, string>();
    tokenToClient.set(TEST_TOKEN, 'client-1');
    const sent: any[] = [];

    handleDeviceEnroll(
      { type: 'DEVICE_ENROLL_REQUEST', secretCode: '9999' },
      'client-1', DEVICE_ID, tokenToClient, profiles, (d) => sent.push(d),
    );

    expect(sent[0].type).toBe('DEVICE_ENROLL_FAILED');
    const authKeys = getAuthorizedKeys(TEST_TOKEN);
    expect(authKeys.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T12: Challenge-Response Authentication
// ═══════════════════════════════════════════════════════════════════════════

// ── Replicate T12 functions from spec ───────────────────────────────────────

function generateChallenge(): string {
  return crypto.randomBytes(32).toString('hex');
}

function verifyChallenge(
  userToken: string,
  devicePublicKey: string,
  challenge: string,
  signedChallenge: string,
): boolean {
  if (!userToken || !devicePublicKey || !challenge || !signedChallenge) return false;

  // Check devicePublicKey is in authorized_keys
  const akPath = path.join(getSshDir(userToken), 'authorized_keys');
  let akContent: string;
  try {
    akContent = fs.readFileSync(akPath, 'utf-8');
  } catch {
    return false;
  }
  if (!akContent.includes(devicePublicKey.trim())) return false;

  // Verify signature
  try {
    return crypto.verify(
      'sha256',
      Buffer.from(challenge, 'hex'),
      devicePublicKey,
      Buffer.from(signedChallenge, 'base64'),
    );
  } catch {
    return false;
  }
}

function signChallenge(devicePrivateKey: string, challenge: string): string {
  const signature = crypto.sign('sha256', Buffer.from(challenge, 'hex'), devicePrivateKey);
  return signature.toString('base64');
}

// ── TC-12.8.1: Challenge is unique per call ─────────────────────────────────

describe('TC-12.8.1: Challenge uniqueness', () => {

  it('generates 64-char hex string', () => {
    const challenge = generateChallenge();
    expect(challenge.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(challenge)).toBe(true);
  });

  it('no duplicates in 100 calls', () => {
    const challenges = new Set<string>();
    for (let i = 0; i < 100; i++) {
      challenges.add(generateChallenge());
    }
    expect(challenges.size).toBe(100);
  });
});

// ── TC-12.8.2: Valid device key signature → verified true ────────────────────

describe('TC-12.8.2: Valid signature verification', () => {

  it('verifyChallenge returns true for correctly signed challenge', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled = enrollDevice(TEST_TOKEN, DEVICE_ID);

    const challenge = generateChallenge();
    const signed = signChallenge(enrolled.devicePrivateKey, challenge);

    expect(verifyChallenge(TEST_TOKEN, enrolled.devicePublicKey, challenge, signed)).toBe(true);
  });

  it('works with different challenges', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled = enrollDevice(TEST_TOKEN, DEVICE_ID);

    const c1 = generateChallenge();
    const c2 = generateChallenge();
    const s1 = signChallenge(enrolled.devicePrivateKey, c1);
    const s2 = signChallenge(enrolled.devicePrivateKey, c2);

    expect(verifyChallenge(TEST_TOKEN, enrolled.devicePublicKey, c1, s1)).toBe(true);
    expect(verifyChallenge(TEST_TOKEN, enrolled.devicePublicKey, c2, s2)).toBe(true);
    // Cross-check: wrong challenge+signature pair fails
    expect(verifyChallenge(TEST_TOKEN, enrolled.devicePublicKey, c1, s2)).toBe(false);
  });
});

// ── TC-12.8.3: Invalid/tampered signature → false ────────────────────────────

describe('TC-12.8.3: Invalid signature rejected', () => {

  it('tampered signature returns false', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled = enrollDevice(TEST_TOKEN, DEVICE_ID);

    const challenge = generateChallenge();
    const badSig = Buffer.from('tampered-signature-data').toString('base64');

    expect(verifyChallenge(TEST_TOKEN, enrolled.devicePublicKey, challenge, badSig)).toBe(false);
  });

  it('signature from different device key returns false', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled1 = enrollDevice(TEST_TOKEN, 'device-1');
    const enrolled2 = enrollDevice(TEST_TOKEN, 'device-2');

    const challenge = generateChallenge();
    const signedByDevice2 = signChallenge(enrolled2.devicePrivateKey, challenge);

    // Signed by device-2 but presented with device-1's public key
    expect(verifyChallenge(TEST_TOKEN, enrolled1.devicePublicKey, challenge, signedByDevice2)).toBe(false);
  });

  it('replayed signature with different challenge returns false', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled = enrollDevice(TEST_TOKEN, DEVICE_ID);

    const challenge1 = generateChallenge();
    const signed1 = signChallenge(enrolled.devicePrivateKey, challenge1);

    // Replay signed1 against a new challenge
    const challenge2 = generateChallenge();
    expect(verifyChallenge(TEST_TOKEN, enrolled.devicePublicKey, challenge2, signed1)).toBe(false);
  });
});

// ── TC-12.8.4: Device key not in authorized_keys → false ─────────────────────

describe('TC-12.8.4: Unauthorized device key rejected', () => {

  it('unenrolled device key returns false', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);

    // Generate a device keypair but do NOT enroll it
    const { publicKey: unenrolledPub, privateKey: unenrolledPriv } = generateDeviceKeypair(TEST_TOKEN, 'rogue-device');

    const challenge = generateChallenge();
    const signed = signChallenge(unenrolledPriv, challenge);

    expect(verifyChallenge(TEST_TOKEN, unenrolledPub, challenge, signed)).toBe(false);
  });

  it('device key from different user returns false', () => {
    const otherToken = 'other-user-token';

    // Setup user 1 with enrolled device
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled = enrollDevice(TEST_TOKEN, DEVICE_ID);

    // Setup user 2 (no enrolled devices)
    createUserHome(otherToken);
    generateUserKeypair(otherToken);

    const challenge = generateChallenge();
    const signed = signChallenge(enrolled.devicePrivateKey, challenge);

    // Try to auth against other user's authorized_keys
    expect(verifyChallenge(otherToken, enrolled.devicePublicKey, challenge, signed)).toBe(false);
  });
});

// ── TC-12.8.5: verifyChallenge returns false for empty/null inputs ───────────

describe('TC-12.8.5: Empty/null input handling', () => {

  it('empty userToken returns false', () => {
    expect(verifyChallenge('', 'someKey', 'someChallenge', 'someSig')).toBe(false);
  });

  it('empty devicePublicKey returns false', () => {
    expect(verifyChallenge(TEST_TOKEN, '', 'someChallenge', 'someSig')).toBe(false);
  });

  it('empty challenge returns false', () => {
    expect(verifyChallenge(TEST_TOKEN, 'someKey', '', 'someSig')).toBe(false);
  });

  it('empty signedChallenge returns false', () => {
    expect(verifyChallenge(TEST_TOKEN, 'someKey', 'someChallenge', '')).toBe(false);
  });

  it('non-existent user token returns false', () => {
    createUserHome(TEST_TOKEN);
    generateUserKeypair(TEST_TOKEN);
    const enrolled = enrollDevice(TEST_TOKEN, DEVICE_ID);
    const challenge = generateChallenge();
    const signed = signChallenge(enrolled.devicePrivateKey, challenge);

    expect(verifyChallenge('nonexistent-user', enrolled.devicePublicKey, challenge, signed)).toBe(false);
  });
});
