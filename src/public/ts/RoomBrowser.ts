// [impl:uuid:784f17fd-53d4-4b45-86e4-5f3391ba3fdd] T5+T77 room browser lobby
// [impl:uuid:f7c4df8d-a6ee-4b70-b30b-5e6cfbcdd98d] Assets.rebrand
import { RawBinClient, shareOrCopy } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';
import './components/rb-header.js';
import './components/rb-avatar.js';
import { viewBus } from './ViewBus.js';

interface RoomInfo {
  id: string; name: string; hostId: string; memberCount: number;
    creatorId?: string; ownerToken?: string; ownerName?: string; mode?: "live"|"persistent"; visibility?: "public"|"by-invite"|"private";
}

export class RoomBrowser {
  private client: RawBinClient;
  private container: HTMLElement;
  private rooms: RoomInfo[] = [];
  private memberName: string = '';
  private onEnterRoom: (roomId: string) => void;

  constructor(client: RawBinClient, container: HTMLElement, onEnterRoom: (roomId: string) => void) {
    this.client = client;
    this.container = container;
    this.onEnterRoom = onEnterRoom;

    const params = new URLSearchParams(window.location.search);
    this.memberName = params.get('name') || localStorage.getItem('rawbin-name') || `User ${Math.floor(Math.random() * 1000)}`;

    this.client.on(MSG.ROOM_LIST, (msg) => { this.rooms = msg.rooms; this.renderRoomList(); });
    this.client.on(MSG.ROOM_JOINED, (msg) => { this.onEnterRoom(msg.room.id); });
    this.client.on(MSG.ERROR, (msg) => { this.showError(msg.message); });
    this.client.on(MSG.ROOM_APPLY_ACCEPTED, (msg) => {
      this.client.joinRoom(msg.roomId, this.memberName);
    });

    const joinId = params.get('join');
    this.client.on('welcome', () => {
      this.client.listRooms();
      if (joinId) this.client.joinRoom(joinId, this.memberName);
    });
  }

  show(): void { this.render(); this.client.listRooms(); }
  hide(): void { this.container.innerHTML = ''; }

  private render(): void {
    this.container.innerHTML = `
      <div class="lobby">
        <div class="lobby-header">
          <rb-header title="RawBin" show-home show-reload show-fullscreen></rb-header>
          <p class="lobby-subtitle">Collaborative Rooms</p>
        </div>
        <div class="lobby-name">
          <div class="lobby-name-row">
            <rb-avatar size="48" src="${this.client.getProfile()?.avatar || ''}" name="${this.memberName}" token="${this.client.playerToken}" crop='${this.client.getProfile()?.avatarCrop ? JSON.stringify(this.client.getProfile()!.avatarCrop) : ''}'></rb-avatar>
            <div class="lobby-name-field">
              <label>Your Name</label>
              <input type="text" id="member-name" value="${this.memberName}" placeholder="Enter name...">
            </div>
          </div>
        </div>
        <div class="lobby-actions">
          <button id="create-room-btn" class="btn btn-primary">Create Room</button>
          <button id="refresh-rooms-btn" class="btn btn-secondary">Refresh</button>
        </div>
        <div class="lobby-create-form" id="create-form" style="display:none">
          <input type="text" id="room-name" placeholder="Room name..." value="${this.client.getProfile()?.name ? this.client.getProfile()!.name + "'s Room" : ''}">
          <input type="text" id="room-key" placeholder="Private key (optional)">
          <div class="lobby-create-actions">
            <button id="confirm-create-btn" class="btn btn-primary">Create</button>
            <button id="cancel-create-btn" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
        <div class="lobby-join-private">
          <input type="text" id="join-room-id" placeholder="Room ID">
          <input type="text" id="join-room-key" placeholder="Key (if private)">
          <button id="join-private-btn" class="btn btn-small">Join Private</button>
        </div>
        <div class="lobby-rooms" id="room-list"><p class="loading">Loading rooms...</p></div>
        <div id="lobby-error" class="lobby-error" style="display:none"></div>
        <div class="lobby-links">
          <a href="/profile">Profile</a> · <a href="/bug-report">Report Bug</a>
        </div>
      </div>`;
    this.setupEvents();
  }

  private setupEvents(): void {
    const nameInput = document.getElementById('member-name') as HTMLInputElement;
    nameInput?.addEventListener('change', () => {
      this.memberName = nameInput.value.trim() || 'User';
      localStorage.setItem('rawbin-name', this.memberName);
    });
    viewBus.subscribe('User', this.client.playerToken, (m) => {
      if (m.displayName && nameInput) { nameInput.value = String(m.displayName); this.memberName = String(m.displayName); }
    });

    document.getElementById('create-room-btn')?.addEventListener('click', () => {
      document.getElementById('create-form')!.style.display = 'block';
    });
    document.getElementById('cancel-create-btn')?.addEventListener('click', () => {
      document.getElementById('create-form')!.style.display = 'none';
    });
    document.getElementById('confirm-create-btn')?.addEventListener('click', () => {
      const defaultName = this.client.getProfile()?.name ? this.client.getProfile()!.name + "'s Room" : 'New Room';
      const name = (document.getElementById('room-name') as HTMLInputElement).value || defaultName;
      const key = (document.getElementById('room-key') as HTMLInputElement).value || undefined;
      this.client.createRoom(name, this.memberName, key);
    });
    document.getElementById('refresh-rooms-btn')?.addEventListener('click', () => { this.client.listRooms(); });
    document.getElementById('join-private-btn')?.addEventListener('click', () => {
      const roomId = (document.getElementById('join-room-id') as HTMLInputElement).value;
      const key = (document.getElementById('join-room-key') as HTMLInputElement).value || undefined;
      if (roomId) this.client.joinRoom(roomId, this.memberName, key);
    });
  }

  private renderRoomList(): void {
    const list = document.getElementById('room-list');
    if (!list) return;
    if (this.rooms.length === 0) {
      list.innerHTML = '<p class="no-rooms">No rooms available. Create one!</p>';
      return;
    }
    list.innerHTML = this.rooms.map(room => {
      const isOwner = (room.ownerToken || room.creatorId) === this.client.playerToken;
      const stateLabel = room.state === 'archived' ? 'Archived' : 'Active';
      const ownerLabel = isOwner ? ' <span class="owner-badge">you</span>' : (room.ownerName ? ` <span class="room-owner">by ${room.ownerName}</span>` : '');
      return `
        <div class="room-card" data-room-id="${room.id}">
          <div class="room-info">
            <span class="room-name">${room.isPrivate ? '🔒 ' : ''}${room.name}${ownerLabel}</span>
            <span class="room-id">${room.id}</span>
            <span class="room-persist" title="Room lifecycle mode">${room.mode === "live" ? "⚡ Live" : "💾 Persistent"}</span>
          </div>
          <div class="room-status">
            <span class="room-state room-state-${room.state}">${stateLabel}</span>
            ${room.state === 'active' ? (room.visibility === 'by-invite' && !isOwner ? `<button class="btn btn-apply" data-room="${room.id}">Apply</button>` : `<button class="btn btn-join" data-room="${room.id}">Join</button>`) : ''}
            ${isOwner ? `<button class="btn btn-delete" data-room="${room.id}" title="Delete room">✕</button>` : ''}
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.btn-join').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = (btn as HTMLElement).dataset.room!;
        const room = this.rooms.find(r => r.id === roomId);
        if (room?.isPrivate) {
          const key = prompt('Enter room key:');
          if (key) this.client.joinRoom(roomId, this.memberName, key);
        } else {
          this.client.joinRoom(roomId, this.memberName);
        }
      });
    });
  // [impl:uuid:5a397d5d-3d97-4152-8a7b-14caca1398ca] JoinRequestFlow.applySend
    list.querySelectorAll('.btn-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = (btn as HTMLElement).dataset.room!;
        this.client.send({ type: MSG.ROOM_APPLY, roomId, playerName: this.memberName, playerToken: this.client.playerToken });
        (btn as HTMLElement).textContent = 'Applied';
        (btn as HTMLElement).setAttribute('disabled', '');
      });
    });
    list.querySelectorAll('.btn-share').forEach(btn => {
      btn.addEventListener('click', async () => {
        const roomId = (btn as HTMLElement).dataset.room!;
        const base = (window as any).__shareBase || location.origin;
        await shareOrCopy(`${base}/app?join=${roomId}`, btn as HTMLElement);
      });
    });
    list.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = (btn as HTMLElement).dataset.room!;
        if (confirm('Delete this room?')) this.client.deleteRoom(roomId);
      });
    });
  }

  private showError(message: string): void {
    const el = document.getElementById('lobby-error');
    if (el) { el.textContent = message; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 3000); }
  }
}
