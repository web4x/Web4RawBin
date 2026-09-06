/**
// [impl:uuid:b05fcdf3-0d44-4d7d-bee2-b5edc55daa3a] DropDispatcher.urlDrop
 * DnD Drop Dispatcher — routes dropped files by mimeType.
 * State machine: IDLE→DRAGOVER→UPLOADING→COMPLETE.
 */

import { UnitTransport, fileToUnit, urlToUnit } from './unit-transport.js'; // SLICE-A: the ONE object-owned unit-JSON upload — replaces uploadFile (fetch+FormData) + uploadWithProgress (xhr+FormData)

type DropHandler = (file: File, roomId: string, playerToken: string) => Promise<void>;
type StatusCallback = (state: string, detail?: string) => void;
const MAX_INLINE = 10 * 1024 * 1024; // SLICE-A: inline unit-JSON cap (base64 ~+33%, held in memory both sides); >10MB → clear reject (SLICE-C streams)

export class DropDispatcher {
  private handlers = new Map<string, DropHandler>();
  private enterCount = 0;
  state: 'idle' | 'dragover' | 'uploading' | 'complete' = 'idle';
  private statusCb: StatusCallback | null = null;
  private roomCtx: { roomId: string; token: string } | null = null; // R40.86: the active room's drop context (set by RoomView; the SAME roomId+token dispatch() is called with)

  constructor(private baseUrl: string = '') {}

  onStatus(cb: StatusCallback): void { this.statusCb = cb; }

  // R40.86: RoomView sets the active-room context so a container-drop (acceptDropIntoContainer) uses the SAME roomId+token as dispatch().
  setRoomContext(roomId: string, token: string): void { this.roomCtx = { roomId, token }; }
  private dropContext(): { roomId: string; token: string } { return this.roomCtx ?? { roomId: '', token: '' }; }

  register(mimePrefix: string, handler: DropHandler): void {
    this.handlers.set(mimePrefix, handler);
  }

  // [impl:uuid:8b400f1d-34e0-4fbf-abd5-06f0e0499b7a] DropDispatcher.enterDragZone
  onDropEnter(dz: HTMLElement): void {
    this.enterCount++;
    if (this.enterCount === 1) {
      this.state = 'dragover';
      dz.classList.add('rrc-drop-active');
      this.statusCb?.('dragover', 'Drop files here');
    }
  }

// [impl:uuid:c20ff555-4047-4290-9922-da70116aeefa] DropDispatcher.exitDragZone (split for DropDispatcher.feedba
  // [impl:uuid:dcfc5fe3-ff7a-44e3-927b-2aa03197498f] DropDispatcher.exitDragZone
  onDropExit(dz: HTMLElement): void {
    this.enterCount--;
    if (this.enterCount <= 0) {
      this.enterCount = 0;
      this.state = 'idle';
      dz.classList.remove('rrc-drop-active');
      this.statusCb?.('idle');
    }
  }

  resetDrag(dz: HTMLElement): void {
    this.enterCount = 0;
    this.state = 'idle';
    dz.classList.remove('rrc-drop-active');
  }

  // SLICE-A: uploadFile (fetch+FormData) + uploadWithProgress (xhr+FormData) are DELETED — collapsed into the ONE
  // object-owned unit-JSON upload (saveFileUnit → UnitTransport.putByUuid). No caller builds FormData/xhr/multipart.
  // saveFileUnit — the ONE client upload: read the File's OWN bytes (FileReader→base64, fileToUnit) → PUT the unit JSON.
  // The browser never hands a multipart body for this path, so his device's multipart quirks are unreachable by construction.
  private async saveFileUnit(file: File, roomId: string, playerToken: string, opts?: { intoFolder?: string; relatedFile?: string; onProgress?: (pct: number) => void }): Promise<{ uuid: string; name: string; size: number } | null> {
    if (file.size > MAX_INLINE) { this.statusCb?.('error', `Failed: ${file.name} — too large (max ${MAX_INLINE / 1024 / 1024}MB)`); return null; } // >10MB → clear reject, never read into memory
    const unit = await fileToUnit(file); // FileReader→base64 inline (transfer form)
    return UnitTransport.putByUuid(unit, { roomId, playerToken, baseUrl: this.baseUrl, parent: opts?.intoFolder, relatedFile: opts?.relatedFile, onProgress: opts?.onProgress });
  }

  // [impl:uuid:75edb563-67ec-4d20-a87f-449fe889c567] DropDispatcher.acceptDropIntoContainer (R40.86, Method a81ed3db, UC af1bf20b folder.acceptDropIntoContainer) —
  // a FOLDER is a drop target: ROUTE each dropped file through the ONE upload→createFileUnit path with the target folder as parent,
  // then DELEGATE the in-place render to R40.84 reDeriveDirectChildren (fired by the upload's publishUnitChanged) → the item live-inserts
  // INSIDE the folder + persists (R40.92 folderChildrenUnder renders it on reload). DropDispatcher carries NO 2nd containment/add path
  // (req root-lens guard, LAW-8) — it reuses the ONE object-owned saveFileUnit; the ONLY new thing is threading parent=targetFolderRef. ONE mint per file (no double-mint).
  async acceptDropIntoContainer(files: File[], targetFolderRef: string): Promise<void> {
    const { roomId, token } = this.dropContext(); // the SAME room context dispatch() uses (set by RoomView.setRoomContext)
    if (!roomId || !token) { this.statusCb?.('error', 'No room context for folder drop'); return; }
    for (const f of files) await this.saveFileUnit(f, roomId, token, { intoFolder: targetFolderRef }); // SLICE-A: object-owned unit-JSON; parent=folder → server nests it; R40.84 live-inserts via publishUnitChanged
  }

  // SLICE-A: uploadWithProgress DELETED — its ONLY distinct reason (progress) is now the onProgress PARAM on saveFileUnit → UnitTransport.putByUuid.

  // [impl:uuid:971bdde0-004b-4896-bc8c-4570832f6304] DropDispatcher.routeUnknown
  // [impl:uuid:4a159912-978e-46bc-a839-5201857461c5] R25.1 DropDispatcher.routeUnknown
  async routeUnknown(file: File, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<void> {
    for (const [prefix, handler] of this.handlers) {
      if (file.type.startsWith(prefix)) {
        await handler(file, roomId, playerToken);
        return;
      }
    }
    sendChat(`[drop-debug] ${file.name} (${file.type || 'unknown'}) — no handler registered`);
  }

  // [impl:uuid:05ed9488-cef2-41f5-83b2-f8e046fcd77a] DropDispatcher.feedbackCycle
  // [impl:uuid:12f2331b-47d5-45df-aed7-f643e57233e6] DropDispatcher.dispatch — MIME allowlist (v0.6.81 audio/+video/)
  async dispatch(file: File, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<{ uuid: string; name: string; size: number } | null> {
    this.state = 'uploading';
    this.statusCb?.('uploading', `Uploading ${file.name}...`);
    let result: { uuid: string; name: string; size: number } | null = null;
    if (file.type.startsWith('image/') || file.type.startsWith('text/') || file.type.startsWith('application/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type.startsWith('message/')) { // v0.6.81: audio/+video/; v0.6.90: message/ (iOS .eml email drop)
      result = await this.saveFileUnit(file, roomId, playerToken, { onProgress: (pct) => { this.statusCb?.('uploading', `${file.name} ${pct}%`); } }); // SLICE-A: object-owned unit-JSON upload (progress = param)
    } else {
      await this.routeUnknown(file, roomId, playerToken, sendChat);
    }
    this.state = 'complete';
    this.statusCb?.(result ? 'complete' : 'error', result ? `Uploaded ${file.name}` : `Failed: ${file.name}`);
    setTimeout(() => { if (this.state === 'complete') { this.state = 'idle'; this.statusCb?.('idle'); } }, 2000);
    return result;
  }

  // [impl:uuid:b05fcdf3-0d44-4d7d-bee2-b5edc55daa3a] R19.62 DropDispatcher.urlDrop
  async dispatchUrl(url: string, roomId: string, playerToken: string, sendChat: (text: string) => void, displayName?: string, relatedFileUuid?: string): Promise<{ uuid: string; name: string; size: number } | null> {
    // v0.7.0 (2): about:blank (and about:blank#blocked) is a placeholder, never a real resource — never mint a WebItem for it.
    if (!url || /^about:/i.test(url.trim())) { this.statusCb?.('idle', ''); return null; }
    this.state = 'uploading';
    this.statusCb?.('uploading', `Fetching ${url}...`);
    try {
      // v0.6.90: caller may pass a display name (e.g. an email subject) → the WebItem name derives from it.
      const name = (displayName && displayName.trim()) || url.split('/').pop() || 'link';
      // SLICE-A: build the unit directly (urlToUnit → text/uri-list) → the ONE unit-JSON transport; server resolves uri-list→WebItem.
      const result = await UnitTransport.putByUuid(urlToUnit(url, name), { roomId, playerToken, baseUrl: this.baseUrl, relatedFile: relatedFileUuid }); // v0.6.91: link WebItem→source file
      this.state = 'complete';
      this.statusCb?.(result ? 'complete' : 'error', result ? `Saved ${name}` : `Failed: ${url}`);
      setTimeout(() => { if (this.state === 'complete') { this.state = 'idle'; this.statusCb?.('idle'); } }, 2000);
      return result;
    } catch {
      this.state = 'idle';
      this.statusCb?.('error', `Failed: ${url}`);
      sendChat(`[url-drop] failed: ${url}`);
      return null;
    }
  }

  // [impl:uuid:f484952c-03b5-411d-8816-79adb0fcac17] R26.2 DropDispatcher.buildFederatedRef
  // T26.2: build the application/rb-federated-ref DataTransfer payload — a self-contained REFERENCE
  // (ior@host + fetchUrl), NOT the full scenario JSON (files are MB; DataTransfer is size-limited + sync).
  // The receiver asks ITS OWN server to import from fetchUrl (server-to-server). Tiny units MAY inline `unit`.
  buildFederatedRef(input: { uuid: string; type: string; name: string; originHost: string; contentHash?: string; grant?: string; inline?: unknown }): string {
    const grant = input.grant ? `?grant=${encodeURIComponent(input.grant)}` : ''; // capability token minted by the origin (R26.3)
    const ref: Record<string, unknown> = {
      ior: `ior:instance:${input.uuid}@${input.originHost}`,
      originHost: input.originHost,
      type: input.type,
      name: input.name,
      fetchUrl: `${input.originHost}/api/scenario/${input.uuid}${grant}`,
    };
    if (input.contentHash) ref.contentHash = input.contentHash;      // File units: cross-server content dedup
    if (input.inline !== undefined) ref.inline = input.inline;       // optimization: tiny units skip the round-trip
    return JSON.stringify(ref);
  }

  // R32.5 GO-LIVE: drop/pick a repo .ts file → POST it to /api/model/generate → TsToModel writes M1/M2 + a demo
  // Diagram into the ISOLATED store (prod untouched); the R32.3 tree + R32.4 diagram then render it live. REUSE
  // (this dispatcher) — no drop fork. Path-based (repo-relative); a content-drop extension is a fast-follow.
  async dispatchModelGenerate(file: string): Promise<{ ok?: boolean; roots?: number; diagramUuid?: string; error?: string }> {
    try {
      const res = await fetch('/api/model/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file }) });
      return await res.json();
    } catch (e: unknown) { return { ok: false, error: String((e as Error)?.message || e) }; }
  }
}

export const dropDispatcher = new DropDispatcher();
