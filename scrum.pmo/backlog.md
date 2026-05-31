# RawBin Project Backlog

Untriaged items awaiting Tron prioritization. **No sprint, no T-number** until
Tron triages an item into a feature sprint (then it gets the next sequential
T-number). Items here are NOT in any sprint's scope.

---

## Untriaged

- **B4 — Connection-Failed page: add Reload button**
  [requirement:uuid:c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e90]
  > TRON DIRECTIVE: "add a reload button to page Connection Failed / Could not connect to server. Please refresh."

  The Connection-Failed error page (rendered in `app.ts` catch block: `<div class="error"><h2>Connection Failed</h2><p>Could not connect to server. Please refresh.</p></div>`) must have a `[Reload]` button that calls `location.reload()`. Plain text "Please refresh" is not actionable on mobile — user needs a tappable button.

  **Sprint:** TBD (planner to triage)
  **Touches:** app.ts error HTML (~line 81), possibly edit.ts equivalent

- **B3 — Profile gate: Upload vCard for fast onboarding (button + native drag-and-drop)**
  [requirement:uuid:a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d]
  > TRON DIRECTIVE: "on first time connect we have to fill out profile. add a upload vcard button at the top to speed up onboarding and initialize from the card. can be dropped natively from os drag and drop eg on iphone but also android and windows."

  Two input methods:
  1. **Upload button** at the TOP of the first-time-connect profile gate — user selects a .vcf file
  2. **Native OS drag-and-drop** — user drags a .vcf from the OS (iOS, Android, Windows) onto the form

  Both pre-fill profile fields from the vCard: FN→name, TEL→phone, URL→url, PHOTO→avatar.

  **Multi-platform AC (from Tron):** must work on iOS, Android, AND Windows native drag-and-drop.

  **Sprint:** TBD (planner to triage)
  **Touches:** ProfileEditor.ts (gate mode), vCard V3.0 parsing (new — currently only exports, never imports), HTML5 drag-and-drop API, mobile share-sheet / file-drop handling

### Triaged out
- **B2 — E2E test runs flood `data/` with orphan users/rooms** — **PROMOTED 2026-05-29**
  to [T118](./sprints/sprint-13-stability/task-118-e2e-cleanup.md) in Sprint 13
  (Stability). Tron triage via PO: confirmed as a real test-infra hygiene fix,
  E2E cousin of T100. Original analysis preserved below.

### B2 — E2E test runs flood `data/` with orphan users/rooms (no cleanup of users) [HISTORICAL — see T118]

**Filed:** 2026-05-29 · **Reporter:** Tron via robbin-planner
**Type:** test-infra hygiene / data leakage

**Evidence (measured 2026-05-29):**
- `data/users/` contains **263 user dirs**. Date distribution (mtime on profile.json):
  115 created **2026-05-26** (single day — coincides with heavy S13/S14 test runs),
  3 on 05-27, 2 on 05-25, 1 on 05-23.
- Sampled profile names include `E2E-Room-Test`, `E2E-Profile`, `RoomE2E`, `SshE2E`,
  `NameE2E`, `DeleteE2E`, `VisibleE2E`, `BadgeOwner`, `OrderUser` — all E2E spec names.
- Each `ensureLobby(page, name)` call enrolls a NEW user (fresh browser context per
  test) → persists in `data/users/<uuid>/` with SSH keys. Per-spec cleanup partial:

| Spec file | uses ensureLobby | calls cleanup |
|-----------|------------------|---------------|
| contacts-ui.spec.ts | 8 | **0** |
| lobby-card-badges.spec.ts | 2 | **0** |
| mobile-viewport.spec.ts | 2 | **0** |
| multi-room-lobby.spec.ts | 6 | **0** |
| profile-editor.spec.ts | 2 | **0** |
| room-identity.spec.ts | 8 | 2 (rooms only) |
| room-lifecycle.spec.ts | 2 | 2 (rooms only) |
| room-order.spec.ts | 2 | 2 (rooms only) |

`helpers.ts::cleanupTestRooms()` deletes ROOMS but **not the user dirs / SSH keys**.
Vitest is fine — `room-identity.test.ts`, `avatar-preserve.test.ts`, `trace-consistency.test.ts`
already use `os.tmpdir()` + `afterEach rmSync`. The leak is exclusively E2E hitting
the live server.

**Two strategies (Tron's question):**

| | Reuse fixed test users/rooms | Cleanup after tests |
|---|------------------------------|----------------------|
| Pros | Stable IDs; no enrollment overhead each run; smaller `data/` baseline | No fixture state to maintain; tests are self-contained |
| Cons | Cross-test state leakage; must reset between tests | Cleanup helper must cover users + rooms + SSH keys; every spec must opt in |
| Fits today's tests | Requires test rewrites | Drop-in (helpers.ts + per-spec `afterAll`) |

**Recommended (planner): Cleanup, in three pieces.**
1. **Helper:** add `cleanupTestUsers(pattern: RegExp)` to `test/e2e/helpers.ts`
   alongside `cleanupTestRooms`. Removes `data/users/<uuid>/` entirely (profile,
   rooms, SSH keys, files) for users whose `profile.name` matches the pattern.
   Honor T100 `DATA_DIR` override.
2. **Test convention:** every E2E spec MUST use a recognizable name prefix
   (e.g. `E2E-`, `T<task>-`, or per-spec slug) AND register `afterAll`
   cleanup for users + rooms it created. Lint/audit catches regressions.
3. **Backfill:** one-shot cleanup of the existing 263-user pile — match all
   known E2E name patterns (regex from current helper + the new ones), delete
   matching `data/users/<uuid>/` dirs. Real user dirs (Marcel, Admins, Marcel
   Surface Mini per S14 audit) preserved by negative-match guard.

**Optional follow-on:** test-user pool reuse pattern — keep 5 stable UUIDs
re-used across runs with state-reset before each test. Larger refactor,
defer until cleanup is proven.

**Sprint fit (suggestion, Tron decides):** S13 (Stability) — natural follow-on
to T100 (Test Data Isolation — vitest DATA_DIR override). Same story, E2E side.

**Proposed task scope:**
- T<next>: E2E user/room cleanup + backfill (cleanupTestUsers helper +
  per-spec afterAll wiring + one-shot orphan purge). Owner: expert (helper +
  spec wiring) + tester (verify no regressions, prod-data preserved). Effort
  ~3-4h. Acceptance: `data/users/` count stable after a full E2E run; backfill
  reduces baseline to the 3 real users + minimal known fixtures.

### Triaged out
- **B1 — Monaco editor back button → parent dir** — PROMOTED 2026-05-25 to
  [T84](./sprints/sprint-12-editor-fixes/task-84-editor-back-button.md) in
  Sprint 12 (Editor Fixes). Tron confirmed it as a bug (literal quote), so it
  graduated from backlog to a real task.

---
**Created:** 2026-05-25 · **Maintained by:** robbin-planner
