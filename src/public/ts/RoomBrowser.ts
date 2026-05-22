import { RawBinClient, shareOrCopy } from './RawBinClient.js';
import { MSG } from '../../shared/MessageTypes.js';

interface RoomInfo {
  id: string; name: string; hostId: string; memberCount: number;
  maxMembers: number; isPrivate: boolean; state: string; creatorId?: string;
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
          <h1>RawBin</h1>
          <p class="lobby-subtitle">Collaborative Rooms</p>
        </div>
        <div class="lobby-name">
          <label>Your Name</label>
          <input type="text" id="member-name" value="${this.memberName}" maxlength="20" placeholder="Enter name...">
        </div>
        <div class="lobby-actions">
          <button id="create-room-btn" class="btn btn-primary">Create Room</button>
          <button id="refresh-rooms-btn" class="btn btn-secondary">Refresh</button>
        </div>
        <div class="lobby-create-form" id="create-form" style="display:none">
          <input type="text" id="room-name" placeholder="Room name..." value="My Room">
          <input type="number" id="room-max" placeholder="Max members" value="10" min="2" max="50">
          <input type="text" id="room-key" placeholder="Private key (optional)">
          <div class="lobby-create-actions">
            <button id="confirm-create-btn" class="btn btn-primary">Create</button>
            <button id="cancel-create-btn" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
        <div class="lobby-rooms" id="room-list"><p class="loading">Loading rooms...</p></div>
        <div class="lobby-join-private">
          <input type="text" id="join-room-id" placeholder="Room ID">
          <input type="text" id="join-room-key" placeholder="Key (if private)">
          <button id="join-private-btn" class="btn btn-small">Join Private</button>
        </div>
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

    document.getElementById('create-room-btn')?.addEventListener('click', () => {
      document.getElementById('create-form')!.style.display = 'block';
    });
    document.getElementById('cancel-create-btn')?.addEventListener('click', () => {
      document.getElementById('create-form')!.style.display = 'none';
    });
    document.getElementById('confirm-create-btn')?.addEventListener('click', () => {
      const name = (document.getElementById('room-name') as HTMLInputElement).value || 'My Room';
      const max = parseInt((document.getElementById('room-max') as HTMLInputElement).value) || 10;
      const key = (document.getElementById('room-key') as HTMLInputElement).value || undefined;
      this.client.createRoom(name, this.memberName, max, key);
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
      const isOwner = room.creatorId === this.client.playerToken;
      const stateLabel = room.state === 'archived' ? 'Archived' : 'Active';
      return `
        <div class="room-card" data-room-id="${room.id}">
          <div class="room-info">
            <span class="room-name">${room.isPrivate ? '🔒 ' : ''}${room.name}${isOwner ? ' <span class="owner-badge">owner</span>' : ''}</span>
            <span class="room-members">${room.memberCount}/${room.maxMembers} members</span>
          </div>
          <div class="room-status">
            <span class="room-state room-state-${room.state}">${stateLabel}</span>
            <button class="btn btn-share" data-room="${room.id}" title="Copy join link">🔗</button>
            ${room.state === 'active' ? `<button class="btn btn-join" data-room="${room.id}">Join</button>` : ''}
            ${room.state === 'active' ? `<button class="btn btn-spectate" data-room="${room.id}">Watch</button>` : ''}
            ${isOwner ? `<button class="btn btn-delete" data-room="${room.id}" title="Delete room">✕</button>` : ''}
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.btn-join').forEach(btn => {
      btn.addEventListener('click', () => { this.client.joinRoom((btn as HTMLElement).dataset.room!, this.memberName); });
    });
    list.querySelectorAll('.btn-spectate').forEach(btn => {
      btn.addEventListener('click', () => {
        const roomId = (btn as HTMLElement).dataset.room!;
        this.client.spectateRoom(roomId, this.memberName);
        this.onEnterRoom(roomId);
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
