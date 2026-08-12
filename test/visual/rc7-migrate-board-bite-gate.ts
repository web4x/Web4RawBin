// R-C7 BoardMigrator BITE gate — the 5 hard gates must hold AS CODE, proven by BITE not assertion (anti-green-wash).
// A prover that greens a units-incomplete board is worthless → PLANT a gap and require it to REFUSE + NAME it.
// scripts-only, no restart, ZERO pollution (own-oracle pure-fn plant + read-only --prove + dry-run --apply + source-audit).
// [test:uuid:0870c78b-6268-4de2-a86b-0b74dfe7cf0d] R-C7 BoardMigrator 5-gate BITE (Impls proveComplete 21e38b44 + applyMigration 73f045d8) — PROVEN BY BITE not assertion: (1) plant a hand item absent from units → proveBoardComplete NAMES it (fail-loud) + flips to complete when present; (2) --prove READ-ONLY (git clean unchanged); (3) --apply PROOF-GATED (REFUSED (G1) when prove fails) + read-only; (4) atomic + reversible (write guarded by --apply, per-sprint out.files, git-tracked → revert restores); (5) narrative/prose yields 0 significantItems (excluded). Live ref: --prove Sprint18 5b950725 REFUSES naming 98 gaps. served-independent scripts-only, zero pollution.
import { proveBoardComplete } from '../../scripts/migrate-boards.ts';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const ROOT = '/var/dev/Workspaces/web4x/Web4RawBin';
const S18 = '5b950725-a6f6-4d45-b802-4784ee6ef962'; // ior:class:Sprint "Sprint 18" (NOT the like-named Requirement 91a1c36a)
const sh = (cmd: string) => { try { return { code: 0, out: execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e: any) { return { code: e.status || 1, out: (e.stdout || '') + (e.stderr || '') }; } };
const gitDirty = () => sh('git status --porcelain scrum.pmo/sprints').out.trim();

const R: any = {};

// ── G1 BITE: PLANT a gap (hand has an item the generated/units board does NOT) → MUST name it; remove it → complete ──
const plantedGaps = proveBoardComplete('- [ ] R-C99 planted-missing-req\nrequirement:uuid:deadbeef', '## Some heading (units produced nothing structural)').gaps; // BoardDiff.gaps (return shape is now {gaps,needsReview}, was a bare array)
const noGapWhenPresent = proveBoardComplete('- [ ] R-C99 planted-missing-req', '- [ ] R-C99 planted-missing-req').gaps;
R.g1_plantNamed = plantedGaps.some((g) => g.includes('R-C99')) && plantedGaps.some((g) => g.includes('deadbeef')) && plantedGaps.length >= 2;  // NAMES the missing items (fail-loud, not silent)
R.g1_flipsToCompleteWhenPresent = noGapWhenPresent.length === 0;                                                                             // same item present → NO false gap

// ── G5 BITE: narrative/prose yields NO items (excluded); structural rows/IDs/refs DO ──
// significantItems export was folded into proveBoardComplete's internal structural extraction — test the SAME G5
// property via the exported API (guard-family (b): fixture tracks the CURRENT contract): prose has NO structural items
// → 0 gaps vs empty; structural checkbox rows ARE items → gaps vs empty.
const proseGaps = proveBoardComplete('This is free-form rationale.\nWhy we chose X over Y — pure narrative.\nNo IDs, refs, or checkboxes here.', '').gaps;
const structGaps = proveBoardComplete('- [ ] R1.1 do a\n- [ ] R1.2 do b\n- [ ] R37.2 do c', '').gaps;
R.g5_narrativeExcluded = proseGaps.length === 0 && structGaps.length >= 3;

// ── G2 read-only + real reference: --prove S18 REFUSES + NAMES ~98 gaps, writes NOTHING ──
const dirtyBefore = gitDirty();
const prove = sh(`npx tsx scripts/migrate-boards.ts --prove ${S18}`);
const dirtyAfterProve = gitDirty();
const gapLines = (prove.out.match(/ :: /g) || []).length;
R.prove_refuses = prove.code !== 0 && /REFUSE/.test(prove.out);
R.prove_namesGaps = gapLines >= 50;   // real reference ≈ 98; require it NAMES many (not silent)
R.prove_gapCount = gapLines;
R.prove_readOnly = dirtyBefore === dirtyAfterProve;   // no writes (git clean unchanged)

// ── G3 apply proof-gated: --apply (no --write, dry-run) REFUSES because prove fails; writes NOTHING ──
const apply = sh(`npx tsx scripts/migrate-boards.ts --apply ${S18}`);
const dirtyAfterApply = gitDirty();
R.apply_proofGated = /REFUSED \(G1/.test(apply.out) || (/REFUSE/.test(apply.out) && apply.code !== 0);
R.apply_readOnly = dirtyBefore === dirtyAfterApply;

// ── G4 atomic + reversible (source-audit, by construction — NOT applying a real sprint per PO) ──
const src = fs.readFileSync(`${ROOT}/scripts/migrate-boards.ts`, 'utf8');
R.g4_writeGuardedByApply = /if \(opts\.apply\) fs\.writeFileSync/.test(src);              // writes ONLY when --write (apply)
R.g4_zeroLossRecheck = /G4 zero-loss/.test(src) && /would drop/.test(src);               // re-verifies no drop before each write
R.g4_perSprintAtomic = /out\.files\.keys\(\)/.test(src) && /buildSprintOutput\(sprintUuid/.test(src); // one sprintUuid → that sprint's board files only; git-tracked → git revert restores

const gates = {
  'G1 plant→refuse+NAME (bite)': R.g1_plantNamed && R.g1_flipsToCompleteWhenPresent,
  'G2 --prove READ-ONLY': R.prove_readOnly,
  'G1 --prove refuses+names (S18 ref)': R.prove_refuses && R.prove_namesGaps,
  'G3 --apply PROOF-GATED + read-only': R.apply_proofGated && R.apply_readOnly,
  'G4 atomic + reversible (by-construction)': R.g4_writeGuardedByApply && R.g4_zeroLossRecheck && R.g4_perSprintAtomic,
  'G5 narrative EXCLUDED (bite)': R.g5_narrativeExcluded,
};
console.log('===== R-C7 BoardMigrator BITE gate (served-independent, scripts-only) =====');
for (const [k, v] of Object.entries(gates)) console.log(`  ${v ? 'PASS' : 'FAIL'}  ${k}`);
console.log(`\ndetail: ${JSON.stringify(R)}`);
console.log(`S18 --prove named ${R.prove_gapCount} gaps (reference ≈98); git clean after prove=${R.prove_readOnly} apply=${R.apply_readOnly}`);
const green = Object.values(gates).every(Boolean);
console.log('\nOVERALL R-C7:', green ? 'PASS — all 5 gates BITE + hold' : 'FAIL');
process.exitCode = green ? 0 : 1;
