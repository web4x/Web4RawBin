/**
 * R1 AC1 gate (PO ruling 2026-09-29) — listRoomsForOwner must ASK Room.resolveToken, not exact-match tokens. A room's
 * creatorToken and a session's token can be DIFFERENT tokens resolving to the SAME person (multi-token identity). The
 * owner must see his private room via ANY token that resolves to him; a non-owner (incl. one resolving elsewhere) NEVER.
 * BOTH directions, stub-must-fail: revert listRoomsForOwner to `===` → (a) fails (alias excluded) → RED.
 * RIG + SYNTHETIC tokens only — zero prod identity, zero Tron data, no persist (rooms injected, never createRoom).
 */
import { RoomManager, Room } from '../src/ts/server/Room.js';

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const OWNER = 'owner-primary-0000', ALIAS = 'owner-alias-1111', OTHER = 'other-token-2222';
const saved = Room.resolveToken;
// synthetic resolver: ALIAS resolves to OWNER (same person, different token); OTHER resolves to a DIFFERENT primary; else identity.
Room.resolveToken = (t) => (t === ALIAS ? OWNER : t === OTHER ? 'other-primary-3333' : t);
try {
  const mgr = new RoomManager();
  const creator = { id: 'creator', ws: null, name: '', avatarUrl: '', playerToken: OWNER, disconnected: false };
  const room = new Room('AC1 test room', creator, { id: 'ac1-test-room', isPrivate: true, creatorToken: OWNER });
  mgr.rooms.set(room.id, room); // inject WITHOUT persist (createRoom would write to disk); rooms map is runtime-accessible
  const ids = (tok) => mgr.listRoomsForOwner(tok).map(r => r.id);

  // (a) THE BUG, reproduced-then-fixed: a session token that RESOLVES to the owner (NOT equal) SEES the private room.
  if (!ids(ALIAS).includes('ac1-test-room')) fail('AC1(a): a token RESOLVING to the owner did NOT see the owner\'s private room — exact-match regression (the flap-replacement bug: consistently absent).');
  if (!ids(OWNER).includes('ac1-test-room')) fail('AC1: the owner\'s exact token did not see its own room.');

  // (b) a NON-owner, INCLUDING one resolving to somebody ELSE, NEVER sees it (the guard against leaking a private room).
  if (ids(OTHER).includes('ac1-test-room')) fail('AC1(b): a non-owner token (resolving to a DIFFERENT primary) SAW the private room — private-room LEAK (far worse than the flap).');
  if (ids('unrelated-9999').includes('ac1-test-room')) fail('AC1(b): an unrelated token saw the private room — leak.');

  console.log('✓ R1 AC1: listRoomsForOwner asks Room.resolveToken — a token RESOLVING to the owner sees the private room; a non-owner (incl. one resolving elsewhere) never does.');
} finally { Room.resolveToken = saved; }
