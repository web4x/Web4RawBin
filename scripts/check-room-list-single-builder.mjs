/**
 * R1 LOBBY-FLAP gate — every MSG.ROOM_LIST send goes through the ONE owner-aware builder roomListFor(token).
 * The flap shipped because the welcome sent an owner-UNAWARE list (public-only, pre-auth) that the post-auth
 * owner-aware list then corrected — the owner's private/owned rooms "appeared" seconds later. Fix = one builder,
 * emitted after auth; no competing owner-unaware send. This gate makes a regression structurally catchable.
 * stub-must-fail: re-add a `{ type: MSG.ROOM_LIST, rooms: enrichRoomList(roomManager.listRooms(...)) }` (owner-unaware)
 * send → this gate exits 1 (RED). (server.ts is 400KB+ with a NUL byte → read via node, never bash grep.)
 */
import { readFileSync } from 'node:fs';

const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };
const src = readFileSync(new URL('../src/ts/server/server.ts', import.meta.url), 'utf8');
const sends = src.split('\n').map((l, i) => ({ l, n: i + 1 })).filter(x => /type:\s*MSG\.ROOM_LIST\s*,\s*rooms:/.test(x.l));

if (sends.length === 0) fail('no MSG.ROOM_LIST send found — pattern drift, the gate would be blind.');
for (const { l, n } of sends) {
  if (!/roomListFor\(/.test(l)) {
    fail(`ROOM_LIST send at server.ts:${n} does NOT use the ONE owner-aware builder roomListFor(...) — an owner-unaware list is the lobby flap (private/owned rooms appear/vanish):\n  ${l.trim()}`);
  }
}
console.log(`✓ R1 lobby single-builder: all ${sends.length} MSG.ROOM_LIST send(s) use roomListFor(...) (owner-aware); no premature owner-unaware list remains.`);
