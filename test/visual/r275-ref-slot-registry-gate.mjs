// R27.5 — Canonical Ref-Slot Registry gate. DRAFT (scenario-first PREP, 2026-07-13): drafted
// against design-notes/r27.5-canonical-ref-slot-registry.md BEFORE the expert builds, so it's
// ready to run the instant REF_SLOTS + the extended trace-audit ship. Tooling gate (disk audit,
// node18 tsx). READ-ONLY on scenario/index; regression fixtures live in an ISOLATED scratchpad
// dir (zero pollution of the real graph). DET-3x (the audit is deterministic).
//
// ACs (architect):
//   (1) REF_SLOTS registry lists every uuid-bearing slot per unit type (forward+back+cross).
//   (2) ref-integrity — dangling scan covers FORWARD *and* BACK edges (the exact class that bit
//       S30); token/self excluded so the count is the TRUE residual, not ~500 false-pos.
//   (3) node-well-formedness — 0 missing/undefined uuid, filename==uuid, 0 dup-uuid, shard==uuid.
//   (4) token/edge/self classification — auth tokens (ownerToken/uploaderToken/deviceId/token/
//       senderIor) EXCLUDED; genuine unit edges (roomUuid/testUuid/parent/@ownerIor) INCLUDED.
//   (5) REGRESSION FIXTURES the audit MUST catch: dup-uuid collision · truncated-uuid (R30.1
//       near-miss) · back-edge-miss (a back-ref to a non-existent unit — forward-only scan
//       misses it, REF_SLOTS.back catches it = the S30 lesson).
//
// ── INTERFACE ASSUMPTIONS (confirm/adjust with expert on build) ──────────────────────────────
//   A. REF_SLOTS is exported/greppable from scripts/trace-audit.ts (or a registry module) with
//      per-type { forward[], back[], cross[] } (refactors today's CANONICAL_FORWARD + BACK_REF_FIELDS).
//   B. `npx tsx scripts/trace-audit.ts --strict` exits non-zero on any violation (already true);
//      the report prints PASS/FAIL sections incl. NEW: ref-integrity(dangling), well-formedness
//      (missing-uuid / filename!=uuid / dup-uuid / shard), classification(tokens excluded).
//   C. The audit accepts a target dir for fixture testing: `--dir <path>` (or SCENARIO_DIR env) —
//      REQUESTED so the audit is testable-by-construction (fixtures never touch the real index).
//      Until (C) lands, Part C is SKIPPED-with-a-loud-log, not a silent pass.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE18 = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda';
const FIXROOT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/r275-fixtures';
const run = (cmd) => { try { return { out: execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, env: { ...process.env, PATH: `${NODE18}:${process.env.PATH}` } }), code: 0 }; } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status ?? 1 }; } };
const AUDIT = 'npx tsx scripts/trace-audit.ts';

// AC1: the design's declared slots (design-notes lines 17-34) — the registry MUST cover these.
// forward ▸ = reachability; back ◂ + cross ↔ also scanned for dangling. Key entries that fix the
// 2207 walk-gap / R27.4 miss / S30 back-edge are starred.
const EXPECTED = {
  Requirement:   { forward: ['useCases'], back: ['parent', '@ownerIor'], cross: ['tests', 'supersededBy', 'supersedes'] },
  Task:          { forward: ['useCases', 'children', 'subtasks'], back: ['parent', '@ownerIor', 'sprint'], cross: ['coveredRequirements', 'requirements'] },
  UseCase:       { forward: ['class', 'classes', 'method'], back: ['parent', '@ownerIor', 'requirements'], cross: ['tasks', 'implementations'] },
  Class:         { forward: ['methods'], back: ['parent', '@ownerIor', 'useCases'], cross: ['subtypes', 'extends'] },
  Method:        { forward: ['implementations'], back: ['parent', '@ownerIor'], cross: ['implementation', 'tests'] },
  Implementation:{ forward: ['tests'], back: ['parent', '@ownerIor', 'methods'], cross: ['sourceMarker'] },
  Test:          { forward: ['testCases'], back: ['parent', '@ownerIor', 'methods', 'implementations'], cross: ['verifies'] }, // ▸testCases=2207 fix; ◂methods=R27.4 miss
  Sprint:        { forward: ['tasks', 'requirements'], back: [], cross: ['bugs'] }, // 2nd reachability ROOT
};
const EXCLUDE_TOKENS = ['ownerToken', 'uploaderToken', 'deviceId', 'token', 'senderIor'];
const INCLUDE_EDGES = ['roomUuid', 'testUuid', 'parent', 'ownerIor'];

function fdUuid(n) { return `fdfdfdfd-0000-4000-8000-00000000000${n}`.slice(0, 36); }
// Build a minimal VALID chain in an isolated dir, then inject the 3 regression bugs.
function buildFixtures() {
  fs.rmSync(FIXROOT, { recursive: true, force: true });
  const idx = path.join(FIXROOT, 'scenario/index');
  const put = (uuid, unit) => { const p = path.join(idx, ...uuid.slice(0, 5).split(''), uuid + '.scenario.json'); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(unit, null, 2)); return p; };
  const U = (n) => `aaaaaaaa-0000-4000-8000-00000000000${n}`.slice(0, 36);
  // valid chain Req->UC->Class->Method->Impl->Test (forward refs resolve)
  put(U(1), { ior: 'ior:class:Requirement', model: { uuid: U(1), name: 'fix Req', useCases: [`ior:instance:${U(2)}`] } });
  put(U(2), { ior: 'ior:class:UseCase', model: { uuid: U(2), name: 'fix UC', classes: [`ior:instance:${U(3)}`], requirements: [`ior:instance:${U(1)}`] } });
  put(U(3), { ior: 'ior:class:Class', model: { uuid: U(3), name: 'fix Class', methods: [`ior:instance:${U(4)}`] } });
  put(U(4), { ior: 'ior:class:Method', model: { uuid: U(4), name: 'fix Method', implementations: [`ior:instance:${U(5)}`] } });
  put(U(5), { ior: 'ior:class:Implementation', model: { uuid: U(5), name: 'fix Impl', tests: [`ior:instance:${U(6)}`] } });
  put(U(6), { ior: 'ior:class:Test', model: { uuid: U(6), name: 'fix Test', verifies: [`ior:instance:${U(5)}`], methods: [`ior:instance:${U(4)}`] } });
  // FIXTURE 1 — dup-uuid collision: a 2nd file carrying an already-used uuid U(3)
  const dupPath = path.join(idx, 'd', 'u', 'p', 'l', 'i', U(3) + '.scenario.json'); fs.mkdirSync(path.dirname(dupPath), { recursive: true });
  fs.writeFileSync(dupPath, JSON.stringify({ ior: 'ior:class:Class', model: { uuid: U(3), name: 'DUP collision' } }, null, 2));
  // FIXTURE 2 — truncated-uuid: a Test whose back-edge methods[] uses an 8-char prefix (R30.1 near-miss class)
  put(U(7), { ior: 'ior:class:Test', model: { uuid: U(7), name: 'truncated ref', methods: ['ior:instance:aaaaaaaa'], verifies: [`ior:instance:${U(5)}`] } });
  // FIXTURE 3 — back-edge-miss: a Test whose BACK-ref methods[] points to a NON-EXISTENT unit
  //   (forward-only scan never inspects methods[] -> misses it; REF_SLOTS.back MUST catch it = S30)
  put(U(8), { ior: 'ior:class:Test', model: { uuid: U(8), name: 'dangling back-edge', methods: [`ior:instance:${U(9)}`], verifies: [`ior:instance:${U(5)}`] } }); // U(9) does not exist
  return { idx, dupUuid: U(3), truncPrefix: 'aaaaaaaa', danglingUuid: U(9) };
}

const results = [];
let prev = null;
for (let r = 1; r <= 3; r++) {
  const checks = {};

  // AC1 — REF_SLOTS registry present + covers the design's slots
  const srcHit = run(`grep -rl "REF_SLOTS" ${REPO}/scripts ${REPO}/src`);
  const registrySrc = srcHit.out.trim().split('\n').filter(Boolean)[0];
  let coverageOk = false, coverageMiss = [];
  if (registrySrc) {
    const full = fs.readFileSync(registrySrc, 'utf8');
    // scope to the REF_SLOTS object block (honest coverage, not file-wide word presence)
    const block = (/const REF_SLOTS[\s\S]*?\n\};/.exec(full) || [full])[0];
    for (const [type, slots] of Object.entries(EXPECTED)) {
      const line = new RegExp(`\\b${type}\\s*:[\\s\\S]*?\\),`).exec(block)?.[0] || '';
      for (const kind of ['forward', 'back', 'cross']) for (const s of slots[kind]) {
        if (!line.includes(`'${s}'`)) coverageMiss.push(`${type}.${kind}.${s}`);
      }
    }
    coverageOk = coverageMiss.length === 0;
  }
  checks.ac1_registry = registrySrc ? coverageOk : null; // null = PENDING (REF_SLOTS not shipped yet)

  // Run the real-index audit (strict). Parse PASS/FAIL sections.
  const audit = run(`${AUDIT} --strict`);
  const out = audit.out;
  const section = (re) => { const m = re.exec(out); return m ? m[1] : null; };
  // AC3 — well-formedness (all 0). Anticipated section names; matched loosely.
  const wf = {
    missingUuid: /(missing|undefined)[^\n]*uuid[^\n]*?(\d+)\b/i.exec(out)?.[2],
    filenameMismatch: /filename[^\n]*?(\d+)\b/i.exec(out)?.[1],
    dupUuid: /duplicate[- ]?uuid[^\n]*?(\d+)\b/i.exec(out)?.[1],
  };
  // present-and-zero for whichever the build emits; if the section is absent, AC3 is PENDING not pass
  const wfEmitted = Object.values(wf).some(v => v != null);
  checks.ac3_wellformed = wfEmitted ? Object.values(wf).every(v => v == null || Number(v) === 0) : null; // null = well-formedness axis not shipped

  // AC2 — ref-integrity scans back-edges (needs REF_SLOTS.back); AC4 — tokens excluded + edges included.
  const scansBack = registrySrc && /back\s*:/.test(fs.readFileSync(registrySrc, 'utf8'));
  const tokenExcluded = !EXCLUDE_TOKENS.some(t => new RegExp(`dangling[^\\n]*${t}|${t}[^\\n]*DEAD`, 'i').test(out)); // tokens must NOT appear as dangling
  checks.ac2_refintegrity = registrySrc ? scansBack : null;
  checks.ac4_classification = registrySrc ? (tokenExcluded && INCLUDE_EDGES.some(e => fs.readFileSync(registrySrc, 'utf8').includes(e))) : null;

  // AC5 — regression fixtures: audit --dir <fixtures> MUST catch dup + truncated + back-edge-miss
  const fx = buildFixtures();
  const fixAudit = run(`${AUDIT} --strict --dir ${fx.idx}`);
  // --dir worked iff the audit scanned the SMALL fixture graph (~9 units), not the real index (thousands)
  const totalUnits = Number(/Total units:\s*(\d+)/i.exec(fixAudit.out)?.[1] || -1);
  const supportsDir = totalUnits > 0 && totalUnits < 50;
  let ac5;
  if (!supportsDir) {
    ac5 = null; // PENDING interface (C) — loud, not silent
    console.log(`  [AC5 PENDING] audit --dir not yet supported (interface req C) — fixtures built at ${fx.idx}, cannot assert catch yet`);
  } else {
    const caughtDup = new RegExp(`dup|collision|${fx.dupUuid.slice(0, 8)}`, 'i').test(fixAudit.out) && fixAudit.code !== 0;
    const caughtTrunc = /truncat/i.test(fixAudit.out) || fixAudit.out.includes(fx.truncPrefix);
    const caughtBackEdge = new RegExp(`dangling|dead|${fx.danglingUuid.slice(0, 8)}`, 'i').test(fixAudit.out) && fixAudit.code !== 0;
    ac5 = caughtDup && caughtTrunc && caughtBackEdge;
  }
  checks.ac5_fixtures = ac5;
  fs.rmSync(FIXROOT, { recursive: true, force: true });

  // DRAFT verdict: an AC is GREEN(true)/RED(false)/PENDING(null, interface not shipped yet).
  const snap = JSON.stringify(checks);
  const deterministic = !prev || prev === snap; prev = snap;
  const green = Object.values(checks).every(v => v === true);
  const pending = Object.values(checks).some(v => v === null);
  results.push({ green, pending, deterministic, checks });
  console.log(`run ${r}: ${Object.entries(checks).map(([k, v]) => `${k}=${v === null ? 'PENDING' : v}`).join(' ')} det=${deterministic}`);
}

console.log('\n=== VERDICT R27.5 ref-slot registry (DRAFT, DET-3x) ===');
const allGreen = results.every(r => r.green && r.deterministic);
const anyPending = results.some(r => r.pending);
console.log('OVERALL:', allGreen ? 'GREEN DET-3x' : anyPending ? 'PENDING-EXPERT-BUILD (draft ready; ACs light up as REF_SLOTS/well-formedness/--dir ship)' : 'RED');
console.log('DRAFT STATUS: gate authored + regression fixtures (dup/truncated/back-edge-miss) ready. Confirm interface A/B/C with expert on build, then this flips to a hard DET-3x gate.');
process.exitCode = allGreen ? 0 : (anyPending ? 2 : 1);
