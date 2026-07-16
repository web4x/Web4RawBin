<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 30.24: 3-way diff is URL-addressable (deep-linkable + shareable)

[task:uuid:d35812b6-aeed-4dff-a426-02aeaf5b2577]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 30 Planning](./planning.md)
    - Requirement R30.24 `[requirement:uuid:9a2c9c46-4def-4273-b896-60ad17b79a6a]`
  - crossRef
    - R30.6.7 RepoRegistry allowlist (repo KEY resolution)
  - down
    - [UC diffEditor.openFromUrl](./planning.md) `[uc:uuid:cc47d004-47a6-4ac9-b18d-fe95f3b69b25]` + [UC diffEditor.shareLink](./planning.md) `[uc:uuid:8e88026a-f2bc-4a7a-bd4b-c3077a5b13ad]`

## Task Description

The 3-way diff editor is deep-linkable + shareable: /edit/<path>?repo=<key>&left=<ref>&right=<ref>&3way=1 opens rb-diff-editor to that EXACT diff (repo+path+left+right+3way), and a copy-link affordance generates the shareable URL from the current diff state. repo is a KEY resolved server-side via R30.6.7 RepoRegistry allowlist (no client-supplied absolute path honored).

## Context

Covers R30.24 (9a2c9c46) → 2 UCs: diffEditor.openFromUrl (cc47d004) + diffEditor.shareLink (8e88026a). Class RbDiffEditor + edit.ts param-read on load. Security: ?repo= is a KEY via R30.6.7 (unknown/absent → fallback rawbin, no path abuse). ⚠ BACKFILL: task unit minted post-hoc to repair the PO-acknowledged pipeline-skip (#126 gap). Status IN PROGRESS — architect designing the chain (openFromUrl + shareLink); I hold Task-side + advance on gates.

## Intention

S30 diff/merge editor (R30.24, IMG_4522) — make a diff a clickable, shareable link that round-trips to the identical view.

## Acceptance Criteria

- [ ] (deep-link) Loading /edit/<path>?repo=<key>&left=<ref>&right=<ref>&3way=1 opens rb-diff-editor to that EXACT diff, restoring the state — edit.ts reads the params on load and initializes the diff
- [ ] (deep-link) The URL carries repo (KEY, resolved via R30.6.7 RepoRegistry allowlist), path, left ref, right ref, optional 3way flag; no client-supplied absolute path is honored
- [ ] (share) A copy-link / share affordance generates the shareable URL from the CURRENT diff state (repo+path+left+right+3way) and copies it to the clipboard
- [ ] (share) Open→share→open round-trips: the generated link, when opened, restores the identical diff view
- [ ] (security) The ?repo= param is a KEY resolved server-side (R30.6.7); an unknown/absent key falls back to the diff's existing repo-targeting default (rawbin), no path abuse
- [ ] (verify) IMG_4522 becomes a clickable link (e.g. /edit/otmux?repo=oosh&left=516ebb3&right=dev&3way=1) that opens the exact diff; DET-3x + Tron visual; client-facing → version-bump

## Implementation

IN PROGRESS — architect designing (per PO). Two UCs: openFromUrl (edit.ts reads /edit/<path>?repo&left&right&3way on load → initializes diff) + shareLink (copy-link affordance builds URL from current diff state → clipboard). repo KEY resolved server-side via R30.6.7 RepoRegistry allowlist. Awaiting architect derive → expert build → tester DET-3x (open→share→open round-trip). Planner advances status on gate.

## Subtasks

None (atomic task).
