// T37.27 / R40.4-phase2 MIGRATION — (1) PIN model.slug from DISK TRUTH for un-slugged sprints, then (2) strip the
// embedded "Sprint <n><sep>" prefix from stored names so the number lives ONLY in model.number (DRY). Reuses the
// renderer's OWN stripSprintPrefix/sprintDisplayName (migration == render). PO ruling (A) + 2 guards:
//  GUARD 1 (data-loss, disk-truth): a sprint's dir cannot be reliably derived from a MUTABLE name → pin model.slug =
//    the ACTUAL EXISTING dir. Verify the dir exists BEFORE pinning; if a strip-touched un-slugged sprint's derived slug
//    matches NO existing dir, it already has a latent mismatch → STOP + report, never bake it in.
//  GUARD 2 (checked coupling): post-apply every touched sprint's slug MUST resolve to an existing dir (+ a standalone
//    ci gate, stub-must-fail). INVARIANT: rendered display byte-identical AND zero dirs created/renamed/orphaned.
// SPRINT ONLY. DRY-RUN default (read-only); --apply writes via ScenarioIndex.put. Run: node --import tsx scripts/migrate-sprint-name-strip.ts [--apply]
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../src/ts/scenario/index-store.js';
import { sprintDisplayName, stripSprintPrefix } from '../src/ts/scenario/sprint-label.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
const SPRINTS_DIR = path.join(ROOT, 'scrum.pmo/sprints');
const EMBED = /^Sprint\s*(\d+)\s*[—:\-]/i;
// EXACTLY generate-sprint-md speakingSlug's name-derivation (single-source parity — if it drifts, the gate catches it).
const slugify = (name: string): string => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const dirExists = (slug: string): boolean => { try { return !!slug && fs.statSync(path.join(SPRINTS_DIR, slug)).isDirectory(); } catch { return false; } };

const sprints = [...idx.list()].map((u) => idx.get(u)!).filter((u) => u && u.ior === 'ior:class:Sprint');

type Row = { uuid: string; name: string; num: number | null; embedded: number | null; storedSlug: string | null; derivedSlug: string; stripped: string; before: string; after: string; idem: boolean };
const rows: Row[] = sprints.map((u) => {
  const m = u.model as Record<string, unknown>;
  const name = String(m.name || '');
  const num = typeof m.number === 'number' ? (m.number as number) : null;
  const em = name.match(EMBED);
  return { uuid: String(m.uuid), name, num, embedded: em ? parseInt(em[1], 10) : null, storedSlug: m.slug ? String(m.slug) : null,
    derivedSlug: slugify(name), stripped: stripSprintPrefix(name), before: sprintDisplayName(name, num), after: sprintDisplayName(stripSprintPrefix(name), num), idem: stripSprintPrefix(stripSprintPrefix(name)) === stripSprintPrefix(name) };
});

const mismatches = rows.filter((r) => r.embedded != null && (r.num == null || r.embedded !== r.num)); // number data-loss guard
const renderDiffs = rows.filter((r) => r.before !== r.after);                                          // renderer invariant
const nonIdem = rows.filter((r) => !r.idem);
const toStrip = rows.filter((r) => r.embedded != null && r.embedded === r.num && r.name !== r.stripped && r.before === r.after);

// GUARD 1: un-slugged strip-touched sprints → pin model.slug from the EXISTING dir; latent mismatch (derived→no dir) = STOP.
const toPin: Array<{ uuid: string; dirSlug: string; name: string }> = [];
const latent: Row[] = [];
for (const r of toStrip) {
  if (r.storedSlug) continue;                                   // already stable → strip is slug-safe, no pin
  if (dirExists(r.derivedSlug)) toPin.push({ uuid: r.uuid, dirSlug: r.derivedSlug, name: r.name }); // disk-verified truth
  else latent.push(r);                                          // pre-existing latent mismatch — do NOT bake in
}

console.log(`Sprint units: ${sprints.length} | embedded-number: ${rows.filter((r) => r.embedded != null).length} | TO-STRIP: ${toStrip.length} | TO-PIN-slug (un-slugged): ${toPin.length}`);
console.log(`\n★ GUARD1a number attr==embedded MISMATCH (MUST 0): ${mismatches.length}`);
for (const r of mismatches) console.log(`  ✗ ${r.uuid.slice(0, 8)} "${r.name}" embedded=${r.embedded} attr=${r.num}`);
console.log(`★ GUARD1b LATENT slug mismatch — derived slug → NO existing dir (MUST 0, else STOP): ${latent.length}`);
for (const r of latent) console.log(`  ✗ ${r.uuid.slice(0, 8)} "${r.name}" derived="${r.derivedSlug}" → no dir (report, never bake in)`);
console.log(`★ RENDERER before/after DIFF (MUST 0): ${renderDiffs.length} | IDEMPOTENCE non-idem (MUST 0): ${nonIdem.length}`);
console.log(`\n=== slug-pin plan (pin model.slug = existing dir, disk truth) ===`);
for (const p of toPin) console.log(`  ${p.uuid.slice(0, 8)} pin slug="${p.dirSlug}" (dir EXISTS) — was un-slugged, name "${p.name}"`);
console.log(`=== strip plan (rendered display byte-identical) ===`);
for (const r of toStrip) console.log(`  ${r.uuid.slice(0, 8)} "${r.name}" → "${r.stripped}"  [renders "${r.before}" ✓]`);

const gateOk = mismatches.length === 0 && latent.length === 0 && renderDiffs.length === 0 && nonIdem.length === 0;

if (APPLY) {
  if (!gateOk) { console.error('\n✗ GATE RED — aborting --apply (mismatch/latent-slug/render-diff/non-idempotent present)'); process.exit(1); }
  const dirsBefore = fs.readdirSync(SPRINTS_DIR).sort().join('\n');
  for (const p of toPin) { if (!dirExists(p.dirSlug)) { console.error(`✗ dir vanished for ${p.uuid}`); process.exit(1); } const u = idx.get(p.uuid)!; (u.model as Record<string, unknown>).slug = p.dirSlug; idx.put(p.uuid, u); } // (1) pin slug FIRST
  for (const r of toStrip) { const u = idx.get(r.uuid)!; (u.model as Record<string, unknown>).name = r.stripped; idx.put(r.uuid, u); }                                                                                    // (2) then strip name
  const idx2 = new ScenarioIndex(path.join(ROOT, 'scenario/index'));
  const after = [...idx2.list()].map((u) => idx2.get(u)!).filter((u) => u && u.ior === 'ior:class:Sprint');
  const stillEmbedded = after.filter((u) => { const nm = String((u.model as Record<string, unknown>).name || ''); return nm !== stripSprintPrefix(nm); }).length;
  const unresolved = after.filter((u) => { const m = u.model as Record<string, unknown>; const s = m.slug ? String(m.slug) : slugify(String(m.name || '')); return !dirExists(s); });
  const dirsAfter = fs.readdirSync(SPRINTS_DIR).sort().join('\n');
  console.log(`\n★ APPLIED: pinned ${toPin.length} slugs + stripped ${toStrip.length} names.`);
  console.log(`  idempotence: ${stillEmbedded} still-embedded (MUST 0)`);
  console.log(`  GUARD2 every sprint slug → existing dir: ${unresolved.length} UNRESOLVED (MUST 0)`);
  for (const u of unresolved) console.log(`    ✗ ${String((u.model as Record<string, unknown>).uuid).slice(0, 8)} slug→no dir`);
  console.log(`  zero-dir-change: ${dirsBefore === dirsAfter ? 'YES ✓ (no dir created/renamed/orphaned)' : 'NO ✗ — DIRS MOVED'}`);
  process.exit(stillEmbedded === 0 && unresolved.length === 0 && dirsBefore === dirsAfter ? 0 : 1);
} else {
  console.log(`\n${gateOk ? '★ DRY-RUN GATE GREEN — safe to --apply' : '✗ DRY-RUN GATE RED — do NOT apply (see guards above)'}`);
  process.exit(gateOk ? 0 : 1);
}
