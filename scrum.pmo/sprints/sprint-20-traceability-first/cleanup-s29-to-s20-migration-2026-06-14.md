# Cleanup Unit — S29→S20 Refactor (Migration Map)

**Planner, 2026-06-14, Tron/PO-directed.** Killed the hallucinated "Sprint 29" at the root (not just the pin label). **Broken-ref count after = 0.**

## Root cause
Singleton pin showed `sprintName='Sprint 29'` but BUG8's real graph parent is the Sprint 20 unit `64af2638` ("Sprint 20 — Radical Forward Planning (Traceability-First)"). "Sprint 29" was a hallucinated fork of Sprint 20's Radical-Forward-Planning theme. Two fiction Sprint nodes + a fiction dir + scattered refs existed.

## Canonical decision
**Canonical Sprint 20 dir = `sprint-20-traceability-first`.** Rationale: ALL R20.x requirement `sourceFile`s already point here (highest fan-out — moving it would break the most refs). The other two dirs were reconciled INTO it.

## Backup (pre-delete, PO mandate)
`.cleanup-backups/pre-s29-to-s20-20260614T211015.tar.gz` (5.5M — scrum.pmo/sprints + affected scenario node). All moves are `git mv` (history-preserving, reversible).

## Migration map

### Scenario units
| UUID | Was | Now |
|------|-----|-----|
| `4e728c81` | Sprint "Sprint 29 — Radical Forward Planning (WIP=1)" | `[MERGED→Sprint20]`, `supersededBy: 64af2638`, sourceFile→wip1-method doc |
| `6dc43057` | Sprint "Sprint 29 — Drawer Detail v0.6.23" | `[MERGED→Sprint20]`, `supersededBy: 64af2638` |
| `b7894ac3` | Req **R20.15** "/trace shows current task(s)" (COLLISION with DRY-unify R20.15 d5734c9b) | renumbered **R20.17** |
| `0171efa2` | Req R20.12, text said "Sprint 29" | text → "Sprint 20" |
| `64af2638`, `767dd241`, `18ee26a2`, `fe8c43a5`, `b1c93799`, `56cc23b5` | path `sprint-20-forward-planning` | → `sprint-20-traceability-first` |

### Directories
| Was | Action |
|-----|--------|
| `sprint-29-radical-forward-planning/bug8-trace/` | → `sprint-20-traceability-first/bug8-trace/` (git mv) |
| `sprint-29-radical-forward-planning/planning.md` | → `sprint-20-traceability-first/wip1-method-merged-from-fiction-sprint29.md` (WIP=1 method preserved, rebannered) |
| `sprint-29-radical-forward-planning/` | removed (emptied) |
| `sprint-20-forward-planning/{planning.md, diagrams/, planner-count-reconcile…}` | → `sprint-20-traceability-first/` (git mv) |
| `sprint-20-forward-planning/` | removed (emptied) |

### Docs / refs updated
- `sprints.overview.md`: fiction row 29 RETIRED, merged into row 20 (now "Radical Forward Planning (Traceability-First) · WIP=1 · ACTIVE", links → traceability-first/planning.md).
- `task-r20.15-…md`: BUG9 cross-ref path `./../sprint-29…/bug8-trace` → `./bug8-trace`.
- `task-bug8-collection-node-detail.md`: "(Sprint 29, WIP=1)" → "(Sprint 20 — Radical Forward Planning, WIP=1)"; PUML ref → traceability-first/diagrams.
- `wip1-method-…md`: merged banner + title/sprint relabel Sprint 29 → Sprint 20.
- The live CurrentSprint singleton pin: re-setChain BUG8 with `sprintName='Sprint 20 — Radical Forward Planning (Traceability-First)'`.

## Audit (verify-don't-relay)
- `grep sprint-29-radical-forward-planning` → **0**
- `grep sprint-20-forward-planning` → **0**
- Both old dirs gone; only `sprint-20-traceability-first` remains.
- R20.x altId dupes → **0** (R20.15 d5734c9b, R20.16 a43dbb8d, R20.17 b7894ac3 each unique). Note: `a43dbb8d` was already R20.16 (NOT a R20.15 dup — only `b7894ac3` collided).
- All 10 edited scenario nodes valid JSON; all moved targets exist; bug8 PUML ref resolves.
- Remaining "Sprint 29" strings are intentional only: superseded-node markers + the merged-banner / migration history.

**Result: Sprint 29 fiction eliminated at the root. Broken-ref = 0.**
