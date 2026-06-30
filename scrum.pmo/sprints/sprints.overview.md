[Back to README](../../README.md)

# RawBin — Sprints Overview

🏆 **[Team Achievements](../achievements.md)** — milestones recognized by Tron (v0.6.0 "best version ever").

Durable index of ALL sprints. Maintained by robbin-planner: every new sprint MUST
be added here AND to the README sprint list in the same commit it is created.

Status legend: **Done** = all tasks Tron QA-approved · **active** = in flight
(impl/test/QA) · **planned** = not yet started.

---

## 📌 CURRENT SPRINT — WIP=1 (Tron process directive 2026-06-14)

**Exactly ONE feature driven end-to-end (req→uc→class→method→impl→test→DELIVERED). REPLACED only when DELIVERED via version bump (patch + sw.js cache + git tag). No parallel batch — everything else is PAUSED.**

### ▶ CURRENT TASK: "Drawer/trace DETAIL works end-to-end" → target v0.6.23

The thing Tron keeps screenshotting broken. ONE focused feature, full chain to DELIVERED:
- **BUG8 + BUG10** — collection-renders-children (BOTH surfaces: /trace tree + in-room drawer)
- **BUG9** — leaf-renders-detail
- **BUG11** — URL-actions-work (HIGH regression)
- **ALSO completes the RbDetailDrawer champagne chains** (same methods: handleDragResize / renderFilePreview / openForRef / close — genuine impl+test). Task unit 3c7d1853.

**DELIVERY GATE:** works end-to-end (Tron screenshot OK) **AND** v0.6.23 shipped (patch bump + sw.js cache + git tag) → only THEN replace with the next CURRENT TASK.

**PAUSED until this delivers** (NOT driven): 6-item queue (Q1–Q5 / the rest of BUG set beyond 8-11), standalone champagne climb (folds into THIS), all other forward work. WIP=1 strict.

**Owner pipeline:** architect (UC/chain — done for champagne part) → expert (impl + bug fixes) → tester (E2E + screenshot) → planner (det-3x champagne closes + delivery-gate verify: version+sw.js+tag).

---

| # | Sprint | Status | Tasks | Planning |
|---|--------|--------|-------|----------|
| 1 | Foundation | Done | 11 | [planning](./sprint-01-rawbin-foundation/planning.md) |
| 2 | Identity & SSH | Done | 7 | [planning](./sprint-02-identity-ssh/planning.md) |
| 3 | E2E & Hardening | Done | 10 | [planning](./sprint-03-e2e-hardening/planning.md) |
| 4 | Traceability | Done | 8 | [planning](./sprint-04-traceability/planning.md) |
| 5 | PWA & Offline | Done | 8 | [planning](./sprint-05-pwa-offline/planning.md) |
| 6 | Web Components | Done | 8 | [planning](./sprint-06-web-components/planning.md) |
| 7 | Encrypted Storage | Done | 13 | [planning](./sprint-07-encrypted-storage/planning.md) |
| 8 | Monaco Editor | Done (Tron QA) | 14 | [planning](./sprint-08-monaco-editor/planning.md) |
| 9 | Room Identity | T74-77,79,80 Tron QA Done; T78 tested→awaiting Tron QA | 7 | [planning](./sprint-09-room-identity/planning.md) |
| 10 | Contacts UI | active — T81/82/83 tested, awaiting Tron QA | 3 | [planning](./sprint-10-contacts-ui/planning.md) |
| 11 | Traceability Standardization | active — T85/86 impl-done; T87-90 planned (S1-9 remediation); T119 planned (test-traceability retrofit, Tron 2026-05-29) | 7 | [planning](./sprint-11-traceability/planning.md) |
| 12 | Editor Fixes | active — T84 tested, awaiting Tron QA | 1 | [planning](./sprint-12-editor-fixes/planning.md) |
| 13 | Stability | active — 7 (T91-95,T100,T109) 🧪 awaiting Tron QA; T118 ✅ 317f41a (E2E cleanup); T130 ✅ 8539d57 v0.5.27 (md-preview MD_CSS nested-list rules) | 9 | [planning](./sprint-13-stability/planning.md) |
| 14 | Legacy Data Migration | ✅ migration complete — T96/97 migrated, T98 verify PASS, T99 gate-cleared + EXECUTED (legacy removed v0.5.19); regression+Tron QA pending | 4 | [planning](./sprint-14-legacy-migration/planning.md) |
| 15 | Traceability Browser & Object Model | active — all 8 impl-complete (v0.5.18); T101/102/103/105/106 tested→Tron QA; T104/107/108 testing | 8 | [planning](./sprint-15-traceability-browser/planning.md) |
| 16 | Traceability UX & DetailViews | active — Phase 1-3 all 8 ✅ (T110-117, v0.5.23+bdb74ec); Phase 4: T120/T122 ✅ (50d20be v0.5.25), T123 ✅ (2a28dd3 v0.5.26 pageNav sticky), T121 🔧 (Phase 2 C2a/C2b done, C1/C3/C5/C6/C7 pending) | 12 | [planning](./sprint-16-traceability-ux/planning.md) |
| 17 | Scenario Units / IOR Data Model & Class Views | active — 29 🧪 tester-verified (Tron QA batch ready, see scrum.pmo/tron-qa-batch-2026-06-05.md); T180 Track 1 awaits Tron DNS; T184/T185/T186 closed in-scope | 60+ | [planning](./sprint-17-scenario-units/planning.md) |
| 18 | Chain method-scope & role skills | active — DOGFOOD: T187 🔧 FIX-CYCLE ITER-2 (v0.5.89 NAV PASS but UC→Method over-narrows 0/should-be-1; expert v0.5.90 fix in flight; tester re-runs TS6-9 on redeploy); T190 🧪 strict-verified (v0.5.89 RE-RUN 8/8 PASS — append-only confirmed, DOM identity, scroll preserved); T188 ⏳ (ViewGenerator); T189 ⏳ (architect+req SKILL.md pending). PO honest-board 2026-06-05. | 4 + sub | [planning](./sprint-18-chain-method-scope/planning.md) |
| 19 | Room Handling | scenario-first stand-up 2026-06-10 (PO b0b6b8e8 + ln tree 364202fe): Sprint unit 97f513a1 + 14 R19.x Requirement units on disk + sprints.json/sprint-19-room-handling/{sprint.json, requirement/r19-1..14.json} symlinks. R19.x scope: room-as-scenario-unit + room editor, visibility PUBLIC/BY-INVITE-Apply-flow/PRIVATE-password, lifecycle LIVE/PERSISTENT (persistent-default after sprint), member add/remove, room UI drop-zone + Members/Files tree, files-as-units. Tasks pending req-signal decomposition complete. Source: [compound-requirement-source.md](./sprint-19-room-handling/compound-requirement-source.md). | 0 (req-signal pending) | scenario-unit-first (planning.md = generated VIEW per Tron 2026-06-10) |
| 20 | **Radical Forward Planning (Traceability-First) · WIP=1** | ACTIVE — the 📌 CURRENT SPRINT (top of this doc). Chains built BEFORE/WITH impl, Test-first, nothing ships chain-open. ONE Current Task driven end-to-end across all roles, replaced ONLY on version-bump delivery; no parallel batch. Sprint unit 64af2638. Carries forward S19 follow-ons (R19.99/100/102) + the WIP=1 drawer/trace work (BUG8/9/10/11 + RbDetailDrawer chains). **(Sprint 29 'Radical Forward Planning (WIP=1)' was a FICTION fork — merged here 2026-06-14 in the S29→S20 refactor; its WIP=1 method preserved at [wip1-method](./sprint-20-traceability-first/wip1-method-merged-from-fiction-sprint29.md).)** | WIP=1 | [planning](./sprint-20-traceability-first/planning.md) |
| 21 | Contact Identity | scenario-first stand-up 2026-06-28 (robbin-req): Sprint unit 1bdfaafa + 8 R21.x Requirement units on disk + sprints.json/sprint-21-contact-identity/{sprint.json, requirement/r21-1..8.json} symlinks. Scope: vCard-drop-with-photo, lobby first-load name fix, Phone/Email as alternate-UUID ln symlinks + device-link-not-new-user, Phone/Email/Address/Company first-class scenario units (class-method relationship pattern), Company shared (dedup by name), Address async-verified vs OpenStreetMap. Tron seed: +4915253844085 as first Phone unit on WODA.prod. UC placeholders pending architect refinement; tasks pending planner stand-up. | 9 | [planning](./sprint-21-contact-identity/planning.md) |
| 22 | Traceability View Fixes | scenario-first stand-up 2026-06-29 (robbin-req): Sprint unit 9996b46a + R22.1 (Task detail: one chain section + Forward Links to MD task file) on disk + sprints.json symlinks. Tron screenshot directive. UC-VF.1 placeholder pending architect refinement. | 4 | [planning](./sprint-22-traceability-view-fixes/planning.md) |
| 23 | Media Preview | scenario-first stand-up 2026-06-29 (robbin-req): Sprint unit 4a4a5d66 + R23.1 (audio HTML5 player) + R23.2 (YouTube embed) on disk + sprints.json symlinks. Tron Heartspaces-room directive. Extends R21.9 content preview. UC-MP.1/UC-MP.2 placeholders pending architect. | 3 | [planning](./sprint-23-media-preview/planning.md) |
| 24 | Traceability Skills | scenario-first stand-up 2026-06-29 (robbin-req): Sprint unit 04339450 + R24.1-R24.5 (Object.verb skill engine / pin mgmt / chain scoring / sprint-md ViewGenerator / traceability audit) on disk + sprints.json symlinks. PO main-goal: formalize existing scattered TS tools as one OOSH-like SKILL set. UC-SK.1-5 placeholders; planner briefs+builds tasks, architect designs, skill-expert owns chain tools. | 5 | [planning](./sprint-24-traceability-skills/planning.md) |
| 25 | Apple DnD | scenario-first stand-up 2026-06-29 (robbin-req): Sprint unit c7d700c6 + R25.1 (comprehensive DnD logging - capture dropped URL schemes) on disk + sprints.json symlinks. Tron directive + PO URL-scheme clarification: Apple DnD = URL schemes (mailto/webcal/calshow/maps/geo/tel/x-apple-reminder), R23.2 YouTube model. R25.2+ per-scheme handlers DEFERRED (measure-first from Tron-room logs). UC-DND.1 placeholder. | 3 | [planning](./sprint-25-apple-dnd/planning.md) |

**Task numbering:** global sequential. T1-T80 (S1-9), T81-83 (S10), T84 (S12),
T85-90 (S11), T91-95 (S13), T96-99 (S14), T100 (S13), T101-108 (S15), T109 (S13), T110-117 (S16), T118 (S13), T119 (S11), T120-123 (S16), T124-129 (S17 parents — sub-tasks T124.1+ allocated at refinement time), T130 (S13), T131-T186 (S17 follow-ons + extensions), T187-T190 (S18). Next new task = **T191**.

**Traceability & Standards:** [traceability matrix](../traceability-matrix.md)
(req→uc→puml→method→test index) · [standard](../standards/traceability-standard.md) ·
audits [S1](../standards/sprint-01-traceability-audit.md) /
[S2-9](../standards/sprints-2-9-traceability-audit.md) ·
[task template](../templates/task-template.md) · [backlog](../backlog.md)

---
**Maintained by:** robbin-planner (robbinTeam:1.0)
**Updated:** 2026-05-26
