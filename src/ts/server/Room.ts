import { WebSocket } from 'ws';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface RoomMember {
  id: string;
  ws: WebSocket;
  name: string;
  avatarUrl: string;
  playerToken: string;
  disconnected: boolean;
}

export type RoomState = 'active' | 'archived';

export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  hostConnected: boolean;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  state: RoomState;
  createdAt: number;
}

const MSG = {
  MEMBER_JOINED: 'MEMBER_JOINED',
  MEMBER_LEFT: 'MEMBER_LEFT',
  MEMBER_DISCONNECTED: 'MEMBER_DISCONNECTED',
  HOST_CHANGED: 'HOST_CHANGED',
  ROOM_JOINED: 'ROOM_JOINED',
  CHAT_HISTORY: 'CHAT_HISTORY',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  SPECTATOR_JOINED: 'SPECTATOR_JOINED',
  SPECTATOR_LEFT: 'SPECTATOR_LEFT',
  SPECTATE_JOINED: 'SPECTATE_JOINED',
  ROOM_ARCHIVED: 'ROOM_ARCHIVED',
} as const;

export { MSG };

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface RoomOpts {
  maxMembers?: number;
  isPrivate?: boolean;
  roomKey?: string;
  id?: string;
}

interface PersistedRoom {
  id: string;
  name: string;
  hostId: string;
  maxMembers: number;
  isPrivate: boolean;
  roomKey: string;
  state: RoomState;
  createdAt: number;
  creatorId: string;
  chatHistory: ChatMessage[];
  memberCount: number;
}

export class Room {
  id: string;
  name: string;
  hostId: string;
  maxMembers: number;
  isPrivate: boolean;
  roomKey: string;
  state: RoomState = 'active';
  createdAt: number = Date.now();

  members: Map<string, RoomMember> = new Map();
  spectators: Map<string, RoomMember> = new Map();
  private _chatHistory: ChatMessage[] = [];
  private creatorId: string = '';
  private persistDir: string | null = null;
  private cleanupCallback: (() => void) | null = null;

  constructor(name: string, creator: RoomMember, opts?: RoomOpts) {
    this.id = opts?.id || crypto.randomUUID().slice(0, 8);
    this.name = name;
    this.maxMembers = opts?.maxMembers || 10;
    this.isPrivate = opts?.isPrivate || false;
    this.roomKey = opts?.roomKey || '';
    this.hostId = creator.id;
    this.creatorId = creator.id;
    this.members.set(creator.id, { ...creator, disconnected: false });
  }

  setCreator(memberId: string): void {
    this.hostId = memberId;
    this.creatorId = memberId;
    this.persist();
  }

  setCleanupCallback(cb: () => void): void {
    this.cleanupCallback = cb;
  }

  setPersistDir(dir: string): void {
    this.persistDir = dir;
  }

  getCreatorId(): string {
    return this.creatorId;
  }

  // --- Members ---

  addMember(member: RoomMember): boolean {
    if (this.members.size >= this.maxMembers) return false;
    if (this.state !== 'active') return false;
    this.members.set(member.id, { ...member, disconnected: false });
    this.broadcast({ type: MSG.MEMBER_JOINED, member: this.memberInfo(member.id), memberCount: this.members.size });
    this.sendTo(member.id, { type: MSG.ROOM_JOINED, room: this.info(), members: this.allMemberInfo() });
    if (this._chatHistory.length > 0) {
      this.sendTo(member.id, { type: MSG.CHAT_HISTORY, messages: this._chatHistory });
    }
    this.persist();
    return true;
  }

  removeMember(id: string): void {
    this.members.delete(id);
    this.broadcast({ type: MSG.MEMBER_LEFT, memberId: id, memberCount: this.members.size });
    if (id === this.hostId && this.members.size > 0) {
      const next = [...this.members.values()].find(m => !m.disconnected);
      this.hostId = next?.id || this.members.keys().next().value!;
      this.broadcast({ type: MSG.HOST_CHANGED, hostId: this.hostId });
    }
    this.persist();
  }

  markDisconnected(id: string): void {
    const member = this.members.get(id);
    if (member) {
      member.disconnected = true;
      this.broadcast({ type: MSG.MEMBER_DISCONNECTED, memberId: id });
    }
  }

  // --- Spectators ---

  addSpectator(member: RoomMember): void {
    this.spectators.set(member.id, member);
    this.sendToSpectator(member.id, {
      type: MSG.SPECTATE_JOINED,
      room: this.info(),
      members: this.allMemberInfo(),
    });
    this.broadcastAll({ type: MSG.SPECTATOR_JOINED, name: member.name, spectatorCount: this.spectators.size });
    if (this._chatHistory.length > 0) {
      this.sendToSpectator(member.id, { type: MSG.CHAT_HISTORY, messages: this._chatHistory });
    }
  }

  removeSpectator(id: string): void {
    const spec = this.spectators.get(id);
    this.spectators.delete(id);
    if (spec) this.broadcastAll({ type: MSG.SPECTATOR_LEFT, spectatorCount: this.spectators.size });
  }

  promoteSpectator(spectatorId: string): boolean {
    const spec = this.spectators.get(spectatorId);
    if (!spec || this.state !== 'active') return false;
    if (this.members.size >= this.maxMembers) return false;
    this.spectators.delete(spectatorId);
    return this.addMember(spec);
  }

  // --- Chat ---

  addChat(senderId: string, senderName: string, text: string): void {
    const msg: ChatMessage = { senderId, senderName, text, timestamp: Date.now() };
    this._chatHistory.push(msg);
    if (this._chatHistory.length > 100) this._chatHistory = this._chatHistory.slice(-100);
    this.broadcastAll({ type: MSG.CHAT_MESSAGE, ...msg });
  }

  getChatHistory(): ChatMessage[] {
    return [...this._chatHistory];
  }

  // --- Archive ---

  archive(): void {
    this.state = 'archived';
    this.broadcastAll({ type: MSG.ROOM_ARCHIVED, roomId: this.id });
    this.persist();
  }

  // --- Info ---

  info(): RoomInfo & { spectatorCount: number; creatorId: string } {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      hostConnected: this.members.has(this.hostId),
      memberCount: this.members.size,
      maxMembers: this.maxMembers,
      isPrivate: this.isPrivate,
      state: this.state,
      createdAt: this.createdAt,
      spectatorCount: this.spectators.size,
      creatorId: this.creatorId,
    };
  }

  private memberInfo(id: string) {
    const m = this.members.get(id);
    if (!m) return null;
    return { id: m.id, name: m.name, avatarUrl: m.avatarUrl, playerToken: m.playerToken };
  }

  private allMemberInfo() {
    return [...this.members.values()].map(m => ({
      id: m.id, name: m.name, avatarUrl: m.avatarUrl, playerToken: m.playerToken,
    }));
  }

  // --- Broadcast ---

  broadcast(msg: object, excludeId?: string): void {
    const data = JSON.stringify(msg);
    this.members.forEach(m => {
      if (excludeId && m.id === excludeId) return;
      if (m.ws && m.ws.readyState === 1) m.ws.send(data);
    });
    this.spectators.forEach(s => {
      if (excludeId && s.id === excludeId) return;
      if (s.ws && s.ws.readyState === 1) s.ws.send(data);
    });
  }

  private broadcastAll(msg: object): void {
    this.broadcast(msg);
  }

  sendTo(memberId: string, msg: object): void {
    const m = this.members.get(memberId);
    if (m && m.ws && m.ws.readyState === 1) {
      m.ws.send(JSON.stringify(msg));
    }
  }

  private sendToSpectator(id: string, msg: object): void {
    const s = this.spectators.get(id);
    if (s && s.ws && s.ws.readyState === 1) {
      s.ws.send(JSON.stringify(msg));
    }
  }

  // --- Persistence ---

  private persist(): void {
    if (!this.persistDir) return;
    const data: PersistedRoom = {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      maxMembers: this.maxMembers,
      isPrivate: this.isPrivate,
      roomKey: this.roomKey,
      state: this.state,
      createdAt: this.createdAt,
      creatorId: this.creatorId,
      chatHistory: this._chatHistory,
      memberCount: this.members.size,
    };
    const filePath = path.join(this.persistDir, `${this.id}.json`);
    fs.mkdirSync(this.persistDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  removePersisted(): void {
    if (!this.persistDir) return;
    const filePath = path.join(this.persistDir, `${this.id}.json`);
    try { fs.unlinkSync(filePath); } catch {}
  }

  static fromPersisted(data: PersistedRoom, persistDir: string): Room {
    const placeholder: RoomMember = {
      id: data.hostId, ws: null as any, name: '', avatarUrl: '', playerToken: '', disconnected: true,
    };
    const room = new Room(data.name, placeholder, { maxMembers: data.maxMembers, isPrivate: data.isPrivate, roomKey: data.roomKey || '', id: data.id });
    room.state = data.state;
    room.createdAt = data.createdAt;
    room.creatorId = data.creatorId;
    room._chatHistory = data.chatHistory || [];
    room.persistDir = persistDir;
    return room;
  }
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private persistDir: string;

  constructor(persistDir: string = 'data/rooms') {
    this.persistDir = persistDir;
  }

  loadFromDisk(): number {
    if (!fs.existsSync(this.persistDir)) return 0;
    const files = fs.readdirSync(this.persistDir).filter(f => f.endsWith('.json'));
    let loaded = 0;
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(this.persistDir, file), 'utf-8');
        const data: PersistedRoom = JSON.parse(raw);
        const room = Room.fromPersisted(data, this.persistDir);
        room.setCleanupCallback(() => { this.removeRoom(room.id); });
        this.rooms.set(room.id, room);
        loaded++;
      } catch {}
    }
    return loaded;
  }

  createRoom(name: string, creator: RoomMember, opts?: RoomOpts): Room {
    const uniqueName = this.uniqueNameGenerate(name);
    const room = new Room(uniqueName, creator, opts);
    room.setPersistDir(this.persistDir);
    room.setCleanupCallback(() => { this.removeRoom(room.id); });
    this.rooms.set(room.id, room);
    room['persist']();
    return room;
  }

  private uniqueNameGenerate(name: string): string {
    const existing = new Set([...this.rooms.values()].map(r => r.name));
    if (!existing.has(name)) return name;
    let n = 2;
    while (existing.has(`${name} (${n})`)) n++;
    return `${name} (${n})`;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string, requesterId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    if (requesterId && requesterId !== room.getCreatorId()) return false;
    room.removePersisted();
    this.rooms.delete(roomId);
    return true;
  }

  listRooms(): RoomInfo[] {
    return [...this.rooms.values()]
      .filter(r => !r.isPrivate)
      .map(r => r.info());
  }

  findMemberRoom(memberId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.members.has(memberId)) return room;
    }
    return undefined;
  }

  findSpectatorRoom(spectatorId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.spectators.has(spectatorId)) return room;
    }
    return undefined;
  }

  cleanupStale(maxAgeMs: number = 10 * 60 * 1000): number {
    let removed = 0;
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      const age = now - room.createdAt;
      const aged = age >= maxAgeMs;
      const empty = room.members.size === 0 && room.spectators.size === 0;
      const archived = room.state === 'archived';
      if (aged || (empty && archived)) {
        this.removeRoom(id);
        removed++;
      }
    }
    return removed;
  }

  get size(): number {
    return this.rooms.size;
  }
}
