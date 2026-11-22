<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Sprints](../sprints.overview.md)

# Sprint 42 Planning — Sprint 42 — Test & CI Consolidation

## Sprint Goal

RADICAL CONSOLIDATION of test users, test targets, test suites, branches and releases (Tron 2026-11-22). NOTE FOR THE oopTeam: this sprint is DRIVEN BY A SEPARATE CLAUDE CODE AGENT (subagent session outside the robbin fleet), not by robbin-planner/architect/expert/tester. Reason (Tron): the test-user and CI process was broken by the team — tests ran against prod and left rooms/users there, tests logged in as the owner, as Tron's own profile and as random new users, main became a stale orphan while prod ran an unmerged hotfix branch, tags were set by hand on untested direct commits, and nothing ran the suites automatically. Until this sprint is Done the team must NOT: add tests that reach prod or use any identity other than the two fixed test users SystemTester and SystemTester2 (Tron: 'two test users are acceptable, random temp user creation is not'); push or tag directly; change .github/workflows or test/visual/_target.mjs. Traceability (Tron: 'each test must be linked to the artifacts of the chain'): every requirement carries a UseCase -> Class -> Method chain, and every test is a Test unit wired Impl -> Method -> UseCase -> Requirement with a [test:uuid:] marker in its file. Target: one trunk (main = prod line, PR-only, protected), one test identity (SystemTester + SystemTester2), never test on prod, two green suites (vitest + Playwright) run by CI, CI-made tags. Plan: https://claude.ai/artifact/KjznypBaPXvB87JiDMW9eS. PRs: #2 unlock fix, #3 phase 1.

**Status:** Active

## Tasks

- [ ] 🧪 [Task 42.1: Phase 1 — stop the bleeding (tests off prod, CI, pollution inventory)](./phase-1-stop-the-bleeding.md)
- [ ] ⏳ [Task 42.2: Phase 2 — one trunk (main = prod line, protected, PR-only)](./phase-2-one-trunk.md)
- [ ] ⏳ [Task 42.3: Phase 3a — one test identity (SystemTester + SystemTester2)](./phase-3-one-test-identity.md)
- [ ] ⏳ [Task 42.4: Phase 3b — two green suites (triage test/visual, fix known failures, clean tree)](./phase-3-two-green-suites.md)
- [ ] 📝 [Task 42.5: Phase 4 — close the auth gaps, CI-made releases](./phase-4-close-auth-gaps.md)
