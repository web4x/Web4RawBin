[Back to Sprint 14 Planning](./planning.md)

# T97: Migrate token-<timestamp> User Dirs → UUIDv4

[task:uuid:97b2d4f6-3c8e-4a11-8b57-2d4f6a8b9c97]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — T98 verify)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.12)
`migrateTokenDirs(dataDir)` in `src/ts/server/Migration.ts` (CLI `npm run migrate:userdirs`).
- AC1: each `data/users/token-<ts>/` → COPY to fresh `crypto.randomUUID()` dir (copyDirRecursive; rooms/ + any files/.ssh preserved).
- AC2: in the COPY's `rooms/*/room.json`, rewrite `ownerToken`/`creatorToken`/`creatorId` from the old token → new UUID. (Atomic write; original token dir untouched.)
- AC3/AC5: remap persisted to `data/migration/token-remap.json` (old→new).
- AC4: defensive `rekeyProfileIfPresent` — if profiles.json has a token-* entry, add a UUID-keyed copy + set `redirectTo` on the old (reuses TOKEN_REDIRECT); STRICTLY additive, never mutates a UUID-keyed real profile. No-op on current data (0 token-* profiles). Re: rekeyUser — a COPY preserves the keypair with the files, so encrypted files stay decryptable (no key rotation → no re-encrypt needed); rekeyUser is only the guardrail IF a key is actually regenerated (not here).
- AC5(idempotent)/AC6: already-UUID dirs skipped; remapped tokens with existing target skipped → re-run no-op. Originals left intact (removal = T99 gated).
- Tests: `test/vitest/migration.test.ts` (copy+rewrite, idempotent, defensive-profile no-op). tester runs. v0.5.12.

## Data Findings — on-disk reality (robbin-architect, 2026-05-26, measured)

The `token-<timestamp>` dirs are **self-contained, room-only orphans** — the reference surface is far smaller than feared:
- `data/users/token-*` dirs: **141**.
- With `profile.json`: **0**. With `.ssh/`: **0**. With `rooms/`: **141** (171 rooms total).
- `ownerToken: "token-..."` refs in room.json: **171** — ALL inside those same token-* dirs' own rooms.
- token-* references in `profiles.json`: **0**. In `devices.json`: none found.

**So the ENTIRE reference surface of a token-* dir is: (a) the dir name itself, and (b) the `ownerToken` fields in its own `rooms/*/room.json`.** No profile entry, no SSH identity, no cross-dir reference, no device record. Each dir is fully self-contained → migration is local to each dir, no global reference graph to rewrite.

(Real users are already UUID v4 — 81 of 222 dirs. The 141 token-* dirs appear to be seed/test data with rooms but no profile/keys. Tron's directive: migrate to UUID v4, do NOT delete.)

## Design (robbin-architect)

### Algorithm — `migrateTokenDirs()` (idempotent, copy-then-rename, self-contained)

For each `data/users/token-<ts>/`:
1. Generate a fresh `newUuid = crypto.randomUUID()` (v4).
2. Record the remap `token-<ts> → newUuid` in a remap table (persisted to `data/migration/token-remap.json` for T98 verify + audit).
3. Copy (not move) the dir → `data/users/<newUuid>/` (preserve rooms/, and any files/.ssh if present — none today).
4. In the COPY, rewrite every `rooms/*/room.json` `ownerToken` from `token-<ts>` → `newUuid`. (Also rewrite legacy `creatorId`/`creatorToken` if present, for forward-schema consistency.)
5. profiles.json: NO change required (0 token-* entries). If a future token-* dir DID have a profile, the migration would also rekey that profile entry + add `redirectTo` (see below) — include the branch defensively but it is a no-op on current data.
6. Leave the original `token-<ts>/` dir UNTOUCHED (removal is T99, gated).

### Identity-redirect safety (defensive, for any token-* that IS a live user)
A hard rename would break a device whose localStorage still holds `token-<ts>`. Current data has 0 token-* profiles so no live device is affected. BUT the algorithm MUST be safe if that changes: when a token-* dir has a profile, after rekeying to newUuid, write a redirect stub so the old token resolves forward — reuse the EXISTING `redirectTo` / `TOKEN_REDIRECT` mechanism (same as account consolidation). This guarantees no device is orphaned. For the current 141 profile-less dirs, no redirect is needed.

### Idempotency
A dir already named as a UUID v4 is skipped. The remap table makes re-runs a no-op (already-mapped tokens skipped). Copy targets that already exist are not re-copied.

### Ordering vs T96
T96 (rooms) and T97 (userdirs) are independent on current data (T96's 239 are all under UUID dirs already; T97's token-* rooms are inside token-* dirs). Run order does not matter, but T98 verify must run AFTER both.

## Acceptance Criteria
- [ ] AC1: Every `token-<timestamp>` dir is copied to a fresh UUIDv4 dir (141 → 141 new UUID dirs)
- [ ] AC2: In each copied dir, ALL `rooms/*/room.json` `ownerToken` (+ any `creatorId`/`creatorToken`) rewritten from the old token to the new UUID — zero `token-` strings remain in the copies (171 refs rewritten)
- [ ] AC3: A persisted remap table `data/migration/token-remap.json` (old→new) is produced for T98
- [ ] AC4: profiles.json correctly handled — no-op on current data (0 token-* profiles); defensive rekey+redirect branch present for any future token-* profile
- [ ] AC5: Idempotent — re-run is a no-op; already-UUID dirs untouched
- [ ] AC6: No data loss — copy-then-verify; original token-* dirs left intact (removal deferred to T99, gated)
- [ ] `npm run build` + version bump

## Traceability
- up
  - [requirement:uuid:24b2c3d4-e5f6-4a71-9b82-0c1d2e3f4a02](./requirements.md) — R14.2 migrate user dirs to UUIDv4
  - [Sprint 14 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R14.2 in [requirements.md](./requirements.md)
  - **use case:** migrate-userdirs workflow (architect — diagrams/migration-workflow.puml)
  - **puml:** [diagrams/migration-workflow.puml](./diagrams/migration-workflow.puml) (pending architect)
  - **class/method:** UserKeys/token-dir handling; profiles.json + devices.json token refs; per-user rooms paths

## Task Description
Migrate legacy `token-<timestamp>` user directories to UUIDv4 token directories,
updating ALL references (profiles.json, devices.json, room owner tokens, .ssh paths).
Idempotent; no data loss. Old token is mapped → new UUIDv4 consistently everywhere.
_(Architect designs the reference-rewrite + ordering; req confirms requirement text.)_

## Acceptance Criteria
- [ ] AC1: Every token-<timestamp> dir migrated to a UUIDv4 dir
- [ ] AC2: ALL references updated (profiles, devices, room owners, ssh paths) — no dangling old token
- [ ] AC3: Idempotent — re-run is a no-op; already-UUID tokens untouched
- [ ] AC4: No data loss — copy-then-verify before any removal (removal deferred to T99)
- [ ] AC5: Token remap table logged (old → new) for the verify step
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** None (can run alongside T96)
- **Enables:** T98 (verify), T99 (remove — gated)

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-26: Tron directive — legacy data migration. Quote pending req.

## Subtasks
None (atomic task).

---
*Sprint 14 — Legacy Data Migration*
*Owner: robbin-architect (design), robbin-expert (implement), robbin-tester (verify)*
*Priority: 1 (migrate phase)*
