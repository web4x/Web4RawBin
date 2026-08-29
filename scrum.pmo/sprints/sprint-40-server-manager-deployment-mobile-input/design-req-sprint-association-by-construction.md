# Sprint-association enforced at req-mint — by-construction (architect, 2026-08-29)

PO-routed via planner: 24 requirements are wired to NO sprint (no `sprintName` + no resolvable parent-Sprint) → invisible to every sprint view = unplannable/untrackable BY CONSTRUCTION. PO ruling: do NOT backfill-attach (that hides the defect till it recurs); treat the 24 as the SYMPTOM. Question to me: is sprint-association enforced at req-mint, and SHOULD a sprint-less req be structurally impossible?

## Measured (the by-construction gap is real)
- **No shared req-mint helper enforces a sprint parent.** `ior:class:Requirement` units are minted in ≥3 code paths (skills.ts, templates.ts, server.ts) + ad-hoc scripts; grep finds no `requireSprint` / mint-path sprint check. The mint path PERMITS a sprint-less req.
- **No audit surfaces sprint-less reqs** (trace-audit.ts has no such check). So orphans are neither prevented at mint NOR surfaced after — silent by construction. The 24 are the predictable product.
- This is a **truth-decay / born-invisible** instance (family R37.25): a req reads authoritative but is untrackable-by-construction — cure = derive/reject at authoring + surface-don't-silence. Same shape as mintOrReuseClass (R27.2) and ensureViewUnit-refuses (R40.66).

## RULING: YES — make a sprint-less req structurally impossible (S37's own thesis)
1. **Prevention (by-construction, primary):** route req-mint through ONE helper that REQUIRES a resolvable sprint — `sprintName` resolving to an existing Sprint OR a `parent` → Sprint edge. No resolvable sprint ⇒ **reject + fail-LOUD** (never mint a silent orphan). Every req-mint call-site routes through it (the choke-point pattern; a mint that bypasses it is itself a violation, caught by #3). It is NOT enough to warn — an unparented req must not come into existence.
2. **Backstop (CI, un-skippable):** trace-audit asserts **0 sprint-less reqs** (a req with neither a resolvable `sprintName` nor a `parent`→Sprint). **DELTA-gated** (the R27.2-INV2 lesson): the 24 pre-existing are debt NOT created by this guard → **WARN + SURFACE now** (list the 24 by uuid in the audit output — coverage-self-report style, never a silent count), flip to **RED after the 24 are triaged**, time-boxed (a warn-only resting state is the report-only trap). stub-must-fail: seed a sprint-less req → the audit RED (or WARN-with-listing pre-flip); a sprinted req → clean.
3. **The 24 = SYMPTOM, surfaced NOT backfilled (PO ruling honored):** each triaged INDIVIDUALLY by req/planner — a real req → attach to its TRUE sprint (a decision, not a default); a dead/superseded req → retire. **Never bulk auto-attach** (that manufactures a false "planned" and hides the recurrence). The audit's surfaced list IS the triage worklist. I'll take the 24 uuids to spot-check they're genuinely sprint-less (positive-control: prove the detector finds a known-sprinted req too) before the list is trusted.

## Boundary (freeze intact)
This is a DISTINCT by-construction guard (req-mint sprint-association), related to the truth-decay family by cure-shape but NOT one of the frozen 6 per-class gates — the R37.25 per-class set stays frozen. Cross-ref the family; whether this becomes a family member or a standalone S37 guard is req/planner+PO's call. I ruled the mechanism, not the taxonomy placement.

## Handoff
req: mint the requirement (req-mint rejects sprint-less; audit 0-sprint-less delta-gated) + the triage decisions for the 24. planner: stand up the guard task + the 24-triage. expert: the mint-path choke-point + the trace-audit check (self-biting). I re-inspect (mint rejects a sprint-less req; audit lists the 24 then REDs post-triage; detector positive-control). Not urgent vs recorder/fact-2; a real by-construction improvement.
