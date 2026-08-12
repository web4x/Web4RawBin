# Requirement content — Orphan-method-marker lint (FLEET-WIDE, OUTSIDE, do-not-execute-tonight)

Architect-supplied requirement content for req to mint (routed via PO — req-silence honoured). **campaignScope = OUTSIDE. Do NOT execute tonight — PO schedules.** Companion to R40.37's narrow in-gate orphan-check; this is the fleet-wide generalisation.

## Title
An `[impl:uuid]` marker on a method declaration must have a live caller OR a supersede record — a marker on dead code silently credits work nothing runs.

## Intent (the class it closes)
An `[impl:uuid:…]` marker on a METHOD decl claims that code implements a chain node. If nothing calls that method AND it is not recorded as superseded, the marker credits work that never runs — a false-green that survives because no one measures the call-graph. (R40.37 nearly produced one: `actionsForContext` a1a5be99 would have been marked-but-uncalled after its conversion; we caught it and superseded-with-record instead.) This lint makes the class impossible to recur silently, fleet-wide. Same family as the no-2nd-source lint and the ownerIor gate.

## The check
For every `[impl:uuid:…]` marker on a method declaration in `src/`: resolve whether the method has **≥1 runtime caller** (static call-graph / call-site scan) **OR** its Method/Impl unit carries a **`supersededBy`** record. An **offender** = a marked method with zero callers AND no supersede.

## Sequencing — REPORT-ONLY-LOUD first, STRICT when offenders == 0
Run repo-wide it will almost certainly find PRE-EXISTING orphans; a lint that is RED from birth is how gates get silently deleted (happened tonight). So:
- **Phase 1 (land now, when scheduled): REPORT-ONLY-LOUD** — enumerate every marker, print offenders (count + NAMED) loudly, `exit 0`. Never blocks.
- **Phase 2: flip to STRICT** (fail `ci:gates`) — ONLY when the offender count reaches **0**. The flip condition is an explicit AC; the current offenders are NAMED DEBT tracked to 0.
Precedent shape: `check:sprint-md`, `consistency:strict`, the ownerIor gate — report-only until the debt is 0, then strict-by-construction.

## Acceptance criteria (for req to formalise)
- **AC1 [report-only]** The lint scans every `[impl:uuid]` method-marker in `src/`, resolves caller-or-supersede, and prints offenders (count + each named: file:line + method + impl-uuid) LOUD, `exit 0` in report-only mode.
- **AC2 [named debt]** The current offender set is enumerated as NAMED DEBT — the baseline to drive to 0 (never a silent count).
- **AC3 [flip-to-strict, explicit]** When offenders == 0, the lint flips to STRICT (fails `ci:gates`). A born-RED strict gate is forbidden — report-only until 0. The flip is the acceptance event.
- **AC4 [supersede honoured]** A method whose unit carries `supersededBy` is NOT an offender (honorSupersededBy, R30.11) — SUPERSEDED-honest ≠ orphan.
- **AC5 [stub-must-fail ON THE CHECK]** Feed a synthetic marked-uncalled-unsuperseded method → the lint FLAGS it (report, or fail in strict); feed a marked-called OR marked-superseded method → NOT flagged. The check is proven able to catch the class (a lint that can't go RED on a real orphan certifies nothing).

## Notes for req
- OUTSIDE the S40 server-manager campaign scope (its own requirement/task). Do-not-execute-tonight; PO schedules.
- The narrow, R40.37-diff-scoped version ships INSIDE R40.37's gate (asserts THIS conversion left no orphan) — this fleet-wide one generalises it.
