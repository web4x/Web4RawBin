// R40.81 BEHAVIOUR-PAIR v2 — /trace + /model resolve the SAME units BYTE-IDENTICAL post-relocate. The v1 pair was CONFOUNDED:
// PRE(1c46ad3aa code) vs POST(HEAD code) differ in CODE, and the model-subtree lists the SOURCE-FILE tree, so added/edited .ts
// showed as false diffs. This v2 applies a CATEGORY RULE decided ON PRINCIPLE (written BEFORE looking at which refs failed — a
// rule written after is rationalising, PO 2026-09-06) to separate what the relocate CAN affect from what it CANNOT.
//
// ★ CATEGORY RULE (principle: the relocate touched DATA ONLY — it moved MODEL_STORE unit files into scenario/index; it did NOT
//   add/edit/remove a single source .ts file). A ref is:
//   • CODE-DERIVED  — its listing resolves from the SOURCE-FILESYSTEM tree: `dir:*`, `file:*`, and `rawbin:ts` (the src/ts root
//                     alias). These read the filesystem, NOT unit data → the relocate CANNOT affect them → legitimately OUT OF
//                     SCOPE (their diffs are ordinary code drift between the two capture commits). Every excluded ref is LOGGED.
//   • DATA-DERIVED  — its listing resolves from UNIT DATA (MODEL_STORE and/or scenario/index units): `rawbin:traceability`
//                     (Requirement units), `rawbin:diagram`/`rawbin:puml` (authored artefact units), `mof-m1`, `project:*`,
//                     class/method/attribute uuid refs, `current-sprint-*`, scenario refs. The relocate CAN affect these →
//                     IN SCOPE → they MUST be byte-identical for GREEN.
//   • AMBIGUOUS (a DATA-DERIVED ref that CHANGED) is NOT excluded — it is RESOLVED by a controlled SCRATCH comparison (SAME
//     HEAD code, MODEL_STORE from the SNAPSHOT vs current, only data differs → any diff is genuinely the relocate). NEVER
//     restore the snapshot over LIVE data — scratch only (the snapshot is the reversibility floor, for recovery not experiments).
import fs from 'node:fs';
const PRE = JSON.parse(fs.readFileSync('/tmp/r4081-pre.json', 'utf8'));
const POST = JSON.parse(fs.readFileSync('/tmp/r4081-post.json', 'utf8'));
const S = (x) => JSON.stringify(x);
// principled classifier — matches on ref SHAPE, not on pass/fail
const isCodeDerived = (ref) => /^(dir:|file:)/.test(ref) || ref === 'rawbin:ts';

const allRefs = [...new Set([...Object.keys(PRE.trees), ...Object.keys(POST.trees)])];
const code = allRefs.filter(isCodeDerived);
const data = allRefs.filter((r) => !isCodeDerived(r));
const dataChanged = data.filter((r) => S(PRE.trees[r]) !== S(POST.trees[r])); // in-scope violations (or ambiguous → resolve)
const codeChanged = code.filter((r) => S(PRE.trees[r]) !== S(POST.trees[r]));  // excluded (logged) — ordinary code drift

console.log('═══ R40.81 BEHAVIOUR-PAIR v2 — category rule (principle: relocate = DATA-ONLY) ═══');
console.log(`  refs total=${allRefs.length} | CODE-DERIVED=${code.length} (out of scope) | DATA-DERIVED=${data.length} (in scope)`);
console.log(`  CODE-DERIVED changed (EXCLUDED — logged, ordinary code drift, relocate cannot touch source): ${codeChanged.length}`);
for (const r of codeChanged) console.log(`      [code] ${r}`);
console.log(`  DATA-DERIVED byte-identical PRE==POST : ${data.length - dataChanged.length}/${data.length}`);
console.log(`  ★ DATA-DERIVED CHANGED (in scope — must be 0 for GREEN; each RESOLVE via scratch, do NOT exclude): ${dataChanged.length}`);
for (const r of dataChanged) {
  const a = PRE.trees[r], b = POST.trees[r];
  const ac = a?.children || [], bc = b?.children || [];
  const au = new Set(ac.map((c) => c.uuid)), bu = new Set(bc.map((c) => c.uuid));
  const gone = [...au].filter((u) => !bu.has(u)), added = [...bu].filter((u) => !au.has(u));
  console.log(`      [DATA] ${r}: childCount ${a?.childCount}->${b?.childCount}${gone.length ? ' GONE=' + gone.slice(0, 4).join(',') : ''}${added.length ? ' ADDED=' + added.slice(0, 4).join(',') : ''}`);
}
const alSame = S(PRE.authoredListings) === S(POST.authoredListings);
console.log(`  authoredListings (data-derived) identical: ${alSame ? 'GREEN' : 'RED'}`);

const green = dataChanged.length === 0 && alSame;
console.log(`OVERALL: ${green ? 'GREEN — every DATA-DERIVED ref byte-identical (relocate preserved read-path behaviour)' : 'RED/UNRESOLVED — ' + dataChanged.length + ' data-derived ref(s) changed → RESOLVE via scratch (same code, snapshot vs current data) before any verdict'}`);
console.log(`  NOTE: code-derived exclusions are logged above and justified by the DATA-ONLY principle — the rule was written before the failures were read.`);
process.exit(green ? 0 : 1);
