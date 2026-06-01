[Back to Sprint 17 Planning](./planning.md)

# T147: Chain-link icon in `/md/` directory listing for `scenarios/sprints.md/` subtrees (symmetric UX with `.json` side)

[task:uuid:ea70d80c-66e8-459a-af3d-74b137341303]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (req → architect — `2ff001b` architect design + `0d36b4d` req-eng B8 anchor (verbatim Tron quote + canonical `requirement:uuid:d8e9f0a1-…` replaced planner-suggested) — **req backfill DONE**)
  - [ ] creating test cases
  - [x] implementing (`111f0c8` v0.5.43 — rule-pair (a)+(b) ✓: package.json + sw.js CACHE_NAME → rawbin-v0.5.43)
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.
> **Tron plan-ahead-only directive:** no agent kick-off yet (file is staged for
> req-eng to anchor the literal Tron quote; then architect, then expert, then tester).

## Assigned
**Owners (CMM4 4-role, per learnings #18) — sequence req → architect → expert → tester:**
1. **robbin-req** — capture the verbatim Tron quote for this directive (the `.md`-side symmetric icon directive); replace the planner-suggested `requirement:uuid` below with req's canonical one if different; confirm the icon legend matches Tron's literal (📋 🔗 ✏️ vs any variation)
2. **robbin-architect** — design the renderer change: add chain-link 🔗 (and edit ✏️, and the leading 📋 row-type icon — per T144's symmetric .json scheme) to every row in `/md/scenarios/sprints.md/<class>/...` listings; resolve href targets (🔗 → `scenario/index/<prefix>/<uuid>.scenario.json` canonical; ✏️ → `/edit/` route); ensure ordering matches T144 (🔗 BEFORE ✏️); decide whether `rb-file-tree` mirrors the new icons; update `scrum.pmo/standards/traceability-standard.md` if the icon legend belongs there
3. **robbin-expert** — implement per architect's design in `server.ts` `/md/` directory listing renderer + `rb-file-tree` if mirrored; carry rule-pair (a)+(b) in the impl commit-set
4. **robbin-tester** — visual + click-through verification on `/md/scenarios/sprints.md/<class>/` listings across multiple sprints (S17 + S16) and classes (task / requirement / usecase); regression on T144 `.json` side (still works, ordering still `🔗 ✏️`)

**This file is the single source of truth.** No chat clarification.

## Traceability

`[task:uuid:ea70d80c-66e8-459a-af3d-74b137341303]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **Tron quote capture (req-eng anchored 2026-06-01):** B8 in [scrum.pmo/backlog.md](../../backlog.md), commit `f3cc50c`
  - **B8 requirement** `[requirement:uuid:d8e9f0a1-b2c3-4d4e-a5f6-78901234b8c8]`
    Verbatim Tron quote:
    > "scenario/sprints.json/sprint-17-scenario-units/ shows sprint.json/task-*.json
    > with 🔗 + ✏️. i want it the same way linked for scenario/sprints.md/usecase/
    > (chain-tracemethodtoreq.md, index-get.md, index-put.md, ior-resolveclass.md)
    > and everything else in scenario/sprints.md"
- down
  - None (atomic task; small symmetric extension of T144)
- follows
  - [T144: File-browser display fixes — icon order + link targets (B5, 3 fixes)](./task-144-file-browser-display-fixes.md) — `.json`-side precedent T147 mirrors on the `.md` side
  - [T141: Chain-link icon → sprints.json symlink in generated MD views](./task-141-chain-link-icon-symlinks.md) — chain-link helper that T147 reuses
  - [T126: Generated views + 7 templates](./task-126-views.md) — produces the `.md` views T147 lists into
  - [T131: File-browser symlinks](./task-131-file-browser-symlinks.md) — symlink visibility T147 builds on
- chain (req → usecase → puml → class/method) — architect to fill on refinement
  - **requirement:** B8 `[requirement:uuid:d8e9f0a1-b2c3-4d4e-a5f6-78901234b8c8]` (req-eng anchored)
  - **use case:** UC-TBD (architect — likely `fileBrowser.renderMdListing`, sibling to `fileBrowser.renderListing` from T144)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml) — architect adds the new UC as a `UseCase` instance (rule #10 / T117)
  - **class/method:** `src/ts/server/server.ts` (`/md/` directory listing renderer — same module as T144), `src/public/ts/components/rb-file-tree.ts` if mirrored (TBD by architect)

## Context

T144 (`5da4054` v0.5.36 + `0101980` v0.5.38) restored click-through navigation on
the `.json` side of the scenario file-browser by setting per-row icon order to
`🔗 ✏️`, making 🔗 a real clickable anchor to the canonical
`scenario/index/<prefix>/<uuid>.scenario.json`, and resolving `.json` filename
clicks to the corresponding MD view. With T143's tree rework adding "every
typed reference a clickable link" (R17.27), the `.md` side now lags: the
`/md/scenarios/sprints.md/<class>/...` directory listings still render bare
filenames without the chain-link 🔗 (or its symmetric 📋 row-type and ✏️ edit
icons). Tron's directive (PO 2026-06-01): make the `.md` side **symmetric** —
same three icons, same order, same behaviors.

## Intention

### Why this task exists
- Asymmetry between `.json` and `.md` directory listings breaks the navigation
  affordance: users learn `📋 🔗 ✏️` on one side, expect it on the other
- T144 already established the renderer pattern + helpers; T147 is a small
  extension reusing that work for the `.md` route
- R17.27 ("every typed reference a clickable link") applies to both sides;
  T147 closes the gap on the `.md` side

### Problems this task solves
- `/md/scenarios/sprints.md/<class>/...` listings have no 🔗 — users cannot
  navigate from a `.md` view back to its canonical `.scenario.json`
- No ✏️ on the `.md` side — users cannot quick-edit from the listing
- No 📋 row-type indicator — class is implicit from path, not visible inline

### How it solves them
- Add the three icons to the `.md` listing renderer in `server.ts`, reusing
  the helper paths T144 established for the `.json` side
- 🔗 anchor href resolves to the canonical `scenario/index/<prefix>/<uuid>.scenario.json`
- ✏️ anchor href resolves to `/edit/<path-to-md-file>`
- 📋 leading icon indicates row class (architect chooses concrete glyph if
  Tron's quote leaves room; or uses class-specific icons like in T113)

## Acceptance Criteria
- [ ] **AC1 — Icon presence:** Every row in a `/md/scenarios/sprints.md/<class>/`
  listing shows `📋 🔗 ✏️` (or architect-finalized symmetric set) in that order
- [ ] **AC2 — 🔗 target:** Clicking 🔗 navigates to the canonical
  `/md/scenario/index/<prefix>/<uuid>.scenario.json` (same target as T144's
  `.json`-side 🔗) — 200 + valid JSON content
- [ ] **AC3 — ✏️ target:** Clicking ✏️ navigates to `/edit/<path-to-md-file>`
  (same edit route as the rest of the app)
- [ ] **AC4 — Order matches T144:** Icon order `🔗 ✏️` on the right (T144's
  rule); leading 📋 row-type indicator on the left (architect decides exact
  layout — must be consistent across `.json` and `.md` sides)
- [ ] **AC5 — Symmetry verified:** Side-by-side visual on `.json` and `.md`
  listings of the same class shows the same icon scheme
- [ ] **AC6 — `rb-file-tree` consistency:** If the component mirrors `/md/`
  rendering (architect decides), it shows the same icons in the same order
- [ ] **AC7 — Regression:** T144's `.json` side icons / order / click-through
  unchanged; T141's chain-link rendering inside `.md` views unchanged
- [ ] **AC8 — `npm run build` succeeds; all existing tests pass**
- [ ] **AC9 — Rule-pair (a)+(b) [learning #15+#16]:** `package.json` "version"
  bumped AND `src/public/sw.js` CACHE_NAME bumped in the SAME commit-set as
  the user-facing impl. (c) STATIC_SHELL: likely exempt — architect to confirm
- [ ] **AC10 — All 4 roles committed work in this file** (req anchor +
  architect design + expert impl + tester verify)

## Test Scenarios
File: `test/vitest/md-listing-icons.test.ts` (new — sibling to T144's `file-browser-display.test.ts`) + visual on `/md/scenarios/sprints.md/<class>/`.

| Test | Action | Expected |
|------|--------|----------|
| TS1 | Render `/md/scenarios/sprints.md/task/` listing | Each row shows `📋 🔗 ✏️` (or architect-finalized symmetric set); 🔗 left of ✏️ |
| TS2 | Click 🔗 on any `.md` row | Browser navigates to canonical `/md/scenario/index/<prefix>/<uuid>.scenario.json` — 200 + JSON content |
| TS3 | Click ✏️ on any `.md` row | Browser navigates to `/edit/<path-to-md-file>` — Monaco editor opens with the file |
| TS4 | Repeat TS1–TS3 across `sprints.md/requirement/`, `sprints.md/usecase/` | All consistent across class trees |
| TS5 | Side-by-side: `.json` and `.md` listings of the same class | Same icon scheme, same order |
| TS6 | Regression: T144 `.json` side still works | `📋 🔗 ✏️` order; 🔗 → `.scenario.json`; `.json` click → `.md` view |
| TS7 | Regression: T141 chain-link icons inside `.md` views | Unchanged |
| TS8 | Rule-pair post-bump | New CACHE_NAME activates; new icons visible on Tron's device |

## Dependencies
- **Requires:** T144 (icon order + 🔗 helper + click-through pattern on the `.json` side — T147 reuses), T141 (chain-link helper), T126 (generates the `.md` views T147 lists into), T131 (symlink file-browser baseline)
- **Coordinate-with:** T143 (R17.27 "every typed reference a clickable link" — T147 is the directory-listing instance), T146 (NAME-first format — T147 may use NAMEs as row labels)
- **Enables:** symmetric `.json` / `.md` navigation; completes the R17.27 surface in the file-browser

## Drive Plan (planner-coordinated, CMM4 4-role)
1. **robbin-req** captures the verbatim Tron quote for this directive into the Traceability block above; anchors / replaces the planner-suggested `requirement:uuid` with req's canonical one; closes any scope ambiguity with PO
2. **robbin-architect** designs the renderer change (reuses T144 helpers); finalizes the 📋 glyph (class-specific? generic?); decides `rb-file-tree` mirroring; updates `standards/traceability-standard.md` if icon legend belongs there; writes the Design section here
3. **robbin-expert** implements per the design in one commit-set; carries the rule-pair (a)+(b)
4. **robbin-tester** runs TS1–TS8 + side-by-side visual on multiple classes; commits the verification report into the QA Audit section here

## Definition of Done
- [ ] All AC met (AC1–AC10)
- [ ] Rule-pair (a)+(b) ✓; (c) STATIC_SHELL if applicable
- [ ] No regression on T144 / T141 / T126
- [ ] All 4 roles committed work
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-06-01: PO directed planner to stand up T147 immediately (Tron plan-ahead-only — no agent kick-off). CMM4 4-role engagement enforced (learnings #18); real v4 uuids (learning #17); rule-pair (a)+(b) baked into AC9 + DoD (learnings #15+#16).
- 2026-06-01 **robbin-req (anchor):** Replaced planner-suggested `requirement:uuid:ef503b38` with req's canonical `requirement:uuid:d8e9f0a1` (from B8 capture, commit `f3cc50c`). Verbatim Tron quote anchored. Planner summary was accurate — Tron's literal confirms: 🔗 + ✏️ on `.md` side same as `.json` side, explicitly names UseCase files (chain-tracemethodtoreq.md, index-get.md, index-put.md, ior-resolveclass.md) + "everything else in scenario/sprints.md". Ready for architect.

## Design (robbin-architect, 2026-06-01)

### Current state (server.ts line 585)
`.md` listing already has `symlinkIcon` (🔗 for symlinks) + `editIcon` (✏️). But generated `.md` views in `scenario/sprints.md/<class>/` are NOT symlinks — they're real files. So no 🔗 appears. Users can't navigate from a `.md` view back to its scenario JSON.

### The `.md` ↔ `.json` relationship
```
scenario/sprints.md/task/task-124-architecture.md        ← human view (by class)
scenario/sprints.json/sprint-17-.../task-124-architecture.json  ← scenario data (by sprint)
```
Same speaking-name slug, different extension, different directory tree.

### Fix: `scenarioLink` helper

New helper (add near line 579):
```typescript
const scenarioLink = (e: any) => {
  if (!relPath.startsWith('scenario/sprints.md/') || !e.name.endsWith('.md')) return '';
  const slug = e.name.replace('.md', '');
  const sprintsJsonDir = path.join(PROJECT_ROOT, 'scenario', 'sprints.json');
  try {
    for (const sprint of fsSync.readdirSync(sprintsJsonDir)) {
      const jsonPath = path.join(sprintsJsonDir, sprint, `${slug}.json`);
      if (fsSync.existsSync(jsonPath)) {
        return ` <a href="/edit/scenario/sprints.json/${sprint}/${slug}.json" style="text-decoration:none;font-size:0.8em" title="Scenario JSON">🔗</a>`;
      }
    }
  } catch {}
  return '';
};
```

**🔗 target:** `/edit/` route (per T144 AC2 decision — `/md/` 404s on `.json`).

### Updated `.md` row (line 585)

```typescript
const inSprintsMd = relPath.startsWith('scenario/sprints.md/');
const mds = entries.filter(e => isFileOrLink(e) && e.name.endsWith('.md'))
  .map(e => `<li>📄 <a href="/md/${relPath}${e.name}">${e.name}</a>${inSprintsMd ? scenarioLink(e) : symlinkIcon(e)}${editIcon(e.name)}</li>`);
```

In `sprints.md/` paths: `scenarioLink` (→ JSON) replaces `symlinkIcon` (redundant — generated files aren't symlinks). Outside `sprints.md/`: `symlinkIcon` as before.

Icon order per row: `📄 [filename] 🔗 ✏️` — same order as T144 `.json` side.

### rb-file-tree: NO change
`rb-file-tree.ts` is the `/edit/` route's code editor tree. The `/md/` listing is server-rendered. Independent surfaces. No mirroring needed.

### No new routes, no STATIC_SHELL change.

### Touchpoints
| File | Line | Change |
|------|------|--------|
| `server.ts` | ~579 | Add `scenarioLink` helper |
| `server.ts` | ~585 | `.md` row uses `scenarioLink` in `sprints.md/` |

## Subtasks
None (one helper + one line change).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 11 (`.md` directory listing symmetric with `.json` side)*
*Owners (CMM4): robbin-req → robbin-architect → robbin-expert → robbin-tester*
*Priority: 5 (small UX uplift completing T144's file-browser symmetry; rides on T143/T144/T146 foundation)*
