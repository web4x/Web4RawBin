/**
 * seam-tick — the ONE pane-invocable entry to advance a task's CHECKLIST through the seam (PO 2026-08-24, Tron
 * critical-path: task statuses were not progressing as agents advanced → the board Tron watches went stale).
 *
 * WHY THIS SHAPE: status must NEVER be hand-stamped as a literal — model.status is DERIVED by deriveStatusEnum from
 * the checklist, and check:status-writes / the mutation-seam guard exist because out-of-seam status literals were a
 * real defect class. So this tool does NOT touch model.status: it routes through statusNext → UnitController.apply →
 * TaskPolicy, which TICKS the genuine checklist box and lets deriveStatusEnum derive. One writer, invariant intact.
 *
 * GENUINE-ONLY: statusNext is EVIDENCE-GATED (In Progress→QA Review needs a shipped Impl; Done needs approvedBy). This
 * tool additionally HARD-REFUSES Done — Done is Tron's QA act via the R40.10 approve route ONLY, never a tick. Ticks
 * must reflect MEASURED advancement (chain evidence + verify-owner-first); the tool is the seam, not the judgment.
 *
 * EMIT / LIVE: a CLI/pane process has no wsClients, so the injected publish is a no-op here — the unit is PERSISTED
 * correctly and the derived board (planning.md / campaign-scoreboard / approve-queue) regenerates from units via the
 * pre-commit hook when the unit is committed. Live BROWSER WS update on an agent tick is the separate R37 skill
 * (server-routed endpoint), still pending; this tool restores UNIT truth → derived-board truth on commit.
 *
 * Usage:
 *   node --import tsx scripts/seam-tick.ts <taskUuid> --substep "<refinement|creating test cases|implementing|testing>"
 *   node --import tsx scripts/seam-tick.ts <taskUuid> --state "<Planned|In Progress|QA Review>"   # advance one legal state (NEVER Done)
 *   node --import tsx scripts/seam-tick.ts <taskUuid> ... --dry-run     # preview derived before/after via the REAL policy, no write
 *   node --import tsx scripts/seam-tick.ts <taskUuid> ... --actor <name>
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index.js';
import { deriveStatusEnum } from '../src/ts/scenario/task-status.js';
import { statusNext, TASK_IOR } from '../src/ts/scenario/task-policy.js';
import { policyFor } from '../src/ts/scenario/unit-controller.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_DIR = process.env.RAWBIN_INDEX || path.join(__dirname, '../scenario/index');
const die = (m: string): never => { console.error(`seam-tick: ${m}`); process.exit(1); };

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): void {
  const taskUuid = process.argv[2];
  if (!taskUuid || taskUuid.startsWith('--')) die('usage: seam-tick <taskUuid> (--substep "<name>" | --state "<target>") [--dry-run] [--actor <name>]');
  const subStep = arg('--substep');
  const state = arg('--state');
  const dryRun = process.argv.includes('--dry-run');
  const actor = arg('--actor') || 'seam-tick';
  if (!subStep && !state) die('give exactly one of --substep or --state');
  if (subStep && state) die('give exactly one of --substep or --state, not both');
  // HARD REFUSE Done — belt-and-suspenders over the policy's approvedBy gate: Done is Tron's QA act (R40.10 approve
  // route), NEVER a tick from this tool. A tick can advance to In Progress or QA Review only.
  if (state && state.trim().toLowerCase() === 'done') die('REFUSED: Done is Tron\'s QA act (R40.10 approve), never a seam-tick. Advance only to In Progress / QA Review.');

  const idx = new ScenarioIndex(INDEX_DIR);
  const unit = idx.get(taskUuid);
  if (!unit) die(`no unit ${taskUuid}`);
  if (unit!.ior !== TASK_IOR) die(`unit ${taskUuid} is ${unit!.ior}, not ${TASK_IOR}`);
  const beforeCl = String((unit!.model as Record<string, unknown>).statusChecklist ?? '');
  const beforeDerived = deriveStatusEnum(beforeCl);
  const intent = subStep ? { subStep } : { target: state };

  if (dryRun) {
    // PREVIEW via the REAL policy functions on a CLONE — validate (throws if illegal/evidence-absent) then apply
    // in-memory. apply mutates only the clone's model; it does NOT persist (persist is UnitController's job), so no
    // disk write. Uses the SAME tick/derive logic the real path uses (no 2nd source).
    const clone = { ...unit!, model: { ...(unit!.model as Record<string, unknown>) } };
    const policy = policyFor(TASK_IOR);
    if (!policy) die('no Task policy registered');
    try { policy!.validate(idx, clone, intent); policy!.apply(idx, clone, intent); }
    catch (e) { die(`REFUSED (dry-run): ${(e as Error).message}`); }
    const afterCl = String((clone.model as Record<string, unknown>).statusChecklist ?? '');
    console.log(`DRY-RUN ${taskUuid.slice(0, 8)} ${subStep ? `subStep='${subStep}'` : `state→'${state}'`}: derived ${beforeDerived} → ${deriveStatusEnum(afterCl)} (no write)`);
    return;
  }

  try {
    const out = statusNext(idx, taskUuid, { ...(subStep ? { subStep } : { target: state }), actor });
    const afterDerived = deriveStatusEnum(String((out.model as Record<string, unknown>).statusChecklist ?? ''));
    console.log(`OK seam-tick ${taskUuid.slice(0, 8)} ${subStep ? `subStep='${subStep}'` : `state→'${state}'`}: derived ${beforeDerived} → ${afterDerived} (checklist ticked through the seam; status DERIVED, no literal; unit persisted — commit to move the board).`);
  } catch (e) { die(`REFUSED: ${(e as Error).message}`); }
}

main();
