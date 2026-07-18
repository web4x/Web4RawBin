# Sprint 30 — Task-Order Audit & Proposal (robbin-planner, 2026-07-18)

*Tron flagged: the S30 task order reads messy. This is the root-cause + a proposal for Tron to approve. NOTHING reordered yet.*

## Measured facts
- `sprint.tasks[]` = **39 tasks**, stored in **creation order** (each task appended at mint-time).
- Array-order as a number sequence: `1 2 3 4 5 6.1..6.7 9 7 10..17 23 24 19 25 27 26 34 21 22 30 18 33 20 28 29 35 36`.
- **6 numeric inversions** (adjacent pairs where the array goes high→low): 9>7, 24>19, 27>26, 34>21, 30>18, 33>20.
- Creation waves (createdAt): 07-12 ×1, 07-13 ×13, 07-14 ×8, 07-16 ×3, **07-17 ×12**, 07-18 ×2.
- Status: 35 Done / 2 QA-Review (T30.9 pos12, T30.14 pos18) / 2 In-Progress (T30.35/36 pos37-38).
- Numeric gaps: **T30.31 absent** (backlog, no task by design) · **T30.32 absent** (superseded → R30.34, no task by design).

## WHY it became messy — the specific causes
1. **`tasks[]` is append-on-creation.** Array position = when a task was minted, not its number. Whenever a low number is minted late, it lands at the end → an inversion. This is the ROOT mechanism; everything below is a source of late-minting.
2. **The #126 backfill wave (07-17, biggest source).** T30.18/20/21/22/28/30/33 are LOW numbers but were created LATE (gap-audit backfills of already-shipped reqs), so they appended AFTER T30.34 → the big tail inversion (`34 21 22 30 18 33 20 28 29`). 8 tasks, all out of place.
3. **Req split / renumber (R30.25-B).** BUG-1 became R30.26 AFTER R30.27 (line-align) was already tasked → T30.27 sits before T30.26 (27>26).
4. **Re-opens don't move position.** T30.14 (clean-release) and T30.34 (layout revert) changed status (Done→QA/re-gate) but kept their creation-position, so status no longer tracks position.
5. **Same-day out-of-order batches.** 07-16 added 23, 24, then 19 (24>19); early on, 7 was minted after 9 (9>7).
6. **Status isn't grouped.** The 4 not-Done tasks (T30.9, T30.14, T30.35, T30.36) are scattered across the array, so "what's still open" is not visible at a glance.
7. **Mixed granularity + gaps.** Sub-tasks T30.6.1–6.7 (umbrella children) interleave with flat tasks; missing 31/32 look like holes but are intentional (backlog / superseded).

**One-line WHY:** the array preserves *mint order*, and S30 minted many low-numbered tasks late (a large #126 backfill wave + a req-split + re-opens + late UX adds), so mint-order diverged sharply from the numeric order a reader expects.

## Proposal (Tron picks — I execute only on approval)
**RECOMMENDED — Option A: re-order `tasks[]` to numeric order** (`30.1, 30.2, … 30.6.1–6.7, … 30.36`).
- SAFE: reordering the array changes NO task identity, uuid, or ref; the generator re-emits planning.md in the new order; `--check` byte-match holds. Creation history stays in git + each task's `createdAt`.
- Result: the board reads `T30.1 → T30.36` in sequence, as a human expects.

**SUPPLEMENT — Option C: an ordering-rationale header** (this doc, linked from planning.md) that explains the intentional gaps (T30.31 backlog, T30.32 superseded→R30.34) and the sub-numbering (T30.6.x umbrella), so the "holes" aren't read as errors.

**OPTIONAL — status-first view:** a generator enhancement to list not-Done tasks first (or a status column) so open work is visible at a glance. Follow-up, not required for the reorder.

**NOT RECOMMENDED — Option D: renumber tasks.** HIGH RISK — breaks every cross-reference, git history, marker, and dual-link. The numbers are identifiers, not positions; don't churn them.

**My recommendation: A + C** (numeric reorder + rationale header). Low-risk, fully reversible, makes the board legible without touching any task's identity. Await Tron's approval before I reorder.
