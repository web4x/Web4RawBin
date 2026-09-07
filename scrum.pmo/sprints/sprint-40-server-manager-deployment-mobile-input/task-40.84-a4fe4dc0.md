<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.84: Adding a child updates that node IN PLACE — tree must not collapse/rebuild (MVC, expanded state survives)

[task:uuid:a4fe4dc0-78d8-4a2b-b9a6-952fbec8df51]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

STOOD UP QA Review 2026-09-05 (PO GO). CLOSED e2e (PO): fix v0.8.178 95a38b0c7 (both causes), tester DET-3x 3/3 GREEN, chain-complete-to-Test BOTH-DIR (Test 248fc071 <-> Impl 8693dc2b reDeriveDirectChildren, tests[] wired 1ef0eaf06), architect backstop PASS. QA-Review CEILING — Done pending TRON acceptance. UC full-uuid 973f66af-e615-43dd-ab5e-a44786298ded resolved from R40.84.useCases[] on disk (NOT fabricated). ACs mirrored from the req (no-drift). Minted LOCAL (push-freeze), path-limited. req reverse-wires R40.84.tasks[]. 0 Done till Tron.

## Task Description

CLOSED e2e (PO): fix v0.8.178 95a38b0c7 (both causes), tester DET-3x 3/3 GREEN, chain-complete-to-Test BOTH-DIR (Test 248fc071 <-> Impl 8693dc2b reDeriveDirectChildren, tests[] wired 1ef0eaf06), architect backstop PASS. QA-Review CEILING — Done pending TRON acceptance. Covers R40.84 (6149c2d3), UC 973f66af. Minted 2026-09-05 (PO GO after the R40.84-firefight coverage gap; planner was skipped, gap now closed). verify-owner-first: full-index scan confirmed NO prior covering task (no double-mint).

## Context

CLOSED e2e (PO): fix v0.8.178 95a38b0c7 (both causes), tester DET-3x 3/3 GREEN, chain-complete-to-Test BOTH-DIR (Test 248fc071 <-> Impl 8693dc2b reDeriveDirectChildren, tests[] wired 1ef0eaf06), architect backstop PASS. QA-Review CEILING — Done pending TRON acceptance.

## Intention

Board-track R40.84 at its honest status; declare the ONE canonical planning unit for this requirement (traceability = DRY enforcement).

## Acceptance Criteria

- [ ] **(by-construction/MVC-ROOT)** The unit IS the MVC model: adding a child updates THAT node children IN PLACE (the controller mutates the model node, the view re-renders JUST that node via the ONE VIEW BUS). The tree does NOT collapse and does NOT rebuild wholesale. A full-tree rebuild OR collapse on a single add => RED.
- [ ] **(render/state)** Any EXPANDED state survives the add — the tree stays exactly where it was (scroll + expansion preserved). Collapsed-or-reset-after-add => RED.
- [ ] **(acceptance/USER-TERMS)** Tron in user terms: when I add a folder, the tree stays exactly where it was and ONLY the folder I added into changes. WE verify @390 member-session (the add path, no owner rights); Tron ACCEPTS delivered verified work (not Tron-verified).
- [ ] **(by-construction/ONE-VIEW-BUS)** The add path emits a TARGETED node update (ViewBus.notify for the affected node only, R37.12 ONE VIEW BUS), NEVER a full-tree re-render or reload. A wholesale re-render / reload on a single add => RED. (Same live-MVC law as R37.12: mutation -> in-place node re-render, not a rebuild.)
- [ ] **(stub-must-fail)** Seed the exact 0.8.175 defect — an add-child that triggers a full tree COLLAPSE + wholesale RERENDER (losing expanded state) => RED. A suite green on a collapse-on-add is inadmissible.

## Subtasks

None (atomic task).
