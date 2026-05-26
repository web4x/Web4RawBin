[Back to Sprint 13 Planning](./planning.md)

# T100: Test Data Isolation — DATA_DIR Override

[task:uuid:a0b1c2d3-e4f5-4061-8273-849500000100]

## Tron Requirement (literal)
> TRON DIRECTIVE (via PO 2026-05-26): E2E test runs flooded prod with test rooms. Tests must use an isolated data dir and NEVER pollute prod data again.

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [ ] testing (tester — read-isolation PROVEN, but AC4 isolated-run FAILED: reuseExistingServer:true leaked test data into prod; fix = reuseExistingServer:false + live server down. AC4 NOT met.)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.6)
Single configurable base `DATA_DIR` across all server modules; default byte-identical to prod.
- **server.ts:** `const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data')`. ALL data paths already derive from it: PROFILES_PATH, DEVICES_PATH, PAIRING_PATH, bug-reports, ROOMS_DIR (→ `new RoomManager(ROOMS_DIR)` so legacy data/rooms honors it), LOGS_DIR. Fixed the ONE stray hardcoded path (GET /api/avatar `encPath`) to use `path.join(DATA_DIR,'users',token,'files','avatar.enc')`.
- **UserKeys.ts:** `const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'../../../data')` → USERS_DIR derived. (UserCrypto delegates to `getUserHomeDir` here, so encrypted avatar files honor it too.)
- **RoomKeys.ts:** same DATA_DIR base → USERS_DIR (per-user rooms + room .ssh honor it).
- NOT changed (intentionally — not data-write paths): FileApi PROJECT_ROOT + RESTRICTED_DIRS (file browser), server DOCS_DIR/PROJECT_ROOT (docs serving), Room.ts RoomManager default param `'data/rooms'` (never used — server always passes resolved ROOMS_DIR).

### Invariant proof (AC1/AC5 — zero prod change when unset)
Every base is `process.env.DATA_DIR || path.join(__dirname, '../../../data')`. The default operand is the EXACT expression each module used before this task (same `__dirname`, same `../../../data`). With `DATA_DIR` unset, `||` returns the identical default → byte-identical prod behavior. With it set, all three modules read the same env in one process → one consistent isolated base.

### Tester handoff (AC3/AC4/TS1/TS2)
Launch the E2E server with `DATA_DIR=<tmp/e2e-data>` (Playwright webServer env or the dev launch). Then: TS1 full E2E → test rooms land in tmp, prod `data/rooms` count byte-unchanged; TS2 unset → prod path (no change). AC4: assert prod `data/rooms` file count identical before/after the E2E run.
- v0.5.6, sw.js cache rawbin-v0.5.6. tsc + build clean. Server-only.

### v0.5.7 ADD — port override (fixes the AC4 reuse race) (robbin-expert, 2026-05-26)
First AC4 run LEAKED to prod: Playwright `reuseExistingServer:true` found the live server on 4444 (my restart collided with the run) and reused it WITH PROD DATA_DIR, ignoring `DATA_DIR=tmp`. Root cause = shared port 4444; port was read ONLY from `.env`.
- FIX (server.ts:61-62): `PORT = process.env.PORT || envVars['PORT'] || '4000'`; `HTTPS_PORT = process.env.HTTPS_PORT || envVars['HTTPS_PORT'] || '4444'`. process.env overrides .env. INVARIANT: unset → .env → exact prod ports (4444/4000), zero prod change.
- VALID-AC4 RECIPE (no downtime, no race): Playwright `reuseExistingServer:false` + webServer.env `{ DATA_DIR:/tmp/…, HTTPS_PORT:4445, PORT:4001 }` + baseURL `https://localhost:4445`. Playwright owns its OWN server on 4445 with tmp data; live server stays on 4444 untouched. Both DATA_DIR + port isolated → prod `data/rooms` provably unchanged.
- LEAK CLEANED: re-purged the leaked rooms (per-user 17→2, legacy 26→2) — same allowlist (keep fe4d5664 + 99e6a422). Live server restarted v0.5.7, rooms=2.
- v0.5.7, sw.js cache rawbin-v0.5.7. tsc + build clean.

## Traceability
- up
  - [requirement:uuid:e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8092](./requirements.md) — R-T1 test data isolation
  - [Sprint 13 Planning](./planning.md)
  - Tron directive 2026-05-26 (room-flood from E2E into prod)
- down
  - None (atomic task)
- chain
  - **requirement:** R-T1 in [requirements.md](./requirements.md)
  - **use case:** test runs against an isolated data dir, prod untouched
  - **puml:** N/A (test-infra)
  - **class/method:** `server.ts` data-path resolution (introduce `DATA_DIR` env, default to current prod path); Playwright spec server-launch config
- relates
  - Root cause of the same prod-pollution that S14 (Legacy Migration) is cleaning up; T93 multi-room surfaced the room counts. Tester's interim `afterAll` cleanup is a SEPARATE immediate mitigation — T100 is the proper fix.

## Task Description
Make the server's data directory configurable so E2E tests run against an isolated
dir and can never write into prod `data/`.

- **Expert (server.ts):** replace hardcoded `data/` references with a resolved
  base from `process.env.DATA_DIR || '<current default>'`. All readers/writers
  (profiles.json, devices.json, rooms, users/<token>/...) go through the resolved
  base. Default unchanged → zero prod behavior change when DATA_DIR unset.
- **Tester (specs):** launch the test server with `DATA_DIR=<tmp/e2e-data>` (per-run
  temp dir), point specs at it, and clean it between runs. Prod `data/` is never touched.

## Acceptance Criteria
- [ ] AC1: `server.ts` resolves its data base from `DATA_DIR` env (default = current prod path; unset → no change)
- [ ] AC2: ALL data paths (profiles, devices, rooms, users/<token>) honor the resolved base — no stray hardcoded `data/`
- [ ] AC3: E2E specs launch the server with an isolated `DATA_DIR` (tmp) — prod `data/` byte-unchanged after a full E2E run
- [ ] AC4: A test proves isolation: run E2E, assert prod `data/rooms` count unchanged
- [ ] AC5: No regression — prod run (DATA_DIR unset) behaves exactly as before
- [ ] `npm run build` + version bump

## Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | Run full E2E with DATA_DIR=tmp | tmp dir gets test rooms; prod data/ unchanged |
| TS2 | Start server with DATA_DIR unset | reads/writes current prod path (no behavior change) |

## Dependencies
- **Requires:** None
- **Enables:** Clean E2E going forward (prevents recurrence of the room-flood)

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Prod data/ proven untouched by an E2E run
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## Test Results (robbin-tester, 2026-05-26, v0.5.6 live)

**VERDICT: AC1/AC2/AC5 PASS, read-isolation PROVEN live. AC3 config landed. AC4 live full-suite byte-count BLOCKED on port — runs clean post purge-restart.**

- **AC1** PASS — server.ts:134 `const DATA_DIR = process.env.DATA_DIR || path.join(__dirname,'../../../data')`. Confirmed in source.
- **AC2** PASS — grep of server.ts/UserKeys.ts/RoomKeys.ts for hardcoded `'data/'`/`/data/rooms`/`/data/users`/`/data/profiles` (excluding DATA_DIR-derived) returns EMPTY. All write paths (PROFILES/DEVICES/PAIRING/bug-reports/ROOMS_DIR/LOGS_DIR + avatar encPath) derive from DATA_DIR.
- **AC5** PASS by invariant — `process.env.DATA_DIR || <exact prior default>`; unset returns byte-identical default path → zero prod behavior change.
- **READ-ISOLATION PROVEN (live)** — spawned `tsx server.ts` with `DATA_DIR=/tmp/e2e-dataproof-*` → server logged **"Per-user rooms: 0 registered"**. It scanned the EMPTY tmp dir, NOT prod's 230+ rooms. If DATA_DIR were ignored it would have registered 230+. Conclusive: room registry honors DATA_DIR.
- **AC3** config landed — `playwright.config.ts` webServer.env sets `DATA_DIR` to `os.tmpdir()/rawbin-e2e-data` (override via E2E_DATA_DIR). When Playwright launches its own server (no live server on 4444), all E2E writes go to tmp.
- **AC4 (prod byte-unchanged after full E2E)** — LIVE PROOF BLOCKED: port (HTTPS 4444 / HTTP 4000) is read ONLY from .env (not process.env), so a 2nd isolated server cannot bind alongside the running prod server (EADDRINUSE). Prod data/rooms also actively mutating (live purge: 241→230 observed). Clean byte-count proof runs once the live server is stopped/restarted (the purge-restart — v0.5.6 deploys then) and Playwright owns 4444 with DATA_DIR=tmp + reuseExistingServer:false.

INTERIM MITIGATION still active: `cleanupTestRooms()` afterAll (commit 5823443) in room-order/identity/lifecycle specs — belt+suspenders with T100.

### AC4 ISOLATED-RUN ATTEMPT (2026-05-26, post-purge) — **FAILED — isolation did NOT engage**
After expert purged prod (→2 Marcel rooms) and the 4444 window opened, I ran the FULL suite (40 tests, all PASS) with `E2E_DATA_DIR=/tmp/rawbin-ac4-*`. AC4 byte-count proof **FAILED**:
- prod `data/rooms` 2 → 26 (CHANGED), `data/users` 234 → 260 (CHANGED) — **test data LEAKED INTO PROD**.
- tmp DATA_DIR was **EMPTY** (0 rooms/users) — Playwright's server did NOT use DATA_DIR=tmp.
- **Root cause:** `reuseExistingServer: true`. The expert restarted the live v0.5.6 server on 4444 during/just-before my run; Playwright found 4444 responding and REUSED the live (prod-DATA_DIR) server, ignoring my webServer.env DATA_DIR. The tmp dir stayed empty; all writes hit prod.
- Leaked test rooms (per-user): AC4-*, Contact-*, DL-*, EdSelf-*, MR-*, Mobile-Room, Profile-Test, RC-*, Self-*, T78-*, VcSelf-* (the 2 "Marcel … Room" rooms are the real ones to keep). `cleanupTestRooms()` afterAll removed 9 but net +24 leaked (specs whose names its patterns don't cover).
- I attempted targeted cleanup of the leak; correctly BLOCKED (deleting shared prod data is not the tester's authority — purge is expert-owned, backup exists `web4rawbin-data-backup-20260526T161601.tar.gz`).

**FIX REQUIRED for a valid AC4 run:** `reuseExistingServer: false` so Playwright ALWAYS launches its OWN server with DATA_DIR=tmp, AND the live server MUST stay DOWN for the whole isolated run (no mid-run restart). Then prod is provably untouched. Until then AC4 is NOT met. Expert: please re-purge the leak I caused (or restore backup).

## AC4 Coordinated Window (PO green-lit 2026-05-26) — DRIVE SEQUENCE
Planner (robbin-planner) drives status through these steps; each agent picks up
its step FROM THIS FILE and updates the STEP TRACKER below when done. AC4 PASS
gates T100 Done; Tron QA gate follows.

Root cause of the failed run: `reuseExistingServer:true` made Playwright reuse the
live prod-DATA_DIR server. The valid AC4 run requires BOTH: (a) `reuseExistingServer:false`
so Playwright launches its OWN server with DATA_DIR=tmp, and (b) the live server
DOWN for the entire isolated run (no mid-run restart).

### Steps (sequential — do not start a step until the prior is signalled done)
1. **(A) RE-PURGE — robbin-expert:** prod re-polluted to ~26 rooms by the AC4 race.
   Re-run the GUARDED purge → clean to the 2 real "Marcel … Room" rooms (backup
   exists: `web4rawbin-data-backup-20260526T161601.tar.gz`). Then STOP the live
   server (4444/4000 down). Signal in STEP TRACKER: "4444 free, prod=2 rooms".
2. **(config) reuseExistingServer:false — robbin-tester:** set `reuseExistingServer:false`
   in playwright.config.ts (commit it) so Playwright always launches its own server.
3. **AC4 ISOLATED RUN — robbin-tester:** with live server DOWN, run the FULL suite
   with `DATA_DIR=<tmp>`. Capture prod `data/rooms` + `data/users` file counts
   BEFORE and AFTER. PASS = both byte/count-unchanged AND tmp dir received the test
   rooms. Record result in STEP TRACKER + Test Results.
4. **RESTART — robbin-expert:** bring the live v0.5.6 server back up on 4444.
5. **planner:** on AC4 PASS → check T100 testing box, sync planning/overview; T100
   then awaits Tron QA. On FAIL → log, keep testing unchecked, re-drive.

### STEP TRACKER (agents update their line)
- [ ] S1 expert: re-purge → prod=2, live server STOPPED — signal: ____
- [ ] S2 tester: reuseExistingServer:false committed — commit: ____
- [ ] S3 tester: AC4 isolated run — prod before/after counts: ____ / ____ ; tmp got rooms: ____ ; PASS/FAIL: ____
- [ ] S4 expert: live v0.5.6 restarted — signal: ____
- [ ] S5 planner: AC4 result reconciled into status — ____

## QA Audit & User Feedback
- 2026-05-26: Tron directive (via PO) — E2E flooded prod with test rooms; proper fix is isolated DATA_DIR. Tester interim afterAll cleanup is separate/immediate.
- 2026-05-26: AC4 isolated-run FAILED (reuseExistingServer:true race leaked to prod). PO green-lit a coordinated window (above); planner driving. testing box UNCHECKED until AC4 PASS.

## Subtasks
None (atomic task).

---
*Sprint 13 — Stability (Core Workflow Fixes)*
*Owner: robbin-expert (server.ts DATA_DIR), robbin-tester (switch specs)*
*Priority: HIGH — prevents recurrence of prod data pollution*
