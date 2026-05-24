import { RawBinClient, shareOrCopy } from './RawBinClient.js';
import { ProfileEditor } from './ProfileEditor.js';
import { ProfileSheet } from './ProfileSheet.js';
import { MSG } from '../../shared/MessageTypes.js';
import QRCode from 'qrcode';
import './components/rb-header.js';
import './components/rb-chat-sheet.js';
import type { RbChatSheet } from './components/rb-chat-sheet.js';

interface MemberInfo {
  id: string; name: string; avatarUrl: string; playerToken: string;
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
        <div class="room-body"><div class="member-panel"><h3>Members</h3><div id="member-list"></div></div></div>
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
    this.container.addEventListener('rb-leave', () => { this.client.leaveRoom(); this.onLeave(); });
    this.container.addEventListener('rb-delete', () => { if (confirm('Delete this room permanently?')) this.client.deleteRoom(this.roomId); });
  }

  private showOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = ''; }
  private hideOfflineBanner(): void { const el = document.getElementById('offline-banner'); if (el) el.style.display = 'none'; }

  private async showQrPopup(url: string): Promise<void> {
    document.getElementById('qr-popup')?.remove();
    const o = document.createElement('div'); o.id = 'qr-popup'; o.className = 'qr-overlay';
    o.innerHTML = `<div class="qr-popup-content"><h3>Scan to Join</h3><canvas id="qr-canvas"></canvas><p class="qr-url">${url}</p><div class="qr-actions"><button class="btn btn-primary btn-small" id="qr-share">Share Link</button><button class="btn btn-secondary btn-small" id="qr-close">Close</button></div></div>`;
    document.body.appendChild(o);
    const c = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (c) { try { await QRCode.toCanvas(c, url, { width: 200, margin: 2 }); } catch {} }
    document.getElementById('qr-share')?.addEventListener('click', async () => await shareOrCopy(url, document.getElementById('qr-share')!, this.roomName));
    document.getElementById('qr-close')?.addEventListener('click', () => o.remove());
    o.addEventListener('click', (e) => { if (e.target === o) o.remove(); });
  }

  private renderMemberList(): void {
    const el = document.getElementById('member-list');
    if (!el) return;
    el.innerHTML = this.members.map(m => {
      const isHost = m.id === this.hostId, isSelf = m.id === this.client.clientId;
      const initial = (m.name || '?')[0].toUpperCase();
      const av = m.avatarUrl ? `<img src="${m.avatarUrl}" class="mb-avatar" alt="${initial}">` : `<span class="mb-avatar mb-avatar-fallback">${initial}</span>`;
      return `<div class="mb-badge${isSelf ? ' mb-self' : ''}" data-member-id="${m.id}" data-member-token="${m.playerToken || ''}">${av}<span class="mb-name">${m.name}${isSelf ? ' (you)' : ''}</span>${isHost ? '<span class="mb-host" title="Host">★</span>' : ''}<span class="mb-status">●</span></div>`;
    }).join('');
    el.querySelectorAll('.mb-badge').forEach(item => {
      item.addEventListener('click', () => {
        const id = (item as HTMLElement).dataset.memberId, tk = (item as HTMLElement).dataset.memberToken;
        if (id === this.client.clientId) {
          const p = this.client.getProfile();
          this.profileEditor.open({ name: p?.name || localStorage.getItem('rawbin-name') || '', phone: p?.phone || '', url: p?.url || '', avatar: p?.avatar || '', secretCode: p?.secretCode || '' }, 'normal');
        } else if (tk) {
          const h = (msg: any) => { this.client.off(MSG.USER_INFO, h); if (msg.profile) this.profileSheet.open(msg.profile); };
          this.client.on(MSG.USER_INFO, h);
          this.client.send({ type: MSG.GET_USER_INFO, playerToken: tk });
        }
      });
    });
  }
}
