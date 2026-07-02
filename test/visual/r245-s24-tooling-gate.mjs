// T24.4 + T24.5 tooling gates. Verifies the sprint-MD generator/checker and the strict
// trace audit work (DET-3x). Bridged by their Test units (markers below).
//   T24.4 generateSprint (impl 41c86206): `generate-sprint-md.ts --check --all` runs the
//         byte-diff checker and reports "Result: N/M sprints byte-match".
//   T24.5 Audit.strict (impl 08706df5): `objectVerb Audit strict` runs the strict audit.
// [test:uuid:82ca355c-4b14-41c3-bb7c-a483b259c42d] T24.4 generateSprint — generate-sprint-md --check byte-diff checker
// [test:uuid:1b3682c8-a347-4e85-8188-f1faef3f5ae3] T24.5 Audit.strict — trace audit strict runs + reports

import { execSync } from 'child_process';
const REPO = '/var/dev/Workspaces/2cuGitHub/Web4RawBin';
const run = (cmd) => { try { return { out: execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 }), code: 0 }; } catch (e) { return { out: (e.stdout || '') + (e.stderr || ''), code: e.status ?? 1 }; } };
const OV = 'npx tsx scripts/objectVerb.ts';

const results = [];
let prev = null;
for (let r = 1; r <= 3; r++) {
  // T24.4 — the checker runs + reports a byte-match result (drift detection works; exit code
  // reflects drift, NOT tool failure). The tool WORKS iff it emits the Result line.
  const md = run(`npx tsx scripts/generate-sprint-md.ts --check --all`);
  const mdM = md.out.match(/Result:\s*(\d+)\/(\d+)\s*sprints byte-match/i);
  const genOk = !!mdM && !/is not a function|Cannot find|TypeError/i.test(md.out);

  // T24.5 — strict audit runs and produces output (no crash)
  const au = run(`${OV} Audit strict`);
  const auditOk = au.out.length > 0 && !/is not a function|Cannot find|TypeError|Unknown object/i.test(au.out);

  const snap = { md: mdM ? `${mdM[1]}/${mdM[2]}` : null, auLen: au.out.length };
  const det = !prev || (prev.md === snap.md);
  prev = snap;

  const pass = genOk && auditOk && det;
  results.push(pass);
  console.log(`run ${r}: T24.4 generate-md(${snap.md})=${genOk} | T24.5 audit.strict(${au.out.length}c)=${auditOk} | det=${det} => ${pass ? 'GREEN' : 'RED'}`);
}

console.log('\n=== VERDICT S24 tooling T24.4/T24.5 (DET-3x) ===');
results.forEach((p, i) => console.log(`  run ${i + 1}: ${p ? 'GREEN' : 'RED'}`));
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exit(green ? 0 : 1);
