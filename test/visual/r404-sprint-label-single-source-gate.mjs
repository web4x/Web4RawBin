// [test:uuid:d7e4b9a1-3c62-4f18-b0a5-6e91f2c8d340] R40.4 SprintLabel.sprintLabel (Impl e7fb7e65) — the 'Sprint <number>'
// DISPLAY format is composed in EXACTLY ONE place (sprintPrefix @ src/ts/scenario/sprint-label.ts) and that invariant is
// ENFORCED (not merely claimed): scripts/check-sprint-label.ts fails the build on any other src/scripts composition site.
// Independent tester verify (measured differently than the expert's build-check): (1) global grep = single composition
// site; (2) enforcing gate PASSes clean (exit 0); (3) BITE — a planted bypass makes the gate FAIL (exit 1) and removing it
// restores exit 0, proving the enforcement genuinely bites (correct-by-construction, not a false-green). DET-3x.
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const NODE = '/opt/node22/bin/node';
const runGate = () => { try { execSync(`${NODE} --import tsx scripts/check-sprint-label.ts`, { cwd: ROOT, stdio: 'pipe' }); return 0; } catch (e) { return e.status || 1; } };
const grepComposition = () => {
  // broad net (template + concat, incl gate-regex-gap variants) across src+scripts, excluding the ONE allowed home
  const out = execSync(`grep -rnE "Sprint \\\\\\$\\{|['\\"]Sprint ['\\"] *\\+" src scripts --include=*.ts --include=*.mjs || true`, { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').filter(l => l.trim() && !/sprint-label\.ts|check-sprint-label\.ts|\.(test|spec)\./.test(l));
};

const PROBE = `${ROOT}/scripts/__r404_bite_probe.ts`;
const results = [];
for (let i = 1; i <= 3; i++) {
  const cleanExit = runGate();                      // (2) clean → PASS
  const offenders = grepComposition();              // (1) single-source
  // (3) BITE: plant a bypass under a scanned dir → gate must FAIL, then restore
  fs.writeFileSync(PROBE, 'export const _p = `Sprint ${1}` + (\'Sprint \' + 2);\n');
  const biteExit = runGate();
  fs.rmSync(PROBE, { force: true });
  const restoredExit = runGate();

  const pass = cleanExit === 0 && offenders.length === 0 && biteExit === 1 && restoredExit === 0;
  results.push(pass);
  console.log(`iter ${i}: clean=exit${cleanExit} single-source=${offenders.length === 0}(${offenders.length} offenders) BITE=exit${biteExit}(want 1) restored=exit${restoredExit} => ${pass ? 'GREEN' : 'RED'}`);
}
const green = results.length === 3 && results.every(Boolean);
console.log('OVERALL:', green ? 'GREEN DET-3x' : 'RED');
process.exitCode = green ? 0 : 1;
