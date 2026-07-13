<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.7: Uniform ref-guard across editor targeting

[task:uuid:2a873503-e498-454c-af76-8a737a04fe62]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.7 `[requirement:uuid:3618036e-d605-4e30-8651-9a14d0a863f6]`
  - down
    - [UC](./planning.md) `[uc:uuid:8d6743e0-5788-4b57-9467-b5c10cfcad3a]`

## Task Description

Apply a uniform ref-guard so all editor/repo targeting resolves refs through one guarded path (allow-listed, no arbitrary/unsafe refs) — consistent with the RepoRegistry allowlist, applied uniformly across the targeting surface.

## Context

Covers R30.7 (3618036e). Class RbDiffEditor.

## Intention

S30: minted for #126 traceability (R30.7 was requirement-only; pin held the req uuid as workaround).

## Acceptance Criteria

- [ ] (guard) A single shared ref-validation guard (GitApi.guardRef, allowlist ^[A-Za-z0-9._/-]+$) is applied to ALL git endpoints — file, branches, commits, and any future one — NOT duplicated per endpoint.
- [ ] (guard) /api/git/commits (currently 200 on a bad ref) rejects invalid refs with 400, matching /api/git/file — behaviour is uniform across every git endpoint.
- [ ] (by-construction) The guard is a single choke point every git handler routes through, so a NEWLY added git endpoint cannot bypass ref validation (correct-by-construction, not opt-in per endpoint).
- [ ] (security) The guard is belt-and-suspenders OVER execFile (no-shell, already injection-safe) — a hardening layer, and rejects a bad ref BEFORE any git process is invoked (reject-first).
- [ ] (verify) A probe of every git endpoint with a bad ref (traversal, shell metachars, out-of-allowlist) returns 400 (not 200); valid refs still resolve normally.

## Implementation

STOOD UP (planning) — status Planned; chain-build awaits architect. (Was requirement-only; minted for #126 traceability so pin references a real Task.)

## Subtasks

None (atomic task).
