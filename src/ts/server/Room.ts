// [impl:uuid:9fbb1f6e-ad24-45ac-bc5d-148d622f0237] T3 Room class
import { WebSocket } from 'ws';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { writeRoomJson, getRoomPublicKey, type RoomJsonData } from './RoomKeys.js';
import { createMessageUnit } from '../scenario/message-unit.js';

export interface RoomMember {
  id: string;
  ws: WebSocket;
  name: string;
  avatarUrl: string;
  playerToken: string;
  disconnected: boolean;
}

export type RoomState = 'active' | 'archived';
// T-visibility R19.3: room visibility modes
export type RoomVisibility = 'public' | 'by-invite' | 'private';
// T-persistent R19.7 + T-default-flip R19.10: persistent is default after S19
export type RoomMode = 'live' | 'persistent';

export interface RoomInfo {
  id: string;
  name: string;
  hostId: string;
  hostConnected: boolean;
  memberCount: number;
  isPrivate: boolean;
  visibility: RoomVisibility;
  mode: RoomMode;
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
  isPrivate?: boolean;
  visibility?: RoomVisibility;
  mode?: RoomMode;
  roomKey?: string;
  id?: string;
  creatorToken?: string;
}

interface PersistedRoom {
  id: string;
  name: string;
  hostId: string;
  isPrivate: boolean;
  visibility: RoomVisibility;
  mode: RoomMode;
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
  isPrivate: boolean;
  visibility: RoomVisibility = 'public';
  mode: RoomMode = 'persistent';
  roomKey: string;
  state: RoomState = 'active';
  createdAt: number = Date.now();

  members: Map<string, RoomMember> = new Map();
  private _chatHistory: ChatMessage[] = [];
  private creatorId: string = '';
  creatorToken: string = '';
  private cleanupCallback: (() => void) | null = null;

  constructor(name: string, creator: RoomMember, opts?: RoomOpts) {
    this.id = opts?.id || crypto.randomUUID();
    this.name = name;
    this.isPrivate = opts?.isPrivate || false;
    this.visibility = opts?.visibility || (this.isPrivate ? 'private' : 'public');
    if (this.visibility === 'private') this.isPrivate = true;
  // [impl:uuid:4fed4fda-5fc1-4340-a976-a473d2366513] Room.init
    this.mode = opts?.mode || 'persistent';
    this.roomKey = opts?.roomKey || '';
    this.hostId = creator.id;
    this.creatorId = creator.id;
    this.creatorToken = opts?.creatorToken || '';
    this.members.set(creator.id, { ...creator, disconnected: false });
  }

  setCreator(memberId: string): void {
    this.hostId = memberId;
    this.creatorId = memberId;
    this.persist();
  }

  // T-visibility R19.3: switch visibility (PUBLIC/BY-INVITE/PRIVATE)
  // [impl:uuid:2d189279-0f36-4efc-8107-9862ae259dca] Room.visibilityCheck
  setVisibility(v: RoomVisibility): void {
    this.visibility = v;
    this.isPrivate = (v === 'private');
    this.persist();
  }

  // T-default-flip R19.10: switch lifecycle mode in the room editor
  setMode(m: RoomMode): void {
    this.mode = m;
    this.persist();
  }

  setCleanupCallback(cb: () => void): void {
    this.cleanupCallback = cb;
  }

  getCreatorId(): string {
    return this.creatorId;
  }

  // --- Members ---
// [impl:uuid:ea02fa6d-5116-4466-82ee-81866c81a164] Room.memberAdd

  // [impl:uuid:417918a5-b2c3-4d4e-9f5a-6b7c8d9e0f12] T-persistent-dedup R19.8.B
  addMember(member: RoomMember): boolean {
    if (this.state !== 'active') return false;
    const existing = member.playerToken ? [...this.members.values()].find(m => m.playerToken && m.playerToken === member.playerToken) : undefined;
    if (existing) {
      if (!existing.disconnected) return false;
      this.members.delete(existing.id);
      this.members.set(member.id, { ...member, disconnected: false });
      this.broadcast({ type: MSG.MEMBER_RECONNECTED, member: this.memberInfo(member.id), oldMemberId: existing.id, memberCount: this.members.size });
      this.sendTo(member.id, { type: MSG.ROOM_JOINED, room: this.info(), members: this.allMemberInfo() });
      if (this._chatHistory.length > 0) {
        this.sendTo(member.id, { type: MSG.CHAT_HISTORY, messages: this._chatHistory });
      }
      this.persist();
      return true;
    }
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
  // [impl:uuid:f82d09a5-fd35-4019-afd4-d2848c88267c] Room.retainOrPrune
  }

  // [impl:uuid:67b2763e-1a2b-4c3d-8e4f-5a6b7c8d9e01] T-persistent-retention
  markDisconnected(id: string): void {
    const member = this.members.get(id);
    if (member) {
      member.disconnected = true;
      this.broadcast({ type: MSG.MEMBER_DISCONNECTED, memberId: id });
      this.persist();
    }
  }

  // --- Chat ---

  lastMessageIor: string | null = null;
  firstMessageIor: string | null = null;
  messageCount: number = 0;

  addChat(senderId: string, senderName: string, text: string, scenarioIdx?: any): void {
    const msg: ChatMessage = { senderId, senderName, text, timestamp: Date.now() };
    this._chatHistory.push(msg);
    if (this._chatHistory.length > 100) this._chatHistory = this._chatHistory.slice(-100);
    this.broadcastAll({ type: MSG.CHAT_MESSAGE, ...msg });
    if (scenarioIdx) {
      try {
        const member = this.members.get(senderId);
        const token = member?.playerToken || senderId;
        const unit = createMessageUnit(scenarioIdx, { text, senderToken: token, senderName, roomUuid: this.id, kind: 'chat' }, this.lastMessageIor);
        const uuid = (unit.model as any).uuid;
        if (!this.firstMessageIor) this.firstMessageIor = `ior:instance:${uuid}`;
        this.lastMessageIor = `ior:instance:${uuid}`;
        this.messageCount++;
      } catch (e: any) { console.error(`[Room.addChat] createMessageUnit FAILED: ${e?.message}\n${e?.stack || ''}`); }
    }
    this.persist();
  }

  getChatHistory(): ChatMessage[] {
    return [...this._chatHistory];
  }

  loadChatHistory(messages: ChatMessage[]): void {
    this._chatHistory = messages.slice(-100);
  }

  // --- Archive ---

  archive(): void {
    this.state = 'archived';
    this.broadcastAll({ type: MSG.ROOM_ARCHIVED, roomId: this.id });
    this.persist();
  }

  // --- Info ---

  info(): RoomInfo & { creatorId: string; ownerToken: string } {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      hostConnected: this.members.has(this.hostId),
      memberCount: this.members.size,
      isPrivate: this.isPrivate,
      visibility: this.visibility,
      mode: this.mode,
      state: this.state,
      createdAt: this.createdAt,
      creatorId: this.creatorId,
      ownerToken: this.creatorToken,
    };
  }

  // [impl:uuid:9a25adbd-b1c2-4d3e-8f4a-5b6c7d8e9f00] R19.8.A member disconnected field
  private memberInfo(id: string) {
    const m = this.members.get(id);
    if (!m) return null;
    return { id: m.id, name: m.name, avatarUrl: m.avatarUrl, playerToken: m.playerToken, disconnected: !!m.disconnected };
  }

  private allMemberInfo() {
    return [...this.members.values()].map(m => ({
      id: m.id, name: m.name, avatarUrl: m.avatarUrl, playerToken: m.playerToken, disconnected: !!m.disconnected,
    }));
  }

  // --- Broadcast ---

  broadcast(msg: object, excludeId?: string): void {
    const data = JSON.stringify(msg);
    this.members.forEach(m => {
      if (excludeId && m.id === excludeId) return;
      if (m.ws && m.ws.readyState === 1) m.ws.send(data);
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

  // --- Persistence ---

  private persist(): void {
    // T99: legacy data/rooms write REMOVED — rooms persist ONLY to the per-user/UUID dir.
    if (this.creatorToken) {
      try {
        const pubKey = getRoomPublicKey(this.creatorToken, this.id) || '';
        const chatLen = this._chatHistory.length;
        if (chatLen > 0) console.log(`[Room.persist] ${this.id.slice(0,8)} chatHistory=${chatLen}`);
        writeRoomJson(this.creatorToken, this.id, {
          id: this.id, name: this.name, ownerToken: this.creatorToken,
          isPrivate: this.isPrivate, visibility: this.visibility, mode: this.mode, roomKey: this.roomKey,
          state: this.state, createdAt: this.createdAt, sshKeysGenerated: !!pubKey,
          sshPublicKey: pubKey, chatHistory: this._chatHistory,
  // [impl:uuid:d5f0c2b4-a09e-4f80-aaf9-fa386aa57e46] Room.persistMembers R19.35
          members: [...this.members.values()].map(m => ({ ior: `ior:instance:${m.playerToken}`, name: m.name, role: m.playerToken === this.creatorToken ? 'owner' : 'member', status: m.disconnected ? 'offline' : 'online', joinedAt: Date.now() })),
          lastMessageIor: this.lastMessageIor, firstMessageIor: this.firstMessageIor, messageCount: this.messageCount,
        });
      } catch {}
    }
  }

}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  // T99: legacy data/rooms load/store fully removed. Per-user/UUID dirs are the sole source.
  // (constructor takes an optional legacy arg for call-site compatibility; it is ignored.)
  constructor(_legacyPersistDir?: string) { /* no legacy persist dir */ }

  createRoom(name: string, creator: RoomMember, opts?: RoomOpts): Room {
    const uniqueName = this.uniqueNameGenerate(name);
    const room = new Room(uniqueName, creator, opts);
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
    // T99: no legacy file to remove; per-user room dir deletion is handled by the server
    // DELETE_ROOM handler (deleteRoomHome). RoomManager only drops the in-memory entry.
    this.rooms.delete(roomId);
    return true;
  }

  listRooms(connectedOwners?: Set<string>): RoomInfo[] {
    return [...this.rooms.values()]
      .filter(r => {
        if (r.isPrivate) return false;
        if (!r.creatorToken) return true;
        if (r.mode === 'persistent') return true;
        if (r.members.size > 0) return true;
        return connectedOwners ? connectedOwners.has(r.creatorToken) : false;
      })
      .map(r => r.info());
  }

  listRoomsForOwner(ownerToken: string): RoomInfo[] {
    return [...this.rooms.values()]
      .filter(r => r.creatorToken === ownerToken)
      .map(r => r.info());
  }

  findMemberRoom(memberId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.members.has(memberId)) return room;
    }
    return undefined;
  }

  cleanupStale(maxAgeMs: number = 10 * 60 * 1000): number {
    let removed = 0;
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (room.creatorToken) continue;
      const age = now - room.createdAt;
      const aged = age >= maxAgeMs;
      const empty = room.members.size === 0;
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
