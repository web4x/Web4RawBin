# RawBin Project Backlog

Untriaged items awaiting Tron prioritization. **No sprint, no T-number** until
Tron triages an item into a feature sprint (then it gets the next sequential
T-number). Items here are NOT in any sprint's scope.

---

## Untriaged

- **B15 — Requirement name ≠ description, tasks[] empty**
  [requirement:uuid:e5f6a7b8-c9da-4ebf-0a12-345678900b15]
  > TRON DIRECTIVE: "data quality massively improved...requirement quality still poor. name and description should differ. name should be similar to filename but plain English. tasks traceability is still empty. needs to improve too."

  Three fixes on Requirement scenario units:
  1. `model.name` = plain-English short name (similar to filename slug but human-readable, NOT the full Tron quote)
  2. `model.description` = verbatim Tron quote (separate field — the quote IS the description, name is the summary)
  3. `model.tasks[]` populated from req→task forward links (the `→ [T<N>]` lines in requirements.md)

  Same diligent no-loss gate as T151/T152/T153.

  **Sprint:** TBD (planner to triage)
  **Touches:** Requirement scenario units, migration script (name/description split + tasks[] population), requirements.md parser
  **Related:** T146 (name-first format — B15 is the JSON-side of the same principle), T151 (MD→JSON discipline)

- **B14 — UC classes[] and requirement still empty**
  [requirement:uuid:d4e5f6a7-b8c9-4dae-f0a1-234567890b14]
  > TRON DIRECTIVE: "quality much better… classes array and requirements still empty and traceability therefore broken"

  T152 extension — UC scenario units must ALSO populate `model.classes[]` (parse PUML for class refs / UC owning class) and `model.requirement` (parse R17.x / R16.x refs in PUML body for free-form, and `requirement:` tag for structured format). Same diligent no-loss gate as T151/T152.

  **Sprint:** TBD (planner to triage — likely T152 follow-up or T152.1)
  **Touches:** UC data-quality script, PUML parser (class extraction + requirement extraction)
  **Related:** T152 (object+verb done, this closes classes+requirement), T151 (same discipline)

- **B13 — UseCase object+verb empty, traceability links missing**
  [requirement:uuid:c3d4e5f6-a7b8-4c9d-e0f1-234567890b13]
  > TRON DIRECTIVE: "i picked an arbitrary example...still no traceability content inside. object, verb empty even if it can be derived from name. bad data quality"

  UseCase scenario units MUST have populated `object` + `verb` fields (split from name, e.g. "unit.load" → object="unit", verb="load") + traceability links (tasks, classes, requirement) extracted from PUML source. Same diligent migration discipline as T151 — no information loss. Bad data quality is unacceptable per Tron.

  **Sprint:** TBD (planner to triage)
  **Touches:** migration script (UseCase emitter), PUML parser (extract UC→class/method/requirement edges), scenario JSON `model.object`/`model.verb`/traceability arrays
  **Related:** T151 (MD→JSON migration — same discipline), T149 (UC symlinks), T140 (source-location IOR)

- **B12 — Scenario JSON traceability arrays empty — migrate from MD**
  [requirement:uuid:b2c3d4e5-f6a7-4b8c-d9e0-123456780b12]
  > TRON DIRECTIVE: "the md file traceability content is good but its not at all reflected in the json scenarios. all tasks and usecases arrays with traceability reference are empty but the json should be the source from with the traceability section is generated. migrate the md traceability content diligently to data without loosing infos that you have in the plain text. this is a big diligent task for architect and req agent to fix that needs to be carefully tracked."

  Scenario JSON arrays (`children`, `tasks`, `requirements`, `useCases`, `classes`, `methods`, `tests`, `tracelinks`) are ALL empty despite the MD Traceability sections having rich content (up/down/follows/chain links). The JSON must be the source of truth — MD views are generated FROM it. Migration must parse the existing MD traceability content and populate the JSON arrays without losing any information from the plain text.

  **Tron-assigned roles:** architect + req-eng JOINTLY (big diligent task, carefully tracked).
  **Sprint:** TBD (planner to triage)
  **Touches:** migration script (T128), all `scenario/index/*/*.scenario.json` files, MD traceability parser, JSON array population logic
  **Scale:** Large — every scenario unit across all sprints needs traceability arrays populated

- **B11 — Breadcrumb link color unreadable**
  [requirement:uuid:a1b2c3d4-e5f6-4a7b-c8d9-012345670b11]
  > TRON DIRECTIVE: "file browser clickable path works well, but link text color is barely readable on background."

  File-browser breadcrumb path link color must have sufficient contrast against the background. Currently barely readable.

  **Sprint:** TBD (planner to triage)
  **Touches:** server.ts `/md/` directory listing breadcrumb CSS, possibly app.css

- **B10 — Migration must emit symlinks for ALL 9 classes, not just Task**
  [requirement:uuid:f0a1b2c3-d4e5-4f6a-b7c8-901234560ab0]
  > TRON DIRECTIVE: "no ! this is not expected behavior!! this is a big implication gap"
  > TRON DIRECTIVE (clarification): "same for requirements, classes methods"

  Context: UseCases (and Class/Method/Test/Requirement/TraceLink) have NO 🔗 in `/md/` listings because the T128 migration only emits Task symlinks in `sprints.json/<sprint>/`, not the other class instances. The 🔗 chain-link icon cannot resolve for non-Task entries because no symlink exists to point to.

  T128 migration extension MUST emit symlinks for ALL 9 classes — Tron explicitly confirms Requirements, Classes, and Methods are first-class symlinked too (not just UseCase). Full list: Sprint, Task, Requirement, UseCase, Class, Method, Test, TraceLink, User — each into `sprints.json/<sprint>/<class-dir>/<speaking-name>.json` so 🔗 resolves universally across the file browser. Without this, T147's symmetric icon UX is broken for 8 of 9 classes.

  **Sprint:** TBD (planner to triage — likely T128.x extension or new task)
  **Touches:** migration script (T128), symlink emission logic, `scenario/sprints.json/` tree structure
  **Blocks:** T147 (MD listing icons depend on symlinks existing for all classes)

- **B9 — File-browser path header clickable for parent navigation**
  [requirement:uuid:e9f0a1b2-c3d4-4e5f-a6b7-890123459bc9]
  > TRON DIRECTIVE: "in the file browser make the first line clickable eg scenario/ 📁 index/ so scenario is clickable and will go 1 folder up"

  The directory header line (current path breadcrumb, e.g. `scenario/ 📁 index/`) must have each path segment as a clickable link navigating to that directory level. Clicking a parent segment = go one folder up. Applies to both `/md/` server-rendered directory listing AND `rb-file-tree` client component.

  **Sprint:** TBD (planner to triage)
  **Touches:** server.ts `/md/` directory listing header, `rb-file-tree` component breadcrumb

- **B8 — MD view directory listings need 🔗 chain-link icons (parity with JSON tree)**
  [requirement:uuid:d8e9f0a1-b2c3-4d4e-a5f6-78901234b8c8]
  > TRON DIRECTIVE: "scenario/sprints.json/sprint-17-scenario-units/ shows sprint.json/task-*.json with 🔗 + ✏️. i want it the same way linked for scenario/sprints.md/usecase/ (chain-tracemethodtoreq.md, index-get.md, index-put.md, ior-resolveclass.md) and everything else in scenario/sprints.md"

  The `/md/` directory listing for `scenario/sprints.md/` subtrees must render the 🔗 chain-link icon next to each entry — same UX as the `scenario/sprints.json/` tree. The 🔗 links from each MD view file to its corresponding symlink in `scenario/sprints.json/<sprint>/<speaking-name>.json` (or to its source scenario unit in `scenario/index/`).

  **Sprint:** TBD (planner to triage — PLAN AHEAD, do NOT interrupt current work)
  **Touches:** server.ts `/md/` directory listing renderer (the code that builds `<li>` entries for `.md` files in scenario subtrees), T141 chain-link convention

- **B7 — Requirement entry format: short name + no duplicate content**
  [requirement:uuid:a8b9c0d1-e2f3-4a4b-b5c6-d7e8f9a0b1c7]
  > TRON DIRECTIVE: "requirement has duplicate content. keep the description and make a 3 to 5 word name as first line name of the requirement as a summary"

  **Format change for requirements.md entries (all sprints):**
  Each requirement entry becomes:
  1. **3-5 word NAME** as first line (summary/title)
  2. Tron literal description (the `> TRON DIRECTIVE:` blockquote — single source, no duplicate)
  3. `[requirement:uuid:<v4>]`
  4. Forward link(s) `→ [T<N>]`

  No restating the Tron quote in a separate description paragraph — the quote IS the description. Eliminates the current pattern where the same content appears twice (once in the quote, once paraphrased below it).

  **Scope:** Update the requirements.md template going forward + retro-clean duplicate content across S10-S17 requirements.md files.

  **Sprint:** TBD (planner to triage AFTER T143+T144 — reserved as T146)
  **Touches:** All `scrum.pmo/sprints/sprint-*/requirements.md` files, `scrum.pmo/standards/traceability-standard.md` (update the format spec)

  **Planner pre-record (queued — PO directive 2026-05-31, NOT yet stood up):**
  - **Next-T-number reserved:** **T146** (after T145/B6; T143+T144 must close first per Tron's no-interrupt directive)
  - **Reserved task:uuid (v4, planner-generated):** `1747c27f-e295-4933-b885-3a567072663e`
  - **Sprint placement (proposed):** sprint-17-scenario-units as **Phase 10 — Requirement entry format (NAME first) + speaky-name on 🔗** — natural fit with T141 chain-link icon + T143 tree rework + the broader S17 scenario-unit lineage. Alt: new S18 if Tron prefers a clean container; PO decides at triage.
  - **CMM4 4-role engagement (per learnings #18):**
    1. **robbin-req** (DONE for capture step — B7 anchored above) — additional req work: audit S10–S17 `requirements.md` for entries needing retro-clean; produce the per-sprint dup-list; confirm the 4-line format spec matches Tron's literal directive end-to-end
    2. **robbin-architect** — design the NAME-first format (markdown shape + validator rule for `trace-cli`); design the template change (T126 helper resolves requirement→NAME on chain-link 🔗 anchors; description renders as tooltip/`<details>`/hover preview); decide whether Task/UC/Class/Method/Test names normalize symmetrically at this layer; update `scrum.pmo/standards/traceability-standard.md`
    3. **robbin-expert** — implement: format migrator (one-shot script across S10–S17 `requirements.md`); T126 template helper + T141 chain-link anchor uses NAME; `trace-cli` validator; rule-pair (a)+(b) in the impl commit-set
    4. **robbin-tester** — verify 0 dups across S10–S17 `requirements.md`; visual on `/md/scenarios/sprints.md/...` shows NAME on 🔗 with hover/tooltip preview of description; regression on T141 chain-link rendering + T144 click-through; chain audit clean
  - **Rule-pair (a)+(b) [#15+#16]:** REQUIRED (user-facing template change must reach Tron's device via PWA). **(c) STATIC_SHELL:** likely exempt (no new route — architect confirms).
  - **Dependencies (block T146 stand-up until satisfied):**
    - **T143 land** (chain→tree rework) — the rendering layer T146 modifies is the tree-rework consumer
    - **T144 land** (file-browser fixes) — 🔗 anchor click-through T144 fixes is what T146 changes the display text of
    - **B7 captured** ✓ — req-eng anchored (a8b9c0d1-e2f3-4a4b-b5c6-d7e8f9a0b1c7)
  - **Estimated scope:** small-medium — format spec + template helper + one-shot migrator over S10–S17 + tester sweep. Architect's design will pin effort.
  - **Stand-up trigger:** when ALL of {T143 lands, T144 lands, Tron approves the format spec} are met. Until then, this remains B7 in the backlog — NOT a task file.
  - **Acceptance criteria (planner draft — refine on stand-up):**
    1. Format spec documented in `scrum.pmo/standards/traceability-standard.md`: each requirement entry = line-1 NAME (3–5 words), Tron literal blockquote (no dup), `[requirement:uuid:v4]`, forward link(s)
    2. S10–S17 `requirements.md` retro-cleaned: 0 NAME/description duplicates; every entry has a NAME line; every uuid is real v4 (learning #17)
    3. T126 ViewGenerator templates render NAME on chain-link 🔗 anchors (not UUID, not full description)
    4. Description renders as tooltip / hover-preview / `<details>` reveal — visible on demand
    5. T141 chain-link helper updated to use NAME; existing 🔗 rendering on migrated views shows speaky text
    6. `trace-cli` audit validates format (line-1 NAME present + no dup) and reports compliance per requirement entry
    7. No regression on T141 click-through (still resolves to symlink target post-T144)
    8. Rule-pair (a)+(b) in the impl commit-set
    9. All 4 roles committed work in the eventual T146 file

- **B6 — Lobby/room user name doesn't refresh after profile edit + User as scenario model**
  [requirement:uuid:f7a8b9c0-d1e2-4f3a-b4c5-d6e7f8a9b0c6]
  > TRON DIRECTIVE: "the vcard upload works. the editor is updated on all fields. but the user name in the lobby not and when the user immediately enters a room also not. make the user class use the same scenario model as the requirements, tasks and so on. handle every views update as a model update on user....as on all other classes that use scenario models."

  **BUG:** After profile edit (name change via ProfileEditor or vCard upload), the user name in the lobby (RoomBrowser name input) and in-room (member badge) does not refresh — still shows the old name until page reload.

  **ARCH FIX (Tron directive):** User joins the scenario-unit + ViewBus model. All view updates flow from `model.user` mutation — same pattern as Requirement, Task, and other scenario classes. No special-case view refresh; the ViewBus propagates model changes to all registered views automatically.

  **Sprint:** TBD (planner to triage AFTER T143+T144 complete — Tron: do NOT interrupt current work)
  **Touches:** User class (new scenario model), RoomBrowser (lobby name binding), RoomView/rb-member-badge (room name binding), ProfileEditor (model mutation on save), ViewBus integration

  **Planner pre-record (queued — PO directive 2026-05-31, NOT yet stood up):**
  - **Next-T-number to assign:** **T145** (T144 is the current highest; T145 free after T143+T144 land)
  - **Reserved task:uuid (v4, planner-generated):** `df4ea98b-b47c-4129-be73-a4047e919a6f`
  - **Sprint placement (proposed, planner-triage):** sprint-17-scenario-units/ as **Phase 9 — User class scenario-unit + ViewBus model parity** — natural fit: same scenario-unit + ViewBus pattern already established by S17 for Requirement/UseCase/Task/Class/Method/Test/TraceLink (T125/T126/T127/T134/T136 lineage). Alternative: a new sprint-18 if Tron prefers a clean container for "User domain unification" — PO decides at triage.
  - **CMM4 4-role engagement (per learnings #18):**
    1. **robbin-req** — anchor the verbatim Tron quote (already captured in B6 above); confirm the bug-AC (stale name in lobby + on first room enter) is distinct from the architecture-AC (User → scenario model + ViewBus); split into two requirement:uuids if needed (req decides)
    2. **robbin-architect** — design User as a scenario class on par with Requirement/UseCase/Task/Class/Method/Test/TraceLink: scenario JSON schema, ClassLoader, ScenarioIndex membership, ViewBus subscription pattern, View template, FSM (if applicable — likely simpler than Task FSM since User is data-shaped not workflow-shaped); decide how ProfileEditor/RoomBrowser/RoomView/rb-member-badge become Views in the ViewBus model; specify the back-fill/migration of existing user JSONs to the scenario-unit form
    3. **robbin-expert** — implement per architect's design: new User scenario class + loader + index + template + view-bus wiring; mutate via `model.user` only; migrate existing user JSONs (T128.x pattern); kill the special-case refresh paths that exist today
    4. **robbin-tester** — verify the stale-name bug fixed across all surfaces (lobby name input, in-room member badge, profile sheet, vCard re-export); chain audit shows User as first-class scenario unit; regression on Sprint 9 (room identity) + Sprint 17 (scenario model)
  - **Rule-pair (a)+(b) [#15+#16]:** REQUIRED (`package.json` bump + `sw.js` CACHE_NAME bump in the impl commit-set; PWA must reach Tron's device). **(c) STATIC_SHELL:** likely exempt — no new route — but architect to confirm.
  - **Dependencies (block T145 stand-up until satisfied):**
    - **T143 land** (chain→tree rework) — User joins the scenario-unit graph; the tree model T143 establishes is the consumer
    - **T144 land** (file-browser display fixes) — file-browser navigation for the new User scenarios depends on B5 fixes
    - **T136 close** (Requirement+UseCase migration extension) — confirms the migration pattern T145 follows for User
  - **Estimated scope:** medium — new scenario class (~T134 size) + migration (~T128.x exemplar size) + 4 view wirings (Lobby, RoomView, ProfileEditor, member-badge). Architect's design will pin effort.
  - **Stand-up trigger:** when ALL of {T143 closes (Tron QA OR PO directive), T144 closes (Tron QA OR PO directive), Tron approves the User class fit in scenario model} are met. Until then, this remains B6 in the backlog — NOT a task file in any sprint.
  - **Acceptance criteria (planner draft — refine on stand-up):**
    1. User is a scenario unit with `[user:uuid:v4]` identity (or class=User in scenario JSON)
    2. Stale-name bug fixed across lobby + first-room-enter + member badge
    3. Every view that displays user-name subscribes via ViewBus; no special-case refresh code
    4. chain audit shows User class first-class in `/trace` + `/md/scenarios/sprints.md/user/`
    5. No regression on Sprint 9 (rooms still load owner names) or Sprint 17 (other scenario classes unaffected)
    6. Rule-pair (a)+(b) in the impl commit-set
    7. All 4 roles committed work in this file

- **B5 — File-browser display fixes: icon order + link targets (3 issues)**
  [requirement:uuid:e6f7a8b9-c0d1-4e2f-a3b4-c5d6e7f8a9b5]
  > TRON DIRECTIVE (3 in one): (a) swap icon order: ✏️ 🔗 → 🔗 ✏️ (link before edit). (b) make 🔗 clickable → links to original scenario/index/.../uuid.scenario.json (the symlink target). (c) clicking the .json filename in symlink listings currently 404s → must link to the corresponding MD view (scenarios/sprints.md/task/<speaking>.md).

  Three fixes in the file-browser (`/md/` route + `rb-file-tree`):
  1. **Icon order:** chain-link 🔗 must come BEFORE edit ✏️ (currently reversed)
  2. **🔗 target:** chain-link icon must be a clickable link to the canonical `scenario/index/<prefix>/<uuid>.scenario.json` (the symlink target, not the symlink itself)
  3. **JSON 404 fix:** clicking a `.json` filename in symlink directory listings (`scenarios/sprints.json/`) currently 404s — must resolve to the corresponding generated MD view at `scenarios/sprints.md/<class>/<speaking-name>.md`

  **Sprint:** TBD (planner to triage)
  **Touches:** server.ts `/md/` directory listing renderer, `rb-file-tree` component, T141 chain-link implementation

- **B4 — Connection-Failed + Offline pages: add Reload button**
  [requirement:uuid:c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e90]
  > TRON DIRECTIVE: "add a reload button to page Connection Failed / Could not connect to server. Please refresh."
  > TRON DIRECTIVE (addendum): "same on the you are offline page"

  Two surfaces need a `[Reload]` button (`location.reload()`):
  1. **Connection-Failed page** — `app.ts` catch block (`<div class="error">...Please refresh...</div>`)
  2. **You-Are-Offline page** — `sw.js` OFFLINE_HTML (`<div class="offline">...Retry...</div>`)

  Note: the offline page already has a `<button class="retry" onclick="location.reload()">Retry</button>` — verify it works; the connection-failed page does NOT have one.

  **Sprint:** TBD (planner to triage) — promoted to T143 if planner assigns
  **Touches:** app.ts error HTML (~line 81), sw.js OFFLINE_HTML, possibly edit.ts equivalent

- **B3 — Profile gate: Upload vCard for fast onboarding (button + native drag-and-drop)**
  [requirement:uuid:a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d]
  > TRON DIRECTIVE: "on first time connect we have to fill out profile. add a upload vcard button at the top to speed up onboarding and initialize from the card. can be dropped natively from os drag and drop eg on iphone but also android and windows."

  Two input methods:
  1. **Upload button** at the TOP of the first-time-connect profile gate — user selects a .vcf file
  2. **Native OS drag-and-drop** — user drags a .vcf from the OS (iOS, Android, Windows) onto the form

  Both pre-fill profile fields from the vCard: FN→name, TEL→phone, URL→url, PHOTO→avatar.

  **Multi-platform AC (from Tron):** must work on iOS, Android, AND Windows native drag-and-drop.

  **Sprint:** TBD (planner to triage)
  **Touches:** ProfileEditor.ts (gate mode), vCard V3.0 parsing (new — currently only exports, never imports), HTML5 drag-and-drop API, mobile share-sheet / file-drop handling

### Triaged out
- **B2 — E2E test runs flood `data/` with orphan users/rooms** — **PROMOTED 2026-05-29**
  to [T118](./sprints/sprint-13-stability/task-118-e2e-cleanup.md) in Sprint 13
  (Stability). Tron triage via PO: confirmed as a real test-infra hygiene fix,
  E2E cousin of T100. Original analysis preserved below.

### B2 — E2E test runs flood `data/` with orphan users/rooms (no cleanup of users) [HISTORICAL — see T118]

**Filed:** 2026-05-29 · **Reporter:** Tron via robbin-planner
**Type:** test-infra hygiene / data leakage

**Evidence (measured 2026-05-29):**
- `data/users/` contains **263 user dirs**. Date distribution (mtime on profile.json):
  115 created **2026-05-26** (single day — coincides with heavy S13/S14 test runs),
  3 on 05-27, 2 on 05-25, 1 on 05-23.
- Sampled profile names include `E2E-Room-Test`, `E2E-Profile`, `RoomE2E`, `SshE2E`,
  `NameE2E`, `DeleteE2E`, `VisibleE2E`, `BadgeOwner`, `OrderUser` — all E2E spec names.
- Each `ensureLobby(page, name)` call enrolls a NEW user (fresh browser context per
  test) → persists in `data/users/<uuid>/` with SSH keys. Per-spec cleanup partial:

| Spec file | uses ensureLobby | calls cleanup |
|-----------|------------------|---------------|
| contacts-ui.spec.ts | 8 | **0** |
| lobby-card-badges.spec.ts | 2 | **0** |
| mobile-viewport.spec.ts | 2 | **0** |
| multi-room-lobby.spec.ts | 6 | **0** |
| profile-editor.spec.ts | 2 | **0** |
| room-identity.spec.ts | 8 | 2 (rooms only) |
| room-lifecycle.spec.ts | 2 | 2 (rooms only) |
| room-order.spec.ts | 2 | 2 (rooms only) |

`helpers.ts::cleanupTestRooms()` deletes ROOMS but **not the user dirs / SSH keys**.
Vitest is fine — `room-identity.test.ts`, `avatar-preserve.test.ts`, `trace-consistency.test.ts`
already use `os.tmpdir()` + `afterEach rmSync`. The leak is exclusively E2E hitting
the live server.

**Two strategies (Tron's question):**

| | Reuse fixed test users/rooms | Cleanup after tests |
|---|------------------------------|----------------------|
| Pros | Stable IDs; no enrollment overhead each run; smaller `data/` baseline | No fixture state to maintain; tests are self-contained |
| Cons | Cross-test state leakage; must reset between tests | Cleanup helper must cover users + rooms + SSH keys; every spec must opt in |
| Fits today's tests | Requires test rewrites | Drop-in (helpers.ts + per-spec `afterAll`) |

**Recommended (planner): Cleanup, in three pieces.**
1. **Helper:** add `cleanupTestUsers(pattern: RegExp)` to `test/e2e/helpers.ts`
   alongside `cleanupTestRooms`. Removes `data/users/<uuid>/` entirely (profile,
   rooms, SSH keys, files) for users whose `profile.name` matches the pattern.
   Honor T100 `DATA_DIR` override.
2. **Test convention:** every E2E spec MUST use a recognizable name prefix
   (e.g. `E2E-`, `T<task>-`, or per-spec slug) AND register `afterAll`
   cleanup for users + rooms it created. Lint/audit catches regressions.
3. **Backfill:** one-shot cleanup of the existing 263-user pile — match all
   known E2E name patterns (regex from current helper + the new ones), delete
   matching `data/users/<uuid>/` dirs. Real user dirs (Marcel, Admins, Marcel
   Surface Mini per S14 audit) preserved by negative-match guard.

**Optional follow-on:** test-user pool reuse pattern — keep 5 stable UUIDs
re-used across runs with state-reset before each test. Larger refactor,
defer until cleanup is proven.

**Sprint fit (suggestion, Tron decides):** S13 (Stability) — natural follow-on
to T100 (Test Data Isolation — vitest DATA_DIR override). Same story, E2E side.

**Proposed task scope:**
- T<next>: E2E user/room cleanup + backfill (cleanupTestUsers helper +
  per-spec afterAll wiring + one-shot orphan purge). Owner: expert (helper +
  spec wiring) + tester (verify no regressions, prod-data preserved). Effort
  ~3-4h. Acceptance: `data/users/` count stable after a full E2E run; backfill
  reduces baseline to the 3 real users + minimal known fixtures.

### Triaged out
- **B1 — Monaco editor back button → parent dir** — PROMOTED 2026-05-25 to
  [T84](./sprints/sprint-12-editor-fixes/task-84-editor-back-button.md) in
  Sprint 12 (Editor Fixes). Tron confirmed it as a bug (literal quote), so it
  graduated from backlog to a real task.

---
**Created:** 2026-05-25 · **Maintained by:** robbin-planner
