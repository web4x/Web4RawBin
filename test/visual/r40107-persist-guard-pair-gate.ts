// R40.107 PERSIST-GUARD PAIR (#5+#6) — INDEPENDENT gate (PO: builder's read doesn't count). Both directions each,
// using the REAL profiles.json redirect resolver + REAL rooms on disk, plus a constructed malignant case, plus the
// no-brick proof (every real room still saves). Closes the class that could make REAL PEOPLE VANISH from Tron's rooms.
import { preserveRoomIdentity, assertRoomPersistInvariant, setGuardResolveToken, type RoomJsonData } from '../../src/ts/server/RoomKeys.js';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const throws = (fn: () => void): boolean => { try { fn(); return false; } catch { return true; } };
let bad = 0; const ok = (c: boolean, m: string) => { if (!c) { console.error('  ✗ ' + m); bad++; } else console.log('  ✓ ' + m); };

// ── REAL resolver from data/profiles.json (chained redirectTo → primary), injected into guard #6 ──
const profs = JSON.parse(readFileSync(`${REPO}/data/profiles.json`, 'utf8'));
const arr: any[] = Array.isArray(profs) ? profs : Object.values(profs);
const redir: Record<string, string> = {};
for (const e of arr) { const t = e.playerToken || e.token || e.uuid; if (t && e.redirectTo) redir[t] = e.redirectTo; }
const resolveToken = (t: string): string => { let c = t; const seen = new Set<string>(); while (redir[c] && !seen.has(c)) { seen.add(c); c = redir[c]; } return c; };
setGuardResolveToken(resolveToken);
const bareTok = (ior: string): string => String(ior || '').replace('ior:instance:', '').split('@')[0];

// ── load every real room on disk ──
const paths = execSync(`grep -rlE '"ior": "ior:class:Room"' ${REPO}/scenario/index 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const rooms = paths.map(p => { try { return JSON.parse(readFileSync(p, 'utf8')).model as RoomJsonData & { uuid: string }; } catch { return null; } }).filter(Boolean) as any[];
const byUuid = (u8: string) => rooms.find(r => String(r.uuid || '').startsWith(u8));
const drop = (r: any, tok8: string) => ({ ...r, members: (r.members || []).filter((m: any) => !bareTok(m.ior).startsWith(tok8)) });

console.log('=== #5 — destructive identity writes REFUSED, normal ALLOWED ===');
const s5: RoomJsonData = { ownerToken: 'o', isPrivate: false, roomKey: '', state: 'active', createdAt: 1788693405565, sshKeysGenerated: false, sshPublicKey: '', chatHistory: [], members: [{ ior: 'ior:instance:c09087ec', name: 'Marcel Donges', joinedAt: 1788693405565 }] };
const mk = (o: Partial<RoomJsonData>): RoomJsonData => ({ ...s5, members: [{ ior: 'ior:instance:c09087ec', name: 'Marcel Donges', joinedAt: 1788693405565 }], ...o });
ok(throws(() => assertRoomPersistInvariant(s5, mk({ members: [{ ior: 'ior:instance:c09087ec', name: '' }] }), 'r')), '#5 name-blank (Marcel→"") REFUSED');
ok(throws(() => assertRoomPersistInvariant(s5, mk({ createdAt: 1788735733886 }), 'r')), '#5 createdAt-move REFUSED');
ok(!throws(() => assertRoomPersistInvariant(s5, mk({}), 'r')), '#5 normal unchanged save ALLOWED (no false-positive)');

console.log('\n=== #6 ALLOW — the 4 REAL benign consolidations (stub dropped, primary present) must still save ===');
const CONS: Array<[string, string, string, string]> = [
  ['2b1921a9', '5e5471fe', '4af41484', 'Christine Dawood'],
  ['3ec1bf6e', '8f74dfba', 'c09087ec', 'GRG TREFF'],
  ['6c04f959', '8f74dfba', 'c09087ec', 'Heartspaces'],
  ['8be52aa9', '3effa1fc', 'c09087ec', 'Marcel Donges Room'],
];
for (const [u8, stub8, prim8, nm] of CONS) {
  const r = byUuid(u8); if (!r) { ok(false, `${nm}: room not found`); continue; }
  const hasStub = (r.members || []).some((m: any) => bareTok(m.ior).startsWith(stub8));
  const hasPrim = (r.members || []).some((m: any) => bareTok(m.ior).startsWith(prim8));
  if (!hasStub) { console.log(`  · ${nm}: ${stub8} not a stored member (owner-only) — resolver check: ${stub8}→${resolveToken((r.members||[]).map((m:any)=>bareTok(m.ior)).find((t:string)=>t.startsWith(prim8))||prim8).slice(0,8)}`); continue; }
  ok(hasPrim && !throws(() => assertRoomPersistInvariant(r, drop(r, stub8), r.uuid)), `${nm}: drop stub ${stub8} (primary ${prim8} present) ALLOWED — no brick`);
}

console.log('\n=== #6 REFUSE — malignant drops (real silent-drop class) ===');
// distinct identity with NO redirect: drop a real named member that has no redirectTo
const grg = byUuid('3ec1bf6e');
const distinct = (grg?.members || []).map((m: any) => bareTok(m.ior)).find((t: string) => !redir[t] && resolveToken(t) === t && !t.startsWith('c09087ec'));
ok(!!distinct && throws(() => assertRoomPersistInvariant(grg, drop(grg, distinct!.slice(0, 8)), grg.uuid)), `distinct no-redirect member (${(distinct||'?').slice(0,8)}) dropped → REFUSED`);
// primary-absent: drop BOTH the stub and its primary
const hs = byUuid('6c04f959');
ok(throws(() => assertRoomPersistInvariant(hs, { ...hs, members: (hs.members || []).filter((m: any) => { const t = bareTok(m.ior); return !t.startsWith('8f74dfba') && !t.startsWith('c09087ec'); }) }, hs.uuid)), 'stub 8f74dfba + its primary c09087ec BOTH dropped → REFUSED');

console.log('\n=== NO-BRICK — every real room still saves (answers the 49-room brick warning) ===');
let saveable = 0, bricked: string[] = [];
for (const r of rooms) {
  const clone: RoomJsonData = JSON.parse(JSON.stringify(r));
  // the real re-persist path: preserveRoomIdentity (#1/#2) then assert (#5/#6) on the SAME members = a benign save
  preserveRoomIdentity(r, clone);
  if (throws(() => assertRoomPersistInvariant(r, clone, r.uuid))) bricked.push(String(r.uuid).slice(0, 8)); else saveable++;
}
ok(bricked.length === 0, `all ${rooms.length} rooms saveable on a benign re-persist (bricked: ${bricked.length ? bricked.join(',') : 'none'})`);

console.log('\n=== #6 LIVE-WIRING — is the resolver INJECTED in production? (else #6 is INERT on the running server) ===');
// guardResolveToken can ONLY be set via setGuardResolveToken. If no PRODUCTION code calls it, it stays null on the
// running server → RoomKeys #6 SKIPS the drop-check (its own comment) → the silent-drop hazard is NOT closed live.
// grep the COMMITTED HEAD source (the served-build truth) — NOT the working tree, which churns under active edits/rewinds.
const callers = execSync(`git -C ${REPO} grep -l 'setGuardResolveToken' HEAD -- src 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean).map(l => l.replace(/^HEAD:/, ''));
const prodCallers = callers.filter(f => !f.endsWith('RoomKeys.ts')); // RoomKeys only DEFINES it; a caller must INJECT it
const logicGreen = bad === 0;
ok(prodCallers.length > 0, `production code injects the resolver (server startup) — else #6 drop-check is SKIPPED live. prod callers: ${prodCallers.length ? prodCallers.map(f=>f.replace(REPO+'/','')).join(', ') : 'NONE — #6 INERT on prod'}`);

console.log(`\n=== PAIR VERDICT (#5+#6, independent, real resolver + real rooms, live-wiring) ===`);
if (logicGreen && prodCallers.length > 0) console.log(`GREEN — #5 live; #6 logic correct AND injected in production; ${saveable}/${rooms.length} rooms saveable (no brick). Silent-drop hazard CLOSED live.`);
else if (logicGreen && prodCallers.length === 0) console.log(`★ RED (LIVE) — #6 LOGIC is correct (both directions, ${saveable}/${rooms.length} no-brick) BUT the resolver is NEVER injected in production (only in test gates) → #6 drop-check is SKIPPED on the running server → the silent-drop hazard is NOT closed live. Expert must wire server.ts→setGuardResolveToken(Room.resolveToken chain) at startup; re-gate then.`);
else console.log(`RED — ${bad} logic assertion(s) failed`);
process.exit(bad === 0 && prodCallers.length > 0 ? 0 : 1);
