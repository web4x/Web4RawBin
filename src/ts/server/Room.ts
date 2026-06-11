// [impl:uuid:9fbb1f6e-ad24-45ac-bc5d-148d622f0237] T3 Room class
// [impl:uuid:9eac03a9-108a-4a85-b280-04fe9de6455f] Room.validateScenarioShape
// [impl:uuid:5811824c-0bb1-4db4-98de-f419d915236e] Room.acceptApply
// [impl:uuid:9c94958d-d754-4e80-adf4-ad36ea67caab] Room.backfillFiles
// [impl:uuid:a6e5e49d-520f-4a80-9e51-1d8001e4bccb] Room.persistAsSymlink
// [impl:uuid:b309d0dd-22a3-4f5f-ba6f-0f29d1502cf3] Room.stripSpectator
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
  persistedMembers?: { id: string; name: string; playerToken: string; disconnected: boolean }[];
  persistedFiles?: string[];
  chatHistory?: { senderId: string; senderName: string; text: string; timestamp: number }[];
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
  fileUnits: Set<string> = new Set();
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
  // [impl:uuid:2ab8a3dd-4b6d-420c-bc1a-f3fac85ec9b7] Room.init
    this.mode = opts?.mode || 'persistent';
    this.roomKey = opts?.roomKey || '';
    this.hostId = creator.id;
    this.creatorId = creator.id;
    this.creatorToken = opts?.creatorToken || '';
    // Load persisted members/files/chat BEFORE first persist (prevents wipe)
    if (opts?.persistedMembers) {
      for (const pm of opts.persistedMembers) {
        this.members.set(pm.id, { id: pm.id, ws: null as any, name: pm.name, avatarUrl: '', playerToken: pm.playerToken, disconnected: pm.disconnected ?? true });
      }
    }
// [impl:uuid:c7230aa0-9e5a-428d-a8d8-6bb3877cee55] impl:Room.visibilityCheck (split for Room.canonicalDir)
// [impl:uuid:1cef1fa1-7597-40f6-92ae-f8c2dfa83ad1] impl:Room.visibilityCheck (split for Room.visibilityCheck)
// [impl:uuid:7c33815f-9bc9-4188-bd0b-0f66ea9225f3] impl:Room.visibilityCheck (split for Room.multiRoomLoad)
    if (opts?.persistedFiles) {
      for (const fuuid of opts.persistedFiles) this.fileUnits.add(fuuid);
    }
    if (opts?.chatHistory) this.loadChatHistory(opts.chatHistory);
    this.members.set(creator.id, { ...creator, disconnected: false });
  }

  setCreator(memberId: string): void {
    this.hostId = memberId;
    this.creatorId = memberId;
    this.persist();
  }

  // T-visibility R19.3: switch visibility (PUBLIC/BY-INVITE/PRIVATE)
  // [impl:uuid:6acb7db1-3a5d-424f-8d23-921394440cf1] Room.visibilityCheck
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
// [impl:uuid:4246c0a8-cfbf-43cd-8677-3367f3ac21d9] Room.memberAdd

  // [impl:uuid:4c8a91a5-35af-48b1-a2e9-4bbd9f18bc10] T-persistent-dedup R19.8.B
  addMember(member: RoomMember): boolean {
    if (this.state !== 'active') return false;
    const existing = member.playerToken ? [...this.members.values()].find(m => m.playerToken && m.playerToken === member.playerToken) : undefined;
    if (existing) {
      if (!existing.disconnected && existing.ws && existing.ws.readyState === 1) return false;
      if (!existing.disconnected) existing.disconnected = true;
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
  // [impl:uuid:4c21d2ee-ff20-4511-9f0e-d786f9bb90d7] Room.retainOrPrune
  }

  // [impl:uuid:35ce5e4c-24c0-450e-905f-37eb9097c8e5] T-persistent-retention
  markDisconnected(id: string): void {
    const member = this.members.get(id);
    if (member) {
      member.disconnected = true;
      this.broadcast({ type: MSG.MEMBER_DISCONNECTED, memberId: id });
      this.persist();
    }
  }

  // --- Files ---

  addFileUnit(uuid: string): void {
    this.fileUnits.add(uuid);
    this.persist();
  }

  removeFileUnit(uuid: string): void {
    this.fileUnits.delete(uuid);
    this.persist();
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

  // [impl:uuid:35d07b43-0a94-452e-ada9-7b6d58178451] R19.8.A member disconnected field
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
          files: [...this.fileUnits].map(uuid => `ior:instance:${uuid}`),
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
