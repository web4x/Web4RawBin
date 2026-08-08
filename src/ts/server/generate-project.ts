/**
 * S33-P2a generate-project CORE, extracted so the HTTP handler (/api/model/generate-project) AND a LOCAL in-process
 * trigger (scripts/regen-model.ts, T36.3) run the SAME code path with the SAME invariants — reuse, not reimplement.
 * This is NOT an HTTP route and NOT an auth bypass: the owner-gate stays on the HTTP handler exactly as strict; the
 * local trigger is safe because a root shell on the box already exceeds an owner browser session (no new network surface).
 *
 * INV-P2: BOUNDED manifest (default src/ts/scenario, EXCLUDE *.test/*.spec/*.d.ts + node_modules/dist, HARD CAP 200 —
 * never all-of-RawBin by accident) · INV-P2-3 NO auto-diagram · INV-P2-4 MODEL_STORE only (prod scenario/index untouched).
 */
import fsSync from 'node:fs';
import path from 'node:path';
import { TsToModel } from '../scenario/TsToModel.js';

export interface GenProjectResult { ok: boolean; error?: string; status?: number; dir?: string; files?: number; units?: number; roots?: number; wrote?: number; removed?: number; }

// seed the M2 catalog shard (a1d2e…) into the store so generated M1 instanceOf refs resolve — mirrors server.ensureStoreSeeded.
function seedStore(modelStore: string, prodIndex: string): void {
  const src = path.join(prodIndex, 'a', '1', 'd', '2', 'e'), dst = path.join(modelStore, 'a', '1', 'd', '2', 'e');
  fsSync.mkdirSync(dst, { recursive: true });
  if (fsSync.existsSync(src)) for (const f of fsSync.readdirSync(src)) { const d = path.join(dst, f); if (!fsSync.existsSync(d)) fsSync.copyFileSync(path.join(src, f), d); }
}

/** The ONE generate-project path: validate the bounded dir → CAP-guarded .ts walk → seed → TsToModel.generate into the
 *  ISOLATED model store (write, no diagram). Returns a plain result; callers map it to HTTP or CLI output. */
export function generateProjectModel(projectRoot: string, relDir: string, modelStore: string, prodIndex: string): GenProjectResult {
  const absDir = path.resolve(projectRoot, relDir);
  if (!absDir.startsWith(projectRoot + path.sep) || !fsSync.existsSync(absDir)) return { ok: false, status: 400, error: 'bad-dir: must be an existing repo-relative dir' };
  const CAP = 200, EXCL = /\.(test|spec|d)\.ts$/;
  const files: string[] = [];
  const walk = (d: string): void => { for (const e of fsSync.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name === 'node_modules' || e.name === 'dist') continue; walk(p); } else if (e.name.endsWith('.ts') && !EXCL.test(e.name)) files.push(p); } };
  walk(absDir);
  if (files.length > CAP) return { ok: false, status: 413, error: `too-many-files: ${files.length} > CAP ${CAP} (narrow the dir)` };
  seedStore(modelStore, prodIndex);
  const r = new TsToModel(projectRoot).generate(files, { indexDir: modelStore, write: true, diagram: false });
  const roots = r.units.filter((u) => u.model.metaLevel === 'M1' && !u.model.memberOf).length;
  return { ok: true, dir: relDir, files: files.length, units: r.units.length, roots, wrote: r.wrote, removed: r.removed };
}
