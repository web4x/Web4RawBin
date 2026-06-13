# Standard: Single-Owner Task Unit Creation (ends dup-collisions)

**Recorded:** 2026-06-13 (PO directive via robbin-po, robbinTeam2:0.0)
**Owner:** robbin-planner (sole task-unit creator) + robbin-architect (chain enrichment only)

## Rule

**The planner is the SOLE creator of Task scenario units.** For any "stand up Rxx" directive:

| Role | MAY do | MUST NOT do |
|------|--------|-------------|
| **robbin-planner** | Create the `ior:class:Task` scenario unit: `uuid` (real v4), `ownerIor` (Sprint), `coveredRequirements[]`, `status`/`statusChecklist`, `joint[]`. Wire the reciprocal `Requirement.tasks[]`. | — |
| **robbin-architect** | ADD `useCases[]` + the downstream chain (UseCase/Class/Method units) to the planner's EXISTING Task unit. Refine its design content. | **Create a parallel/duplicate Task unit** for a requirement the planner owns. |

## Why

R19.86–R19.93 produced repeated duplicate-collisions: planner and architect each stood up a Task unit for the same requirement, forcing reconcile-by-#20 every time (adopt one, delete the other, re-wire). Wasted churn. Single-owner creation removes the race entirely: one Task unit per requirement, created by the planner; the architect enriches it in place.

## Workflow

1. PO directs "stand up Rxx" → **planner only**.
2. Planner creates the Task unit + wires `Requirement.tasks[]` + commits.
3. Planner hands the task IOR to PO and (implicitly) to architect.
4. Architect opens the planner's Task unit and ADDS `useCases[]` + chain — never a new task file.
5. If architect needs a different requirement split, that's a req-eng action (new Requirement unit), not a new Task unit.

## Grandfathered

Architect-created Task units already canonical+wired before this rule (R19.86 bec78a23, R19.88 67abd046, R19.88.A c524c8a0, R19.90 b8da64a1, R19.92 4aa7e19d, R19.93 5ab2d3b9) stay as-is — the rule is forward-looking. From 2026-06-13, planner is sole creator.

## Composes with

- Reconcile-by-#20 (planner boot.md) now rarely fires — it remains the fallback if a stray dup ever appears.
- 4-role-per-task (req → architect → expert → tester) is unchanged; only *who authors the Task unit file* is fixed to the planner.
