// [test:uuid:2f79c7c5-db26-42b5-9623-4f132c652618] R40.57 bareUuid property → Impl 3d1b5df8 (bareUuid canonical normalizer). GREEN 46-decoration property + failability-proven (stub-must-fail vs OLD ior-only form REDs 38/46).
// R40.57 bareUuid PROPERTY stub-must-fail (architect design 91dd0c2d1) — scan-the-HAZARD not the actors.
// CONTRACT: bareUuid reduces ANY decorated ref-form to the bare uuid. PROPERTY: for every decoration d in the FULL set
// (all type-prefixes + ior forms + @host + combos + NOVEL/never-enumerated prefixes), bareUuid(decorate(u)) === u.
// A task:-only assertion would be scan-the-actors (the next type-prefix re-opens the gap); this asserts the general
// contract, so it REDS on ANY new unhandled decoration by construction. GATE-FIRST: REDS on the current v0.8.125
// bareUuid (strips only ior:instance:/ior:class:/@host) → flips GREEN on the general strip (/^([a-z][a-z0-9-]*:)+/).
// Pure function, no browser/server. Run with tsx.
import { bareUuid } from '../../src/ts/shared/bare-uuid.ts';

const U = '7a956c21-5f37-4062-b921-9bdd5a461546';
// KNOWN type-prefixes (the actors we've seen) + NOVEL ones never enumerated (so an enumerated-list fix still REDs here)
const typePrefixes = ['task:', 'req:', 'uc:', 'usecase:', 'requirement:', 'class:', 'method:', 'impl:', 'implementation:',
  'test:', 'sprint:', 'bug:', 'file:', 'webitem:', 'diagram:', 'ior:instance:', 'ior:class:',
  'widget:', 'zzz:', 'newtype:', 'future-kind:']; // last four = NOVEL: a scan-actors fix would miss these
const hosts = ['@prod.wo-da.de', '@localhost', '@host'];

const cases = [];
cases.push({ label: 'bare', ref: U });
for (const p of typePrefixes) cases.push({ label: p, ref: p + U });
for (const h of hosts) cases.push({ label: h, ref: U + h });
for (const p of typePrefixes) for (const h of hosts.slice(0, 1)) cases.push({ label: p + '…' + h, ref: p + U + h }); // combos

const fails = [];
for (const c of cases) { const got = bareUuid(c.ref); if (got !== U) fails.push({ label: c.label, ref: c.ref, got }); }

console.log(`bareUuid PROPERTY over ${cases.length} decorations (contract: every decorated form → bare uuid)`);
if (fails.length) {
  console.log(`  ${fails.length}/${cases.length} FAIL — bareUuid does NOT reduce these decorations:`);
  fails.forEach(f => console.log(`    ${JSON.stringify(f.label)}: bareUuid returned ${JSON.stringify(f.got)} (expected the bare uuid)`));
} else {
  console.log('  ALL decorations reduce to the bare uuid — the general strip holds.');
}
const green = fails.length === 0;
console.log(`\n  PROPERTY VERDICT: ${green ? 'GREEN — bareUuid strips ANY leading type-prefix (+ior + @host), by construction' : 'RED — bareUuid leaves some decorations undecorated (scan-actors gap; a general /^([a-z][a-z0-9-]*:)+/ strip closes it)'}`);
console.log(`  (this test REDS on a NEW/unhandled decoration by construction — includes novel prefixes widget:/zzz:/future-kind:, so an enumerated-list fix still REDs)`);

// ── STUB-MUST-FAIL (failability AT the check): the property MUST RED against the OLD buggy bareUuid (ior-only). If it
// passes on the broken form, the test is vacuous. This proves the property catches the class, not just the current code.
const buggyBareUuid = (ref) => String(ref ?? '').replace(/^ior:(instance|class):/, '').split('@')[0]; // v0.8.125 pre-fix
const buggyFails = cases.filter(c => buggyBareUuid(c.ref) !== U);
const stubReds = buggyFails.length > 0;
console.log(`\n  STUB-MUST-FAIL (property vs the OLD ior-only bareUuid): ${stubReds ? `RED ✓ — ${buggyFails.length}/${cases.length} decorations fail on the buggy form (e.g. ${JSON.stringify(buggyFails[0].label)}) → the property BITES` : 'DID NOT RED ✗ — the property is vacuous (BUG in the test)'}`);

const pass = green && stubReds; // GREEN on the fixed bareUuid AND proven-bites on the broken one
console.log(`\n  R40.57 bareUuid property gate: ${pass ? 'GREEN + failability-proven' : 'FAIL'}`);
process.exitCode = pass ? 0 : 1;
