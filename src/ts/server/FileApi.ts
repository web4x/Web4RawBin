// [impl:uuid:cdbd3970-ba43-4efc-920d-8352d3c4daa0] T60 file API
// [impl:uuid:64fa793d-53ab-4ae4-81ff-64e917c295a2] FileBrowser.symlinkSupport
// [impl:uuid:e80d3045-8285-4394-836e-d1bbd75e622b] FileBrowser.fixDisplay
// [impl:uuid:6500d4d6-f328-4cac-9b21-977356f9b06c] FileApi.lineParam
// [impl:uuid:5a802d49-7c12-435e-b5dd-a875f8564f05] FileApi.highlightFile
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.enc', '.key', '.woff', '.woff2', '.ttf', '.zip', '.gz', '.tar', '.pdf']);
const RESTRICTED_DIRS = ['node_modules', '.git', 'data/users'];

// R30.6.7: `root` defaults to PROJECT_ROOT (rawbin — existing callers unchanged). RepoRegistry-resolved roots (e.g.
// OOSH) are passed in; the guard applies WITHIN whichever root. root+sep prefix check (no /a vs /ab-evil escape).
export function sanitizePath(relPath: string, root: string = PROJECT_ROOT): string | null {
  const base = path.resolve(root);
  const cleaned = relPath.replace(/\\/g, '/');
  if (cleaned.includes('..') || cleaned.startsWith('/')) return null;
  const resolved = path.resolve(base, cleaned);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) return null;
  const rel = path.relative(base, resolved);
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
  symlink?: boolean;
}

export function readDir(relPath: string, root?: string): { path: string; entries: DirEntry[] } | { error: string; status: number } {
  const absPath = sanitizePath(relPath, root);
  if (!absPath) return { error: 'Forbidden', status: 403 };
  if (!fs.existsSync(absPath)) return { error: 'Not found', status: 404 };
  const stat = fs.statSync(absPath);
  if (!stat.isDirectory()) return { error: 'Not a directory', status: 400 };

  const raw = fs.readdirSync(absPath, { withFileTypes: true });
  const entries: DirEntry[] = [];
  for (const ent of raw) {
    if (ent.name.startsWith('.') && ent.name !== '.env') continue;
    if (ent.isSymbolicLink()) {
      try {
        const target = fs.statSync(path.join(absPath, ent.name));
        if (target.isDirectory()) {
          entries.push({ name: ent.name, type: 'dir', symlink: true });
        } else {
          const ext = path.extname(ent.name);
          entries.push({ name: ent.name, type: 'file', size: target.size, ext, symlink: true });
        }
      } catch { /* broken symlink — skip */ }
    } else if (ent.isDirectory()) {
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

export function readFile(relPath: string, root?: string): { path: string; content: string; size: number; mtime: string } | { error: string; status: number } {
  const absPath = sanitizePath(relPath, root);
  if (!absPath) return { error: 'Forbidden', status: 403 };
  if (!fs.existsSync(absPath)) return { error: 'Not found', status: 404 };
  let realPath = absPath;
  try { const lstat = fs.lstatSync(absPath); if (lstat.isSymbolicLink()) realPath = fs.realpathSync(absPath); } catch {}
  const stat = fs.statSync(realPath);
  if (!stat.isFile()) return { error: 'Not a file', status: 400 };
  const ext = path.extname(realPath).toLowerCase();
  if (BINARY_EXTS.has(ext)) return { error: 'Binary file not supported', status: 415 };
  if (stat.size > 5 * 1024 * 1024) return { error: 'File too large for editor', status: 413 };
  const content = fs.readFileSync(realPath, 'utf-8');
  return { path: relPath, content, size: stat.size, mtime: stat.mtime.toISOString() };
}

// [impl:uuid:a28cea0d-49f5-4d3d-be28-97377800d07a] FileApi.writeFile — R30.38 security-critical bounded WRITE (merge.saveWriteBounded
// c76c6b3a → Method writeFile 00d63275): root? param + sanitizePath(relPath,root) confines the write to the RepoRegistry-resolved
// root (dropped the rawbin-403) so a diff/merge Save targets the CORRECT repo. DISTINCT from RepoRegistry.resolve d7dc0059 (read-path root pick).
export function writeFile(relPath: string, content: string, expectedMtime?: string, root?: string): { ok: true; mtime: string; size: number } | { error: string; status: number; conflict?: boolean; serverMtime?: string } {
  let absPath = sanitizePath(relPath, root); // R30.x save-404: write within the RepoRegistry-resolved root (default rawbin), mirroring readFile — so a diff/merge Save targets the CORRECT repo (e.g. oosh) instead of always rawbin
  if (absPath) { try { const ls = fs.lstatSync(absPath); if (ls.isSymbolicLink()) absPath = fs.realpathSync(absPath); } catch {} }
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
