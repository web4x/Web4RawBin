// R40.18 BACKFILL — lastAdvancedAt for S37 tasks from the ADVANCE signal (PO+architect reconciled: the commit that last
// CHANGED status OR statusChecklist, NOT last-file-touch — an AC-fold/reverse-wire edit must not rank a task "advanced").
// Via git -G (diff-content filter): git stops at the first commit whose DIFF changed a "status"/"statusChecklist" line.
// DRY-RUN default (computes + reports which task the predicate picks + per-task provenance for PO review); --apply writes
// model.lastAdvancedAt + lastAdvancedAtSource='git-backfill' + lastAdvancedAtCommit. PURE-RECENCY — NOT fit to reproduce
// 37.24 (a stale manual pick); the assertion that matters is is-37.4=FALSE (a Planned task is never current).
// Run: node --import tsx scripts/backfill-r40.18-lastadvancedat.ts [--apply]
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { deriveStatusEnum } from '../src/ts/scenario/task-status.js';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const idx = new ScenarioIndex(path.join(REPO, 'scenario/index'));
const bare = (s: string) => String(s).replace('ior:instance:', '');

// 1) Sprint 37 → ordered tasks[]
let sprintTasks: string[] = [];
for (const u of idx.list()) {
  const un = idx.get(u);
  if (un?.ior === 'ior:class:Sprint' && Number((un.model as Record<string, unknown>).number) === 37) {
    sprintTasks = (((un.model as Record<string, unknown>).tasks as string[]) || []).map(bare);
    break;
  }
}
if (!sprintTasks.length) { console.error('✗ no Sprint number=37 unit / empty tasks[] — abort'); process.exit(1); }

const statusOf = (m: Record<string, unknown>): string => {
  const checklist = String(m.statusChecklist || '');
  if (checklist) return deriveStatusEnum(checklist);
  const raw = String(m.status || '');
  return (['Planned', 'In Progress', 'QA Review', 'Done'].find((s) => s.toLowerCase() === raw.toLowerCase()) || 'Planned');
};

type Row = { uuid: string; short: string; name: string; status: string; adv: string; commit: string; file: string; unit: any };
const rows: Row[] = [];
for (const tu of sprintTasks) {
  const unit = idx.get(tu);
  if (!unit || unit.ior !== 'ior:class:Task') continue;
  const m = unit.model as Record<string, unknown>;
  const abs = idx.filePath(tu);
  const rel = path.relative(REPO, abs);
  let adv = '', commit = '';
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI|%h', '-G', '"status"|"statusChecklist"', '--', rel], { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (out) [adv, commit] = out.split('|');
  } catch { /* no matching commit → adv stays '' (ranks last) */ }
  rows.push({ uuid: tu, short: tu.slice(0, 8), name: String(m.name || ''), status: statusOf(m), adv, commit, file: rel, unit });
}

// 2) predicate PREVIEW: current = In-Progress with MAX lastAdvancedAt (git-backfilled)
const inProgress = rows.filter((r) => r.status === 'In Progress').slice().sort((a, b) => (b.adv || '').localeCompare(a.adv || ''));
const predictedCurrent = inProgress[0];
const is374current = predictedCurrent ? /(^|\W)37\.4(\D|$)/.test(predictedCurrent.name) : false;

console.log(`R40.18 BACKFILL ${APPLY ? '(APPLY)' : '(DRY-RUN)'} — S37: ${rows.length} tasks, ${inProgress.length} In-Progress`);
console.log('  task     status        lastAdvancedAt(git-advance)      commit    name');
for (const r of rows.slice().sort((a, b) => (b.adv || '').localeCompare(a.adv || '')))
  console.log(`  ${r.short}  ${r.status.padEnd(12)}  ${(r.adv || '(none)').padEnd(30)}  ${(r.commit || '-').padEnd(8)}  ${r.name.slice(0, 60)}`);
console.log(`\n★ PREDICTED CURRENT (In-Progress, MAX advance) = ${predictedCurrent ? `${predictedCurrent.short} "${predictedCurrent.name.slice(0, 50)}" (advance ${predictedCurrent.adv}, commit ${predictedCurrent.commit})` : '(none In-Progress)'}`);
console.log(`  ASSERTION is-37.4-current = ${is374current} (MUST be false — a Planned/old task is never current)`);
const missing = rows.filter((r) => !r.adv);
if (missing.length) console.log(`  ⚠ ${missing.length} task(s) had NO status/statusChecklist-changing commit (rank last, adv=''): ${missing.map((r) => r.short).join(', ')}`);

if (APPLY) {
  if (is374current) { console.error('✗ REFUSING --apply: predicted current is a 37.4 task — investigate before writing.'); process.exit(1); }
  let wrote = 0;
  for (const r of rows) {
    if (!r.adv) continue; // no advance signal → leave untimestamped (honest; ranks last)
    const m = r.unit.model as Record<string, unknown>;
    m.lastAdvancedAt = r.adv;
    m.lastAdvancedAtSource = 'git-backfill';
    m.lastAdvancedAtCommit = r.commit;
    idx.put(r.uuid, r.unit); // one-time CLI backfill, pre-transport (not a runtime seam path; scripts/ not lint-scanned)
    wrote++;
  }
  console.log(`\n✓ APPLIED: ${wrote} task units stamped lastAdvancedAt + source='git-backfill' + commit. Re-run the pin to verify current.`);
} else {
  console.log('\nDRY-RUN only — no writes. Report this table to PO, then --apply after review.');
}
