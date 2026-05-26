[Back to README](../../README.md)

# Sprint 10 Planning — Contacts UI

## Sprint Goal
Make room members interactive: tapping a joined member opens their profile sheet
with a downloadable vCard. Wire up the existing-but-unreachable ProfileSheet/vCard
code path and ensure "tap anywhere on a badge" works.

## Sprint Overview
**Focus:** Member interaction, profile sheets, vCard download
**Team:** robbinTeam (PO, architect, expert, tester, req-eng, planner)
**Predecessor:** Sprint 9 (Room Identity) — closed, Tron QA-approved

## Task List

- [ ] [T81: Member Click → Profile Sheet → vCard Download](./task-81-member-click-vcard.md)
  **Status:** impl + testing DONE (v0.4.9; tester 6/6, c88b4eb) — Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  - Fix key mismatch: client reads `msg.user` not `msg.profile` (RoomView.ts:99)
  - rb-avatar `readonly` attr so badge avatars bubble click (tap-anywhere)
  - Listener-stacking guard (attach once, not per render)
  - vCard download from profile sheet
  - Bump v0.4.9 + sw.js cache (PWA update detection)
  - NOTE: AC6 (self-click→ProfileEditor) SUPERSEDED by T83

- [ ] [T82: vCard Button Visibility + ProfileSheet Avatar DRY](./task-82-vcard-visibility-avatar-dry.md)
  **Status:** impl + testing DONE (86256fa v0.5.0; tester 6/6, c88b4eb) — Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  - vCard button invisible (CSS contrast bug, not missing)
  - ProfileSheet avatar: replace duplicated inline `<img>` with `rb-avatar` (DRY)

- [ ] [T83: Self-Click Opens Profile Sheet, Not Profile Editor](./task-83-self-click-profile.md)
  **Status:** impl + testing DONE (c67bc11 v0.5.3; tester 6/6, c88b4eb) — Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  - Self-click in member list → read-only ProfileSheet (was ProfileEditor)
  - CHANGES T81 AC6 (Tron directive 2026-05-25)

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 3 (T81, T82, T83) |
| Tron QA-approved (Done) | 0/3 |
| Tested, awaiting Tron QA | 3/3 (T81, T82, T83 — tester 6/6) |

## Definition of Done
- [ ] Tapping a joined member (name/avatar/dot) opens their profile sheet
- [ ] "Download vCard" produces a .vcf
- [ ] Self-tap still opens ProfileEditor (regression preserved)
- [ ] Exactly one GET_USER_INFO per tap (no listener stacking)
- [ ] Lobby + ProfileEditor avatars stay editable (no readonly)
- [ ] v0.4.9 served (PWA update reaches device)
- [ ] No regression in Sprint 1-9

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-25
**Sprint:** Sprint 10 — Contacts UI
