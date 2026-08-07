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
import { buildSprintOutput, allUnits, GENERATED_HEADER, SPRINTS_DIR } from './generate-sprint-md.js';

const normalizeLF = (s: string): string => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/g, '') + '\n';

// G5: extract only STRUCTURAL items — traceability refs (requirement/task/test/impl:uuid), altId-style IDs
// (R30.11, T36.5, R-C2), and checkbox row labels. Free prose/narrative lines yield no items (excluded from proof).
export function significantItems(md: string): Set<string> {
  const items = new Set<string>();
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    const ref = /\b(requirement|task|test|impl):uuid:([0-9a-f]{8})/i.exec(line);
    if (ref) items.add(`${ref[1].toLowerCase()}:${ref[2].toLowerCase()}`);
    for (const m of line.matchAll(/\b(R-C\d+|T-C\d+|[RT]\d+(?:\.\d+)*)\b/g)) items.add(`id:${m[1].toUpperCase()}`);
    const cb = /^-\s*\[[ xX]\]\s*(.+)$/.exec(line);
    if (cb) { const lbl = cb[1].replace(/[*_`]/g, '').trim(); if (lbl) items.add(`row:${lbl.slice(0, 60).toLowerCase()}`); }
  }
  return items;
}

// PURE gap-finder: structural items in the hand-authored board that the generated (units) board does NOT produce
// = content the units are missing → the migration must REFUSE (G1), naming them. Narrative differences are ignored (G5).
export function proveBoardComplete(handAuthored: string, generated: string): string[] {
  const gen = significantItems(generated);
  return [...significantItems(handAuthored)].filter((it) => !gen.has(it)).sort();
}

export interface ProofResult { sprintSlug: string; complete: boolean; gaps: { file: string; item: string }[]; }

// [impl:uuid:21e38b44-eb21-4fbf-830c-303ad2775095] BoardMigrator.proveComplete (Method c9a8b675) — G1
// proof-before-write, READ-ONLY: for each HAND-AUTHORED board file (no GENERATED_HEADER) in the sprint, prove
// every structural item is also produced by the generator from units; REFUSE (complete:false) NAMING each gap.
export function proveComplete(sprintUuid: string): ProofResult {
  const out = buildSprintOutput(sprintUuid, allUnits());
  const sprintSlug = out?.sprintSlug || sprintUuid;
  const gaps: { file: string; item: string }[] = [];
  if (out) {
    const dir = path.join(SPRINTS_DIR, sprintSlug);
    const generatedAll = [...out.files.values()].join('\n');
    // SCOPE = only the GENERATOR-OWNED board files (out.files: planning.md / requirements.md / task-*.md). Hand-
    // authored ANALYSIS/DESIGN docs (chain-narrowing-analysis.md, compound-requirement-source.md, *.puml, etc.) are
    // NOT migration targets — they stay hand-authored + preserved (OWNED-OUTPUT whitelist), never proven/overwritten.
    for (const name of out.files.keys()) {
      const fp = path.join(dir, name);
      if (!fs.existsSync(fp)) continue;                    // generator will create it fresh → no hand-authored to prove
      const content = fs.readFileSync(fp, 'utf-8');
      if (content.startsWith(GENERATED_HEADER)) continue;  // already a generated board → nothing to prove
      for (const item of proveBoardComplete(content, generatedAll)) gaps.push({ file: name, item });
    }
  }
  return { sprintSlug, complete: gaps.length === 0, gaps };
}

export interface MigrationResult { sprintSlug: string; applied: boolean; refused?: string; filesWritten?: string[]; }

// [impl:uuid:73f045d8-e0ac-4afc-b357-92e76aa8ddc0] BoardMigrator.applyMigration (Method 37d3fc2f) — PROOF-GATED
// migration. G1: calls proveComplete first and REFUSES (naming gaps) unless complete. G4 zero-loss: re-verifies
// each old board file's structural items all survive into the generated one before writing. G3 idempotent: skips a
// file whose generated content already matches (byte-stable); the caller commits ONE sprint per atomic (revertible)
// commit. G2 backfill + G5 narrative-exclusion are honored by construction (never invents units; prose not proven).
// Only writes when opts.apply === true; dryRun otherwise (returns what WOULD be written).
export function applyMigration(sprintUuid: string, opts: { apply: boolean }): MigrationResult {
  const proof = proveComplete(sprintUuid); // G1
  const sprintSlug = proof.sprintSlug;
  if (!proof.complete) {
    return { sprintSlug, applied: false, refused: `REFUSED (G1 not proven) — ${proof.gaps.length} item(s) absent from units: ` + proof.gaps.map((g) => `${g.file}:${g.item}`).join(', ') };
  }
  const out = buildSprintOutput(sprintUuid, allUnits());
  if (!out) return { sprintSlug, applied: false, refused: 'not a Sprint' };
  const dir = path.join(SPRINTS_DIR, sprintSlug);
  const written: string[] = [];
  for (const [name, generated] of out.files) {
    const fp = path.join(dir, name);
    const old = fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : '';
    const lost = proveBoardComplete(old, generated); // G4 zero-loss (belt-and-braces vs proveComplete)
    if (lost.length) return { sprintSlug, applied: false, refused: `REFUSED (G4 zero-loss) ${name}: would drop ${lost.join(', ')}` };
    if (normalizeLF(old) === normalizeLF(generated)) continue; // G3 idempotent
    if (opts.apply) fs.writeFileSync(fp, generated);
    written.push(name);
  }
  return { sprintSlug, applied: opts.apply, filesWritten: written };
}

// CLI: --prove <sprintUuid>  (read-only proof) | --apply <sprintUuid> [--write]  (proof-gated; --write actually writes)
if (process.argv[1] && process.argv[1].endsWith('migrate-boards.ts')) {
  const args = process.argv.slice(2);
  const mode = args[0]; const sprintUuid = args[1]; const write = args.includes('--write');
  if (mode === '--prove' && sprintUuid) {
    const r = proveComplete(sprintUuid);
    console.log(`\n=== BoardMigrator.proveComplete ${r.sprintSlug} ===`);
    if (r.complete) { console.log('✓ COMPLETE — units reproduce every structural board item (safe to migrate)'); }
    else { console.log(`✗ REFUSE — ${r.gaps.length} gap(s) (units missing content present in the hand-authored board):`); for (const g of r.gaps) console.log(`  ${g.file} :: ${g.item}`); process.exit(1); }
  } else if (mode === '--apply' && sprintUuid) {
    const r = applyMigration(sprintUuid, { apply: write });
    console.log(`\n=== BoardMigrator.applyMigration ${r.sprintSlug} (${write ? 'WRITE' : 'dry-run'}) ===`);
    if (r.refused) { console.log(`✗ ${r.refused}`); process.exit(1); }
    console.log(`✓ ${write ? 'MIGRATED' : 'WOULD migrate'} ${(r.filesWritten || []).length} file(s): ${(r.filesWritten || []).join(', ') || '(none — already generated)'}`);
  } else {
    console.log('Usage: node --import tsx scripts/migrate-boards.ts --prove <sprintUuid> | --apply <sprintUuid> [--write]');
  }
}
