// [impl:uuid:a2dfd6e8-3d5c-419a-a743-01fcaa7ba069] T5 room view
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
import type { RbMemberList } from './components/rb-member-list.js';

interface MemberInfo {
  id: string; name: string; avatarUrl: string; playerToken: string; avatarCrop?: { scale: number; x: number; y: number } | null;
}

export class RoomView {
  private client: RawBinClient;
  private container: HTMLElement;
  private onLeave: () => void;
  private roomId = '';
  private roomName = '';
  private hostId = '';
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
      this.hostId = msg.room.hostId;
      this.members = msg.members || [];
      this.render();
      if (msg.room.chatHistory?.length) this.chatSheet?.loadHistory(msg.room.chatHistory);
    });
    this.client.on(MSG.MEMBER_JOINED, (msg) => { if (msg.member) this.members.push(msg.member); this.renderMemberList(); });
    this.client.on(MSG.MEMBER_LEFT, (msg) => { this.members = this.members.filter(m => m.id !== msg.memberId); this.renderMemberList(); });
    this.client.on(MSG.MEMBER_DISCONNECTED, () => this.renderMemberList());
    this.client.on(MSG.HOST_CHANGED, (msg) => { this.hostId = msg.hostId; this.renderMemberList(); });
    this.client.on(MSG.CHAT_HISTORY, (msg) => { if (msg.messages) this.chatSheet?.loadHistory(msg.messages); });
    this.client.on(MSG.CHAT_MESSAGE, (msg) => this.chatSheet?.addMessage(msg.senderId, msg.senderName, msg.text));
    this.client.on(MSG.ROOM_DELETED, () => this.onLeave());
    this.client.on('disconnected', () => this.chatSheet?.setWsStatus('disconnected'));
    this.client.on('reconnecting', (msg) => this.chatSheet?.setWsStatus('reconnecting', msg.backoffMs ? `${Math.ceil(msg.backoffMs / 1000)}s` : undefined));
    this.client.on('reconnected', () => { this.chatSheet?.setWsStatus('connected'); this.hideOfflineBanner(); });
    this.client.on('online', () => this.hideOfflineBanner());
    this.client.on('offline', () => this.showOfflineBanner());

    this.container.addEventListener('rb-leave', () => { this.client.leaveRoom(); this.onLeave(); });
    this.container.addEventListener('rb-delete', () => { if (confirm('Delete this room permanently?')) this.client.deleteRoom(this.roomId); });
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

  private render(): void {
    const isHost = this.hostId === this.client.clientId;
    this.container.innerHTML = `
      <div class="room-view">
        <rb-header title="${this.roomName}" show-leave show-home ${isHost ? 'show-delete' : ''} show-reload show-fullscreen></rb-header>
        <div id="offline-banner" class="offline-banner" style="display:none">Offline — messages queued</div>
        <div class="room-body"><div class="member-panel"><h3>Members</h3><rb-member-list id="member-list"></rb-member-list></div></div>
      </div>`;

    if (this.chatSheet) this.chatSheet.remove();
    this.chatSheet = document.createElement('rb-chat-sheet') as RbChatSheet;
    this.chatSheet.clientIdentity = this.client.clientId;
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

  private showOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = ''; }
  private hideOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = 'none'; }

  private showQrPopup(url: string): void {
    (document.querySelector('rb-qr-popup') as RbQrPopup)?.close();
    const popup = document.createElement('rb-qr-popup') as RbQrPopup;
    popup.show(url, `Join ${this.roomName}`);
  }

  private renderMemberList(): void {
    const el = document.getElementById('member-list') as RbMemberList | null;
    if (!el) return;
    el.setMembers(this.members.map(m => ({
      id: m.id, name: m.name, avatarUrl: m.avatarUrl, avatarCrop: m.avatarCrop, playerToken: m.playerToken,
      isHost: m.id === this.hostId, isSelf: m.id === this.client.clientId, isConnected: true,
    })));
  }
}
