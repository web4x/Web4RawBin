[Back to README](../../README.md) · [Sprints overview](../sprints.overview.md)

# Sprint 20 Planning — Radical Forward Planning (Traceability-First)

**Sprint unit:** `ior:instance:64af2638-d011-48c1-9d5a-dbfd9784efd6`

## Sprint Goal
Apply the S19 marathon lesson **forward**: chains are built **BEFORE/WITH** implementation, never functional-first-then-backfill. Nothing ships chain-open.

## THE DISCIPLINE (S20 standard, Tron 2026-06-13)
For **every** requirement, before/with implementation:
1. **Design the FULL chain** Req → UseCase → Class → Method → Implementation → Test (architect + planner, ahead of code).
2. **Write the Test FIRST** (or with the impl) — a real RED→GREEN reproducing test. In-room UX → Playwright + screenshot ([in-room-ux-e2e-test-standard](../../standards/in-room-ux-e2e-test-standard.md)); paint/timing → structural + device (R19.97 exception = Tron real-Chrome + `?debug=1`).
3. **Gate before deploy** — the gate must SEE the bug (match verification to the bug's physics). No champagne on a chain that isn't genuinely closed.
4. **Single-owner** task creation ([task-unit-single-owner-standard](../../standards/task-unit-single-owner-standard.md)): planner creates Task units, architect attaches the chain.

This reverses the S19 anti-pattern that produced 24 chain-debt reqs (R19.83-102) behind a functional v0.6.0.

## Task List

> **Progress legend:** ⏳ planned · 📝 designed · 🔧 implementing · ✅ impl-shipped · 🧪 testing · 🏁 Tron-QA-done · `[ ]` = Tron's Done gate.

### Carried-forward S19 open follow-ons (built as proper S20 chains)
- [ ] ⏳ R19.99 — broken-link in md-safari room (existing task `eff42eff`). S20 drives test-first full chain.
- [ ] ⏳ R19.100 — per-room file-render inversion (existing task `51d53769`). S20 drives test-first full chain.
- [ ] [⏳ T-room-create-folder-actions (R19.102)](../../../scenario/index/4/2/8/1/9/42819b8b-02f6-4104-8b6c-e0156783e38f.scenario.json) — task `42819b8b`, chain designed-ahead + E2E written first.

### Forward S20 requirements (test-first chains)
- [ ] [📝 T-detail-drawer-grab-bar (R20.2)](../../../scenario/index/f/e/8/c/4/fe8c43a5-cd15-4aed-ac5b-97df558d8fea.scenario.json) — task `fe8c43a5`. Default detail drawer nudge → wide grab-bar (DRY with chat drawer). Chain canonicalized (architect 0979045): UC detailDrawer.showGrabBar `3dc386fd` → Class RbDetailDrawer `0dd08b2f` → Method renderGrabBar `32384f12`; [PUML](./diagrams/r20-2-grab-bar-chain.puml). Next: tester RED grab-bar-match E2E **first**, then expert impl.

### Backfill tracking
- [ ] [🔧 T-s19-champagne-backfill-tracking](../../../scenario/index/4/5/0/c/b/450cb98a-4234-4f2c-9c9c-3c561750fb13.scenario.json) — task `450cb98a`. Tracks tonight's **22:07 scheduled** radical backfill of S19 v0.5.x chain-debt; planner re-scores det-3x + ground-truths each flip + reports honest count. Baseline 173/198.

## Forward requirements
Coordinate with **req-eng** for forward S20 requirements (each captured verbatim → full chain designed test-first). Compound source: `compound-requirement-source.md` (to be populated as Tron directs).

## Honest baseline entering S20
- Chain-complete (genuine champagne): **173 / 198** (41 excluded).
- Carried chain-debt: 21 (R19.83-97/88.A/101) + 3 open-bugs (R19.99/100/102). Tracked to true champagne via the 22:07 backfill + S20 discipline.

---

**Product Owner:** robbin-po (robbinTeam2:0.0) · **Tron:** TRONinterface
**Created:** 2026-06-13 · **Sprint:** Sprint 20 — Radical Forward Planning
