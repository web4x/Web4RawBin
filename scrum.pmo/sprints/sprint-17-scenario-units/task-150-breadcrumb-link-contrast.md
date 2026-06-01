[Back to Sprint 17 Planning](./planning.md)

# T150: File-browser breadcrumb link color contrast fix (CSS)

[task:uuid:0da44cbe-6f10-4fb5-a11a-6c4a7e9c17f4]

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
1. **robbin-req** — capture the verbatim Tron quote for this directive; replace the planner-suggested `requirement:uuid` below with req's canonical one if different; confirm contrast target (WCAG AA / AAA / Tron-specific values)
2. **robbin-architect** — design the CSS contrast fix: pick concrete colors (visited / unvisited / hover) that pass the chosen contrast standard on the file-browser background; decide whether the fix applies to T148 breadcrumb segments only OR also to T144/T147 row anchors that share styling; update `src/public/app.css` (or wherever the file-browser styling lives — architect names it)
3. **robbin-expert** — apply the CSS values per architect's design; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — visual + contrast-checker verification on the file-browser breadcrumb across multiple subtrees (`/md/scenarios/sprints.md/`, `/md/scenarios/sprints.json/`, `/md/scenarios/index/`); regression on T148 (when it lands) + T144/T147 row anchors

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:0da44cbe-6f10-4fb5-a11a-6c4a7e9c17f4]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng):** *(awaiting req-eng B-entry / verbatim anchor — PO 2026-06-01 directed stand-up; req capturing literal)*
  - **Breadcrumb contrast requirement (planner-suggested; req-eng to anchor/override on capture)**
    `[requirement:uuid:7601a6c5-46ea-4c88-a620-0defda065d93]`
    Planner summary (req to confirm / correct from Tron's literal):
    > T148 makes path-header segments clickable, but the link colors blend
    > into the file-browser background — low contrast makes the breadcrumb
    > hard to read. Pick a color scheme (unvisited / visited / hover) that
    > reads cleanly against the file-browser surface, consistent with the
    > rest of the app's link styling.
- down
  - None (atomic task; small CSS-only change)
- follows
  - [T148: File-browser path-header clickable → parent dir](./task-148-file-browser-path-header-clickable.md) — adds the breadcrumb T150 styles
  - [T58: Link contrast on /md/ pages](../sprint-7-encrypted-storage/task-58-link-contrast.md) — historical link-contrast precedent (white / light-blue scheme; architect may reuse / adapt)
  - [T144: File-browser display fixes](./task-144-file-browser-display-fixes.md) — row anchors that may share styling
  - [T147: `.md` directory listing symmetric icons](./task-147-md-listing-chain-link-icon.md) — row anchors on `.md` side
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** breadcrumb contrast (above; planner-suggested → req-eng anchor)
  - **use case:** UC-TBD (architect — likely `fileBrowser.renderPathHeader` styling, sibling to T148's rendering UC)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect may extend the existing T148 UC's notes (no new UC necessarily)
  - **class/method:** `src/public/app.css` (or file-browser-specific stylesheet — architect names it)

## Context

T148 (PO 2026-06-01, currently 📝 — req anchored `555ca7c`, awaiting architect)
introduces a clickable breadcrumb in the `/md/<path>` listings. Tron flagged
that with the breadcrumb segments now being anchors, the **link color
contrast** against the file-browser background is poor — segments blend in
and are hard to identify as clickable. T150 is the small CSS fix that
follows. Historical precedent: T58 (Sprint 7) chose white / light-blue
for link contrast on `/md/` pages — architect may reuse or adapt that
scheme for the breadcrumb.

## Intention

### Why this task exists
- T148 adds clickable breadcrumb segments; without contrast, the affordance is invisible
- Without a clear contrast fix, T148's UX benefit is lost

### Problems this task solves
- Breadcrumb link color blends into file-browser background
- Visited / unvisited / hover states not distinguishable

### How it solves them
- Pick concrete colors for the three link states that pass a contrast standard
- Apply via CSS scoped to the file-browser breadcrumb (and any sibling anchors that share the bug)

## Acceptance Criteria
- [ ] AC1 — Breadcrumb link unvisited color reads cleanly against the file-browser background (contrast ≥ WCAG AA, architect confirms exact target)
- [ ] AC2 — Visited link color distinct from unvisited; still legible
- [ ] AC3 — Hover state visually distinct (color change, underline, or both — architect decides)
- [ ] AC4 — Consistent with existing link styling in the rest of the app (T58 precedent if architect adopts it)
- [ ] AC5 — No regression on T144 / T147 row anchors (their colors unchanged unless architect explicitly scopes the fix wider)
- [ ] AC6 — `npm run build` succeeds; all existing tests pass
- [ ] AC7 — **Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version" bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as the user-facing CSS change. (c) STATIC_SHELL: exempt (CSS-only)
- [ ] AC8 — All 4 roles committed work in this file

## Test Scenarios
File: visual + contrast-checker (no automated test typically for color contrast; architect/tester decides if a snapshot test is worth adding).

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Open `/md/scenarios/sprints.md/task/` | Breadcrumb segments visually distinct from background; clickable affordance clear |
| TS2 | Click an unvisited segment, return | Visited color distinct from unvisited on subsequent view |
| TS3 | Hover a segment | Hover state visible (color change or underline) |
| TS4 | Contrast check (e.g. browser DevTools Accessibility) | All three states meet the target standard |
| TS5 | Visual on `/md/scenarios/sprints.json/`, `/md/scenarios/index/` | Same fix applies; consistent across subtrees |
| TS6 | Regression: T144 `.json` row anchors, T147 `.md` row anchors | Unchanged (unless architect scoped fix wider) |
| TS7 | Rule-pair post-bump | New CACHE_NAME activates; updated CSS visible on Tron's device |

## Dependencies
- **Requires:** T148 (provides the breadcrumb segments T150 styles)
- **Coordinate-with:** T144 / T147 (sibling anchors that may share styling — architect decides scope), T58 (historical precedent — may adopt scheme)
- **Enables:** legible breadcrumb navigation in the file-browser

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron quote into the Traceability block above; anchors / replaces the planner-suggested `requirement:uuid` with req's canonical one; closes any scope ambiguity (breadcrumb-only vs all file-browser anchors)
2. **robbin-architect** designs: chooses concrete colors (referencing T58 precedent if adopting); scopes the CSS change; decides if hover deserves additional treatment (underline + color)
3. **robbin-expert** applies the CSS in one commit-set; carries rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS7 + visual + contrast-checker; commits the verification report into the QA Audit section here

## Definition of Done
- [ ] All AC met (AC1–AC8)
- [ ] Rule-pair (a)+(b) ✓; (c) exempt (CSS-only)
- [ ] No regression on T144 / T147 / T148
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T150 (small CSS contrast fix). req-eng to capture the verbatim Tron quote and anchor (or replace) the planner-suggested `requirement:uuid` on the next pass. CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC7 + DoD (learnings #15+#16). Awaiting req anchor → architect design → expert impl → tester verify → Tron QA.

## Subtasks
None (atomic task; small CSS-only change).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 14 (file-browser breadcrumb link contrast)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 7 (small CSS polish on top of T148 breadcrumb; UX uplift)*
