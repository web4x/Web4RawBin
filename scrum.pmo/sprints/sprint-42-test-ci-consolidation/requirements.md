<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 42 Requirements — Sprint 42 — Test & CI Consolidation

## Requirements

- [ ] **R42.1 — Tests never touch prod — every test runs against an isolated server; prod is opt-in only**
  [requirement:uuid:fa353b30-0abf-40b4-9636-ca4bb02e7f30]
  plan a radical consolidation
  283 of 439 test/visual gate scripts connected to the live server (prod.wo-da.de:4444, or localhost:4444 on the prod box); 25 create rooms there and 13 never delete them. Every test must run against an isolated server it owns (own port, own DATA_DIR, own scenario dir). Prod is reached only by an explicit opt-in and only by a read-only smoke check after deploy.
  **Acceptance criteria:**
  - [ ] **(isolated-by-default)** A test script with no environment set connects to the isolated server (https://localhost:4445), never to prod.
  - [ ] **(prod-opt-in)** Reaching prod requires RAWBIN_TARGET=prod and prints a warning.
  - [ ] **(no-prod-pollution)** A full test run leaves prod's room and user counts unchanged.
  -> rawbinTarget.resolve [uc:uuid:64c2ab49-e60e-4936-a613-5277b42d5a42]
  -> testPollution.list [uc:uuid:7c990cfa-ad4e-4c40-986d-e2d51e2fa6c5]

- [ ] **R42.2 — One trunk, CI-gated merges, CI-made tags**
  [requirement:uuid:6a7aa5ca-fbea-4673-9f92-4a02afe95a41]
  plan a radical consolidation
  main is an orphan history (root c7924287f, 2026-08-29, v0.8.139) while prod runs hotfix/t40.1-checklist-band (v0.8.247). All 483 tags live only on the hotfix line, there was no CI and almost no merges: agents committed and tagged directly. Target: main = what prod runs, changes arrive only as PRs, CI must be green to merge, and only CI creates a release tag.
  **Acceptance criteria:**
  - [ ] **(main-is-prod)** git merge-base main <prod commit> equals the prod commit.
  - [ ] **(pr-only)** main is protected: PR required, CI required, no force-push.
  - [ ] **(ci-tags)** Tags are created by CI on the merge commit after the version bump; nobody tags by hand.
  -> releaseWorkflow.tagOnMerge [uc:uuid:22888819-dbdc-4b82-b5bf-75b9bb82bf75]

- [ ] **R42.3 — Two fixed test users only: SystemTester and SystemTester2, no random or temporary users**
  [requirement:uuid:237ed0b0-1cff-4fde-82ac-e2059d8293f5]
  all tests shall be done on as the same system user. ist that how its done consistently?
  Today 157 gates use SystemTester, 20 the owner token, 3 Tron's own profile 3effa1fc, 8 a synthetic member 11111111-…, 21 mint a new random user per run, and the 18 e2e specs each log in under their own name. Tron: all tests run as the same system user; two fixed test users are acceptable, random temp user creation is not (2026-11-22).
  **Acceptance criteria:**
  - [ ] **(systemtester-only)** Every test logs in as SystemTester; a test that needs a second person uses SystemTester2.
  - [ ] **(no-owner-no-real-users)** No test uses the owner token, a real person's profile, or a freshly minted random user.
  - [ ] **(real-device-keys)** Test users are seeded with real device keys, not 'e2e-bypass'.
  -> testIdentity.ensureSystemSession [uc:uuid:f5c5e99b-9095-4aa3-9f97-f1937703f079]

- [ ] **R42.4 — Two suites, both green: vitest (unit) and Playwright (e2e)**
  [requirement:uuid:f402d3ff-7ffc-460c-8b53-321247997e6a]
  plan a radical consolidation
  Tests are spread over test/vitest (56), test/e2e (21), test/visual (439 scripts), test/manual, test/playwright and test/baseline. ~22 vitest and 12 e2e tests fail on the prod line and nobody notices because nothing runs them automatically. Target: npm test + npm run test:e2e cover every check that matters, CI runs both, both are green, and a test run leaves git status clean.
  **Acceptance criteria:**
  - [ ] **(ci-runs-both)** CI runs build, vitest and e2e on every PR (.github/workflows/ci.yml).
  - [ ] **(all-green)** Both suites are green on main; known failures are fixed or deleted, never skipped.
  - [ ] **(visual-triaged)** test/visual is triaged: behaviour checks become Playwright specs, source-text checks become vitest tests or are deleted, one-off probes are deleted.
  - [ ] **(clean-tree)** A test run never changes tracked files (scenario/ and README writes go to the test data dir).
  -> ciWorkflow.runSuites [uc:uuid:d5bdc62c-0ae3-49cc-a2d2-5d2038f0d0ad]

- [ ] **R42.5 — Close the auth gaps the tests leaned on**
  [requirement:uuid:e75836a9-af48-40a5-af0d-ba1a3b0971d8]
  plan a radical consolidation
  CREATE_ROOM and JOIN_ROOM take the identity from msg.playerToken instead of the connection's own identity; a bare token logs a user in; the SystemTester token is public in the repo. Tests depended on all three.
  **Acceptance criteria:**
  - [ ] **(connection-identity)** CREATE_ROOM/JOIN_ROOM use the connection's authenticated identity and reject a different playerToken.
  - [ ] **(no-token-only-login)** A bare token no longer logs a user in; device-key login is required.
  - [ ] **(rotated-secrets)** Test and owner tokens are out of the repo and the public ones are rotated.
  -> room.createWithConnectionIdentity [uc:uuid:13be1a82-54f9-449f-b148-6c9ace942800]
  -> user.loginWithDeviceKey [uc:uuid:b8d2fb96-dcd1-428d-9c39-15b2ab28e2aa]
