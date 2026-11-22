/**
 * R42.5 connection-identity (Sprint 42, T42.5).
 *
 * A room action acts as the identity this CONNECTION authenticated with at IDENTIFY, never as a token the
 * message claims. Before this, CREATE_ROOM / JOIN_ROOM took msg.playerToken first and re-bound tokenToClient
 * to it, so any socket could create or join a room as anyone whose token it knew (e.g. the public
 * SystemTester token). A message naming a DIFFERENT token is refused; one naming none (or its own) proceeds
 * as the connection's identity. DELETE_ROOM already resolved the connection identity this way.
 */
export interface ConnectionIdentity { token: string; error?: string }

// [impl:uuid:3dcc4b87-b940-4235-887e-908d7bc4d3dd] RoomAuth.createRoomWithConnectionIdentity — resolve who a room action acts as
export function createRoomWithConnectionIdentity(connectionToken: string | undefined, claimedToken: string | undefined, toPrimary: (t: string) => string = (t) => t): ConnectionIdentity {
  const conn = connectionToken || '';
  if (!conn) return { token: '', error: 'Not identified' };
  // a client that has not reloaded yet may still send its pre-redirect token: same person, so accept it
  if (claimedToken && claimedToken !== conn && toPrimary(claimedToken) !== conn) return { token: '', error: 'Identity mismatch' };
  return { token: conn };
}

/** Same rule for every room action (CREATE_ROOM, JOIN_ROOM). */
export const resolveConnectionIdentity = createRoomWithConnectionIdentity;
