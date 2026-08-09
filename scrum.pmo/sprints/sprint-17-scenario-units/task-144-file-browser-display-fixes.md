<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T144: File-browser display fixes — icon order + link targets (B5, 3 fixes)

[task:uuid:d03a73ff-0329-47a3-8610-bf5c18053221]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `4b65e79` architect design)
  - [x] creating test cases
  - [x] implementing (`5da4054` v0.5.36 — rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME both bumped to v0.5.36)
  - [x] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:d03a73ff-0329-47a3-8610-bf5c18053221]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** `2bfb64f` — *robbin-req: B5 — file-browser display fixes (icon order + link targets)* (added to `scrum.pmo/backlog.md`)
  - **B5 composite requirement** `[requirement:uuid:e6f7a8b9-c0d1-4e2f-a3b4-c5d6e7f8a9b5]`
    Verbatim Tron quote (from `2bfb64f` backlog.md):
    > TRON DIRECTIVE (3 in one): (a) swap icon order: ✏️ 🔗 → 🔗 ✏️ (link before
    > edit). (b) make 🔗 clickable → links to original
    > `scenario/index/.../uuid.scenario.json` (the symlink target). (c) clicking
    > the .json filename in symlink listings currently 404s → must link to the
    > corresponding MD view (`scenarios/sprints.md/task/<speaking>.md`).
  - **Sub-fixes (3) — each a distinct AC under B5:**
    - B5(a) icon order — `[requirement:uuid:fdff228f-3331-473b-abbb-801cb265cae1]` — chain-link 🔗 BEFORE edit ✏️
    - B5(b) 🔗 clickable target — `[requirement:uuid:5faa1c91-9bd6-43da-8f81-927dfaa451bc]` — links to `scenario/index/<prefix>/<uuid>.scenario.json`
    - B5(c) .json → MD view — `[requirement:uuid:7eb8f63f-a7d2-4128-9acb-b26f75bdfbe1]` — `.json` filename click resolves to `scenarios/sprints.md/<class>/<speaking-name>.md`
- down
  - None (atomic task; 3 fixes share file/component touchpoints)
- follows
  - [T131: File-browser symlinks](./task-131-file-browser-symlinks.md) — establishes the symlink tree T144 navigates
  - [T141: Chain-link icon → sprints.json symlink](./task-141-chain-link-icon-symlinks.md) — chain-link icon precedent T144 corrects ordering on
  - [T126: Generated views](./task-126-views.md) — provides the speaking-name MD views B5(c) must resolve to
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B5 (above) + R17.27 ("every traceability element is a clickable link" — T143 parent rule; T144 implements a specific instance)
  - **use case:** UC-TBD (architect — likely `fileBrowser.renderListing`, `fileBrowser.resolveJsonClick`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds UCs as `UseCase` instances (rule #10 / T117)
  - **class/method:** `src/ts/server/server.ts` (`/md/` directory listing renderer), `src/public/ts/components/rb-file-tree.ts` (TBD by architect)

## Task Description

Fix three file-browser display issues from B5: icon ordering and link targets.

## Context

Tron 2026-05-31 (captured by req-eng in `2bfb64f` / backlog B5): three file-browser
display defects, all in the `/md/` + `rb-file-tree` surface, all small, but
combined they break the discoverability of the symlink-based scenario tree that
T131/T141 set up.

1. **B5(a) — Icon order.** The current renderer emits `✏️ 🔗` per row; Tron wants
   `🔗 ✏️` (link before edit). Cosmetic but consistent — chain navigation is the
   primary action on a typed scenario row; edit is secondary.

2. **B5(b) — 🔗 must be a real clickable link.** Currently the 🔗 icon is a glyph
   on the symlink row but doesn't navigate. It must be a clickable anchor whose
   `href` is the **symlink target** — the canonical
   `scenario/index/<prefix>/<uuid>.scenario.json` — not the symlink path the user
   is browsing.

3. **B5(c) — `.json` filename click 404.** In `/md/scenarios/sprints.json/...`
   listings, clicking the `.json` filename returns 404 (the server doesn't have
   a handler for raw `.json` clicks in that view). Tron's directive: resolve to
   the corresponding generated MD view at
   `scenarios/sprints.md/<class>/<speaking-name>.md` instead.

## Intention

### Why this task exists
Three small fixes that together restore the click-through navigation of the
scenario symlink tree — without them, T131/T141's symlink scaffolding is
visually present but functionally broken.

### Problems this task solves
- Inconsistent icon order in the file-browser
- 🔗 is a glyph, not a link → users can't navigate to canonical scenario JSON
- `.json` filename click → 404 → users can't navigate to MD view from the JSON view

### How it solves them
- One renderer change for icon order (B5(a))
- One anchor wrap + href-resolution for 🔗 (B5(b))
- One server route handler or filename-click rewrite for `.json` → MD view (B5(c))

## Acceptance Criteria

- [ ] **AC1 (B5(a) — icon order):** In `/md/scenarios/...` listings, every row that has both icons shows them in order `🔗 ✏️` (link first, edit second)
- [ ] **AC2 (B5(b) — 🔗 clickable + target):** Clicking 🔗 navigates to the symlink target = `scenario/index/<prefix>/<uuid>.scenario.json` (canonical JSON unit), not back to the symlink directory
- [ ] **AC3 (B5(c) — .json click → MD view):** Clicking a `.json` filename in a `scenarios/sprints.json/...` listing navigates to the corresponding `scenarios/sprints.md/<class>/<speaking-name>.md` view; no 404
- [ ] AC4 — All 3 fixes verified across multiple sprint trees (e.g. sprint-17 task class, requirement class, usecase class)
- [ ] AC5 — `rb-file-tree` component (if it renders these icons) stays consistent with `/md/` server-side rendering
- [ ] AC6 — `npm run build` succeeds; all existing tests pass (no regression on T131 / T141)
- [ ] AC7 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl (no STATIC_SHELL change expected — no new route, but architect to confirm)

## Dependencies

- **Requires:** T131 (file-browser symlinks present), T141 (chain-link icon precedent), T126 (speaking-name MD views B5(c) resolves to)
- **Coordinate-with:** T143 (R17.27 "every element a link" — T144 is one instance of that broader rework)
- **Enables:** functional navigation of the scenario symlink tree

## Definition of Done

- [ ] All AC met (all 3 sub-fixes B5(a)+B5(b)+B5(c) verified)
- [ ] Rule-pair (a)+(b) ✓
- [ ] No regression on T131 / T141 (icon visibility, symlink markers, chain-link presence)
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback

### T144 Verification Report — robbin-tester 2026-06-01

**Tested on:** `/md/scenario/sprints.json/sprint-02-identity-ssh/` + `/md/scenario/sprints.json/sprint-17-scenario-units/`

| AC | Test | Result |
|----|------|--------|
| AC1 (B5a icon order) | Every row shows 🔗 then ✏️ | **PASS** — all S2+S17 rows confirmed `🔗` left of `✏️` |
| AC2 (B5b 🔗 clickable) | 🔗 is `<a href="/md/scenario/index/<prefix>/<uuid>.scenario.json">` | **PARTIAL** — anchor exists + href correct, but `/md/` route returns **404** for `.scenario.json` files. `/edit/` route returns 200. The 🔗 target file exists on disk. |
| AC3 (B5c json→MD) | `.json` filename click → `/md/scenario/sprints.md/task/<speaking>.md` | **PASS** — task-10-device-keys.json → 200, task-12-ssh-login.json → 200 |
| AC4 (cross-class) | Verified on S2 (6 tasks) + S17 (21 tasks) | **PASS** — same pattern across both sprints |
| AC6 (no regression) | 834/834 vitest | **PASS** |
| AC7 (rule-pair) | v0.5.36 in package.json + sw.js | **PASS** |

**BUG — AC2 partial (v0.5.36):** 🔗 href pointed to `/md/` which 404d on `.scenario.json`.
**FIX — AC2 re-verify (0101980, v0.5.38):** 🔗 href now `/edit/scenario/index/<prefix>/<uuid>.scenario.json` → 200. All 3 ACs confirmed PASS on v0.5.38:
- AC1: 🔗 before ✏️ — PASS
- AC2: 🔗 → `/edit/...scenario.json` → HTTP 200 — **PASS**
- AC3: .json filename → `/md/scenario/sprints.md/task/<speaking>.md` → HTTP 200 — PASS

- 2026-05-31: PO directed planner to stand up T144 immediately (no further reminder). Source: `2bfb64f` (req-eng B5 captured Tron's 3-in-1 directive into backlog). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17) — composite B5 uuid kept as req formalized + 3 sub-fix uuids generated for AC-level traceability; rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Awaiting req-eng confirmation → architect design → expert impl → tester verify → Tron QA.

## Subtasks

None (atomic task; 3 fixes are sub-ACs, not sub-tasks).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 5 follow-on (file-browser polish)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 2 (small impact but blocks click-through navigation of the scenario tree T131/T141 set up)*
