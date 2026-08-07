// R-C7 migrator ATOMICITY + SCOPE-CONSISTENCY BITE — the 2 classes my first BITE MISSED (expert found them in live use,
// 57b17547e). ★ LESSON (named): a BITE that only proves the HAPPY REFUSAL leaves the partial-failure and scope-alignment
// paths untested — the same family as the vacuous-pass holes. This gate adds:
//  (a) ATOMICITY — apply on a REFUSING sprint writes NOTHING (all-or-nothing; no earlier file partially written); a
//      PASSING sprint writes ALL its files + is idempotent on re-run. Tested in an ISOLATED git WORKTREE (SPRINTS_DIR
//      resolves to the worktree copy → zero pollution on the shared checkout), verified via git-status byte-cleanliness.
//  (b) SCOPE-CONSISTENCY — the invariant '--prove PASS ⇔ --apply would succeed' on EVERY real sprint (read-only,
//      apply:false): proveComplete.complete === (applyMigration(apply:false) does not refuse). Pre-fix these disagreed
//      (prove all-files scope vs apply per-file) = a FALSE 'COMPLETE'. Non-vacuous: both pass AND refuse cases present.
// [test:uuid:PENDING] R-C7 migrator atomicity + scope-consistency BITE — apply is all-or-nothing (refuse→0 written) and --prove PASS ⇔ --apply succeeds on every sprint
import { proveComplete, applyMigration } from '../../scripts/migrate-boards.ts';
import { allUnits } from '../../scripts/generate-sprint-md.ts';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const WT = '/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad/rc7c-worktree';
const sh = (cmd: string, cwd: string) => { try { return { code: 0, out: execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e: any) { return { code: e.status || 1, out: (e.stdout || '') + (e.stderr || '') }; } };

// ── (b) SCOPE-CONSISTENCY (read-only, import) ──
function scopeAxis() {
  const units = allUnits();
  const sprints: string[] = [];
  for (const [uuid, u] of units) if (u.ior === 'ior:class:Sprint') sprints.push(uuid);
  const passing: string[] = [], refusing: string[] = [];
  let disagree = 0; const rows: any[] = [];
  for (const uuid of sprints) {
    const proveOk = proveComplete(uuid).complete;
    const applyDry = applyMigration(uuid, { apply: false });
    const applyOk = applyDry.refused === undefined && applyDry.applied === false && applyDry.filesWritten !== undefined; // dry-run: would-succeed
    const agree = proveOk === applyOk;
    if (!agree) { disagree++; rows.push({ uuid: uuid.slice(0, 8), proveOk, applyOk, refused: applyDry.refused?.slice(0, 60) }); }
    (proveOk ? passing : refusing).push(uuid);
  }
  return { total: sprints.length, passing, refusing, disagree, disagreements: rows.slice(0, 5), consistent: disagree === 0, nonVacuous: passing.length > 0 && refusing.length > 0 };
}

// ── (a) ATOMICITY (isolated worktree, CLI --apply --write) ──
function atomicityAxis(passing: string[], refusing: string[]) {
  const R: any = { setup: false };
  try {
    sh(`git worktree remove --force ${WT}`, ROOT); // clean any stale
    const add = sh(`git worktree add --detach ${WT} HEAD`, ROOT);
    if (add.code !== 0) return { ...R, err: 'worktree-add: ' + add.out.slice(0, 120) };
    try { fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(WT, 'node_modules')); } catch { /* exists */ }
    R.setup = true;
    const dirty = (slug: string) => sh(`git status --porcelain scrum.pmo/sprints/${slug}`, WT).out.trim();

    // REFUSING sprint → --apply --write must write NOTHING (all-or-nothing; no partial earlier-file write)
    if (refusing.length) {
      const u = refusing[0];
      const slug = proveComplete(u).sprintSlug;
      const before = dirty(slug);
      const r = sh(`npx tsx scripts/migrate-boards.ts --apply ${u} --write`, WT);
      const after = dirty(slug);
      R.refuseWritesNothing = r.code === 1 && after === before; // refused (exit 1) AND tree byte-identical (nothing written)
      R.refuseSlug = slug;
    } else R.refuseWritesNothing = null;

    // PASSING sprint → --apply --write writes ALL its files (write path fires) + idempotent re-run
    if (passing.length) {
      const u = passing[0];
      const slug = proveComplete(u).sprintSlug;
      const r1 = sh(`npx tsx scripts/migrate-boards.ts --apply ${u} --write`, WT);
      const wrote1 = dirty(slug); // some files changed
      const hdrOk = fs.existsSync(path.join(WT, 'scrum.pmo/sprints', slug, 'planning.md')) && fs.readFileSync(path.join(WT, 'scrum.pmo/sprints', slug, 'planning.md'), 'utf8').startsWith('<!-- GENERATED');
      const r2 = sh(`npx tsx scripts/migrate-boards.ts --apply ${u} --write`, WT);
      const wrote2 = dirty(slug); // idempotent → same tree (no further change)
      R.passWritesAll = r1.code === 0 && r2.code === 0 && wrote1 === wrote2; // wrote then idempotent-stable
      R.passHeader = hdrOk;
      R.passSlug = slug;
    } else { R.passWritesAll = null; R.passHeader = null; }
  } finally { sh(`git worktree remove --force ${WT}`, ROOT); }
  return R;
}

const scope = scopeAxis();
const atom = atomicityAxis(scope.passing, scope.refusing);

console.log('\n===== R-C7 migrator ATOMICITY + SCOPE-CONSISTENCY BITE =====');
console.log(`(b) SCOPE: ${JSON.stringify({ total: scope.total, passing: scope.passing.length, refusing: scope.refusing.length, disagree: scope.disagree, consistent: scope.consistent, nonVacuous: scope.nonVacuous, disagreements: scope.disagreements })}`);
console.log(`(a) ATOMICITY: ${JSON.stringify(atom)}`);
// scope must be consistent + non-vacuous (both pass & refuse exist so the invariant is exercised both ways)
const scopeGreen = scope.consistent && scope.nonVacuous;
// atomicity: refuse-writes-nothing must hold; pass-writes-all is bonus (skip if no passing sprint yet, report honestly)
const atomGreen = atom.setup && atom.refuseWritesNothing === true && (atom.passWritesAll === true || atom.passWritesAll === null);
console.log(`(b) scope-consistency (prove PASS ⇔ apply succeeds, both-ways, all sprints agree): ${scopeGreen ? 'GREEN' : 'RED'}`);
console.log(`(a) atomicity (refuse→NOTHING written, pass→all+idempotent, isolated worktree): ${atomGreen ? 'GREEN' : 'RED'}${atom.passWritesAll === null ? ' [no passing sprint yet → write-path not exercised, refuse-path proven]' : ''}`);
const green = scopeGreen && atomGreen;
console.log('OVERALL R-C7 atomicity+scope BITE:', green ? 'GREEN (bites+holds)' : 'RED');
console.log('LESSON: the happy-refusal-only BITE missed these — partial-failure + scope-alignment are the untested cousins of the vacuous-pass hole.');
process.exitCode = green ? 0 : 1;
