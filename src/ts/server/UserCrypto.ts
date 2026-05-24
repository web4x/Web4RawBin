import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { getUserHomeDir, getUserPublicKey, getUserPrivateKey } from './UserKeys.js';

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

export function encryptFile(token: string, plaintext: Buffer, mimeType: string, originalName: string): string {
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

  const name = crypto.randomBytes(8).toString('hex');
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
