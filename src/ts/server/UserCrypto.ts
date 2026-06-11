import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getUserHomeDir, getUserPublicKey, getUserPrivateKey, regenerateUserKeypair } from './UserKeys.js';

function getFilesDir(token: string): string {
  return path.join(getUserHomeDir(token), 'files');
}

interface FileMeta {
  encryptedKey: string;
  iv: string;
  authTag: string;
  mimeType: string;
  originalName: string;
  size: number;
  uploadedAt: string;
}

export function encryptFile(token: string, plaintext: Buffer, mimeType: string, originalName: string, storedName?: string): string {
  const pubKey = getUserPublicKey(token);
  if (!pubKey) throw new Error('User public key not found');

  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encryptedKey = crypto.publicEncrypt(
    { key: pubKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  );

  const filesDir = getFilesDir(token);
  fs.mkdirSync(filesDir, { recursive: true });

  const name = storedName || crypto.randomBytes(8).toString('hex');
  const encPath = path.join(filesDir, `${name}.enc`);
  const metaPath = path.join(filesDir, `${name}.meta.json`);

  fs.writeFileSync(encPath, encrypted);

  const meta: FileMeta = {
    encryptedKey: encryptedKey.toString('base64'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    mimeType,
    originalName,
    size: plaintext.length,
    uploadedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  return name;
}

export function decryptFile(token: string, filename: string): { data: Buffer; mimeType: string } {
  const privKey = getUserPrivateKey(token);
  if (!privKey) throw new Error('User private key not found');

  const filesDir = getFilesDir(token);
  const encPath = path.join(filesDir, `${filename}.enc`);
  const metaPath = path.join(filesDir, `${filename}.meta.json`);

  if (!fs.existsSync(encPath) || !fs.existsSync(metaPath)) throw new Error('File not found');

  const meta: FileMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const encrypted = fs.readFileSync(encPath);

  const aesKey = crypto.privateDecrypt(
    { key: privKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(meta.encryptedKey, 'base64')
  );

  const iv = Buffer.from(meta.iv, 'hex');
  const authTag = Buffer.from(meta.authTag, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return { data: decrypted, mimeType: meta.mimeType };
}

export function deleteFile(token: string, filename: string): boolean {
  const filesDir = getFilesDir(token);
  const encPath = path.join(filesDir, `${filename}.enc`);
  const metaPath = path.join(filesDir, `${filename}.meta.json`);
  let deleted = false;
  if (fs.existsSync(encPath)) { fs.unlinkSync(encPath); deleted = true; }
  if (fs.existsSync(metaPath)) { fs.unlinkSync(metaPath); deleted = true; }
  return deleted;
}

export function listUserFiles(token: string): { name: string; meta: FileMeta }[] {
  const filesDir = getFilesDir(token);
  if (!fs.existsSync(filesDir)) return [];
  return fs.readdirSync(filesDir)
    .filter(f => f.endsWith('.meta.json'))
    .map(f => {
      const name = f.replace('.meta.json', '');
      const meta: FileMeta = JSON.parse(fs.readFileSync(path.join(filesDir, f), 'utf-8'));
      return { name, meta };
    });
}

export function fileExists(token: string, filename: string): boolean {
  const filesDir = getFilesDir(token);
  return fs.existsSync(path.join(filesDir, `${filename}.enc`)) && fs.existsSync(path.join(filesDir, `${filename}.meta.json`));
}

/**
 * Rekey a user's identity WITHOUT orphaning their encrypted files (avatar fix + S14 T97
 * invariant). Each file's AES key is RSA-wrapped with the user's public key, so a keypair
 * rotation makes the OLD ciphertext undecryptable → avatar.enc orphaned → avatar reverts to
 * the SVG fallback. This snapshots every file's plaintext with the CURRENT key, rotates the
 * keypair, then RE-ENCRYPTS each snapshot with the NEW key — so nothing is left orphaned.
 *
 * Files that can't be decrypted with the current key (old key already gone/corrupt) are
 * unrecoverable and skipped (counted in `lost`). Re-encryption preserves stored name,
 * original name, and mimeType, so `/api/avatar/<token>` keeps working after the rekey.
 *
 * [impl:uuid:4c152c96-1b2a-40ad-b02d-a7a71dd30db5] avatar-fallback fix — re-encrypt files/* on identity rekey
 */
export function rekeyUser(token: string): { reEncrypted: number; lost: number } {
  const snapshot: { name: string; data: Buffer; mimeType: string; originalName: string }[] = [];
  let lost = 0;
  for (const { name, meta } of listUserFiles(token)) {
    try {
      const { data, mimeType } = decryptFile(token, name); // decrypt with CURRENT (old) key first
      snapshot.push({ name, data, mimeType, originalName: meta.originalName });
    } catch {
      lost++; // old key already gone/corrupt — this ciphertext is unrecoverable
    }
  }
  regenerateUserKeypair(token); // rotate: delete old keypair, generate fresh
  for (const f of snapshot) {
    encryptFile(token, f.data, f.mimeType, f.originalName, f.name); // re-wrap with the NEW key
  }
  return { reEncrypted: snapshot.length, lost };
}
