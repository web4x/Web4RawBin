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

// The synthetic view-ref prefixes the SERVER mints (mirror of server.ts ensureViewUnit's branches + the client
// synthetic-ref.ts SYNTHETIC_PREFIX). Used ONLY to decide whether a redundant outer `collection:` wraps an inner
// synthetic ref (so we strip it) vs a genuine room-collection remainder (left for its own branch). Server-side twin of
// the client rule at synthetic-ref.ts:30 — ONE rule, replicated because src/ts (server) cannot import src/public (client).
const SERVER_SYNTHETIC_PREFIX = /^(dir:|file:|puml-src:|project:|rawbin:|roomcoll:|mof-m1|mof-m2)/;

// [impl:uuid:PENDING-req-mint] rawbinToRepoDir — the ONE source for the rawbin:* → real repo-relative dir mapping
// (was inlined at server.ts:1710 `uuid === 'rawbin:ts' ? 'src' : …`). Only rawbin:ts is filesystem-backed (= the whole
// src/ tree); rawbin:puml / rawbin:diagram / rawbin:traceability are VIRTUAL buckets (puml artifacts / diagrams /
// trace) with no single real dir → '' (fail-closed at the caller = a genuine bad-parent-loc, you cannot mkdir under them).
export function rawbinToRepoDir(ref: string): string {
  return String(ref) === 'rawbin:ts' ? 'src' : '';
}

// [impl:uuid:PENDING-req-mint] resolveFolderRefToDir (architect Option B, design-t37.21 85c71828b) — map ANY folder-ish
// ref → its physical dir, fixing BOTH bad-parent-loc causes at ONE point (no data change, no migration; the location
// FIELD is left untouched so the server.ts tree-builder still reads it). CAUSE 1: strip the redundant outer
// `collection:` display prefix when the remainder is itself synthetic (mofFolder emits type='collection' → e.g.
// 'collection:dir:src/ts'); a genuine room-collection remainder (non-synthetic) is left untouched → fails closed here.
// CAUSE 2: map rawbin: synthetic refs through rawbinToRepoDir (rawbin:ts → 'src'). Then delegate to resolveDirRefAbs
// (repo-relative join, fail-closed). Returns '' when the ref maps to NO real dir → the caller returns bad-parent-loc,
// which thus keeps its fail-closed meaning (fires ONLY for a genuinely non-physical parent).
export function resolveFolderRefToDir(rawRef: string, root: string = PROJECT_ROOT): string {
  let ref = String(rawRef || '').replace(/^ior:instance:/, ''); // defensive: an instance-wrapped ref never carries a dir
  if (!ref) return '';
  // CAUSE 1 — reuse synthetic-ref.ts:30's rule: peel a redundant outer collection: only when the inner is synthetic.
  if (ref.startsWith('collection:') && SERVER_SYNTHETIC_PREFIX.test(ref.slice('collection:'.length))) ref = ref.slice('collection:'.length);
  // CAUSE 2 — rawbin: buckets: rawbin:ts → src (real), other rawbin:* → no real dir (fail-closed).
  if (ref.startsWith('rawbin:')) { const rb = rawbinToRepoDir(ref); return rb ? resolveDirRefAbs('dir:' + rb, root) : ''; }
  // dir: refs resolve directly; everything else (bare uuid, project:, file:, roomcoll:, …) has no model physical dir here.
  if (ref.startsWith('dir:')) return resolveDirRefAbs(ref, root);
  return '';
}

// [impl:uuid:PENDING-req-mint] isVirtualModelParent (R40.87-B, architect) — the DISCRIMINATOR that makes the model add-folder
// '' branch FAIL-CLOSED. A parent that resolves to NO physical dir (resolveFolderRefToDir === '') is minted as a store-only
// unit ONLY when it is a LEGITIMATE virtual/model container; a genuinely MALFORMED ref must NOT mint (it returns bad-parent-loc).
// LEGIT = (a) a recognized model COLLECTION/bucket ref the mof tree emits as a container (rawbin:diagram = the diagrams
// collection, project:*, mof-m1/m2, a collection: ref), OR (b) an EXISTING persisted Folder unit in MODEL_STORE (nesting under
// an already-minted virtual folder). A bare display-name ('diagram', 'RawBin'), a random string, or a type-prefixed dangling
// ref (task:0000…) matches NEITHER → false → bad-parent-loc. Mirrors offered⟺succeeds: the verb is only legitimately offered on
// a REAL model container, so a ref that resolves to no container is never a legitimate add-folder target. FAIL-CLOSED by default.
export function isVirtualModelParent(rawRef: string, storeDir: string): boolean {
  const ref = String(rawRef || '').replace(/^ior:instance:/, '');
  if (!ref) return false;
  // (a) a recognized model collection/bucket ref (canonical synthetic containers the mof tree derives)
  if (/^(rawbin:(diagram|ts|puml|traceability)\b|project:|mof-m[12]\b|collection:)/.test(ref)) return true;
  // (b) an existing persisted Folder unit in MODEL_STORE (nest under an already-minted virtual folder)
  const uuid = ref.includes(':') ? ref.slice(ref.lastIndexOf(':') + 1) : ref;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)) {
    try {
      const f = path.join(storeDir, ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
      const u = JSON.parse(fsSync.readFileSync(f, 'utf8'));
      if (u && u.ior === 'ior:class:Folder') return true;
    } catch { /* not found → not a virtual parent */ }
  }
  return false;
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

  // [physical-folder-owner] R40.88/R40.93 (architect design-r40.93 79edbc54a): the SOLE raw user-directory mkdir primitive —
  // EVERY physical folder-create's mkdir routes THROUGH here (createPhysicalFolder = the model+Folder-unit path; the server.ts
  // room route = the createFileUnit/items-tree path). A user-dir mkdir anywhere else = RED. NO unit mint here → the caller mints
  // its OWN (a Folder unit, or a room file-unit) = ONE mkdir owner, NO double-mint. Non-recursive: a missing parent OR an
  // existing dir throws (both-or-neither is completed at the caller, which rmdir's absPath on its own mint failure).
  // [impl:uuid:PENDING-req-mint] createPhysicalDir (R40.93) — mkdir the target dir + return its abs path (owner marker moved here from createPhysicalFolder).
  static createPhysicalDir(parentAbsPath: string, name: string): { ok: boolean; absPath?: string; error?: string } {
    const target = path.join(parentAbsPath, name);
    try {
      fsSync.mkdirSync(target); // non-recursive: a missing parent OR an existing dir throws → NO dir (both-or-neither at the caller)
    } catch (e) {
      return { ok: false, error: `mkdir-failed: ${(e as Error)?.message || e}` };
    }
    return { ok: true, absPath: target };
  }

  // [impl:uuid:PENDING-req-mint] createPhysicalFolder — the model+Folder-unit path (Tron dev-mode 2026-09-02, architect
  // 059107c35): mkdir via the ONE owner createPhysicalDir (R40.93 — the owner marker moved there), then mint+persist the Folder
  // unit, BOTH-or-NEITHER. NOTHING else — NO confinement / traversal / forbidden-roots / name-validation / per-user isolation /
  // owner-gate / credential (all UNORDERED security, STRIPPED — Tron: do not design security into a feature he did not name).
  // Both-or-neither STAYS = CORRECTNESS. mkdir fails → return its error (no mint); mint throws → rmdir absPath; rmdir throws →
  // log LOUD (orphan). uuid = keyToUuid('folder::'+location) = the R40.16 folder identity. Model + room differ only in the caller.
  static createPhysicalFolder(opts: { parentAbsPath: string; name: string; storeDir: string; location: string }): { ok: boolean; unit?: FolderUnit; error?: string } {
    const dir = FolderService.createPhysicalDir(opts.parentAbsPath, opts.name);
    if (!dir.ok) return { ok: false, error: dir.error };
    const target = dir.absPath!;
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

  // MODEL endpoint resolver (Tron dev-mode STRIPPED): resolve parentAbsPath from the RAW parent REF through the ONE
  // resolveFolderRefToDir (architect Option B, 85c71828b) — NOT from parent.model.location (the old path was blind to the
  // collection: display prefix = cause 1, and trusted the synthetic rawbin: location = cause 2). NO name-validation /
  // confinement / forbidden-roots / dir-exists (mkdir throws on exists) / per-user / owner-gate. bad-parent-loc stays
  // CORRECTNESS + fail-closed (the resolver returns '' only when the ref maps to NO real dir). rootDir INJECTABLE so the
  // fs-backstop/tester run in a scratch root (R40.31). The location FIELD is derived from the resolved abs path (repo-relative)
  // so it stays the bare dir: convention the tree-builder reads. The ROOM endpoint is RoomFilesService.addNestedFolder
  // (shared per-room via getRoomDir(creator)/files) — both resolvers call this same createPhysicalFolder core (DRY).
  static createPhysicalWithUnit(
    storeDir: string,
    name: string,
    parentRawRef: string | null,
    rootDir: string = PROJECT_ROOT,
  ): { ok: boolean; unit?: FolderUnit; error?: string } {
    const clean = String(name || '').trim();
    const parentAbsPath = resolveFolderRefToDir(String(parentRawRef || ''), rootDir);
    if (!parentAbsPath) return { ok: false, error: 'bad-parent-loc' };
    const relParent = path.relative(rootDir, parentAbsPath).split(path.sep).join('/'); // repo-relative parent for the unit's location field
    return FolderService.createPhysicalFolder({ parentAbsPath, name: clean, storeDir, location: `${relParent}/${clean}` });
  }
}
