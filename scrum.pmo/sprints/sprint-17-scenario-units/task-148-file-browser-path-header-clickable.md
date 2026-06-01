[Back to Sprint 17 Planning](./planning.md)

# T148: File-browser path-header clickable → parent dir navigation

[task:uuid:95e93fd2-de9e-4579-a857-59f69608f982]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req → architect)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — capture the verbatim Tron quote for this directive; replace the planner-suggested `requirement:uuid` below with req's canonical one if different; clarify whether "path-header" includes the leading `/md/` root segment or starts at `scenarios/...` (Tron quote authoritative)
2. **robbin-architect** — design the path-header rendering: split the current displayed path into segments, wrap each in an anchor whose href navigates to the parent dir (e.g. `/md/scenarios/sprints.md/task/` is built from segments `[/md] [scenarios] [sprints.md] [task] [/]`); decide the visual separator (`/`) styling; decide whether `rb-file-tree` mirrors; ensure no conflict with T144/T147 row icons (path-header is page-level, rows are below it)
3. **robbin-expert** — implement per architect's design in `server.ts` `/md/` directory listing renderer (path-header HTML emission) + `rb-file-tree` if mirrored; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — visual + click-through verification: from a deep path, every segment click takes you to that segment's directory; root segment behaves correctly; works across `.json` and `.md` subtrees; regression on T144/T147 row icons + T141 chain-links unchanged

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:95e93fd2-de9e-4579-a857-59f69608f982]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B9 in [scrum.pmo/backlog.md](../../backlog.md), commit `4bb3f82`
  - **B9 requirement** `[requirement:uuid:e9f0a1b2-c3d4-4e5f-a6b7-890123459bc9]`
    Verbatim Tron quote:
    > "in the file browser make the first line clickable eg scenario/ 📁 index/
    > so scenario is clickable and will go 1 folder up"
- down
  - None (atomic task; small UI / href fix)
- follows
  - [T144: File-browser display fixes — icon order + link targets](./task-144-file-browser-display-fixes.md) — same `/md/` renderer module
  - [T147: `.md` directory listing symmetric icons](./task-147-md-listing-chain-link-icon.md) — sibling UX uplift in the same renderer
  - [T131: File-browser symlinks](./task-131-file-browser-symlinks.md) — file-browser baseline
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B9 `[requirement:uuid:e9f0a1b2-c3d4-4e5f-a6b7-890123459bc9]` (req-eng anchored)
  - **use case:** UC-TBD (architect — likely `fileBrowser.renderPathHeader` / `fileBrowser.navigateToParent`)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds new UC as a `UseCase` instance (rule #10 / T117)
  - **class/method:** `src/ts/server/server.ts` (`/md/` directory listing renderer — path-header emission), `src/public/ts/components/rb-file-tree.ts` if mirrored (TBD by architect)

## Context

The `/md/` route renders a directory listing for any path under the served
file tree. Above the row listing it shows the current path as a static text
header (e.g. `📁 /md/scenarios/sprints.md/task/`). Today, clicking any part
of that header does nothing — users have to either edit the URL or use the
browser back button to navigate up the tree. Standard file-browser UX makes
each path segment a clickable breadcrumb that jumps to that ancestor
directory. T148 adds this breadcrumb behavior.

Sibling work in flight: T144 (icon order + link targets on `.json` rows,
shipped) and T147 (symmetric icons on `.md` rows, plan-ahead). T148 is the
**page-level** uplift; T144/T147 are **row-level**. No conflict — same
renderer module, different surfaces.

## Intention

### Why this task exists
- Path-header is a natural navigation affordance that's currently dead
- The file-browser becomes useful only when both row-level icons (T144/T147)
  and page-level breadcrumb (T148) work together

### Problems this task solves
- No click-to-parent navigation from a directory view
- Users must URL-edit or browser-back to go up the tree
- Asymmetry with other parts of the app where headers are clickable

### How it solves them
- Server-side: split the current path into segments; emit each as an anchor
  whose href is the cumulative prefix up to that segment
- Client-side (`rb-file-tree`, if mirrored): same breadcrumb rendering

## Acceptance Criteria
- [ ] AC1 — On any `/md/<path>` listing, the path-header shows each segment as a clickable link
- [ ] AC2 — Clicking a segment navigates to that segment's directory (the prefix up to and including that segment)
- [ ] AC3 — Visual separators (e.g. `/`) between segments are NOT clickable (or render distinctly); only segment text is the anchor
- [ ] AC4 — Root segment (e.g. `/md/`) behaves correctly — clicking lands on the `/md/` root listing (200)
- [ ] AC5 — Works consistently across `/md/scenarios/sprints.md/...`, `/md/scenarios/sprints.json/...`, `/md/scenarios/index/...`, and any other `/md/` subtree
- [ ] AC6 — If `rb-file-tree` mirrors server-side rendering (architect decides), it shows the same breadcrumb behavior
- [ ] AC7 — No regression on T144 (row icons + click-through on `.json` side), T147 (when it lands), T141 (chain-link icons inside views)
- [ ] AC8 — `npm run build` succeeds; all existing tests pass
- [ ] AC9 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing impl. (c) STATIC_SHELL: likely exempt (no new route)
- [ ] AC10 — All 4 roles committed work in this file (req anchor + architect design + expert impl + tester verify)

## Test Scenarios
File: `test/vitest/path-header-clickable.test.ts` (new) + visual on `/md/scenarios/sprints.md/<class>/`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Render `/md/scenarios/sprints.md/task/` | Path-header shows segments as anchors: `[/md]` `[scenarios]` `[sprints.md]` `[task]` (architect finalizes exact form/labels) |
| TS2 | Click segment `[scenarios]` | Browser navigates to `/md/scenarios/` — 200, directory listing |
| TS3 | Click root `[/md]` | Browser navigates to `/md/` — 200, root listing |
| TS4 | Repeat TS1–TS3 on `/md/scenarios/sprints.json/requirement/` | Same breadcrumb behavior |
| TS5 | Click separator `/` (if visible) | Either non-clickable, or click is a no-op (architect decides) |
| TS6 | Regression: T144 row icons on `.json` rows | Order `🔗 ✏️`, click-through unchanged |
| TS7 | Regression: T141 chain-link icons inside generated `.md` views | Unchanged |
| TS8 | Rule-pair post-bump | New CACHE_NAME activates; breadcrumb visible on Tron's device |

## Dependencies
- **Requires:** T131 (file-browser symlinks baseline — the listings T148 adds the header to)
- **Coordinate-with:** T144 / T147 (same `/md/` renderer module — keep changes well-scoped to avoid conflicts), T143 (R17.27 "every typed reference a clickable link" — T148 makes path segments first-class links)
- **Enables:** breadcrumb navigation across the file-browser

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron quote into the Traceability block above; anchors / replaces the planner-suggested `requirement:uuid` with req's canonical one; closes any scope ambiguity (e.g. whether the leading `/md/` segment is shown / clickable)
2. **robbin-architect** designs: segment-split + href-cumulative logic; visual separator styling; `rb-file-tree` mirroring decision; writes the Design section here
3. **robbin-expert** implements per the design in one commit-set; carries the rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS8 + visual sweep across multiple subtrees; commits the verification report into the QA Audit section here

## Definition of Done
- [ ] All AC met (AC1–AC10)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T141 / T144 / T147
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T148. CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC9 + DoD (learnings #15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:806b3ad4` with req's canonical `requirement:uuid:e9f0a1b2` (from B9 capture, commit `4bb3f82`). Verbatim Tron quote anchored. Tron's example is concrete: "scenario/ 📁 index/" — each path segment becomes a clickable breadcrumb link. Planner summary was accurate. Ready for architect.

## Subtasks
None (atomic task; small UI / href change in one renderer module).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 12 (file-browser path-header breadcrumb)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 6 (small UX uplift completing the file-browser navigation surface alongside T144/T147)*
