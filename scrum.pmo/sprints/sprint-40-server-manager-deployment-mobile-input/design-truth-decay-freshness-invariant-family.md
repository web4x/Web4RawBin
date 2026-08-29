# Truth-Decay / No-Freshness-Invariant — the FAMILY (architect, 2026-08-29)

Planner raised it; PO asked for ONE family, not N instance-fixes. This note frames the class + the by-construction cure so per-instance fixes CITE it instead of re-discovering it. Loci measured on disk by planner (measure-first), corroborated here.

## The disease (one sentence)
**An artifact EXISTS, LOOKS AUTHORITATIVE, and NOTHING keeps it TRUE/ACTIONABLE** — a stored value or constraint with no invariant re-checking it against the reality it claims. It does not fail loud; it silently misleads and is still trusted. (Generalized from "true over time" to "true/actionable at read" per PO — the class includes a constraint that was never satisfiable, not only one that drifted; both share: authoritative-reading artifact, nothing validates it, silent.)

## Corpus (enumerated, not "there are some" — enumerate-not-universal)
LIVE specimens (planner-measured):
1. **superseded-instruction-still-authoritative** — `DEPLOY-STATE.md:18-24` "do NOT merge→main, DELETE this branch". Falsifier: the branch now has 14 hotfix-only commits incl shipped v0.8.143 live-MVC (3fb338004) + RCE closure (87a3e4134/52547b90d). Obeying the stored instruction un-ships prod. Nothing re-checks the instruction against branch reality. PURE specimen.
2. **AC-minted-never-tasked** — req R40.50 `4c4de905`: `acceptanceCriteria`=7, `tasks[]`=EMPTY (UC f7bb0f20 wired, no covering Task). Shipped "falsely satisfied" v0.8.118 → reopened. Satisfaction was ASSUMED, not DERIVED from a tracked task.
CURED specimen (BEFORE→AFTER proof the cure lands):
3. **unwired-guard-reads-as-coverage** — T40.1 `7a956c21` NOW carries `- [ ] processing change requests` + status DERIVES `QA-Review-with-open-CR` (R40.59 task-status.ts:43; migrated a7b340755 + b917e2799). Use as the worked proof, not a live locus.
Prior/this-week specimens the family SUBSUMES:
4. **boot-currency** (R40.55, my finding) — boot names a stale sprint/version, no invariant holds it==HEAD. Cure already designed: Layer-1 currency-lint + Layer-2 state-removal.
5. **fact-2 nextBacklogOverride** (commit 46c68e1fc) — a stored NEXT slot that rots; cured by derive-don't-store.
6. **circular-ruling / unsatisfiable-constraint** (PO's own, 2026-08-29) — the "merge-after-live-MVC while live-MVC-waits-for-reconcile" ruling read as an authoritative plan but was a DEADLOCK from birth; nothing checked it for satisfiability/liveness → it silently blocked a fix. VARIANT: not "decayed over time" but "never actionable, unchecked" — still the family meta-shape (authoritative artifact, nothing validates it, silent). Cure: a stored CONSTRAINT/RULING must be liveness-checked when read and render VISIBLY BLOCKED (not silently block work). Distinct from the missing-mechanism sibling: here an authoritative artifact EXISTS and misleads; there none exists.
7. **★ self-catch (this note's author, 2026-08-29)** — I reported DEPLOY-STATE.md as a live stale-instruction specimen by REPEATING a peer's earlier measurement of its lines instead of RE-READING the live file (which had been corrected, d042d1c59, and WAS on my disk). I delivered a design about silently-decaying stored artifacts WHILE being misled by one. Root: a relayed measurement is ITSELF a stored artifact with no freshness — it was true when the peer read it, stale when I cited it, and nothing re-validated it at point-of-use. The class is pervasive enough to catch the author of its own design-note. **The visible-stale half of the cure is exactly what would have saved me** — had DEPLOY-STATE rendered its own supersededness, or had I re-derived at use, no stale claim ships. Corpus is ≥7, not 3.
8. **★ relayed-measurement escalated as fact (robbin-po, 2026-08-29, PO's request to record with their name)** — the planner measured `resolveChangeRequest` grep=0; the PO relayed it, escalated it as a HARD blocker, and told Tron three times that his CRs cannot close / his task cannot reach Done. It was a WRONG-NAME measurement. Re-derived at point-of-use (my grep this session): `resolveChangeRequest`=0 hits, `approveChangeRequest`=EXISTS (server.ts) and works (2 CRs already approved). A measurement the PO did not take, repeated as fact, in front of the person waiting on delivery — the sub-lesson's sharpest instance. Also the source of the evaporated sibling-boundary above. Corpus now ≥8, including this note's author (#7) and the PO (#8).
9. **★ relayed-blocker persisted by a repeat-directive (robbin-planner, 2026-08-29, owned)** — planner carried "T40.1 BLOCKED: resolveChangeRequest grep=0" in its anchor + EVERY report for days, under a standing "keep repeating" instruction. It was a guessed name / false-absence: re-derived, the close-path EXISTS as `approveChangeRequest` (server.ts, planner cites 1667+1948; I independently confirmed the symbol exists). DISTINCT facet vs #8: not just a one-time relay — a **standing repeat-this-every-report directive became the stored-and-silent CARRIER**, re-asserting the stale fact on schedule. The repeat-instruction is itself an authoritative artifact with no freshness.
Lineage (same disease, already ruled): pin two-writer, sprint-name double-number, R37.12 revalidate-or-stale-badge, R-C9 done-provenance, R40.11 two-store 33-overlaps.
Meta: in ONE day the class caught 3 measured artifacts + a circular ruling + a stale mental read + the architect + the PO + a standing repeat-directive. That pervasiveness IS the argument for a by-construction cure over daily instance-fixes.

## Cure addendum — the two RELAY carriers (from #7/#8/#9)
- **relayed measurement** (#7/#8): re-derive at point-of-use before asserting a peer's count/name/absence in any durable artifact or report. A relayed measurement carries the timestamp of THEIR read, not yours.
- **standing repeat-directive** (#9): a "repeat X every report / keep-saying-X" instruction MUST carry a **re-derive-before-repeat** clause, else it manufactures a PERSISTENT stale artifact (worse than a one-time relay — it re-injects the stale fact on every cycle). Rule: no standing repeat-directive without a per-repeat re-derivation of what it asserts; a blocker especially must be re-derived at each report, never relayed-from-store. This is derive-per-read applied to the reporting loop itself.

## Sub-lesson (from #7): a RELAYED MEASUREMENT decays too
A peer's measurement (line numbers, counts, "X is absent/present") is a stored value with a timestamp of THEIR read, not yours. RE-DERIVE at point-of-use before asserting it as current — especially for anything you put in a durable artifact or a report. (I re-measured after the catch: DEPLOY-STATE was indeed corrected — my error; req's R40.69 units were indeed still absent — that one held. Measure-first sorted which was which; relaying would not have.)

## NOT in the family — the SIBLING boundary (conceptual), + how its cited instance EVAPORATED
**missing-mechanism ≠ stale-artifact** remains a valid conceptual sibling: *absence of a producer* (no mechanism exists to make X true) vs *a stored value gone stale* (X was true, drifted). Different cure (build the mechanism vs re-derive/render-stale).
**★ BUT the instance I cited for it was itself specimen #8 (below).** I named `resolveChangeRequest` grep=0 as a "missing close-mechanism" — a RELAYED measurement on the WRONG function name. Re-derived at point-of-use (this session): `resolveChangeRequest`=0 hits, but `approveChangeRequest`=EXISTS (server.ts) and works (2 CRs already approved). So there is NO missing mechanism — the sibling boundary was drawn around a decayed measurement. I now hold the sibling as a CONCEPTUAL class with **no currently-verified live instance** (honest: the one I had evaporated on re-derivation). This is the sharpest proof of the sub-lesson: a relayed measurement corrupted the family's own taxonomy until re-derivation fixed it.

## ★ TWO FAILURE MODES — one family, TWO guards (PO-raised, architect taxonomy call)
The PO caught that specimen #8 was **BORN-FALSE, not WENT-STALE**: a guessed function name grepped to 0 and escalated — revalidating it just re-runs the same wrong query and re-confirms the false. Freshness alone would let #8 recur. I ruled the corpus and the split IS meaningful (~half/half), so the cure needs BOTH arms:
- **WENT-STALE** (was true, drifted, nothing re-checks): #1 DEPLOY-STATE, #4 boot-currency, #5 fact-2 auto-demote, #7 my relay of a once-true measurement; lineage pin-two-writer / sprint-double-number / R37.12 / two-store-33.
- **BORN-FALSE** (never true; asserted without derivation — guessed/assumed/unsatisfiable): #2 AC assumed-satisfied-never-tasked, #3 coverage-claimed-but-unwired, #6 circular-ruling (unsatisfiable from birth), #8 guessed-name false-absence, #9 born-false payload carried by a repeat-directive.
**Taxonomy ruling: ONE family, TWO guards — not two families.** They share the meta-shape (authoritative artifact, nothing validates it, silent) and can co-occur (#9 = born-false payload that then persists stale). Splitting would duplicate the enforcement scaffold and lose the unifying "derive, never trust a stored/constructed assertion." Name the two modes; give each its guard.

## The CURE — a per-artifact-class FRESHNESS/PROVENANCE invariant (TWO ARMS)
**Arm A — WENT-STALE → freshness:** (below) derive-per-read, else stored-with-revalidation + VISIBLE-STALE + show-age.
**Arm B — BORN-FALSE → provenance / positive-control:** an authoritative claim must show it was DERIVED from the real source, not constructed from a guess/assumption. Specifically:
- A **NEGATIVE / absence claim** (grep=0, "missing", "not found") is INADMISSIBLE until the INSTRUMENT is shown able to find something — a POSITIVE CONTROL (grep a name known to exist; confirm the query CAN succeed). Structurally identical to stub-must-fail: an instrument that cannot succeed proves nothing by failing. [[distrust-your-own-negative-reverify]].
- A **positive satisfaction/coverage claim** (AC satisfied, guard covers, task Done) must DERIVE from a tracked producer (a covering task, a wired gate), never be assumed. An AC with tasks[]==empty is born-unsatisfiable; coverage with no ci:gates wiring is born-uncovered.
- A **constraint/ruling** must pass a LIVENESS/satisfiability check at authoring (a plan that deadlocks is born-false — #6).
- Note WHY Arm B differs from Arm A: revalidating a born-false claim re-runs the SAME wrong instrument and re-confirms it. Arm B validates the INSTRUMENT/provenance, not just the value's freshness.

### (Arm A detail) per-artifact-class FRESHNESS invariant
For every artifact CLASS that reads as authoritative, one of these MUST hold (in priority order):
- **(a) DERIVE-first** — the artifact derives from its single source on each read; there is no stored copy to rot. (fact-2 NEXT derives from designated-vs-derived; CURRENT derives from max-lastAdvancedAt; boot Layer-2 state-removal; two-store canonical-only.) This is the strongest cure — the failure mode is structurally impossible.
- **(b) STORED-with-revalidation + VISIBLE-STALE** — when derivation is impossible and it must be stored, the artifact carries provenance RE-VALIDATED PER READ and renders VISIBLY STALE on failure. (R40.44 EXPLICIT-WINS-WHILE-VALID + observable-expiry; R37.12 stale-badge; R-C9 done-provenance; boot Layer-1 currency-lint == HEAD.)
- **NEVER (c) stored-and-silent** — a stored authoritative value with no re-check. That silence IS the entire family.

## Per-class application (each instance-fix cites this)
| Class | Artifact | Cure |
|---|---|---|
| deploy-instruction | DEPLOY-STATE.md | (a) DERIVE the instruction from branch reality (branch-contains + main..HEAD), OR (b) stamp it with the commit-range it was true for + render STALE when HEAD moves past it |
| req-satisfaction | AC satisfied? | (a) DERIVE satisfaction from a tracked covering Task's state — never store `satisfied` as an authored flag; an AC with `tasks[]`==empty is un-satisfiable-by-construction (ride R40.54 failable family + the untasked-AC audit) |
| guard-coverage | guard wired? | (a) coverage DERIVES from the guard being in ci:gates + the substep present (T40.1 cure) — already lands |
| boot-state | sprint/version | (a) state-removal (Layer-2) ELSE (b) currency-lint boot==HEAD (Layer-1) — R40.55 |
| derived-slot | NEXT/CURRENT | (a) derive from single source; drop stored overrides — fact-2 |

## Enforceability (FAILABLE, R40.54 family)
The family cure is only real if it can FAIL. Each class gets a lint/gate that RENDERS-STALE or REDs when the invariant breaks, with a stub-must-fail:
- untasked-AC: `tasks[]`-empty-with-ACs → RED (the ac-untasked-audit, already tier-1; make it strict per class).
- deploy-instruction: HEAD-past-the-stated-range → VISIBLE STALE banner (not silent).
- boot: boot-named-state ≠ HEAD → RED (R40.55 Layer-1).
- The META-invariant (worth a req), BOTH arms: (Arm A) NO artifact-class may store an authoritative value without EITHER deriving it OR carrying revalidated+visible-stale provenance; (Arm B) NO negative/absence claim may be asserted without a positive-control (instrument-proven-able-to-succeed), and NO satisfaction/coverage claim without a derived producer. Enforced per class, stub-must-fail each — and for Arm B the stub IS the positive control (prove the query can find a known-present thing before trusting its 0).
- born-false-specific gate: an absence-based escalation (grep=0 → BLOCKER) must attach its positive control in the same report, else inadmissible. Would have stopped #8 at the first escalation.

## Handoff
- req mints the family requirement + per-class ACs (ride R40.54 failable-AC family — truth-decay IS the "unenforced-wish over time" generalization). planner stands up the per-class guard tasks. expert wires each cure. I re-inspect.
- The per-instance fixes already in flight (boot Layer-1/2 R40.55, fact-2 46c68e1fc) CITE this note as their family root — do not duplicate their designs here.
- Keep the missing-mechanism sibling (resolveChangeRequest) OUT — separate task.
