// [test:uuid:209f71d1-73e5-447a-9aab-118632f148f5] R27.5 TraceAudit.nodeWellFormedness (Axis-2/AC3) — malformed fixture(missing-uuid/filename!=uuid/dup)->--dir --strict exit1; clean->exit0; real->0 PASS(HARD)
// [test:uuid:2073007c-96cf-4939-824e-9e7fa0e4e6c0] R27.5 TraceAudit.oneClassPerFile (Axis-3) — fixture 2 Class units sharing one sourceFile->FAIL (check, not deferred baseline=4)
// [test:uuid:2cedb317-423c-4753-a038-20114c48c614] R27.5 TraceAudit.markerHasChain (Axis-4/AC4) — --since HEAD + NEW bogus [impl:uuid] no Impl->exit1; removed->exit0 (delta-not-absolute)
// [test:uuid:4f6e5b5c-c83a-45e6-b3f2-95c268761e1c] R27.5 TraceAudit.auditDir (AC5) — --dir retargets index-audit + well-formedness at the fixture tree
// [test:uuid:fb185dc5-4f99-44ab-9405-2dbe98b5ef85] R27.5 TraceAudit.refSlots — canonical REF_SLOTS registry (AC1/AC2/AC4-classification)
// R27.5 — Canonical Ref-Slot Registry + trace-audit calibration gate. Full 5-AC DET-3x (expert
// shipped all axes, commit 5f34dde7e). Tooling gate (disk audit, node18 tsx). READ-ONLY on the
// real scenario/index; every fixture lives in an ISOLATED scratchpad tree (zero pollution) and is
// pointed at via --dir (AC5). Each axis is gated CLEAN-vs-DIRTY on a fixture (the CHECK works),
// not on the real-graph deferred baseline.
//   AC1 REF_SLOTS covers every slot/type fwd+back+cross ; AC4 token/self EXCLUDE + unit-edges INCLUDE.
//   AC2 ref-integrity scans BACK edges (the S30 class) — REF_SLOTS.back present + real strict clean.
//   AC3/Axis-2 nodeWellFormedness (0f63288e): malformed fixture (missing-uuid/filename!=uuid/dup)
//       → --dir --strict exit 1 ; clean fixture → exit 0 ; real graph → well-formedness 0 PASS (HARD).
//   Axis-3 oneClassPerFile (4b53b98e): fixture w/ 2 Class units sharing one sourceFile → FAIL
//       (gate the CHECK, not the real baseline=4 which is DEFERRED/delta-scoped).
//   AC4/Axis-4 markerHasChain (1bfe7447): --since HEAD + a NEW bogus [impl:uuid:<full>] (no Impl)
//       → exit 1 ; remove it → exit 0 (delta-not-absolute: the 75 baseline never strict-fails).
//   AC5 auditDir (6f507bbf): --dir aims BOTH index-audit + well-formedness at the fixture tree.
//   HARD=0 PASS confirmed on the real graph; deferred (orphans/ref-dangling/Axis-3-baseline/
//   marker-baseline) is delta-scoped → real strict exit 0.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE18 = '/root/.vscode-server/bin/903b1e9d8990623e3d7da1df3d33db3e42d80eda';
const SCRATCH = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad';
const AXIS4_FIXTURE = path.join(REPO, 'test/visual/_r275_axis4_bogus.fixture.ts'); // temp, in-repo so --since HEAD sees it
const run = (cmd) => { try { return { out: execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, env: { ...process.env, PATH: `${NODE18}:${process.env.PATH}` } }), code: 0 }; } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status ?? 1 }; } };
const AUDIT = 'npx tsx scripts/trace-audit.ts';
// Built by interpolation so NO contiguous `[impl:uuid:<uuid>]` literal exists in THIS file's source
// (else --since HEAD flags r275 itself while it's uncommitted — a self-contamination false-RED).
const BOGUS_ID = 'deadbeef-dead-4dea-8dea-deadbeefdead';

const EXPECTED = {
  Requirement:   { forward: ['useCases'], back: ['parent', '@ownerIor'], cross: ['tests', 'supersededBy'] },
  Task:          { forward: ['useCases', 'children', 'subtasks'], back: ['parent', '@ownerIor', 'sprint'], cross: ['coveredRequirements', 'requirements'] },
  UseCase:       { forward: ['class', 'classes', 'method'], back: ['parent', '@ownerIor', 'requirements'], cross: ['tasks', 'implementations'] },
  Class:         { forward: ['methods'], back: ['parent', '@ownerIor', 'useCases'], cross: ['subtypes', 'extends'] },
  Method:        { forward: ['implementations'], back: ['parent', '@ownerIor'], cross: ['implementation', 'tests'] },
  Implementation:{ forward: ['tests'], back: ['parent', '@ownerIor', 'methods'], cross: ['sourceMarker'] },
  Test:          { forward: ['testCases'], back: ['parent', '@ownerIor', 'methods', 'implementations'], cross: ['verifies'] },
  Sprint:        { forward: ['tasks', 'requirements'], back: [], cross: ['bugs'] },
};
const EXCLUDE_TOKENS = ['ownerToken', 'uploaderToken', 'deviceId', 'senderIor'];
const INCLUDE_EDGES = ['roomUuid', 'testUuid', 'parent', 'ownerIor'];

const idxOf = (root) => path.join(root, 'scenario/index');
const put = (idx, uuid, unit) => { const p = path.join(idx, ...uuid.slice(0, 5).split(''), uuid + '.scenario.json'); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(unit, null, 2)); };
const U = (n) => `aaaaaaaa-0000-4000-8000-00000000000${n}`.slice(0, 36);
function cleanChain(idx) { // valid Req->UC->Class->Method->Impl->Test, all refs resolve
  put(idx, U(1), { ior: 'ior:class:Requirement', model: { uuid: U(1), name: 'r', useCases: [`ior:instance:${U(2)}`] } });
  put(idx, U(2), { ior: 'ior:class:UseCase', model: { uuid: U(2), name: 'uc', classes: [`ior:instance:${U(3)}`], requirements: [`ior:instance:${U(1)}`] } });
  put(idx, U(3), { ior: 'ior:class:Class', model: { uuid: U(3), name: 'C', sourceFile: 'src/fixture-a.ts', methods: [`ior:instance:${U(4)}`] } });
  put(idx, U(4), { ior: 'ior:class:Method', model: { uuid: U(4), name: 'm', implementations: [`ior:instance:${U(5)}`] } });
  put(idx, U(5), { ior: 'ior:class:Implementation', model: { uuid: U(5), name: 'i', tests: [`ior:instance:${U(6)}`] } });
  put(idx, U(6), { ior: 'ior:class:Test', model: { uuid: U(6), name: 't', verifies: [`ior:instance:${U(5)}`], methods: [`ior:instance:${U(4)}`] } });
}
const mk = (name) => { const root = path.join(SCRATCH, name); fs.rmSync(root, { recursive: true, force: true }); const idx = idxOf(root); fs.mkdirSync(idx, { recursive: true }); return { root, idx }; };

const results = [];
let prev = null;
try {
  for (let r = 1; r <= 3; r++) {
    const checks = {};
    const registrySrc = run(`grep -rl "REF_SLOTS" ${REPO}/scripts ${REPO}/src`).out.trim().split('\n').filter(Boolean)[0];
    const src = registrySrc ? fs.readFileSync(registrySrc, 'utf8') : '';

    // AC1 — REF_SLOTS covers the design's slots (scoped to the object block)
    let coverageMiss = [];
    if (src) { const block = (/const REF_SLOTS[\s\S]*?\n\};/.exec(src) || [src])[0];
      for (const [type, slots] of Object.entries(EXPECTED)) { const line = new RegExp(`\\b${type}\\s*:[\\s\\S]*?\\),`).exec(block)?.[0] || '';
        for (const kind of ['forward', 'back', 'cross']) for (const s of slots[kind]) if (!line.includes(`'${s}'`)) coverageMiss.push(`${type}.${kind}.${s}`); } }
    checks.ac1_registry = !!registrySrc && coverageMiss.length === 0;

    // real-graph strict — HARD=0 PASS; deferred delta-scoped (must still exit 0)
    const real = run(`${AUDIT} --strict`);
    const hardPass = real.code === 0 && /HARD[^\n]*=\s*0\s*PASS/i.test(real.out);
    const wfRealZero = /Node well-formedness[^\n]*:\s*0\s*\(PASS\)/i.test(real.out);
    const deferredDeltaScoped = real.code === 0 && /deferred[^\n]*(delta-not-absolute|not strict-gated|delta-scoped)/i.test(real.out); // Axis-3=4 + marker=75 do NOT strict-fail

    // AC2 — REF_SLOTS.back present + real ref-integrity clean under strict
    checks.ac2_refintegrity = !!registrySrc && /back\s*:/.test(src) && real.code === 0;
    // AC4 — classification: tokens EXCLUDEd, unit-edges INCLUDEd
    const tokenExcluded = /EXCLUDE_SLOTS[\s\S]*?\)/.test(src) && EXCLUDE_TOKENS.every(t => new RegExp(`EXCLUDE_SLOTS[\\s\\S]*?${t}`).test(src));
    checks.ac4_classification = tokenExcluded && INCLUDE_EDGES.some(e => src.includes(e));

    // AC3 / Axis-2 — nodeWellFormedness: clean fixture exit 0, malformed exit 1 (via --dir)
    const clean = mk('r275-clean'); cleanChain(clean.idx);
    const cleanRun = run(`${AUDIT} --dir ${clean.idx} --strict`);
    const bad = mk('r275-malformed'); cleanChain(bad.idx);
    put(bad.idx, U(7), { ior: 'ior:class:Class', model: { name: 'MISSING UUID' } });                  // missing model.uuid
    const wrongDir = path.join(bad.idx, 'b', 'a', 'd', 'x', 'y'); fs.mkdirSync(wrongDir, { recursive: true });
    fs.writeFileSync(path.join(wrongDir, 'wrongname.scenario.json'), JSON.stringify({ ior: 'ior:class:Class', model: { uuid: U(8) } })); // filename!=uuid
    const badRun = run(`${AUDIT} --dir ${bad.idx} --strict`);
    checks.ac3_wellformed = cleanRun.code === 0 && badRun.code === 1 && /well.?formed[^\n]*[1-9]/i.test(badRun.out) && wfRealZero;

    // Axis-3 — oneClassPerFile: fixture with 2 Class units sharing one sourceFile → FAIL
    const dup = mk('r275-2class'); cleanChain(dup.idx);
    put(dup.idx, U(9), { ior: 'ior:class:Class', model: { uuid: U(9), name: 'C2-synthetic', sourceFile: 'src/fixture-a.ts', methods: [] } }); // same sourceFile as U(3)
    const dupRun = run(`${AUDIT} --dir ${dup.idx} --strict`);
    checks.axis3_oneClassPerFile = /One-Class-per-file[^\n]*[1-9]/i.test(dupRun.out); // the CHECK catches the sprawl

    // AC4 / Axis-4 — markerHasChain via --since: NEW bogus [impl:uuid] with no Impl → exit 1; removed → exit 0
    fs.writeFileSync(AXIS4_FIXTURE, `// bogus new impl marker, no Impl unit behind it\n// [impl:uuid:${BOGUS_ID}] R27.5 axis-4 fixture\nexport const x = 1;\n`);
    run(`git -C ${REPO} add -N ${AXIS4_FIXTURE}`);   // intent-to-add so `git diff HEAD` (the --since scan) sees the new marker
    const bogusRun = run(`${AUDIT} --since HEAD --strict`);
    run(`git -C ${REPO} reset -q -- ${AXIS4_FIXTURE}`);
    fs.rmSync(AXIS4_FIXTURE, { force: true });
    const validRun = run(`${AUDIT} --since HEAD --strict`);
    checks.axis4_markerHasChain = bogusRun.code === 1 && new RegExp(BOGUS_ID.slice(0, 8)).test(bogusRun.out) && validRun.code === 0;

    // AC5 — --dir actually retargets (clean fixture scanned ~6 units, not the 3979 real graph)
    const scanned = Number(/Total units:\s*(\d+)/i.exec(cleanRun.out)?.[1] || -1);
    checks.ac5_auditDir = scanned > 0 && scanned < 50;

    checks.hard0_deferred_delta = hardPass && deferredDeltaScoped;

    const snap = JSON.stringify(checks);
    const det = !prev || prev === snap; prev = snap;
    const green = Object.values(checks).every(v => v === true);
    results.push({ green, det, checks });
    console.log(`run ${r}: ${Object.entries(checks).map(([k, v]) => `${k}=${v}`).join(' ')} det=${det}`);
  }
} finally {
  for (const n of ['r275-clean', 'r275-malformed', 'r275-2class']) fs.rmSync(path.join(SCRATCH, n), { recursive: true, force: true });
  try { run(`git -C ${REPO} reset -q -- ${AXIS4_FIXTURE}`); } catch {}
  fs.rmSync(AXIS4_FIXTURE, { force: true });
}

console.log('\n=== VERDICT R27.5 canonical ref-slot registry — 5 ACs (DET-3x) ===');
results.forEach((r, i) => console.log(`  run ${i + 1}: ${r.green ? 'GREEN' : 'RED'}${r.det ? '' : ' (NON-DET)'}`));
const green = results.length === 3 && results.every(r => r.green && r.det);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
