# T148: File-browser path-header clickable → parent dir navigation
[task:uuid:95e93fd2-de9e-4579-a857-59f69608f982]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `555ca7c` req-eng B9 anchor + `6f0c72c` architect design — breadcrumb path-header for /md/ listings)
  - [ ] creating test cases
  - [x] implementing (`eec6515` v0.5.44 — clickable breadcrumb path header in /md/ listings; rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME → rawbin-v0.5.44)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

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

## QA Audit & User Feedback

- 2026-06-01: PO directed planner to stand up T148. CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC9 + DoD (learnings #15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:806b3ad4` with req's canonical `requirement:uuid:e9f0a1b2` (from B9 capture, commit `4bb3f82`). Verbatim Tron quote anchored. Tron's example is concrete: "scenario/ 📁 index/" — each path segment becomes a clickable breadcrumb link. Planner summary was accurate. Ready for architect.

## Subtasks

None (one helper + one substitution).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 12 (file-browser path-header breadcrumb)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 6 (small UX uplift completing the file-browser navigation surface alongside T144/T147)*
