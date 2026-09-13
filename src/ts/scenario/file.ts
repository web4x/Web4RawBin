// Sprint 41 (T41.1, architect design sprint-41-oop-model-consistency.md + ruling 2026-09-13) — class File as a
// real radical-OOP M1 class: behaviour on the object (ask-the-object), NOT a data-bag. ONE shared class for BOTH
// server and client → PURE by construction (crypto/fs/DOM-free): its methods produce DATA (an IOR string, a
// view-model, a command), never effects. Effects live at the thin adapters (server file-unit.ts persist/create;
// client DOM render + transport). This is the MVC Model half of the 41.3 observer kernel — same object.
//
// This increment = File.ownIor() only (chain: UC file.resolveOwnIor → Class File 13782f0c → Method 8d5a11e6).
// renderSelf() (view-model) and moveTo(target) (command) land in the next increments.
import { Ior } from './ior.js';

// The File's own model fields (a subset of the unit model) the class needs to answer its methods. `origin` is only
// required to compose ownIor(); render/move work without it.
export interface FileModel { uuid: string; origin?: string; name?: string; mimeType?: string; }

// The PURE view-model File.renderSelf() returns — DATA, not DOM. A thin client adapter renders it (icon+name node).
export interface FileViewModel { kind: 'file'; uuid: string; icon: string; name: string; badges: string[]; }

export class File {
  constructor(private readonly model: FileModel) {}

  get uuid(): string { return this.model.uuid; }

  // [impl:uuid:8d5a11e6-a5c0-4237-a218-afbe19699bf6] File.ownIor — the File composes its OWN fully-qualified IOR by
  // ASKING the Ior value-object (single owner of the format + GUARD#2). No hand-built string, no free-fn shim: the
  // deleted composeUnitIor's knowledge collapsed into Ior. GUARD#2 (empty origin → throw) is enforced by Ior's constructor.
  ownIor(): string {
    return Ior.for('File', this.model.origin || '', this.model.uuid).toString();
  }

  // [impl:uuid:3feca893-d59f-4d5b-b641-0cbdb873a6b1] File.renderSelf — the File renders ITSELF (ask-the-object): returns
  // a PURE view-model (icon derived from the object's own mime/ext, its name, badges), NOT DOM. The client thin adapter
  // paints the node from this; the tree stops rebuilding the answer from a synthetic `file:<path>` string + external
  // machinery (the radical-OOP fix). The File OWNS its icon here (the scattered per-view icon maps collapse onto this
  // over time — a ranked follow-up, not T41.1). Pure → directly unit-testable.
  renderSelf(): FileViewModel {
    return { kind: 'file', uuid: this.model.uuid, icon: this.icon(), name: this.displayName(), badges: [] };
  }

  private displayName(): string {
    const n = String(this.model.name || '').trim();
    return n || this.model.uuid;
  }

  // The file's icon is the FILE's business (ask-the-object): mime lens first (broad, stable), ext fallback, default 📄.
  private icon(): string {
    const mime = String(this.model.mimeType || '').toLowerCase();
    if (mime.startsWith('image/')) return '🖼';
    if (mime.startsWith('video/')) return '🎬';
    if (mime.startsWith('audio/')) return '🎵';
    if (mime === 'application/pdf') return '📕';
    if (mime === 'text/uri-list') return '🔗';
    const ext = (this.model.name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
    const byExt: Record<string, string> = { md: '📄', sh: '📜', puml: '🎨', ts: '⚡', tsx: '⚡', js: '📦', mjs: '📦', css: '🎨', json: '⚙️', html: '🌐', svg: '🖼', env: '🔒', yml: '📋', yaml: '📋' };
    return byExt[ext] || '📄';
  }
}
