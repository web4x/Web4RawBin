/**
 * R40.107 ROOM-PERSIST INVARIANT gate (architect 58175f768, guard #5 — the class-killer). Enforce, do NOT document.
 *
 * The incident: Room.persist()->writeRoomJson serialized `name: m.name` (blanked a good stored member name when the
 * in-memory member was profile-less) + `joinedAt: Date.now()` / a reconstructed createdAt (churned creation facts),
 * corrupting 9 rooms. These guards make that class impossible. This gate proves they BITE:
 *   #5-BITE: a room write that would blank a stored non-empty name, or move createdAt, is REFUSED (throws).
 *   #1:      preserveRoomIdentity substitutes the stored non-empty name over an in-memory "" (never blanks).
 *   #2:      createdAt + each member's original joinedAt are preserved across re-persist.
 * stub-must-fail: remove guard #5 (the throws) -> the two BITE assertions stop throwing -> this gate exits 1 (RED).
 */
import { preserveRoomIdentity, assertRoomPersistInvariant, type RoomJsonData } from '../src/ts/server/RoomKeys.js';

const fail = (m: string): never => { console.error(`✗ ${m}`); process.exit(1); };
const throws = (fn: () => void): boolean => { try { fn(); return false; } catch { return true; } };

const stored: RoomJsonData = {
  ownerToken: 'own', isPrivate: false, roomKey: '', state: 'active', createdAt: 1788693405565,
  sshKeysGenerated: false, sshPublicKey: '', chatHistory: [],
  members: [{ ior: 'ior:instance:c09087ec', name: 'Marcel Donges', joinedAt: 1788693405565 }],
};
const mk = (over: Partial<RoomJsonData>): RoomJsonData => ({ ...stored, members: [{ ior: 'ior:instance:c09087ec', name: 'Marcel Donges', joinedAt: 1788693405565 }], ...over });

// --- #5 BITE: a blanking / createdAt-moving write must be REFUSED (throws) ---
if (!throws(() => assertRoomPersistInvariant(stored, mk({ members: [{ ior: 'ior:instance:c09087ec', name: '' }] }), 'r'))) {
  fail('#5 BITE: a name-blanking write (Marcel Donges -> "") was NOT refused — guard #5 regressed (the incident could recur).');
}
if (!throws(() => assertRoomPersistInvariant(stored, mk({ createdAt: 1788735733886 }), 'r'))) {
  fail('#5 BITE: a createdAt-moving write (1788693405565 -> 1788735733886) was NOT refused — guard #5 regressed.');
}

// --- #5 must NOT false-positive: a legit save (name kept, createdAt same) is allowed ---
if (throws(() => assertRoomPersistInvariant(stored, mk({}), 'r'))) fail('#5 false-positive: refused a legitimate unchanged save.');
if (throws(() => assertRoomPersistInvariant(stored, mk({ members: [{ ior: 'ior:instance:c09087ec', name: 'Marcel Donges Renamed' }] }), 'r'))) fail('#5 false-positive: refused a legitimate rename.');
if (throws(() => assertRoomPersistInvariant(null, mk({}), 'r'))) fail('#5 false-positive: refused a first-ever persist (no stored).');

// --- #1: preserveRoomIdentity substitutes the stored non-empty name over an empty in-memory name ---
const d1 = mk({ members: [{ ior: 'ior:instance:c09087ec', name: '' }] });
preserveRoomIdentity(stored, d1);
if (d1.members![0].name !== 'Marcel Donges') fail(`#1 non-destructive name: empty in-memory name was not restored from stored (got "${d1.members![0].name}").`);

// --- #2: createdAt + joinedAt preserved across re-persist (never Date.now()-reset) ---
const d2 = mk({ createdAt: 1788735733886, members: [{ ior: 'ior:instance:c09087ec', name: 'Marcel Donges', joinedAt: 9999999999999 }] });
preserveRoomIdentity(stored, d2);
if (d2.createdAt !== 1788693405565) fail(`#2 immutable createdAt: not preserved (got ${d2.createdAt}).`);
if (d2.members![0].joinedAt !== 1788693405565) fail(`#2 immutable joinedAt: not preserved (got ${d2.members![0].joinedAt}).`);

// --- and #1 THEN #5 together = the real writeRoomJson path: a profile-less blank save SUCCEEDS with the name preserved (not refused) ---
const d3 = mk({ members: [{ ior: 'ior:instance:c09087ec', name: '' }] });
preserveRoomIdentity(stored, d3);
if (throws(() => assertRoomPersistInvariant(stored, d3, 'r'))) fail('#1+#5: after #1 restores the name, #5 wrongly still refused (the common profile-less save must succeed, not be blocked).');

console.log('✓ R40.107 room-persist invariant: #5 refuses name-blank + createdAt-move; #1/#2 preserve identity; legit saves pass.');
