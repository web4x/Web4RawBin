<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.6.7: OOSH-repo targeting via RepoRegistry allowlist

[task:uuid:bc67d092-5d3c-4a42-a784-8fca8a88765c]

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
    - Requirement R30.6.7 `[requirement:uuid:e8d2ac99-a844-4794-9f11-86911bb4e058]`
  - down
    - [UC](./planning.md) `[uc:uuid:522473f3-f7b8-4444-91ec-101fd2bfee77]`

## Task Description

Target the correct OOSH repo in RbDiffEditor via a RepoRegistry key-allowlist: resolve which repo/path the diff operates on from an allow-listed registry key (not arbitrary paths), so the editor safely targets the intended OOSH repository.

## Context

Covers R30.6.7 (e8d2ac99). Class RbDiffEditor (code rb-diff-editor). Usability completion of R30.6 umbrella.

## Intention

S30 R30.6 diff-editor USABILITY completion (R30.6.7): make the editor reachable + repo-safe.

## Acceptance Criteria

- [ ] (security) The client supplies a repo KEY only (e.g. ?repo=oosh); the absolute path lives server-side in a RepoRegistry allowlist. A client-supplied absolute path is NEVER resolved.
- [ ] (registry) RepoRegistry.resolve(key) returns the allowlisted absolute root for the key, else null; RepoRegistry.list() returns [{key,label}] for a repo picker. Allowlist config {rawbin:PROJECT_ROOT, oosh:<abs OOSH root>}.
- [ ] (git) GitApi's hardcoded ROOT is replaced by a per-request RepoRegistry.resolve(req.repo) seam that BOTH OPTS.cwd and safeRelPath read; branches/commits/fileAtRef run with cwd=resolvedRoot. Unknown ?repo -> 400.
- [ ] (security) safePath still applies WITHIN the resolved root (no '..', no leading '/', resolve(root,p).startsWith(root+sep)); read-only across all repos.
- [ ] (wiring) /api/files accepts optional ?repo=<key>; RbFileTree.setRepo(key) sets a repo attr + reloads (loadDir appends ?repo); rb-diff-editor exposes a repo selector from RepoRegistry.list() feeding loadSide/pickFile/pickRef.
- [ ] (back-compat) ?repo absent -> rawbin=PROJECT_ROOT; R30.5 and existing callers are unchanged.

## Implementation

STOOD UP (planning) — status Planned; expert builds impl (per PO). Advance on architect/PO build hop-signal.

## Subtasks

None (atomic task).
