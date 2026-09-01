// T37.21 Part 2 — createPhysicalWithUnit DROP-IN BODY (architect, 2026-09-01, PO-sanctioned throughput handoff).
// Add to FolderService (import keyToUuid from '../scenario/TsToModel.js'; path/fs/crypto already present).
// Also CORRECT the stale FolderService.ts:2 comment: "physical" now = persisted unit AND real fs directory (Tron 2026-09-01).
//
// Contract: mint the Folder unit AND mkdir the real directory — both, or NEITHER (no half-state). rootDir injectable
// (default PROJECT_ROOT) so the backstop/gate run isolated (R40.31). Returns { ok, unit?, error? }.

import { keyToUuid } from '../scenario/TsToModel.js';

// repo root — same depth as server.ts (__dirname = dist/ts/server → ../../.. = repo root)
const PROJECT_ROOT = path.join(__dirname, '../../..');

// dirs that are NEVER user folders (stores + system) — reject a target that resolves into any of them
const FORBIDDEN_ROOTS = ['scenario/index', 'data/model-store', '.git', 'node_modules', '.env', '.certs'];

static createPhysicalWithUnit(
  storeDir: string,
  name: string,
  parent: { model?: { location?: string; uuid?: string } } | null,
  rootDir: string = PROJECT_ROOT,
): { ok: boolean; unit?: FolderUnit; error?: string } {
  // (i) NAME VALIDATION — fail-closed, no mkdir, no mint
  const clean = String(name || '').trim();
  if (!clean || clean.length > 80 || !/^[A-Za-z0-9._-]+$/.test(clean) || clean === '.' || clean === '..') {
    return { ok: false, error: 'invalid-name' };
  }
  // parent must be a PHYSICAL folder (carries a location); a virtual parent (room collection) never reaches here
  const parentLoc = String(parent?.model?.location || '').replace(/^\/+|\/+$/g, '');
  if (!parentLoc) return { ok: false, error: 'parent-not-physical' };

  const relpath = `${parentLoc}/${clean}`;
  const target = path.resolve(rootDir, parentLoc, clean);

  // (ii) CONFINEMENT — strict subpath of rootDir AND not in any store/system dir; reject traversal/absolute
  const rootAbs = path.resolve(rootDir);
  if (target !== rootAbs && !target.startsWith(rootAbs + path.sep)) return { ok: false, error: 'confinement' };
  const relFromRoot = path.relative(rootAbs, target);
  if (relFromRoot.startsWith('..') || path.isAbsolute(relFromRoot)) return { ok: false, error: 'confinement' };
  if (FORBIDDEN_ROOTS.some((f) => relFromRoot === f || relFromRoot.startsWith(f + path.sep))) return { ok: false, error: 'confinement' };

  // (iii) DIR EXISTS — fail-closed, mint nothing
  if (fsSync.existsSync(target)) return { ok: false, error: 'exists' };

  // MKDIR the real directory (non-recursive: parent must already exist; a missing parent is a real error, not silent)
  try {
    fsSync.mkdirSync(target, { recursive: false });
  } catch (e) {
    return { ok: false, error: `mkdir-failed: ${(e as Error)?.message || e}` };
  }

  // MINT+PERSIST the unit — uuid = the ensureViewUnit('dir:'+relpath) identity ⇒ ONE folder model, no dup (R40.16)
  const uuid = keyToUuid('folder::' + relpath);
  const unit: FolderUnit = {
    ior: 'ior:class:Folder', ownerIor: null,
    model: { uuid, name: clean, location: relpath, kind: 'folder', parent: (parent?.model?.uuid ? `ior:instance:${parent.model.uuid}` : null), children: [] },
  };
  const f = path.join(storeDir, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
  try {
    fsSync.mkdirSync(path.dirname(f), { recursive: true }); // shard dir for the unit FILE (store layout) — not a user folder
    fsSync.writeFileSync(f, JSON.stringify(unit, null, 2) + '\n');
  } catch (e) {
    // (iv) MINT FAILS AFTER MKDIR → remove the dir we just made (write-or-nothing, both directions)
    try {
      fsSync.rmdirSync(target);
    } catch (rmErr) {
      // (v) RMDIR FAILS → LOUD, never silent; name the orphan so a human can clean it
      try { addLog(`[FolderService] HALF-STATE: minted-dir ${target} could NOT be removed after persist failure (${(rmErr as Error)?.message || rmErr}) — ORPHAN DIRECTORY, manual cleanup required`); } catch { /* addLog best-effort */ }
      return { ok: false, error: `half-created: orphan dir ${relpath}` };
    }
    return { ok: false, error: `persist-failed: ${(e as Error)?.message || e}` };
  }

  // unit AND dir both exist, in step
  return { ok: true, unit };
}
