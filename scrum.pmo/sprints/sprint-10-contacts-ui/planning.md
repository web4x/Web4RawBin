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
  **Status:** impl-done (v0.4.9) — testing (robbin-tester, TS1-TS5) + Tron QA pending
  **Owner:** robbin-expert (implement), robbin-tester (verify)
  - Fix key mismatch: client reads `msg.user` not `msg.profile` (RoomView.ts:99)
  - rb-avatar `readonly` attr so badge avatars bubble click (tap-anywhere)
  - Listener-stacking guard (attach once, not per render)
  - vCard download from profile sheet
  - Bump v0.4.9 + sw.js cache (PWA update detection)

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 1 (T81) — sprint opening |
| Tron QA-approved (Done) | 0/1 |
| Impl-done, testing+QA pending | 1 (T81, v0.4.9) |

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
