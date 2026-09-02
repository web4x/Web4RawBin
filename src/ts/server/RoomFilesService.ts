// R40.78 RoomFilesService (Class 75c52485) — Add-folder INSIDE a room Files collection = a NESTED room folder.
// ★ SHARED PER-ROOM (Tron dev-mode STRIP, architect+PO 2026-09-02): the folder lives under the ROOM CREATOR's dir —
// getRoomDir(creatorToken, roomId)/files/<nestedPath> — so EVERY member's Add-folder lands in the SAME folder (Tron's
// "Files IS the room folder" ruling: shared, not per-viewer). Resolve creatorToken from the Room unit's ownerIor, NOT the
// calling user — that is what makes it per-room, not per-user. This is the SAME canonical path room-DELETE already uses
// (existing, in scope, no new architecture). A THIN resolver that delegates to the ONE stripped core
// FolderService.createPhysicalFolder (mkdir + mint + both-or-neither; NO unordered guard/gate/isolation/credential).
// ★ SUPERSEDES the earlier per-user / storageId / R40.22-chokepoint shape: Tron's strip ruling RETIRED per-user + the
// chokepoint + raw-reject (planner strip commit) — that was a PRE-STRIP design, NOT a live Tron lock. DRY: model + room
// endpoints differ ONLY in the parentAbsPath they resolve.
import path from 'node:path';
import { getRoomDir } from './RoomKeys.js';
import { FolderService, type FolderUnit } from './FolderService.js';

export class RoomFilesService {
  // [impl:uuid:70916a80] RoomFilesService.addNestedFolder (Class 75c52485 / Method accf56ab / UC 65b07a49 = R40.78) — the
  // ROOM resolver: resolve the SHARED per-room parentAbsPath from the ROOM CREATOR's room dir, then DELEGATE to the ONE core.
  // creatorToken = the Room unit's ownerIor (the caller/route resolves it) → one folder all members see. storeDir/DATA_DIR
  // injectable (via RoomKeys DATA_DIR env) so the fs-backstop/tester run in an isolated scratch root (R40.31).
  static addNestedFolder(
    storeDir: string,
    roomId: string,
    creatorToken: string,   // the ROOM CREATOR (from Room.ownerIor), NOT the calling user → shared per-room folder
    nestedPath: string,     // the parent folder's files-relative path ('' = directly under the Files collection)
    name: string,
  ): { ok: boolean; unit?: FolderUnit; error?: string } {
    const clean = String(name || '').trim();
    const nrel = String(nestedPath || '').replace(/^\/+|\/+$/g, '');
    const roomDir = getRoomDir(creatorToken, roomId, { mint: true }); // the creator's canonical room dir (same path room-DELETE uses)
    const filesBase = path.join(roomDir, 'files');
    const parentAbsPath = nrel ? path.join(filesBase, nrel) : filesBase;
    const fullNested = nrel ? `${nrel}/${clean}` : clean;
    const location = `roomcoll:${roomId}:files/${fullNested}`; // logical roomcoll ref (shared, per-room; out of resolveDirRefAbs's repo namespace)
    return FolderService.createPhysicalFolder({ parentAbsPath, name: clean, storeDir, location });
  }
}
