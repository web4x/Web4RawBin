# Pin — two-writer root + deterministic "next" rule (robbin-planner board-owner design INPUT for architect)

Per PO (Tron directive #86, 2026-08-20). Measured on disk/code, NO hand-flips (the pin is left exactly as-is so the evidence survives). Answers PO's (1) deterministic-next and (2) two-writer-root.

## (2) Is there a code path that writes `currentTaskUuid` and the other "current" representation SEPARATELY? — YES, that is the two-writer root

Two distinct writers of the `current-sprint-singleton` unit encode "what is current" in DIFFERENT fields, and neither updates the other:

1. **`CurrentSprint.persist()`** (`src/ts/scenario/CurrentSprint.ts:124`, reached via `setChain`/`setHopState` — the older chain-activity flow) writes **`name` = "Current: <taskName>"** and **`taskName`** (line 129/133). It does NOT write `currentTaskUuid`. On disk today: `taskName` = "Task C2: Board is a GENERATED view…" (`4bc1b3d5`, last touched 2026-08-07 per `hopStates.updatedAt`).
2. **The `designate` handler** (`src/ts/server/server.ts:1900`, `POST /api/current-sprint/designate`, R40.17) writes **`currentTaskUuid`** INPUT-ONLY (no status write). On disk today: `currentTaskUuid` = `5acdcc4c` (Task 37.24).

⇒ `taskName` says **C2**, `currentTaskUuid` says **T37.24** — two sources for one fact, written by two paths, diverged.

**What R40.17 ALREADY fixed (the READ side is single-source):** the served pin is **recompute-on-read** from `currentTaskUuid` via `slotsFrom(resolveSprintPin)` (`server.ts:2695`, "recompute LIVE each read — never the frozen slots snapshot"); the derivation-as-2nd-source was retired (INV-C1-9); `persist()` deliberately no longer writes a `slots` snapshot (CurrentSprint.ts:139-140). So the LIVE render is single-source and does not show the divergence.

**What remains (the WRITE side still double-writes):** `persist()` still stamps `name`/`taskName` as a second "current" representation that nothing reads but that makes the unit self-contradict on disk. The stored `slots` block (current=`4bc1b3d5`) is SEPARATE dead residue from a PRE-R40.17 persist (current code no longer writes it).

**By-construction fix (recommend):** give `name`/`taskName` the same treatment `slots` already got — do NOT persist them as a "current" representation; derive the display name from `currentTaskUuid` at render. Then `currentTaskUuid` is the ONE stored input and everything else is recompute-on-read. One writer, one source.

## (1) Deterministic rule for "a new next is CALCULATED"

Principle (aligns with the architect's "no stored override = no lying-pin" + the single-source lesson above): **`next` is DERIVED, never stored.** A stored `next` is a second source of "what is next" that will diverge exactly like `taskName` did.

**Rule (within the current sprint):**
> `next` = the FIRST task T in the current sprint, ordered by **(buildOrder ascending, then taskNumber ascending)**, whose **derived status ∈ {Planned, In-Progress}** (i.e. `< QA-Review`) AND whose build-order predecessors are all `≥ QA-Review` (dependency-ready).

- Ordering key: `buildOrder` (the explicit dependency-derived sequence the planner maintains) primary; `taskNumber` (numeric, e.g. 37.2 < 37.4 < 37.24) as the stable fallback when `buildOrder` is unset.
- "Workable" excludes QA-Review and Done: a QA-Review task is in Tron's verdict queue (agent work complete), a Done task is Tron-approved — an agent must not pick either as current/next.
- If NO workable task remains in the current sprint → within-sprint `next` = empty → the SPRINT-level next-sprint rule takes over (architect's Set-as-Next = sprint-number order).

**Auto-advance (Tron rule d):** on `current → QA-Review`, set `current := next`, then recompute `next` by the rule above. This is the mechanism that does not exist today (grep `processing change requests`/auto-advance = 0) — which is why the pin is STUCK: both current candidates (T37.24 and C2) are already QA-Review, so `current` should have advanced but cannot.

**Set-as-Current (Tron rule c):** sets `currentTaskUuid` (the one input). Under a purely-derived `next`, "demote the previous current to next" happens NATURALLY — the ex-current re-enters the workable pool and, being the earliest-ordered workable, derives as `next`. **Open reconciliation for architect:** Tron's phrasing "demotes previous to NEXT" could imply a stored next-designation; I recommend PURELY-DERIVED next (no stored next) so demote-to-next emerges by construction and we do not re-introduce a stored 2nd source. Architect to confirm against the Set-as-Next ruling.
