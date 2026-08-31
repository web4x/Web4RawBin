// r4067 STALENESS GATE (PO BRIEF-server-perf-fix.md "the cure can be worse than the disease" — a wrong badge is worse
// than a slow one: slow is visible, wrong is not). The v0.8.150 fix added a WARM CR-owner reverse-index (getCrOwnerIndex,
// CR_INDEX_TTL_MS=5000). This gate proves that cache CANNOT go stale, on an ISOLATED scratch (never prod/shared tree).
//
// Two invalidation paths in the fix, gated here:
//   (#2 — the PO's #1 concern) EXTERNAL DISK CARRY: a unit written to disk UNDER the running server (exactly today's P0
//        14-units-carry + the T36.3 ~137/138-stale precedent) must be reflected via the SWR async rebuild within
//        CR_INDEX_TTL_MS + one async rebuild. This is the LOAD-BEARING arm (a warm cache with no disk-change invalidation
//        would have made today's carry look like it failed — a FALSE "fixed" to Tron).
//   (#1) SERVER CR write → noteCrWrite (covered by the reverse-index unit tests + reflected-next-request; the disk-carry
//        arm is the stronger, mechanism-independent proof and the one the precedents are about).
//
// ★ STUB-MUST-FAIL (a gate that cannot fail certifies nothing): a serverPatch DISABLES the SWR async rebuild in an
//   isolated scratch worktree (server.ts runs from source via tsx; patch applied BEFORE boot, torn down after) → the
//   external carry is NEVER reflected → RED. Proves the gate BINDS to the real invalidation mechanism.
// FREEZE-COMPLIANT: gate build only. Writes hit an isolated torn-down scratch (never :4444/prod/shared tree). No commit.
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TTL_MS = 5000; // == server CR_INDEX_TTL_MS (STATED bound; the SWR safety-net window for disk changes)
const scratchDir = () => fs.readdirSync('/tmp').filter((d) => d.startsWith(`r4031-scratch-${process.pid}-`)).map((d) => path.join('/tmp', d))[0] || null;
const shard = (root, u) => path.join(root, 'scenario/index', ...u.slice(0, 5).split(''), `${u}.scenario.json`);
// count ChangeRequest children the server reports for a node (what Tron's tree renders)
const crChildren = async (base, headers, uuid) => {
  const r = await fetch(`${base}/api/trace/children/${uuid}?mode=trace`, { headers });
  if (!r.ok) return -1;
  const kids = (await r.json()).children || [];
  return kids.filter((c) => c.type === 'ChangeRequest').length;
};
// write a ChangeRequest unit DIRECTLY to the scratch disk index (bypass the server = a pure external carry)
const carryCrToDisk = (dir, ownerUuid, crUuid) => {
  const p = shard(dir, crUuid);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({ ior: 'ior:class:ChangeRequest', model: { uuid: crUuid, name: 'staleness external-carry CR', status: 'Open' }, ownerIor: `ior:instance:${ownerUuid}` }, null, 2));
};
// stub-must-fail serverPatch: disable the SWR async rebuild so a post-TTL external carry can NEVER be reconciled
const DISABLE_SWR = (root) => {
  const f = path.join(root, 'src/ts/server/server.ts');
  let s = fs.readFileSync(f, 'utf8');
  const anchor = 'if ((Date.now() - crOwnerBuiltAt) > CR_INDEX_TTL_MS && !crOwnerRebuilding) {';
  if (!s.includes(anchor)) throw new Error('DISABLE_SWR: SWR anchor not found (server.ts changed — update the stub)');
  s = s.replace(anchor, 'if (false /* STALENESS STUB-MUST-FAIL: SWR rebuild disabled */ && (Date.now() - crOwnerBuiltAt) > CR_INDEX_TTL_MS && !crOwnerRebuilding) {');
  fs.writeFileSync(f, s);
};

// one arm: warm → external carry → wait past TTL + async rebuild → does the server reflect it?
async function externalCarryArm(f) {
  const dir = scratchDir();
  const T = f.seeded.qaReview;                                  // a real seeded Task = a valid CR owner
  const H = f.ownerHeaders();
  const base0 = await crChildren(f.base, H, T);                 // (a) warm the cache with T's current CR set (no carry yet)
  const crUuid = `4a4a4a4a-0000-4000-8000-${String(Date.now()).slice(-12).padStart(12, '0')}`;
  carryCrToDisk(dir, T, crUuid);                                // (b) EXTERNAL carry: CR appears on disk under the running server
  const immediate = await crChildren(f.base, H, T);            // (c) immediately: may be stale (SWR serves ≤TTL-stale now)
  await sleep(TTL_MS + 1500);                                   // (d) past the TTL window
  await crChildren(f.base, H, T);                              // (e) this post-TTL request TRIGGERS the async rebuild (serves stale, rebuilds off-path)
  await sleep(1500);                                           // (f) let the async rebuild (setImmediate) complete
  const afterTtl = await crChildren(f.base, H, T);            // (g) now the carry must be reflected (if invalidation works)
  return { base0, immediate, afterTtl, reflected: afterTtl > base0, crUuid };
}

const R = (v) => console.log(v);
let posResult = null, stubResult = null;
// ── POSITIVE: real fix (server runs HEAD source via tsx) → external carry MUST be reflected after TTL+rebuild ──
{
  const f = await setupFoundation();
  R(`positive scratch: ${f.base} v${f.servedVersion} sha=${f.worktreeSha}`);
  try { posResult = await externalCarryArm(f); }
  finally { const td = await f.teardown(); R(`  teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
  R(`  POSITIVE (fix intact): T CR-children base=${posResult.base0} → immediate=${posResult.immediate} → afterTTL=${posResult.afterTtl} | reflected=${posResult.reflected}`);
}
// ── STUB-MUST-FAIL: SWR rebuild disabled in an isolated scratch worktree → external carry NEVER reflected → RED ──
{
  const f = await setupFoundation({ serverPatch: DISABLE_SWR });
  R(`stub scratch (SWR rebuild disabled): ${f.base} v${f.servedVersion} sha=${f.worktreeSha}`);
  try { stubResult = await externalCarryArm(f); }
  finally { const td = await f.teardown(); R(`  teardown prodUp=${td.prodUp} leftover=${td.leftover}`); }
  R(`  STUB (SWR disabled): T CR-children base=${stubResult.base0} → afterTTL=${stubResult.afterTtl} | reflected=${stubResult.reflected} (MUST be false)`);
}

// ── verdict ──
const positivePass = posResult && posResult.base0 >= 0 && posResult.reflected === true;   // fix: carry reflected after TTL
const stubBites = stubResult && stubResult.base0 >= 0 && stubResult.reflected === false;   // stub: carry NEVER reflected → gate can fail
R(`\n═══ r4067 STALENESS GATE ═══`);
R(`DEFINITION: an EXTERNAL disk carry (unit written under the running server = the P0 14-units / T36.3 precedent) MUST be reflected within CR_INDEX_TTL_MS(${TTL_MS}ms)+one async rebuild via the SWR path. STATED bound. LOAD-BEARING: a wrong badge is worse than a slow one.`);
R(`  POSITIVE (fix): external carry reflected after TTL = ${positivePass}`);
R(`  STUB-MUST-FAIL (SWR rebuild disabled → NEVER reflected = the gate CAN fail): bites = ${stubBites}`);
const green = positivePass && stubBites;
R(`\nVERDICT: ${green ? 'GREEN — cache cannot go stale (external carry reconciled) + gate proven able-to-fail (SWR-disabled stub → RED)' : 'RED — ' + (!positivePass ? 'external carry NOT reflected after TTL on the real fix = a STALE-CACHE finding (a wrong badge Tron would never see is wrong)' : 'stub did NOT bite (SWR-disable did not make it stale) = the gate is VACUOUS, fix the gate before trusting a green')}`);
process.exit(green ? 0 : 1);
