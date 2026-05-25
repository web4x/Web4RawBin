# Architecture: Room as Persistent SSH Identity

**Author:** robbin-architect
**Date:** 2026-05-25
**Input:** Tron directive — rooms become persistent SSH identities

## Diagram

| Diagram | Source | Description |
|---------|--------|-------------|
| [Class Diagram](./diagrams/class-diagram.svg) | [class-diagram.puml](./diagrams/class-diagram.puml) | Room, RoomKeys, PersistedRoom, filesystem layout, WS protocol changes |

## 1. Current State

### Room persistence today
- Rooms persist to `data/rooms/<id>.json` — a flat directory shared by all users
- Rooms are cleaned up after 10 minutes idle (`cleanupStale`)
- Room `creatorId` stores a WS client ID (connection-scoped), not a user token
- No SSH keys per room
- No permanent rooms — all rooms are ephemeral

### Room identity today
- Room has a short ID (8-char UUID slice)
- Room has no cryptographic identity
- Room membership is connection-based, not user-based

## 2. Target State

### Rooms are persistent SSH identities
- Each room gets a full UUID (not truncated)
- Each room gets its own `.ssh/` directory with RSA-2048 keypair (OOSH pattern)
- Rooms persist permanently under their creator's user directory
- Room deletion is manual-only (owner action), never automatic
- Room `creatorToken` is a user token (persistent), not a client ID (ephemeral)

## 3. Data Model Changes

### Room class (Room.ts)

| Field | Current | Sprint 9 |
|-------|---------|----------|
| `id` | `crypto.randomUUID().slice(0, 8)` | `crypto.randomUUID()` (full UUID) |
| `creatorId` | client ID (ephemeral) | renamed to `creatorToken` (user token, persistent) |
| `persistent` | N/A | `true` (always — no ephemeral rooms) |
| `sshKeysGenerated` | N/A | `boolean` — set after keypair created |
| `state` | `'active' \| 'archived'` | unchanged |

### PersistedRoom (room.json)

```typescript
interface PersistedRoom {
  id: string;              // full UUID
  name: string;            // defaults to "<UserName>'s Room"
  creatorToken: string;    // user token (persistent identity)
  maxMembers: number;
  isPrivate: boolean;
  roomKey: string;
  state: RoomState;
  createdAt: number;
  sshKeysGenerated: boolean;
  sshPublicKey: string;    // PEM public key for verification
  chatHistory: ChatMessage[];
}
```

### UserProfile extension

```typescript
interface UserProfile {
  // ...existing fields...
  ownedRooms: string[];    // array of room UUIDs owned by this user
}
```

## 4. Directory Structure

```
data/users/<token>/
├── profile.json
├── .ssh/                           # USER's SSH identity
│   ├── id_rsa
│   ├── id_rsa.pub
│   ├── public_keys/
│   ├── private_key/
│   └── authorized_keys
├── files/                          # encrypted files (avatar etc.)
│   ├── avatar.enc
│   └── avatar.meta.json
└── rooms/
    └── <room-uuid>/                # ROOM's SSH identity
        ├── room.json               # room metadata + chat history
        └── .ssh/
            ├── id_rsa              # room private key (RSA-2048)
            ├── id_rsa.pub          # room public key
            ├── public_keys/
            │   └── <room-uuid>.public_key
            ├── private_key/
            │   └── <room-uuid>.private_key
            └── authorized_keys     # authorized member keys
```

**Why under the creator's user dir?**
- Room belongs to the creator — deleting the user deletes their rooms
- Room's private key is protected by the same filesystem permissions as the user's keys
- No shared `data/rooms/` directory — rooms are fully owned by their creator
- The `data/rooms/` directory (current) becomes obsolete — replaced by per-user room dirs

## 5. Key Generation Flow

### On room creation (CREATE_ROOM handler)

```
1. User sends CREATE_ROOM { roomName, playerToken }
2. Server creates Room object with full UUID
3. Server sets room.creatorToken = playerToken
4. Server sets room.name = roomName || "<UserName>'s Room"
5. Server calls RoomKeys.createRoomHome(token, roomId)
   → mkdir data/users/<token>/rooms/<room-uuid>/
   → mkdir data/users/<token>/rooms/<room-uuid>/.ssh/
   → mkdir .ssh/public_keys/
   → mkdir .ssh/private_key/
   → touch .ssh/authorized_keys
6. Server calls RoomKeys.generateRoomKeypair(token, roomId)
   → crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
   → write .ssh/id_rsa (600)
   → write .ssh/id_rsa.pub (600)
   → write .ssh/public_keys/<room-uuid>.public_key
   → write .ssh/private_key/<room-uuid>.private_key
7. Server writes room.json with metadata + sshPublicKey
8. Server adds room UUID to profile.ownedRooms[]
9. Server saves profile
10. Server registers room in RoomManager
11. Server broadcasts updated ROOM_LIST to all clients
```

### RoomKeys module (new file: RoomKeys.ts, ~100 lines)

Same pattern as UserKeys.ts but scoped to `data/users/<token>/rooms/<room-uuid>/`:

```typescript
export function getRoomDir(userToken: string, roomId: string): string
export function createRoomHome(userToken: string, roomId: string): void
export function generateRoomKeypair(userToken: string, roomId: string): KeyPair
export function hasRoomKeys(userToken: string, roomId: string): boolean
export function getRoomPublicKey(userToken: string, roomId: string): string | null
export function getRoomPrivateKey(userToken: string, roomId: string): string | null
export function getRoomAuthorizedKeys(userToken: string, roomId: string): string[]
export function addRoomAuthorizedKey(userToken: string, roomId: string, key: string): void
```

**Reuse from UserKeys.ts:** `mkdirSafe()` and `writeKeySafe()` should be extracted into a shared utility or exported from UserKeys.ts for reuse by RoomKeys.ts.

## 6. Room Name Default

```typescript
const roomName = msg.roomName || `${profile.name}'s Room`;
```

If user provides a name, use it. Otherwise default to `<UserName>'s Room`. This makes room creation one-click — no name input required.

## 7. Room Persistence — No Auto-Cleanup

### Current behavior (to remove)
```typescript
// RoomManager.cleanupStale() — DELETE THIS
// Currently removes rooms after 10 minutes idle
```

### Sprint 9 behavior
- **No `cleanupStale()`** — rooms persist permanently
- **No timeout-based deletion** — the `setTimeout(10 * 60 * 1000)` in LEAVE_ROOM handler removed
- **Deletion ONLY via DELETE_ROOM** — owner sends explicit delete command
- **Room.removePersisted()** updated to delete the entire `rooms/<room-uuid>/` directory (including .ssh/)

### Room loading on server start

```typescript
// RoomManager.loadAllUserRooms()
// Scan all data/users/*/rooms/*/room.json files
// Load each as a persistent Room
// Register in rooms Map
```

This replaces the current `loadFromDisk()` which reads from `data/rooms/`.

## 8. WS Sync Protocol

### Room advertisement on lobby entry

When a user enters the lobby (after IDENTIFY), the server should advertise their owned rooms that aren't already in the active room list:

```typescript
case MSG.IDENTIFY: {
  // ...existing profile handling...
  
  // After profile loaded, advertise owned rooms
  const ownedRooms = profile.ownedRooms || [];
  for (const roomId of ownedRooms) {
    if (!roomManager.getRoom(roomId)) {
      // Room exists on disk but not in memory — load it
      const roomDir = getRoomDir(token, roomId);
      const roomData = JSON.parse(fs.readFileSync(path.join(roomDir, 'room.json'), 'utf-8'));
      const room = Room.fromPersisted(roomData, roomDir);
      roomManager.registerRoom(room);
    }
  }
  // Send updated room list
  send({ type: MSG.ROOM_LIST, rooms: roomManager.listRooms() });
}
```

### ROOM_LIST changes

Current `listRooms()` filters out private rooms. Sprint 9 adds:
- All persistent rooms shown (with member count = 0 if empty)
- Owner's rooms always shown even if private (owner sees their own rooms)
- Other users see public rooms only (unchanged)

```typescript
listRooms(forToken?: string): RoomInfo[] {
  return [...this.rooms.values()]
    .filter(r => !r.isPrivate || r.creatorToken === forToken)
    .map(r => r.info());
}
```

### Room state sync to all clients

When a room's state changes (member join/leave, name change, delete):
```typescript
broadcastRoomList();  // already exists — sends ROOM_LIST to all WS clients
```

This is already implemented. No new WS message types needed for basic sync.

## 9. Migration from data/rooms/ to data/users/*/rooms/

### Backward compatibility

On server start:
1. Load rooms from new path (`data/users/*/rooms/*/room.json`) — primary
2. If old `data/rooms/*.json` files exist, migrate them:
   - For each old room, find creator token
   - Create `data/users/<token>/rooms/<id>/` structure
   - Generate SSH keypair for the room
   - Move room.json to new location
   - Delete old file
3. Log migration count

This ensures existing rooms survive the upgrade.

## 10. Security Considerations

### Room key usage (future sprints)
- Room public key can verify messages signed by the room (server acts on behalf of room)
- Room authorized_keys can list members who are allowed to join
- Room private key enables encrypted room-specific storage (like user encrypted files)
- This sprint generates the keys and establishes the directory structure — actual usage is future work

### Filesystem permissions
- Room `.ssh/` directories: 700 (same as user .ssh/)
- Key files: 600 (same as user keys)
- room.json: standard permissions (not sensitive — contains no private keys)

## 11. Phase Plan

### Phase 1: RoomKeys module + directory structure
- T73: RoomKeys.ts — mirror UserKeys.ts pattern for room-scoped paths
- T74: Extract mkdirSafe/writeKeySafe from UserKeys.ts into shared KeyUtils.ts

### Phase 2: Room persistence migration
- T75: Room.ts — full UUID, creatorToken field, room.json in user dir
- T76: RoomManager — loadAllUserRooms(), remove cleanupStale(), register/unregister
- T77: Migration — data/rooms/ → data/users/*/rooms/*/

### Phase 3: Server integration
- T78: CREATE_ROOM handler — generate room SSH keypair, default name, persist to user dir
- T79: DELETE_ROOM handler — remove room dir (including .ssh/), update profile.ownedRooms
- T80: IDENTIFY handler — load and advertise user's owned rooms on connect

### Phase 4: Client
- T81: RoomBrowser — show persistent rooms (even when empty), owner controls
- T82: Room name default — "<Name>'s Room" in create dialog

### Estimated effort
- Expert: ~12h
- Tester: ~4h
- 10 tasks across 4 phases
