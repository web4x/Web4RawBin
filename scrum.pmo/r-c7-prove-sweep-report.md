# R37.7 — Full `--prove` Sweep (authoritative apply-ready set)

Regenerated on the FIXED prover (`perFileDiffs` single-source, HEAD `1ae1a905e`) via
`/opt/node22/bin/node --import tsx scripts/prove-sweep.ts`. Read-only. Matches architect's independent sweep:
**10 apply-ready / 27 refusing / 0 prove↔apply disagreement** (by construction).

## APPLY-READY (10) — all IN-SCOPE (S20+); zero frozen S01-18
uuids captured by `scripts/prove-sweep.ts`. ★ CANARY FINDING (S37): "already-generated" ≠ "no-op". S37 `--apply`
wrote requirements.md (**13 insertions, 0 deletions** — additive). Root cause = DRIFT (units evolved AC rows after
the view was last generated), NOT generator non-idempotency (verified: 2nd apply = 0 writes). So each ready sprint
is a prove-COMPLETE **regenerate-view-to-match-units** migration (additive, zero-loss), not a guaranteed no-op.

| Sprint | uuid | Scope |
|---|---|---|
| sprint-20-radical-forward-planning-traceability-first | 64af2638 | IN-SCOPE |
| sprint-28-graph-integrity-foundation | fabc9784 | IN-SCOPE |
| sprint-30-traceability-improvement | 2173e549 | IN-SCOPE |
| sprint-31-server-manager | 3c05f411 | IN-SCOPE |
| sprint-32-mda-model-driven-code-quality | 332585f3 | IN-SCOPE |
| sprint-33-mof-layered-tree | 1a1de78b | IN-SCOPE |
| sprint-34-mda-tree-refine | bbf0ac5f | IN-SCOPE |
| sprint-35-buttons-to-actions-universal-scenarios | deeba407 | IN-SCOPE |
| sprint-36-unify-traceability-m2-uml-model | ce1d8d57 | IN-SCOPE |
| sprint-37-consistency-by-construction | b86b53cc | IN-SCOPE |

## REFUSING (27) — none migrate
All S01-18 (frozen legacy) refuse, plus S19/21/22/23/24/25/26/27/29. Refusal reasons: real gaps and/or
fail-closed needs-review rows (e.g. S19 = the `sticky-drawer-close-button.md` in-flight hand row). These stay
refused — correct — until each refusing item becomes a unit (owner/req backfill), NOT forced.

**Queued (non-blocking):** the `extractIds` structural-rows-only tightening (stashed) — only shrinks the 27
refusals; must be corrected first (current version false-flags a sprint's OWN ids that appear in per-task prose).
