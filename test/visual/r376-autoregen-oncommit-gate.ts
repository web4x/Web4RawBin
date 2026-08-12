// [test:uuid:b4e21f7a-9c38-4d05-a1e6-73f8c2015d9b] T37.6 / R37.6 — autoRegenOverview (Impl b886ef5d) DISTINCT-INTENT bite: auto-regen-ON-COMMIT orchestration. NOT the pre-existing check:sprint-overview (that's the overview-generation family's --check — borrowing it would be T40.5-style borrowed-credit). This asserts T37.6's OWN properties: (1) narrative OUTSIDE the generated region is preserved BYTE-FOR-BYTE across a regen; (2) the generator is IDEMPOTENT (regen∘regen == regen); (3) the R37.8 owned-output-guard the regen rides REFUSES a markerless / wrong-name target (anti-clobber = the commit-boundary anti-sweep of a hand-authored doc); (4) STUB-MUST-FAIL self-verify tripwire — a CORRUPTED index fails checkOverview (the tripwire that BLOCKS the commit in step-4), while a clean regen passes. Family: under-recorded-progress / silent-drift.
// Pollution-free: synthetic overview STRING + scratch temp file; real ScenarioIndex read-only for Sprint units. Tooling gate on git-clean HEAD source — NO served artifact ⇒ no SW/served-guard (stated deliberately, per the standing rule's scope). DET. node22: PATH=/opt/node22/bin:$PATH npx tsx test/visual/r376-autoregen-oncommit-gate.ts
// SCOPE (honest, no silent gap): the commit-FLOW git steps autoRegenOverview also owns — staged-deletion-check of an UNMARKED scrum.pmo doc + the unstaged-narrative git anti-sweep + git-add stage — are driven by git diff --cached against the HARDCODED real repo root (import.meta.url), so they can't be run faithfully in isolation; they are exercised by the LIVE .githooks/pre-commit (it fired for real on the 3d354fa0d unit mint). This bite covers the regen/guard/verify/narrative/idempotent core that is unit-isolable.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScenarioIndex } from '../../src/ts/scenario/index-store.ts';
import { SprintOverviewGenerator, BEGIN, END } from '../../src/ts/scenario/sprint-overview-generator.ts';
import { guardedWriteRegion } from '../../scripts/owned-output-guard.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const idx = new ScenarioIndex(path.join(ROOT, 'scenario/index')); // read-only: generateOverview READS Sprint units
const gen = new SprintOverviewGenerator(idx);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'r376-'));
const results: Record<string, boolean> = {};

// content OUTSIDE the [BEGIN..END] region (region collapsed) — the narrative that MUST survive byte-for-byte
const narrativeOutside = (s: string): string => {
  const b = s.indexOf(BEGIN), e = s.indexOf(END);
  if (b === -1 || e === -1 || e < b) return s;
  return `${s.slice(0, b)}[[REGION]]${s.slice(e + END.length)}`;
};

try {
  const TOP = '# Sprints Overview\n\nHAND-AUTHORED NARRATIVE TOP — must survive byte-for-byte.\n\n';
  const BOTTOM = '\n\n## Notes\nHAND-AUTHORED NARRATIVE BOTTOM — also byte-exact.\n';
  const overview0 = `${TOP}${BEGIN}\nstale index line\n${END}${BOTTOM}`;

  // ── (1) narrative preserved BYTE-FOR-BYTE + ── (2) IDEMPOTENT ──
  const out1 = gen.generateOverview(overview0);
  const out2 = gen.generateOverview(out1);
  results['narrative-byte-preserved'] = narrativeOutside(out1) === narrativeOutside(overview0)
    && out1.startsWith(TOP) && out1.endsWith(BOTTOM);
  results['idempotent'] = out2 === out1; // regen∘regen == regen (the property the commit-flow relies on)

  // ── (3) owned-output-guard REFUSES a markerless / wrong-name target (anti-clobber) but WRITES a proper region ──
  const bad = path.join(scratch, 'markerless.md');
  fs.writeFileSync(bad, 'hand-authored, NO region marker\n');
  const refusedMarkerless = guardedWriteRegion(bad, out1, BEGIN, (b) => b === 'sprints.overview.md') === false
    && fs.readFileSync(bad, 'utf-8') === 'hand-authored, NO region marker\n'; // untouched
  const good = path.join(scratch, 'sprints.overview.md');
  fs.writeFileSync(good, overview0);
  const wroteOwned = guardedWriteRegion(good, out1, BEGIN, (b) => b === 'sprints.overview.md') === true
    && narrativeOutside(fs.readFileSync(good, 'utf-8')) === narrativeOutside(overview0); // region swapped, narrative kept
  const refusedWrongName = guardedWriteRegion(good, out1, BEGIN, (b) => b === 'some-other-name.md') === false; // name-gate
  results['guard-anti-clobber'] = refusedMarkerless && wroteOwned && refusedWrongName;

  // ── (4) STUB-MUST-FAIL self-verify tripwire: clean regen passes checkOverview; a CORRUPTED index goes RED ──
  const hardReasons = (o: string) => gen.checkOverview(o).reasons.filter((r) => !r.startsWith('R37.6 REPORT'));
  const cleanPasses = hardReasons(out1).length === 0;
  const corrupted = out1.replace(END, `CORRUPTED-INJECTED-LINE\n${END}`); // break the between-markers index
  const corruptFails = hardReasons(corrupted).length > 0;
  results['tripwire-stub-must-fail'] = cleanPasses && corruptFails;

} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

console.log('===== T37.6 autoRegenOverview auto-regen-ON-COMMIT bite (DET) =====');
let green = true;
for (const [k, v] of Object.entries(results)) { console.log(`  ${k}: ${v ? 'GREEN' : 'RED'}`); if (!v) green = false; }
const need = ['narrative-byte-preserved', 'idempotent', 'guard-anti-clobber', 'tripwire-stub-must-fail'];
if (need.some((k) => !(k in results))) { green = false; console.log('  INCOMPLETE — a section threw before asserting'); }
console.log('OVERALL:', green ? 'GREEN — regen preserves narrative byte-for-byte, idempotent, guard anti-clobbers, tripwire bites' : 'RED');
process.exitCode = green ? 0 : 1;
