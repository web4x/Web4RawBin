<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.54: Meta-guard - no requirement is satisfied whi

[task:uuid:bebe4f98-a6c3-472f-80cf-9defdfbc2ff4]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.54 (Meta-guard - no requirement is satisfied whi). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.54; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(by-construction)** Each AC stores an explicit gate pointer: AC = {id, text, tag, gateRef:{kind: test|lint|script|ci, ref, assertion}, stubMustFail: <proof-ref>|null}. gateRef names the check that enforces THIS AC (a Test uuid / lint-rule id / script+assertion / CI gate). The AC->gate edge is explicit + queryable, not implied.
- [ ] **(by-construction)** gateRef alone is insufficient (a green-only gate can be inert = the R37.12 disease). stubMustFail must reference a REGISTERED RED observation: a recorded run where the gate was fed the DEFECT the AC forbids and went RED (a Test result RED-on-stub / committed proof / CI run id). An AC whose gate has NEVER been shown RED on its own defect = unproven = counts as UNFAILABLE. (Generalizes R4 evidence-must-fail from Test-level to AC-level.)
- [ ] **(by-construction)** satisfiable(req) = for EVERY AC: gateRef present AND stubMustFail is a proven-RED record AND the gate currently passes GREEN on real code. If ANY AC lacks a gateRef OR lacks a proven-RED stub, the requirement is NOT satisfiable - fail-closed. The satisfaction-computer + the CI gate REFUSE to flip satisfactionStatus=Satisfied while any AC is a wish. This refusal IS the meta-guard (would have blocked all 5 false-satisfactions).
- [ ] **(by-construction)** A universal ALL-X AC is inadmissible unless its gateRef carries: (i) the enumerated instance list of X DERIVED BY STRUCTURAL DISCOVERY - an AST/pattern match on the shape that DEFINES X (e.g. anything matching the *-detail component shape / anything that renders current / anything with an async render tail), NOT a hand-maintained list; (ii) a DIVERGENCE cross-check (any two X disagree => RED); (iii) a COMPLETENESS check that compares the DERIVED-discovered set against the ENROLLED set (the X that actually have the property - subscribe to the bus / route through the shared contract / carry the guard) and goes RED on any DISCOVERED-BUT-NOT-ENROLLED X. ★ THE DISCOVERY MUST BE DERIVED, NOT DECLARED: because the universe is discovered by SHAPE, adding a 10th component (a new current-view / a new *-detail) CANNOT escape - it is discovered structurally and, if unenrolled, => RED. A completeness check whose should-enroll set is DECLARED (hand-maintained) is ITSELF inadmissible - it inherits the exact drift it exists to prevent (the 6th reminder one level up). stub-must-fail: add a new X that MATCHES the discovery shape but is NOT enrolled => RED (proves the derived discovery catches the newcomer, not a stale hand-list). ★ SINGLE-SOURCE DISCOVERY (PO): the structural-discovery here (AcGuard) and the live-MVC lint discovery (R37.12 B: async-append *-detail sites by shape) MUST route through ONE shared discovery utility - NOT two implementations of find-components-matching-a-shape (that is the one-implementation-family problem ONE LEVEL UP). check-before-create with the architect; if they overlap, one utility both inherit.
- [ ] **(detector)** A trace:audit:wishes script (sibling of the existing trace-audit gates, registered in ci:gates) enumerates ALL ACs across ALL requirements and reports every UNFAILABLE one: no gateRef, OR gateRef with no proven-RED stub, OR a universal AC with no enumeration. --strict FAILS the build while count>0 (a declared allowlist ONLY for items genuinely downgraded AC->note). Finds instance #6 before Tron does.
- [ ] **(stub-must-fail)** The guard-of-guards proves ITSELF failable (base case, closes the recursion): seed a requirement with a wish-AC (no failable gate) -> the satisfaction-computer MUST refuse Satisfied AND the wish-sweep MUST flag it. If the meta-guard passes a wish-carrying req as satisfiable, it is itself inert. Self-applied stub = base case; the meta-guard demands provably-failable and is itself provably-failable on a wish -> no meta-meta-guard needed.
- [ ] **(by-construction/policy)** (a) NEW/CHANGED = fail-closed AT WRITE TIME: any requirement created, or whose ACs change from R40.54 forward, CANNOT be Satisfied unless every AC is failable+proven - enforced at write. NO new wishes enter the system. stub: a new AC with no failable gate marked satisfied => RED.
- [ ] **(by-construction/honesty)** (b) EXISTING = satisfaction:UNVERIFIED, a THIRD DISTINCT state - neither Satisfied (cannot prove) nor Unsatisfied (no gate went RED). Avoids the retroactive-unsatisfy shock while telling the truth. UNVERIFIED != Satisfied in EVERY rollup. stub: an existing unfailable AC rendered GREEN (inflation) OR Unsatisfied (erasure) instead of UNVERIFIED => RED. State machine: UNVERIFIED --(AC gains proven-RED gate + GREEN)--> Satisfied; UNVERIFIED --(gate RED)--> Unsatisfied; NEW-with-wish --> blocked at write.
- [ ] **(process/policy)** (c) DRAIN BY RISK, not FIFO/alphabetical: a wish on a security / data-integrity / Tron-facing AC OUTRANKS a cosmetic one - the most dangerous unenforced ACs get failable gates first. stub: a housekeeping UNVERIFIED resolved while a higher-risk (user-facing/invariant-critical) UNVERIFIED remains outstanding => RED.
- [ ] **(detector/honesty)** (d) PUBLISH THE COUNT (shrinking, like the campaign board) + FALSE-DRAIN DETECTOR: a wish leaves the count ONLY when its AC gains a proven-RED gate - NEVER by re-labelling AC->note, silently dropping, or hiding. wish-sweep --strict RECOMPUTES the count from the gates; a count that drops WITHOUT a new proven-RED stub => RED. drained is never reported while any remain. The number must mean what it says.

## Subtasks
