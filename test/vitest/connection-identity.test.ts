/**
 * R42.5 close-auth-gaps — chain: R42.5 → UC room.createWithConnectionIdentity → RoomAuth.createRoomWithConnectionIdentity
 */
import { describe, it, expect } from 'vitest';
import { createRoomWithConnectionIdentity as resolve } from '../../src/ts/server/connection-identity';

const ME = '11111111-aaaa-4bbb-8ccc-000000000001';
const OTHER = '22222222-aaaa-4bbb-8ccc-000000000002';
const MY_OLD = '33333333-aaaa-4bbb-8ccc-000000000003'; // a tombstone that redirects to ME

// [test:uuid:9c2033b5-1023-4916-ad79-b2fa7ef2fb34] test:RoomAuth.createRoomWithConnectionIdentity
describe('R42.5 RoomAuth.createRoomWithConnectionIdentity', () => {
  it('AC connection-identity: acts as the connection identity when the message names no token', () => {
    expect(resolve(ME, undefined)).toEqual({ token: ME });
  });

  it('accepts a message that names the connection own token', () => {
    expect(resolve(ME, ME)).toEqual({ token: ME });
  });

  it('refuses a message that names a foreign playerToken', () => {
    expect(resolve(ME, OTHER)).toEqual({ token: '', error: 'Identity mismatch' });
  });

  it('refuses a connection that never identified, whatever token the message claims', () => {
    expect(resolve('', OTHER)).toEqual({ token: '', error: 'Not identified' });
    expect(resolve(undefined, undefined).error).toBe('Not identified');
  });

  it('accepts a pre-redirect token of the same person (client not reloaded yet)', () => {
    const toPrimary = (t: string) => (t === MY_OLD ? ME : t);
    expect(resolve(ME, MY_OLD, toPrimary)).toEqual({ token: ME });
    expect(resolve(ME, OTHER, toPrimary).error).toBe('Identity mismatch');
  });
});
