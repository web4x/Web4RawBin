# Tester Queue Brief — LIVE (2026-09-06 overnight, to 09:00 CET)

**Prod = v0.8.204.** T37.20 + T37.20.1 (DnD drop contract) = QA-Review, your gates GREEN (v0.8.202/203/204). Overnight continuous-gating + deploy-watcher mode: gate each version bump as it lands.

## THE QUEUE (authoritative, pull top-down)
→ **`scrum.pmo/S37-overnight-queue.md`** — 29 Planned S37 tasks, TIER-A first. Deadline: S37 COMPLETE by 09:00. (NOT PRIO-2/Folder-Room-File — that's a different sprint.)

## YOUR TIER-A lints (you own + build — cheapest, pull first)
- **T37.35** `33b28f6b` — AXIS-2 task↔req AC-parity lint (seeds the 6-vs-7 RED)
- **T37.36** `993b3f2d` — AXIS-3 QA-is-a-switch-state validity lint (seeds T40.85 RED)
- **T37.37** `e48a1e0a` — AXIS-4 drift-metric completeness lint (seeds 7-vs-200 RED)

## EXPERT builds to RED-BASELINE (gate GREEN on their deploy)
- **T37.32** `b43278f7` — gate-harness invoke-or-mark-broken (FIRST)
- **T37.28.1** `bd0e5f4a` · **.2** `25772198` · **.3** `968d966d` · **.4** `2af98c11` · **.5** `afe976e3` — freshness guards
- TIER-B next: T37.4 self-heal, T37.33 referential-integrity, T37.28.6 cycle-guard, T37.38 rolled-render, T37.23 ssh-discovery

## T37.20 slices — SUBSUMED by shipped contract (no build; PO ruling pending → flip QA-Review, NOT Done)
.2 file-drags · .3 details-render · .4 serialize-fleet · 37.39 Image · 37.40 CalendarEntry. `.5` per-target BITE = your lints likely cover it. **`.6` DEVICE @390 = YOUR real-device acceptance of the whole contract** (in the accept list scrum.pmo/S37-tron-acceptance-2200cet.md).

**0 Done till Tron — flip to QA-Review, never Done.** Rewind-you: this brief is live as of v0.8.204; the queue file is the source of truth.
