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

// git helper: first stdout line ('' on error). -L emits the format line first, then the patch → we take line 1.
const gitLine = (args: string[]): string => {
  try { return execFileSync('git', args, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().split('\n')[0].trim(); }
  catch { return ''; }
};
// Map an Impl uuid → its MARKED DECLARATION (file + method) via the [impl:uuid:X] source marker (AST-attach, PO caveat).
const markerLoc = (implUuid: string): { file: string; method: string } | null => {
  const hit = gitLine(['grep', '-n', `impl:uuid:${implUuid}`, '--', 'src']); // e.g. src/ts/scenario/unit-controller.ts:30:  // [impl:uuid:..] UnitController.apply — ..
  if (!hit) return null;
  const file = hit.split(':')[0];
  const after = hit.slice(hit.indexOf(`impl:uuid:${implUuid}`)).replace(/^[^\]]*\]\s*/, ''); // text after the marker: "UnitController.apply — .."
  const token = (after.match(/^([A-Za-z0-9_.$]+)/) || [])[1] || '';
  const method = token.includes('.') ? token.split('.').pop()! : token;
  return method ? { file, method } : null;
};
// code-recency for an Impl: last commit touching the MARKED METHOD's history (-L, source='code-decl'); if -L can't scope
// (moved/renamed/generated/multi-file) → FILE-level fallback (source='code-file', so over-credit is VISIBLE per architect).
const codeAdv = (implUuid: string): { iso: string; commit: string; source: string } | null => {
  const loc = markerLoc(implUuid); if (!loc) return null;
  const decl = gitLine(['log', '-1', '--format=%cI|%h', '-L', `:${loc.method}:${loc.file}`]);
  if (decl && decl.includes('|')) { const [iso, commit] = decl.split('|'); return { iso, commit, source: 'code-decl' }; }
  const fileLvl = gitLine(['log', '-1', '--format=%cI|%h', '--', loc.file]);
  if (fileLvl && fileLvl.includes('|')) { const [iso, commit] = fileLvl.split('|'); return { iso, commit, source: 'code-file' }; }
  return null;
};

type Prov = { iso: string; commit: string; source: string };
type Row = { uuid: string; short: string; name: string; status: string; adv: string; commit: string; source: string; prov: Prov[]; file: string; unit: any };
const rows: Row[] = [];
for (const tu of sprintTasks) {
  const unit = idx.get(tu);
  if (!unit || unit.ior !== 'ior:class:Task') continue;
  const m = unit.model as Record<string, unknown>;
  const rel = path.relative(REPO, idx.filePath(tu));
  const prov: Prov[] = [];
  // (a) checklist/status-change advance (paperwork signal) — but SKIP it when a genuine seam-stamp exists: the seam-stamp
  // is the PRECISE runtime advance time, while the git-commit-time of the SAME change is coarser + BATCH-reconcile commits
  // (one commit ticks several tasks) tie them all at the commit time. Use the git signal only for historical/untimestamped tasks.
  if (String(m.lastAdvancedAtSource || '') !== 'seam') {
    const cl = gitLine(['log', '-1', '--format=%cI|%h', '-G', '"status"|"statusChecklist"', '--', rel]);
    if (cl.includes('|')) { const [iso, commit] = cl.split('|'); prov.push({ iso, commit, source: 'checklist' }); }
  }
  // (b) code-recency per marked Impl declaration (building signal) — MAX over all the task's Impls
  const impls = Array.isArray(m.implementation) ? (m.implementation as string[]) : (m.implementation ? [String(m.implementation)] : []);
  for (const im of impls) { const c = codeAdv(bare(im)); if (c) prov.push(c); }
  // (c) any EXISTING genuine stamp (e.g. a real runtime seam advance) — never REGRESS below it
  if (m.lastAdvancedAt) prov.push({ iso: String(m.lastAdvancedAt), commit: String(m.lastAdvancedAtCommit || '-'), source: String(m.lastAdvancedAtSource || 'existing') });
  // lastAdvancedAt = MAX over all signals (genuine recency; code beats a mere checklist tick when the work is fresher)
  const winner = prov.slice().sort((a, b) => (b.iso || '').localeCompare(a.iso || ''))[0];
  rows.push({ uuid: tu, short: tu.slice(0, 8), name: String(m.name || ''), status: statusOf(m), adv: winner?.iso || '', commit: winner?.commit || '-', source: winner?.source || '(none)', prov, file: rel, unit });
}

// 2) predicate PREVIEW: current = In-Progress with MAX lastAdvancedAt (git-backfilled)
const inProgress = rows.filter((r) => r.status === 'In Progress').slice().sort((a, b) => (b.adv || '').localeCompare(a.adv || ''));
const predictedCurrent = inProgress[0];
const is374current = predictedCurrent ? /(^|\W)37\.4(\D|$)/.test(predictedCurrent.name) : false;

console.log(`R40.18 BACKFILL ${APPLY ? '(APPLY)' : '(DRY-RUN)'} — S37: ${rows.length} tasks, ${inProgress.length} In-Progress`);
console.log('  task     status        lastAdvancedAt(git-advance)      commit    name');
for (const r of rows.slice().sort((a, b) => (b.adv || '').localeCompare(a.adv || '')))
  console.log(`  ${r.short}  ${r.status.padEnd(12)}  ${(r.adv || '(none)').padEnd(30)}  ${(r.commit || '-').padEnd(8)}  ${r.name.slice(0, 60)}`);
console.log('\nPROVENANCE (In-Progress — WHY the winner wins, all signals per task):');
for (const r of inProgress)
  console.log(`  ${r.short} ${r.name.slice(0, 40).padEnd(40)} → WIN ${r.adv} [${r.source}] · signals: ${r.prov.map((p) => `${p.source}@${p.iso.slice(11, 19)}(${p.commit})`).join(' ')}`);
console.log(`\n★ PREDICTED CURRENT (In-Progress, MAX advance) = ${predictedCurrent ? `${predictedCurrent.short} "${predictedCurrent.name.slice(0, 50)}" (advance ${predictedCurrent.adv}, commit ${predictedCurrent.commit}, source ${predictedCurrent.source})` : '(none In-Progress)'}`);
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
