// [test:uuid:6b3f9d21-7a4c-4e08-b512-9f1c0e6d38a7] R-C2 prune (SprintViewGenerator.pruneSprintOrphans / guardedDelete e1ff295f,
// GENERATED_HEADER_PREFIX ownership — the root fix for the 6 sprint-19 orphans the R-C2 write-gate caught). POSITIVE-CONTROL
// bites (skill-expert spec) — not just "did it delete the orphan" but "did it keep everything it must". Isolated git worktree
// (zero live-tree pollution). R40.30 doctrine: stub/weaken-must-fail (break isSprintMdOwnedName → the design-* protection bite
// goes RED), family=owned-output-prune, LOUD on missing tool output. Co-gates with rc2-reconcile-all-write-gate.mjs.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/rc2b-wt';
const PREFIX = '<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->\n';
const sh = (cmd, cwd) => { try { return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return (e.stdout || '') + '\n' + (e.stderr || ''); } };
const prune = (dry) => sh(`npx tsx scripts/generate-sprint-md.ts --all --prune ${dry ? '--dry-run' : ''}`, WT);

sh(`git worktree remove --force "${WT}"`, REPO);
execSync(`git worktree add --force --detach "${WT}" HEAD`, { cwd: REPO });
execSync(`ln -sfn "${REPO}/node_modules" "${WT}/node_modules"`);

// choose a real IN-SCOPE (num>=19) sprint dir and a FROZEN (num<=18) one that exist at HEAD
const sprintsDir = path.join(WT, 'scrum.pmo/sprints');
const dirs = fs.readdirSync(sprintsDir).filter(d => fs.statSync(path.join(sprintsDir, d)).isDirectory());
const numOf = (d) => { const m = /sprint-(\d+)/.exec(d); return m ? +m[1] : -1; };
const CUR = dirs.filter(d => numOf(d) >= 19).sort((a, b) => numOf(b) - numOf(a))[0]; // HIGHEST-num in-scope sprint (definitely current-era, proper model.number)
const FROZEN = dirs.find(d => { const m = /sprint-(\d+)/.exec(d); return m && +m[1] >= 1 && +m[1] <= 18; });
let results = {};
try {
  const curDir = path.join(sprintsDir, CUR), frzDir = path.join(sprintsDir, FROZEN);
  // 4 fixtures in the CURRENT-era sprint + 1 frozen-era control — all names guaranteed NOT in buildSprintOutput
  const F = {
    orphan: 'rc2fix-orphan-view.md',        // (1) generated-prefix + owned .md + not-produced → MUST PRUNE
    hand: 'rc2fix-hand-authored.md',        // (2) NO header → MUST SURVIVE (guardedDelete refuses unmarked)
    design: 'design-rc2fix.md',             // (3) WITH prefix but design-* → MUST SURVIVE (isSprintMdOwnedName excludes)
    puml: 'rc2fix.puml',                    // (4) not .md → MUST SURVIVE
    era: 'rc2fix-era-orphan-view.md',       // frozen-era orphan (prefix) → MUST SURVIVE (isCurrentEra)
  };
  fs.writeFileSync(path.join(curDir, F.orphan), PREFIX + '# orphan\n');
  fs.writeFileSync(path.join(curDir, F.hand), '# hand authored, no header\n');
  fs.writeFileSync(path.join(curDir, F.design), PREFIX + '# design brief\n');
  fs.writeFileSync(path.join(curDir, F.puml), PREFIX + '@startuml\n@enduml\n');
  fs.writeFileSync(path.join(frzDir, F.era), PREFIX + '# frozen-era orphan\n');

  // dry-run: reports the orphan WOULD prune, deletes nothing
  const dry = prune(true);
  const loud = /orphan|Total:/.test(dry);
  const dryListsOrphan = new RegExp(`- ${F.orphan}`).test(dry);
  const dryNothingDeleted = fs.existsSync(path.join(curDir, F.orphan)); // dry-run must NOT delete

  // real prune
  const real = prune(false);
  const survives = (dir, f) => fs.existsSync(path.join(dir, f));
  const c1_orphanPruned = !survives(curDir, F.orphan);
  const c2_handSurvives = survives(curDir, F.hand);
  const c3_designSurvives = survives(curDir, F.design);
  const c4_pumlSurvives = survives(curDir, F.puml);
  const cEra_frozenSurvives = survives(frzDir, F.era);
  const positives = loud && dryListsOrphan && dryNothingDeleted && c1_orphanPruned && c2_handSurvives && c3_designSurvives && c4_pumlSurvives && cEra_frozenSurvives;

  // WEAKEN-MUST-FAIL: allow design-* through isSprintMdOwnedName → the design-* positive-control (3) MUST break (design gets pruned)
  const gsm = path.join(WT, 'scripts/generate-sprint-md.ts');
  const src = fs.readFileSync(gsm, 'utf8');
  fs.writeFileSync(gsm, src.replace('&& !/^design-.*\\.md$/.test(n)', '/* WEAKENED design-guard */'));
  fs.writeFileSync(path.join(curDir, F.design), PREFIX + '# design brief\n'); // re-plant (real prune above didn't touch it)
  prune(false);
  const weakenCaught = !survives(curDir, F.design); // with the guard weakened, design-* is now (wrongly) pruned → the bite fires

  const pass = positives && weakenCaught;
  results = { pass, c1_orphanPruned, c2_handSurvives, c3_designSurvives, c4_pumlSurvives, cEra_frozenSurvives, dryListsOrphan, dryNothingDeleted, weakenCaught };
  console.log(`R-C2 prune positive-control gate (isolated worktree, in-scope=${CUR}, frozen=${FROZEN}):`);
  console.log(`  DRY-RUN: lists orphan=${dryListsOrphan}, deletes-nothing=${dryNothingDeleted}`);
  console.log(`  (1) orphan generated .md PRUNED         = ${c1_orphanPruned}`);
  console.log(`  (2) hand-authored (no header) SURVIVES  = ${c2_handSurvives}`);
  console.log(`  (3) design-*.md (w/ prefix) SURVIVES    = ${c3_designSurvives}`);
  console.log(`  (4) diagrams/*.puml SURVIVES            = ${c4_pumlSurvives}`);
  console.log(`  (era) frozen S<=18 orphan SURVIVES      = ${cEra_frozenSurvives}`);
  console.log(`  WEAKEN-MUST-FAIL: guard weakened → design-* wrongly pruned (bite fires) = ${weakenCaught}`);
  console.log(`OVERALL: ${pass ? 'GREEN — prune deletes ONLY the true orphan, keeps all guarded classes, weaken-bite proven' : 'RED'}`);
} finally {
  sh(`git worktree remove --force "${WT}"`, REPO);
  const leaked = sh("grep -rl rc2fix scrum.pmo/sprints", REPO).trim();
  console.log(`pollution-safe (no fixture leaked to live tree): ${leaked ? 'NO — LEAKED: ' + leaked : 'YES (worktree isolation held)'}`);
}
process.exitCode = results.pass ? 0 : 1;
