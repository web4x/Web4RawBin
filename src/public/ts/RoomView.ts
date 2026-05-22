import { RawBinClient, guardClick, shareOrCopy } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';

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

  constructor(client: RawBinClient, container: HTMLElement, onLeave: () => void) {
    this.client = client;
    this.container = container;
    this.onLeave = onLeave;

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

    this.client.on(MSG.MEMBER_DISCONNECTED, (msg) => {
      this.renderMemberList();
    });

    this.client.on(MSG.HOST_CHANGED, (msg) => {
      this.hostId = msg.hostId;
      this.renderMemberList();
    });

    this.client.on(MSG.CHAT_HISTORY, (msg) => {
      this.chatMessages = msg.messages.map((m: any) => ({ senderId: m.senderId, senderName: m.senderName, text: m.text }));
      this.renderChatMessages();
    });

    this.client.on(MSG.CHAT_MESSAGE, (msg) => {
      this.chatMessages.push({ senderId: msg.senderId, senderName: msg.senderName, text: msg.text });
      this.appendChatMessage(msg);
    });

    this.client.on(MSG.ROOM_DELETED, () => {
      this.onLeave();
    });
  }

  show(roomId: string): void {
    this.roomId = roomId;
    this.chatMessages = [];
    this.render();
  }

  hide(): void {
    this.container.innerHTML = '';
    this.chatMessages = [];
    this.members = [];
  }

  private render(): void {
    const isHost = this.members.some(m => m.id === this.client.clientId && this.hostId === this.client.clientId);

    this.container.innerHTML = `
      <div class="room-view">
        <div class="room-header">
          <button id="leave-btn" class="btn btn-back">← Leave</button>
          <h2 id="room-title">${this.roomName}</h2>
          <button id="invite-btn" class="btn btn-small">🔗 Invite</button>
        </div>

        <div class="room-body">
          <div class="member-panel">
            <h3>Members</h3>
            <div id="member-list"></div>
          </div>

          <div class="chat-panel">
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-bar">
              <input type="text" id="chat-input" placeholder="Message..." maxlength="200" autocomplete="off">
              <button id="chat-send" class="btn btn-small btn-primary">Send</button>
            </div>
          </div>
        </div>

        ${isHost ? `
        <div class="room-settings">
          <button id="delete-room-btn" class="btn btn-danger btn-small">Delete Room</button>
        </div>` : ''}
      </div>`;

    this.renderMemberList();
    this.renderChatMessages();
    this.setupEvents();
  }

  private setupEvents(): void {
    document.getElementById('leave-btn')?.addEventListener('click', () => {
      this.client.leaveRoom();
      this.onLeave();
    });

    const inviteBtn = document.getElementById('invite-btn');
    if (inviteBtn) {
      guardClick(inviteBtn, async () => {
        const base = (window as any).__shareBase || location.origin;
        await shareOrCopy(`${base}/app?join=${this.roomId}`, inviteBtn, this.roomName);
      });
    }

    const input = document.getElementById('chat-input') as HTMLInputElement;
    const sendBtn = document.getElementById('chat-send');
    const doSend = () => {
      const text = input?.value.trim();
      if (!text) return;
      this.client.sendChat(text);
      input.value = '';
    };
    sendBtn?.addEventListener('click', doSend);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });

    document.getElementById('delete-room-btn')?.addEventListener('click', () => {
      if (confirm('Delete this room permanently?')) {
        this.client.deleteRoom(this.roomId);
      }
    });
  }

  private renderMemberList(): void {
    const el = document.getElementById('member-list');
    if (!el) return;
    el.innerHTML = this.members.map(m => {
      const isHost = m.id === this.hostId;
      const isSelf = m.id === this.client.clientId;
      return `<div class="member-item${isSelf ? ' member-self' : ''}">
        <span class="member-name">${m.name}${isHost ? ' <span class="host-badge">host</span>' : ''}${isSelf ? ' (you)' : ''}</span>
      </div>`;
    }).join('');
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
