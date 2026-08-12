// [impl:uuid:cc632587-93f3-4921-9436-1cf13ca0bead] T9 user SSH keys
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homeKeyFor, homePathFor } from './storage-id.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// T100: configurable via DATA_DIR env (isolated test data). INVARIANT: unset → exact prod path.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const USERS_DIR = path.join(DATA_DIR, 'users');

// R40.22 CHOKEPOINT: resolve token→home-key via homeKeyFor, build via homePathFor (THE structural backstop:
// THROWS on a no-home key so a no-home READ fails LOUD, never silently resolves to the users root = every home).
// {mint:true} = WRITE/create (mints a storageId if absent, never throws); {mint:false} = READ (returns the mapped
// id or null → homePathFor throws). INERT while REKEY_APPLIED=false: homeKeyFor returns the raw token for BOTH
// modes → path byte-identical to before, never throws (zero behavior change). Default mint:false = read.
export function getUserHomeDir(token: string, opts: { mint: boolean } = { mint: false }): string {
  return homePathFor(USERS_DIR, homeKeyFor(token, opts));
}

function getSshDir(token: string, opts: { mint: boolean } = { mint: false }): string {
  return path.join(getUserHomeDir(token, opts), '.ssh');
}

function getPublicKeysDir(token: string, opts: { mint: boolean } = { mint: false }): string {
  return path.join(getSshDir(token, opts), 'public_keys');
}

function getPrivateKeyDir(token: string, opts: { mint: boolean } = { mint: false }): string {
  return path.join(getSshDir(token, opts), 'private_key');
}

function getIdRsaPath(token: string, opts: { mint: boolean } = { mint: false }): string {
  return path.join(getSshDir(token, opts), 'id_rsa');
}

function getIdRsaPubPath(token: string, opts: { mint: boolean } = { mint: false }): string {
  return path.join(getSshDir(token, opts), 'id_rsa.pub');
}

function getAuthorizedKeysPath(token: string, opts: { mint: boolean } = { mint: false }): string {
  return path.join(getSshDir(token, opts), 'authorized_keys');
}

function mkdirSafe(dir: string, mode: number = 0o700): void {
  fs.mkdirSync(dir, { recursive: true, mode });
  try { fs.chmodSync(dir, mode); } catch {}
}

function writeKeySafe(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch {}
}

export function createUserHome(token: string): void { // WRITE → mint:true (creates the home; mints storageId if absent)
  const homeDir = getUserHomeDir(token, { mint: true });
  const sshDir = getSshDir(token, { mint: true });
  const publicKeysDir = getPublicKeysDir(token, { mint: true });
  const privateKeyDir = getPrivateKeyDir(token, { mint: true });

  mkdirSafe(homeDir);
  mkdirSafe(sshDir);
  mkdirSafe(publicKeysDir);
  mkdirSafe(privateKeyDir);

  const authorizedKeysPath = getAuthorizedKeysPath(token, { mint: true });
  if (!fs.existsSync(authorizedKeysPath)) {
    writeKeySafe(authorizedKeysPath, '');
  }
}

export function generateUserKeypair(token: string): { publicKey: string; privateKey: string } { // WRITE (creates keys) → mint:true
  const idRsaPath = getIdRsaPath(token, { mint: true });
  const idRsaPubPath = getIdRsaPubPath(token, { mint: true });

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

  writeKeySafe(idRsaPath, privateKey);
  writeKeySafe(idRsaPubPath, publicKey);

  const publicKeysDir = getPublicKeysDir(token, { mint: true });
  const privateKeyDir = getPrivateKeyDir(token, { mint: true });
  mkdirSafe(publicKeysDir);
  mkdirSafe(privateKeyDir);

  writeKeySafe(path.join(publicKeysDir, `${token}.public_key`), publicKey);
  writeKeySafe(path.join(privateKeyDir, `${token}.private_key`), privateKey);

  return { publicKey, privateKey };
}

export function hasUserKeys(token: string): boolean { // graceful-absent READ (no home → no keys → false, never throw)
  try { return fs.existsSync(getIdRsaPath(token)) && fs.existsSync(getIdRsaPubPath(token)); } catch { return false; }
}

// Force a clean keypair even if (corrupt) key files already exist. generateUserKeypair is
// idempotent (skips when files present), so deleting first guarantees regeneration. Ensures
// the .ssh tree exists. Used to self-heal an unusable/corrupt key during avatar upload.
export function regenerateUserKeypair(token: string): { publicKey: string; privateKey: string } {
  createUserHome(token); // ensures the home exists first
  try { fs.rmSync(getIdRsaPath(token, { mint: true }), { force: true }); } catch {}
  try { fs.rmSync(getIdRsaPubPath(token, { mint: true }), { force: true }); } catch {}
  return generateUserKeypair(token);
}

export function getUserPublicKey(token: string): string | null { // graceful-absent READ
  let p: string; try { p = getIdRsaPubPath(token); } catch { return null; }
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

export function getUserPrivateKey(token: string): string | null { // graceful-absent READ
  let p: string; try { p = getIdRsaPath(token); } catch { return null; }
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

export function getAuthorizedKeys(token: string): string[] { // graceful-absent READ
  let p: string; try { p = getAuthorizedKeysPath(token); } catch { return []; }
  if (!fs.existsSync(p)) return [];
  const content = fs.readFileSync(p, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').filter(line => line.trim().length > 0);
}

export function addAuthorizedKey(token: string, devicePublicKey: string): void { // WRITE → mint:true
  const p = getAuthorizedKeysPath(token, { mint: true });
  const existing = getAuthorizedKeys(token);
  const trimmed = devicePublicKey.trim();
  if (existing.includes(trimmed)) return;
  const content = existing.length > 0 ? existing.join('\n') + '\n' + trimmed + '\n' : trimmed + '\n';
  writeKeySafe(p, content);
}

export function generateDeviceKeypair(userToken: string, deviceId: string): { publicKey: string; privateKey: string } {
  const devKeysDir = path.join(getSshDir(userToken, { mint: true }), 'devices'); // WRITE (device keys) → mint:true
  mkdirSafe(devKeysDir);

  const devPubPath = path.join(devKeysDir, `${deviceId}.pub`);
  const devPrivPath = path.join(devKeysDir, `${deviceId}.key`);

  if (fs.existsSync(devPubPath) && fs.existsSync(devPrivPath)) {
    return {
      publicKey: fs.readFileSync(devPubPath, 'utf-8'),
      privateKey: fs.readFileSync(devPrivPath, 'utf-8'),
    };
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  writeKeySafe(devPubPath, publicKey);
  writeKeySafe(devPrivPath, privateKey);

  return { publicKey, privateKey };
}

export function signDeviceKey(userToken: string, devicePublicKey: string): string {
  const userPrivateKey = getUserPrivateKey(userToken);
  if (!userPrivateKey) throw new Error('User private key not found');
  const signature = crypto.sign('sha256', Buffer.from(devicePublicKey), userPrivateKey);
  return signature.toString('base64');
}

export function verifyDeviceKey(userToken: string, devicePublicKey: string, signature: string): boolean {
  const userPublicKey = getUserPublicKey(userToken);
  if (!userPublicKey) return false;
  try {
    return crypto.verify('sha256', Buffer.from(devicePublicKey), userPublicKey, Buffer.from(signature, 'base64'));
  } catch { return false; }
}

export function enrollDevice(userToken: string, deviceId: string): { devicePublicKey: string; devicePrivateKey: string; signature: string } {
  const { publicKey, privateKey } = generateDeviceKeypair(userToken, deviceId);
  const signature = signDeviceKey(userToken, publicKey);
  addAuthorizedKey(userToken, publicKey);
  return { devicePublicKey: publicKey, devicePrivateKey: privateKey, signature };
}

export function verifyChallenge(userToken: string, devicePublicKey: string, challenge: string, signedChallenge: string): boolean {
  const authorizedKeys = getAuthorizedKeys(userToken);
  const trimmedKey = devicePublicKey.trim();
  if (!authorizedKeys.some(k => k.trim() === trimmedKey)) return false;
  try {
    return crypto.verify('sha256', Buffer.from(challenge, 'hex'), devicePublicKey, Buffer.from(signedChallenge, 'base64'));
  } catch { return false; }
}

export function writeUserProfile(token: string, profile: object): void { // WRITE → mint:true
  const homeDir = getUserHomeDir(token, { mint: true });
  mkdirSafe(homeDir);
  const profilePath = path.join(homeDir, 'profile.json');
  fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
}
