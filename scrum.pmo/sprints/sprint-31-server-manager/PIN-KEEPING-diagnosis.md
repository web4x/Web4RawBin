# CurrentSprint PIN-KEEPING — root diagnosis + fix (robbin-architect, 2026-07-20)

PO/Tron: "planning and current keeping bug again" — the CurrentSprint pin's **current** slot is not keeping the actual in-progress task (recurring BUG-A/B/C/D-era pin bug). MEASURED on current disk (HEAD f5c35f94c v0.7.97). NEVER-ASSUME. Planner measuring pin state in parallel (owns the data half, below).

## MEASURED GROUND TRUTH (disk)
Persisted singleton `current-sprint-singleton-…001.scenario.json` `model.slots`:
- current = **Task 31.4** (78dc780b) — from frozen `chain.req`
- lastCompleted = **Task 30.53** (183475f6) — a **Sprint-30** task (skips every done S31 task)
- nextBacklog = **Task 31.3** (d5199875) — which is **shipped** (v0.7.85+)

Actual Task units (measured):
| Task | status (disk) | focus | sprint |
|------|---------------|-------|--------|
| 30.53 | Done | **TRUE** | Sprint 30 |
| 31.1 | In Progress | false | Sprint 31 |
| 31.2 | In Progress | false | Sprint 31 |
| 31.3 | In Progress | false | Sprint 31 |
| 31.4 | In Progress | false | Sprint 31 |
| 31.5 | QA Review | false | Sprint 31 |

→ `focus` is stuck on a **Sprint-30 DONE** task; **no S31 task is focused**; and S31.1–31.4 all still say "In Progress" though shipped.

## ROOT CAUSE — THREE layers (correct-by-construction violation, [[correct-by-construction]]/R27.2)

### ROOT-1 (THE keeping root — server serves a FROZEN snapshot; recompute never runs)
`server.ts:1371-1391` serves the pin from the **persisted `model.slots`** read off disk (`const slots = model.slots`). The server **never** instantiates CurrentSprint or calls `getThreeSlots()` — verified: `CurrentSprint`/`getThreeSlots`/`setFocus`/`autoFollow`/`pinCurrent` have **NO caller anywhere in `src`** (grep = only self-references in CurrentSprint.ts). So the entire forward-fall derivation is **dead on the serve path**; the served pin is frozen to whenever `slots` was last written (when chain.req=31.4). Every prior BUG-A/B/C/D fix improved `getThreeSlots()` — which nothing on the read path calls. **Pin correctness depends on an incidental persist() having run with fresh data = the exact anti-pattern.**

### ROOT-2 (derivation not robust — `current` can be stale/done)
Even recomputed live, `getThreeSlots()` current-derivation (CurrentSprint.ts:204-212) is fragile:
- `current` = focused sprint task **else** the task matching persisted `this.chain.req`. With focus stuck out-of-sprint (30.53) and `chain.req` frozen at 31.4 → current=31.4.
- **No `!done` guard on current** (lastCompleted/nextBacklog both guard `done`; current does not) → a focused-but-completed or chain-frozen task stays pinned.
- A stale `focus` (done / not in current sprint) is neither rejected nor self-healed; it silently drives (or blocks) the slot.

### ROOT-2b (NAME staleness — planner-measured 2026-07-20, same correct-by-construction class)
Even when a slot's `taskUuid` is correct, the displayed **name** can be stale: `CurrentSprint.ts:210` sets `current.name = this.taskName || cu.model?.name` — it PREFERS the cached denormalized `this.taskName` (snapshotted at `setChain` :138) over the LIVE `cu.model.name`. On a task/req title edit the unit updates but the snapshot rots (planner saw current='…interactive **FULLSCREEN**…' while the live T31.4 unit = '…**DEFAULT-DRAWER**…', synced 14d7c0126). Same for the cached `lastCompletedName` (L95/L113) and the persisted `model.taskName`/`model.name` (L105/L109). Note the server serve-path already live-prefers for slot CHILDREN (server.ts:1383 `taskUnit?.model.name || slot.taskName`) — so this bites the chain-only fallback (:210) + any surface reading `model.taskName`/`slots.*.taskName` raw. Fix = resolve title LIVE from the unit (uuid→model.name) as source of truth; drop or LAST-rank the cached string. Composes with ROOT-1: recompute-on-read + live-name-resolution ⇒ no denormalized snapshot anywhere.

### ROOT-3 (data hygiene — PLANNER-owned; the code can't be right while status lies)
`focus`=30.53 (Sprint-30 Done) never advanced into S31; S31.1–31.4 statuses stuck "In Progress" though shipped; stale `nextBacklogOverride`→31.3. With 4 tasks claiming "In Progress" and none "Done", **no signal (focus OR status) identifies the real current** — so no code fix can be correct until status is truthful (exactly one in-progress = the WIP; shipped tasks → Done; focus on the real current). Planner owns this and is measuring in parallel.

## FIX (hand to expert) — correct-by-construction, recompute from ground truth

| # | File | Line | Current (BUG) | Fix |
|---|------|------|---------------|-----|
| 1 | `src/ts/server/server.ts` | 1371-1391 (CurrentSprint children) | `const slots = (model.slots as any) \|\| {}` — serves frozen snapshot | RECOMPUTE live: `const slots = CurrentSprint.slotsFrom(idx)` against the fresh per-request `idx`. Import CurrentSprint. Pin now reflects actual task state on every read (self-healing). |
| 2 | `src/ts/scenario/CurrentSprint.ts` | new `static slotsFrom(idx)` | singleton caches ONE index + stale persisted chain/override fields | add a **stateless** computor that reads the singleton unit's hint fields fresh from `idx` but derives slots from **live task state** — do NOT reuse a cached `getInstance` bound to an old index (avoids the singleton-staleness trap). May wrap `getThreeSlots()` on a throwaway instance seeded from the freshly-loaded unit. |
| 3 | `src/ts/scenario/CurrentSprint.ts` | 204-212 (`current` derivation) | focus/chain drive current; no `!done` guard; stale focus honored | **current = the WIP, by construction:** (a) IGNORE `focus` unless it is in the current sprint's task list AND not done; (b) add `!done` guard — current is never a done task; (c) forward-fall: if no valid focused/chain current, `current` = **first NOT-DONE task in the current sprint's ordered list** (mirror the nextBacklog/lastCompleted discipline already in this file). |
| 4 | `src/ts/scenario/CurrentSprint.ts` | 210 (name resolve) + 95/113 | `name: this.taskName \|\| cu.model.name` prefers cached snapshot; `lastCompletedName` cached | resolve title LIVE: `name: String(cu.model?.name \|\| this.taskName \|\| '')` (unit first, cache last-rank). Same for lastCompleted name. Titles never denormalized. (planner root-2b) |

Copy-paste (server.ts:1373):
```ts
// PIN-KEEP: recompute the three slots from LIVE task state each read — never the frozen model.slots snapshot.
const slots = CurrentSprint.slotsFrom(idx);
```
Sketch (CurrentSprint.ts):
```ts
// stateless: read persisted hints from disk, derive slots from CURRENT task state (no cached index)
static slotsFrom(index: ScenarioIndex): ThreeSlots {
  const cs = new CurrentSprint(index);           // constructor load()s hints fresh from THIS index
  return cs.getThreeSlots();                      // getThreeSlots reads index.list()/get() live
}
// (make the constructor usable here, or expose an equivalent factory; keep getInstance for client callers)
```
And in `getThreeSlots` step-2 (current), before the chain fallback:
```ts
// reject stale focus: only an in-sprint, not-done focused task may drive `current`
let i = sprintTasks.findIndex(t => t.focus && !t.done);
if (i < 0 && this.chain?.req) { const j = sprintTasks.findIndex(t => t.reqUuid === this.chain!.req); if (j >= 0 && !sprintTasks[j].done) i = j; }
if (i < 0) i = sprintTasks.findIndex(t => !t.done);   // forward-fall: current = first NOT-DONE WIP in-sprint
```

## SCOPE / GATE / OWNERSHIP
- **Fixes 1-2 (server recompute) + 3 (derivation) = the CODE fix (expert).** Makes the pin correct-by-construction and robust to stale focus/override. Confined to CurrentSprint.ts + the CurrentSprint branch of the /trace children handler. `getThreeSlots` is shared by the pin display only — regression-check `/trace` CurrentSprint node (current/last/next distinct, no phantom).
- **ROOT-3 = PLANNER (data):** re-focus to the real current S31 task; flip shipped 31.1–31.4 → Done; clear the stale nextBacklogOverride→31.3. The code fix keeps the pin correct ONCE status is truthful.
- **GATE (tester + planner measurement):** with truthful status, the served pin (recomputed) shows current = the single in-progress WIP (never a done/past task), lastCompleted = most-recent DONE **in current sprint**, nextBacklog = next not-done in-sprint (forward-fall only when the sprint is exhausted). Re-read after a status change must self-heal WITHOUT any manual persist().
- **Chain:** rides existing CurrentSprint Impls (setFocus c07efc21 / getThreeSlots d20855e7 / pinCurrent 63d2c341). If req mints a champagne Test for pin-keeping, I mint/repoint the Impl marker for `slotsFrom` + the current-guard.

Design-only (architect). Expert builds fixes 1-3; planner corrects data (root-3); I backstop the recompute + restart remoteShells:0.2 if server.ts ships. This stays SECONDARY to the R31.4 drawer/badge build (in flight).
