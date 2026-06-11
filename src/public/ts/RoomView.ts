// [impl:uuid:a2dfd6e8-3d5c-419a-a743-01fcaa7ba069] T5 room view
// [impl:uuid:71c283ff-5dee-4df5-be05-6fc5b743aa8a] RbRoomContent.linkResolve
// [impl:uuid:602fecd2-6fdb-4f57-8298-830f01a802fa] RbRoomContent.folderNodeRender
// [impl:uuid:d1bae8be-a6ca-41e8-bdf6-ee78399ef41e] RbRoomContent.applyButton
// [impl:uuid:32578dc6-58bb-4ce1-94be-2a78a142e139] RbRoomContent.mountTraceTree
// [impl:uuid:e289349c-ba8d-4182-9288-9bbd7ac3ed56] RbRoomContent.render
// [impl:uuid:3fbcebaf-2986-44d6-afd2-7ab810e824f2] RbRoomDetail.modeSet
import { RawBinClient } from './RawBinClient.js';
import { ProfileEditor } from './ProfileEditor.js';
import { ProfileSheet } from './ProfileSheet.js';
import { MSG } from '../../shared/MessageTypes.js';
import './components/rb-header.js';
import './components/rb-qr-popup.js';
import type { RbQrPopup } from './components/rb-qr-popup.js';
import './components/rb-chat-sheet.js';
import type { RbChatSheet } from './components/rb-chat-sheet.js';
import './components/rb-member-list.js';
import './components/rb-avatar.js';
import './trace/rb-object-item.js';
import { dropDispatcher } from './drop-dispatcher.js';
import type { RbMemberList } from './components/rb-member-list.js';
import './trace/rb-detail-drawer.js';
import { renderContentPreview, loadTextPreview, wireUrlActions } from './trace/content-preview.js';

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
  private chatSheet: RbChatSheet | null = null;

  constructor(client: RawBinClient, container: HTMLElement, onLeave: () => void) {
    this.client = client;
    this.container = container;
    this.onLeave = onLeave;
    this.profileEditor = new ProfileEditor(client);
    this.profileSheet = new ProfileSheet(client);

    this.client.on(MSG.ROOM_JOINED, (msg) => {
      this.roomId = msg.room.id;
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
    // [impl:uuid:dnd01002-b2c3-4d4e-9f5a-000000000002] FILE_ADDED handler
    this.client.on(MSG.FILE_ADDED, (msg) => {
      if (this.roomId !== msg.roomId) return;
      const ch = document.getElementById('rrc-files-children');
      if (ch) {
        const node = document.createElement('div'); node.className = 'tt-node';
        const row = document.createElement('div'); row.className = 'tt-row';
        const item = document.createElement('rb-object-item');
        item.setAttribute('ref', `file:${msg.fileUuid}`);
        item.setAttribute('type', 'file');
        item.setAttribute('name', msg.name || 'file');
        item.setAttribute('description', `${msg.mimeType || ''} · ${msg.size || 0}B`);
        row.appendChild(item); node.appendChild(row); ch.appendChild(node);
      }
      const filesNode = document.querySelector('#rrc-files-node rb-object-item');
      if (filesNode) {
        const cur = parseInt(filesNode.getAttribute('child-count') || '0');
        filesNode.setAttribute('child-count', String(cur + 1));
      }
      this.chatSheet?.addMessage('system', 'System', `File uploaded: ${msg.name}`);
    });
    this.client.on('disconnected', () => this.chatSheet?.setWsStatus('disconnected'));
    this.client.on('reconnecting', (msg) => this.chatSheet?.setWsStatus('reconnecting', msg.backoffMs ? `${Math.ceil(msg.backoffMs / 1000)}s` : undefined));
    this.client.on('reconnected', () => { this.chatSheet?.setWsStatus('connected'); this.hideOfflineBanner(); });
    this.client.on('online', () => this.hideOfflineBanner());
    this.client.on('offline', () => this.showOfflineBanner());

    // [impl:uuid:dnd01003-c3d4-4e5f-a060-000000000003] DropDispatcher.route
    this.container.addEventListener('rb-room-files-dropped', (async (e: CustomEvent) => {
      const files: File[] = e.detail?.files || [];
      for (const file of files) {
        try {
          const result = await dropDispatcher.dispatch(file, this.roomId, this.client.playerToken, (text) => this.chatSheet?.addMessage('system', 'System', text));
          if (!result) this.chatSheet?.addMessage('system', 'System', `Upload failed: ${file.name}`);
        } catch { this.chatSheet?.addMessage('system', 'System', `Upload error: ${file.name}`); }
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

  show(roomId: string): void { this.roomId = roomId; this.render(); }

  hide(): void {
    this.container.innerHTML = '';
    if (this.chatSheet) { this.chatSheet.remove(); this.chatSheet = null; }
    this.members = [];
  }

  // [impl:uuid:f9b579c1-7495-4f93-8dec-736a0410a69a] RbRoomDetail.editOpen R19
  // [impl:uuid:26b81ea0-9b6c-4395-b0d8-0f49bc4d1eb4] RbRoomDetail.scenarioLinkRender R19
  private openRoomEditor(): void {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000";
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    const modal = document.createElement("div");
    modal.style.cssText = "background:#1a1a2e;color:#fff;padding:20px;border-radius:12px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto";
    const v = this.roomVisibility, m = this.roomMode;
    modal.innerHTML = `<h3 style="margin-bottom:16px">Edit Room Config</h3><label style="display:block;margin-bottom:12px">Name<br><input id="re-name" type="text" style="width:100%;padding:8px;margin-top:4px;background:rgba(255,255,255,0.1);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:6px"></label><fieldset style="border:none;padding:0;margin-bottom:12px"><legend>Visibility</legend><label><input type="radio" name="re-vis" value="public" ${v==="public"?"checked":""}> Public</label><br><label><input type="radio" name="re-vis" value="by-invite" ${v==="by-invite"?"checked":""}> By-Invite</label><br><label><input type="radio" name="re-vis" value="private" ${v==="private"?"checked":""}> Private</label></fieldset><fieldset style="border:none;padding:0;margin-bottom:16px"><legend>Mode</legend><label><input type="radio" name="re-mode" value="live" ${m==="live"?"checked":""}> Live</label><br><label><input type="radio" name="re-mode" value="persistent" ${m==="persistent"?"checked":""}> Persistent (default)</label></fieldset><div style="display:flex;gap:8px;justify-content:flex-end"><button id="re-cancel" class="btn btn-secondary">Cancel</button><button id="re-save" class="btn btn-primary">Save</button></div>`;
    (modal.querySelector("#re-name") as HTMLInputElement).value = this.roomName;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    modal.querySelector("#re-cancel")!.addEventListener("click", () => overlay.remove());
    modal.querySelector("#re-save")!.addEventListener("click", () => {
      const name = (modal.querySelector("#re-name") as HTMLInputElement).value.trim();
      const vis = (modal.querySelector("input[name=re-vis]:checked") as HTMLInputElement)?.value;
      const md = (modal.querySelector("input[name=re-mode]:checked") as HTMLInputElement)?.value;
      this.client.send({ type: MSG.UPDATE_ROOM_CONFIG, roomId: this.roomId, name, visibility: vis, mode: md });
      overlay.remove();
    });
  }

  private render(): void {
    const isHost = this.roomOwnerToken === this.client.playerToken;
    this.container.innerHTML = `
      <div class="room-view">
        <rb-header title="${this.roomName}" show-leave show-home ${isHost ? 'show-delete show-edit' : ''} show-reload show-fullscreen></rb-header>
        <div style="padding:0 16px 4px;display:flex;gap:8px;align-items:center"><a href="/scenario?ior=${this.roomId}" style="color:#ff9800;font-size:0.75rem;text-decoration:none" title="View room scenario unit">📄 Scenario</a><span style="color:rgba(255,255,255,0.3);font-size:0.65rem">${this.roomId.slice(0,8)}</span></div>
        <div id="offline-banner" class="offline-banner" style="display:none">Offline — messages queued</div>
        <div class="room-body"><div class="member-panel"><h3>Members</h3><rb-member-list id="member-list"></rb-member-list></div><div class="rrc" id="rrc-root"><div class="rrc-drop" id="rrc-drop" tabindex="0"><div class="rrc-drop-label">Drop content here</div><div class="rrc-drop-hint">Files become room scenario units</div></div><div class="rrc-upload-status" id="rrc-upload-status" style="display:none"></div><div class="trace-tree" id="rrc-tree"><div class="tt-node" id="rrc-members-node"><div class="tt-row"><rb-object-item ref="collection:members" type="collection" name="Members" description="Room members" has-children children-open></rb-object-item></div><div class="tt-children" id="rrc-members-children"></div></div><div class="tt-node" id="rrc-files-node"><div class="tt-row"><rb-object-item ref="collection:files" type="collection" name="Files" description="Room files" has-children children-open></rb-object-item></div><div class="tt-children" id="rrc-files-children"></div></div></div></div></div>
        <rb-detail-drawer id="room-file-preview"></rb-detail-drawer>
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
      dz.addEventListener("dragenter", (e) => { e.preventDefault(); dropDispatcher.onDropEnter(dz); });
      dz.addEventListener("dragover", (e) => { e.preventDefault(); });
      dz.addEventListener("dragleave", () => { dropDispatcher.onDropExit(dz); });
      dz.addEventListener("drop", (e: Event) => {
        e.preventDefault();
        dropDispatcher.resetDrag(dz);
        const dt = (e as DragEvent).dataTransfer;
        if (!dt) return;
        const files = Array.from(dt.files || []);
        if (files.length > 0) {
          dz.dispatchEvent(new CustomEvent("rb-room-files-dropped", { detail: { files }, bubbles: true }));
        } else {
          const url = dt.getData('text/uri-list') || dt.getData('text/plain');
          if (url && url.startsWith('http')) {
            dropDispatcher.dispatchUrl(url, this.roomId, this.client.playerToken, (text) => this.chatSheet?.addMessage('system', 'System', text));
          }
        }
      });
    }

    const treeEl = document.getElementById('rrc-tree');
    if (treeEl) {
      treeEl.addEventListener('toggle-children', ((e: CustomEvent) => {
        const item = (e.target as HTMLElement).closest('rb-object-item');
        if (!item) return;
        const node = item.closest('.tt-node');
        const children = node?.querySelector('.tt-children') as HTMLElement | null;
        if (children) children.style.display = e.detail.open ? '' : 'none';
      }) as EventListener);
      // [impl:uuid:6471cfbd-d505-4876-97c5-9196cba80b53] R19.73 in-room file preview click
      treeEl.addEventListener('click', (e) => {
        const item = (e.target as HTMLElement).closest('rb-object-item');
        if (!item) return;
        const type = item.getAttribute('type');
        const ref = item.getAttribute('ref') || '';
        if (type === 'file' && ref.startsWith('file:')) {
          e.stopPropagation();
          this.openFilePreview(ref.replace('file:', ''));
        }
      });
    }

    if (this.chatSheet) this.chatSheet.remove();
    this.chatSheet = document.createElement('rb-chat-sheet') as RbChatSheet;
    this.chatSheet.clientIdentity = this.client.clientId;
    this.chatSheet.roomId = this.roomId;
    document.body.appendChild(this.chatSheet);

    this.chatSheet.addEventListener('rb-chat-send', ((e: CustomEvent) => this.client.sendChat(e.detail.text)) as EventListener);
    this.chatSheet.addEventListener('rb-invite', () => this.showQrPopup(`${(window as any).__shareBase || location.origin}/app?join=${this.roomId}`));
    this.chatSheet.addEventListener('rb-reconnect', async () => {
      this.chatSheet?.setWsStatus('reconnecting');
      try { await this.client.reconnect(); } catch { this.chatSheet?.setWsStatus('disconnected'); }
    });
    this.chatSheet.setWsStatus(this.client.connected ? 'connected' : 'disconnected');
    if (!this.client.isOnline()) this.showOfflineBanner();

    this.renderMemberList();
  }

  private async openFilePreview(uuid: string): Promise<void> {
    const drawer = document.getElementById('room-file-preview') as any;
    if (!drawer) return;
    try {
      const resp = await fetch(`/api/ior/ior:instance:${uuid}`);
      if (!resp.ok) return;
      const res = await resp.json();
      const fm = res.unit?.model || {};
      const preview = renderContentPreview(uuid, fm.mimeType || '', fm.name || uuid, this.client.playerToken);
      // [impl:uuid:b8714c1d-58b2-4324-93ba-da5e0f760221] R19.78 buttons above filename
      const body = (drawer as any).body as HTMLElement;
      body.innerHTML = `${preview}<h3 style="margin:8px 0 0;font-size:0.9rem;color:white">${(fm.name || uuid).replace(/[<>]/g, '')}</h3>`;
      drawer.setAttribute('ref', `file:${uuid}`);
      loadTextPreview(body, uuid, this.client.playerToken);
      wireUrlActions(body);
    } catch {}
  }

  private showOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = ''; }
  private hideOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = 'none'; }

  private showQrPopup(url: string): void {
    (document.querySelector('rb-qr-popup') as RbQrPopup)?.close();
    const popup = document.createElement('rb-qr-popup') as RbQrPopup;
    popup.show(url, `Join ${this.roomName}`);
  }

  // [impl:uuid:62f77af0-c12f-41dc-9ec8-c9a421bbf659] T-room-ui-shared R19.21
  private renderRoomTreeMembers(): void {
    const parentItem = document.querySelector('#rrc-members-node rb-object-item');
    if (parentItem) { parentItem.setAttribute('description', `${this.members.length} member${this.members.length !== 1 ? 's' : ''}`); parentItem.setAttribute('child-count', String(this.members.length)); }
    const ch = document.getElementById('rrc-members-children');
    if (!ch) return;
    ch.innerHTML = '';
    for (const m of this.members) {
      const node = document.createElement('div');
      node.className = 'tt-node';
      const row = document.createElement('div');
      row.className = 'tt-row';
      const item = document.createElement('rb-object-item');
      item.setAttribute('ref', `member:${m.playerToken}`);
      item.setAttribute('type', 'member');
      item.setAttribute('title', m.name || '?');
      item.setAttribute('name', m.name || '?');
      if (m.id === this.hostId) item.setAttribute('description', 'Host' + (m.disconnected ? ' · Offline' : ''));
      else if (m.id === this.client.clientId) item.setAttribute('description', 'You');
      else item.setAttribute('description', m.disconnected ? 'Offline' : 'Online');
      row.appendChild(item);
      node.appendChild(row);
      ch.appendChild(node);
    }
  }

  private renderMemberList(): void {
    this.renderRoomTreeMembers();
    const el = document.getElementById('member-list') as RbMemberList | null;
    if (!el) return;
    el.setMembers(this.members.map(m => ({
      id: m.id, name: m.name, avatarUrl: m.avatarUrl, avatarCrop: m.avatarCrop, playerToken: m.playerToken,
      isHost: m.id === this.hostId, isSelf: m.id === this.client.clientId, isConnected: !m.disconnected,
    })));
  }
}
