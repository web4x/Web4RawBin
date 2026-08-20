# R40.54 — the meta-guard: no requirement satisfied while any AC is unfailable (architect mechanism design, 2026-08-20)

req minted R40.54 (`18e98268`); I own the mechanism. **Invariant (PO): a requirement MAY NOT be marked satisfied while any AC lacks a check that can PROVABLY FAIL (fail-closed).** This is the systemic cure for the defect that recurred **5×** today — R40.50 (value-gate), R40.48 (unenforced no-broad-add AC), R32.3 (tree-renderer), R37.12 (ONE VIEW BUS "every view subscribes" with no failable AC), R40.53 (dir guard). Every one asserted a property with no failable check = a WISH, and the requirement was (falsely) satisfiable.

## The unit of enforcement: an AC is only real if its gate can go RED on the defect
An AC that cannot be shown to FAIL on the very thing it forbids is a wish, not an acceptance criterion. So every AC must carry the evidence that its gate BITES.

## Mechanism (the 6 ACs, designed)

### 1. `ac-carries-gate-ref` — each AC stores its gate pointer
Extend the AC schema (in `requirement.acceptanceCriteria[]`) from free text to:
```
AC = { id, text, tag, gateRef: { kind: 'test'|'lint'|'script'|'ci', ref, assertion }, stubMustFail: <proof-ref> | null }
```
`gateRef` names the check that enforces THIS AC (a Test unit uuid, a lint rule id, a script+assertion, or a CI gate). The AC→gate edge becomes explicit + traceable (queryable), not implied.

### 2. `gate-has-registered-stub-must-fail` — the gate is PROVEN able to fail (generalises req's R4 to AC-level)
`gateRef` alone is insufficient (a green-only gate can be inert — the R37.12 disease). The AC's `stubMustFail` must reference a **registered RED observation**: a recorded run where the gate was fed the DEFECT the AC forbids and went RED (a Test result marked RED-on-stub, a committed proof, a CI run id). An AC whose gate has never been shown RED on its own defect = unproven = counts as unfailable.

### 3. `satisfaction-fail-closed` — how "satisfied" is computed
`satisfiable(req)` = **for EVERY AC**: `gateRef` present ∧ `stubMustFail` is a proven-RED record ∧ the gate currently passes GREEN on real code. **If ANY AC lacks a gateRef, or lacks a proven-RED stub, the requirement is NOT satisfiable — period (fail-closed).** A satisfaction-computer (and the CI gate) REFUSES to flip `satisfactionStatus=Satisfied` while any AC is a wish. This refusal IS the meta-guard; it is what would have blocked all 5 false-satisfactions.

### 4. `enumerate-not-universal` — a universal AC needs an enumerated list + divergence cross-check
An `ALL X do Y` AC is the value-gate trap (passes vacuously / on one instance). The mechanism REQUIRES a universal AC's gateRef to carry (i) the **enumerated instance list** of X, (ii) a **divergence cross-check** (any two X disagree → RED), and (iii) a **completeness check** (an X not in the enumerated set → RED, so the list can't silently drift — e.g. a new current-view or a new `*-detail` component that didn't join). "All current-views rerender" → `{pin, drawer, tree-highlight, scoreboard}` + no-two-disagree + new-view-not-enrolled = RED. A universal AC with no enumeration = unfailable → blocked by (3).

### 5. `wish-sweep` — enumerate every unfailable AC, drain to 0
A `trace:audit:wishes` script (sibling of the existing trace-audit gates) enumerates ALL ACs across ALL requirements and reports every one that is UNFAILABLE: no gateRef, OR gateRef with no proven-RED stub, OR a universal AC with no enumeration. `--strict` FAILS the build while the count > 0 (a declared allowlist only for items genuinely downgraded from AC to note). Registered in `ci:gates`. This sweep is the proactive drain — it finds instance #6 before Tron does.

### 6. `meta-guard-stub-must-fail` — the guard-of-guards proves ITSELF failable (closes the recursion)
The meta-guard must itself go RED on its own defect: **seed a requirement with a wish-AC (no failable gate) → the satisfaction-computer MUST refuse `Satisfied` AND the wish-sweep MUST flag it.** If the meta-guard passes a wish-carrying requirement as satisfiable, it is itself inert (the infinite regress). Its self-applied stub-must-fail is the base case — the meta-guard demands "provably-failable" and is itself provably-failable on a wish, so no meta-meta-guard is needed.

## Traceability (req wires the chain on this design)
UC `requirement.enforceFailableACs` → Class `AcGuard` → Methods `assertEveryAcFailable` (per-req fail-closed), `sweepWishes` (the audit), `assertUniversalEnumerated`. crossRef the 5 instances (R40.50 / R40.48 / R32.3 / R37.12 / R40.53) as the training set — the meta-guard, run retroactively, must flag each one's original unfailable AC (a real regression-test corpus).

## Why this is the cure, not a 6th reminder
Every prior fix said "add a failable stub" as guidance — and it was forgotten 5×. This makes it STRUCTURAL: satisfaction is fail-closed on unfailable ACs, so a requirement literally CANNOT be marked done while carrying a wish, and the wish-sweep drains the backlog to 0. The discipline stops being remembered and becomes computed.

## §SWEEP POLICY (req +4 PO ACs fb4d2a952) — a THIRD state, drain-by-risk, honest count
Retro-applying fail-closed to EVERY existing requirement would mass-flip them to Unsatisfied = a false shock (they may be genuinely done; only their AC-enforcement is unproven). So satisfaction has THREE states, not two:
- **(a) NEW/CHANGED = fail-closed NOW.** Any requirement created or whose ACs change from this point CANNOT be `Satisfied` unless every AC is failable+proven — enforced at write time. No new wishes enter the system.
- **(b) EXISTING = `satisfaction:UNVERIFIED` (a DISTINCT state, not Unsatisfied).** An existing requirement carrying an unfailable AC is neither Satisfied (can't prove it) nor Unsatisfied (no gate went RED) — it is **UNVERIFIED**: honestly "we cannot currently verify this." This avoids the retroactive-unsatisfy shock while telling the truth. UNVERIFIED ≠ Satisfied in every rollup.
- **(c) DRAIN BY RISK.** The UNVERIFIED backlog is worked highest-RISK-first (a wish on a security/data-integrity/Tron-facing AC outranks a cosmetic one), not FIFO — so the most dangerous unenforced ACs get failable gates first.
- **(d) PUBLISH THE COUNT, NEVER FALSELY DRAIN.** The UNVERIFIED count is published (a shrinking number, like the campaign board). A wish leaves the count ONLY when its AC gains a proven-RED gate — NEVER by re-labelling an AC to a note, silently dropping it, or moving it to a hidden bucket. `wish-sweep --strict` recomputes the count from the gates; a count that drops without a new proven-RED stub is itself a RED (false-drain detector). The number must mean what it says.
- **State machine:** UNVERIFIED --(AC gains proven-RED gate + gate GREEN)--> Satisfied; UNVERIFIED --(gate RED)--> Unsatisfied; NEW-with-wish --> blocked at write (never enters). The wish-sweep = the count of UNVERIFIED-due-to-unfailable-AC, drained to 0 by risk.
