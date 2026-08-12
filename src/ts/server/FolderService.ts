// R40.37 AC5 — FolderService (Class c3f261fa). "Add folder" mints a REAL PERSISTED scenario-unit (Tron's ruling:
// "physical" = a persisted unit on disk, NOT a filesystem directory — there is NO user-facing mkdir). Supersedes the
// unit-only server.createFolder (28000b00, supersede-with-record — kept, additive). The itemview BECOMES the returned
// unit in ONE step (no separate save).
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type FolderUnit = { ior: 'ior:class:Folder'; ownerIor: null; model: { uuid: string; name: string; parent: string | null; children: string[]; kind: 'folder' | 'diagrams' } };

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
}
