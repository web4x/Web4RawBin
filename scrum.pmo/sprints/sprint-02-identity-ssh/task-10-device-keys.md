[Back to Sprint 2 Planning](./planning.md)

# T10: Device Key Enrollment

[task:uuid:a37159a8-6d81-4edf-b144-a2284f800308]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done


## Diagrams
- [Enrollment Sequence](./diagrams/sequence-enrollment.svg) — Full enrollment flow (gate → keys → device enrollment)
- [Class Diagram](./diagrams/class-diagram.svg) — DeviceRecord extensions + UserKeys methods


## Traceability
- up
  - [sprint-02-identity-ssh Planning](./planning.md)
- down
  - None
## Goal

Each device gets its own keypair, signed by the user's private key. To enroll a new device, the user enters their 4-digit secret code. Enrolled devices auto-authenticate on future connections.

## Requirements

### 10.1 Server: UserKeys.ts extensions

Add to `UserKeys.ts`:

```typescript
export function generateDeviceKeypair(userToken: string, deviceId: string):
  { publicKey: string, privateKey: string }
  // RSA-2048 device keypair

export function signDeviceKey(userToken: string, devicePublicKey: string): string
  // crypto.sign('sha256', Buffer.from(devicePublicKey), userPrivateKey)
  // Returns base64 signature

export function verifyDeviceKey(userToken: string, devicePublicKey: string, signature: string): boolean
  // crypto.verify('sha256', Buffer.from(devicePublicKey), userPublicKey, signatureBuffer)

export function enrollDevice(userToken: string, deviceId: string):
  { devicePublicKey: string, devicePrivateKey: string, signature: string }
  // Generate device keypair, sign, add public key to authorized_keys
```

### 10.2 Server: WS message handlers

**DEVICE_ENROLL_REQUEST** (client → server):
```typescript
{ type: 'DEVICE_ENROLL_REQUEST', secretCode: string }
```
Handler:
1. Look up user by tokenToClient
2. Verify `profile.sshKeysGenerated === true` — if not, error "Keys not generated"
3. Verify `msg.secretCode === profile.secretCode` — if not, error "Wrong secret code"
4. Call `enrollDevice(token, deviceId)`
5. Update DeviceRecord: `enrolled = true`, `devicePublicKey = ...`, `enrolledAt = ISO`
6. Respond `DEVICE_ENROLL_OK`

**DEVICE_ENROLL_OK** (server → client):
```typescript
{ type: 'DEVICE_ENROLL_OK', devicePublicKey: string, devicePrivateKey: string, signature: string }
```
NOTE: Private key is sent ONCE during enrollment. Client stores in localStorage.

**DEVICE_ENROLL_FAILED** (server → client):
```typescript
{ type: 'DEVICE_ENROLL_FAILED', reason: string }
```

### 10.3 Server: DeviceRecord extension

```typescript
interface DeviceRecord {
  deviceId: string;
  ownerToken: string;
  userAgent: string;
  ip: string;
  screenSize: string;
  platform: string;
  firstSeen: string;
  lastSeen: string;
  connectionCount: number;
  enrolled: boolean;            // NEW
  devicePublicKey: string;      // NEW (PEM)
  enrolledAt: string;           // NEW (ISO date)
}
```

### 10.4 Client: DeviceEnrollDialog.ts (~80 lines)

Simple dialog: "Enter your 4-digit secret code to authorize this device."
- 4-digit input field (numeric, pattern `[0-9]{4}`)
- Submit button
- Error display (wrong code feedback)
- Shown automatically when profile is committed but no device keys in localStorage

### 10.5 Client: RawBinClient.ts device key flow

On connect, after IDENTIFY + PROFILE response:
```
if (profile.profileCommitted && profile.sshKeysGenerated) {
  if (localStorage has rawbin-device-privateKey) {
    // Auto-auth: send DEVICE_AUTH (T12 wires this)
  } else {
    // Show DeviceEnrollDialog
    // On submit: send DEVICE_ENROLL_REQUEST with secretCode
    // On DEVICE_ENROLL_OK: store keys in localStorage
  }
}
```

localStorage keys:
- `rawbin-device-privateKey` — PEM private key
- `rawbin-device-publicKey` — PEM public key
- `rawbin-device-signature` — base64 signature

### 10.6 MessageTypes.ts additions

```typescript
DEVICE_ENROLL_REQUEST: 'DEVICE_ENROLL_REQUEST',   // C→S
DEVICE_ENROLL_OK: 'DEVICE_ENROLL_OK',             // S→C
DEVICE_ENROLL_FAILED: 'DEVICE_ENROLL_FAILED',     // S→C
DEVICE_AUTH: 'DEVICE_AUTH',                         // C→S (used in T12)
DEVICE_AUTH_OK: 'DEVICE_AUTH_OK',                   // S→C (used in T12)
DEVICE_AUTH_FAILED: 'DEVICE_AUTH_FAILED',           // S→C (used in T12)
```

### 10.7 Tester: Tests

`test/vitest/userkeys.test.ts` (extend from T9):
- generateDeviceKeypair creates valid RSA-2048
- signDeviceKey produces base64 signature
- verifyDeviceKey returns true for valid, false for tampered
- enrollDevice: creates keypair + signs + adds to authorized_keys
- DEVICE_ENROLL_REQUEST with correct secret code → DEVICE_ENROLL_OK with keys
- DEVICE_ENROLL_REQUEST with wrong secret code → DEVICE_ENROLL_FAILED
- DEVICE_ENROLL_REQUEST without sshKeysGenerated → error
- Device public key appears in authorized_keys after enrollment


## QA Audit & User Feedback

## Subtasks
None (atomic task).
## Acceptance Criteria
- [x] New device with committed profile prompted for secret code
- [x] Correct code → device keypair generated, signed, stored in localStorage
- [x] Device public key added to user's authorized_keys
- [x] Wrong code → DEVICE_ENROLL_FAILED with reason
- [x] User without SSH keys cannot enroll
- [x] Device keys persist in localStorage across page reloads
- [x] All tests pass
