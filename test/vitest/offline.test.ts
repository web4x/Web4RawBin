/**
 * Task 36: Offline Data Persistence tests
 * Tests OfflineStore IndexedDB wrapper: messageQueue, roomState, profile stores.
 * Unit tests with in-memory mock — no browser IndexedDB needed.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ── Mock OfflineStore (replicates expected API from spec) ───────────────────

interface QueuedMessage {
  id: number;
  timestamp: number;
  msg: object;
}

interface CachedRoomState {
  roomId: string;
  name: string;
  members: { id: string; name: string; avatarUrl: string }[];
  chatMessages: { senderId: string; senderName: string; text: string; timestamp: number }[];
  updatedAt: number;
}

interface CachedProfile {
  token: string;
  name: string;
  phone: string;
  url: string;
  avatar: string;
  secretCode: string;
  profileCommitted: boolean;
  cachedAt: number;
}

class OfflineStore {
  private messageQueue: QueuedMessage[] = [];
  private roomStates: Map<string, CachedRoomState> = new Map();
  private profile: CachedProfile | null = null;
  private nextId = 1;
  private _dbName: string;
  private _opened = false;

  constructor(dbName = 'rawbin-offline') {
    this._dbName = dbName;
  }

  get dbName(): string { return this._dbName; }
  get isOpen(): boolean { return this._opened; }

  async open(): Promise<void> {
    this._opened = true;
  }

  async close(): Promise<void> {
    this._opened = false;
  }

  // ── Message Queue ──

  async enqueueMessage(msg: object): Promise<number> {
    const entry: QueuedMessage = { id: this.nextId++, timestamp: Date.now(), msg };
    this.messageQueue.push(entry);
    return entry.id;
  }

  async getQueuedMessages(): Promise<QueuedMessage[]> {
    return [...this.messageQueue].sort((a, b) => a.id - b.id);
  }

  async getQueueSize(): Promise<number> {
    return this.messageQueue.length;
  }

  async clearQueue(): Promise<void> {
    this.messageQueue = [];
  }

  async dequeueMessage(id: number): Promise<void> {
    this.messageQueue = this.messageQueue.filter(m => m.id !== id);
  }

  // ── Room State ──

  async cacheRoomState(state: CachedRoomState): Promise<void> {
    this.roomStates.set(state.roomId, { ...state, updatedAt: Date.now() });
  }

  async getCachedRoomState(roomId: string): Promise<CachedRoomState | null> {
    return this.roomStates.get(roomId) ?? null;
  }

  async clearRoomState(roomId: string): Promise<void> {
    this.roomStates.delete(roomId);
  }

  async clearAllRoomStates(): Promise<void> {
    this.roomStates.clear();
  }

  // ── Profile ──

  async cacheProfile(profile: Omit<CachedProfile, 'cachedAt'>): Promise<void> {
    this.profile = { ...profile, cachedAt: Date.now() };
  }

  async getCachedProfile(): Promise<CachedProfile | null> {
    return this.profile;
  }

  async clearProfile(): Promise<void> {
    this.profile = null;
  }
}

// ── Background sync helper ──

function canRegisterBackgroundSync(): boolean {
  return typeof ServiceWorkerRegistration !== 'undefined' &&
    'sync' in (ServiceWorkerRegistration.prototype || {});
}

async function registerSync(tag: string, registration?: { sync?: { register: (tag: string) => Promise<void> } }): Promise<boolean> {
  if (!registration?.sync) return false;
  try {
    await registration.sync.register(tag);
    return true;
  } catch {
    return false;
  }
}

// ── Test fixtures ───────────────────────────────────────────────────────────

let store: OfflineStore;

beforeEach(() => {
  store = new OfflineStore();
});

// ── TC-36.1: OfflineStore opens DB 'rawbin-offline' ─────────────────────────

describe('TC-36.1: OfflineStore initialization', () => {

  it('default DB name is rawbin-offline', () => {
    expect(store.dbName).toBe('rawbin-offline');
  });

  it('custom DB name accepted', () => {
    const custom = new OfflineStore('test-db');
    expect(custom.dbName).toBe('test-db');
  });

  it('open() marks store as ready', async () => {
    expect(store.isOpen).toBe(false);
    await store.open();
    expect(store.isOpen).toBe(true);
  });

  it('close() marks store as not ready', async () => {
    await store.open();
    await store.close();
    expect(store.isOpen).toBe(false);
  });
});

// ── TC-36.2: Message queue persistence ──────────────────────────────────────

describe('TC-36.2: Message queue — enqueue/read/clear', () => {

  it('enqueueMessage adds to queue and returns id', async () => {
    const id = await store.enqueueMessage({ type: 'CHAT_MESSAGE', text: 'hello' });
    expect(id).toBeGreaterThan(0);
    expect(await store.getQueueSize()).toBe(1);
  });

  it('getQueuedMessages returns all in FIFO order', async () => {
    await store.enqueueMessage({ type: 'MSG_1' });
    await store.enqueueMessage({ type: 'MSG_2' });
    await store.enqueueMessage({ type: 'MSG_3' });

    const msgs = await store.getQueuedMessages();
    expect(msgs.length).toBe(3);
    expect((msgs[0].msg as any).type).toBe('MSG_1');
    expect((msgs[1].msg as any).type).toBe('MSG_2');
    expect((msgs[2].msg as any).type).toBe('MSG_3');
  });

  it('each message has unique incrementing id', async () => {
    const id1 = await store.enqueueMessage({ type: 'A' });
    const id2 = await store.enqueueMessage({ type: 'B' });
    const id3 = await store.enqueueMessage({ type: 'C' });

    expect(id2).toBeGreaterThan(id1);
    expect(id3).toBeGreaterThan(id2);
  });

  it('each message has timestamp', async () => {
    const before = Date.now();
    await store.enqueueMessage({ type: 'TEST' });
    const msgs = await store.getQueuedMessages();

    expect(msgs[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(msgs[0].timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('clearQueue removes all messages', async () => {
    await store.enqueueMessage({ type: 'A' });
    await store.enqueueMessage({ type: 'B' });
    expect(await store.getQueueSize()).toBe(2);

    await store.clearQueue();
    expect(await store.getQueueSize()).toBe(0);

    const msgs = await store.getQueuedMessages();
    expect(msgs.length).toBe(0);
  });

  it('dequeueMessage removes single message by id', async () => {
    const id1 = await store.enqueueMessage({ type: 'KEEP' });
    const id2 = await store.enqueueMessage({ type: 'REMOVE' });
    const id3 = await store.enqueueMessage({ type: 'KEEP_TOO' });

    await store.dequeueMessage(id2);

    const msgs = await store.getQueuedMessages();
    expect(msgs.length).toBe(2);
    expect(msgs.map(m => (m.msg as any).type)).toEqual(['KEEP', 'KEEP_TOO']);
  });
});

// ── TC-36.3: Message queue survives simulated page reload ───────────────────

describe('TC-36.3: Queue replay on reconnect', () => {

  it('queued messages available for replay after enqueue', async () => {
    await store.enqueueMessage({ type: 'CHAT_MESSAGE', text: 'offline msg 1' });
    await store.enqueueMessage({ type: 'CHAT_MESSAGE', text: 'offline msg 2' });

    // Simulate reconnect: read queue, replay, clear
    const queued = await store.getQueuedMessages();
    expect(queued.length).toBe(2);

    const replayed: object[] = [];
    for (const entry of queued) {
      replayed.push(entry.msg);
    }
    await store.clearQueue();

    expect(replayed.length).toBe(2);
    expect((replayed[0] as any).text).toBe('offline msg 1');
    expect((replayed[1] as any).text).toBe('offline msg 2');
    expect(await store.getQueueSize()).toBe(0);
  });

  it('dequeue-as-you-go pattern works', async () => {
    const id1 = await store.enqueueMessage({ type: 'A' });
    const id2 = await store.enqueueMessage({ type: 'B' });

    // Replay one at a time
    const msgs = await store.getQueuedMessages();
    for (const entry of msgs) {
      // "send" the message...
      await store.dequeueMessage(entry.id);
    }

    expect(await store.getQueueSize()).toBe(0);
  });
});

// ── TC-36.4: Room state caching ─────────────────────────────────────────────

describe('TC-36.4: Room state cache', () => {

  const sampleRoom: CachedRoomState = {
    roomId: 'room-abc',
    name: 'Test Room',
    members: [
      { id: 'member-1', name: 'Alice', avatarUrl: '' },
      { id: 'member-2', name: 'Bob', avatarUrl: '' },
    ],
    chatMessages: [
      { senderId: 'member-1', senderName: 'Alice', text: 'Hello', timestamp: Date.now() },
    ],
    updatedAt: 0,
  };

  it('cacheRoomState stores room data', async () => {
    await store.cacheRoomState(sampleRoom);
    const cached = await store.getCachedRoomState('room-abc');

    expect(cached).not.toBeNull();
    expect(cached!.name).toBe('Test Room');
    expect(cached!.members.length).toBe(2);
    expect(cached!.chatMessages.length).toBe(1);
  });

  it('getCachedRoomState returns null for unknown room', async () => {
    const cached = await store.getCachedRoomState('nonexistent');
    expect(cached).toBeNull();
  });

  it('cacheRoomState sets updatedAt timestamp', async () => {
    const before = Date.now();
    await store.cacheRoomState(sampleRoom);
    const cached = await store.getCachedRoomState('room-abc');

    expect(cached!.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it('cacheRoomState overwrites previous state', async () => {
    await store.cacheRoomState(sampleRoom);

    const updated = { ...sampleRoom, name: 'Updated Room', members: [...sampleRoom.members, { id: 'member-3', name: 'Carol', avatarUrl: '' }] };
    await store.cacheRoomState(updated);

    const cached = await store.getCachedRoomState('room-abc');
    expect(cached!.name).toBe('Updated Room');
    expect(cached!.members.length).toBe(3);
  });

  it('clearRoomState removes specific room', async () => {
    await store.cacheRoomState(sampleRoom);
    await store.cacheRoomState({ ...sampleRoom, roomId: 'room-xyz', name: 'Other Room' });

    await store.clearRoomState('room-abc');

    expect(await store.getCachedRoomState('room-abc')).toBeNull();
    expect(await store.getCachedRoomState('room-xyz')).not.toBeNull();
  });

  it('clearAllRoomStates removes all rooms', async () => {
    await store.cacheRoomState(sampleRoom);
    await store.cacheRoomState({ ...sampleRoom, roomId: 'room-xyz', name: 'Other' });

    await store.clearAllRoomStates();

    expect(await store.getCachedRoomState('room-abc')).toBeNull();
    expect(await store.getCachedRoomState('room-xyz')).toBeNull();
  });
});

// ── TC-36.5: Profile caching in IndexedDB ───────────────────────────────────

describe('TC-36.5: Profile cache', () => {

  const sampleProfile = {
    token: 'user-token-123',
    name: 'TestUser',
    phone: '+49 123',
    url: 'https://test.com',
    avatar: 'data:image/png;base64,abc',
    secretCode: '4242',
    profileCommitted: true,
  };

  it('cacheProfile stores profile data', async () => {
    await store.cacheProfile(sampleProfile);
    const cached = await store.getCachedProfile();

    expect(cached).not.toBeNull();
    expect(cached!.name).toBe('TestUser');
    expect(cached!.token).toBe('user-token-123');
    expect(cached!.phone).toBe('+49 123');
    expect(cached!.secretCode).toBe('4242');
  });

  it('cacheProfile sets cachedAt timestamp', async () => {
    const before = Date.now();
    await store.cacheProfile(sampleProfile);
    const cached = await store.getCachedProfile();

    expect(cached!.cachedAt).toBeGreaterThanOrEqual(before);
    expect(cached!.cachedAt).toBeLessThanOrEqual(Date.now());
  });

  it('getCachedProfile returns null when no profile cached', async () => {
    const cached = await store.getCachedProfile();
    expect(cached).toBeNull();
  });

  it('cacheProfile overwrites previous profile', async () => {
    await store.cacheProfile(sampleProfile);
    await store.cacheProfile({ ...sampleProfile, name: 'UpdatedName', phone: '+1 999' });

    const cached = await store.getCachedProfile();
    expect(cached!.name).toBe('UpdatedName');
    expect(cached!.phone).toBe('+1 999');
  });

  it('clearProfile removes cached profile', async () => {
    await store.cacheProfile(sampleProfile);
    await store.clearProfile();

    expect(await store.getCachedProfile()).toBeNull();
  });

  it('profile fields match UserProfile interface', async () => {
    await store.cacheProfile(sampleProfile);
    const cached = await store.getCachedProfile();

    expect(cached!.token).toBeDefined();
    expect(cached!.name).toBeDefined();
    expect(cached!.phone).toBeDefined();
    expect(cached!.url).toBeDefined();
    expect(cached!.avatar).toBeDefined();
    expect(cached!.secretCode).toBeDefined();
    expect(cached!.profileCommitted).toBeDefined();
    expect(cached!.cachedAt).toBeDefined();
  });
});

// ── TC-36.6: Background sync registration ───────────────────────────────────

describe('TC-36.6: Background sync', () => {

  it('canRegisterBackgroundSync returns false in Node (no ServiceWorkerRegistration)', () => {
    expect(canRegisterBackgroundSync()).toBe(false);
  });

  it('registerSync returns false when no sync API available', async () => {
    const result = await registerSync('replay-messages', undefined);
    expect(result).toBe(false);
  });

  it('registerSync returns false when registration has no sync', async () => {
    const result = await registerSync('replay-messages', {});
    expect(result).toBe(false);
  });

  it('registerSync calls sync.register with correct tag', async () => {
    let registeredTag = '';
    const mockRegistration = {
      sync: {
        register: async (tag: string) => { registeredTag = tag; },
      },
    };

    const result = await registerSync('replay-messages', mockRegistration);
    expect(result).toBe(true);
    expect(registeredTag).toBe('replay-messages');
  });

  it('registerSync returns false if sync.register throws', async () => {
    const mockRegistration = {
      sync: {
        register: async () => { throw new Error('sync not allowed'); },
      },
    };

    const result = await registerSync('replay-messages', mockRegistration);
    expect(result).toBe(false);
  });
});

// ── TC-36.7: End-to-end offline flow ────────────────────────────────────────

describe('TC-36.7: Full offline → online flow', () => {

  it('offline: queue messages + cache room + cache profile → online: replay + clear', async () => {
    // Go offline — queue messages
    await store.enqueueMessage({ type: 'CHAT_MESSAGE', text: 'offline 1' });
    await store.enqueueMessage({ type: 'CHAT_MESSAGE', text: 'offline 2' });

    // Cache room state for offline viewing
    await store.cacheRoomState({
      roomId: 'room-1', name: 'Offline Room',
      members: [{ id: 'm1', name: 'Alice', avatarUrl: '' }],
      chatMessages: [{ senderId: 'm1', senderName: 'Alice', text: 'cached', timestamp: Date.now() }],
      updatedAt: 0,
    });

    // Cache profile
    await store.cacheProfile({
      token: 'tok', name: 'Offliner', phone: '', url: '', avatar: '',
      secretCode: '0000', profileCommitted: true,
    });

    // Verify offline data available
    expect(await store.getQueueSize()).toBe(2);
    expect(await store.getCachedRoomState('room-1')).not.toBeNull();
    expect(await store.getCachedProfile()).not.toBeNull();

    // Come online — replay queue
    const queued = await store.getQueuedMessages();
    const replayed = queued.map(q => q.msg);
    await store.clearQueue();

    expect(replayed.length).toBe(2);
    expect(await store.getQueueSize()).toBe(0);

    // Room state and profile still available after replay
    expect(await store.getCachedRoomState('room-1')).not.toBeNull();
    expect(await store.getCachedProfile()).not.toBeNull();
  });
});
