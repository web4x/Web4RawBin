// T37.35 AXIS-2 lint — task<->req AC PARITY (R37.34 7698c63b, OWNER=tester). R37.3's byte-check is BLIND to task<->req AC drift:
// T37.20's task rendered 6 ACs while its covered req R37.20 (03e0f803) has 8 — S37 still byte-matched (the view miscounted; the
// req unit is right). This lint asserts the SEMANTIC invariant: for EACH task, its AC count == the covered requirement's AC count
// (the req is the source of truth). A task showing N while its covered req has M!=N => RED. FAILABLE 1->0. Counted, mark-not-silence.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const ROOT = path.resolve('.');
const IDX = path.join(ROOT, 'scenario/index');
const sp = (u) => path.join(IDX, ...u.slice(0, 5).split(''), `${u}.scenario.json`);
// count ACs in a task's acceptanceCriteria (string of '- [ ]' checkbox lines) OR array
const taskAcCount = (ac) => Array.isArray(ac) ? ac.length : (String(ac || '').match(/^\s*[-*]\s*\[[ xX]?\]/gm) || []).length;
const reqAcCount = (ac) => Array.isArray(ac) ? ac.length : (ac && typeof ac === 'object' ? Object.keys(ac).length : 0);
const load = (u) => { try { return JSON.parse(fs.readFileSync(sp(u), 'utf8')); } catch { return null; } };

function scan(extraTask) {
  const tasks = [];
  (function w(d) { let e; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const x of e) { if (x.isSymbolicLink()) continue; const p = path.join(d, x.name);
      if (x.isDirectory()) { w(p); continue; }
      if (!x.name.endsWith('.scenario.json')) continue;
      try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if ((j.ior || '') === 'ior:class:Task' && Array.isArray(j.model?.coveredRequirements) && j.model.coveredRequirements.length) tasks.push(j.model); } catch {} }
  })(IDX);
  if (extraTask) tasks.push(extraTask);
  const violations = [];
  let checked = 0;
  for (const m of tasks) {
    const tc = taskAcCount(m.acceptanceCriteria);
    let rc = 0, reqOk = true;
    for (const rref of m.coveredRequirements) { const ru = load(rref.replace('ior:instance:', '')); if (!ru) { reqOk = false; break; } rc += reqAcCount(ru.model?.acceptanceCriteria); }
    if (!reqOk) continue; // covered-req unresolvable → skip (a referential-integrity concern, not AC-parity)
    checked++;
    if (tc !== rc) violations.push({ name: (m.name || m.uuid || '').slice(0, 46), uuid: (m.uuid || '').slice(0, 8), tc, rc, sprintName: String(m.sprintName || ''), status: String(m.status || '') });
  }
  return { checked, violations };
}

const { checked, violations } = scan();
R(`═══ T37.35 AXIS-2 — task<->req AC PARITY (task AC count == covered-req AC count) ═══`);
R(`  tasks checked (have coveredRequirements, req resolvable): ${checked}`);
R(`  PARITY VIOLATIONS (task-count != req-count) : ${violations.length}  ${violations.length === 0 ? 'GREEN' : 'RED'}`);
for (const v of violations.slice(0, 25)) R(`    ${v.uuid} ${v.name.padEnd(46)} task=${v.tc} vs req=${v.rc}`);
if (violations.length > 25) R(`    …+${violations.length - 25} more`);
const seed = violations.find((v) => /Task 37\.20:/.test(v.name)); // the MAIN task (colon), not a 37.20.x sub-task
R(`  SEEDS T37.20 (its own 6-vs-8 is a tracked RED): ${seed ? `CAUGHT (task=${seed.tc} vs req=${seed.rc})` : 'not in violation set'}`);
const emptyAc = violations.filter((v) => v.tc === 0).length;
R(`  breakdown: ${emptyAc} tasks list 0 ACs (cover a req but show none) · ${violations.length - emptyAc} non-empty count-mismatches`);

// ── FAILABLE 1->0 (self-biting): inject a synthetic task whose AC count != its covered req → the lint MUST count one more; a
//    parity-matched synthetic must NOT add one. Uses a REAL resolvable req (T37.20's, 8 ACs). Proves it can fail AND pass.
const REQ = 'ior:instance:03e0f803-4b71-4d7d-81d0-e7d9c5040a57'; // 8 ACs
const badTask = { uuid: 'stub-bad', name: 'STUB parity-violation', coveredRequirements: [REQ], acceptanceCriteria: '- [ ] only one\n' }; // 1 vs 8
const goodTask = { uuid: 'stub-good', name: 'STUB parity-ok', coveredRequirements: [REQ], acceptanceCriteria: Array.from({ length: 8 }, (_, i) => `ac${i}`) }; // 8 vs 8
const withBad = scan(badTask).violations.length;
const withGood = scan(goodTask).violations.length;
const teeth = withBad === violations.length + 1 && withGood === violations.length;
R(`  FAILABLE self-test (inject 1-vs-8 => +1 RED; inject 8-vs-8 => +0): ${teeth ? 'PASS (self-biting — a real parity drift cannot pass)' : `FAIL (bad=${withBad} good=${withGood} base=${violations.length})`}`);

// RATCHET (PO ruling 2026-09-06): the count is the RECORDED BASELINE — it must NEVER increase (touch-it-fix-it, no shrinking
// denominator). CURRENT-ERA (S37, In-Progress/QA-Review) must reach ZERO; legacy is ratcheted. A number that only reports drifts;
// a number that GATES cannot. So the gate FAILS if total EXCEEDS baseline OR any current-era task violates.
const BASELINE = 140;
const currentEra = violations.filter((v) => /Sprint 37|S37|37/i.test(v.sprintName) && /In Progress|QA/i.test(v.status));
R(`  RATCHET baseline=${BASELINE} · current-era(S37 In-Progress/QA) violations (must be 0): ${currentEra.length}${currentEra.length ? ' → ' + currentEra.map((v) => v.uuid).join(',') : ''}`);
const ratchetOk = violations.length <= BASELINE;
const green = ratchetOk && currentEra.length === 0 && teeth;
R(`OVERALL: ${green ? 'GREEN (ratchet held + current-era clean)' : `RED — ${!ratchetOk ? `count ${violations.length} EXCEEDS baseline ${BASELINE} (a NEW parity drift was introduced)` : currentEra.length ? `${currentEra.length} current-era violation(s) (must reach 0)` : 'teeth fail'}`}`);
R(`  (COUNT parity now; id-level parity = a refinement once req ACs carry stable ids. Mark-not-silence: ${checked} checked / ${violations.length} listed; baseline ${BASELINE} = ratchet ceiling.)`);
process.exit(green ? 0 : 1);
