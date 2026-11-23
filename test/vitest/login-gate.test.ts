import { describe, it, expect } from 'vitest';
import { identifyGate } from '../../src/ts/server/login-gate.js';

// [test:uuid:6b08038b-5e76-4f06-a9c2-982463c2b55b] R42.5 no-token-only-login: an account with keys needs the device key
describe('LoginGate.identifyGate — R42.5 no-token-only-login', () => {
  const keyed = { sshKeysGenerated: true };
  const fresh = { authMethod: 'none', playerToken: '' };

  it('a token alone does not log into an account that has keys', () => {
    expect(identifyGate(keyed, fresh, 'tok-a')).toBe('device-key-required');
  });
  it('a token-authenticated connection still has to prove the key', () => {
    expect(identifyGate(keyed, { authMethod: 'token', playerToken: 'tok-a' }, 'tok-a')).toBe('device-key-required');
  });
  it('a connection that proved the device key for THIS token proceeds', () => {
    expect(identifyGate(keyed, { authMethod: 'device-key', playerToken: 'tok-a' }, 'tok-a')).toBe('already-proven');
  });
  it('a key proven for another account does not carry over', () => {
    expect(identifyGate(keyed, { authMethod: 'device-key', playerToken: 'tok-b' }, 'tok-a')).toBe('device-key-required');
  });
  it('a new visitor (no profile) and an unfinished sign-up (no keys yet) are sign-ups', () => {
    expect(identifyGate(undefined, fresh, 'tok-new')).toBe('sign-up');
    expect(identifyGate({ sshKeysGenerated: false }, fresh, 'tok-half')).toBe('sign-up');
    expect(identifyGate({}, undefined, 'tok-legacy')).toBe('sign-up');
  });
});
