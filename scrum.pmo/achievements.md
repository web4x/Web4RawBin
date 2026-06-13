# RawBin Team Achievements

Milestones the robbinTeam earned, recognized by Tron.

---

## 🏆 v0.6.0 — "Best version ever" (2026-06-13)

Tron: *"best version you delivered ever."* Tagged `v0.6.0` (commit 6f5595cb9).

**What landed (all device-verified on Tron's real iPhone + desktop):**
- **In-room scenario tree** — Members + Files folders, members typed/named with online·offline state, files render + collapse + preview + Open-in-preview/Open-in-new-tab, auto-expand, tap-toggle. Unified onto the same `/trace` seed path (`rb-trace-tree`) — one component, no bespoke feed.
- **The iPhone touch bug — solved.** Root cause: the `rb-chat-sheet` `:host` overlay (60vh fixed, z-index:50) intercepted touches across the lower viewport — tree taps hit the invisible chat sheet. Fix: `:host { pointer-events: none }`. ~30 iterations to find, because the bug was a real-browser compositor/touch artifact.
- content-preview (image/html/url inline, iframe pinch + drawer drag-resize to 95vh), vCard photo+UUID, build-time version badge, Reset-PWA-Cache button, profile UUID, member retention + dedup (offline-keep, takeover-on-rejoin), legacy→UUID migration, test-data isolation (DATA_DIR + ONE systemTester/ONE room — zero pollution).

**How the team grew (the real achievement — process, not just features):**
The 30-iteration file-items marathon was a masterclass in *why* it kept failing and how the team fixed the process, not just the code (learnings #84–89):
- **The gate was the bottleneck.** Green-then-broke repeatedly because the test couldn't see the bug — wrong modality (mouse vs touch), wrong coords (page vs viewport), blind to compositor paint, trusting "fix applied" over probing the real target.
- **Match verification to the bug's physics:** paint-timing → structural gate + device-confirm (Playwright can't observe mid-paint); interaction → behavioral touch gate (`page.touchscreen.tap`, probe the real hit-target).
- **Gate-before-deploy, real conditions, real data, RED→GREEN reproducing tests.** No functional-first-then-claim.
- **Measurement integrity held to the digit:** SM's decisive over-credit scan + planner det-3x kept the chain count honest (173/198 genuine, chain-debt NOT counted as champagne) even at "best version ever."
- **Tron is not the tester** — the team built faithful gates so regressions are caught before they reach him.

**Honest state at milestone:** functional milestone real + device-verified; traceability chain 173/198 genuine champagne, 25 open (chain-debt + 3 follow-on bugs) — scheduled for the radical v0.5.x backfill + closed forward in Sprint 20 (traceability-first).

---
