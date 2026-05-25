# Requirements: Room Identity — Persistent Rooms with SSH Keys

**Source:** Tron directive 2026-05-25
**Author:** robbin-req (requirements engineer)
**Diagram:** [Use Case Diagram](./diagrams/use-cases.svg) ([source](./diagrams/use-cases.puml))

## Context

Rooms are currently ephemeral — stored in `data/rooms/` as flat JSON files, shared across all users, lost when the last member leaves (10-min cleanup). They have no cryptographic identity.

Sprint 9 changes rooms to be **per-user, persistent, and cryptographically identified** — each room gets its own UUID folder under the owner's home directory with a full OOSH SSH keypair.

### Current vs Sprint 9

| Aspect | Current (Sprint 1-8) | Sprint 9 |
|--------|---------------------|----------|
| Storage | `data/rooms/<id>.json` (global) | `data/users/<token>/rooms/<uuid>/` (per-user) |
| Lifecycle | Ephemeral — auto-deleted when empty | Persistent — survives restart, manual delete only |
| Identity | UUID string only | Full OOSH SSH tree (RSA-2048 keypair) |
| Ownership | `creatorId` field (clientId, session-scoped) | `ownerToken` (playerToken, permanent) |
| Visibility | All rooms listed to all clients | Owner's rooms advertised when owner connects |
| Default name | `${memberName}'s Room` | `${profile.name}'s Room` |

### Filesystem Layout (Sprint 9)

```
data/users/<token>/
├── profile.json
├── .ssh/                      # User's SSH identity (Sprint 2)
│   ├── id_rsa
│   ├── id_rsa.pub
│   ├── public_keys/
│   ├── private_key/
│   └── authorized_keys
├── files/                     # Encrypted files (Sprint 7)
│   ├── avatar.enc
│   └── avatar.meta.json
└── rooms/                     # NEW: per-user rooms
    └── <room-uuid>/
        ├── room.json          # Room metadata (name, maxMembers, isPrivate, createdAt, chatHistory)
        └── .ssh/              # Room's SSH identity (OOSH pattern)
            ├── id_rsa         # Room private key (RSA-2048 PEM)
            ├── id_rsa.pub     # Room public key
            ├── public_keys/
            │   └── <room-uuid>.public_key
            ├── private_key/
            │   └── <room-uuid>.private_key
            └── authorized_keys  # Members' public keys (future: room-level auth)
```

---

## UC-RM.1: room.create — Create room with identity

**Actor:** Room Owner (browser)
**Trigger:** Click "Create Room" in lobby, confirm with name

**Preconditions:**
- Owner has committed profile (`profileCommitted === true`)
- Owner has SSH keys generated (`sshKeysGenerated === true`)

**Flow:**
1. Client sends `CREATE_ROOM { roomName?, maxPlayers?, roomKey? }`
2. Server resolves owner from `playerToken` via `tokenToClient`
3. Server generates room UUID: `crypto.randomUUID()`
4. Default room name: `${profile.name}'s Room` (if no roomName provided)
5. Server creates directory: `data/users/<ownerToken>/rooms/<uuid>/`
6. Server generates RSA-2048 keypair for the room (same as UserKeys pattern):
   - `rooms/<uuid>/.ssh/id_rsa` (private, 600)
   - `rooms/<uuid>/.ssh/id_rsa.pub` (public, 600)
   - `rooms/<uuid>/.ssh/public_keys/<uuid>.public_key`
   - `rooms/<uuid>/.ssh/private_key/<uuid>.private_key`
   - `rooms/<uuid>/.ssh/authorized_keys` (empty initially)
   - Directory permissions: 700
7. Server writes `rooms/<uuid>/room.json`:
   ```json
   {
     "id": "<uuid>",
     "name": "Marcel's Room",
     "ownerToken": "<owner-playerToken>",
     "maxMembers": 10,
     "isPrivate": false,
     "roomKey": null,
     "createdAt": "2026-05-25T12:00:00.000Z",
     "chatHistory": []
   }
   ```
8. Server registers room in RoomManager (in-memory)
9. Owner auto-joins the room
10. Server broadcasts `ROOM_LIST` to all connected clients (UC-RM.5)

**Acceptance Criteria:**
- [ ] Creating a room creates `data/users/<token>/rooms/<uuid>/` directory
- [ ] Default room name is `${profile.name}'s Room` when no name provided
- [ ] Room UUID is a valid UUID v4
- [ ] `.ssh/` tree created with id_rsa, id_rsa.pub, public_keys/, private_key/, authorized_keys
- [ ] RSA-2048 keypair in PEM format (same encoding as user keys)
- [ ] File permissions: 700 dirs, 600 key files
- [ ] room.json written with correct metadata
- [ ] Room appears in ROOM_LIST after creation
- [ ] Owner auto-joined to the room
- [ ] Creating without committed profile returns ERROR

---

## UC-RM.2: room.persist — Rooms survive server restart

**Actor:** Server
**Trigger:** Server startup

**Flow:**
1. On startup, server scans all user directories: `data/users/*/rooms/*/room.json`
2. For each valid `room.json`, creates a Room instance via `Room.fromPersisted()`
3. Room registered in RoomManager with no active members (all disconnected)
4. Chat history restored from room.json
5. Room is dormant — not listed in ROOM_LIST until owner connects (UC-RM.4)
6. Room state persists on every mutation (member join/leave, chat, settings change)

**Persistence triggers (write room.json):**
- Member joins or leaves
- Chat message added
- Room settings changed (name, maxMembers, private/key)
- Room archived

**Acceptance Criteria:**
- [ ] Restart server → rooms reloaded from `data/users/*/rooms/*/room.json`
- [ ] Room metadata (name, maxMembers, isPrivate, createdAt) preserved
- [ ] Chat history preserved across restart
- [ ] Room SSH keys persist (not regenerated on reload)
- [ ] Dormant rooms not listed until owner connects
- [ ] Empty rooms (no members) are NOT auto-deleted — they persist
- [ ] Corrupt room.json skipped with log warning (no crash)

---

## UC-RM.3: room.delete — Owner manually deletes room

**Actor:** Room Owner
**Trigger:** Click delete button in room or lobby

**Preconditions:**
- Requester's playerToken matches room's ownerToken

**Flow:**
1. Client sends `DELETE_ROOM { roomId }`
2. Server verifies requester is room owner (playerToken === room.ownerToken)
3. If room has active members: broadcast `ROOM_DELETED { roomId, reason }` to all
4. Members' WS connections receive ROOM_DELETED → client returns to lobby
5. Server removes room from RoomManager (in-memory)
6. Server deletes `data/users/<ownerToken>/rooms/<uuid>/` recursively (including .ssh/)
7. Server broadcasts updated `ROOM_LIST` to all connected clients

**Security:**
- Only the owner can delete — non-owners receive `ERROR { message: 'Only the room owner can delete it' }`
- SSH private key is destroyed with the folder
- No "soft delete" — deletion is permanent and immediate

**Acceptance Criteria:**
- [ ] Owner can delete their room
- [ ] Non-owner receives ERROR when trying to delete
- [ ] Active members receive ROOM_DELETED and return to lobby
- [ ] Room folder + .ssh/ deleted from disk recursively
- [ ] Room removed from RoomManager
- [ ] ROOM_LIST broadcast after deletion
- [ ] Deleted room no longer appears in any listing

---

## UC-RM.4: room.advertise — Owner's rooms appear on connect

**Actor:** Room Owner
**Trigger:** Owner connects to WebSocket and sends IDENTIFY

**Flow:**
1. Owner connects to WS, sends IDENTIFY with playerToken
2. Server resolves playerToken, finds profile
3. Server scans `data/users/<token>/rooms/` for persisted rooms
4. For each room NOT already in RoomManager: register as active
5. For each room already in RoomManager: update host to new clientId
6. Server broadcasts updated ROOM_LIST to all clients (UC-RM.5)
7. Owner's rooms now visible to everyone in the lobby

**Dormant vs Active:**
- **Dormant:** Room exists on disk but owner is not connected. NOT shown in ROOM_LIST.
- **Active:** Owner is connected. Room IS shown in ROOM_LIST with `hostConnected: true`.
- When owner disconnects: room goes dormant. Remaining members (if any) see room.hostConnected = false. Room stays active with members but stops appearing for new joiners.

**Acceptance Criteria:**
- [ ] Owner connects → their persisted rooms appear in ROOM_LIST
- [ ] Owner disconnects → rooms become dormant (not listed for new joiners)
- [ ] Rooms with active members stay functional when owner disconnects
- [ ] Owner reconnects → rooms re-activate, hostId updated
- [ ] Multiple owners connecting → all their rooms appear
- [ ] Room that was never persisted (pre-Sprint-9) → not affected

---

## UC-RM.5: room.sync — Broadcast room list changes

**Actor:** Server
**Trigger:** Any room list mutation

**Flow:**
1. On any room list change (create, delete, advertise, member count change):
2. Server calls `broadcastRoomList()` — sends `ROOM_LIST` to ALL connected WS clients
3. ROOM_LIST includes all currently active (non-dormant) rooms

**Events that trigger sync:**
- UC-RM.1: room.create → new room appears
- UC-RM.3: room.delete → room disappears
- UC-RM.4: room.advertise → dormant rooms become visible
- Member join/leave → member count changes
- Owner disconnect → room may become dormant

**Acceptance Criteria:**
- [ ] Room creation triggers ROOM_LIST broadcast to all clients
- [ ] Room deletion triggers ROOM_LIST broadcast
- [ ] Owner connect triggers ROOM_LIST broadcast (rooms appear)
- [ ] Owner disconnect triggers ROOM_LIST broadcast (rooms may disappear)
- [ ] Member join/leave triggers ROOM_LIST broadcast (count changes)
- [ ] All connected clients receive the same ROOM_LIST

---

## UC-RM.6: room.identity — OOSH SSH identity for rooms

**Actor:** Server (internal)
**Trigger:** room.create (UC-RM.1)

**OOSH SSH directory pattern (identical to user keys from Sprint 2):**

```
rooms/<uuid>/.ssh/
├── id_rsa                        # RSA-2048 private key (PEM, PKCS8)
├── id_rsa.pub                    # RSA-2048 public key (PEM, SPKI)
├── public_keys/
│   └── <uuid>.public_key         # Named copy of id_rsa.pub
├── private_key/
│   └── <uuid>.private_key        # Named copy of id_rsa
└── authorized_keys               # Empty initially
```

**Key generation (Node.js crypto, no shell):**
```typescript
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
```

**Future use of room keys (not Sprint 9 — noted for architecture):**
- Room-to-room encrypted messaging
- Room-level file encryption (shared encrypted storage per room)
- Member authorization via authorized_keys (room invites as key exchange)
- Room identity verification (prove room is the original, not a copy)

**Acceptance Criteria:**
- [ ] Room SSH tree follows OOSH pattern exactly (same as UserKeys.ts structure)
- [ ] RSA-2048 keypair generated via Node.js crypto (no shell commands)
- [ ] PEM encoding: SPKI for public, PKCS8 for private
- [ ] File permissions: 700 for directories, 600 for key files
- [ ] Named copies in public_keys/ and private_key/ use room UUID as filename
- [ ] authorized_keys exists and is empty at creation
- [ ] Keys persist across server restart (not regenerated on reload)
- [ ] Keys deleted when room deleted (UC-RM.3)

---

## Non-Functional Requirements

### NFR-1: Migration
- Existing rooms in `data/rooms/` (pre-Sprint-9) continue to work during transition
- New rooms created in Sprint 9 go to `data/users/<token>/rooms/`
- No automatic migration of old rooms — they expire naturally (cleanup timer)

### NFR-2: Performance
- Room scan on startup: `data/users/*/rooms/*/room.json` — must handle 100+ users with 10+ rooms each
- Lazy scan: read room.json metadata only, don't load chat history until room is accessed
- Key generation is ~50ms per room — acceptable for create, not for bulk operations

### NFR-3: Security
- Room private keys only readable by server process (600 permissions)
- Room deletion destroys private key — no recovery possible
- Room SSH keys are separate from user SSH keys — compromising a room key doesn't compromise the user
- Path validation: room UUID must be a valid UUID, no path traversal

### NFR-4: Data Integrity
- room.json written atomically (write to temp file, rename)
- Corrupt room.json skipped on load with warning log
- Missing .ssh/ directory: log warning, do not auto-regenerate (may indicate tampering)

---

## Implementation Hint: RoomKeys.ts

New module `src/ts/server/RoomKeys.ts` — mirrors UserKeys.ts for room identities:

```typescript
export function createRoomHome(ownerToken: string, roomId: string): string
  // Creates data/users/<ownerToken>/rooms/<roomId>/ + .ssh/ tree
  // Returns room home dir path

export function generateRoomKeypair(ownerToken: string, roomId: string): { publicKey: string; privateKey: string }
  // RSA-2048 keypair in OOSH .ssh/ pattern

export function hasRoomKeys(ownerToken: string, roomId: string): boolean

export function getRoomPublicKey(ownerToken: string, roomId: string): string | null

export function deleteRoomHome(ownerToken: string, roomId: string): void
  // Recursive delete of rooms/<roomId>/ including .ssh/

export function listUserRooms(ownerToken: string): { id: string; metadata: RoomMetadata }[]
  // Scans rooms/ directory, returns parsed room.json for each
```

---

## Traceability

| Tron Requirement | Use Case | Acceptance Criteria |
|-----------------|----------|-------------------|
| Default name `Name's Room`, UUID, folder, SSH keypair | UC-RM.1 | 10 criteria |
| Rooms survive server restart | UC-RM.2 | 7 criteria |
| Owner-only manual delete, removes folder + keys | UC-RM.3 | 7 criteria |
| On lobby connect, owner's rooms broadcast | UC-RM.4 | 6 criteria |
| Room list changes broadcast via WS | UC-RM.5 | 6 criteria |
| Room has full OOSH SSH identity | UC-RM.6 | 8 criteria |
| **Total** | **6 use cases** | **44 acceptance criteria** |
