# Board-Hygiene Backlog (robbin-planner)

*Tracked, non-blocking hygiene items — swept in a later hygiene pass, NOT during active sprint work. PO-logged so they aren't lost.*

| # | Item | Source | Status | Notes |
|---|------|--------|--------|-------|
| BH-1 | **S27 requirements.md is stale** (mismatched on `generate-sprint-md --check`) | Surfaced 2026-07-18 during the S30 task-order reorder (generator spot-check) | BACKLOG (PO-logged) | Pre-existing, NOT caused by the S30 work. S27, does NOT block S30. Fix = regenerate S27 requirements.md from its Requirement units (`generate-sprint-md <S27-uuid> c1c63a2e-...`), verify byte-match, commit. Sweep in a later hygiene pass. |
| BH-2 | **Task-Ordering generator emit needs a Test** (chain-to-Test) | 2026-07-18, the A+C task-order header (4-line additive emit in `generate-sprint-md.ts`) | BACKLOG (PO-logged, LOW pri) | Folded under R30.18 SprintViewGenerator impl 72c57f72 (marker placed). Test to be wired with tester (robbinTeam2:0.5) AFTER the R30.35/R30.36 gates (which own the tester now). Tracked in T30.18. |
