/**
 * Owned-Output Delete-Guard BITEs (tester) — per design scrum.pmo/design-notes/knowledge-doc-deletion-diagnosis-guard.md.
 * Run: /opt/node22/bin/node --import tsx scripts/owned-output-guard-bites.ts
 *
 * Proves the guard is PRESENT + EFFECTIVE, not merely currently-working — the same stub-must-fail standard as the
 * device-AC lint. A confinement that lives only as inline code can silently revert (an Option-1 revert took build.mjs
 * tonight; it would take a whitelist just as quietly). These BITEs make that impossible: a silent revert breaks CI,
 * not a knowledge doc. SCRATCH fixtures ONLY — never a real deletion in the live tree.
 *
 * ★ CONTRACT proposed to robbin-skill-expert (they build scripts/owned-output-guard.ts; these BITEs assert it):
 *   guardedDelete(filePath, generatedHeader): boolean
 *     — delete ONLY if the file exists AND its content startsWith(generatedHeader); else REFUSE (return false, LEAVE it).
 *       fail-closed: unreadable / no-header / ambiguous → refuse (NEVER delete an unmarked file).
 *   guardedWrite(filePath, content, generatedHeader, isOwned: (basename)=>boolean): boolean
 *     — write ONLY if isOwned(basename) AND (file is new OR existing startsWith(generatedHeader)); reject '..'/'/'-escape; else REFUSE.
 *
 * RED until the helper lands + generators route through it — that RED IS the finding (the guard is not yet present).
 */
// [test:uuid:02cfb6ae-2242-41a2-bf11-b37d773d5af4] owned-output-guard guardedWrite (Impl 3a716334) — write ONLY an owned, path-confined, marker-or-new file; refuse non-owned / '..'-escape / clobber-of-unmarked (B1 + B3, weaken-proven RED).
// [test:uuid:a1ff5bfc-0510-48d9-955f-a04898214f59] owned-output-guard guardedDelete (Impl e1ff295f) — delete ONLY a marker-carrying file; NEVER an unmarked/hand-authored one; fail-closed on ambiguous (B2b negative bite + B1 + B3, weaken-proven RED).
// [test:uuid:e19a1882-3f32-46ab-97eb-b488d4efb3ca] owned-output-guard guardedWriteRegion (Impl fc520411) — region-write ONLY an owned file that contains the region marker; refuse markerless-existing / markerless-content / non-owned / escape (B1-region, control-proven non-vacuous).
import fs from 'node:fs';
import path from 'node:path';
import { GENERATED_HEADER } from './generate-sprint-md.ts';

const REPO = '/var/dev/Workspaces/web4x/Web4RawBin';
const SCRATCH = path.join('/tmp/claude-0/-var-dev-Workspaces-AI-Claude/dd6c6fae-b1a2-4ce7-8a87-6a8cac45eff4/scratchpad', 'oog-bite');
const fails: string[] = [];
const ok = (name: string, cond: boolean, detail = ''): void => { console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`); if (!cond) fails.push(name); };
const fresh = (): void => { fs.rmSync(SCRATCH, { recursive: true, force: true }); fs.mkdirSync(SCRATCH, { recursive: true }); };

// load the shared helper (absent until skill-expert builds it → guard-absent RED)
let guard: { guardedDelete?: Function; guardedWrite?: Function } | null = null;
try { guard = await import('./owned-output-guard.ts'); } catch { guard = null; }
const havePresent = !!(guard && guard.guardedDelete && guard.guardedWrite);

console.log('\n== B2(b) NEGATIVE BITE — the valuable half: a stub deleting an UNMARKED file MUST be refused ==');
if (!havePresent) {
  ok('B2b guard PRESENT', false, 'scripts/owned-output-guard.ts absent or missing guardedDelete/guardedWrite — the confinement is NOT present (this RED is exactly the silent-revert B2 exists to catch)');
} else {
  fresh();
  const unmarked = path.join(SCRATCH, 'pin-authoritative-answer.md');
  fs.writeFileSync(unmarked, '# authoritative answer\nhand-authored, no marker\n');
  const before = fs.readFileSync(unmarked, 'utf8');
  const deleted = guard!.guardedDelete!(unmarked, GENERATED_HEADER);                    // stub tries to delete the unmarked doc
  ok('B2b unmarked-delete REFUSED (survives byte-identical)', deleted === false && fs.existsSync(unmarked) && fs.readFileSync(unmarked, 'utf8') === before,
    `returned ${deleted} — if the helper is weakened so this deletes, the suite goes RED`);
  const marked = path.join(SCRATCH, 'requirements.md');
  fs.writeFileSync(marked, GENERATED_HEADER + '\n# generated\n');
  const delMarked = guard!.guardedDelete!(marked, GENERATED_HEADER);                    // control: a MARKED file IS deletable
  ok('B2b marked-delete allowed (control, proves not vacuously-refuse-all)', delMarked === true && !fs.existsSync(marked));
}

console.log('\n== B1 BEHAVIOURAL — a planted hand-authored file survives the guarded prune byte-identical ==');
if (!havePresent) { ok('B1 guard PRESENT', false, 'helper absent'); }
else {
  fresh();
  const hand = path.join(SCRATCH, 'R31-audit-RESULT.md'); const body = '# audit result\nkeep me\n';
  fs.writeFileSync(hand, body);
  const gen = path.join(SCRATCH, 'requirements.md'); fs.writeFileSync(gen, GENERATED_HEADER + '\nold\n');
  // simulate the generator's prune-then-write THROUGH the guard: replace the generated file, prune the dir of stale generated
  guard!.guardedWrite!(gen, GENERATED_HEADER + '\nnew\n', GENERATED_HEADER, (b: string) => b === 'requirements.md');
  for (const f of fs.readdirSync(SCRATCH)) guard!.guardedDelete!(path.join(SCRATCH, f), GENERATED_HEADER); // a prune sweep
  ok('B1 hand-authored survives byte-identical', fs.existsSync(hand) && fs.readFileSync(hand, 'utf8') === body);
  fresh();
}

console.log('\n== B3 FAIL-CLOSED — ambiguous/unmarked/escape refused ==');
if (!havePresent) { ok('B3 guard PRESENT', false, 'helper absent'); }
else {
  fresh();
  const amb = path.join(SCRATCH, 'empty.md'); fs.writeFileSync(amb, '');                 // no header = ambiguous
  ok('B3 ambiguous-delete refused', guard!.guardedDelete!(amb, GENERATED_HEADER) === false && fs.existsSync(amb));
  const nonOwned = path.join(SCRATCH, 'not-owned.md');
  ok('B3 non-owned-write refused', guard!.guardedWrite!(nonOwned, 'x', GENERATED_HEADER, (b: string) => b === 'requirements.md') === false && !fs.existsSync(nonOwned));
  const escapePath = `${SCRATCH}/../oog-escape.md`; // RAW string keeps the '..' segment (path.join would normalize it away)
  ok('B3 path-escape write refused', guard!.guardedWrite!(escapePath, 'x', GENERATED_HEADER, () => true) === false && !fs.existsSync(escapePath));
  fresh();
}

console.log('\n== B1-region (guardedWriteRegion) — markerless/hand-authored file NEVER clobbered; markerless content + escape refused ==');
if (!(guard && (guard as { guardedWriteRegion?: Function }).guardedWriteRegion)) { ok('B1-region guard PRESENT', false, 'guardedWriteRegion absent'); }
else {
  const gwr = (guard as { guardedWriteRegion: Function }).guardedWriteRegion;
  fresh();
  const RM = '<!-- BEGIN GENERATED REGION -->';
  const owned = (b: string) => b === 'sprints.overview.md';
  const f = path.join(SCRATCH, 'sprints.overview.md');
  const handNarr = '# hand narrative\nno region marker — do not clobber\n';
  fs.writeFileSync(f, handNarr);
  ok('B1-region markerless-EXISTING refused (survives byte-identical)', gwr(f, RM + '\ngen\n', RM, owned) === false && fs.readFileSync(f, 'utf8') === handNarr);
  fs.rmSync(f, { force: true });
  ok('B1-region markerless-CONTENT refused (never write output lacking the region marker)', gwr(f, 'no marker in output', RM, owned) === false && !fs.existsSync(f));
  ok('B1-region non-owned name refused', gwr(path.join(SCRATCH, 'other.md'), RM + '\ng\n', RM, owned) === false);
  ok('B1-region path-escape refused', gwr(`${SCRATCH}/../oog-region-escape.md`, RM + '\ng\n', RM, () => true) === false);
  ok('B1-region valid marked write (control, proves not vacuously-refuse-all)', gwr(f, RM + '\ngen\n', RM, owned) === true && fs.existsSync(f));
  fresh();
}

console.log('\n== B2(a) STATIC CHOKEPOINT — no generator raw-writes/deletes a scrum.pmo path outside the guard ==');
{
  const GENERATORS = ['generate-sprint-md.ts', 'sprint-overview-generator.ts', 'sprint-overview.ts'];
  const offenders: string[] = [];
  for (const g of GENERATORS) {
    const fp = path.join(REPO, 'scripts', g); if (!fs.existsSync(fp)) continue;
    const src = fs.readFileSync(fp, 'utf8');
    for (const m of src.matchAll(/\b(unlinkSync|rmSync|fs\.rm\(|writeFileSync)\b/g)) {
      const ls = src.lastIndexOf('\n', m.index!) + 1; const le = src.indexOf('\n', m.index!);
      const line = src.slice(ls, le < 0 ? undefined : le);
      if (/guarded(Write|Delete)|owned-output-guard/.test(line)) continue; // routed through the guard = fine
      if (/^\s*(\/\/|\*)/.test(line)) continue;                            // comment
      offenders.push(`${g}: ${line.trim().slice(0, 80)}`);
    }
  }
  ok('B2a generators route fs through the guard (no raw scrum.pmo write/delete)', offenders.length === 0,
    offenders.length ? `${offenders.length} raw fs op(s) bypass ownedOutputGuard → e.g. ${offenders[0]}` : 'all routed');
}

console.log(`\n===== Owned-Output Delete-Guard BITEs =====`);
console.log(fails.length === 0 ? '✓ GREEN — the guard is PRESENT + effective; a hand-authored file cannot be deleted as regen collateral, and the confinement cannot silently revert without this suite going RED.'
  : `✗ RED (${fails.length}): ${fails.join(', ')}\n  FAMILY: a confinement that lives only as inline code can silently revert (Option-1 reverted build.mjs; it would revert a whitelist just as quietly). Build scripts/owned-output-guard.ts + route generators through it → GREEN.`);
process.exitCode = fails.length === 0 ? 0 : 1;
