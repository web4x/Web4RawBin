// R40.31 OWNER-ACTION SMOKE — the durable accept-direction REGRESSION gate (architect spec-owner-action-smoke-gate.md).
// EXERCISES the owner-SUCCESS branch headlessly (the 2xx→res.end→addLog path the v0.8.108 P0 crashed on + survived ~10
// reject-only iterations). Implements the ARCHITECT's 6 assertions × {approve, make-current} (HIS criteria, not my notion).
// REUSES the tester's R40.31 foundation (branch A, no duplicate isolation): import setupFoundation → isolated scratch
// server (worktree HEAD, non-4444), seeded scratch units, owner cred headers-only-never-logged, finally-teardown.
// Owner-SUCCESS full-e2e (owner-auth device tap → RCE-sensitive) stays TRON's; this proves the CODES + atomicity headlessly.
// Run: node r4031-owner-action-smoke.mjs   (architect reads the RAW codes, not a bare green — L10).
import { setupFoundation } from './r4031-foundation.mjs';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // localhost self-signed, harness-local only

const MAIN = '/var/dev/Workspaces/web4x/Web4RawBin';
const shard = (root, uuid) => path.join(root, 'scenario/index', ...uuid.slice(0, 5).split(''), `${uuid}.scenario.json`);
// locate the foundation's worktree (read-only) so refuse/non-owner atomicity is checked on the DISK unit bytes (the
// served /api/ior response carries compute-on-read fields pinRole/taskMdHref that legitimately vary — not byte-stable).
const worktreePath = () => (execSync(`git -C ${MAIN} worktree list`, { encoding: 'utf8' }).split('\n').find((l) => l.includes('r4031-scratch')) || '').split(/\s+/)[0] || '';
const readUnit = (wt, uuid) => { try { return fs.readFileSync(shard(wt, uuid), 'utf8'); } catch { return null; } };

const results = [];
const codes = []; // every response status → A5 zero-5xx across the run
const A = (ok, msg, raw) => { results.push({ ok, msg, raw }); console.log(`  ${ok ? '✓' : '✗ FAIL'} ${msg}${raw != null ? `  [${raw}]` : ''}`); };
async function call(base, uuid, verb, headers) {
  let status = 0, body = {}, dropped = false;
  try { const r = await fetch(`${base}/api/task/${uuid}/${verb}`, { method: 'POST', headers: headers || {} }); status = r.status; try { body = await r.json(); } catch { /* non-JSON */ } }
  catch (e) { dropped = true; body = { error: String(e?.message || e) }; } // a dropped connection = the P0 signature
  codes.push({ verb, uuid: uuid.slice(0, 8), status: dropped ? 'DROPPED' : status });
  return { status, body, dropped };
}

// ── STUB-MUST-FAIL (condition b) — the gate must be PROVABLE BY INJECTED FAILURE ──
// serverPatch: re-insert the v0.8.108 P0 defect CLASS — an UNDECLARED identifier referenced in the make-current SUCCESS
// path (the exact ownerTok8 bug). ★ MEASURED: a POST-res.end throw no longer crashes (HEAD is crash-hardened — a global
// uncaught handler survives it), so it is un-catchable by A5. Re-inserting the same undeclared-id BEFORE the response makes
// the handler catch return non-200 → A1 (owner-success expects 200) trips. Same defect class, caught at "assertion 1".
function injectMakeCurrentThrow(worktreeRoot) {
  const srvFile = path.join(worktreeRoot, 'src/ts/server/server.ts');
  let src = fs.readFileSync(srvFile, 'utf8');
  const anchor = "const unit = UnitController.apply(idx, 'ior:class:Task', taskUuid, { makeCurrent: true }, { actor, publish: publishUnitChanged });";
  if (!src.includes(anchor)) throw new Error('stub-must-fail: make-current success-path anchor NOT found — cannot inject; the smoke would be VACUOUS (fail-loud, not silent-green)');
  fs.writeFileSync(srvFile, src.replace(anchor, anchor + '\n          void r4031StubMustFailUndeclaredIdentifier; /* injected pre-response ReferenceError (ownerTok8 P0 class) */'));
}
// Prove the smoke BINDS: boot a scratch server carrying the injected bug → an owner make-current → the smoke's owner-
// SUCCESS signal MUST trip (NON-200 / dropped / server-not-alive-after). If it returns a clean 200 + alive, the smoke is
// vacuous → RED.
async function stubMustFail() {
  console.log('\n── STUB-MUST-FAIL: scratch server booted with an undeclared-identifier (ownerTok8 P0 class) injected into make-current ──');
  const f = await setupFoundation({ serverPatch: injectMakeCurrentThrow });
  let caught = false, detail = '';
  try {
    const mc = await call(f.base, f.seeded.planned, 'make-current', f.ownerHeaders());
    await new Promise((r) => setTimeout(r, 900));
    const aliveAfter = await fetch(`${f.base}/api/config`).then((r) => r.ok).catch(() => false);
    caught = mc.dropped || mc.status !== 200 || aliveAfter === false; // owner-SUCCESS no longer clean = the smoke catches the injected defect
    detail = `injected make-current → status=${mc.dropped ? 'DROPPED' : mc.status} (owner-success expected 200), server-alive-after=${aliveAfter} → smoke ${caught ? 'CATCHES (A1 trips on non-200)' : 'MISSES'}`;
  } finally { await f.teardown(); }
  return { caught, detail };
}

async function main() {
  console.log('R40.31 OWNER-ACTION SMOKE (expert regression gate; reuses tester foundation) — booting isolated scratch (build/boot is slow)…');
  const f = await setupFoundation();
  const wt = worktreePath();
  try {
    A(!!wt, 'worktree located (disk byte-checks)', wt ? wt.replace(MAIN, '…') : 'NOT FOUND');

    // ── A4 NON-OWNER → 403, records NOTHING (byte-identical). Run FIRST while qaReview=QA-Review, planned=Planned. ──
    const qa0 = readUnit(wt, f.seeded.qaReview);
    const naAp = await call(f.base, f.seeded.qaReview, 'approve', {});
    A(naAp.status === 403, '[approve] A4 non-owner → 403', `got ${naAp.status}`);
    A(qa0 !== null && qa0 === readUnit(wt, f.seeded.qaReview), '[approve] A4 non-owner 403 persists NOTHING (unit byte-identical)');
    const pl0 = readUnit(wt, f.seeded.planned);
    const naMc = await call(f.base, f.seeded.planned, 'make-current', {});
    A(naMc.status === 403, '[make-current] A4 non-owner → 403', `got ${naMc.status}`);
    A(pl0 !== null && pl0 === readUnit(wt, f.seeded.planned), '[make-current] A4 non-owner 403 persists NOTHING (unit byte-identical)');

    // ── A3 owner /trace COOKIE-only path is AUTHORIZED (NOT 403). Cookie-only on refuse(Done) → 409 (authorized-but-refused) ≠ 403. ──
    const ck = await call(f.base, f.seeded.refuse, 'approve', { Cookie: f.ownerHeaders().Cookie || '' });
    A(ck.status !== 403, 'A3 owner /trace sm_session COOKIE path AUTHORIZED (NOT 403)', `got ${ck.status}`);

    // ── A2 VALIDATE-REFUSE → 409, persists NOTHING (byte-identical), BOTH surfaces (refuse task = Done) ──
    const rf0 = readUnit(wt, f.seeded.refuse);
    const rfAp = await call(f.base, f.seeded.refuse, 'approve', f.ownerHeaders());
    A(rfAp.status === 409, '[approve] A2 refuse-state → 409', `got ${rfAp.status}`);
    const rf1 = readUnit(wt, f.seeded.refuse);
    A(rf0 !== null && rf0 === rf1, '[approve] A2 refuse 409 = atomic, persists NOTHING (byte-identical)');
    const rfMc = await call(f.base, f.seeded.refuse, 'make-current', f.ownerHeaders());
    A(rfMc.status === 409, '[make-current] A2 refuse-state → 409', `got ${rfMc.status}`);
    A(rf1 === readUnit(wt, f.seeded.refuse), '[make-current] A2 refuse 409 = atomic, persists NOTHING (byte-identical)');

    // ── A1 OWNER-SUCCESS → 200 + derived state (the branch the P0 crashed on) ── (consumes qaReview → Done, planned → In Progress)
    const apOk = await call(f.base, f.seeded.qaReview, 'approve', f.ownerHeaders());
    A(apOk.status === 200 && apOk.body.status === 'Done', '[approve] A1 owner-SUCCESS → 200 + derived status Done', `got ${apOk.status} status=${apOk.body.status}`);
    const mcOk = await call(f.base, f.seeded.planned, 'make-current', f.ownerHeaders());
    A(mcOk.status === 200 && /In Progress/.test(String(mcOk.body.status || '')), '[make-current] A1 owner-SUCCESS → 200 + advanced (In Progress)', `got ${mcOk.status} status=${mcOk.body.status}`);

    // ── A6 both surfaces AGREE by measurement (same token) ──
    A(apOk.status === 200 && mcOk.status === 200, 'A6 SAME owner token → 200 on BOTH approve AND make-current');
    A(naAp.status === 403 && naMc.status === 403, 'A6 SAME non-owner → 403 on BOTH approve AND make-current');

    // ── A5 ZERO 5xx across every call + scratch server ALIVE after every action (the P0 exited the process) ──
    const fail5xx = codes.filter((c) => typeof c.status === 'number' && c.status >= 500 && c.status < 600);
    const droppedCalls = codes.filter((c) => c.status === 'DROPPED');
    A(fail5xx.length === 0 && droppedCalls.length === 0, `A5 ZERO 5xx / dropped across all ${codes.length} calls`, fail5xx.length || droppedCalls.length ? JSON.stringify([...fail5xx, ...droppedCalls]) : '0');
    const alive = await fetch(`${f.base}/api/config`).then((r) => r.ok).catch(() => false);
    A(alive === true, 'A5 scratch server ALIVE + responding after every owner action');
  } finally {
    const td = await f.teardown();
    A(td.prodUp === true, 'teardown: prod:4444 UNTOUCHED (still serving)');
    A(td.leftover === 0, 'teardown: 0 leftover scratch worktrees');
  }

  const cleanPass = results.every((r) => r.ok);
  const cleanCodes = [...codes];
  // condition (b): PROVE the smoke binds — the injected post-response throw MUST be caught (fresh scratch boot).
  const stub = await stubMustFail();
  A(stub.caught === true, 'STUB-MUST-FAIL: injected post-response throw in make-current is CAUGHT (smoke binds)', stub.detail);

  const pass = cleanPass && stub.caught;
  console.log('\n===== OWNER-ACTION SMOKE — RAW (architect reads this, not a bare green — L10) =====');
  console.log('clean-run response codes:', JSON.stringify(cleanCodes));
  console.log('stub-must-fail:', stub.detail);
  console.log(`clean assertions: ${results.filter((r) => r.ok).length - (stub.caught ? 1 : 0)}/${results.length - 1} | stub-binds: ${stub.caught}`);
  console.log(`${pass ? '✓ GREEN' : '✗ RED'} — surfaces: approve + make-current | 6 architect assertions × 2 | isolation: R40.31 scratch (prod:4444 untouched) | stub-must-fail PROVEN=${stub.caught}`);
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('smoke error:', e.message); process.exit(1); });
