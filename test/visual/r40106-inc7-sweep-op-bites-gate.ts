// [test:uuid:dc61acd6-b43c-4128-805b-cb625770254c] R40.106 AC-sanctioned-sweep-op-list-not-filter — sweep-op + orphan-only-tripwire bites (covers Impl 4be791e3 sweepEnumerated)
// COMMITTED sweep-op/tripwire bite gate — RUNS ON THE ISOLATED SCRATCH-WORKTREE RIG (git worktree + additive EOF export of the fns, boots server.ts in-process). Signed: step-2 54978124d + tripwire 95a38d1f0. See anchor. Not a prod/standalone gate — needs the rig harness setup.
// (i) HARNESS: drive sweepEnumerated (a)-(e) IN-PROCESS on the real shipped fns (imported via the ONE additive EOF export).
// Logic-tested==logic-shipped is proven by the architect's whole-file diff (must be exactly the one export line).
// Runs from the worktree (cwd); creates synthetic test units on the worktree scenario/index (fns use __dirname→worktree).
import { sweepEnumerated, deleteUnitWithScan } from '../../src/ts/server/server.js';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path'; import crypto from 'node:crypto'; import { randomUUID } from 'node:crypto';
const REPO = process.cwd();
const IDX = path.join(REPO, 'scenario/index');
const shard = (u: string) => path.join(IDX, ...u.slice(0, 5).split(''), u + '.scenario.json');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mkUnit = (opts: { protected?: boolean; owner?: string }) => {
  const u = randomUUID();
  const model: any = { uuid: u, name: 'bite-' + u.slice(0, 6) + '.bin', mimeType: 'application/octet-stream', size: 3 };
  if (opts.protected) model.protected = true;
  if (opts.owner) model.uploaderToken = opts.owner;
  const unit = { ior: 'ior:class:File', model, ownerIor: 'ior:instance:' + (opts.owner || u) };
  mkdirSync(path.dirname(shard(u)), { recursive: true }); writeFileSync(shard(u), JSON.stringify(unit, null, 2));
  return u;
};
const shaOf = (list: string[]) => crypto.createHash('sha256').update([...new Set(list.map((x) => x.replace(/^ior:instance:/, '').split('@')[0].trim()).filter(Boolean))].sort().join('\n')).digest('hex');
const present = (u: string) => existsSync(shard(u));

await sleep(3500); // let the imported server.ts finish booting (roomManager load) before driving the fns
const R: any = {};
try {
  // ── (a) setSha MISSING/empty → 400 ──
  const ea = mkUnit({ owner: randomUUID() });
  const a = sweepEnumerated([ea], { dryRun: true, setSha: '' });
  R.a = a.code === 400 && a.ok === false && present(ea);
  console.log(`  (a) setSha missing → code=${a.code} (want 400) + unit-survives=${present(ea)} => ${R.a ? 'PASS' : 'RED'}`);

  // ── (b) setSha MISMATCH → 403 ──
  const b = sweepEnumerated([ea], { dryRun: true, setSha: 'deadbeef-not-the-real-sha' });
  R.b = b.code === 403 && b.ok === false && present(ea);
  console.log(`  (b) setSha mismatch → code=${b.code} (want 403) + unit-survives=${present(ea)} => ${R.b ? 'PASS' : 'RED'}`);

  // ── (c) PHASE-1 ABORT: list with 1 protected uuid + a would-pass ephemeral → 0 deletions, would-pass SURVIVES ──
  const cPass = mkUnit({ owner: randomUUID() }); const cProt = mkUnit({ protected: true });
  const cList = [cPass, cProt]; const c = sweepEnumerated(cList, { dryRun: false, setSha: shaOf(cList) });
  R.c = c.ok === false && c.phase === 1 && (c.refused || []).length >= 1 && present(cPass) && present(cProt); // ABORT, NOTHING deleted (both survive)
  console.log(`  (c) phase-1 ABORT: ok=${c.ok} phase=${c.phase} refused=${(c.refused || []).length} + would-pass SURVIVES=${present(cPass)} + protected SURVIVES=${present(cProt)} => ${R.c ? 'PASS' : 'RED'} (stub-must-fail: skip-continue would delete cPass)`);

  // ── (d) DRY-RUN deletes NOTHING ──
  const ed = mkUnit({ owner: randomUUID() });
  const d = sweepEnumerated([ed], { dryRun: true, setSha: shaOf([ed]) });
  R.d = d.ok === true && d.phase === 1 && present(ed);
  console.log(`  (d) dryRun → ok=${d.ok} phase=${d.phase} wouldDelete=${d.wouldDelete} + unit-STILL-PRESENT=${present(ed)} => ${R.d ? 'PASS' : 'RED'}`);

  // ── (e) CLEAN RUN: ephemeral-only → deleted + gone + 0-dangling + idempotent re-run ──
  const ee = mkUnit({ owner: randomUUID() });
  const e1 = sweepEnumerated([ee], { dryRun: false, setSha: shaOf([ee]) });
  await sleep(300);
  const goneNow = !present(ee);
  const e2 = sweepEnumerated([ee], { dryRun: false, setSha: shaOf([ee]) }); // idempotent re-run (unit already gone)
  R.e = e1.ok === true && e1.phase === 2 && (e1.deleted || 0) === 1 && (e1.danglingAfter || 0) === 0 && goneNow && e2.ok === true;
  console.log(`  (e) clean run → deleted=${e1.deleted} dangling-after=${e1.danglingAfter} + GONE=${goneNow} + idempotent-rerun-ok=${e2.ok} => ${R.e ? 'PASS' : 'RED'}`);

  R.pass = R.a && R.b && R.c && R.d && R.e;
} catch (err: any) { R.error = String(err?.message || err); R.pass = false; }
console.log('\n=== SWEEP-OP (a)-(e) BITES (in-process, real shipped fns) ===');
if (R.error) console.log('ERROR:', R.error);
console.log(R.pass ? '★ ALL 5 GREEN (a setSha-missing→400 / b mismatch→403 / c phase-1-abort-0-del-survivors / d dryRun-no-delete / e clean-run-gone+0-dangling+idempotent)' : '★ RED');
process.exit(R.pass ? 0 : 1);
