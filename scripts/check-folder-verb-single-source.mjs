/**
 * T37.21 defect-2 — FOLDER-VERB single-source gate (Tron DRY: "it cannot be that folders SOMETIMES have Add folder
 * buttons and SOMETIMES not"). Enforce, do NOT document.
 *
 * INVARIANT: a folder verb ('add-folder') is declared in EXACTLY ONE place — UNIVERSAL_DECLS
 *   (src/public/ts/trace/action-applicability.ts) — so the offer follows the unit onto EVERY surface through the ONE
 *   shared drawer bar. It must NOT appear in ANY per-surface decl set (*-action-decls.ts, e.g. model-action-decls.ts)
 *   — a per-surface declaration is exactly the "sometimes a button, sometimes not" bug (model had it, room/trace did not).
 * FAILS (exit 1): a folder verb declared in a per-surface set, OR missing from UNIVERSAL_DECLS. Self-bites first.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'src/public/ts');
const UNIVERSAL = path.join(PUBLIC, 'trace/action-applicability.ts');
const FOLDER_VERBS = ['add-folder']; // the container/folder verbs that MUST be universal (single-source)

// recursively find every *-action-decls.ts under src/public/ts (the per-surface decl sets)
function findPerSurfaceDeclFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...findPerSurfaceDeclFiles(p));
    else if (/-action-decls\.ts$/.test(ent.name)) out.push(p);
  }
  return out;
}

// does `src` DECLARE this verb (verb: 'x' in a decl literal)? (comments mentioning it don't count — require the decl shape)
function declaresVerb(src, verb) {
  return new RegExp(`verb:\\s*['"]${verb}['"]`).test(src);
}

// --- SELF-BITE: the detector must catch a planted per-surface folder verb, else it is inert ---
const PLANT = `  { verb: 'add-folder', label: 'x', appliesTo: {} },`;
if (!declaresVerb(PLANT, 'add-folder')) { console.error('✗ SELF-BITE FAILED — declaresVerb is inert; the gate cannot detect a plant.'); process.exit(1); }

const perSurface = findPerSurfaceDeclFiles(PUBLIC);
const violations = [];
for (const f of perSurface) {
  const src = fs.readFileSync(f, 'utf-8');
  for (const v of FOLDER_VERBS) if (declaresVerb(src, v)) violations.push([path.relative(ROOT, f), v]);
}

// POSITIVE: the ONE source (UNIVERSAL_DECLS) must actually declare each folder verb — else the offer vanished everywhere.
const uni = fs.readFileSync(UNIVERSAL, 'utf-8');
const missingFromUniversal = FOLDER_VERBS.filter((v) => !declaresVerb(uni, v));

console.log(`=== T37.21 folder-verb single-source (verbs: ${FOLDER_VERBS.join(', ')}; per-surface decl files scanned: ${perSurface.length}) ===`);
for (const f of perSurface) console.log(`  scanned ${path.relative(ROOT, f)}`);

if (violations.length || missingFromUniversal.length) {
  if (violations.length) { console.error('\n✗ FAIL — folder verb declared in a PER-SURFACE decl set (must live ONLY in UNIVERSAL_DECLS):'); for (const [f, v] of violations) console.error(`  "${v}" in ${f}`); }
  if (missingFromUniversal.length) console.error(`\n✗ FAIL — folder verb(s) missing from UNIVERSAL_DECLS (${path.relative(ROOT, UNIVERSAL)}): ${missingFromUniversal.join(', ')} — the offer would vanish on every surface.`);
  process.exit(1);
}
console.log(`\n✓ PASS — folder verb(s) [${FOLDER_VERBS.join(', ')}] declared ONCE in UNIVERSAL_DECLS, in 0 per-surface sets (DRY single-source holds; the Add folder offer follows the unit on every surface).`);
