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
import { preserveRoomIdentity, assertRoomPersistInvariant, setGuardResolveToken, type RoomJsonData } from '../src/ts/server/RoomKeys.js';

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

// --- #6 IDENTITY-AWARE MEMBER-DROP — failable BOTH directions (inject a resolver: stub → primary) ---
setGuardResolveToken((t) => (t === 'stub-8f74' ? 'primary-c090' : t)); // stub-8f74 redirects to primary-c090; others are their own primary
const M = (ior: string, name = 'x') => ({ ior: `ior:instance:${ior}`, name });
const room = (iors: string[]): RoomJsonData => ({ ownerToken: 'o', isPrivate: false, roomKey: '', state: 'active', createdAt: 100, sshKeysGenerated: false, sshPublicKey: '', chatHistory: [], members: iors.map((i) => M(i)) });
const storedRoom = room(['primary-c090', 'stub-8f74', 'distinct-abcd']);
// (a) drop the STUB whose primary (primary-c090) is still present → ALLOWED (benign consolidation, no brick)
if (throws(() => assertRoomPersistInvariant(storedRoom, room(['primary-c090', 'distinct-abcd']), 'r'))) fail('#6: dropping a redirect STUB whose primary is present was REFUSED — this bricks legitimate consolidation (the 49-room hazard).');
// (b) drop a DISTINCT identity with no redirect → REFUSED (real silent drop)
if (!throws(() => assertRoomPersistInvariant(storedRoom, room(['primary-c090', 'stub-8f74']), 'r'))) fail('#6 BITE: dropping a DISTINCT no-redirect member (distinct-abcd) was NOT refused — a real silent identity drop could persist.');
// (b2) drop the stub AND its primary together → REFUSED (identity fully vanished)
if (!throws(() => assertRoomPersistInvariant(storedRoom, room(['distinct-abcd']), 'r'))) fail('#6 BITE: dropping a stub whose primary ALSO vanished was NOT refused.');
// (c) PARTIAL-WRITE FIX (all CREATE_ROOM broke since v0.8.212): a members-OMITTED write (explicitMembers=false) must NOT be
// read as "drop all" — writeRoomJson preserves stored members on omit, so #6 runs ONLY on an explicit members write.
if (throws(() => assertRoomPersistInvariant(storedRoom, room(['primary-c090', 'stub-8f74']), 'r', false))) fail('#6 PARTIAL-WRITE: a members-omitted (explicitMembers=false) write was REFUSED — the false-positive that bricked every CREATE_ROOM is back.');
// stub-must-fail teeth: the SAME drop shape as an EXPLICIT members write (explicitMembers=true) STILL refuses (remove the explicitMembers guard → the partial case above would refuse → RED).
if (!throws(() => assertRoomPersistInvariant(storedRoom, room(['primary-c090', 'stub-8f74']), 'r', true))) fail('#6 EXPLICIT teeth: the same distinct-drop as an EXPLICIT write must STILL refuse — the drop-detection lost its teeth.');
setGuardResolveToken(null); // restore uninjected default (drop-check skipped → no brick)
if (throws(() => assertRoomPersistInvariant(storedRoom, room(['primary-c090']), 'r'))) fail('#6: with NO resolver injected, the drop-check must be SKIPPED (never brick an unclassifiable save).');

console.log('✓ R40.107 room-persist invariant: #5 refuses name-blank + createdAt-move; #1/#2 preserve identity; #6 allows stub-consolidation + refuses distinct-identity drop (both directions); legit saves pass.');
