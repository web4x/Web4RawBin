// R40.37 AC5 — FolderService (Class c3f261fa). "Add folder" mints a REAL PERSISTED scenario-unit.
// ★ DEFINITION CHANGED — TRON RULING 2026-09-01 (T37.21): "physical" = BOTH a persisted unit on disk AND a real
// filesystem directory (mkdir), so the model and the filesystem stay in step. This CORRECTS the earlier comment here
// which said "physical" = a persisted unit NOT a directory / no user-facing mkdir and ATTRIBUTED that to Tron — that
// attribution is now WRONG and it misled the team once (2026-09-01). The mkdir lives in createPhysicalWithUnit
// (BOTH-or-neither atomicity). Supersedes the unit-only server.createFolder (28000b00, supersede-with-record — kept,
// additive). The itemview BECOMES the returned unit in ONE step (no separate save).
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { keyToUuid } from '../scenario/TsToModel.js'; // R37.21 Part 2: deterministic folder uuid (= ensureViewUnit('dir:'+relpath) identity → ONE model, no dup)

// ESM __dirname shim (tsx runs from src/): src/ts/server → ../../.. = repo root
const FS_DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(FS_DIRNAME, '../../..');
// dirs that are NEVER user folders (stores + system) — reject a target resolving into any of them (R37.21 Part 2 confinement)
const FORBIDDEN_ROOTS = ['scenario/index', 'data/model-store', '.git', 'node_modules', '.env', '.certs'];

export type FolderUnit = { ior: 'ior:class:Folder'; ownerIor: null; model: { uuid: string; name: string; parent: string | null; children: string[]; kind: 'folder' | 'diagrams'; location?: string } };

// [impl:uuid:8ac3ba20] DirRef.resolveDirRefAbs (Class 3758a4d1 DirRef, Method c5d3bca9, UC 2d193523 = R37.33; architect
// design 71e7c87ab / chain 1b46283cf) — the ONE dir-ref→absolute-path resolver. CORRECT-BY-CONSTRUCTION: all dir: refs
// are REPO-RELATIVE now (aligned with file: which already is), so this is a trivial root-join with NO src-vs-repo
// discriminator — it RETIRES the existence-based heuristic. Used by createPhysicalWithUnit + sourceDirTree +
// ensureViewUnit-location so the dir: namespace has ONE base-resolution. root injectable for the R40.31 scratch-root
// fs-backstop/tester. Fail-closed: '' on empty or '..'-traversal ref (the caller still confines = defense-in-depth).
export function resolveDirRefAbs(ref: string, root: string = PROJECT_ROOT): string {
  const rel = String(ref).replace(/^dir:/, '').replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return '';
  return path.resolve(root, rel);
}

export class FolderService {
  // [impl:uuid:0e6761c2-7b4e-472e-9c63-4793b766a288] FolderService.mintRealUnit (Method 36a73988, Class c3f261fa, UC
  // folder.mintRealUnit) — mint + persist the Folder unit atomically and RETURN it so the itemview is one-step.
  // Atomicity = the single unit write (write-or-nothing): if the persist throws, NOTHING is written and no unit is
  // returned → the caller renders NO phantom node (AC5). "Physical" = a REAL PERSISTED unit (Tron); the shard mkdir is
  // the store's FILE layout for the unit JSON, not a user directory.
  static mintRealUnit(storeDir: string, name: string, parent: string, kind: 'folder' | 'diagrams' = 'folder'): { ok: boolean; unit?: FolderUnit; error?: string } {
    const clean = String(name || '').trim().slice(0, 80);
    if (!clean) return { ok: false, error: 'empty-name' };
    const uuid = crypto.randomUUID();
    const unit: FolderUnit = { ior: 'ior:class:Folder', ownerIor: null, model: { uuid, name: clean, parent: String(parent || '') || null, children: [], kind } };
    const f = path.join(storeDir, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
    try {
      fsSync.mkdirSync(path.dirname(f), { recursive: true }); // shard dir for the unit FILE (store layout) — NOT a user "folder"
      fsSync.writeFileSync(f, JSON.stringify(unit, null, 2) + '\n'); // the ONE atomic write; INV store-only (MODEL_STORE, prod untouched)
    } catch (e) {
      return { ok: false, error: `persist-failed: ${(e as Error)?.message || e}` }; // write-or-nothing → caller shows no phantom
    }
    return { ok: true, unit };
  }

  // [impl:uuid:PENDING-req-mint] R37.21 Part 2 (architect body 74c553d43) — createPhysicalWithUnit: "Add folder" mints the
  // Folder unit AND mkdir's the REAL directory — BOTH, or NEITHER (no half-state). TRON RULING 2026-09-01: physical = unit
  // AND fs dir. rootDir INJECTABLE (default PROJECT_ROOT) so the architect fs-backstop + tester gate run in a SCRATCH root
  // (R40.31), never mutating the real repo. 5 failure paths: invalid-name / confinement(+FORBIDDEN_ROOTS) / dir-exists /
  // mint-fails→rmdir / rmdir-fails→LOUD-name-orphan. uuid=keyToUuid('folder::'+relpath) = the ensureViewUnit dir identity (no dup, R40.16).
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
    // R37.33 (architect 71e7c87ab): the dir: namespace is now UNIFORMLY repo-relative → the ONE resolver replaces the old
    // existence-based src-vs-repo heuristic. parentLoc is repo-relative (e.g. 'src/ts', 'scrum.pmo/…') → resolveDirRefAbs
    // joins it to rootDir by construction, no fallback. Fail-closed if the parent location is empty/traversal.
    const parentBase = resolveDirRefAbs('dir:' + parentLoc, rootDir);
    if (!parentBase) return { ok: false, error: 'bad-parent-loc' };
    const target = path.join(parentBase, clean);

    // (ii) CONFINEMENT — strict subpath of rootDir AND not in any store/system dir; reject traversal/absolute
    const rootAbs = path.resolve(rootDir);
    if (target !== rootAbs && !target.startsWith(rootAbs + path.sep)) return { ok: false, error: 'confinement' };
    const relFromRoot = path.relative(rootAbs, target);
    if (relFromRoot.startsWith('..') || path.isAbsolute(relFromRoot)) return { ok: false, error: 'confinement' };
    if (FORBIDDEN_ROOTS.some((fr) => relFromRoot === fr || relFromRoot.startsWith(fr + path.sep))) return { ok: false, error: 'confinement' };

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
        // (v) RMDIR FAILS → LOUD, never silent; name the orphan so a human can clean it (addLog is server-local → console.error, module-safe)
        console.error(`[FolderService] HALF-STATE: minted-dir ${target} could NOT be removed after persist failure (${(rmErr as Error)?.message || rmErr}) — ORPHAN DIRECTORY, manual cleanup required`);
        return { ok: false, error: `half-created: orphan dir ${relpath}` };
      }
      return { ok: false, error: `persist-failed: ${(e as Error)?.message || e}` };
    }

    // unit AND dir both exist, in step
    return { ok: true, unit };
  }
}
