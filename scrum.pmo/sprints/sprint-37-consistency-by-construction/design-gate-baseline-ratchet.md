# Baseline-Ratchet — make permanently-red gates useful again (item 4)

**Author:** robbin-architect · 2026-08-08. A gate red on known debt STOPS GATING (a new violation is invisible inside the existing red = the mirror of an always-green gate). Fix: a committed, dated baseline per CHECK; the check fails on anything BEYOND baseline; the baseline may only RATCHET DOWN; a RAISE needs the same visible authorisation as removing a gate. Generalises R-C2's INV2 delta.

## Granularity: per-CHECK, not per-GATE (the key)
One gate carries an ABSOLUTE invariant AND a DELTA-baselined debt class simultaneously ([6] proves it). So the baseline record is keyed by CHECK id, not gate.

## Baseline record (committed + dated) — `scrum.pmo/gate-baselines.json`
Per check: `{ check, gate, kind: "ABSOLUTE"|"DELTA", baseline: 0 | { count, knownIds?[] }, dated, owner, lastRatchet }`.
- **ABSOLUTE checks** (baseline 0, never carry debt — small + fixable, fail on ANY): dup-Class, cardinality, well-formedness, TRUNCATED-uuid, **TRUNCATED-STORED-REF (new, 43→0 target)**, **sprint-pin exactly-1-active**.
- **DELTA checks** (baseline = known debt, fail on CURRENT beyond baseline): orphans/dangling/Axis-3 (R27.5, 1897), dual-status-unverifiable (4), board-drift/pending-migration (15, inherits the frozen-18 tier), fabricated-uuid (65/32 until re-minted).
- **Prefer the known-debt ID SET over a bare count** where feasible: the check fails if any CURRENT id ∉ `knownIds` (catches a swap — one fixed, another introduced, count unchanged). Fall back to `count` only where the set is too large to enumerate (e.g. the 1897); document which per check.

## The gate logic
- ABSOLUTE: fail if count > 0.
- DELTA (id-set): fail if `current \ knownIds` ≠ ∅ (a NEW violation beyond the recorded debt). DELTA (count-only): fail if `current > baseline.count`.
- Every run PRINTS `check: baseline N (known debt) · current M · Δ` — so the known debt is never hidden as red noise; a reader sees "15 known-pending, 0 new" honestly.

## RATCHET-DOWN-only + the RAISE guard (meta-gate)
- Fixing debt → update the baseline to the new LOWER count/set (a normal reviewed commit).
- **A baseline may NEVER increase silently.** A meta-check (in ci:gates) compares the committed `gate-baselines.json` to its previous committed version (git): if ANY check's baseline rose, it FAILS unless the commit carries an explicit, reviewed `BASELINE-RAISE-AUTHORISED: <check> <old>→<new> reason=… by=<PO/Tron>` marker. Raising a baseline = quietly re-admitting debt = equivalent to removing the gate for those items, so it demands the same visibility. Normal ratchet-down is unguarded.

## Per-check application (PO shapes)
- **[1] trace:audit:strict — NO CHANGE.** Already the correct hybrid (HARD classes absolute-0 + deferred delta 1897). Went RED on a genuinely-new defect and back GREEN at d48337fe6 = proof it works. REFERENCE PATTERN. (Add TRUNCATED-STORED-REF to its absolute-0 set.)
- **[3] check:sprint-md — DELTA + pending-migration list.** EXTEND the existing frozen-legacy-18 baseline tier (don't invent a second mechanism). Owner = R-C7. Requirement: a byte-matching sprint that REGRESSES goes RED even though the 15 known-pending don't → use the ID-SET (known-pending sprint slugs), not a bare count.
- **[6] consistency:strict — SPLIT into three checks under one gate:** (a) sprint-pin exactly-1-active = ABSOLUTE (a delta would defeat the invariant — the whole point is exactly one); (b) dual-status = DELTA-baseline the 4 known-unverifiable; (c) board-drift = inherits [3]'s delta.

## Deploy
scripts/CI-only. `gate-baselines.json` committed. The meta-gate (raise-guard) joins `ci:gates:raw`. No restart. This makes the 3 currently-red gates useful TODAY without pretending the debt is fixed.
