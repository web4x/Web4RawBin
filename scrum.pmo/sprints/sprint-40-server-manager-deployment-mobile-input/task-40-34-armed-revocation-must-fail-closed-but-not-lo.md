<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.34: Armed revocation must fail-CLOSED-but-not-lo

[task:uuid:9b04c9e2-1a98-4f9f-8efa-e477e6f18ba8]

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

Deliver + verify requirement R40.34 (Armed revocation must fail-CLOSED-but-not-lo). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.34; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(security)** An ARMED revocation with an absent/short list must fail-CLOSED (LOUD AND CLOSED), NEVER silently fail-OPEN (authenticate everyone incl the 116). A loud LOG is NOT a control. GOVERNING CONSTRAINT: the refusal must NEVER lock Tron out — operator-fixable in seconds, never refuse-to-boot (an unattended-restart outage).
- [ ] **(by-construction)** LAYER 1 (primary — makes the state unreachable): the revoked list holds SALTED HASHES (sha256 of a 128-bit UUID token + fixed committed salt = NOT a credential, safe to git-track) and is committed ATOMICALLY with REVOKED_ARMED. Armed + its list ship TOGETHER and cannot diverge across deploys (also fixes the fresh-deploy-durability gap). NO token values are stored — only irreversible hashes. ★ PATH-UNIFY (architect catch, measured): the SERVER LOAD PATH must == the GATED list path. Measured mismatch = server loads data/revoked-tokens.json (ABSENT) while the gate checks revoked-token-hashes.json (ROOT, present) => a CI gate that certifies a file the server never loads is INERT (armed-but-inert even when green). L1 is not complete until the paths are UNIFIED (server loads the tracked list, or a deterministic build-copy of it). Same 'gate proves X / runtime uses Y' disease as R40.32/R37.17.
- [ ] **(gate)** LAYER 2 (CI gate check:revoked-tokens, in ci:gates): assert REVOKED_ARMED <=> (list PRESENT AND count==EXPECTED_REVOKED_COUNT AND disjoint from enrolled-79/Tron/File-owners). Armed-but-empty -> RED at commit => the dishonest state CANNOT be committed. Layer-1 tracking makes the list CI-visible (today it is gitignored-runtime so CI is blind — that is the hole). ★ The assertion MUST be against the UNIFIED (server-loaded) path — asserting a file the server never loads certifies nothing.
- [ ] **(security)** LAYER 3 (runtime belt for disk-corruption / list-lost-at-boot despite committed): ARMED and loaded != EXPECTED => IDENTIFY REFUSES to serve auth with an OPERATOR-FACING error naming the fix (run gen:revoked-tokens --write), health reports RED, but the server STAYS UP (health/status readable). = fail-CLOSED (nobody auths, incl the 116) + LOUD (visible, not a buried log) + NOT-a-lockout (a boot-time state, fix in seconds, auth resumes the instant the list materializes). NEVER refuse-to-boot.
- [ ] **(gate)** Each layer PROVEN non-vacuous (stub-must-fail): plant armed-but-empty -> layer-2 CI goes RED AND layer-3 IDENTIFY REFUSES (never fail-open); a valid armed+materialized list -> auth works AND Tron + enrolled-79 are NOT over-rejected (F3). A guard that cannot fail proves nothing.
- [ ] **(by-construction)** NET: loud + closed, no silent fail-open, no permanent lockout. The 3 layers are DEFENSE-IN-DEPTH — the dishonest armed-but-empty state becomes UNREACHABLE by construction (committed-coupled + CI-forbidden + runtime-fail-closed), not merely detected after the fact.

## Subtasks
