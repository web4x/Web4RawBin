import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../../data');
const USERS_DIR = path.join(DATA_DIR, 'users');

export function getUserHomeDir(token: string): string {
  return path.join(USERS_DIR, token);
}

function getSshDir(token: string): string {
  return path.join(getUserHomeDir(token), '.ssh');
}

function getPublicKeysDir(token: string): string {
  return path.join(getSshDir(token), 'public_keys');
}

function getPrivateKeyDir(token: string): string {
  return path.join(getSshDir(token), 'private_key');
}

function getIdRsaPath(token: string): string {
  return path.join(getSshDir(token), 'id_rsa');
}

function getIdRsaPubPath(token: string): string {
  return path.join(getSshDir(token), 'id_rsa.pub');
}

function getAuthorizedKeysPath(token: string): string {
  return path.join(getSshDir(token), 'authorized_keys');
}

function mkdirSafe(dir: string, mode: number = 0o700): void {
  fs.mkdirSync(dir, { recursive: true, mode });
  try { fs.chmodSync(dir, mode); } catch {}
}

function writeKeySafe(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { mode: 0o600 });
  try { fs.chmodSync(filePath, 0o600); } catch {}
}

export function createUserHome(token: string): void {
  const homeDir = getUserHomeDir(token);
  const sshDir = getSshDir(token);
  const publicKeysDir = getPublicKeysDir(token);
  const privateKeyDir = getPrivateKeyDir(token);

  mkdirSafe(homeDir);
  mkdirSafe(sshDir);
  mkdirSafe(publicKeysDir);
  mkdirSafe(privateKeyDir);

  const authorizedKeysPath = getAuthorizedKeysPath(token);
  if (!fs.existsSync(authorizedKeysPath)) {
    writeKeySafe(authorizedKeysPath, '');
  }
}

export function generateUserKeypair(token: string): { publicKey: string; privateKey: string } {
  const idRsaPath = getIdRsaPath(token);
  const idRsaPubPath = getIdRsaPubPath(token);

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

  const publicKeysDir = getPublicKeysDir(token);
  const privateKeyDir = getPrivateKeyDir(token);
  mkdirSafe(publicKeysDir);
  mkdirSafe(privateKeyDir);

  writeKeySafe(path.join(publicKeysDir, `${token}.public_key`), publicKey);
  writeKeySafe(path.join(privateKeyDir, `${token}.private_key`), privateKey);

  return { publicKey, privateKey };
}

export function hasUserKeys(token: string): boolean {
  return fs.existsSync(getIdRsaPath(token)) && fs.existsSync(getIdRsaPubPath(token));
}

export function getUserPublicKey(token: string): string | null {
  const p = getIdRsaPubPath(token);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

export function getUserPrivateKey(token: string): string | null {
  const p = getIdRsaPath(token);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf-8');
}

export function getAuthorizedKeys(token: string): string[] {
  const p = getAuthorizedKeysPath(token);
  if (!fs.existsSync(p)) return [];
  const content = fs.readFileSync(p, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').filter(line => line.trim().length > 0);
}

export function addAuthorizedKey(token: string, devicePublicKey: string): void {
  const p = getAuthorizedKeysPath(token);
  const existing = getAuthorizedKeys(token);
  const trimmed = devicePublicKey.trim();
  if (existing.includes(trimmed)) return;
  const content = existing.length > 0 ? existing.join('\n') + '\n' + trimmed + '\n' : trimmed + '\n';
  writeKeySafe(p, content);
}

export function writeUserProfile(token: string, profile: object): void {
  const homeDir = getUserHomeDir(token);
  mkdirSafe(homeDir);
  const profilePath = path.join(homeDir, 'profile.json');
  fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
}
