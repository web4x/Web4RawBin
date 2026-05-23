[Back to Sprint 2 Planning](./planning.md)

# T12: SSH-Based Login (Challenge-Response)

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Effort:** 3h expert + 1h tester
**Dependencies:** T10 (device keys must exist)

## Diagrams
- [Auth Sequence](./diagrams/sequence-auth.svg) — Challenge-response flow with replay protection
- [Class Diagram](./diagrams/class-diagram.svg) — WebSocketClient.authenticated + AuthMethod enum

## Goal

Replace/augment token-based identity with cryptographic challenge-response authentication using device keys. Server sends a challenge nonce, client signs with device private key, server verifies against authorized_keys.

## Requirements

### 12.1 Server: Challenge generation

Modify welcome message (sent on WS connect) to include a challenge:
```typescript
ws.send(JSON.stringify({
  type: 'welcome',
  clientId,
  onlineCount: wsClients.size,
  challenge: crypto.randomBytes(32).toString('hex')  // NEW
}));
```

Store the challenge in the WebSocketClient object for verification.

### 12.2 Server: WebSocketClient extension

```typescript
interface WebSocketClient {
  ws: WebSocket; id: string; ip: string; userAgent: string;
  connectedAt: number; avatarUrl: string; deviceId: string; playerToken: string;
  authenticated: boolean;                          // NEW
  authMethod: 'none' | 'token' | 'device-key';   // NEW
  challenge: string;                               // NEW
}
```

### 12.3 Server: DEVICE_AUTH handler

```typescript
case MSG.DEVICE_AUTH: {
  const { devicePublicKey, signedChallenge } = msg;
  const client = [...wsClients].find(c => c.id === clientId);
  if (!client?.challenge) { send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'No challenge' }); break; }

  // Find user who owns this device key
  const userToken = client.playerToken;
  if (!userToken) { send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'Not identified' }); break; }

  // Verify signature
  const valid = verifyChallenge(userToken, devicePublicKey, client.challenge, signedChallenge);
  if (valid) {
    client.authenticated = true;
    client.authMethod = 'device-key';
    client.challenge = '';  // consumed — no replay
    send({ type: MSG.DEVICE_AUTH_OK });
  } else {
    send({ type: MSG.DEVICE_AUTH_FAILED, reason: 'Invalid signature' });
  }
  break;
}
```

### 12.4 Server: UserKeys.ts — challenge verification

```typescript
export function verifyChallenge(
  userToken: string,
  devicePublicKey: string,
  challenge: string,
  signedChallenge: string  // base64
): boolean {
  // Check devicePublicKey is in authorized_keys
  const authorizedKeys = getAuthorizedKeys(userToken);
  if (!authorizedKeys.includes(devicePublicKey)) return false;

  // Verify signature
  return crypto.verify(
    'sha256',
    Buffer.from(challenge, 'hex'),
    devicePublicKey,
    Buffer.from(signedChallenge, 'base64')
  );
}
```

### 12.5 Client: RawBinClient.ts — sign challenge with Web Crypto

```typescript
async signChallenge(challenge: string): Promise<string | null> {
  const pemPrivateKey = localStorage.getItem('rawbin-device-privateKey');
  if (!pemPrivateKey) return null;

  // Convert PEM to ArrayBuffer (strip header/footer, base64 decode)
  const pemBody = pemPrivateKey.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const challengeBytes = new Uint8Array(challenge.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, challengeBytes);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
```

### 12.6 Client: Connect flow update

On welcome message with challenge:
```
1. Receive welcome { challenge }
2. If device keys in localStorage:
   a. Sign challenge
   b. Send DEVICE_AUTH { devicePublicKey, signedChallenge }
   c. On DEVICE_AUTH_OK → authenticated = true
3. Send IDENTIFY (always — for profile data)
4. If no device keys → enrollment flow (T10)
```

### 12.7 Backward compatibility

Token-based IDENTIFY still works. Server sets `authMethod = 'token'` for IDENTIFY-only connections. Both auth methods coexist — no breaking change for existing clients.

### 12.8 Tester: Tests

- Challenge is unique per connection (no duplicates)
- Valid device key signature → DEVICE_AUTH_OK, authMethod = 'device-key'
- Invalid signature → DEVICE_AUTH_FAILED
- Replayed challenge (same nonce) → rejected (challenge consumed after use)
- Device key not in authorized_keys → rejected
- Token-only client still works (backward compatible)
- Connection without any auth → authMethod = 'none'

## Acceptance Criteria
- [ ] Welcome includes unique challenge nonce
- [ ] Client with device keys signs challenge and sends DEVICE_AUTH
- [ ] Server verifies and marks connection as device-key authenticated
- [ ] Invalid signatures rejected
- [ ] No replay attacks (challenge is single-use)
- [ ] Token-only clients still work (backward compatible)
- [ ] authMethod tracked per connection
- [ ] All tests pass
