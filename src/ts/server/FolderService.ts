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

  // [impl:uuid:PENDING-req-mint] createPhysicalFolder — the ONE stripped folder-create CORE (Tron dev-mode 2026-09-02, architect
  // 059107c35): mkdir the target + mint+persist the Folder unit, BOTH-or-NEITHER. NOTHING else — NO confinement / traversal /
  // forbidden-roots / name-validation / per-user isolation / owner-gate / credential (all UNORDERED security, STRIPPED — Tron:
  // do not design security into a feature he did not name). Both-or-neither STAYS = CORRECTNESS (a half-created folder is a
  // broken feature, Tron: do not strip correctness). mkdir throws (missing parent, EEXIST, perms) → NO mint, return not-ok;
  // mint throws → rmdir the target; rmdir throws → log LOUD (orphan). uuid = keyToUuid('folder::'+location) = the R40.16 folder
  // identity (no dup). The TWO endpoints (model / room) differ ONLY in the parentAbsPath + location they pass — ONE mechanism (DRY).
  static createPhysicalFolder(opts: { parentAbsPath: string; name: string; storeDir: string; location: string }): { ok: boolean; unit?: FolderUnit; error?: string } {
    const target = path.join(opts.parentAbsPath, opts.name);
    try {
      fsSync.mkdirSync(target); // non-recursive: a missing parent OR an existing dir throws → NO mint (both-or-neither)
    } catch (e) {
      return { ok: false, error: `mkdir-failed: ${(e as Error)?.message || e}` };
    }
    const uuid = keyToUuid('folder::' + opts.location);
    const unit: FolderUnit = {
      ior: 'ior:class:Folder', ownerIor: null,
      model: { uuid, name: opts.name, location: opts.location, kind: 'folder', parent: null, children: [] },
    };
    const f = path.join(opts.storeDir, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
    try {
      fsSync.mkdirSync(path.dirname(f), { recursive: true }); // shard dir for the unit FILE (store layout), not a user folder
      fsSync.writeFileSync(f, JSON.stringify(unit, null, 2) + '\n');
    } catch (e) {
      try {
        fsSync.rmdirSync(target); // both-or-neither: undo the mkdir on a mint failure
      } catch (rmErr) {
        console.error(`[FolderService] HALF-STATE: minted-dir ${target} could NOT be removed after persist failure (${(rmErr as Error)?.message || rmErr}) — ORPHAN DIRECTORY, manual cleanup required`);
        return { ok: false, error: `half-created: orphan dir ${opts.location}` };
      }
      return { ok: false, error: `persist-failed: ${(e as Error)?.message || e}` };
    }
    return { ok: true, unit };
  }

  // MODEL endpoint resolver (Tron dev-mode STRIPPED): resolve parentAbsPath + location from the parent folder unit, then
  // DELEGATE to the ONE core. NO name-validation / confinement / forbidden-roots / dir-exists (mkdir throws on exists) /
  // per-user / owner-gate — all removed. bad-parent-loc is CORRECTNESS (resolveDirRefAbs fail-closed = nowhere to create).
  // rootDir INJECTABLE (default PROJECT_ROOT) so the fs-backstop/tester run in a scratch root (R40.31). The ROOM endpoint is
  // RoomFilesService.addNestedFolder (built, shared per-room via getRoomDir(creator)/files) — both resolvers call this same core.
  static createPhysicalWithUnit(
    storeDir: string,
    name: string,
    parent: { model?: { location?: string; uuid?: string } } | null,
    rootDir: string = PROJECT_ROOT,
  ): { ok: boolean; unit?: FolderUnit; error?: string } {
    const clean = String(name || '').trim();
    const parentLoc = String(parent?.model?.location || '').replace(/^\/+|\/+$/g, '');
    const parentAbsPath = resolveDirRefAbs('dir:' + parentLoc, rootDir);
    if (!parentAbsPath) return { ok: false, error: 'bad-parent-loc' };
    return FolderService.createPhysicalFolder({ parentAbsPath, name: clean, storeDir, location: `${parentLoc}/${clean}` });
  }
}
