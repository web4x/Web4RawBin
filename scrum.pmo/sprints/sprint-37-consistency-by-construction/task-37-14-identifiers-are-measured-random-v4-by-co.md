<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.14: Identifiers are measured-random v4 by co

[task:uuid:7737000b-8c01-4f93-805f-ed046e23dbf9]

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

Deliver + verify requirement R37.14 (Identifiers are measured-random v4 by co). Retroactive task unit minted scenario-first from the existing CURRENT-sprint requirement (#126 gap: active S37 work untracked). Covers R37.14; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(functional)** Every NEW unit (any ior:class:*) gets an INDEPENDENT random v4 uuid (uuidgen/uuid4) — NEVER a parent-prefix + mnemonic suffix (no <Method-8char>+a1b2/b1c2/c1d2), never hand-typed / sequential / structured. Minting reads the uuid from uuidgen, never constructs it.
- [ ] **(gate)** A fabricated-identifier guard forbids: a child uuid SHARING its parent's 8-char prefix (manufactured-collision detector), a non-v4 uuid (bad version/variant nibble), a malformed/non-hex id, an all-zero tail, and set-wise inter-id nibble-delta regularity (co-minted-set fabrication). It matches RESOLVED markers + on-disk unit uuids, NOT generator source/templates. STUB-MUST-FAIL: a planted parent-prefixed child or non-v4 id -> RED; weaken/remove the guard -> suite RED (else it certifies nothing).
- [ ] **(gate)** resolvePrefix is FAIL-CLOSED on an ambiguous 8-char prefix (>1 match -> REFUSE with a named reason), NEVER silent first-match — closing the Test-MOVE wrong-owner-credit path (per resolveprefix-fail-closed-guard.md). Generator (no manufactured collisions) + resolver (no first-match) together, not either alone.
- [ ] **(functional)** RETRO: the existing -a1b2 Impls + the 35 non-v4 S18 Requirement uuids are re-minted to independent v4; a uuid change = REF-REWRITE (R27.2 remap shape: labelled snapshot -> dry-run + count -> rewrite every referrer -> verify -> conservation-invariant unit-count unchanged before==after). MARKERS-FIRST (2 malformed markers ViewBus e5145c01 / server.ts:1942 dnd01001 before non-v4 unit-uuids, per architect priority — malformed markers are silently-broken chains).
- [ ] **(functional)** FULL uuids in EVERY ref, READ + WRITE (no 8-char prefixes in markers/refs/ops). Codified as an AC because the retro-audit came back CLEAN ONLY because every ref was a full uuid — the rule is load-bearing (a prefix ref would have resolved to the wrong manufactured-collision twin).
- [ ] **(functional)** SCOPE (named, no-silent-caps) from the read-only scan: 2 malformed MARKERS + 35 non-v4 S18 Requirement uuids (sequential, self-consistent) + the -a1b2 Impl cluster. EXCLUDE ~10 marker-tooling regex/template false-positives + the short markerPending markers (flip on their C4 mint) — the excluded set is LISTED, never silently dropped; dropping an item from the exclude-list surfaces it back into the guard.
- [ ] **(gate)** TEST/BITE (distinct-intent): plant a child uuid sharing its parent's 8-char prefix -> guard RED; plant a non-v4 / malformed / all-zero-tail id -> RED; resolvePrefix on an ambiguous 8-char -> REFUSE (fail-closed) not first-match; weaken any guard -> suite RED. Verify Impl.tests[] on disk before flip.
- [ ] **(functional)** [TRON-SCHEDULE, do-NOT-start — captured 2026-08-18 after the THIRD prefix-collision phantom in one day: 3542dcb3 (PO mis-cite) / fa8fffc8-8e2e (R19.18+R19.8.A tasks[]) / a778793d-0f8e (T37.26 sprintDisplayName marker @sprint-label.ts:34)]. Phantom markers exist because markers are HAND-TYPABLE -> make them IMPOSSIBLE, not merely forbidden (PO framing): (a) MINT-THEN-STAMP ONLY — a source [impl:uuid]/[test:uuid]/[uc:uuid] marker may be written ONLY by the tool, from a REAL minted unit's FULL uuid, FAIL-CLOSED if the uuid does not resolve to an existing unit of the correct KIND (an impl-marker MUST resolve to an Implementation), full uuid NEVER an 8-char prefix. (b) STRICT-AUDIT BACKSTOP — a sweep/gate over ALL shipped source markers turns any DANGLING (uuid->no unit) OR PREFIX-SHARING (uuid shares a sibling/parent 8-char prefix) OR WRONG-KIND marker RED, stub-must-fail. Converts phantom-hunting from forbidden to impossible-by-construction. MEASURE FIRST (the open question): how many OTHER shipped deliverables carry phantom / prefix-colliding markers — three in one day is a pattern, not luck. Extends AC-manufactured-collision-guard from mint-time UNIT uuids to shipped SOURCE markers. crossRef R40.38 orphan-marker-lint + R40.43 trace:audit-orphan.

## Subtasks
