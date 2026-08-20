# R40.49 — Task ownership backfill (A) + sprint DESCENDING order (B) — architect design

> ★ **AUTHORITATIVE SOURCE OF THE MEASURED SPLIT.** The task-ownership split lives HERE and only here (this file). Consumers — the requirement unit `241bf3c9`, the expert's migration, the tester — must REFERENCE this file at its current commit, NOT restate the figures (a duplicated number desynchronises on the next refinement; that is how this number went stale in flight four times).
> **CURRENT AUTHORITATIVE SPLIT: A=206 direct · B=220 relocate · D=99 orphan (set-owner + drop-stale, NO relocate) · C=0 · anomaly=0 = 525.**
> **SUPERSEDED — marked, not deleted:** the earlier `A=205 / B=319 / C=1` (schema-only, committed 86cf1dbb5 / 7c2863427 and restated in unit 241bf3c9) is **SUPERSEDED-BY-NEW-EVIDENCE (the reciprocation test)**. An agent holding 205/319/1 should recognise it as OLD, not read it as a live disagreement: 319 = 220 reciprocated-relocate + 99 stale-orphan; relocating the 99 fabricates parents no sprint claims.


Tron live directive via PO. Design-only; expert implements; all three (A + B + held (5) deploy) ship in ONE restart. Target owner profile = **`05e58f81-34ec-4851-b5b7-5749ca9148a3`** (Profile "Marcel Donges", Tron-specified verbatim — note several other "Marcel Donges" profiles exist; use THIS uuid only).

## (A) OWNERSHIP BACKFILL — a GATED 2-CASE MIGRATION, scoped to `ior:class:Task` ONLY

### ★ The trap is DEEPER than "profiles vs chain-parents" — it is SCHEMA DRIFT on Task itself (MEASURED)
Every non-null `Task.ownerIor` points at a **Sprint** (0 point at a profile; 0 at a chain unit). Two Task schemas coexist:
- **New-style** (e.g. Task 40.1 `7a956c21`): `ownerIor=null`; Sprint nav-parent lives in `model.parent` (+ `model.sprintName`). ownerIor is free to become the owner.
- **Old-style** (e.g. T137 `067d025f`): `ownerIor→Sprint` is the **ONLY** Sprint link — **no** `model.parent`.

⇒ A blanket `Task.ownerIor = profile` would **destroy the Sprint nav-parent on every old-style task** (orphan them from their sprint). This is the same *class* of damage the PO warned about, but the mechanism is Task-internal overload, not cross-type.

### MEASURED case split (525 Task units; these ARE the dry-run predicted counts)
**★ RECIPROCATION-CORRECT split (supersedes A=205/B=319/C=1).** The reciprocation principle (a mutual link beats a dangling one), applied CONSISTENTLY to Case B, reveals that most "relocations" would fabricate false parents. Ownership (Tron's directive) writes owner=profile on ALL 525 — nav is unaffected (Sprint.tasks[] downward). The UPWARD-pointer handling is:
| case | condition | count | action |
|---|---|---|---|
| **A direct-set** | ownerIor null with `model.parent` (195), OR dual-carrier whose `model.parent` is the reciprocated Sprint (11, incl. 708ec0a5) | **206** | set `ownerIor = 05e58f81`; parent already present + authoritative |
| **B relocate** | ownerIor→Sprint that **RECIPROCATES** (that Sprint's `tasks[]` lists this task) AND no `model.parent` | **220** | COPY ownerIor→`model.parent` (+`sprintName`) THEN set owner — preserves a VALID upward link |
| **D orphan** | ownerIor→Sprint that is **STALE/unreciprocated** AND **no** Sprint lists the task at all | **99** | set owner; **do NOT relocate** (copying the stale pointer would fabricate a false `model.parent`). Dropping the stale ownerIor REMOVES drift; nav already shows these '(unsorted)'. Report as a batch finding, not a per-unit hold. |
| **C conflict-hold** | genuine ambiguity (ownerIor AND parent both reciprocate different Sprints, or multi-lister) | **0** | none this run |
| anomaly | ownerIor → non-Sprint | **0** | fail-loud |

**708ec0a5 RESOLVED (not a conflict): MEASURED** Sprint `64af2638` (its `model.parent`) LISTS it in `tasks[]` = **reciprocated**; Sprint `97f513a1` (its `ownerIor`) does NOT (0 refs). By the nav rule (Sprint.tasks[] downward is authoritative), `64af2638` is the true sprint and the `ownerIor` is a **stale unreciprocated pointer** → folds into **Case A**. (PO's call, my measurement confirms.)

**★ NEW FINDING — 99 ORPHAN TASKS (separate, pre-existing, NOT blocking):** 99 Case-B tasks have `ownerIor→Sprint` that the Sprint does NOT reciprocate, AND **no** Sprint's `tasks[]` lists them (0 recoverable, 0 multi-lister — all 99 are true orphans). Their `ownerIor` is drift; they are already '(unsorted)' in nav. The ownership migration sets their owner and drops the stale pointer (a cleanup, no new drift). **The orphaning itself is a pre-existing integrity defect surfaced by this audit** — route to req as a follow-up (which Sprint should claim each), do NOT block Tron's ownership directive on it.

### ★ RECONCILIATION (PO hard-gate: two measurements differed by 11) — ONE authoritative split
PO hypothesis CONFIRMED + REFINED by measurement. architect-206 = req-195-null **+ 11 tasks that have `ownerIor→Sprint` AND already carry `model.parent`**. Those 11, classified + named:
- **10 CONSISTENT dual-carriers** (`model.parent` == the same Sprint as `ownerIor`) → safe Case A (set owner direct).
- **1 CONFLICT** — task **`708ec0a5`**: `ownerIor→97f513a1` (Sprint "Room Handling") vs `model.parent→64af2638` (Sprint "Radical Forward Planning") → **Case C flag**, never auto-write.
⇒ req-330-old = 319 (no parent) + 11 (parented). The SCHEMA-only split (expert's 3rd read) = A=205/B=319/C=1. **But applying the reciprocation rule to BOTH the 1 conflict AND the 319 supersedes it — see the reciprocation-correct table below (A=206 / B-relocate=220 / D-orphan=99 / C=0).** The dry-run must add a reciprocation check (does each ownerIor→Sprint list the task back?) and reproduce **206 / 220 / 99 / 0** before `--apply`.

### ★ WHICH FIELD NAV READS (PO asked — decides if ownerIor-overwrite is harmless)
**MEASURED: the server resolves a task→its Sprint via `Sprint.tasks[]` — the DOWNWARD backref** (server.ts:1414 and :1920 both scan Sprints for one whose `model.tasks[]` includes the task), NOT the task's upward `ownerIor`/`model.parent`. The client groups by a projected `t.sprint`. ⇒ **overwriting a task's ownerIor does NOT break the visible sprint grouping/nav for ANY task** — the Sprint→task backref survives. Relocation (Case B) is therefore required for **GRAPH INTEGRITY** (keep the task's own upward pointer; avoid a one-way Sprint↔Task link; preserve the drawer's parent display), **not** to save the grouping. This makes the write *safer* than the directive feared — but the relocation is still correct, because a task that no longer knows its own sprint is a real integrity defect and any upward-reader (detail drawer parent link, future features) would show it.

### INVARIANTS (each with a stub-must-fail)
- **I1 — scope:** only units with `ior === "ior:class:Task"` are written. **stub-must-fail:** seed a NON-Task unit (Impl or ChangeRequest) whose `ownerIor` would change under the rule ⇒ the gate goes **RED**. (Directly answers the PO's required guard.)
- **I2 — nav preserved:** after migration every Task's Sprint nav-parent is reachable via `model.parent` (Case B relocates BEFORE overwriting). **stub-must-fail:** seed an old-style task (ownerIor→Sprint, no model.parent) and run the write WITHOUT the relocation step ⇒ Sprint-parent lost ⇒ **RED**.
- **I3 — non-Task ownerIor untouched:** count of changed ownerIor on non-Task units == 0 (asserted before/after across the whole index, not just the Task set). This is the invariant the PO asked me to state: **non-Task `ownerIor` is NEVER touched** (Impl→Method, CR→Test structural parents are inviolate).
- **I4 — single target:** every written `ownerIor` == 05e58f81 exactly (no other profile written).

### GATE (isolated per R40.31; DRY-RUN FIRST)
1. **Backup** the whole `scenario/index` (git commit the pre-state + a tar snapshot) — reversible.
2. **`--dry-run` (default)** prints: total tasks, already=0, Case A=206, Case B=319, anomaly=0, and a from→to sample per case; asserts I1–I4 counts; **writes nothing**.
3. **`--apply`** only after the dry-run counts are reviewed; re-emits ACTUAL before/after (Task ownerIor==05e58f81: 0→525; non-Task ownerIor changed: 0; tasks with model.parent: 206→525 i.e. +319 relocated) and asserts actual==predicted, else abort+restore.
4. Run on an isolated copy for the stub-must-fail cases; cleanup surviving failure.

### ★ CHOKEPOINT FLAG (expert holds for my confirm)
This writes 525 Task units through the scenario store (`ScenarioIndex.put` class of path). I FLAG it: mint/write as an explicit gated migration, **do NOT route through any auto-mint/auto-reuse path** (that path is itself R40.47's intentless-automation concern). Expert holds for my confirm before `--apply`.

### Honest note to PO/Tron (deliver-literally + flag the genuine risk)
Tron's rule "all tasks owned by my profile" is delivered EXACTLY (ownerIor=05e58f81 on all 525). The only addition is the **mandatory relocation of the Sprint-parent for 319 old-style tasks** — without it his directive would silently orphan 319 tasks from their sprints. This is data-loss prevention, not caution. It also *completes* the ownerIor-overload cleanup on Task (owner in ownerIor, nav-parent in model.parent) — the same disentangling we value on chain units.

## (B) SPRINT ORDER — DESCENDING (Sprint 40 on top), 2 UI surfaces

- **`src/public/ts/trace/rb-overview.ts:42`** — `sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}))` → flip to `b[0].localeCompare(a[0],undefined,{numeric:true})`.
- **`src/public/ts/trace/rb-trace-tree.ts:472`** — `sort((a,b)=>(a.number||0)-(b.number||0))` → flip to `(b.number||0)-(a.number||0)`. ★ **COUPLING TRAP (measured):** the NEXT line (473) derives `N` from `sprints[sprints.length-1].number` — correct as "max" ONLY while ascending. After the flip, `sprints[sprints.length-1]` is the MIN. **Fix line 473 too:** `const N = sprints.length ? Math.max(...sprints.map(s=>s.number||0)) : 0;` (order-independent). Expert must change BOTH lines or the sprint-number label breaks.

### RULING on the generated-doc sorts (PO asked): **OUT OF SCOPE for this ship, leave ascending, flag as follow-up.**
`sprint-overview-generator.ts:31` (`a.num-b.num`) and `TraceConsistency.ts:193` render the generated `.md`. Reasons to exclude NOW: (1) Tron named the two INTERACTIVE surfaces; (2) flipping doc order regenerates many `.md` files = churn; (3) MD regen can trip the **post-commit version-bump automation** (an R40.48 intentless-automation seed) — I will not casually fire it. Recommend a follow-up if Tron wants the docs to match the UI; do not bundle it into the one-restart ship.

## ONE-RESTART SEQUENCING (design-for-it, per PO)
(A) is a DATA migration (scenario units, read fresh by the tree/set-current path — no code change). (B) is a client CODE change (needs a build). The (5) deploy is held for Tron's restart word. Sequence to drop his session **once**:
1. Land (A) gated migration (dry-run→backup→apply→verify counts) — data only, no restart.
2. Build (B) (both line-472 + line-473 edits) — dist rebuilt.
3. **ONE restart** serves (A) data + (B) dist + the held (5) deploy together. Verify served-version == HEAD, then Tron retests all three on one session.

Expert builds; I backstop each on ship (A counts + I1–I4 stubs RED-proven; B descending @390 + N-label intact; then the one-restart served-version verify).
