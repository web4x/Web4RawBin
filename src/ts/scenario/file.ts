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

// A SEMANTIC icon CATEGORY (what the file IS), never a concrete glyph. The object owns WHAT IT IS; the surface owns
// HOW IT LOOKS — a thin adapter maps this token → an SVG (the /model tree) or an emoji (another surface). (PO ruling
// 2026-09-13: a glyph is a presentation EFFECT → belongs at the adapter, not the Model. Vocabulary architect-confirmable.)
// Architect-confirmed vocabulary (small + semantic, NOT token-per-mime; unknown → 'generic'). Folder adds 'folder' (T41.2).
export type FileIconToken = 'image' | 'audio' | 'video' | 'document' | 'archive' | 'code' | 'data' | 'generic';

// The PURE view-model File.renderSelf() returns — DATA, not DOM (no concrete glyph). A thin client adapter renders it.
export interface FileViewModel { kind: 'file'; uuid: string; iconToken: FileIconToken; name: string; badges: string[]; }

// The PURE move COMMAND File.moveTo() returns — intent, not effect. A thin client transport adapter dispatches it via
// the EXISTING /api/room/<id>/move-unit path (adding roomId + playerToken, which are transport context, not the File's).
export interface MoveCommand { verb: 'move'; unit: string; target: string; source?: string; }

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
  // a PURE view-model (a semantic icon CATEGORY token from the object's own mime/ext, its name, badges), NOT DOM and NOT
  // a concrete glyph. The client thin adapter maps the token → an SVG (the /model tree) or emoji (elsewhere) + paints the
  // node; the tree stops rebuilding the answer from a synthetic `file:<path>` string. The File owns WHAT IT IS (category);
  // the surface owns HOW IT LOOKS (glyph) — PO ruling 2026-09-13. Pure → directly unit-testable.
  renderSelf(): FileViewModel {
    return { kind: 'file', uuid: this.model.uuid, iconToken: this.iconToken(), name: this.displayName(), badges: [] };
  }

  // [impl:uuid:3500d960-d49b-43e6-81a9-0f12ddacb272] File.moveTo — the File moves ITSELF (ask-the-object): returns a
  // PURE move COMMAND (intent), never touches transport. The thin client adapter dispatches it via the EXISTING
  // move-unit route (REUSE — no new route, no fork): the File contributes what it knows (its uuid, the target, the
  // source it moves from); roomId + playerToken are the adapter's transport context, not the File's.
  moveTo(target: string, source?: string): MoveCommand {
    return { verb: 'move', unit: this.model.uuid, target, ...(source ? { source } : {}) };
  }

  private displayName(): string {
    const n = String(this.model.name || '').trim();
    return n || this.model.uuid;
  }

  // The file's icon CATEGORY is the FILE's business (ask-the-object): mime lens first (broad, stable), ext fallback,
  // default 'document' — NEVER blank. Returns a semantic TOKEN, not a glyph (the adapter maps token→SVG/emoji per surface).
  // Vocabulary is architect-confirmable (its lane); the PRINCIPLE (token not glyph) is ruled.
  private iconToken(): FileIconToken {
    const mime = String(this.model.mimeType || '').toLowerCase();
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    if (mime === 'application/pdf' || mime.startsWith('text/') && !/uri-list/.test(mime)) return 'document';
    if (mime === 'application/json' || mime === 'application/xml' || mime === 'text/csv') return 'data';
    if (mime === 'application/zip' || mime === 'application/x-tar' || mime === 'application/gzip') return 'archive';
    // ext fallback (mime absent/unknown), then 'generic' — NEVER blank.
    const ext = (this.model.name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
    const byExt: Record<string, FileIconToken> = {
      png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', bmp: 'image', ico: 'image',
      mp4: 'video', mov: 'video', webm: 'video', mkv: 'video', mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio',
      pdf: 'document', md: 'document', txt: 'document', doc: 'document', docx: 'document', rtf: 'document',
      zip: 'archive', tar: 'archive', gz: 'archive', rar: 'archive', '7z': 'archive',
      ts: 'code', tsx: 'code', js: 'code', mjs: 'code', py: 'code', sh: 'code', css: 'code', html: 'code', java: 'code', go: 'code', rs: 'code',
      json: 'data', yml: 'data', yaml: 'data', xml: 'data', csv: 'data',
    };
    return byExt[ext] || 'generic';
  }
}
