// T37.36 AXIS-3 lint — QA-is-a-SWITCH-STATE validity (R37.34 7698c63b, OWNER=tester). Tron: QA-Review is a SWITCH, not a resting
// state — nothing parks in QA; it moves forward to Done (Tron's act) or BACK to In-Progress the moment evidence is invalidated.
// T40.85 rotted at 'Done-pending-Tron' for days while the customer's upload was broken = the scoreboard LYING. This lint makes a
// parked QA item (no NAMED waiting-on) RED by construction. RED-baseline the drift, RATCHET it, current-era→0. FAILABLE 1->0.
import fs from 'node:fs';
import path from 'node:path';
const R = (v) => console.log(v);
const IDX = path.resolve('scenario/index');
// a QA item is VALID only if it NAMES what it waits ON (the switch trigger): a waitingOn/switchDirection field, OR a status that
// names it (QA-Review-with-open-CR), OR waiting-on text. Neither → it just parks = RED (reads as finished when it is not).
const WAIT = /waiting on|awaiting|pending (tron|deploy|review|evidence|expert|qa)|blocked on|held for|verifies|re-verif|Tron (accept|qa|confirm|rule)/i;
const isValid = (m) => {
  if (m.waitingOn || m.switchDirection) return true;
  if (/open-CR|open CR/i.test(String(m.status || ''))) return true; // status names the waiting-on (an open change-request)
  return WAIT.test(String(m.remainingIssues || '') + ' ' + String(m.description || ''));
};

function scan(extra) {
  const qa = [];
  (function w(d) { let e; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const x of e) { if (x.isSymbolicLink()) continue; const p = path.join(d, x.name);
      if (x.isDirectory()) { w(p); continue; }
      if (!x.name.endsWith('.scenario.json')) continue;
      try { const j = JSON.parse(fs.readFileSync(p, 'utf8')); if ((j.ior || '') === 'ior:class:Task' && /qa/i.test(String(j.model?.status || ''))) qa.push(j.model); } catch {} }
  })(IDX);
  if (extra) qa.push(extra);
  const invalid = qa.filter((m) => !isValid(m)).map((m) => ({ name: (m.name || m.uuid || '').slice(0, 44), uuid: (m.uuid || '').slice(0, 8), sprintName: String(m.sprintName || ''), status: String(m.status || '') }));
  return { count: qa.length, invalid };
}

const { count, invalid } = scan();
R(`═══ T37.36 AXIS-3 — QA-is-a-SWITCH-STATE (every QA item NAMES a waiting-on) ═══`);
R(`  QA-Review tasks: ${count}`);
R(`  PARKED (no named waiting-on/switch) : ${invalid.length}  ${invalid.length === 0 ? 'GREEN' : 'RED'}`);
for (const v of invalid.slice(0, 20)) R(`    ${v.uuid} ${v.name.padEnd(44)} [${v.status}]`);
if (invalid.length > 20) R(`    …+${invalid.length - 20} more`);

// FAILABLE 1->0: a synthetic parked QA item (no waiting-on) MUST add one; giving it a waiting-on MUST remove it.
const parked = { uuid: 'stub-parked', name: 'STUB parked-QA', status: 'QA Review', remainingIssues: '', description: '' };
const switched = { uuid: 'stub-switched', name: 'STUB switched-QA', status: 'QA Review', remainingIssues: 'awaiting Tron QA accept (forward to Done)' };
const withParked = scan(parked).invalid.length, withSwitched = scan(switched).invalid.length;
const teeth = withParked === invalid.length + 1 && withSwitched === invalid.length;
R(`  FAILABLE self-test (parked→+1 RED; named-waiting-on→+0): ${teeth ? 'PASS (self-biting — a parked QA item cannot read as finished)' : `FAIL (parked=${withParked} switched=${withSwitched} base=${invalid.length})`}`);

// RATCHET + current-era (PO A1 pattern): baseline must never increase; current-era S37 QA must reach 0.
const BASELINE = 75;
const currentEra = invalid.filter((v) => /Sprint 37|S37|37/i.test(v.sprintName));
R(`  RATCHET baseline=${BASELINE} · current-era(S37) parked (must be 0): ${currentEra.length}${currentEra.length ? ' → ' + currentEra.map((v) => v.uuid).join(',') : ''}`);
const green = invalid.length <= BASELINE && currentEra.length === 0 && teeth;
R(`OVERALL: ${green ? 'GREEN (ratchet held + current-era clean)' : `RED — ${invalid.length > BASELINE ? `count ${invalid.length} EXCEEDS baseline ${BASELINE}` : currentEra.length ? `${currentEra.length} current-era parked-QA (must switch or name a waiting-on)` : 'teeth fail'}`}`);
R(`  (mark-not-silence: ${count} QA / ${invalid.length} parked. Refinements: switch-DIRECTION field + evidence-invalidation check once tasks carry structured waitingOn. Seeds T40.85.)`);
process.exit(green ? 0 : 1);
