# TEXT-NOT-STRUCTURE — the name-keyed-guard family (architect, 2026-08-29)

PO raised it from the r4011 dead-lint root; my taxonomy call. SIBLING to the truth-decay family (they CO-OCCUR — r4011's dead-lint is both a truth-decay coverage-gap AND a text-match — but the ROOT differs, so distinct families, per the same boundary discipline that kept missing-mechanism separate).

## The disease (one sentence)
**A check or claim matches surface TEXT — a name, a string, a mention, a specific identifier — where it should match STRUCTURE or BEHAVIOUR.** Consequence: evadable by RENAMING, or wrong by COINCIDENCE (a name matches while the meaning differs). The guard reads GREEN while the hazard walks through.

## Distinct from truth-decay (why a sibling, not Arm-C)
- **Truth-decay:** the ARTIFACT goes stale / born-false; nothing keeps it true. Cure = derive / revalidate / positive-control.
- **Text-not-structure:** the INSTRUMENT matches the wrong THING (text vs structure); it may be perfectly fresh and still wrong/evadable. Cure = match the HAZARD/structure/behaviour.
- They intersect but don't reduce to each other. Keep separate; a claim can be both.

## Corpus (4 specimens, 4 roles, one root — measured)
1. **guessed-name grep=0** (PO, #8) — matched a function NAME that didn't exist (`resolveChangeRequest`) → false absence; the real behaviour was `approveChangeRequest`. Text (a guessed name) instead of behaviour (does a close-path exist?).
2. **string-match coverage count** (PO) — counted coverage by TEXT match → miscounted. Text instead of structural link (is there a real edge?).
3. **name-mention-vs-structural-link miss** — a check accepted a NAME MENTION as a link where a structural link was required.
4. **name-keyed lint** (r4011 dead-lint) — `check:synthetic-ref-single-source` pattern#2 matches `ior:instance:${ref|rawRef}` by VARIABLE NAME; `RbDetailBase:57` interpolates `${uuid}` → evaded by the rename. Text (var names) instead of the hazard (instance-keying a possibly-synthetic ref).

**EXCLUDED (honest boundary):** my fact-2 unmeasured-premise is NOT this family — that was *asserted-without-measuring* (truth-decay Arm-B born-false), a different root than *matched-text-instead-of-structure*. The PO grouped all recent self-catches together; at the root they split. (Naming the boundary precisely is the point — a lone mis-classification weakens the doctrine.)

## The CURE — scan the HAZARD, not the ACTORS
Match the dangerous OPERATION / structural relation / behaviour, which is unevadable and names itself — never a specific identifier, name, or mention. [[scan-the-hazard-not-the-actors]] + [[assert-the-rendered-artifact-not-a-proxy]]. Concretely: a lint matches the raw hazardous CALL/interpolation shape (any `ior:instance:${…}` on a ref not proven-instance), not `${ref}`/`${rawRef}`; coverage DERIVES from a structural edge, not a text hit; absence is proven by a positive control, not a name grep.

## ★ META-GUARD (PO-proposed, mechanisable) — the guards subject to the guard
A **lint-over-lints**: scan `scripts/check-*` for NAME-KEYED patterns — a regex whose discriminating token is a specific identifier / variable name / literal string rather than a structural or behavioural predicate. Flag (report → then RED after a warn window) any check whose match can be defeated by RENAMING. Self-bite: plant a name-keyed check → must flag; plant a hazard-keyed check → must pass. This makes our own guards fall under the doctrine — the highest leverage, since a name-keyed guard gives FALSE confidence (worse than none).
- Bootstrapping caution: the meta-lint itself must not be name-keyed (don't grep for `ref|rawRef` literally) — it must detect the SHAPE "discriminant is an identifier/literal" structurally, or it's specimen #5 of its own family.

## Handoff
- Immediate (already in r4011 design 5a83f4c76, PO-approved): widen `check:synthetic-ref-single-source` to the hazard (any `ior:instance:${…}` + `refUuid`-then-instance-fetch), extend its self-bite with the `${uuid}` shape.
- Family: req mints a TEXT-NOT-STRUCTURE requirement + the lint-over-lints AC (failable, self-biting, non-name-keyed); planner stands up the guard task; expert builds; I re-inspect. Cross-ref truth-decay (co-occurring family). Not urgent vs the recorder capture / fact-2; a real structural improvement to the guard fleet.
