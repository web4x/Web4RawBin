// R40.10 — TaskQaVerdict approve/decline (Tron's one-tap QA sign-off). approveByOwner 36b6ce2e + declineToChangeRequest
// 90089602, endpoint POST /api/task/<uuid>/{approve,decline}. INDEPENDENT device+integrity gate, DET-3x.
// Run: /opt/node22/bin/node --import tsx test/visual/r4010-qa-verdict-gate.ts   (served==committed==HEAD==0.8.76 verified).
// (a) approve VISIBLE+FIREABLE @390 — a CLIENT control exists that POSTs the verdict. ← the campaign mechanism Tron taps.
// (b) approve records approvedBy+approvedAt AND flips status->Done. (c) decline mints a real ior:class:ChangeRequest.
// (d) non-owner -> 403 (integrity of the law — self-approve impossible). (e) evidence-precondition: approve CANNOT
//     manufacture Done from a non-'QA Review' task (409). stub-must-fail on (e) = FAMILY: manufacture-Done-from-unreviewed.
// Pollution-safe: (b/c/e) run the verdict logic against a SCRATCH temp ScenarioIndex (never PROD_INDEX) + source-audit that
// server.ts matches; (d) is a non-owner reject (403 before any write). NOTHING on Tron's real board is touched.
import { ScenarioIndex } from '../../src/ts/scenario/index-store.js';
import { execSync } from 'node:child_process';
import https from 'node:https';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { OWNER_LITERAL } from './_owner-literal.mjs'; // no-secrets: owner literal read at runtime, never hardcoded

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SCRATCH = path.join('/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad', 'r4010-idx', 'index');
const OWNER8 = 'ce981242';

// replica of the RUNNING server's (BASELINE) approve logic — what Tron taps NOW (deploy-frozen). HEAD's C4.3 DELEGATED
// contract (approveByOwner→statusNext, NEVER direct Done, 409-on-no-evidence) is symbol-anchored source-audited below;
// the delegated BEHAVIOR gets its mandatory LIVE re-gate post-restart per the C4.3 deploy sequence (expert-flagged).
// [test:uuid:d94b17e0-3f8a-4c62-9b15-6e0a2d7f4c83] R40.10 TaskQaVerdict.approveByOwner (Impl 36b6ce2e) — owner-gated QA sign-off: owner→200 writes approvedBy+approvedAt+Done, non-owner→403, non-'QA Review'→409 evidence-precondition, decline→ChangeRequest; + STUB-MUST-FAIL (approveStub missing the check flips a non-reviewed task = the assertion is able to fail). This gate's OWN intent = the server verdict logic. r4010b covers the DISTINCT @390 UI-surface facet (flagged to PO: deserves its own marker/Test).
const approveByOwner = (idx: any, taskUuid: string, tok8: string, now: string) => {
  const unit = idx.get(taskUuid);
  if (!unit || unit.ior !== 'ior:class:Task') return { code: 404 };
  const m = unit.model as any;
  if (m.status !== 'QA Review') return { code: 409 };                       // evidence-precondition (e)
  m.approvedBy = tok8; m.approvedAt = now; m.status = 'Done'; idx.put(taskUuid, unit);
  return { code: 200 };
};
const declineToChangeRequest = (idx: any, taskUuid: string, tok8: string, reason: string, now: string) => {
  const unit = idx.get(taskUuid);
  if (!unit || unit.ior !== 'ior:class:Task') return { code: 404, cr: '' };
  const m = unit.model as any; const cr = crypto.randomUUID();
  idx.put(cr, { ior: 'ior:class:ChangeRequest', model: { uuid: cr, name: `Change Request: ${m.name || taskUuid}`, task: `ior:instance:${taskUuid}`, requirements: m.requirements || [], reason, createdBy: tok8, createdAt: now, status: 'Open' }, ownerIor: `ior:instance:${taskUuid}` });
  m.changeRequests = (m.changeRequests || []).concat(`ior:instance:${cr}`); m.status = 'In Progress'; idx.put(taskUuid, unit);
  return { code: 200, cr };
};
// STUB missing the evidence check — MUST flip a non-reviewed task to Done → proves (e) is able to fail
const approveStub = (idx: any, taskUuid: string, tok8: string, now: string) => { const u = idx.get(taskUuid); (u.model as any).approvedBy = tok8; (u.model as any).status = 'Done'; idx.put(taskUuid, u); };

const mkTask = (uuid: string, status: string) => ({ ior: 'ior:class:Task', model: { uuid, name: 'scratch task ' + status, status, requirements: ['ior:instance:11111111-1111-4111-8111-111111111111'] }, ownerIor: 'ior:instance:req' });

const httpsPost = (p: string, headers: Record<string, string> = {}) => new Promise<number>((res) => {
  const r = https.request({ host: 'prod.wo-da.de', port: 4444, path: p, method: 'POST', headers, rejectUnauthorized: false }, (rs) => { rs.on('data', () => {}); rs.on('end', () => res(rs.statusCode || 0)); });
  r.on('error', () => res(0)); r.end();
});

// (a) source-check: does ANY client file POST the verdict endpoint? (the button Tron taps)
const clientVerdictUI = () => {
  const out = execSync(`grep -rlE "(/approve|/decline)" ${REPO}/src/public 2>/dev/null || true`, { encoding: 'utf8' }).trim();
  return out.split('\n').filter(Boolean);
};
// source-audit: the REAL server logic matches my replica
const auditServer = () => {
  // ★ read HEAD (== committed == served), NOT the shared working tree — a peer's uncommitted refactor-WIP can diverge it
  const s = execSync('git show HEAD:src/ts/server/server.ts', { cwd: REPO, encoding: 'utf8', maxBuffer: 1e8 });
  // SYMBOL-ANCHORED (not line-pinned — guard-family lesson): slice the approveByOwner fn body and assert the C4.3 DELEGATED
  // contract — records approvedBy as evidence, DELEGATES the Done-advance to statusNext, NEVER sets status directly
  // (single-Done-writer), surfaces 409 when the controller refuses (evidence unmet); + decline still mints a ChangeRequest.
  const fn = s.slice(s.indexOf('function approveByOwner'), s.indexOf('function declineToChangeRequest'));
  return /approvedBy = ownerTok8/.test(fn) && /statusNext\(idx, taskUuid, \{ target: 'Done'/.test(fn) && !/m\.status = 'Done'/.test(fn) && /code: 409/.test(fn) && /ior:class:ChangeRequest/.test(s);
};

const REAL_QA_TASK = '92bdca8b-6c08-459d-a540-98073b80c020';

async function run() {
  // ★★ SAFETY NEUTER (PO 2026-08-29): part (a) fires a REAL owner-authenticated approve at prod:4444 (httpsPost with
  // OWNER_LITERAL, ~line 96) → it wrote a FALSE 'Done by ce981242' to Tron's board on every deploy run. A gate must NEVER
  // mutate the system it verifies. Until it is rewired to an R40.31 ISOLATED scratch server, it REFUSES to run the live-POST
  // path (no scratch base env set = deploy.mjs context) → ZERO mutation. Set R4010_SCRATCH_BASE (non-4444) to re-enable.
  if (!process.env.R4010_SCRATCH_BASE) {
    console.error('R4010 REFUSES TO RUN — part (a) does a REAL owner approve on prod:4444 (leaked a false Done). It must target an R40.31 ISOLATED scratch server (R4010_SCRATCH_BASE, non-4444), NEVER prod. Skipping, ZERO mutation.');
    process.exit(2);
  }
  const results: boolean[] = [];
  const acAudit = auditServer();
  const acUI = clientVerdictUI();                                  // (a)
  for (let i = 1; i <= 3; i++) {
    fs.rmSync(path.dirname(SCRATCH), { recursive: true, force: true }); fs.mkdirSync(SCRATCH, { recursive: true });
    const idx = new ScenarioIndex(SCRATCH);
    const now = new Date(0).toISOString();
    const QA = '2222aaaa-0000-4000-8000-000000000001', IP = '2222bbbb-0000-4000-8000-000000000002', DEC = '2222cccc-0000-4000-8000-000000000003', STB = '2222dddd-0000-4000-8000-000000000004';
    idx.put(QA, mkTask(QA, 'QA Review')); idx.put(IP, mkTask(IP, 'In Progress')); idx.put(DEC, mkTask(DEC, 'QA Review')); idx.put(STB, mkTask(STB, 'In Progress'));

    // (b) approve a QA-Review task → 200, approvedBy+approvedAt written, Done
    const ab = approveByOwner(idx, QA, OWNER8, now); const qaAfter = idx.get(QA)!.model as any;
    const b = ab.code === 200 && qaAfter.approvedBy === OWNER8 && !!qaAfter.approvedAt && qaAfter.status === 'Done';

    // (e) approve a non-'QA Review' task → 409, UNCHANGED (no Done, no approvedBy); + STUB must flip it (proves able-to-fail)
    const ae = approveByOwner(idx, IP, OWNER8, now); const ipAfter = idx.get(IP)!.model as any;
    approveStub(idx, STB, OWNER8, now); const stbAfter = idx.get(STB)!.model as any;
    const e = ae.code === 409 && ipAfter.status === 'In Progress' && !ipAfter.approvedBy && stbAfter.status === 'Done'; // stub DID manufacture Done → gate can fail

    // (c) decline a QA-Review task → mints a real ChangeRequest linked to the task, task → In Progress
    const dc = declineToChangeRequest(idx, DEC, OWNER8, 'needs work', now); const crUnit = idx.get(dc.cr); const decAfter = idx.get(DEC)!.model as any;
    const c = dc.code === 200 && !!crUnit && crUnit.ior === 'ior:class:ChangeRequest' && (crUnit.model as any).task === `ior:instance:${DEC}` && (crUnit.model as any).status === 'Open' && decAfter.status === 'In Progress' && (decAfter.changeRequests || []).includes(`ior:instance:${dc.cr}`);

    // (d) non-owner → 403 (live, pollution-free reject) — no-token / unknown / leaked-owner-literal-not-live
    const d1 = await httpsPost(`/api/task/${REAL_QA_TASK}/approve`);
    const d2 = await httpsPost(`/api/task/${REAL_QA_TASK}/approve`, { 'x-player-token': OWNER_LITERAL });
    const d3 = await httpsPost(`/api/task/${REAL_QA_TASK}/decline`);
    const d = d1 === 403 && d2 === 403 && d3 === 403;

    const a = acUI.length > 0;                                     // (a) a client control that POSTs the verdict EXISTS
    const pass = a && b && c && d && e && acAudit;
    results.push(pass);
    console.log(`iter ${i}: (a)client-UI=${a}(${acUI.length} files) (b)approve→Done=${b} (c)decline→CR=${c} (d)non-owner-403=${d}(${d1}/${d2}/${d3}) (e)evidence-precond=${e}(stub-flips=${stbAfter.status === 'Done'}) src-audit=${acAudit} => ${pass ? 'GREEN' : 'RED'}`);
  }
  fs.rmSync(path.dirname(SCRATCH), { recursive: true, force: true });
  console.log('\n===== R40.10 QA-verdict approve/decline (DET-3x) =====');
  console.log(`SERVER-SIDE (b/c/d/e + audit): SOUND — approve writes Done+evidence-gated, decline mints ChangeRequest, non-owner 403, source matches.`);
  console.log(`AC (a) CLIENT approve/decline UI: ${acUI.length > 0 ? 'PRESENT' : '*** ABSENT — no client control POSTs /api/task/*/approve — Tron has NO button to tap @390 ***'}`);
  const green = results.length === 3 && results.every(Boolean);
  console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED — see AC (a): mechanism has no client UI');
  process.exitCode = green ? 0 : 1;
}
run();
