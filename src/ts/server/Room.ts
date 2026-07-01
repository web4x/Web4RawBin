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

  // Room.resolveToken — collapse consolidated (redirectTo) members to PRIMARY.
  // server.ts injects the profile redirect resolver at startup; default identity (no profiles in tests).
  // [impl:uuid:123c4c40-30b6-43c4-8d68-33f1d0bb566d] Room.resolveToken
  static resolveToken: (token: string) => string = (t) => t;
  // v0.7.1: does a token have ANY profile? Injected by server.ts (default true so profile-less tests keep members).
  // A persisted member with NO profile = an orphan from a deleted profile → dropped on load (self-heal).
  static profileExists: (token: string) => boolean = () => true;
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
    this.init(creator, opts);
  }

  // [impl:uuid:2ab8a3dd-4b6d-420c-bc1a-f3fac85ec9b7] Room.init
  private init(creator: RoomMember, opts?: RoomOpts & { persistedMembers?: any[]; persistedFiles?: string[]; chatHistory?: any[] }): void {
    this.mode = opts?.mode || 'persistent';
    this.roomKey = opts?.roomKey || '';
    this.hostId = creator.id;
    this.creatorId = creator.id;
    this.creatorToken = opts?.creatorToken || '';
    if (opts?.persistedMembers) {
      // v0.7.0 (a): collapse persisted members by RESOLVED identity — ≤1 entry per real person, not just
      // in one display path. Prefer the entry whose token IS the primary, else a connected one; re-key to primary.
      const byIdentity = new Map<string, { id: string; name: string; playerToken: string; disconnected: boolean }>();
      for (const pm of opts.persistedMembers) {
        const resolved = Room.resolveToken(pm.playerToken || '') || pm.playerToken || pm.id;
        const cur = byIdentity.get(resolved);
        const better = !cur || (pm.playerToken === resolved && cur.playerToken !== resolved) || (cur.disconnected && !(pm.disconnected ?? true));
        if (better) byIdentity.set(resolved, { id: pm.id, name: pm.name, playerToken: resolved, disconnected: pm.disconnected ?? true });
      }
      for (const m of byIdentity.values()) this.members.set(m.id, { id: m.id, ws: null as any, name: m.name, avatarUrl: '', playerToken: m.playerToken, disconnected: m.disconnected });
    }
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
// [impl:uuid:4246c0a8-cfbf-43cd-8677-3367f3ac21d9] Room.addMember

  addMember(member: RoomMember): boolean {
    if (this.state !== 'active') return false;
    if (this.rejoinDedup(member)) return true;
    this.members.set(member.id, { ...member, disconnected: false });
    this.broadcast({ type: MSG.MEMBER_JOINED, member: this.memberInfo(member.id), memberCount: this.dedupCount() });
    this.sendTo(member.id, { type: MSG.ROOM_JOINED, room: this.info(), members: this.allMemberInfo() });
    if (this._chatHistory.length > 0) {
      this.sendTo(member.id, { type: MSG.CHAT_HISTORY, messages: this._chatHistory });
    }
    this.persist();
    return true;
  }

  // v0.7.0 (d): deduped member count — one per RESOLVED identity (never the raw map size).
  private dedupCount(): number { return this.allMemberInfo().length; }

  // v0.7.0 (b): evict an absorbed (tombstoned) token from this room's LIVE members — drop it if the primary
  // is already present, else re-key it to the primary (preserve presence). Broadcasts the corrected count.
  collapseAbsorbedMember(absorbedToken: string, primaryToken: string): boolean {
    const hasPrimary = [...this.members.values()].some(m => m.playerToken === primaryToken);
    let changed = false;
    for (const [id, m] of [...this.members.entries()]) {
      if (m.playerToken !== absorbedToken) continue;
      if (hasPrimary) this.members.delete(id); else m.playerToken = primaryToken;
      changed = true;
    }
    if (changed) { this.broadcast({ type: MSG.MEMBER_LEFT, memberId: absorbedToken, memberCount: this.dedupCount() }); this.persist(); }
    return changed;
  }

  // [impl:uuid:4c8a91a5-35af-48b1-a2e9-4bbd9f18bc10] Room.rejoinDedup
  private rejoinDedup(member: RoomMember): boolean {
    // v0.7.0 (d): idempotent by RESOLVED identity — a tombstoned/re-keyed token collapses onto its primary
    // instead of inserting a second member entry.
    const rtok = Room.resolveToken(member.playerToken || '') || member.playerToken;
    const existing = member.playerToken ? [...this.members.values()].find(m => m.playerToken && Room.resolveToken(m.playerToken) === rtok) : undefined;
    if (!existing) return false;
    if (existing.ws && existing.ws.readyState === 1) { try { existing.ws.close(); } catch {} }
    this.members.delete(existing.id);
    this.members.set(member.id, { ...member, playerToken: rtok, disconnected: false });
    this.broadcast({ type: MSG.MEMBER_RECONNECTED, member: this.memberInfo(member.id), oldMemberId: existing.id, memberCount: this.dedupCount() });
    this.sendTo(member.id, { type: MSG.ROOM_JOINED, room: this.info(), members: this.allMemberInfo() });
    if (this._chatHistory.length > 0) {
      this.sendTo(member.id, { type: MSG.CHAT_HISTORY, messages: this._chatHistory });
    }
    this.persist();
    return true;
  }

  removeMember(id: string): void {
    this.members.delete(id);
    this.broadcast({ type: MSG.MEMBER_LEFT, memberId: id, memberCount: this.dedupCount() });
    if (id === this.hostId && this.members.size > 0) {
      const next = [...this.members.values()].find(m => !m.disconnected);
      this.hostId = next?.id || this.members.keys().next().value!;
      this.broadcast({ type: MSG.HOST_CHANGED, hostId: this.hostId });
    }
    this.persist();
  }

  // [impl:uuid:4c21d2ee-ff20-4511-9f0e-d786f9bb90d7] Room.retainOrPrune
  retainOrPrune(memberId: string): void {
    if (this.mode === 'persistent') {
      this.markDisconnected(memberId);
    } else {
      this.removeMember(memberId);
    }
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
      memberCount: this.dedupCount(),
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
    // expose the PRIMARY token so badges/Link-Account never carry a consolidated tombstone token
    return { id: m.id, name: m.name, avatarUrl: m.avatarUrl, playerToken: m.playerToken ? Room.resolveToken(m.playerToken) : m.playerToken, disconnected: !!m.disconnected };
  }

  private allMemberInfo() {
    // collapse members whose token redirects to the same PRIMARY (consolidated identities show once)
    const byPrimary = new Map<string, RoomMember>();
    for (const m of this.members.values()) {
      // v0.7.1 (R25.7): hide a DISCONNECTED orphan — a member whose token has no profile (deleted in a
      // purge) with no live connection. It's a ghost; skipping it (not deleting) is safe — a connected or
      // profiled member is always shown. This is what resolveToken alone couldn't collapse (no profile → no redirect).
      if (m.disconnected && m.playerToken && !Room.profileExists(m.playerToken)) continue;
      const key = m.playerToken ? Room.resolveToken(m.playerToken) : m.id;
      const existing = byPrimary.get(key);
      if (!existing || (existing.disconnected && !m.disconnected)) byPrimary.set(key, m); // prefer a connected representative
    }
    return [...byPrimary.values()].map(m => ({
      id: m.id, name: m.name, avatarUrl: m.avatarUrl,
      playerToken: m.playerToken ? Room.resolveToken(m.playerToken) : m.playerToken,
      disconnected: !!m.disconnected,
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

  // R25.5/v0.6.98: loaded rooms that reference this file — for content auth when a file is shared into
  // several rooms, or its stored roomUuid points at a room that is no longer loaded.
  roomsWithFile(fileUuid: string): Room[] {
    return [...this.rooms.values()].filter(r => r.fileUnits.has(fileUuid));
  }

  // v0.7.0 (b): all loaded rooms — for consolidation to evict an absorbed token everywhere.
  allRooms(): Room[] { return [...this.rooms.values()]; }

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
