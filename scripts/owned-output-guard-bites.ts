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
  ok('B3 path-escape write refused', guard!.guardedWrite!(path.join(SCRATCH, '../escape.md'), 'x', GENERATED_HEADER, () => true) === false && !fs.existsSync(path.join(SCRATCH, '..', 'escape.md')));
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
