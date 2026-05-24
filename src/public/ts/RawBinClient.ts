import { MSG } from '../../shared/MessageTypes.js';

type MessageHandler = (msg: any) => void;

export interface UserProfile {
  token: string; name: string; phone: string; url: string;
  avatar: string; avatarCrop?: { scale: number; x: number; y: number } | null;
  secretCode: string; profileCommitted: boolean;
}

export class RawBinClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private _profile: UserProfile | null = null;
  private messageQueue: string[] = [];
  private backoffMs: number = 0;
  private backoffTimer: ReturnType<typeof setTimeout> | null = null;
  private autoReconnect: boolean = false;
  private online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
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

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online = true;
        this.emit('online', {});
        if (this.autoReconnect && !this.connected) this.scheduleReconnect();
      });
      window.addEventListener('offline', () => {
        this.online = false;
        this.emit('offline', {});
        this.cancelReconnect();
      });
    }
  }

  isProfileCommitted(): boolean { return this._profile?.profileCommitted === true; }
  getProfile(): UserProfile | null { return this._profile; }
  isOnline(): boolean { return this.online; }
  getBackoffMs(): number { return this.backoffMs; }
  getQueueLength(): number { return this.messageQueue.length; }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${location.host}`);

      this.ws.onopen = () => {
        this.connected = true;
        this.autoReconnect = true;
        this.backoffMs = 0;
        this.replayQueue();
        resolve();
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.emit('disconnected', {});
        if (this.autoReconnect) this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (!this.connected) reject(new Error('WebSocket connection failed'));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'welcome') {
            this.clientId = msg.clientId;
            if (msg.challenge && localStorage.getItem('rawbin-device-privateKey')) {
              this.signAndAuth(msg.challenge);
            }
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
            if (msg.profile.avatar && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('rb-avatar-updated', { detail: { token: msg.profile.token, url: msg.profile.avatar, crop: msg.profile.avatarCrop } }));
            }
          }
          if (msg.type === MSG.MEMBER_JOINED && msg.member?.avatarUrl && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('rb-avatar-updated', { detail: { token: msg.member.playerToken, url: msg.member.avatarUrl, crop: msg.member.avatarCrop } }));
          }
          this.emit(msg.type, msg);
        } catch {}
      };
    });
  }

  private scheduleReconnect(): void {
    if (!this.online) return;
    this.cancelReconnect();
    this.backoffMs = this.backoffMs === 0 ? 1000 : Math.min(this.backoffMs * 2, 30000);
    this.emit('reconnecting', { backoffMs: this.backoffMs, queueLength: this.messageQueue.length });
    this.backoffTimer = setTimeout(async () => {
      this.backoffTimer = null;
      try {
        if (this.ws) { try { this.ws.close(); } catch {} }
        this.ws = null;
        await this.connect();
        this.emit('reconnected', {});
      } catch {
        if (this.autoReconnect) this.scheduleReconnect();
      }
    }, this.backoffMs);
  }

  private cancelReconnect(): void {
    if (this.backoffTimer) {
      clearTimeout(this.backoffTimer);
      this.backoffTimer = null;
    }
  }

  async reconnect(): Promise<void> {
    this.cancelReconnect();
    if (this.ws) { try { this.ws.close(); } catch {} }
    this.ws = null;
    this.connected = false;
    this.backoffMs = 0;
    this.emit('reconnecting', { backoffMs: 0, queueLength: this.messageQueue.length });
    await this.connect();
    this.emit('reconnected', {});
  }

  send(msg: object): void {
    const data = JSON.stringify(msg);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    } else {
      this.messageQueue.push(data);
      this.emit('queued', { queueLength: this.messageQueue.length });
    }
  }

  private replayQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.messageQueue.length === 0) return;
    const queued = this.messageQueue.splice(0);
    for (const data of queued) {
      this.ws.send(data);
    }
    this.emit('queue-flushed', { flushed: queued.length });
  }

  destroy(): void {
    this.autoReconnect = false;
    this.cancelReconnect();
    if (this.ws) { try { this.ws.close(); } catch {} }
    this.ws = null;
    this.connected = false;
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

  private async signAndAuth(challenge: string): Promise<void> {
    try {
      const signedChallenge = await this.signChallenge(challenge);
      if (!signedChallenge) return;
      const devicePublicKey = localStorage.getItem('rawbin-device-publicKey') || '';
      this.send({ type: MSG.DEVICE_AUTH, devicePublicKey, signedChallenge });
    } catch {}
  }

  async signChallenge(challenge: string): Promise<string | null> {
    const pemPrivateKey = localStorage.getItem('rawbin-device-privateKey');
    if (!pemPrivateKey) return null;
    const pemBody = pemPrivateKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
    const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
    );
    const challengeBytes = new Uint8Array(challenge.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, challengeBytes);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
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
