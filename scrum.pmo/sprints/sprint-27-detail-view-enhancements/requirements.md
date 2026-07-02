[Back to Planning](./planning.md)

# Sprint 27 — Detail View Enhancements — Requirements

**Source:** Tron directive 2026-07-01 (Task detail view enhancements), via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md).
**Note:** the companion request — a clickable link to the task's sprint MD file — is ALREADY COVERED by R22.1 (AC-2a/AC-2b: Forward Links -> MD task file). Only the visual statusChecklist render is new. v0.7.6 shipped both; this captures the statusChecklist requirement so its chain is traceable (retroactive, #126).

---

## Requirements

- [ ] **R27.1 — Task detail renders the status checklist visually**
  [requirement:uuid:90b82d00-7af1-40e9-992c-c55ca177c542]
  > TRON: render the task STATUS CHECKLIST from the MD (Planned / In Progress[refinement/creating test cases/implementing/testing] / QA Review / Done) directly in the detail view. The status is already in the task scenario unit (statusChecklist field) — render it visually.
  The Task detail view renders the task's status checklist VISUALLY from the unit's model.statusChecklist field (markdown) - showing the lifecycle states Planned / In Progress [refinement, creating test cases, implementing, testing] / QA Review / Done with per-item checked/unchecked state and nested sub-items indented - rather than leaving the status as raw text or unshown.
  *(impl: rb-task-detail.ts renderStatusChecklist, v0.7.6, from model.statusChecklist; Class RbTaskDetail. Code shipped BEFORE the req — #126 slip, chain completed retroactively.)*
  **Acceptance criteria:**
  - [ ] **(source)** The status checklist is read from the task unit's model.statusChecklist field (markdown), NOT re-parsed from the .md file on disk.
  - [ ] **(render)** The detail view renders it as a VISUAL checklist showing Planned / In Progress / QA Review / Done, each with a checked/unchecked state.
  - [ ] **(nested)** Nested sub-items under 'In Progress' render indented: refinement, creating test cases, implementing, testing.
  - [ ] **(placement)** The status checklist appears in the Task detail view alongside the MD-file link (R22.1).
  - [ ] **(verify)** Verified live (headless): a task carrying a statusChecklist renders the visual checklist matching the unit field.
  → [UC27.1: taskDetail.renderStatusChecklist](./planning.md#uc27-1) `[uc:uuid:050c5b9a-e5f4-46da-843f-44eb2b70994e]` *(placeholder — architect to refine + wire to RbTaskDetail.renderStatusChecklist)*

- [ ] **R27.2 — One canonical Class unit per code class (no per-req Class duplication)**
  [requirement:uuid:64965538-2725-4ef2-92e7-c1be6cd58d6f]
  > TRON (via PO): ONE canonical Class unit per code class — no per-req Class duplication; the chain reuses the existing Class node. By-construction fix (cannot-happen-again).
  The scenario graph holds AT MOST ONE canonical Class unit per code class. Wiring a UseCase to a Class REUSES the existing Class node (adds the method), never mints a duplicate. The existing 55 duplicate Class units (23 code classes) are collapsed to one canonical each — by-construction, this cannot happen again.
  *(audit: scrum.pmo/design-notes/class-unit-dedup-audit.md — 163 Class units / 108 code classes / 55 collapsible; architect flagged 4x RbTaskDetail.)*
  **Acceptance criteria:**
  - [ ] **(invariant)** The scenario graph holds AT MOST ONE Class unit per code class (by class name/identity); no per-req duplication.
  - [ ] **(reuse-on-wire)** Wiring a UC to a Class REUSES the existing Class node for that code class (adds the method to it), NEVER mints a new Class unit (the R27.1 pattern).
  - [ ] **(cleanup)** The 55 existing duplicate Class units (23 code classes, per audit) are collapsed to one canonical each: methods repointed + every UC.class ref rewritten to the canonical + emptied duplicates removed.
  - [ ] **(canonical-select)** The canonical is the unit with the most methods / already on the active chain; the collapse is dry-run + count FIRST (never silently drop a method or break a UC.class ref).
  - [ ] **(by-construction)** After the fix, minting a chain for a NEW req on an EXISTING code class cannot create a duplicate Class unit (wiring reuses).
  - [ ] **(verify)** A trace audit shows exactly ONE Class unit per code class; no chain fans out through duplicate Class nodes.
  → [UC27.2: chain.reuseCanonicalClass](./planning.md#uc27-2) `[uc:uuid:37c52953-654f-47c1-8710-b851b706849d]` *(placeholder — architect to refine; cleanup = a gated migration task)*


- [ ] **R27.3 — Per-task MD view generation (every 📄 link resolves, no 404)**
  [requirement:uuid:4f6d6402-fc8d-4d5d-9523-7e35af641944]
  > TRON (screenshot): the 📄 task links 404. FIX: generate-sprint-md emits one task-<slug>.md per task unit so every 📄 resolves; tasks must not point sourceFile at planning.md.
  generate-sprint-md emits ONE `task-<slug>.md` per Task unit (title / ACs / statusChecklist / chain) so every task's 📄 MD link resolves 200, not 404; Task units must NOT set model.sourceFile to planning.md (which collapses all tasks into one view).
  *(impl base: scripts/generate-sprint-md.ts (generateTaskMd/checkSprint) + rb-task-detail.ts:88 taskMdHref. Planner diagnosis: 404 when no per-task MD emitted.)*
  **Acceptance criteria:**
  - [ ] **(emit)** generate-sprint-md emits ONE task-<slug>.md per Task unit (title + ACs + statusChecklist + chain), not only planning.md.
  - [ ] **(no-collapse)** Task units do NOT set model.sourceFile to planning.md (which collapses all tasks into one shared view); each task MD is its own file.
  - [ ] **(resolve-200)** taskMdHref (rb-task-detail.ts:88) resolves to the per-task MD -> HTTP 200, never 404 (the Tron-visible bug is gone).
  - [ ] **(roundtrip)** The per-task MD is a generated VIEW (law #100); --check (check:sprint-md) byte-match holds for the per-task files.
  - [ ] **(verify)** Verified live: every task's 📄 link opens its own MD file.
  → [UC27.3: sprintMd.emitPerTask](./planning.md#uc27-3) `[uc:uuid:10ef702c-3141-45c9-b669-b5bed5f373b9]` *(placeholder — architect to refine; Class generate-sprint-md/ViewGenerator)*


- [ ] **R27.4 — Graph integrity: resolve/prune dangling UC refs + orphan Methods**
  [requirement:uuid:e205f7c3-97d8-474a-a4e6-053a7a7f30aa]
  > Derived: robbin-req baseline (verify_r27_2_migration.py) surfaced 12 dangling UC refs + 51 orphan Methods as PRE-EXISTING graph debt (not from R27.2 dedup). PO ratified capture as a separate cleanup req.
  Resolve/prune the pre-existing dangling UC references + orphan Methods so the graph has ZERO broken edges; then a CI gate prevents recurrence. Baseline: 12 dangling (10 -> dead RbDetailView f2f84ce3 repoint to canonical, 1 -> dead Method, 1 -> a 'TODO-' placeholder string) + 51 orphan Methods.
  *(measured: verify_r27_2_migration.py; enforce via trace:audit:strict (R24.5). Independent of R27.2 — 0 of the 12 intersect the dup-collapse set.)*
  **Acceptance criteria:**
  - [ ] **(no-dangling)** Every UseCase class / classes[] / method reference resolves to an existing unit — 0 dangling UC refs.
  - [ ] **(no-orphan)** Every Method unit is owned by a Class that lists it in methods[] — 0 orphan Methods.
  - [ ] **(repair-dangling)** The 12 dangling are repaired: the 10 dead-RbDetailView refs are repointed to the live canonical RbDetailView; the dead-Method ref + the 'TODO-' placeholder ref are triaged (repoint OR remove) with a reason.
  - [ ] **(repair-orphan)** The 51 orphan Methods are triaged: attached to their owning Class OR pruned if truly dead — dry-run + count FIRST, never silently drop a real Method.
  - [ ] **(by-construction)** trace:audit:strict (R24.5) FAILS on any dangling UC ref or orphan Method — recurrence is prevented at the CI gate.
  - [ ] **(verify)** Post-cleanup re-measure: 0 dangling UC refs, 0 orphan Methods.
  → [UC27.4: graph.repairIntegrity](./planning.md#uc27-4) `[uc:uuid:f7a06e18-5237-4640-a731-0575bc965917]` *(placeholder — architect to refine; gated migration task)*


- [ ] **R27.5 — Calibrate trace-audit orphan metric to be meaningful** *(low priority; metric is reported-only; planner schedules, likely S28)*
  [requirement:uuid:f48fbf5d-e75e-43c3-9a0c-80bbd6e503bc]
  > Derived: reconciling the audit's 2207 orphans vs R27.4's 51 orphan-Methods (req read of trace-audit.ts + expert breakdown). PO ratified capture 2026-07-01.
  Make the trace-audit orphan metric MEANINGFUL: a non-zero count should indicate real chain debt, not benign never-zero data. Add non-chain types to ORPHAN_BY_DESIGN + add Requirement->tasks / Sprint-roots to the canonical walk. Expected ~2207 -> real-chain-orphans only.
  *(evidence: expert breakdown ~1600 benign non-chain + ~382 walk-gap + small real-51 overlap. Instrument = scripts/trace-audit.ts CANONICAL_FORWARD / ORPHAN_BY_DESIGN_TYPES.)*
  **Acceptance criteria:**
  - [ ] **(exempt-types)** Non-chain unit types (TestCase/Device/File/Room/Skill/Bug/Phone/Profile/WebItem/Message/Company/Email/User/Gate/CurrentSprint) are added to ORPHAN_BY_DESIGN_TYPES so they are excluded from the reachability orphan count.
  - [ ] **(walk-gap)** CANONICAL_FORWARD adds Requirement->tasks and the walk also roots from Sprint units (Sprint->tasks/requirements), so Tasks + their subtrees are reachable — closing the ~382-unit walk-gap.
  - [ ] **(expected)** After calibration the orphan metric drops from ~2207 to the real chain-orphans only (aligns with R27.4's METHOD-scoped count, ~0 post-R27.4).
  - [ ] **(honest-instrument)** A non-zero orphan count now indicates REAL chain debt, not benign non-chain data; the metric becomes trustworthy enough to hard-gate.
  - [ ] **(verify)** Re-run trace:audit post-calibration: benign non-chain data no longer counted; the number reflects only real chain-orphans.
  → [UC27.5: traceAudit.calibrateOrphanMetric](./planning.md#uc27-5) `[uc:uuid:5ff15c57-503c-45f7-a4c0-82f7969d3646]` *(placeholder — architect to refine; Class trace-audit)*


- [ ] **R27.7 — WebItem type-aware preview drawer** *(Tron directive 2026-07-02; regression v0.7.8 + enhancement)*
  [requirement:uuid:54002f11-89de-42c6-9c56-6b670053a435]
  > TRON: v0.6.56 had a WebItem preview; v0.7.8 KILLED it when mailto handling routed ALL webitems to the launcher-card. Restore + enhance: type-aware preview (http/https live + proxy fallback, pdf embed), launcher only for mailto/message/tel/calendar, preview-first layout, zoom preserved with reset-overlay, routing BY type so a new scheme never regresses preview.
  The WebItem detail drawer renders a TYPE-AWARE preview (http/https live iframe + server-proxy fallback, pdf embed; launcher for mailto/message/tel/calendar), preview-first layout, zoom+pan preserved with a reset-zoom overlay, routed BY WebItem type so adding a scheme never kills preview for others.
  *(regression: v0.7.8 mailto->launcher routed ALL webitems; v0.6.56 had preview. crossRef R22.2 drawer pan/zoom.)*
  **Acceptance criteria:**
  - [ ] **(http-preview)** An http/https WebItem shows a LIVE preview (iframe/embed of the URL) in the detail drawer.
  - [ ] **(proxy-fallback)** When CORS/X-Frame-Options blocks the iframe, the server SIDE-PROXIES the URL (server fetches it) and the preview renders the server-proxied content - never a dead/blank frame.
  - [ ] **(pdf-embed)** A pdf WebItem/file renders a pdf preview embed.
  - [ ] **(launcher-only)** mailto / message: / tel / calendar show NO preview and a launcher/Open card that opens in the original app; this 'different handling' must NOT kill http/https preview.
  - [ ] **(layout-previewable)** Previewable items (http/https/pdf) layout order = [handle] -> [action buttons: Preview / NewTab] -> [PREVIEW pane] -> [file details BELOW]; preview-first, details below (reversed from the old details-first order).
  - [ ] **(layout-launcher)** Non-previewable items use the launcher layout: details + Open below the handle.
  - [ ] **(zoom-preserved)** Zoom + pan is preserved (R22.2 / R25.x); the RESET-ZOOM control is an OVERLAY button INSIDE the preview pane, NOT in the action-button row.
  - [ ] **(action-row)** The action buttons (Preview / NewTab / Open) sit immediately below the drawer handle.
  - [ ] **(routing-by-type)** Routing is BY WebItem type (url-scheme / content-type) via a type-dispatch; adding a NEW scheme can never kill preview for other types (regression-proof, correct-by-construction).
  → [UC27.7: webItemDrawer.previewByType](./planning.md#uc27-7) `[uc:uuid:d48b4dda-ee20-4af5-9136-d492f4702e1a]` *(placeholder — architect to refine; Class RbDetailDrawer/WebItemPreview + server proxy)*


---

## Traceability Matrix

| Req | Name | Requirement UUID | UC placeholder UUID |
|-----|------|------------------|---------------------|
| R27.1 | Task detail renders status checklist visually | 90b82d00-7af1-40e9-992c-c55ca177c542 | 050c5b9a-e5f4-46da-843f-44eb2b70994e |
| R27.2 | One canonical Class unit per code class | 64965538-2725-4ef2-92e7-c1be6cd58d6f | 37c52953-654f-47c1-8710-b851b706849d |
| R27.3 | Per-task MD view generation (📄 links resolve) | 4f6d6402-fc8d-4d5d-9523-7e35af641944 | 10ef702c-3141-45c9-b669-b5bed5f373b9 |
| R27.4 | Graph integrity: dangling UC refs + orphan Methods | e205f7c3-97d8-474a-a4e6-053a7a7f30aa | f7a06e18-5237-4640-a731-0575bc965917 |
| R27.7 | WebItem type-aware preview drawer | 54002f11-89de-42c6-9c56-6b670053a435 | d48b4dda-ee20-4af5-9136-d492f4702e1a |
| R27.5 | Calibrate trace-audit orphan metric (meaningful) | f48fbf5d-e75e-43c3-9a0c-80bbd6e503bc | 5ff15c57-503c-45f7-a4c0-82f7969d3646 |

*Captured by robbin-req 2026-07-01. MD-link = R22.1 (covered). statusChecklist render = R27.1 (new, v0.7.6 retroactive-chain).*
