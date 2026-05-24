# Sprint 7 Planning — Encrypted User Storage + Avatar System

## Sprint Goal
Make avatars visible everywhere in the app, add profile picture upload, and encrypt all user-uploaded files at rest using hybrid RSA+AES encryption tied to the user's SSH keypair.

## Sprint Overview
**Duration:** 2026-05-24 – ongoing
**Focus:** Avatar pipeline, file upload, encrypted storage
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directive: avatars visible, profile picture upload, encrypted file storage

## Architecture Audit

### Current Avatar Flow

```
thispersondoesnotexist.com → server.ts fetchUniqueAvatar() → base64 data URL
  ↓
WebSocket welcome → client gets avatarUrl per connection
  ↓
Room.ts member.avatarUrl → ROOM_JOINED message → client rb-member-badge avatar-url attr
```

**Problems:**
1. Avatar is per-connection, not per-user — a new WS connection gets a NEW random face. No persistence.
2. Avatar is only visible in member badges inside rooms. Not shown in: lobby, profile page, profile editor, vCard.
3. Profile.avatar field exists in UserProfile but is only set via UPDATE_PROFILE (empty by default). The thispersondoesnotexist avatar goes to `avatarCache` (in-memory) and Room member data, never to the profile.
4. No file upload endpoint — ProfileEditor reads file as dataURL and sends the entire base64 string in the UPDATE_PROFILE WS message. Large avatars (~200KB base64) bloat WS traffic.

### Current File Storage

```
data/
├── profiles.json          # UserProfile[] (identity only)
├── devices.json           # DeviceRecord[] (device tracking)
├── rooms/                 # Persisted room state
├── bug-reports.json       # Bug report fallback
├── agent-pairing.json     # Bug report target pane
└── users/<token>/
    ├── profile.json        # Copy of user profile
    └── .ssh/               # SSH keys (RSA-2048 PEM)
```

No user files are stored. Avatar data is either in-memory (avatarCache) or inline in the profile JSON as base64.

### Crypto Design: Hybrid RSA+AES Encryption

RSA-2048 can only encrypt 190 bytes (OAEP SHA-256) or 245 bytes (PKCS1). Avatars are 100KB-500KB. Solution: **hybrid encryption**.

```
ENCRYPT (upload):
  1. Generate random AES-256 key (32 bytes) + IV (16 bytes)
  2. Encrypt file data with AES-256-GCM: ciphertext + authTag (16 bytes)
  3. Encrypt the AES key with user's RSA public key (crypto.publicEncrypt)
  4. Store: { encryptedKey (base64), iv (hex), authTag (hex), ciphertext (binary) }

DECRYPT (serve):
  1. Decrypt the AES key with user's RSA private key (crypto.privateDecrypt)
  2. Decrypt ciphertext with AES-256-GCM using decrypted key + IV + authTag
  3. Return plaintext file data

File format on disk:
  data/users/<token>/files/<filename>.enc
  data/users/<token>/files/<filename>.meta.json
    { encryptedKey: "base64", iv: "hex", authTag: "hex", mimeType: "image/jpeg", originalName: "avatar.jpg", size: 123456, uploadedAt: "ISO" }
```

**Why AES-256-GCM:**
- Authenticated encryption (tamper detection via authTag)
- Fast for large files (hardware-accelerated on modern CPUs)
- IV + authTag stored alongside ciphertext, not in the key envelope
- Standard Node.js crypto API: `crypto.createCipheriv('aes-256-gcm', ...)`

**Why RSA envelope (not direct RSA):**
- RSA-2048 max plaintext is 190 bytes — cannot encrypt files directly
- AES key is 32 bytes — fits easily in RSA envelope
- Changing the file doesn't require re-encrypting the RSA envelope (just re-encrypt with new AES key)
- Server can encrypt files without the user's private key (only public key needed)
- Only the user's private key can decrypt — true at-rest encryption

**Who holds the keys:**
- Server has the user's RSA **public** key (`data/users/<token>/.ssh/id_rsa.pub`) — can encrypt
- Server has the user's RSA **private** key (`data/users/<token>/.ssh/id_rsa`) — can decrypt when serving back to the owner
- Other users cannot decrypt (they don't have the private key)

**Note:** Since the server holds both keys, this is encryption-at-rest, not end-to-end. If the server is compromised, files can be decrypted. True E2E would require keeping the private key only on the client (in localStorage). That's a future enhancement — this sprint establishes the foundation.

### Avatar Pipeline Design

```
NEW FLOW (Sprint 7):

1. First connection (no profile avatar):
   thispersondoesnotexist.com → server assigns as default avatar
   → encrypt + store in data/users/<token>/files/avatar.enc
   → serve via /api/avatar/<token> (decrypts on the fly)

2. Profile picture upload:
   Client: ProfileEditor file input → POST /api/upload-avatar (multipart form or base64 body)
   Server: validate size/type → encrypt with user's public key → write .enc file
   → update profile.avatar = '/api/avatar/<token>'
   → respond with new avatar URL

3. Avatar serving:
   GET /api/avatar/<token>
   → read .enc + .meta.json
   → decrypt with user's private key
   → respond with Content-Type from meta, decrypted binary data
   → Cache-Control: public, max-age=3600 (ETag on encrypted file hash)

4. Avatar visible everywhere:
   - Member badges: already use avatarUrl from Room member data ✅
   - Lobby header: show current user avatar next to name input
   - Profile page (/profile): show avatar from /api/avatar/<token>
   - Profile editor: show current avatar, upload replaces it
   - vCard download: include PHOTO from /api/avatar/<token>
```

## Task List

### Phase 1: Crypto Foundation

- [ ] [T47: UserCrypto.ts — Hybrid encryption module](./task-47-user-crypto.md)
  **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  **Dependencies:** None
  New file `src/ts/server/UserCrypto.ts` with:
  - `encryptFile(userToken, data, mimeType, originalName): string` — returns stored filename
  - `decryptFile(userToken, filename): { data: Buffer, mimeType: string }`
  - `listUserFiles(userToken): FileMetadata[]`
  - Uses AES-256-GCM + RSA-2048 envelope via `getUserPublicKey()`/`getUserPrivateKey()` from UserKeys.ts
  - File stored at `data/users/<token>/files/<name>.enc` + `<name>.meta.json`
  - Tests: encrypt/decrypt roundtrip, wrong-key rejection, GCM tamper detection, large file (1MB)

### Phase 2: Avatar Pipeline

- [ ] [T48: Default avatar assignment + encrypted storage](./task-48-default-avatar.md)
  **Status:** PLANNED
  **Effort:** 2h expert + 0.5h tester
  **Dependencies:** T47
  On first IDENTIFY (profile created + keys generated):
  - Fetch avatar from thispersondoesnotexist.com
  - Encrypt + store via UserCrypto.encryptFile()
  - Set `profile.avatar = '/api/avatar/<token>'`
  - Persist to profile. No longer store base64 in avatarCache (memory saving).

- [ ] [T49: Avatar serving endpoint `GET /api/avatar/<token>`](./task-49-avatar-serve.md)
  **Status:** PLANNED
  **Effort:** 1.5h expert + 0.5h tester
  **Dependencies:** T47
  New HTTP route in server.ts:
  - `GET /api/avatar/<token>` — decrypt avatar.enc, serve with correct Content-Type
  - `GET /api/avatar/<token>?thumb=1` — optional: serve smaller thumbnail (resize via sharp or skip for MVP)
  - ETag based on encrypted file hash (no re-read needed for 304)
  - Cache-Control: public, max-age=3600
  - 404 if no avatar file exists, serve /icon-192.png fallback

- [ ] [T50: Avatar upload endpoint `POST /api/avatar`](./task-50-avatar-upload.md)
  **Status:** PLANNED
  **Effort:** 2h expert + 1h tester
  **Dependencies:** T47, T49
  New HTTP route in server.ts:
  - `POST /api/avatar` with body `{ playerToken, data (base64), mimeType }`
  - Validate: authenticated (token in tokenToClient), size < 500KB, mimeType image/*
  - Encrypt + store via UserCrypto.encryptFile(), overwrite existing avatar
  - Update profile.avatar URL
  - Return `{ ok: true, avatarUrl: '/api/avatar/<token>' }`

### Phase 3: Client Integration

- [ ] [T51: ProfileEditor avatar upload via API](./task-51-editor-upload.md)
  **Status:** PLANNED
  **Effort:** 1.5h expert + 0.5h tester
  **Dependencies:** T50
  Modify ProfileEditor.ts:
  - On file select: POST to `/api/avatar` instead of sending base64 in UPDATE_PROFILE
  - On success: update avatar preview, set profile.avatar to returned URL
  - Size limit enforced client-side (500KB) + server-side
  - Remove base64 avatar from UPDATE_PROFILE message (just send avatar URL string)

- [ ] [T52: Avatar visible in lobby + profile page](./task-52-avatar-everywhere.md)
  **Status:** PLANNED
  **Effort:** 1.5h expert + 0.5h tester
  **Dependencies:** T49, T51
  - RoomBrowser: show current user's avatar next to name input (from profile.avatar URL)
  - Profile page (/profile inline HTML): show `<img src="/api/avatar/<token>">` instead of placeholder
  - rb-member-badge: already handles avatarUrl ✅ — just needs profile.avatar set correctly
  - vCard download (ProfileSheet): fetch avatar from /api/avatar/<token> for PHOTO field

- [ ] [T53: Room member avatarUrl from profile](./task-53-room-avatar.md)
  **Status:** PLANNED
  **Effort:** 1h expert + 0.5h tester
  **Dependencies:** T48
  Modify server.ts room join flow:
  - On CREATE_ROOM / JOIN_ROOM: use `profile.avatar` (the /api/avatar URL) as member avatarUrl
  - Stop using thispersondoesnotexist per-connection — use the stored profile avatar instead
  - Fallback: if profile.avatar is empty, use /icon-192.png
  - Remove fetchUniqueAvatar() call from WS connection handler (move to T48's first-profile flow only)

### Phase 4: Cleanup

- [ ] [T54: Remove avatarCache + verify encrypted storage](./task-54-cleanup.md)
  **Status:** PLANNED
  **Effort:** 1h expert + 0.5h tester
  **Dependencies:** T47-T53 all done
  - Remove `avatarCache` Map from server.ts (no longer needed)
  - Remove `fetchUniqueAvatar()` from connection handler (only called during first profile creation)
  - Verify: all avatar data is encrypted at rest (no plaintext images in data/)
  - Verify: `ls data/users/*/files/` shows only .enc + .meta.json files
  - Run full E2E test suite
  - Bundle size check

## Dependency Graph

```
Phase 1:
  T47 (UserCrypto) ──────────────────────────────┐
                                                  │
Phase 2:                                          │
  T48 (default avatar) ──→ T53 (room avatar) ────┤
  T49 (serve endpoint) ──→ T52 (visible everywhere)
  T50 (upload endpoint) ──→ T51 (editor upload) ──┤
                                                  │
Phase 3:                                          │
  T51, T52, T53 ──────────────────────────────────┤
                                                  │
Phase 4:                                          │
  T54 (cleanup) ←─────────────────────────────────┘
```

## Crypto Spec: UserCrypto.ts API

```typescript
import { getUserPublicKey, getUserPrivateKey, getUserHomeDir } from './UserKeys.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

interface FileMetadata {
  encryptedKey: string;   // RSA-encrypted AES key, base64
  iv: string;             // AES-GCM IV, hex
  authTag: string;        // AES-GCM auth tag, hex
  mimeType: string;
  originalName: string;
  size: number;           // original plaintext size
  uploadedAt: string;     // ISO date
}

function getFilesDir(token: string): string
  // returns data/users/<token>/files/

function encryptFile(token: string, plaintext: Buffer, mimeType: string, originalName: string): string
  // 1. aesKey = crypto.randomBytes(32), iv = crypto.randomBytes(16)
  // 2. cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv)
  //    ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  //    authTag = cipher.getAuthTag()
  // 3. encryptedKey = crypto.publicEncrypt(publicKey, aesKey).toString('base64')
  // 4. write ciphertext to <name>.enc
  // 5. write metadata to <name>.meta.json
  // returns filename (without extension)

function decryptFile(token: string, filename: string): { data: Buffer; mimeType: string }
  // 1. read metadata from <filename>.meta.json
  // 2. aesKey = crypto.privateDecrypt(privateKey, Buffer.from(encryptedKey, 'base64'))
  // 3. decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(iv, 'hex'))
  //    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  // 4. plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  // returns { data: plaintext, mimeType }

function deleteFile(token: string, filename: string): void
function listUserFiles(token: string): FileMetadata[]
function fileExists(token: string, filename: string): boolean
```

## Sprint Totals

| Metric | Value |
|--------|-------|
| Tasks | 8 (T47-T54) |
| Expert effort | ~12.5h |
| Tester effort | ~5h |
| New files | 1 (UserCrypto.ts ~120 lines) |
| Modified files | server.ts, ProfileEditor.ts, ProfileSheet.ts, RoomBrowser.ts |
| New HTTP routes | 2 (GET /api/avatar/:token, POST /api/avatar) |
| Key change | Avatar stored encrypted at rest, served via HTTP endpoint |

## Definition of Done
- [ ] All task acceptance criteria met
- [ ] `npm run build` succeeds
- [ ] All vitest + Playwright tests pass
- [ ] UserCrypto roundtrip test (encrypt → decrypt = original)
- [ ] No plaintext image files in data/users/ (only .enc + .meta.json)
- [ ] Avatar visible in: room badges, lobby, profile page, profile editor, vCard
- [ ] Profile picture upload works end-to-end
- [ ] Default avatar assigned on first profile creation
- [ ] avatarCache removed from server.ts
- [ ] No regression in Sprint 1-6 functionality

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-24
**Sprint:** Sprint 7 — Encrypted User Storage + Avatar System
