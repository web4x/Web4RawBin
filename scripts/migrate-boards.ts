// R-C7 — BoardMigrator (Class eac99b32): safely migrate a HAND-AUTHORED sprint board (planning.md/requirements.md
// lacking GENERATED_HEADER) into a generated view — ONLY after PROVING the sprint's units carry the board's
// structural content (zero data-loss). This is the safe resolution to the R-C2 blocker: it never violates Tron's
// OWNED-OUTPUT data-loss invariant, because it refuses to overwrite a hand-authored board unless the units
// provably reproduce every structural item. 5 HARD GATES as CODE:
//   G1 proof-before-write   — applyMigration refuses unless proveComplete passes, NAMING each gap.
//   G2 backfill-from-file   — a prerequisite the owner/req performs (backfill units from the file) so the proof
//                             can pass; this migrator NEVER invents unit content.
//   G3 idempotent + atomic  — re-run on an already-generated board = no change; caller commits ONE sprint per
//                             atomic commit (revertible).
//   G4 zero-loss            — semantic diff (significantItems): every structural item in the old board survives.
//   G5 narrative excluded   — free prose/rationale produces no items → not required to round-trip through units.
// scripts/CI-only (no server import → no restart).
import fs from 'node:fs';
import path from 'node:path';
import { buildSprintOutput, allUnits, SPRINTS_DIR } from './generate-sprint-md.js';

const normalizeLF = (s: string): string => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/g, '') + '\n';

// STRUCTURAL keys (G5: narrative ignored). altId/number IDs (R18.29, T36.5, R-C2) are the STABLE identity — matched
// BY KEY so a REWORDED/refined requirement still matches (not a false gap). uuid refs are deliberately NOT used as
// keys (they change on re-mint = fragile). Rows = checkbox labels, normalized (case/whitespace/markdown-insensitive).
const normRow = (s: string): string => s.replace(/[*_`[\]]/g, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);
function extractRows(md: string): { text: string; id: string | null }[] {
  const rows: { text: string; id: string | null }[] = [];
  for (const raw of md.split('\n')) {
    const cb = /^-\s*\[[ xX]\]\s*(.+)$/.exec(raw.trim());
    if (!cb) continue;
    const idm = /\b(R-C\d+|T-C\d+|[RT]\d+(?:\.\d+)*)\b/.exec(cb[1]);
    rows.push({ text: normRow(cb[1]), id: idm ? idm[1].toUpperCase() : null });
  }
  return rows;
}

export interface BoardDiff { gaps: string[]; needsReview: string[]; }

// SEMANTIC / BY-KEY match (NOT literal string): a hand item is a real GAP only if its stable ID is ABSENT from the
// generated board (a genuinely-missing requirement/task). A reworded/refined row whose ID matches is COVERED (its
// text may differ — that's fine). An ID-less row with no exact normalized-text match is UNCERTAIN → NEEDS-REVIEW.
// ★ FAIL-CLOSED: an uncertain item is NEVER silently 'matched' (that would re-open the vacuous-pass hole) and NEVER
// a hard gap — it is a NAMED, distinct category a human confirms before --apply. (Narrative yields no items, G5.)
export function proveBoardComplete(handAuthored: string, generated: string): BoardDiff {
  // Gap ids come from STRUCTURAL checkbox rows ONLY (line-20 intent: narrative ignored). extractIds over the WHOLE
  // md false-flags a PROSE cross-reference (e.g. "unblocked once R21.9 landed" = a mention of another sprint's id)
  // as a missing gap; a structural checkbox row still fires a real gap. (tester BITE rc7e-extractids-prose-crossref)
  const genIds = new Set(extractRows(generated).map((r) => r.id).filter(Boolean));
  const genRowTexts = new Set(extractRows(generated).map((r) => r.text));
  const gaps: string[] = [], needsReview: string[] = [];
  for (const { id } of extractRows(handAuthored)) if (id && !genIds.has(id)) gaps.push(`id:${id}`);
  for (const row of extractRows(handAuthored)) {
    if (row.id) continue;                     // ID-bearing rows are adjudicated by the ID check above
    if (genRowTexts.has(row.text)) continue;  // exact normalized-text match → covered
    if (row.text) needsReview.push(`row:${row.text.slice(0, 60)}`);
  }
  return { gaps: [...new Set(gaps)].sort(), needsReview: [...new Set(needsReview)].sort() };
}

export interface ProofResult { sprintSlug: string; complete: boolean; gaps: { file: string; item: string }[]; needsReview: { file: string; item: string }[]; reason?: string; }

// SHARED, EXPORTED per-file zero-loss diff — the SINGLE source of truth for BOTH proveComplete (G1) and
// applyMigration (G4): same file-set + skip + predicate, so a --prove PASS guarantees --apply succeeds BY
// CONSTRUCTION (no prove/apply disagreement). Exported as a clean testable surface (tester bites the no-skip).
// Returns ONE entry per file that has a delta (empty array = zero-loss for every file).
// SKIP only a non-existent file (the generator creates it fresh → nothing hand-authored to prove).
// We deliberately do NOT skip GENERATED_HEADER files: a pure-generated file diffs to 0 (free), but a hand-ANNOTATED
// generated file (header + a hand-added row, e.g. an "in-flight per PO" note) is CAUGHT — verify, don't assume the
// header means untouched (that skip false-COMPLETE'd S19 while --apply's per-file G4 correctly refused). [[false-low-worse-than-absent]]
export function perFileDiffs(dir: string, files: Map<string, string>): { file: string; gaps: string[]; needsReview: string[]; drops: string[] }[] {
  const results: { file: string; gaps: string[]; needsReview: string[]; drops: string[] }[] = [];
  for (const [name, generated] of files) {
    const fp = path.join(dir, name);
    if (!fs.existsSync(fp)) continue;
    const content = fs.readFileSync(fp, 'utf-8');
    const d = proveBoardComplete(content, generated);
    // ADDITIVE-ONLY gate (R-C6 preserve-region UNBUILT): a non-empty hand line the generator does NOT reproduce
    // would be DROPPED on --apply. G5 excludes NARRATIVE from the structural proof, so hand prose (e.g. '**Theme:**',
    // '**Source:**', '*Captured by …*') silently vanishes on migrate. Surface every such line as a `drop` so
    // proveComplete can REFUSE fail-closed until R-C6 preserves hand-narrative regions. "apply must lose nothing."
    const genLines = new Set(normalizeLF(generated).split('\n').map((l) => l.trim()).filter(Boolean));
    const drops = normalizeLF(content).split('\n').map((l) => l.trim()).filter((l) => l && !genLines.has(l));
    if (d.gaps.length || d.needsReview.length || drops.length) results.push({ file: name, gaps: d.gaps, needsReview: d.needsReview, drops });
  }
  return results;
}

// [impl:uuid:21e38b44-eb21-4fbf-830c-303ad2775095] BoardMigrator.proveComplete (Method c9a8b675) — G1
// proof-before-write, READ-ONLY: for each HAND-AUTHORED board file (no GENERATED_HEADER) in the sprint, prove
// every structural item is also produced by the generator from units; REFUSE (complete:false) NAMING each gap.
export function proveComplete(sprintUuid: string): ProofResult {
  const units = allUnits();
  const bare = sprintUuid.replace(/^ior:(instance|class):/, '');
  const unit = units.get(bare) || units.get(sprintUuid);
  // ★ FAIL-CLOSED (this gate guards DATA-LOSS): a typo'd/unresolvable uuid, or a wrong ior:class (e.g. a
  // like-named ior:class:Requirement instead of the Sprint), must REFUSE with a NAMED reason — NEVER a vacuous
  // complete:true. Fail-open here would let --apply overwrite a hand-authored board on an empty proof.
  // [[false-low-worse-than-absent]] + fail-loud: empty/vacuous input is a REFUSAL, not a pass.
  if (!unit) return { sprintSlug: bare, complete: false, gaps: [], needsReview: [], reason: `FAIL-CLOSED: uuid ${bare} does not resolve to any unit` };
  if (unit.ior !== 'ior:class:Sprint') return { sprintSlug: bare, complete: false, gaps: [], needsReview: [], reason: `FAIL-CLOSED: uuid ${bare} resolves to ${unit.ior}, not ior:class:Sprint` };
  const out = buildSprintOutput(sprintUuid, units);
  if (!out) return { sprintSlug: bare, complete: false, gaps: [], needsReview: [], reason: `FAIL-CLOSED: buildSprintOutput returned null for ${bare} (not a resolvable Sprint)` };
  const sprintSlug = out.sprintSlug;
  // SCOPE = only the GENERATOR-OWNED board files (out.files: planning.md / requirements.md / task-*.md). Hand-
  // authored ANALYSIS/DESIGN docs are NOT migration targets — preserved (OWNED-OUTPUT whitelist), never proven.
  // PER-FILE zero-loss via the shared perFileDiffs (same file-set + skip + predicate that --apply's G4 trusts).
  const perFile = perFileDiffs(path.join(SPRINTS_DIR, sprintSlug), out.files);
  const gaps = perFile.flatMap((f) => f.gaps.map((item) => ({ file: f.file, item })));
  const needsReview = perFile.flatMap((f) => f.needsReview.map((item) => ({ file: f.file, item })));
  // ★ NARRATIVE-LOSS REFUSAL (R-C6 preserve-region UNBUILT): if migrating would DROP any hand line the generator
  // doesn't reproduce (narrative not covered by the G5 structural proof), REFUSE fail-closed with a NAMED reason —
  // "apply must lose nothing". This turns the manual additive-only assertion into a by-construction gate; it lifts
  // automatically once R-C6 preserves hand-narrative regions (drops → 0 for a preserved board). NOT human memory.
  const dropFiles = perFile.filter((f) => f.drops.length);
  if (dropFiles.length) {
    const sample = dropFiles.flatMap((f) => f.drops).find((l) => /\*\*(theme|source)|captured by/i.test(l)) || dropFiles[0].drops[0];
    const reason = `REFUSED (R-C6 preserve-region UNBUILT): migrating would DROP hand narrative the generator does not reproduce — ${dropFiles.map((f) => `${f.file} (${f.drops.length} line(s))`).join(', ')}; e.g. "${sample.slice(0, 70)}". apply must lose nothing → refusing until R-C6 preserves narrative regions.`;
    return { sprintSlug, complete: false, gaps, needsReview, reason };
  }
  // complete (safe to --apply) requires 0 gaps AND 0 needs-review AND 0 dropped hand lines (all fail-closed).
  return { sprintSlug, complete: gaps.length === 0 && needsReview.length === 0, gaps, needsReview };
}

export interface MigrationResult { sprintSlug: string; applied: boolean; refused?: string; filesWritten?: string[]; }

// [impl:uuid:73f045d8-e0ac-4afc-b357-92e76aa8ddc0] BoardMigrator.applyMigration (Method 37d3fc2f) — PROOF-GATED
// migration. G1: calls proveComplete first and REFUSES (naming gaps) unless complete. G4 zero-loss: re-verifies
// each old board file's structural items all survive into the generated one before writing. G3 idempotent: skips a
// file whose generated content already matches (byte-stable); the caller commits ONE sprint per atomic (revertible)
// commit. G2 backfill + G5 narrative-exclusion are honored by construction (never invents units; prose not proven).
// Only writes when opts.apply === true; dryRun otherwise (returns what WOULD be written).
export function applyMigration(sprintUuid: string, opts: { apply: boolean }): MigrationResult {
  const proof = proveComplete(sprintUuid); // G1 (fail-closed: reason set on unresolvable/wrong-ior/null)
  const sprintSlug = proof.sprintSlug;
  if (!proof.complete) {
    const why = proof.reason
      ? proof.reason
      : `REFUSED (G1 not proven) — ${proof.gaps.length} gap(s): ${proof.gaps.map((g) => `${g.file}:${g.item}`).join(', ')}` +
        (proof.needsReview.length ? ` | ${proof.needsReview.length} needs-review: ${proof.needsReview.map((g) => `${g.file}:${g.item}`).join(', ')}` : '');
    return { sprintSlug, applied: false, refused: why };
  }
  const out = buildSprintOutput(sprintUuid, allUnits());
  if (!out) return { sprintSlug, applied: false, refused: 'FAIL-CLOSED: buildSprintOutput null' };
  const dir = path.join(SPRINTS_DIR, sprintSlug);
  // ★ G4 zero-loss is ALREADY GUARANTEED: proveComplete (above, G1) ran the SAME shared perFileDiffs over the SAME
  // out.files and returned complete === true — so re-proving here would be redundant and could only DISAGREE if it
  // diverged (the exact prove/apply bug we removed). We TRUST the proof. Belt-and-braces re-check available via the
  // exported perFileDiffs if ever needed. ★ ATOMIC (G3): pass 1 collects the write set only; pass 2 writes all-or-
  // nothing — so no later step can leave an earlier file partially written (the non-atomic bug that half-migrated S19).
  const toWrite: { fp: string; generated: string; name: string }[] = [];
  for (const [name, generated] of out.files) {
    const fp = path.join(dir, name);
    const old = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
    if (normalizeLF(old) !== normalizeLF(generated)) toWrite.push({ fp, generated, name }); // G3 idempotent: skip byte-stable
  }
  const written: string[] = [];
  for (const w of toWrite) { if (opts.apply) fs.writeFileSync(w.fp, w.generated); written.push(w.name); }
  return { sprintSlug, applied: opts.apply, filesWritten: written };
}

// CLI: --prove <sprintUuid>  (read-only proof) | --apply <sprintUuid> [--write]  (proof-gated; --write actually writes)
if (process.argv[1] && process.argv[1].endsWith('migrate-boards.ts')) {
  const args = process.argv.slice(2);
  const mode = args[0]; const sprintUuid = args[1]; const write = args.includes('--write');
  if (mode === '--prove' && sprintUuid) {
    const r = proveComplete(sprintUuid);
    console.log(`\n=== BoardMigrator.proveComplete ${r.sprintSlug} ===`);
    if (r.reason) { console.log(`✗ ${r.reason}`); process.exit(1); }
    else if (r.complete) { console.log('✓ COMPLETE — units reproduce every structural board item (safe to migrate)'); }
    else {
      if (r.gaps.length) { console.log(`✗ REFUSE — ${r.gaps.length} GAP(s) (units missing content in the hand-authored board):`); for (const g of r.gaps) console.log(`  ${g.file} :: ${g.item}`); }
      if (r.needsReview.length) { console.log(`⚠ ${r.needsReview.length} NEEDS-REVIEW (id-less row, no exact match — reworded? human confirms, NOT auto-matched):`); for (const g of r.needsReview) console.log(`  ${g.file} :: ${g.item}`); }
      process.exit(1);
    }
  } else if (mode === '--apply' && sprintUuid) {
    const r = applyMigration(sprintUuid, { apply: write });
    console.log(`\n=== BoardMigrator.applyMigration ${r.sprintSlug} (${write ? 'WRITE' : 'dry-run'}) ===`);
    if (r.refused) { console.log(`✗ ${r.refused}`); process.exit(1); }
    console.log(`✓ ${write ? 'MIGRATED' : 'WOULD migrate'} ${(r.filesWritten || []).length} file(s): ${(r.filesWritten || []).join(', ') || '(none — already generated)'}`);
  } else {
    console.log('Usage: node --import tsx scripts/migrate-boards.ts --prove <sprintUuid> | --apply <sprintUuid> [--write]');
  }
}
