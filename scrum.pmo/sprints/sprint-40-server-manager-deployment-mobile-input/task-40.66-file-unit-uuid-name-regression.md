<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.66: PROD regression — File units carry UUIDs where names belong + lost ownerIor (works on older TEST, broken on PROD)

[task:uuid:b981f1c9-2e08-44f7-a1fa-566c0a2408a0]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

TRON MAJOR REGRESSION (relayed via PO 2026-08-29). SYMPTOM on PROD (prod.wo-da.de:4444), from Tron's File-unit JSON: ownerIor = NULL; name = a raw UUID (b9fa43a2-ea98-...) instead of a filename; location = the SAME raw uuid; sourceFile = ior:file:b9fa43a2-... — i.e. File units carry UUIDs where NAMES belong and have LOST their owner. TWO-SERVER EVIDENCE (a bisect handed to us): the SAME views render CORRECTLY on TEST (test.wo-da.de:4444, an OLDER version) and are BROKEN on PROD. ★ ROOT NOT PRE-JUDGED — three distinct possibilities, three different fixes: (a) CODE (render/resolve path), (b) DATA (File units written wrong at mint time), (c) GENERATION (the minter stopped resolving names). Architect is diagnosing by DIFFING the same unit from both servers; the root + the specific fix are added to this task when the architect reports. ★ WHY IT MATTERS BEYOND DISPLAY: a File unit whose NAME IS ITS UUID is unreadable to Tron on his own board — and IF the defect is in the DATA (not the render), then EVERY File unit written since the regression carries it, so a DATA REPAIR is needed ON TOP OF a code fix. ★ OPEN QUESTION FOR ARCHITECT (determines scope): is this RENDER-ONLY or PERSISTED? Render-only => code fix; persisted => code fix + data repair of all affected units. ★ RANKING (Tron/PO): MAJOR REGRESSION — above the queued hygiene work (42-AC untasked sweep, backfills, Task 40.62 diagram half) but BELOW the live RCE (remote unauthenticated hole, outranks everything).

## Context

Covers R40.69 (23e77b77, File units carry filenames not UUIDs — Tron prod regression). Architect diagnoses root (code/data/generation) by diffing the same File unit from prod vs test; useCases + chain wired at diagnosis. Not to be built until root is known — task it as symptom+evidence per Tron.

## Intention

Track Tron's PROD File-unit regression (uuid-where-name-belongs + null ownerIor, works-on-older-TEST) as a MAJOR REGRESSION — symptom + two-server bisect evidence now; root + fix added on architect's diff-diagnosis. Covering task (#126); req formalizes the Requirement.

## Acceptance Criteria

- [ ] A File unit's name renders/resolves to its FILENAME (not a raw UUID), its location is the real path (not the uuid), sourceFile is the real file ref (not ior:file:<uuid>), and ownerIor is PRESENT — matching the working TEST render, on PROD.
- [ ] ROOT DETERMINED (architect diff prod-vs-test): code vs DATA vs generation is identified and recorded here before the fix; RENDER-ONLY vs PERSISTED is answered (persisted => a data repair of all File units written since the regression is required on top of the code fix).
- [ ] If PERSISTED: the affected File units (uuid-as-name / null-owner) are repaired via a gated, counted, idempotent data fix (dry-run + before/after counts, no unit lost); none left uuid-named.
- [ ] GATE: the same File unit fetched from PROD renders identically to TEST (name=filename, owner present) — a prod unit still showing uuid-as-name or null ownerIor => RED. Regression-guard so it cannot recur.

## Subtasks

None (atomic task; architect may split at diagnosis).
