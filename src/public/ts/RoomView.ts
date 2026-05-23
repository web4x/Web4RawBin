import { RawBinClient, guardClick, shareOrCopy } from './RawBinClient.js';
import { ProfileEditor } from './ProfileEditor.js';
import { ProfileSheet } from './ProfileSheet.js';
import { MSG } from '../../shared/MessageTypes.js';
import QRCode from 'qrcode';

interface MemberInfo {
  id: string; name: string; avatarUrl: string; playerToken: string;
}

export class RoomView {
  private client: RawBinClient;
  private container: HTMLElement;
  private onLeave: () => void;
  private roomId: string = '';
  private roomName: string = '';
  private hostId: string = '';
  private members: MemberInfo[] = [];
  private chatMessages: { senderId: string; senderName: string; text: string }[] = [];
  private chatExpanded: boolean = false;
  private profileEditor: ProfileEditor;
  private profileSheet: ProfileSheet;

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
      if (msg.room.chatHistory) {
        this.chatMessages = msg.room.chatHistory.map((m: any) => ({ senderId: m.senderId, senderName: m.senderName, text: m.text }));
      }
      this.render();
    });

    this.client.on(MSG.MEMBER_JOINED, (msg) => {
      if (msg.member) this.members.push(msg.member);
      this.renderMemberList();
    });

    this.client.on(MSG.MEMBER_LEFT, (msg) => {
      this.members = this.members.filter(m => m.id !== msg.memberId);
      this.renderMemberList();
    });

    this.client.on(MSG.MEMBER_DISCONNECTED, () => { this.renderMemberList(); });

    this.client.on(MSG.HOST_CHANGED, (msg) => {
      this.hostId = msg.hostId;
      this.renderMemberList();
    });

    this.client.on(MSG.CHAT_HISTORY, (msg) => {
      if (!msg.messages) return;
      this.chatMessages = msg.messages.map((m: any) => ({ senderId: m.senderId, senderName: m.senderName, text: m.text }));
      this.renderChatMessages();
    });

    this.client.on(MSG.CHAT_MESSAGE, (msg) => {
      this.chatMessages.push({ senderId: msg.senderId, senderName: msg.senderName, text: msg.text });
      this.appendChatMessage(msg);
      if (!this.chatExpanded) {
        const handle = document.getElementById('chat-handle');
        const sheet = document.getElementById('chat-sheet');
        if (handle && sheet) {
          const preview = document.createElement('div');
          preview.className = 'chat-preview';
          const b = document.createElement('b');
          b.textContent = `${msg.senderName}:`;
          preview.appendChild(b);
          preview.appendChild(document.createTextNode(' ' + (msg.text || '').replace(/\n/g, ' ').slice(0, 40)));
          handle.innerHTML = '';
          handle.appendChild(preview);
          sheet.classList.add('chat-peek');
          setTimeout(() => {
            handle.innerHTML = '<div class="chat-handle-bar"></div>';
            sheet.classList.remove('chat-peek');
          }, 3000);
        }
      }
    });

    this.client.on(MSG.ROOM_DELETED, () => { this.onLeave(); });

    this.client.on('disconnected', () => this.updateWsStatus('disconnected'));
    this.client.on('reconnecting', () => this.updateWsStatus('reconnecting'));
    this.client.on('reconnected', () => this.updateWsStatus('connected'));
  }

  show(roomId: string): void {
    this.roomId = roomId;
    this.chatMessages = [];
    this.chatExpanded = false;
    this.render();
  }

  hide(): void {
    this.container.innerHTML = '';
    const sheet = document.getElementById('chat-sheet');
    if (sheet) sheet.remove();
    this.chatMessages = [];
    this.members = [];
  }

  private render(): void {
    const isHost = this.hostId === this.client.clientId;

    this.container.innerHTML = `
      <div class="room-view">
        <div class="room-header">
          <button id="leave-btn" class="btn btn-header" title="Leave room">←</button>
          <button id="home-btn" class="btn btn-header" title="Home">🏠</button>
          <h2 id="room-title">${this.roomName}</h2>
          ${isHost ? '<button id="delete-room-btn" class="btn btn-header btn-header-danger" title="Delete room">🗑</button>' : ''}
          <button id="reload-btn" class="btn btn-header" title="Reload">↻</button>
          <button id="fullscreen-btn" class="btn btn-header" title="Fullscreen">⛶</button>
        </div>
        <div class="room-body">
          <div class="member-panel">
            <h3>Members</h3>
            <div id="member-list"></div>
          </div>
        </div>
      </div>`;

    const existingSheet = document.getElementById('chat-sheet');
    if (existingSheet) existingSheet.remove();

    const sheet = document.createElement('div');
    sheet.className = 'chat-sheet';
    sheet.id = 'chat-sheet';
    sheet.innerHTML = `
      <div class="chat-handle" id="chat-handle"><div class="chat-handle-bar"></div></div>
      <div class="chat-invite" id="chat-invite">
        <button id="chat-invite-btn" class="btn btn-small btn-primary">📨 Invite</button>
        <span class="chat-invite-label">Share room link</span>
        <span id="ws-status" class="ws-status ws-connected" title="Connected">●</span>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-bar">
        <input type="text" id="chat-input" placeholder="Message..." maxlength="200" autocomplete="off">
        <button id="chat-send" class="btn btn-small btn-primary">Send</button>
      </div>`;
    document.body.appendChild(sheet);

    this.renderMemberList();
    this.renderChatMessages();
    this.setupEvents();
    this.setupChat();
  }

  private setupEvents(): void {
    document.getElementById('leave-btn')?.addEventListener('click', () => {
      this.client.leaveRoom();
      this.onLeave();
    });

    document.getElementById('home-btn')?.addEventListener('click', () => {
      window.location.href = '/';
    });

    document.getElementById('reload-btn')?.addEventListener('click', () => {
      location.reload();
    });

    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
      const btn = document.getElementById('fullscreen-btn');
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        if (btn) btn.textContent = '✕';
      } else {
        document.exitFullscreen().catch(() => {});
        if (btn) btn.textContent = '⛶';
      }
    });

    document.getElementById('delete-room-btn')?.addEventListener('click', () => {
      if (confirm('Delete this room permanently?')) this.client.deleteRoom(this.roomId);
    });
  }

  private setupChat(): void {
    const sheet = document.getElementById('chat-sheet');
    const handle = document.getElementById('chat-handle');
    const input = document.getElementById('chat-input') as HTMLInputElement;
    const sendBtn = document.getElementById('chat-send');
    if (!sheet || !handle || !input || !sendBtn) return;

    const chatInviteBtn = document.getElementById('chat-invite-btn');
    if (chatInviteBtn) guardClick(chatInviteBtn, async () => {
      const base = (window as any).__shareBase || location.origin;
      const url = `${base}/app?join=${this.roomId}`;
      this.showQrPopup(url);
    });

    const wsStatus = document.getElementById('ws-status');
    if (wsStatus) {
      this.updateWsStatus(this.client.connected ? 'connected' : 'disconnected');
      wsStatus.style.cursor = 'pointer';
      wsStatus.addEventListener('click', async () => {
        if (this.client.connected) return;
        this.updateWsStatus('reconnecting');
        try { await this.client.reconnect(); } catch { this.updateWsStatus('disconnected'); }
      });
    }

    this.chatExpanded = false;

    handle.addEventListener('click', () => {
      this.chatExpanded = !this.chatExpanded;
      sheet.classList.toggle('chat-expanded', this.chatExpanded);
    });

    let startY = 0;
    handle.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
    handle.addEventListener('touchmove', (e) => {
      const dy = startY - e.touches[0].clientY;
      if (dy > 30 && !this.chatExpanded) { this.chatExpanded = true; sheet.classList.add('chat-expanded'); }
      if (dy < -30 && this.chatExpanded) { this.chatExpanded = false; sheet.classList.remove('chat-expanded'); }
    }, { passive: true });

    const doSend = () => {
      const text = input.value.trim();
      if (!text) return;
      this.client.sendChat(text);
      input.value = '';
    };
    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });
  }

  private updateWsStatus(state: string): void {
    const el = document.getElementById('ws-status');
    if (!el) return;
    el.className = `ws-status ws-${state}`;
    el.title = state === 'connected' ? 'Connected' : state === 'disconnected' ? 'Disconnected' : 'Reconnecting';
  }

  private async showQrPopup(url: string): Promise<void> {
    const existing = document.getElementById('qr-popup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'qr-popup';
    overlay.className = 'qr-overlay';
    overlay.innerHTML = `
      <div class="qr-popup-content">
        <h3>Scan to Join</h3>
        <canvas id="qr-canvas"></canvas>
        <p class="qr-url">${url}</p>
        <div class="qr-actions">
          <button class="btn btn-primary btn-small" id="qr-share">Share Link</button>
          <button class="btn btn-secondary btn-small" id="qr-close">Close</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
    if (canvas) {
      try { await QRCode.toCanvas(canvas, url, { width: 200, margin: 2 }); } catch {}
    }

    document.getElementById('qr-share')?.addEventListener('click', async () => {
      await shareOrCopy(url, document.getElementById('qr-share')!, this.roomName);
    });
    document.getElementById('qr-close')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }

  private renderMemberList(): void {
    const el = document.getElementById('member-list');
    if (!el) return;
    el.innerHTML = this.members.map(m => {
      const isHost = m.id === this.hostId;
      const isSelf = m.id === this.client.clientId;
      const initial = (m.name || '?')[0].toUpperCase();
      const avatar = m.avatarUrl
        ? `<img src="${m.avatarUrl}" class="mb-avatar" alt="${initial}">`
        : `<span class="mb-avatar mb-avatar-fallback">${initial}</span>`;
      return `<div class="mb-badge${isSelf ? ' mb-self' : ''}" data-member-id="${m.id}" data-member-token="${m.playerToken || ''}">
        ${avatar}
        <span class="mb-name">${m.name}${isSelf ? ' (you)' : ''}</span>
        ${isHost ? '<span class="mb-host" title="Host">★</span>' : ''}
        <span class="mb-status" title="Connected">●</span>
      </div>`;
    }).join('');

    el.querySelectorAll('.mb-badge').forEach(item => {
      item.addEventListener('click', () => {
        const memberId = (item as HTMLElement).dataset.memberId;
        const memberToken = (item as HTMLElement).dataset.memberToken;
        if (memberId === this.client.clientId) {
          const profile = this.client.getProfile();
          this.profileEditor.open({
            name: profile?.name || localStorage.getItem('rawbin-name') || '',
            phone: profile?.phone || '', url: profile?.url || '',
            avatar: profile?.avatar || '', secretCode: profile?.secretCode || '',
          }, 'normal');
        } else if (memberToken) {
          const handler = (msg: any) => {
            this.client.off(MSG.USER_INFO, handler);
            if (msg.profile) this.profileSheet.open(msg.profile);
          };
          this.client.on(MSG.USER_INFO, handler);
          this.client.send({ type: MSG.GET_USER_INFO, playerToken: memberToken });
        }
      });
    });
  }

  private renderChatMessages(): void {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    el.innerHTML = '';
    for (const m of this.chatMessages) {
      el.appendChild(this.createChatBubble(m.senderId, m.senderName, m.text));
    }
    el.scrollTop = el.scrollHeight;
  }

  private appendChatMessage(msg: { senderId: string; senderName: string; text: string }): void {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    el.appendChild(this.createChatBubble(msg.senderId, msg.senderName, msg.text));
    el.scrollTop = el.scrollHeight;
  }

  private createChatBubble(senderId: string, senderName: string, text: string): HTMLElement {
    const div = document.createElement('div');
    div.className = `chat-msg ${senderId === this.client.clientId ? 'chat-self' : ''}`;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'chat-name';
    nameSpan.textContent = senderName;
    const textNode = document.createElement('span');
    textNode.className = 'chat-text';
    textNode.textContent = text;
    div.appendChild(nameSpan);
    div.appendChild(textNode);
    return div;
  }
}
