# T149: Extend symlink tree to all 9 scenario classes — universal 🔗 resolution
[task:uuid:bce39256-6743-406e-b090-92ea2d13cde8]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — architect pre-design `3f8cd33` adopted into Design section; **req-eng backfill DONE via `9669370`** — B10 anchored with verbatim Tron quotes + canonical `requirement:uuid:f0a1b2c3-...` replaced the planner-suggested one)
  - [ ] creating test cases
  - [x] implementing (`b55abd8` v0.5.45 per-class symlink subdirs for all 9 scenario classes + `de7f348` architect slug-mismatch fix design + `1478924` v0.5.46 full-UUID tracelinks + two-strategy scenarioLink. Rule-pair (a)+(b) ✓ in BOTH ship commits: v0.5.45 + v0.5.46)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:bce39256-6743-406e-b090-92ea2d13cde8]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B10 in [scrum.pmo/backlog.md](../../backlog.md), commits `7044557` + `cce6d5e`
  - **B10 requirement** `[requirement:uuid:f0a1b2c3-d4e5-4f6a-b7c8-901234560ab0]`
    Verbatim Tron quotes:
    > "no ! this is not expected behavior!! this is a big implication gap"
    > "same for requirements, classes methods"
- down
  - None (atomic at parent level; architect may split T149.x sub-tasks per class group if scope warrants — coordinate with planner first)
- follows
  - [T131: File-browser symlinks (Task class)](./task-131-file-browser-symlinks.md) — pattern T149 extends to the other 8 classes
  - [T141: Chain-link icon → sprints.json symlink](./task-141-chain-link-icon-symlinks.md) — consumer; gains universal resolution
  - [T144: File-browser display fixes](./task-144-file-browser-display-fixes.md) — `.json`-side click-through that benefits from universal symlinks
  - [T147: `.md` directory listing symmetric icons](./task-147-md-listing-chain-link-icon.md) — `.md`-side click-through that benefits from universal symlinks
  - [T143: Chain → tree rework](./task-143-traceability-tree-rework.md) — R17.27 "every typed reference a clickable link"; T149 is what makes the link **resolve** for all 9 types
  - [T145: User class scenario-unit](./task-145-user-scenario-viewbus.md) — User is one of the 9 classes T149 must include
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B10 `[requirement:uuid:f0a1b2c3-d4e5-4f6a-b7c8-901234560ab0]` (req-eng anchored)
  - **use case:** UC-TBD (architect — likely `symlinkTree.emitPerClass`, `symlinkTree.backFillExisting`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds the new UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** symlink emitter (T131's module, TBD by architect — may live in `scripts/` or as a server-side helper) / `scrum.pmo/standards/traceability-standard.md` (spec) — architect names the concrete locations

## Context

T131 (`aad0816` v0.5.30) introduced the symlink tree at
`scenarios/sprints.md/task/<speaking>.md` for the **Task** class only — each
Task scenario gets a symlink whose path is the speaking-name and whose target
is the canonical `scenario/index/<prefix>/<uuid>.scenario.json`. The 🔗 icon
in T141 / T144 / T147 resolves via this tree. But today the tree exists ONLY
for Tasks. For other scenario classes (Requirement, UseCase, Class, Method,
Test, TraceLink, User from T145, View from T126), 🔗 either has no target
or falls back to raw UUID paths.

PO 2026-06-01 (Tron reinforced "same for requirements, classes methods"):
extend the symlink tree to ALL 9 scenario classes so 🔗 resolves universally.

**The 9 scenario classes (enumerated explicitly per PO clarification):**
1. **Requirement**
2. **UseCase**
3. **Task**  *(already covered by T131)*
4. **Class**
5. **Method**
6. **Test**
7. **TraceLink**  *(T134)*
8. **User**  *(T145, just landed)*
9. **View**  *(T126 templates as a class)*

T149 covers classes 1–2 and 4–9 (Task is already done); ensures the symlink
tree is uniform across all 9.

## Intention

### Why this task exists
- 🔗 click-through (T141/T144/T147) silently fails for non-Task scenarios
- The "tree" of R17.27 ("every typed reference a clickable link") has live
  edges for Tasks only — partial coverage
- T143's chain-walk also lands on dead ends for non-Task ancestors

### Problems this task solves
- No `scenarios/sprints.md/requirement/<speaking>.md` symlink → 🔗 to a Requirement breaks
- Same for UseCase / Class / Method / Test / TraceLink / User / View
- Existing 8 classes' scenarios have no speaking-name symlinks → 🔗 must resolve via raw UUID

### How it solves them
- Generalize T131's emitter to iterate over all 9 classes
- Run a one-shot back-fill across the existing scenario index so every existing
  Requirement/UC/Class/Method/Test/TraceLink/User/View scenario gets its
  symlink emitted now
- New scenarios get symlinks at the same time the canonical JSON is emitted
  (architect decides whether this is a write-time hook or a post-process step)

## Acceptance Criteria

- [ ] AC1 (Requirement) — `scenarios/sprints.md/requirement/<speaking>.md` exists and resolves for every Requirement scenario in the index
- [ ] AC2 (UseCase) — `scenarios/sprints.md/usecase/<speaking>.md` exists and resolves for every UseCase scenario
- [ ] AC3 (Task) — T131's existing `scenarios/sprints.md/task/<speaking>.md` unchanged; no regression
- [ ] AC4 (Class) — `scenarios/sprints.md/class/<speaking>.md` exists and resolves for every Class scenario
- [ ] AC5 (Method) — `scenarios/sprints.md/method/<speaking>.md` exists and resolves for every Method scenario
- [ ] AC6 (Test) — `scenarios/sprints.md/test/<speaking>.md` exists and resolves for every Test scenario
- [ ] AC7 (TraceLink) — `scenarios/sprints.md/tracelink/<speaking>.md` exists and resolves for every TraceLink scenario
- [ ] AC8 (User) — `scenarios/sprints.md/user/<speaking>.md` exists and resolves for every User scenario (T145 dependency)
- [ ] AC9 (View) — `scenarios/sprints.md/view/<speaking>.md` exists and resolves for every View scenario (T126 dependency)
- [ ] AC10 — 🔗 click-through (T141 / T144 / T147) resolves for ALL 9 classes; no 404s
- [ ] AC11 — One-shot back-fill executed: existing scenarios across all 9 classes have their symlinks present after the migrator runs
- [ ] AC12 — Chain audit (`trace-cli`) reports universal resolution: 0 broken links across the migrated graph
- [ ] AC13 — No regression on T131 (Task), T141 (chain-link rendering), T144 (`.json` side icons), T147 (`.md` side icons when it lands)
- [ ] AC14 — `npm run build` succeeds; all existing tests pass
- [ ] AC15 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl. (c) STATIC_SHELL: likely exempt — architect to confirm
- [ ] AC16 — All 4 roles committed work in this file

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to stand up T149 with explicit per-class enumeration (Tron reinforced "same for requirements, classes methods"). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC15 + DoD (learnings #15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:127e6260` with req's canonical `requirement:uuid:f0a1b2c3` (from B10 capture, commits `7044557` + `cce6d5e`). Both verbatim Tron quotes anchored: the emphatic "no ! this is not expected behavior!! this is a big implication gap" + the scope clarification "same for requirements, classes methods". Planner summary was accurate — all 9 classes confirmed. Ready for architect.

## Subtasks

None (scenarioLink fix + migration script fix + re-run).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 13 (universal symlink tree across all 9 scenario classes)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 4 (foundation for universal 🔗 resolution; closes partial-coverage gap from T131)*
