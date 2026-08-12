/**
 * Pre-commit auto-regen of the sprints.overview.md generated index (T37.6).
 *
 * WHY (measured, PO 2026-08-11): T37.6's --check went RED THREE times with THREE different causes — a stale
 * committed artifact, drift during active work, and a commit-vs-write race (committed overview one line off from
 * regen-of-committed-units). The generator is PROVEN IDEMPOTENT, so it is not a tool bug; the tester's conclusion
 * is structural: a human cannot hold a quiesce window on a live multi-agent tree. So the fix is to make drift
 * IMPOSSIBLE rather than to keep winning the race — regen happens INSIDE the commit, so the committed overview
 * always equals regen-of-committed-units BY CONSTRUCTION.
 *
 * Chain: R37.6 -> UC overview.autoRegenOnCommit (4dfcf5ea) -> Class PrecommitOverviewRegen (d63e557b) ->
 * Method (304a0da7) -> Impl autoRegenOverview (b886ef5d). Distinct-intent from generateOverview (1f38e07e), which
 * BUILDS the index string; this ORCHESTRATES the commit-flow regen + deletion-check + anti-sweep + stage. Rides the
 * R37.8 owned-output-guard (guardedWriteRegion).
 *
 * Invoked by .githooks/pre-commit ONLY when staged scenario units change (or a scrum.pmo doc is being deleted) —
 * the tsx cost is paid only then; the fast node-only path is unchanged. Every step is FAIL-CLOSED.
 *   (1) DELETION-CHECK (always) — refuse to commit a staged deletion of an UNMARKED (hand-authored) scrum.pmo
 *       knowledge doc. The commit-boundary form of the fleet deletion-check: an unowned doc can never be swept
 *       out by a commit (the 3-docs-vanished incident, 2026-08-09).
 *   (2) REGEN (only when units staged) — regenerate the between-markers index via the shared owned-output-guard
 *       (guardedWriteRegion): the hand-authored narrative OUTSIDE the markers is preserved byte-for-byte (C7);
 *       a markerless / hand-authored / wrong-name target is NEVER clobbered.
 *   (3) SHARED-INDEX SAFETY — never sweep an UNSTAGED narrative edit into this commit (the path-limited-commit
 *       rule at the hook boundary): if the overview's content outside the region differs from what is being
 *       committed, fail-closed and tell the committer to resolve it.
 *   (4) VERIFY (stub-must-fail tripwire) — the freshly-written index MUST pass --check; a broken generator
 *       (deliberately or by regression) goes RED here and BLOCKS the commit.
 *   (5) STAGE — `git add` the overview so the regen is IN this commit.
 *
 * KNOWN BOUND (honest, no silent cap): the index is regenerated from the WORKING-TREE Sprint units, so under
 * partial peer-staging it reflects working-tree units, not strictly the staged subset — this self-heals on the
 * next unit commit and the overview --check is intentionally NOT in ci:gates (automate-before-gate), so an
 * intermediate skew never blocks. It kills all three observed T37.6 REDs (stale / drift / commit-vs-write race).
 *
 * Run manually: /opt/node22/bin/node --import tsx scripts/precommit-regen-overview.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { SprintOverviewGenerator, BEGIN, END } from '../src/ts/scenario/sprint-overview-generator.js';
import { guardedWriteRegion } from './owned-output-guard.js';
import { GENERATED_HEADER_PREFIX } from './generate-sprint-md.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OVERVIEW_REL = 'scrum.pmo/sprints/sprints.overview.md';
const OVERVIEW = path.join(ROOT, OVERVIEW_REL);

const git = (args: string[]): string => execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' });
const gitOrEmpty = (args: string[]): string => { try { return git(args); } catch { return ''; } };
const fail = (msg: string): never => {
  console.error(`FAIL pre-commit auto-regen BLOCKED (fail-closed): ${msg}`);
  process.exit(1);
};

// Content OUTSIDE the generated region (region collapsed to a fixed sentinel), for the anti-sweep comparison.
const narrativeOutsideRegion = (s: string): string => {
  const b = s.indexOf(BEGIN);
  const e = s.indexOf(END);
  if (b === -1 || e === -1 || e < b) return s; // no region -> whole file is narrative
  return `${s.slice(0, b)}[[REGION]]${s.slice(e + END.length)}`;
};

// [impl:uuid:b886ef5d-afee-46fb-971b-55f8123fecbb] autoRegenOverview — R37.6 auto-regen-and-stage the
//   sprints.overview.md generated index INSIDE the commit (committed-overview == regen-of-committed-units by
//   construction). Distinct-intent from generateOverview (1f38e07e = builds the index string); this orchestrates
//   the commit-flow deletion-check + regen (via R37.8 guardedWriteRegion) + anti-sweep + self-verify + stage.
function autoRegenOverview(): void {
  const staged = gitOrEmpty(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
  const stagedDeletions = gitOrEmpty(['diff', '--cached', '--name-only', '--diff-filter=D']).split('\n').filter(Boolean);

  // ── (1) DELETION-CHECK (always): a hand-authored (unmarked) scrum.pmo doc can never be swept out by a commit.
  //    Marker = generated-header prefix (planning/requirements/task MDs) OR the region BEGIN marker (overview).
  const unownedDeletions = stagedDeletions.filter((f) => {
    if (!f.startsWith('scrum.pmo/') || !f.endsWith('.md')) return false;
    const head = gitOrEmpty(['show', `HEAD:${f}`]); // the version being deleted
    if (head === '') return false; // not in HEAD (added-then-deleted in-index) — nothing owned to protect
    const owned = head.startsWith(GENERATED_HEADER_PREFIX) || head.includes(BEGIN);
    return !owned; // unmarked = hand-authored → protect
  });
  if (unownedDeletions.length) {
    console.error('  Staged deletion of hand-authored (UNMARKED) knowledge doc(s) — restore from HEAD or confirm intent:');
    for (const f of unownedDeletions) console.error(`    - ${f}   (git restore --source=HEAD --staged --worktree -- ${f})`);
    fail(`${unownedDeletions.length} unowned scrum.pmo deletion(s) staged`);
  }

  // ── (2) AUTO-REGEN overview — only when staged SCENARIO UNITS changed (the index derives from Sprint units).
  const unitsStaged = staged.some((f) => /^scenario\/index\/.*\.scenario\.json$/.test(f));
  if (!unitsStaged) {
    console.log('OK pre-commit auto-regen: no staged scenario units — overview index unchanged; deletion-check clean.');
    return;
  }
  if (!fs.existsSync(OVERVIEW)) fail(`${OVERVIEW_REL} missing — refusing to regenerate from nothing.`);

  // The narrative that will be COMMITTED = the overview as staged (git show :path) if staged, else HEAD:path.
  const committedBase = staged.includes(OVERVIEW_REL)
    ? gitOrEmpty(['show', `:${OVERVIEW_REL}`])
    : gitOrEmpty(['show', `HEAD:${OVERVIEW_REL}`]);
  const workingTree = fs.readFileSync(OVERVIEW, 'utf-8');

  // ── (3) SHARED-INDEX SAFETY: never sweep an UNSTAGED hand-narrative edit into this commit. Compare the content
  //    OUTSIDE the generated region; if it differs from what is being committed, fail-closed (don't clobber/sweep).
  if (committedBase !== '' && narrativeOutsideRegion(workingTree) !== narrativeOutsideRegion(committedBase)) {
    fail(`${OVERVIEW_REL} has UNSTAGED hand-narrative edits (outside the generated region). Stage or restore them first — `
      + 'auto-regen will not sweep uncommitted narrative into your commit.');
  }

  // ── REGEN the between-markers index from the current Sprint units, via the shared owned-output-guard.
  let out: string;
  try {
    const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
    const gen = new SprintOverviewGenerator(idx);
    out = gen.generateOverview(workingTree); // narrative outside markers preserved byte-for-byte
    const wrote = guardedWriteRegion(OVERVIEW, out, BEGIN, (b) => b === 'sprints.overview.md');
    if (!wrote) fail('owned-output-guard REFUSED the overview write (markerless / hand-authored / wrong-name) — nothing written.');

    // ── (4) VERIFY (stub-must-fail tripwire): the freshly-written index MUST pass --check.
    const chk = gen.checkOverview(out);
    const hard = chk.reasons.filter((r) => !r.startsWith('R37.6 REPORT'));
    if (hard.length) {
      console.error('  Post-regen --check FAILED (the generator did not converge — a generator bug, not a race):');
      for (const r of hard) console.error(`    - ${r}`);
      fail('overview did not converge after regen');
    }
  } catch (err) {
    fail(`overview regen threw — ${(err as Error).message}`);
  }

  // ── (5) STAGE the regenerated overview so committed-overview == regen-of-units, in THIS commit.
  git(['add', '--', OVERVIEW_REL]);
  console.log(`OK pre-commit auto-regen: sprints.overview.md index regenerated from staged units + staged (${out.length} bytes; narrative preserved).`);
}

autoRegenOverview();
