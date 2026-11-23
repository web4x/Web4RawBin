/**
 * R42.5 no-token-only-login: the REAL UserKeys module (not a replica) must accept a challenge signed by an
 * enrolled device key. authorized_keys holds multi-line PEM device keys; matching them line by line failed every
 * DEVICE_AUTH, which nobody saw while a bare token still logged users in.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'rawbin-dk-'));
let UK: typeof import('../../src/ts/server/UserKeys.js');

beforeAll(async () => {
  vi.stubEnv('DATA_DIR', DIR);
  vi.resetModules();
  UK = await import('../../src/ts/server/UserKeys.js');
});
afterAll(() => { vi.unstubAllEnvs(); fs.rmSync(DIR, { recursive: true, force: true }); });

const sign = (challengeHex: string, pem: string) => crypto.sign('sha256', Buffer.from(challengeHex, 'hex'), pem).toString('base64');

// [test:uuid:ac8c40f7-1768-45c3-8a01-fdd9004a7818] R42.5 UserKeys.authorizedKeyEntries: an enrolled PEM device key verifies
describe('UserKeys.authorizedKeyEntries — enrolled PEM device keys verify (R42.5)', () => {
  it('a challenge signed by an enrolled device key verifies, also with two devices enrolled', () => {
    const token = 'dk-user-1';
    UK.createUserHome(token); UK.generateUserKeypair(token);
    const d1 = UK.enrollDevice(token, 'dev-1');
    const d2 = UK.enrollDevice(token, 'dev-2');
    const ch = crypto.randomBytes(32).toString('hex');
    expect(UK.verifyChallenge(token, d1.devicePublicKey, ch, sign(ch, d1.devicePrivateKey))).toBe(true);
    expect(UK.verifyChallenge(token, d2.devicePublicKey, ch, sign(ch, d2.devicePrivateKey))).toBe(true);
  });
  it('a key that is not enrolled, a wrong signature or another user fails', () => {
    const token = 'dk-user-2';
    UK.createUserHome(token); UK.generateUserKeypair(token);
    const d = UK.enrollDevice(token, 'dev-1');
    const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
    const ch = crypto.randomBytes(32).toString('hex');
    expect(UK.verifyChallenge(token, other.publicKey, ch, sign(ch, other.privateKey))).toBe(false);
    expect(UK.verifyChallenge(token, d.devicePublicKey, ch, sign(ch, other.privateKey))).toBe(false);
    expect(UK.verifyChallenge('dk-user-1', d.devicePublicKey, ch, sign(ch, d.devicePrivateKey))).toBe(false);
  });
  it('splits a file into one entry per PEM block or one-line key', () => {
    const pem = '-----BEGIN PUBLIC KEY-----\nAAA\nBBB\n-----END PUBLIC KEY-----';
    expect(UK.authorizedKeyEntries(`${pem}\nssh-rsa AAAA x@y\n${pem}\n`)).toEqual([pem, pem, 'ssh-rsa AAAA x@y']);
  });
});
