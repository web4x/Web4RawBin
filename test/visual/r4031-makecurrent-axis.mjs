// R40.49 make-current 403-AXIS runtime proof (PO: THE highest-value question — does (A) task-ownership backfill fix Tron's 403?).
// Code-read says the 403 = resolveOwner(req) (server.ts:943, GLOBAL owner-SESSION gate, takes no taskUuid) — NOT the task's ownerIor.
// This proves it at RUNTIME in ISOLATED SCRATCH (owner session, non-4444, teardown-verified, prod:4444 UNTOUCHED). Two rows separate the axes:
//   AXIS-1  OWNED task + NON-owner session  → expect 403 (owning the task does NOT grant access)
//   AXIS-2  UNOWNED task + OWNER session    → expect NOT-403 / 200 (task-ownership is NOT required for the gate)
// + full matrix (both accept-paths + the 409 status axis) + prove-the-instrument (bogus→404). NO buildDist (server-endpoint test).
import { setupFoundation } from './r4031-foundation.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const TRON = '05e58f81-34ec-4851-b5b7-5749ca9148a3'; // the profile (A) sets as ownerIor
const shard = (root, u) => path.join(root, 'scenario/index', ...u.slice(0, 5).split(''), `${u}.scenario.json`);
const wu = (root, u, model, ownerIor) => { const p = shard(root, u); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify({ ior: 'ior:class:Task', model: { uuid: u, ...model }, ...(ownerIor ? { ownerIor } : {}) }, null, 2) + '\n'); };
const PLANNED = '- [x] Planned';
const INPROG = '- [x] Planned\n- [x] In Progress\n  - [x] refinement';
const QA = '- [x] Planned\n- [x] In Progress\n  - [x] refinement\n  - [x] implementing\n  - [x] testing\n- [x] QA Review';

// OWNED (ownerIor=TRON) tasks in distinct statuses, seeded via the serverPatch hook (runs before boot → boot-loaded index sees them)
const oAxis = randomUUID(), oPlanned = randomUUID(), oInprog = randomUUID(), oQa = randomUUID(), oQa2 = randomUUID();
const seedOwned = (root) => {
  wu(root, oAxis, { name: 'axis owned (for non-owner row)', status: 'In Progress', statusChecklist: INPROG }, `ior:instance:${TRON}`); // In-Progress so a 403 here is the GATE, not the status
  wu(root, oPlanned, { name: 'owned planned', status: 'Planned', statusChecklist: PLANNED }, `ior:instance:${TRON}`);
  wu(root, oInprog, { name: 'owned in-progress', status: 'In Progress', statusChecklist: INPROG }, `ior:instance:${TRON}`);
  wu(root, oQa, { name: 'owned qa-review', status: 'QA Review', statusChecklist: QA }, `ior:instance:${TRON}`);
  wu(root, oQa2, { name: 'owned qa-review 2', status: 'QA Review', statusChecklist: QA }, `ior:instance:${TRON}`);
};

const f = await setupFoundation({ serverPatch: seedOwned }); // NO buildDist — make-current is server-side
const owner = f.ownerHeaders();                               // OWNER session (x-player-token + sm_session)
const NONOWNER = {};                                          // anonymous — no owner creds
const mc = (task, headers) => fetch(`${f.base}/api/task/${task}/make-current`, { method: 'POST', headers }).then((r) => r.status).catch(() => -1);
const r = {};
try {
  // ── AXIS (the separating pair) ──
  r.AXIS1_owned_nonOwner = await mc(oAxis, NONOWNER);          // OWNED + non-owner → expect 403
  r.AXIS2_unowned_owner = await mc(f.seeded.planned, owner);  // UNOWNED (seeded, no ownerIor) + owner → expect 200
  // ── MATRIX (documentation) ──
  r.M_planned_owned_OWNER = await mc(oPlanned, owner);        // owned+eligible+owner → 200
  r.M_inprogress_owned_OWNER = await mc(oInprog, owner);      // owned+eligible+owner → 200
  r.M_qaReview_owned_OWNER = await mc(oQa, owner);            // owned+QA-Review+owner → 409 (status axis)
  r.M_nonOwner_anyTask = await mc(oQa2, NONOWNER);            // non-owner → 403 (gate fires before status)
  // ── prove-the-instrument ──
  r.PROVE_bogusTask_owner = await mc(randomUUID(), owner);    // unknown task → 404 (endpoint really checks; not always-200)
  r.servedVersion = f.servedVersion; r.worktreeSha = f.worktreeSha;
} finally { r.teardown = await f.teardown(); }

console.log(JSON.stringify(r, null, 2));
// VERDICT: the axis is GLOBAL-SESSION iff owning-the-task does NOT grant (AXIS1=403) AND task-ownership is NOT required (AXIS2 not-403).
const axisGlobalSession = r.AXIS1_owned_nonOwner === 403 && r.AXIS2_unowned_owner !== 403 && r.AXIS2_unowned_owner > 0;
const matrixOk = r.M_planned_owned_OWNER === 200 && r.M_inprogress_owned_OWNER === 200 && r.M_qaReview_owned_OWNER === 409 && r.M_nonOwner_anyTask === 403;
const proven = r.PROVE_bogusTask_owner === 404;
const prodSafe = r.teardown?.prodUp === true && r.teardown?.leftover === 0;
console.log('\n=== make-current 403 AXIS (runtime, isolated scratch) ===');
console.log(`  AXIS-1 OWNED+non-owner → ${r.AXIS1_owned_nonOwner} (want 403: owning does NOT grant)`);
console.log(`  AXIS-2 UNOWNED+owner   → ${r.AXIS2_unowned_owner} (want 200/not-403: ownership NOT required)`);
console.log(`  MATRIX planned/owner=${r.M_planned_owned_OWNER} inprog/owner=${r.M_inprogress_owned_OWNER} qa/owner=${r.M_qaReview_owned_OWNER}(409=status) nonowner=${r.M_nonOwner_anyTask}`);
console.log(`  prove-instrument bogus→${r.PROVE_bogusTask_owner}(want 404) · prod:4444 untouched=${prodSafe} · v${r.servedVersion}`);
let verdict, exit;
if (!proven) { verdict = `INADMISSIBLE — endpoint instrument unproven (bogus task → ${r.PROVE_bogusTask_owner}, want 404)`; exit = 2; }
else if (!prodSafe) { verdict = `INVALID — teardown not clean (prodUp=${r.teardown?.prodUp}, leftover=${r.teardown?.leftover})`; exit = 2; }
else if (axisGlobalSession) { verdict = `★ CONFIRMED: make-current's 403 is a GLOBAL owner-SESSION gate, NOT per-task ownerIor. An OWNED task with a non-owner session STILL 403s (${r.AXIS1_owned_nonOwner}); an UNOWNED task with the OWNER session does NOT (${r.AXIS2_unowned_owner}). ⇒ (A) task-ownership backfill does NOT fix Tron's 403 — the fix is session/identity recognition.${matrixOk ? ' Full matrix consistent.' : ' ⚠ matrix rows unexpected — inspect.'}`; exit = 0; }
else { verdict = `UNEXPECTED — axis did not separate as code-read predicted (AXIS1=${r.AXIS1_owned_nonOwner}, AXIS2=${r.AXIS2_unowned_owner}); the 403 may involve per-task ownership after all — re-read + report before any claim`; exit = 1; }
console.log(`\n${exit === 0 ? '✓' : exit === 2 ? '⊘' : '✗'} ${verdict}`);
process.exit(exit);
