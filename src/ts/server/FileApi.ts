import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.enc', '.key', '.woff', '.woff2', '.ttf', '.zip', '.gz', '.tar', '.pdf']);
const RESTRICTED_DIRS = ['node_modules', '.git', 'data/users'];

export function sanitizePath(relPath: string): string | null {
  const cleaned = relPath.replace(/\\/g, '/');
  if (cleaned.includes('..')) return null;
  const resolved = path.resolve(PROJECT_ROOT, cleaned);
  if (!resolved.startsWith(PROJECT_ROOT)) return null;
  const rel = path.relative(PROJECT_ROOT, resolved);
  for (const dir of RESTRICTED_DIRS) {
    if (rel.startsWith(dir + '/') || rel === dir) return null;
  }
  return resolved;
}

export interface DirEntry {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  ext?: string;
}

export function readDir(relPath: string): { path: string; entries: DirEntry[] } | { error: string; status: number } {
  const absPath = sanitizePath(relPath);
  if (!absPath) return { error: 'Forbidden', status: 403 };
  if (!fs.existsSync(absPath)) return { error: 'Not found', status: 404 };
  const stat = fs.statSync(absPath);
  if (!stat.isDirectory()) return { error: 'Not a directory', status: 400 };

  const raw = fs.readdirSync(absPath, { withFileTypes: true });
  const entries: DirEntry[] = [];
  for (const ent of raw) {
    if (ent.name.startsWith('.') && ent.name !== '.env') continue;
    if (ent.isDirectory()) {
      entries.push({ name: ent.name, type: 'dir' });
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name);
      const fileStat = fs.statSync(path.join(absPath, ent.name));
      entries.push({ name: ent.name, type: 'file', size: fileStat.size, ext });
    }
  }
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return { path: relPath, entries };
}

export function readFile(relPath: string): { path: string; content: string; size: number; mtime: string } | { error: string; status: number } {
  const absPath = sanitizePath(relPath);
  if (!absPath) return { error: 'Forbidden', status: 403 };
  if (!fs.existsSync(absPath)) return { error: 'Not found', status: 404 };
  const stat = fs.statSync(absPath);
  if (!stat.isFile()) return { error: 'Not a file', status: 400 };
  const ext = path.extname(absPath).toLowerCase();
  if (BINARY_EXTS.has(ext)) return { error: 'Binary file not supported', status: 415 };
  if (stat.size > 5 * 1024 * 1024) return { error: 'File too large for editor', status: 413 };
  const content = fs.readFileSync(absPath, 'utf-8');
  return { path: relPath, content, size: stat.size, mtime: stat.mtime.toISOString() };
}

export function writeFile(relPath: string, content: string, expectedMtime?: string): { ok: true; mtime: string; size: number } | { error: string; status: number; conflict?: boolean; serverMtime?: string } {
  const absPath = sanitizePath(relPath);
  if (!absPath) return { error: 'Forbidden', status: 403 };
  if (!fs.existsSync(absPath)) return { error: 'File not found — cannot create new files', status: 404 };
  const stat = fs.statSync(absPath);
  if (!stat.isFile()) return { error: 'Not a file', status: 400 };
  const ext = path.extname(absPath).toLowerCase();
  if (BINARY_EXTS.has(ext)) return { error: 'Binary file not writable', status: 415 };
  const contentBuf = Buffer.from(content, 'utf-8');
  if (contentBuf.length > 1024 * 1024) return { error: 'Content too large (max 1MB)', status: 413 };

  if (expectedMtime) {
    const currentMtime = stat.mtime.toISOString();
    if (currentMtime !== expectedMtime) {
      return { error: 'File modified externally', status: 409, conflict: true, serverMtime: currentMtime };
    }
  }

  fs.writeFileSync(absPath, content, 'utf-8');
  const newStat = fs.statSync(absPath);
  return { ok: true, mtime: newStat.mtime.toISOString(), size: newStat.size };
}
