/**
 * R40.5 — detail/feature-view action-button DE-DUPLICATION gate (AC-automatable-grep-inventory-scoped +
 * AC-automatable-dedup-lint-scoped). Enforce, do NOT document.
 *
 * SCOPE: the detail/feature VIEW surfaces only — src/public/ts/trace/rb-*detail*.ts.
 * EXCLUDED (recorded, never silently dropped — Tron kept this UX as-is, R40.5 scope): the EDITOR CHROME
 *   rb-editor-toolbar.ts + rb-editor-layout.ts. The lint MUST NOT fire on them.
 * INVARIANT (DE-DUPLICATION, not uniformity): no logical action button is implemented BESPOKE in more than ONE
 *   detail view. A single-surface button (terminal RC, diagram Trace, a pane zoom-reset) is legitimate distinct
 *   chrome and PASSES; a logical action duplicated across ≥2 views must instead be ONE universalActionBar action
 *   unit. FAILS (exit 1) on any cross-file duplicate → planting the same action button in a 2nd view = RED (stub-must-fail).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'src/public/ts/trace');
const EXCLUDED = ['rb-editor-toolbar.ts', 'rb-editor-layout.ts']; // EDITOR CHROME — out of R40.5 scope (recorded exclusion)

/** Extract normalized action-button labels (inline <button>…</button> + createElement('button')+.textContent). */
function buttonLabels(src: string): string[] {
  const raw: string[] = [];
  for (const m of src.matchAll(/<button[^>]*>\s*([^<{][^<]*?)\s*<\/button>/g)) raw.push(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*document\.createElement\('button'\)/g)) {
    const t = src.match(new RegExp(m[1] + "\\.textContent\\s*=\\s*'([^']+)'"));
    if (t) raw.push(t[1]);
  }
  // normalize: strip icons/emoji/punctuation → compare the LOGICAL action, not its glyph
  return raw.map((l) => l.replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim().toLowerCase()).filter(Boolean);
}

// [impl:uuid:1beb8fb0-924f-4bdf-a5ce-a586bb2d3591] DetailBespokeActionsGuard.findBespokeDuplicates — the R40.5 dedup
// check as an EXPORTED, testable fn (was module-level). Scans the scoped detail views, logs the inventory, and RETURNS
// the cross-file duplicate groups as [label, ...files][] ([] = PASS). The module-level runner below CALLS it +
// reports/exits — ci:gate behaviour unchanged; the Test can assert on the returned groups (0 normally, groups on a plant).
export function findBespokeDuplicates(): string[][] {
  const files = fs.readdirSync(DIR).filter((f) => /^rb-.*detail.*\.ts$/.test(f) && !EXCLUDED.includes(f));
  const byLabel = new Map<string, string[]>();
  const inventory: Array<[string, string[]]> = [];
  for (const f of files) {
    const labels = buttonLabels(fs.readFileSync(path.join(DIR, f), 'utf-8'));
    if (labels.length) inventory.push([f, labels]);
    for (const l of labels) { const arr = byLabel.get(l) || []; if (!arr.includes(f)) arr.push(f); byLabel.set(l, arr); }
  }
  console.log(`=== R40.5 detail/feature action-button INVENTORY (${files.length} view files; EXCLUDED editor chrome: ${EXCLUDED.join(', ')}) ===`);
  for (const [f, ls] of inventory) console.log(`  ${f}: ${ls.join(' | ')}`);
  return [...byLabel.entries()].filter(([, fs2]) => fs2.length > 1).map(([l, fs2]) => [l, ...fs2]);
}

// module-level runner (ci:gate check:detail-bespoke) — CALLS the exported fn, reports + exits. Behaviour identical.
const dups = findBespokeDuplicates();
if (dups.length) {
  console.error('\n✗ R40.5 FAIL — a logical action is implemented BESPOKE in >1 detail view (must be ONE universalActionBar action unit, not per-view markup):');
  for (const [label, ...dupFiles] of dups) console.error(`  "${label}" in [${dupFiles.join(', ')}]`);
  process.exit(1);
}
console.log('\n✓ R40.5 PASS — 0 duplicated bespoke action buttons across detail/feature views (de-duplication invariant holds; single-surface chrome is allowed).');
