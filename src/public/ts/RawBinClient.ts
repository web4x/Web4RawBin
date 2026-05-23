import { MSG } from '../../shared/MessageTypes.js';

type MessageHandler = (msg: any) => void;

export interface UserProfile {
  token: string; name: string; phone: string; url: string;
  avatar: string; secretCode: string; profileCommitted: boolean;
}

export class RawBinClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private _profile: UserProfile | null = null;
  clientId: string = '';
  connected: boolean = false;
  readonly playerToken: string;
  readonly deviceId: string;

  constructor() {
    let token = localStorage.getItem('rawbin-player-id');
    if (!token) { token = crypto.randomUUID(); localStorage.setItem('rawbin-player-id', token); }
    this.playerToken = token;
    let devId = localStorage.getItem('rawbin-device-id');
    if (!devId) { devId = crypto.randomUUID(); localStorage.setItem('rawbin-device-id', devId); }
    this.deviceId = devId;
  }

  isProfileCommitted(): boolean { return this._profile?.profileCommitted === true; }
  getProfile(): UserProfile | null { return this._profile; }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${location.host}`);
      this.ws.onopen = () => { this.connected = true; resolve(); };
      this.ws.onclose = () => { this.connected = false; this.emit('disconnected', {}); };
      this.ws.onerror = () => reject(new Error('WebSocket connection failed'));
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'welcome') {
            this.clientId = msg.clientId;
            this.send({
              type: MSG.IDENTIFY, playerToken: this.playerToken, deviceId: this.deviceId,
              name: localStorage.getItem('rawbin-name') || '',
              avatar: localStorage.getItem('rawbin-avatar') || '',
              screenWidth: screen.width, screenHeight: screen.height, platform: navigator.platform,
            });
          }
          if (msg.type === MSG.TOKEN_REDIRECT && msg.newToken) {
            localStorage.setItem('rawbin-player-id', msg.newToken);
          }
          if ((msg.type === MSG.PROFILE || msg.type === MSG.PROFILE_UPDATED) && msg.profile) {
            this._profile = msg.profile;
          }
          this.emit(msg.type, msg);
        } catch {}
      };
    });
  }

  async reconnect(): Promise<void> {
    if (this.ws) { try { this.ws.close(); } catch {} }
    this.ws = null; this.connected = false;
    this.emit('reconnecting', {});
    await this.connect();
    this.emit('reconnected', {});
  }

  send(msg: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  on(type: string, handler: MessageHandler): void {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  off(type: string, handler?: MessageHandler): void {
    if (!handler) { this.handlers.delete(type); return; }
    const list = this.handlers.get(type);
    if (list) this.handlers.set(type, list.filter(h => h !== handler));
  }

  once(type: string): Promise<any> {
    return new Promise(resolve => {
      const handler = (msg: any) => { this.off(type, handler); resolve(msg); };
      this.on(type, handler);
    });
  }

  private emit(type: string, msg: any): void {
    this.handlers.get(type)?.forEach(h => h(msg));
  }

  createRoom(name: string, memberName: string, maxMembers?: number, roomKey?: string): void {
    this.send({ type: MSG.CREATE_ROOM, roomName: name, playerName: memberName, maxPlayers: maxMembers, roomKey, playerToken: this.playerToken });
  }

  joinRoom(roomId: string, memberName: string, roomKey?: string): void {
    this.send({ type: MSG.JOIN_ROOM, roomId, playerName: memberName, roomKey, playerToken: this.playerToken });
  }

  leaveRoom(): void { this.send({ type: MSG.LEAVE_ROOM }); }
  listRooms(): void { this.send({ type: MSG.LIST_ROOMS }); }
  deleteRoom(roomId: string): void { this.send({ type: MSG.DELETE_ROOM, roomId }); }
  removeRoom(roomId: string): void { this.send({ type: MSG.REMOVE_ROOM, roomId }); }

  spectateRoom(roomId: string, name: string): void {
    this.send({ type: MSG.SPECTATE, roomId, playerName: name });
  }
  leaveSpectate(): void { this.send({ type: MSG.LEAVE_SPECTATE }); }
  joinFromSpectate(name: string): void {
    this.send({ type: MSG.JOIN_ROOM_FROM_SPECTATE, playerName: name });
  }

  sendChat(text: string): void { this.send({ type: MSG.CHAT_MESSAGE, text }); }
  sendBugReport(text: string): void { this.send({ type: MSG.BUG_REPORT, text }); }
}

export function guardClick(btn: HTMLElement, action: () => void | Promise<void>): void {
  btn.addEventListener('click', async () => {
    if ((btn as HTMLButtonElement).disabled) return;
    (btn as HTMLButtonElement).disabled = true;
    btn.classList.add('loading');
    try { await action(); } finally {
      (btn as HTMLButtonElement).disabled = false;
      btn.classList.remove('loading');
    }
  });
}

export async function shareOrCopy(url: string, feedbackEl?: HTMLElement, roomName?: string): Promise<void> {
  const suffix = roomName ? ` — ${roomName}` : '';
  if (navigator.share) {
    try { await navigator.share({ title: `RawBin${suffix}`, text: `Join my room on RawBin${suffix}`, url }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(`Join my RawBin room: ${url}${suffix}`); } catch { prompt('Copy this link:', url); return; }
  }
  if (feedbackEl) {
    const orig = feedbackEl.textContent;
    feedbackEl.textContent = 'Shared!';
    setTimeout(() => { feedbackEl.textContent = orig; }, 2000);
  }
}
