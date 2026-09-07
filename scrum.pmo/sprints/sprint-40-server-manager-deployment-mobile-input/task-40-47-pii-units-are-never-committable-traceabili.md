<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.47: PII units are never committable + traceabili

[task:uuid:681c6659-6328-4d3c-83f8-d820acf41548]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.47 (PII units are never committable + traceabili). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.47; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(privacy/by-construction)** PII/runtime classes (Profile, Message, Email, Phone, Room, Device) are stored OUTSIDE scenario/index (data/ or equivalent) AND explicitly gitignored, so `git add scenario/` or `git add -A` CANNOT stage any PII unit. KNOWN-excluded, not accidentally-retained.
- [ ] **(privacy/stub-must-fail)** A seeded PII unit that IS trackable under scenario/index (stageable by git add -A, or not gitignored) => RED. Privacy fails LOUD, never silently retained.
- [ ] **(durability/by-construction)** Traceability classes (ChangeRequest, Bug, Task, Test, Requirement, Implementation, Method, UseCase, Class, Sprint) minted by the app are durable-in-repo BY CONSTRUCTION — emitted through a git-tracked path or committed by the minting transaction, NEVER 'if a human notices'.
- [ ] **(durability/stub-must-fail)** A seeded app-minted traceability unit (e.g. a CR minted on decline) that does NOT reach git => RED.
- [ ] **(migration)** The 3 existing untracked PII units (Profile 76f2cda7 + Message 2e157bb2 + Message c1b3736e) are relocated out of scenario/index + gitignored, NEVER committed; any PII already in git history is FLAGGED for a separate scrub (dry-run + count, no PII pushed).
- [ ] **(by-construction/single-source)** The class->bucket mapping (durable-traceability | pii-excluded) is ONE declared registry (same shape as R40.39 type-strategy registry), NOT scattered hardcoded lists; a class with units but no declared bucket => RED (fail-closed — a new class cannot silently fall into the wrong bucket).

## Subtasks
