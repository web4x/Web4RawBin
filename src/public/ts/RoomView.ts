// [impl:uuid:a2dfd6e8-3d5c-419a-a743-01fcaa7ba069] T5 room view
// [impl:uuid:602fecd2-6fdb-4f57-8298-830f01a802fa] RbRoomContent.folderNodeRender
// [impl:uuid:d1bae8be-a6ca-41e8-bdf6-ee78399ef41e] RbRoomContent.applyButton
// [impl:uuid:32578dc6-58bb-4ce1-94be-2a78a142e139] RbRoomContent.mountTraceTree
// [impl:uuid:e289349c-ba8d-4182-9288-9bbd7ac3ed56] RbRoomContent.render
// [impl:uuid:3fbcebaf-2986-44d6-afd2-7ab810e824f2] RbRoomDetail.modeSet
import { RawBinClient } from './RawBinClient.js';
import { ViewBus, viewBusKey } from './trace/ViewBus.js'; // radical-OOP Slice 1: publish "container gained a child" → the owning Node renders its own children (no full re-seed)
import { formatBytes } from './format-bytes.js'; // T37.21 defect-3: the ONE human-byte formatter (was an inline /1024 copy)
import { ProfileEditor } from './ProfileEditor.js';
import { ProfileSheet } from './ProfileSheet.js';
import { MSG } from '../../shared/MessageTypes.js';
import './components/rb-header.js';
import './components/rb-qr-popup.js';
import type { RbQrPopup } from './components/rb-qr-popup.js';
import './components/rb-member-list.js';
import './components/rb-avatar.js';
import './trace/rb-object-item.js';
import { scenarioEditorHref } from './trace/detail-children.js'; // v0.7.0 (3): ✏️ editor deep-link
import './trace/rb-trace-tree.js';
import { dropDispatcher } from './drop-dispatcher.js';
import { resolveDropPayload } from './dnd-contract.js'; // T37.20 DEFECT-1 (Proxy): the ONE drop entry — returns a RefProxy (local vs remote chosen once by originHost); the handler branches on NOTHING
import { registerAction } from './trace/universal-actions.js'; // T37.20 INC-2: register the room 'move' Command (explicit "Move…" affordance) on the ONE Command registry
import type { RbMemberList } from './components/rb-member-list.js';
import './trace/rb-detail-drawer.js';
import type { RbDetailDrawer } from './trace/rb-detail-drawer.js';
import { renderContentPreview, wireUrlActions } from './trace/content-preview.js';

interface MemberInfo {
  id: string; name: string; avatarUrl: string; playerToken: string; avatarCrop?: { scale: number; x: number; y: number } | null; disconnected?: boolean;
}

export class RoomView {
  private client: RawBinClient;
  private container: HTMLElement;
  private onLeave: () => void;
  private roomId = '';
  private roomName = '';
  private hostId = '';
  private roomOwnerToken = '';
  private roomVisibility: 'public' | 'by-invite' | 'private' = 'public';
  private roomMode: 'live' | 'persistent' = 'persistent';
  private members: MemberInfo[] = [];
  private profileEditor: ProfileEditor;
  private profileSheet: ProfileSheet;
  private get chatSheet() {
    const drawer = document.getElementById('room-file-preview') as RbDetailDrawer | null;
    return drawer?.chat || null;
  }

  constructor(client: RawBinClient, container: HTMLElement, onLeave: () => void) {
    this.client = client;
    this.container = container;
    this.onLeave = onLeave;
    this.profileEditor = new ProfileEditor(client);
    this.profileSheet = new ProfileSheet(client);
    // T37.20 INC-2: the explicit "Move…" affordance = a Command on the ONE registry (INC-1). Its picker reuses rb-object-item
    // (the tree's Folder render, NOT a bespoke list) and ends in the SAME dropDispatcher.reparentUnitsIntoContainer → move-unit
    // that the drag affordance uses (two affordances, ONE mechanism). Registered once here; arrow captures this RoomView.
    registerAction('move', (c) => void this.openPlacePicker(c.uuid, 'move'));
    // R40.106 INC-4 slice-4 (Tron: "a drop places a link ALWAYS"): the additive "Link here…" Command — reuses the SAME
    // picker as move (DRY), differing ONLY in the link-only endpoint (source edge KEPT → N-link). Drag stays MOVE.
    registerAction('link', (c) => void this.openPlacePicker(c.uuid, 'link'));
    // T37.20 INC-3 (R40.104): the "Rename…" Command — the object sets its own USER displayName via the room rename route →
    // UnitController.apply (the ONE seam). displayName wins; originalName preserved server-side; uuid stable; live re-render.
    registerAction('rename', (c) => void this.openRename(c.ref));
    // R40.106 INC-4 slice-3 (Tron: "a remove button on every file"): REMOVE = unlink THIS edge — detach the unit from its
    // container via the server unlink-unit endpoint (FolderService.unlink + room.removeFileUnit). The unit SURVIVES in the
    // index (recoverable / still linked elsewhere) — remove ≠ delete (delete = INC-7, red + confirm + destroy + 0-dangling).
    registerAction('remove', (c) => void this.removeUnit(c.uuid));
    registerAction('delete', (c) => void this.deleteUnit(c.uuid)); // R40.106 INC-7: destroy the unit + unlink every ref (RED confirm)

    this.client.on(MSG.ROOM_JOINED, (msg) => {
      this.roomId = msg.room.id;
      dropDispatcher.setRoomContext(this.roomId, this.client.playerToken); // R40.86: room context for folder-drop (acceptDropIntoContainer) — set on join, same roomId+token as dispatch()
      this.roomName = msg.room.name;
      this.hostId = msg.room.hostId; this.roomOwnerToken = msg.room.ownerToken || ''; this.roomVisibility = msg.room.visibility || (msg.room.isPrivate ? 'private' : 'public'); this.roomMode = msg.room.mode || 'persistent';
      this.members = msg.members || [];
      this.render();
      if (msg.room.chatHistory?.length) this.chatSheet?.loadHistory(msg.room.chatHistory);
    });
    this.client.on(MSG.MEMBER_JOINED, (msg) => { if (msg.member) this.members.push(msg.member); this.renderMemberList(); });
    this.client.on(MSG.MEMBER_LEFT, (msg) => { this.members = this.members.filter(m => m.id !== msg.memberId); this.renderMemberList(); });
    this.client.on(MSG.MEMBER_DISCONNECTED, (msg) => { const m = this.members.find(x => x.id === msg.memberId); if (m) m.disconnected = true; this.renderMemberList(); });
    this.client.on(MSG.MEMBER_RECONNECTED, (msg) => { this.members = this.members.filter(m => m.id !== msg.oldMemberId); if (msg.member) { this.members.push({ ...msg.member, disconnected: false }); } this.renderMemberList(); });
    this.client.on(MSG.HOST_CHANGED, (msg) => { this.hostId = msg.hostId; this.renderMemberList(); });
    this.client.on(MSG.CHAT_HISTORY, (msg) => { if (msg.messages) this.chatSheet?.loadHistory(msg.messages); });
    this.client.on(MSG.CHAT_MESSAGE, (msg) => this.chatSheet?.addMessage(msg.senderId, msg.senderName, msg.text));
    this.client.on(MSG.ROOM_DELETED, () => this.onLeave());
    this.client.on(MSG.ROOM_CONFIG_UPDATED, (msg) => { if (msg.room) { this.roomName = msg.room.name; this.roomVisibility = msg.room.visibility || this.roomVisibility; this.roomMode = msg.room.mode || this.roomMode; this.render(); } });
    this.client.on(MSG.ROOM_APPLY_RECEIVED, (msg) => {
      if (this.roomId !== msg.roomId) return;
      this.chatSheet?.addMessage('system', 'System', `${msg.applicantName} wants to join this room.`);
      if (this.roomOwnerToken === this.client.playerToken) {
        if (confirm(`${msg.applicantName} wants to join. Accept?`)) {
          this.client.send({ type: MSG.ROOM_APPLY_ACCEPT, roomId: msg.roomId, applicantClientId: msg.applicantClientId, applicantName: msg.applicantName });
        }
      }
    });
    // [impl:uuid:e3fad3ac-a09f-4a4c-88ce-78e0ca273cc0] FILE_ADDED handler
    this.client.on(MSG.FILE_ADDED, (msg) => {
      if (this.roomId !== msg.roomId) return;
      // R40.84 (architect e0b8cb582): the re-seed (tree.renderSeed) that COLLAPSED + rebuilt the WHOLE tree on every add is
      // REMOVED — it clobbered the working per-node in-place path (rebuild-the-world = not MVC, Tron). The server now
      // publishUnitChanged's the Files ref on upload (mirroring folder-add), so the tree's per-node subscriber re-derives
      // JUST that node's direct children and live-inserts the new file; expanded state lives in the model → survives by construction.
      this.chatSheet?.addMessage('system', 'System', `File uploaded: ${msg.name}`);
    });
    this.client.on('disconnected', () => this.chatSheet?.setWsStatus('disconnected'));
    this.client.on('reconnecting', (msg) => this.chatSheet?.setWsStatus('reconnecting', msg.backoffMs ? `${Math.ceil(msg.backoffMs / 1000)}s` : undefined));
    this.client.on('reconnected', () => { this.chatSheet?.setWsStatus('connected'); this.hideOfflineBanner(); });
    this.client.on('online', () => this.hideOfflineBanner());
    this.client.on('offline', () => this.showOfflineBanner());

    // [impl:uuid:1a938c60-876d-4e74-bf4c-5b3af6a155b4] DropDispatcher.route
    this.container.addEventListener('rb-room-files-dropped', (async (e: CustomEvent) => {
      const files: File[] = e.detail?.files || [];
      let firstFileUuid = '';
      for (const file of files) {
        try {
          const result = await dropDispatcher.dispatch(file, this.roomId, this.client.playerToken, (text) => this.chatSheet?.addMessage('system', 'System', text));
          if (!result) this.chatSheet?.addMessage('system', 'System', `Upload failed: ${file.name}`);
          else if (!firstFileUuid) firstFileUuid = result.uuid;
        } catch { this.chatSheet?.addMessage('system', 'System', `Upload error: ${file.name}`); }
      }
      // v0.6.91: a drop carrying BOTH a file and a launchable scheme URL (Apple email/calendar) → mint a
      // WebItem that FORWARD-REFERENCES the stored file (children=[file]) so the message: link knows its .eml source.
      const schemeUrl: string = e.detail?.schemeUrl || '';
      if (schemeUrl) {
        try { await dropDispatcher.dispatchUrl(schemeUrl, this.roomId, this.client.playerToken, (text) => this.chatSheet?.addMessage('system', 'System', text), e.detail?.schemeName, firstFileUuid || undefined); } catch {}
      }
    }) as EventListener);
    this.container.addEventListener('rb-leave', () => { this.client.leaveRoom(); this.onLeave(); });
    this.container.addEventListener('rb-delete', () => { if (confirm('Delete this room permanently?')) this.client.deleteRoom(this.roomId); });
    this.container.addEventListener('rb-edit', () => this.openRoomEditor());
    this.container.addEventListener('rb-member-click', ((e: CustomEvent) => {
      const { playerToken, isSelf } = e.detail;
      if (isSelf) {
        // T83 (supersedes T81 AC6): self-click opens the read-only sheet; Edit re-routes to the editor.
        const p = this.client.getProfile();
        this.profileSheet.open(
          { name: p?.name || localStorage.getItem('rawbin-name') || '', phone: p?.phone || '', url: p?.url || '', avatar: p?.avatar || '', playerToken: this.client.playerToken },
          { isSelf: true, onEdit: () => this.profileEditor.open({ name: p?.name || '', phone: p?.phone || '', url: p?.url || '', avatar: p?.avatar || '', secretCode: p?.secretCode || '' }, 'normal') }
        );
      } else if (playerToken) {
        const h = (msg: any) => { this.client.off(MSG.USER_INFO, h); if (msg.user) this.profileSheet.open(msg.user); };
        this.client.on(MSG.USER_INFO, h);
        this.client.send({ type: MSG.GET_USER_INFO, playerToken });
      }
    }) as EventListener);
  }

  show(roomId: string): void { this.roomId = roomId; dropDispatcher.setRoomContext(roomId, this.client.playerToken); this.render(); } // R40.86: give the dispatcher the active-room context so a folder-drop (acceptDropIntoContainer) uses the SAME roomId+token as dispatch()

  hide(): void {
    this.container.innerHTML = '';
    this.members = [];
  }

  // [impl:uuid:f9b579c1-7495-4f93-8dec-736a0410a69a] RbRoomDetail.openRoomEditor
  // [impl:uuid:26b81ea0-9b6c-4395-b0d8-0f49bc4d1eb4] RbRoomDetail.scenarioLinkRender R19
  private openRoomEditor(): void {
    const isHost = this.roomOwnerToken === this.client.playerToken; // R31.12: non-host = READ-ONLY (view settings; host edits) — safe-by-construction (no Save + no save-handler wired)
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000";
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    const modal = document.createElement("div");
    modal.style.cssText = "background:#1a1a2e;color:#fff;padding:20px;border-radius:12px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto";
    const v = this.roomVisibility, m = this.roomMode;
    modal.innerHTML = `<h3 style="margin-bottom:16px">${isHost ? 'Edit ' : ''}Room Settings</h3>${isHost ? '' : '<div style="margin-bottom:16px;padding:8px 10px;background:rgba(255,255,255,0.06);border-radius:6px;color:#ffcc66;font-size:0.85rem">🔒 Read-only — you are not the room owner</div>'}<label style="display:block;margin-bottom:12px">Name<br><input id="re-name" type="text" style="width:100%;padding:8px;margin-top:4px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:6px"></label><fieldset style="border:none;padding:0;margin-bottom:12px"><legend>Visibility</legend><label class="re-option" for="re-vis-public" style="display:block;padding:10px 8px;cursor:pointer"><input type="radio" id="re-vis-public" name="re-vis" value="public" ${v==="public"?"checked":""}> Public</label><label class="re-option" for="re-vis-by-invite" style="display:block;padding:10px 8px;cursor:pointer"><input type="radio" id="re-vis-by-invite" name="re-vis" value="by-invite" ${v==="by-invite"?"checked":""}> By-Invite</label><label class="re-option" for="re-vis-private" style="display:block;padding:10px 8px;cursor:pointer"><input type="radio" id="re-vis-private" name="re-vis" value="private" ${v==="private"?"checked":""}> Private</label></fieldset><fieldset style="border:none;padding:0;margin-bottom:16px"><legend>Mode</legend><label class="re-option" for="re-mode-live" style="display:block;padding:10px 8px;cursor:pointer"><input type="radio" id="re-mode-live" name="re-mode" value="live" ${m==="live"?"checked":""}> Live</label><label class="re-option" for="re-mode-persistent" style="display:block;padding:10px 8px;cursor:pointer"><input type="radio" id="re-mode-persistent" name="re-mode" value="persistent" ${m==="persistent"?"checked":""}> Persistent (default)</label></fieldset><div style="display:flex;gap:8px;justify-content:flex-end"><button id="re-cancel" class="btn btn-secondary">Cancel</button><button id="re-save" class="btn btn-primary">Save</button></div>`;
    (modal.querySelector("#re-name") as HTMLInputElement).value = this.roomName;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (!isHost) { // R31.12 read-only: disable inputs, drop Save, Cancel→Close → a non-host can VIEW config but never submit UPDATE_ROOM_CONFIG
      modal.querySelectorAll("input").forEach((el) => ((el as HTMLInputElement).disabled = true));
      modal.querySelector("#re-save")?.remove();
      const c = modal.querySelector("#re-cancel"); if (c) c.textContent = "Close";
    }
    // R31.12 FINAL (architect f8d193568, tester r3112e 4/4): NO belt loop. The prior belt's pointerup+preventDefault
    // was SUPPRESSING native radio tap-select (the flicker-revert). Canonical native radios (explicit id/for above)
    // select on tap by HTML5 spec — no handler, no preventDefault, no device code; works all browsers identically.
    // Save reads input:checked; read-only (non-host) disables the inputs above.
    modal.querySelector("#re-cancel")!.addEventListener("click", () => overlay.remove());
    if (isHost) modal.querySelector("#re-save")!.addEventListener("click", () => { // host-only save-handler wired = non-host CAN'T submit even if the DOM were tampered
      const name = (modal.querySelector("#re-name") as HTMLInputElement).value.trim();
      const vis = (modal.querySelector("input[name=re-vis]:checked") as HTMLInputElement)?.value;
      const md = (modal.querySelector("input[name=re-mode]:checked") as HTMLInputElement)?.value;
      this.client.send({ type: MSG.UPDATE_ROOM_CONFIG, roomId: this.roomId, name, visibility: vis, mode: md });
      overlay.remove();
    });
  }

  private async render(): Promise<void> {
    const isHost = this.roomOwnerToken === this.client.playerToken;
    this.container.innerHTML = `
      <div class="room-view">
        <rb-header title="${this.roomName}" show-leave show-home ${isHost ? 'show-delete show-edit' : ''} show-reload show-fullscreen></rb-header>
        <div style="padding:0 16px 4px;display:flex;gap:8px;align-items:center"><a href="/scenario?ior=${this.roomId}" style="color:#ff9800;font-size:0.75rem;text-decoration:none" title="View room scenario unit">📄 Scenario</a><a href="${scenarioEditorHref(this.roomId)}" style="color:#ff9800;font-size:0.75rem;text-decoration:none" title="Edit room scenario unit">✏️ Edit</a><span style="color:rgba(255,255,255,0.3);font-size:0.65rem">${this.roomId.slice(0,8)}</span></div>
        <div id="offline-banner" class="offline-banner" style="display:none">Offline — messages queued</div>
        <div class="room-body"><div class="member-panel"><h3>Members</h3><rb-member-list id="member-list"></rb-member-list></div><div class="rrc" id="rrc-root"><div class="rrc-drop" id="rrc-drop" tabindex="0"><div class="rrc-drop-label">Drop content here</div><div class="rrc-drop-hint">Files become room scenario units</div></div><div class="rrc-upload-status" id="rrc-upload-status" style="display:none"></div><rb-trace-tree id="room-tree" data-seed-ior="${this.roomId}"></rb-trace-tree></div></div>
        <rb-detail-drawer id="room-file-preview" data-context="room-chat"></rb-detail-drawer><!-- R31.12 #1: opt out of the /trace-designed R31.9 observePosition/data-position + R31.4 terminal auto-close — stay the base bottom chat sheet (trace/SM don't set data-context → their R31.4/R31.9 wins intact by construction) -->
      </div>`;

    const dz = document.getElementById("rrc-drop");
    dropDispatcher.onStatus((state, detail) => {
      const sb = document.getElementById("rrc-upload-status");
      if (sb) {
        sb.style.display = state === 'idle' ? 'none' : 'block';
        sb.textContent = detail || '';
        sb.className = `rrc-upload-status rrc-upload-${state}`;
      }
      console.log(`[upload-status] ${state}: ${detail || ''}`);
    });
    if (dz && !(dz as any).__wired) {
      (dz as any).__wired = true;
      dz.addEventListener("click", () => this.importFromClipboard()); // v0.6.96: tap the drop zone → clipboard import (same routing as DnD)
      dz.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') { e.preventDefault(); this.importFromClipboard(); } });
      dz.addEventListener("dragenter", (e) => { e.preventDefault(); dropDispatcher.onDropEnter(dz); });
      dz.addEventListener("dragover", (e) => { e.preventDefault(); });
      dz.addEventListener("dragleave", () => { dropDispatcher.onDropExit(dz); });
      dz.addEventListener("drop", (e: Event) => {
        e.preventDefault();
        dropDispatcher.resetDrag(dz);
        const dt = (e as DragEvent).dataTransfer;
        if (!dt) return;
        const log = (text: string) => this.chatSheet?.addMessage('system', 'System', text);
        // T37.20 DEFECT-1 (Proxy, by the book): the drop handler branches on NOTHING. resolveDropPayload returns ONE
        // polymorphic RefProxy — local vs remote is chosen ONCE inside it by the unit's own originHost (isLocalOrigin), NOT by
        // an if here. Same-origin in-app unit → LocalRelinkProxy (server reads it from its OWN store, ZERO fetch, no self-403);
        // genuinely remote unit → RemoteImportProxy (origin fetch). null = the buffer carries NO unit → fall through to the
        // external file/URL ingestion below. The old originHost-first if-branch (3× failed) is DELETED, not reordered.
        const proxy = resolveDropPayload(dt);
        if (proxy) {
          void proxy.resolve({ roomId: this.roomId, token: this.client.playerToken, log }).then((res) => { if (res?.uuid) ViewBus.notify(viewBusKey(`roomcoll:${this.roomId}:files`)); }); // radical-OOP Slice 1: publish ONE "Files container gained a child" → the owning Node renders its own children in place
          return;
        }
        // v0.6.86 DnD DIAGNOSTIC: Apple drops emails/calendar/locations as scheme URLs
        // (mailto:/webcal:/calshow:/maps:/geo:/tel:/x-apple-reminder:) in the text data, NOT as files.
        // Dump EVERYTHING synchronously (DataTransfer is only readable during the event) so we can see
        // exactly what Apple sends and build scheme handlers (same pattern as the YouTube embed).
        try {
          const types = Array.from(dt.types || []);
          const items = Array.from(dt.items || []).map(it => `${it.kind}/${it.type || '?'}`);
          const files = Array.from(dt.files || []).map(f => `${f.name}(${f.type || '?'},${f.size}b)`);
          log(`[dnd-debug] types=[${types.join(', ')}] items=[${items.join(', ') || 'none'}] files=[${files.join(', ') || 'none'}]`);
          for (const t of types) {
            try { const v = dt.getData(t); if (v) log(`[dnd-debug] getData('${t}') = ${v.length > 800 ? v.slice(0, 800) + '…' : v}`); } catch (err) { log(`[dnd-debug] getData('${t}') threw ${(err as Error)?.message}`); }
          }
        } catch (err) { log(`[dnd-debug] dump failed: ${(err as Error)?.message}`); }
        const files = Array.from(dt.files || []);
        // v0.6.87/90: extract any scheme URL from uri-list / plain / an html href. Apple email & calendar
        // drops carry BOTH a file (.eml/.ics) AND a launchable scheme URL (message:/webcal:).
        const rawUri = (dt.getData('text/uri-list') || dt.getData('text/plain') || '').trim();
        let schemeUrl = rawUri.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#')) || '';
        if (!/^[a-z][a-z0-9+.\-]*:/i.test(schemeUrl)) {
          const hrefM = /href\s*=\s*["']([a-z][a-z0-9+.\-]*:[^"']+)["']/i.exec(dt.getData('text/html') || '');
          schemeUrl = hrefM ? hrefM[1] : '';
        }
        const hasScheme = /^[a-z][a-z0-9+.\-]*:/i.test(schemeUrl);
        // v0.7.0 (1): iOS Mail's text/html carries the human label in the <a> TEXT (e.g.
        // "Warmintro Marcel Donges <> Atilade Gabriel Oke") — prefer it over the message: URL / filename.
        let linkLabel = '';
        const aM = /<a\b[^>]*>([\s\S]*?)<\/a>/i.exec(dt.getData('text/html') || '');
        if (aM) linkLabel = aM[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (files.length > 0) {
          // v0.6.90/91: pass the scheme URL + label through; the upload handler uploads the file(s) first,
          // then mints a WebItem forward-referencing the stored file (email BOTH archived AND launchable).
          const emlName = (files[0].name || '').replace(/\.(eml|ics|vcs|msg)$/i, '').trim();
          const schemeName = hasScheme ? (linkLabel || emlName || undefined) : undefined;
          dz.dispatchEvent(new CustomEvent("rb-room-files-dropped", { detail: { files, schemeUrl: hasScheme ? schemeUrl : '', schemeName }, bubbles: true }));
        } else if (hasScheme) {
          dropDispatcher.dispatchUrl(schemeUrl, this.roomId, this.client.playerToken, (text) => log(text), linkLabel || undefined);
        }
      });
    }

    const treeEl = document.getElementById('room-tree');
    if (treeEl) {
      // [impl:uuid:6471cfbd-d505-4876-97c5-9196cba80b53] R19.73 in-room file preview click
      treeEl.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('rb-object-item');
        if (!item) return;
        const type = item.getAttribute('type');
        const ref = item.getAttribute('ref') || '';
        if ((type === 'file' || type === 'url' || type === 'webitem') && ref.startsWith('file:')) {
          e.stopPropagation();
          // R40.106 FIX-B: capture the VIEWING folder (the tree node this item is shown UNDER) so a later Remove targets
          // THIS container's edge (per-edge remove of an N-link), not model.parent. The enclosing folder node's ref, else root.
          const folderEl = item.parentElement?.closest('rb-object-item');
          const container = folderEl?.getAttribute('ref') || `roomcoll:${this.roomId}:files`;
          this.openFilePreview(ref.replace('file:', ''), container);
        }
      });
    }

    const drawer = document.getElementById('room-file-preview') as RbDetailDrawer | null;
    if (drawer) {
      drawer.setAttribute('open', '');
      drawer.setMode('chat');
      const chat = drawer.chat;
      if (chat) {
        chat.clientIdentity = this.client.clientId;
        chat.roomId = this.roomId;
      }
      drawer.addEventListener('rb-chat-send', ((e: CustomEvent) => this.client.sendChat(e.detail.text)) as EventListener);
      drawer.addEventListener('rb-invite', () => this.showQrPopup(`${(window as any).__shareBase || location.origin}/app?join=${this.roomId}`));
      drawer.addEventListener('rb-reconnect', async () => {
        this.chatSheet?.setWsStatus('reconnecting');
        try { await this.client.reconnect(); } catch { this.chatSheet?.setWsStatus('disconnected'); }
      });
      this.chatSheet?.setWsStatus(this.client.connected ? 'connected' : 'disconnected');
    }
    if (!this.client.isOnline()) this.showOfflineBanner();

    await customElements.whenDefined('rb-object-item');
    this.renderMemberList();
  }

  // R26.1 (v0.6.97): tap the drop zone → clipboard import. READ FIRST, PREVIEW what it contains in the
  // confirm dialog, THEN route through the same path as DnD with human-readable NAMES (never raw URL/timestamp).
  // [impl:uuid:7d92ce31-5518-4398-a2b1-a000344e2ef8] R25.5 RoomView.importFromClipboard (ClipboardImport.previewAndImport)
  // [impl:uuid:bd080edb-3738-4a6c-ae84-51e59fff8560] R25.5 RoomView.importFromClipboard (S21-25 audit — missing marker restored)
  private async importFromClipboard(): Promise<void> {
    const log = (t: string) => this.chatSheet?.addMessage('system', 'System', t);
    const files: File[] = [];
    let text = '';
    try {
      const items = await (navigator.clipboard as any).read();
      for (const item of items) {
        for (const type of item.types as string[]) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            files.push(new File([blob], `Pasted image.${type.split('/')[1] || 'png'}`, { type })); // R26.1: real name, not clipboard-<ts>
          } else if ((type === 'text/plain' || type === 'text/uri-list') && !text) {
            text = (await (await item.getType(type)).text()).trim();
          }
        }
      }
    } catch { /* clipboard.read unsupported/denied → text fallback */ }
    if (!text && !files.length) { try { text = (await navigator.clipboard.readText()).trim(); } catch {} }
    if (!text && !files.length) { log('[clipboard] nothing to import'); return; }

    // R26.1: show WHAT will be imported BEFORE asking.
    if (!confirm(`Upload from clipboard?\n\n${this.clipboardPreview(files, text)}`)) return;

    this.readAndRoute(files, text, log);
  }

  // R25.5: route the read clipboard payload through the SAME path as DnD — images → File upload;
  // URL/scheme → dispatchUrl → WebItem; plain text → .txt File — with human-readable names.
  // [impl:uuid:eb25b473-84ba-4cb2-9dad-598efa6e1e93] R25.5 RoomView.readAndRoute (ClipboardImport.readAndRoute)
  private readAndRoute(files: File[], text: string, log: (t: string) => void): void {
    if (files.length > 0) this.container.dispatchEvent(new CustomEvent('rb-room-files-dropped', { detail: { files }, bubbles: true }));
    if (text) {
      const url = text.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#')) || '';
      if (/^[a-z][a-z0-9+.\-]*:/i.test(url)) {
        dropDispatcher.dispatchUrl(url, this.roomId, this.client.playerToken, log, this.deriveClipUrlName(url)); // R26.1: meaningful name, not the raw URL
      } else {
        const first = (text.split('\n')[0].trim().replace(/[\/\\:*?"<>|]/g, ' ').slice(0, 60)) || 'Clipboard text';
        const tf = new File([text], `${first}.txt`, { type: 'text/plain' }); // R26.1: first line as name, not clipboard-<ts>
        this.container.dispatchEvent(new CustomEvent('rb-room-files-dropped', { detail: { files: [tf] }, bubbles: true }));
      }
    }
  }

  // R26.1: typed one-line summary of the clipboard content for the confirm dialog.
  private clipboardPreview(files: File[], text: string): string {
    const parts: string[] = [];
    for (const f of files) if (f.type.startsWith('image/')) parts.push(`🖼 Image (${f.type.split('/')[1]}, ${formatBytes(f.size)})`);
    if (text) {
      const url = text.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#')) || '';
      if (/^(mailto|message):/i.test(url)) parts.push(`📧 Email: ${this.deriveClipUrlName(url)}`);
      else if (/^[a-z][a-z0-9+.\-]*:/i.test(url)) parts.push(`🔗 URL: ${url.replace(/^https?:\/\//i, '').slice(0, 60)}`);
      else parts.push(`📄 Text (${text.length} chars): ${text.split('\n')[0].trim().slice(0, 60)}`);
    }
    return parts.join('\n') || '(clipboard empty)';
  }

  // R26.1: human-readable name from a URL — brand + path hint (open.spotify.com/episode/… → "Spotify Episode").
  private deriveClipUrlName(url: string): string {
    try {
      if (/^https?:/i.test(url)) {
        const u = new URL(url);
        const brand = u.hostname.replace(/^www\./, '').split('.')[0].replace(/^./, c => c.toUpperCase());
        const seg = u.pathname.split('/').filter(Boolean)[0] || '';
        return seg ? `${brand} ${seg.replace(/^./, c => c.toUpperCase())}` : brand;
      }
      const scheme = (url.match(/^([a-z][a-z0-9+.\-]*):/i) || [])[1] || '';
      const rest = decodeURIComponent(url.slice(scheme.length + 1).replace(/^\/*/, ''));
      return `${scheme}: ${rest.slice(0, 50)}`;
    } catch { return url.slice(0, 50); }
  }

  // T37.20 INC-2 — the explicit "Move…" affordance (Command 'move'). object.move as an OBJECT action: pick a target folder,
  // then the SAME dropDispatcher.reparentUnitsIntoContainer → /api/room/<id>/move-unit the DRAG affordance uses (two
  // affordances, ONE mechanism — DRY). The picker RENDERS folders by REUSING rb-object-item (the tree's Folder render), never
  // a bespoke list; the item's own click is disabled (pointerEvents:none) so the row wrapper drives the move. OCP: a 3rd
  // affordance or a 7th movable class needs 0 edits here — only its registerAction/decl.
  private async openPlacePicker(unitRef: string, mode: 'move' | 'link' = 'move'): Promise<void> { // R40.106 slice-4: ONE picker, two placements — move (unlink+link) vs link (link-only, source kept)
    const bare = String(unitRef || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
    if (!bare) return;
    let folders: Array<{ ref: string; name: string }> = [];
    try {
      const r = await fetch(`/api/trace/children/${encodeURIComponent(`roomcoll:${this.roomId}:files`)}`, { credentials: 'same-origin' });
      const d = await r.json();
      folders = (d.children || []).filter((c: { type?: string }) => String(c.type || '').toLowerCase() === 'collection').map((c: { uuid: string; name: string }) => ({ ref: String(c.uuid), name: String(c.name) }));
    } catch { /* no folders → root only */ }
    const ov = document.createElement('div');
    ov.setAttribute('style', 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center');
    const sheet = document.createElement('div');
    sheet.setAttribute('style', 'background:#161b22;color:#e6edf3;width:100%;max-width:520px;max-height:70vh;overflow:auto;border-radius:12px 12px 0 0;padding:12px 12px max(env(safe-area-inset-bottom),12px);font:14px system-ui,sans-serif');
    sheet.innerHTML = `<div style="font-weight:600;margin:2px 4px 10px">${mode === 'link' ? 'Link into… (stays here too)' : 'Move to…'}</div>`;
    const close = (): void => ov.remove();
    const targets: Array<{ ref: string; name: string }> = [{ ref: `roomcoll:${this.roomId}:files`, name: 'Files (root)' }, ...folders];
    for (const t of targets) {
      const row = document.createElement('div');
      row.setAttribute('style', 'cursor:pointer;border-radius:8px');
      const item = document.createElement('rb-object-item') as HTMLElement & { data?: Record<string, unknown> };
      item.data = { ref: t.ref, type: 'folder', title: t.name };
      item.style.pointerEvents = 'none'; // the item RENDERS; the row wrapper captures the tap (avoid the item's own nav/toggle)
      row.appendChild(item);
      row.addEventListener('click', () => { close(); const src = (document.getElementById('room-file-preview') as HTMLElement | null)?.getAttribute('data-remove-container') || undefined; const place = mode === 'link' ? dropDispatcher.linkUnitInto([bare], t.ref) : dropDispatcher.reparentUnitsIntoContainer([bare], t.ref, src); void place.then(() => { this.chatSheet?.addMessage('system', 'System', `${mode === 'link' ? 'Linked into' : 'Moved to'} ${t.name}`); ViewBus.notify(viewBusKey(`roomcoll:${this.roomId}:files`)); }); }); // R40.106 FIX-B: move passes the VIEWING folder as source (per-edge unlink); link ignores it (additive)
      sheet.appendChild(row);
    }
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.setAttribute('style', 'margin:10px 4px 2px;background:#30363d;color:#e6edf3;border:0;border-radius:6px;padding:8px 14px;cursor:pointer');
    cancel.addEventListener('click', close);
    sheet.appendChild(cancel);
    ov.appendChild(sheet);
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    document.body.appendChild(ov);
  }

  // T37.20 INC-3 (R40.104) — "Rename…": the object sets its OWN user displayName. Prefill from the current name (displayName
  // ?? name), then the room rename route → UnitController.apply sets model.displayName (WINS), preserves originalName, keeps
  // uuid/ior stable, and publishUnitChanged re-renders every surface with no reload. prompt() = a mobile-reliable inline edit.
  private async openRename(unitRef: string): Promise<void> {
    const bare = String(unitRef || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
    if (!bare) return;
    let current = '';
    try { const j = await fetch(`/api/ior/ior:instance:${bare}`, { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : null)); const m = (j?.unit?.model || {}) as Record<string, unknown>; current = String(m.displayName || m.name || ''); } catch { /* no prefill */ }
    const nm = (window.prompt('Rename to:', current) || '').trim();
    if (!nm || nm === current) return;
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(this.roomId)}/rename-unit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ unit: bare, displayName: nm, playerToken: this.client.playerToken }) }).then((r) => r.json());
      if (res?.ok) { this.chatSheet?.addMessage('system', 'System', `Renamed to ${nm}`); ViewBus.notify(viewBusKey(`roomcoll:${this.roomId}:files`)); }
      else this.chatSheet?.addMessage('system', 'System', `Rename failed: ${res?.error || '?'}`);
    } catch (e) { this.chatSheet?.addMessage('system', 'System', `Rename error: ${(e as Error)?.message || e}`); }
  }

  // R40.106 INC-4 slice-3: REMOVE = detach the unit from its container (server unlink-unit → FolderService.unlink of the
  // parent-folder edge + room.removeFileUnit of the root membership). The unit SURVIVES in the index (recoverable / still
  // linked elsewhere) — this is remove, NOT delete. Live re-render: the server publishes the room-files re-derive; ViewBus.notify mirrors it here.
  private async removeUnit(uuid: string): Promise<void> {
    const bare = String(uuid || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
    if (!bare) return;
    // R40.106 FIX-B: the VIEWING folder captured at open (data-remove-container) → per-edge remove (unlink THIS container's
    // edge only; the unit + its other folder edges + root survive). Absent → server legacy full-detach (single-container unit).
    const container = (document.getElementById('room-file-preview') as HTMLElement | null)?.getAttribute('data-remove-container') || undefined;
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(this.roomId)}/unlink-unit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ unit: bare, container, playerToken: this.client.playerToken }) }).then((r) => r.json());
      if (res?.ok) { this.chatSheet?.addMessage('system', 'System', 'Removed'); ViewBus.notify(viewBusKey(`roomcoll:${this.roomId}:files`)); }
      else this.chatSheet?.addMessage('system', 'System', `Remove failed: ${res?.error || '?'}`);
    } catch (e) { this.chatSheet?.addMessage('system', 'System', `Remove error: ${(e as Error)?.message || e}`); }
  }

  // [impl:uuid:PENDING-req-mint] deleteUnit — R40.106 INC-7 DELETE: destroy the unit + unlink EVERY ref (vs removeUnit = detach ONE
  // edge, unit survives). RED confirm (destructive; git-recoverable server-side via the pre-image only). POST /delete-unit →
  // deleteUnitWithScan (pre-image / scan-footprint / keep-set exclude / 0-dangling / shared-blob-kept). A protected unit is refused.
  private async deleteUnit(uuid: string): Promise<void> {
    const bare = String(uuid || '').replace(/^ior:instance:/, '').replace(/^[a-z][\w-]*:/i, '').split('@')[0];
    if (!bare) return;
    if (!confirm('DELETE this permanently? It is removed everywhere and every link to it is unlinked. Recoverable only from a git pre-image.')) return;
    try {
      const res = await fetch(`/api/room/${encodeURIComponent(this.roomId)}/delete-unit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ unit: bare, playerToken: this.client.playerToken }) }).then((r) => r.json());
      if (res?.ok) { this.chatSheet?.addMessage('system', 'System', `Deleted — unlinked ${res.refsCleaned} ref(s); pre-image ${String(res.restoreSha || '').slice(0, 8)}`); ViewBus.notify(viewBusKey(`roomcoll:${this.roomId}:files`)); }
      else this.chatSheet?.addMessage('system', 'System', `Delete refused: ${res?.error || '?'}`);
    } catch (e) { this.chatSheet?.addMessage('system', 'System', `Delete error: ${(e as Error)?.message || e}`); }
  }

  // [impl:uuid:852101d1-ec42-478a-bc73-59ddff7feb49] R19.86 openFilePreview (split)
  private async openFilePreview(uuid: string, viewingContainer?: string): Promise<void> {
    const drawer = document.getElementById('room-file-preview') as any;
    // R40.106 FIX-B: stamp the VIEWING folder on the drawer so the Remove Command can unlink THIS container's edge (per-edge).
    if (drawer) { if (viewingContainer) drawer.setAttribute('data-remove-container', viewingContainer); else drawer.removeAttribute('data-remove-container'); }
    if (!drawer) return;
    try {
      const resp = await fetch(`/api/ior/ior:instance:${uuid}`);
      if (!resp.ok) return;
      const res = await resp.json();
      const unit = res.unit || {};
      const fm = unit.model || {};
      const panel = (drawer as RbDetailDrawer).previewPanel || (drawer as any).body;
      const esc2 = (s: string) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
      // v0.6.91: a WebItem renders an Open launcher card DIRECTLY from its model (badge + url + Open
      // button → launches Mail/Calendar/Maps) + a forward-ref to its source file (.eml/.ics) when linked.
      if (unit.ior === 'ior:class:WebItem' && fm.url) {
        const childUuid = String((fm.children || [])[0] || '').replace('ior:instance:', '');
        const srcLink = childUuid ? `<div style="margin-top:18px;font-size:0.8rem"><a href="#" data-src-uuid="${childUuid}" style="color:#42a5f5;text-decoration:none">📎 Source file</a></div>` : '';
        panel.innerHTML = `<div style="padding:32px 20px;text-align:center"><div style="font-size:3rem">${esc2(fm.badge || '🔗')}</div>`
          + `<h3 style="color:white;margin:12px 0;font-size:0.95rem">${esc2(fm.name || fm.url)}</h3>`
          + `<div style="word-break:break-all;color:#a1887f;font-size:0.75rem;margin-bottom:20px">${esc2(fm.url)}</div>`
          + `<a href="${esc2(fm.url)}" target="_blank" rel="noopener" style="display:inline-block;padding:12px 28px;background:#ff9800;color:#000;border-radius:8px;text-decoration:none;font-weight:600">↗ Open</a>${srcLink}</div>`;
        const srcEl = panel.querySelector('[data-src-uuid]');
        if (srcEl) srcEl.addEventListener('click', (ev: Event) => { ev.preventDefault(); this.openFilePreview(childUuid); });
        if ((drawer as RbDetailDrawer).setMode) (drawer as RbDetailDrawer).setMode('preview');
        drawer.setAttribute('ref', uuid); // r4011 CALLER FIX (architect 316b60c15): reference the REAL File unit by its scenario uuid — NOT `file:${uuid}` (a SYNTHETIC prefix → the drawer's resolveRefUnit→ensureViewUnit lazy-MINTED a bogus dup File name=uuid/ownerIor=null = the Tron-facing name=uuid regression). A bare instance uuid resolves the real unit (LinkedIn Banner.png), no mint.
        drawer.setAttribute('open', '');
        return;
      }
      const preview = renderContentPreview(uuid, fm.mimeType || '', fm.name || uuid, this.client.playerToken);
      // [impl:uuid:b8714c1d-58b2-4324-93ba-da5e0f760221] R19.78 buttons above filename
      panel.innerHTML = `${preview}<h3 style="margin:8px 0 0;font-size:0.9rem;color:white">${(fm.name || uuid).replace(/[<>]/g, '')}</h3>`;
      if ((drawer as RbDetailDrawer).setMode) (drawer as RbDetailDrawer).setMode('preview');
      drawer.setAttribute('ref', uuid); // r4011 CALLER FIX (architect 316b60c15): reference the REAL File unit by its scenario uuid — NOT `file:${uuid}` (a SYNTHETIC prefix → the drawer's resolveRefUnit→ensureViewUnit lazy-MINTED a bogus dup File name=uuid/ownerIor=null = the Tron-facing name=uuid regression). A bare instance uuid resolves the real unit (LinkedIn Banner.png), no mint.
      drawer.setAttribute('open', '');
      wireUrlActions(panel); // R21.9: toggle lazily fills the rb-preview-pane (RbPanZoom)
    } catch {}
  }

  private showOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = ''; }
  private hideOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = 'none'; }

  private showQrPopup(url: string): void {
    (document.querySelector('rb-qr-popup') as RbQrPopup)?.close();
    const popup = document.createElement('rb-qr-popup') as RbQrPopup;
    popup.show(url, `Join ${this.roomName}`);
  }

  private renderDebugOverlay(): void {
    if (!new URLSearchParams(location.search).has('debug')) return;
    let overlay = document.getElementById('rb-debug-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'rb-debug-overlay';
      overlay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:40vh;overflow:auto;background:rgba(0,0,0,0.9);color:#0f0;font:10px monospace;padding:8px;z-index:9999;pointer-events:auto';
      document.body.appendChild(overlay);
    }
    const standalone = (navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    const safeTop = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '?';
    const safeBot = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '?';
    const items = document.querySelectorAll('#room-tree rb-object-item');
    const lines = [`standalone=${standalone} safeTop=${safeTop} safeBot=${safeBot} items=${items.length}`];
    items.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const ref = el.getAttribute('ref') || '?';
      const type = el.getAttribute('type') || '?';
      const parent = el.closest('.tt-children') as HTMLElement;
      const parentH = parent ? parent.getBoundingClientRect().height : -1;
      const parentD = parent ? parent.style.display : '?';
      lines.push(`[${i}] ${type}:${ref.slice(0,12)} w=${r.width.toFixed(0)} h=${r.height.toFixed(0)} d=${cs.display} v=${cs.visibility} parent.h=${parentH.toFixed(0)} parent.d=${parentD}`);
    });
    overlay.textContent = lines.join('\n');
  }

  private renderMemberList(): void {
    const el = document.getElementById('member-list') as RbMemberList | null;
    if (!el) return;
    el.setMembers(this.members.map(m => ({
      id: m.id, name: m.name, avatarUrl: m.avatarUrl, avatarCrop: m.avatarCrop, playerToken: m.playerToken,
      isHost: m.id === this.hostId, isSelf: m.id === this.client.clientId, isConnected: !m.disconnected,
    })));
    setTimeout(() => this.renderDebugOverlay(), 2000);
  }
}
