[Back to Sprint 2 Planning](./planning.md)

# T9: SSH Key Generation on Profile Commit

[task:uuid:e7fbf79b-c564-4751-8144-dbfb6688946d]

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Effort:** 3h expert + 1h tester
**Dependencies:** T8 (profile commit triggers key generation)
**Created:** 2026-05-23
**Completed:** 2026-05-23

## Diagrams
- [Class Diagram](./diagrams/class-diagram.svg) — UserProfile + UserKeys + filesystem layout
- [Enrollment Sequence](./diagrams/sequence-enrollment.svg) — Profile commit → key generation flow


## Traceability
- up
  - [sprint-2-identity-ssh Planning](./planning.md)
- down
  - None
## Goal

When a user commits their profile for the first time, create a per-user home directory with SSH keypair following OOSH conventions.

## OOSH Pattern Reference

The `ossh` script manages SSH keys in this structure:
```
~/.ssh/ids/<idName>/
├── id_rsa                        # Private key
├── id_rsa.pub                    # Public key
├── public_keys/<name>.public_key # Named copy of public key
├── private_key/<name>.private_key # Named copy of private key
└── authorized_keys               # All authorized public keys
```
Permissions: 700 dirs, 600 key files. Keys created via `ssh-keygen` (OOSH) or `crypto.generateKeyPairSync` (RawBin).

## Requirements

### 9.1 New file: UserKeys.ts (~250 lines)

`src/ts/server/UserKeys.ts` — SSH key management module.

```typescript
export function createUserHome(token: string): void
  // Creates data/users/<token>/ and .ssh/ tree

export function generateUserKeypair(token: string): { publicKey: string, privateKey: string }
  // crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  // Writes PEM files to .ssh/

export function hasUserKeys(token: string): boolean
  // Checks if .ssh/id_rsa exists

export function getUserPublicKey(token: string): string | null
  // Reads .ssh/id_rsa.pub

export function getUserPrivateKey(token: string): string | null
  // Reads .ssh/id_rsa

export function getAuthorizedKeys(token: string): string[]
  // Reads .ssh/authorized_keys, returns array of public key strings

export function addAuthorizedKey(token: string, devicePublicKey: string): void
  // Appends to .ssh/authorized_keys

export function getUserHomeDir(token: string): string
  // Returns data/users/<token>/
```

### 9.2 Directory structure

On first profile commit, create:
```
data/users/<token>/
├── profile.json              # Copy of user profile
└── .ssh/
    ├── id_rsa                # PEM private key (RSA-2048)
    ├── id_rsa.pub            # PEM public key
    ├── public_keys/
    │   └── <token>.public_key    # Copy of id_rsa.pub
    ├── private_key/
    │   └── <token>.private_key   # Copy of id_rsa
    └── authorized_keys       # Empty (populated by T10)
```

### 9.3 Key generation

Use Node.js crypto (no shell commands):
```typescript
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
```

### 9.4 File permissions

```typescript
fs.chmodSync(sshDir, 0o700);
fs.chmodSync(idRsaPath, 0o600);
fs.chmodSync(idRsaPubPath, 0o600);
fs.chmodSync(authorizedKeysPath, 0o600);
```

### 9.5 Hook into UPDATE_PROFILE

In `server.ts` UPDATE_PROFILE handler, after setting `profileCommitted = true`:
```typescript
if (!profile.sshKeysGenerated) {
  createUserHome(profile.token);
  generateUserKeypair(profile.token);
  profile.sshKeysGenerated = true;
  profile.sshKeyGeneratedAt = new Date().toISOString();
}
```

Idempotent: if keys already exist, skip generation.

### 9.6 UserProfile extension

Add to interface:
```typescript
sshKeysGenerated: boolean;     // true after keypair generated
sshKeyGeneratedAt: string;     // ISO date of key generation
```

### 9.7 Tester: Tests

`test/vitest/userkeys.test.ts`:
- createUserHome creates correct directory tree
- generateUserKeypair creates valid PEM RSA-2048 keys
- Files in correct locations (id_rsa, id_rsa.pub, public_keys/, private_key/)
- File permissions: 700 dirs, 600 files
- hasUserKeys returns true after generation, false before
- getUserPublicKey returns PEM string
- Idempotent: calling twice does not regenerate
- authorized_keys exists and is empty initially
- addAuthorizedKey appends to file


## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] Profile commit creates data/users/<token>/.ssh/ tree
- [x] RSA-2048 keypair in PEM format
- [x] OOSH directory pattern (public_keys/, private_key/ with named copies)
- [x] File permissions: 700 dirs, 600 files
- [x] Idempotent (no regen on second call)
- [x] sshKeysGenerated set in UserProfile
- [x] All tests pass
