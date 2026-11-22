# Sprint 42 — Test & CI Consolidation (design note)

**For the oopTeam.** This sprint is run by a separate Claude Code agent working for Tron, not by the robbin fleet.
Tron ordered it on 2026-11-22 because the team broke the test-user and CI process. Read this before you touch tests,
CI, branches or tags.

Full plan (phases, gates, risks): https://claude.ai/artifact/KjznypBaPXvB87JiDMW9eS

## What went wrong

- 283 of 439 `test/visual` scripts talked to prod. 25 create rooms there and 13 never delete them.
- Tests logged in as the owner (20 gates), as Tron's own profile `3effa1fc` (3), as a synthetic member (8), and as a
  freshly minted random user (21). The 18 e2e specs each used their own name.
- `main` became an orphan history (v0.8.139). Prod runs `hotfix/t40.1-checklist-band` (v0.8.247), which holds all 483 tags.
- There was no CI. Agents committed and tagged directly, so a tag certified nothing.

## Rules while Sprint 42 is open (Tron)

1. Never test on prod. Tests connect through `scripts/rawbin-target.mjs` (via `test/visual/_target.mjs`), which
   defaults to the isolated server on 4445. `RAWBIN_TARGET=prod` is an explicit opt-in and prints a warning.
2. Only two fixed test users: **SystemTester** and **SystemTester2**. Random or temporary user creation is not allowed.
3. Each test is linked to the artifacts of its chain: Requirement → UseCase → Class → Method → Implementation → Test,
   with `[impl:uuid:]` in the source and `[test:uuid:]` in the test file.
4. Changes arrive as pull requests with CI (`.github/workflows/ci.yml`: build, vitest, e2e). No direct pushes and no hand-made tags.
5. Don't edit `.github/workflows/`, `scripts/rawbin-target.mjs` or `test/visual/_target.mjs` without the consolidation agent.

## Chains

| Req | UseCase | Class.method | Source | Test |
|-----|---------|--------------|--------|------|
| R42.1 | rawbinTarget.resolve | RawbinTarget.resolveRawbinTarget | scripts/rawbin-target.mjs | test/vitest/rawbin-target.test.ts |
| R42.1 | testPollution.list | TestPollution.listTestPollution | scripts/list-test-pollution.mjs | test/vitest/list-test-pollution.test.ts |
| R42.2 | releaseWorkflow.tagOnMerge | ReleaseWorkflow.tagOnMerge | .github/workflows/release.yml (planned) | open |
| R42.3 | testIdentity.ensureSystemSession | TestIdentity.ensureSystemSession | test/e2e/helpers.ts | open |
| R42.4 | ciWorkflow.runSuites | CiWorkflow.runSuites | .github/workflows/ci.yml | open |
| R42.5 | room.createWithConnectionIdentity | RoomAuth.createRoomWithConnectionIdentity | src/ts/server/server.ts | open |

Open chains are planned work. Their Impl and Test hops are added in the task that builds them (T42.2–T42.5).
