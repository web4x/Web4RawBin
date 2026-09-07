<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.22: Storage/identity RE-KEY — key data/users/ by

[task:uuid:1398b20d-860b-4f34-80d1-73dd8609f1c2]

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

Deliver + verify requirement R40.22 (Storage/identity RE-KEY — key data/users/ by). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.22; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(storageId)** A purpose-built OPAQUE storageId keys data/users/ — non-secret, minted per owner, may appear in paths, and is NEVER accepted for auth. ★ LOAD-BEARING: because it cannot authenticate, leaking it in a path is HARMLESS -> credential/path re-conflation is STRUCTURALLY IMPOSSIBLE, not merely fixed. NOT the Profile uuid (architect measured 0/195 Devices + 0/45 Rooms resolve to a Profile on disk = no universal stable owner-id; token->profile is runtime-only).
- [ ] **(bridge)** BRIDGE, not a hard-rename, during transition: BOTH the old-token path AND the new-storageId path resolve, then converge, then the old drops = STORAGE dual-validity. Makes the migration RECOVERABLE, not atomic-or-broken.
- [ ] **(migration)** Migration treatment: dry-run WITH counts first; rewrite the 167 unitLinks; per-file content-hash before==after (zero content loss); idempotent (re-run = no-op); half-run-recoverable. Same remap rigor as R27.2.
- [ ] **(anti-regrowth)** Kill mint-regrowth at ALL THREE sites — anchored by SYMBOL (line numbers DRIFT: the 2 server calls already moved +2 to 1998/2011 after an authz re-point above them; anchor on the symbol, never the line): (1) createUserHome (UserKeys.ts), (2) roomFsLink (file-unit.ts), (3) the server upload mint = createWebItemUnit + createFileUnit (server.ts, 2 calls) — or the migration REFILLS behind us with fresh token-keyed homes.
- [ ] **(gate)** ★ THE GATE (ci:gates, beside the field pii-guard): NO token-keyed path remains AND NO path string contains a credential-shaped segment; every unitLink resolves; per-file hashes match; idempotent. STUB-MUST-FAIL BOTH ways (plant a credential-shaped path segment -> RED; weaken the guard -> RED).
- [ ] **(protects-tron)** ★★ THE ACCEPTANCE CRITERION THAT PROTECTS TRON: storage is keyed by storageId BEFORE any rotation, and AFTER the re-key a token rotation changes ONLY auth and touches ZERO path/file bytes — PROVEN by a post-re-key rotation test (rotate a token -> assert 0 path bytes changed, home still resolves).
- [ ] **(sequencing)** SEQUENCING: the 116-invalidation (auth-only, touches no storage) runs FIRST; the FRESH expert builds this gated re-key migration AFTER it, with the architect backstopping. Design landed (03287719c) — no longer design-blocked, but gated on the migration ACs above.

## Subtasks
