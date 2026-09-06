# Sprint 37 — OVERNIGHT PULL QUEUE (to 09:00 CET)

**Pull top-down, do not wait for the PO.** Effort tiers measured from each unit's ACs + checklist depth. DoD is in Tron's terms (what he SEES / what can no longer break). **0 Done till Tron — flip to QA-Review, never Done.**

## TIER-A — CHEAP (<1h, a gate/lint/generator, no architecture) — PULL FIRST
| # | Task | DoD (what it guarantees) | Owner |
|---|------|--------------------------|-------|
| A1 | **T37.35** AXIS-2 AC-parity lint | The board can never again show a task with a different AC count than its requirement (the 6-vs-7 you caught is caught by construction) | tester |
| A2 | **T37.36** AXIS-3 QA-switch-state lint | A "done-pending-you" item whose evidence died flips itself back — the board stops lying that broken work is finished | tester |
| A3 | **T37.37** AXIS-4 drift-metric lint | The drift number can't undercount — every artifact is counted or explicitly declared excluded (no silent 7-vs-200) | tester |
| A4 | **T37.32** gate-harness invoke-or-mark-broken | Every gate either runs its real check or is loudly marked KNOWN-BROKEN (counted) — no gate silently passes on null | expert |
| A5 | **T37.28.1** boot-state freshness guard | The boot banner can't show a stale sprint/version — it derives from HEAD or refuses | expert |
| A6 | **T37.28.2** derived-slot (NEXT/CURRENT) freshness guard | The pin's current/next always derive from live state — no stale stored pointer (the exact pin-lies bug) | expert |
| A7 | **T37.28.3** deploy-instruction freshness guard | DEPLOY-STATE.md can't claim something is deployed that isn't — derived from branch reality | expert |
| A8 | **T37.28.4** req-satisfaction freshness guard | A requirement can't read "satisfied" unless a real covering task proves it | expert |
| A9 | **T37.28.5** guard-coverage freshness guard | "Covered" means the guard is actually in ci — never a hand-asserted flag | expert |
| A10 | **T37.41** `cb015b3d` harness-harden tree-node drop (machine-verify drag-onto-tree w/ synthetic unit-ref DataTransfer) | The folder-drop is machine-verified end-to-end → **removes the T37.20.4 caveat**, Tron just accepts. Tester takes AFTER A2. (customer-not-tester: machine-verify what CAN be) | tester |

## TIER-B — MEDIUM (a bounded build behind an existing seam)
| # | Task | DoD | Owner |
|---|------|-----|-------|
| B1 | **T37.4** objects self-heal (children 37.4.1/2/3 already QA) | Any drifted unit recomputes or refuses on read — nothing runs silently wrong; mostly built, validate the parent | expert |
| B2 | **T37.33** referential-integrity by construction | Every board ref resolves or the carry fails loud — no more dangling-ref pin outages (the R37.1 fail-close you saw) | tester |
| B3 | **T37.28.6** constraint-cycle freshness guard | A ruling expressed as task-deps can't form an unsatisfiable cycle undetected | expert |
| B4 | **T37.38** parent rolled-summary render | The current task in the pin shows its real rolled state (per-child) instead of a blank checklist | expert |
| B5 | **T37.23** server-manager root from ssh-config | Server root is discovered from on-disk config, not hardcoded to one machine | expert |

## TIER-C — HEAVY (architecture; will NOT close overnight — last)
| # | Task | DoD | Owner |
|---|------|-----|-------|
| C1 | **T37.28** truth-decay coordination root (ties the 6 guards) | Every authoritative artifact derives-per-read or carries a proven freshness guard — the whole no-stale-truth family | expert+req |
| C2 | **T37.22** IOR carries origin for cross-instance DnD (federation) | A dragged object across instances keeps class+host+path origin, reconciled with federation — no forked identity | expert |

## ✅ UNBLOCKED → TIER-A (2026-09-06: req upgraded R37.14-19 requirement ACs to failable/single-source, 35 total, task-md renders via coverage; PO OK'd into pull queue)
T37.14 (measured-random v4 ids) · T37.15 (store-once theme-only names) · T37.16 (never-RIPE-on-snapshot) · T37.17 (gates encode no snapshot) · T37.18 (gate resolves artifact same-way) · T37.19 (req-specific Class units root). **6 tasks now TIER-A — pullable; ACs live on their requirements.**

## ✅ T37.20.4 folder-drop — FIXED + QA-Review (served v0.8.205, no-op CLOSED)
- The full arc: flagged → held-to-verify → VERIFIED-RED (in-app unit on folder = silent no-op v0.8.204) → **FIXED v0.8.205**: in-app unit re-parents (POST `/api/room/<id>/move-unit` → 200 `action='reparented'`, `(root)` → `:files/MoveTarget/moveme.bin`); native upload still works; client keeps BOTH paths (`rb-object-item.ts:83-91`); both open/closed lints untouched.
- **⚠ CAVEAT ON THE ROW (not buried):** the end-to-end USER DRAG onto a tree node is INSTRUMENT-LIMITED — a synthetic webkit drag doesn't deliver the payload to that handler, so the tester verified the SERVER endpoint (the exact one the in-app path calls) + the client wiring BY READ. Mechanism + wiring proven; the full gesture needs **Tron's own drag** (same shape as T37.31 device-accept, one drag he does anyway on accept).
- **T37.20.4 `369b8636` → QA-Review.** Accept queue → 21.

## ★ T37.20 IMPLEMENTATION — RE-MEASURED vs what shipped tonight (SUBSUMED analysis — PO RULES, do NOT mark Done)
Shipped tonight: GoF **Proxy** (v0.8.202) + **MimeType.from Factory** + self-registering **mime registry** (v0.8.203) + per-class **render registry** (v0.8.204). Mapping each slice to it:
| Slice | Verdict | Why |
|-------|---------|-----|
| **T37.20.2** file-drags-as-file | **SUBSUMED** | the shared serialize+resolve contract mints a File unit on drag — the per-collection fallback is gone |
| **T37.20.3** details-render-every-selection | **SUBSUMED** | the per-class render registry (v0.8.204, 4/4 class-distinct) renders each unit's detail |
| **T37.20.4** ONE shared serializer+resolver fleet-wide | **SUBSUMED** | v0.8.202/203 IS the one shared contract (open/closed lint = 0, one register() per new target) |
| **T37.39** Image natural class | **SUBSUMED** | v0.8.203 Factory instantiates Image + v0.8.204 renders it as an image |
| **T37.40** CalendarEntry natural class | **SUBSUMED** | v0.8.203/204 instantiate + render CalendarEntry |
| **T37.20.5** per-target BITE stub-must-fail | **LIKELY SUBSUMED** | the open/closed + mutual-distinctness lints (d2f95670a) already stub-must-fail per class; a separate per-drop-target BITE may be redundant — PO confirm |
| **T37.20.6** DEVICE @390 | **NOT a build — Tron's device ACCEPTANCE** | the whole contract's real-device verify; belongs in the accept list, not the build queue |
**★ PO RULING (2026-09-06) — SPLIT, not a blanket flip:**
- **37.39 Image + 37.40 CalendarEntry = ✅ FLIPPED QA-Review** (directly gated, tester-measured image→Image / .ics→CalendarEntry, 4/4 class-distinct GREEN v0.8.204 d2f95670a; commit 5cafea364).
- **.2 file-drags / .3 details-render / .4 serialize-fleet = ⏳ TESTER VERIFIES each AC vs the shipped build, flips on THEIR verdict** (ACs are BROADER than what was measured — no inference-flip; that's the wrong-class-is-fine trap in board form).
- **.4 has concrete WORK (NOT subsumed):** the TREE folder drop-target (`rb-object-item.ts:82`) still reads `dataTransfer.files` ONLY → an in-app UNIT dropped on a folder is NOT contract-routed (expert finding; **R40.86 re-parent** unit→folder move). This is the proof .4 ("EVERY drop target") isn't done — board it.
- **.5 per-target BITE = 🔧 WORK (cheap, TIER-A)** — the per-target assertion nobody ran; it PROVES .4.
- **.6 DEVICE @390 = → moved to the acceptance list** (Tron's real-device confirm, not a build).
