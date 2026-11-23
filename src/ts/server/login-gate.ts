/**
 * R42.5 no-token-only-login (Sprint 42, T42.5). Tron 2026-11-22/23: "no users automatically log in with a token
 * only" — "with a key only".
 *
 * A token names an account; it does not prove you own it (tokens travel in links, logs and old test scripts).
 * Once an account has keys (profile committed → sshKeysGenerated), IDENTIFY with its token only PARKS the
 * connection: nothing is sent about the account and the connection acts as nobody until it proves the device
 * key (DEVICE_AUTH: the welcome challenge signed with an enrolled device key) or enrolls this device with the
 * account's secret code (DEVICE_ENROLL_REQUEST). Only then is the parked IDENTIFY completed.
 * A token with no profile, or a profile without keys yet, is a sign-up in progress: there is no key to prove,
 * so it proceeds as before.
 */
export type IdentifyGate = 'sign-up' | 'device-key-required' | 'already-proven';

export interface GateProfile { sshKeysGenerated?: boolean }
export interface GateConnection { authMethod: string; playerToken: string }

// [impl:uuid:1a22f1be-3c5e-4333-b8e3-8d333ca34629] LoginGate.identifyGate — may this IDENTIFY log in without a key?
export function identifyGate(profile: GateProfile | undefined, conn: GateConnection | undefined, token: string): IdentifyGate {
  if (!profile || !profile.sshKeysGenerated) return 'sign-up';
  if (conn && conn.authMethod === 'device-key' && conn.playerToken === token) return 'already-proven';
  return 'device-key-required';
}
