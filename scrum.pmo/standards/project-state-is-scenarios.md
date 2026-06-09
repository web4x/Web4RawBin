# Project State Is Scenarios

**Authority:** Tron (via robbin-po), 2026-06-09
**Pair with:** [refinement-precedence-analysis.md](./refinement-precedence-analysis.md) · [traceability-standard.md](./traceability-standard.md) · [scenario-data-pipeline.md](./scenario-data-pipeline.md)
**Scope:** Standing principle + canonical planning workflow for every role.

---

## Principle

**The scenario units ARE the live project state.**

Every Sprint, Task, Requirement, UseCase, Class, Method, Implementation, Test,
and TraceLink lives as a `<uuid>.scenario.json` unit under
`scenario/index/<5-char>/<uuid>.scenario.json`, cross-indexed by symlink under
`scenario/sprints.json/<sprint>/{requirement,task,…}/`. These units **accumulate
into the project state** as work happens — they are not a separate "record of"
the project; they ARE the project's record-keeping substrate.

**Corollary — read current state FROM the scenarios, not from snapshots.**

- `planning.md` is a *generated view* of a Sprint unit's tasks (per
  `scripts/generate-sprint-md.ts <sprint-uuid>`); it is downstream, not source.
- `traceability-matrix.md` is a *generated view* of the chain reachability
  across units; it is downstream, not source.
- Periodic exports / TRON-QA-batch files are point-in-time snapshots used for
  Tron review; they are downstream and stale by construction.
- Therefore: when checking "is X true now?", walk the scenario units (via
  `ScenarioIndex` / `IOR.resolve()` / `trace-cli`), not the markdown.
- Markdown views are always consistent with the units because they are
  regenerated from the units. Hand-editing a generated `planning.md` is an
  anti-pattern — edit the underlying unit, regenerate.

This is why scenario units use forward-only refs and real v4 UUIDs (see
[traceability-standard.md](./traceability-standard.md)) — so the units form a
durable, addressable, walkable graph that survives time, rewinds, and team
turnover.

---

## Canonical Planning Workflow

For every new Tron directive / atomic requirement, every role follows this
strict sequence. **No floating tasks.** A task that doesn't belong to an
owning sprint and doesn't have a canonical Requirement upstream is a process
failure.

### Step 0 — req-eng captures the verbatim Tron quote
- Verbatim quote goes into `compound-requirement-source*.md` of the owning sprint
- req-eng then decomposes atomic requirements (per R-H.2 atomic-req-split)
- No requirement is "implied" — every requirement traces to a literal Tron quote

### Step 1 — Planner: FIND the owning scenario/sprint
- **Do NOT float a new task.** Find where it belongs.
- Search scenarios + sprint scope to identify which active sprint OWNS the
  feature surface this requirement modifies. Heuristics:
  1. Active sprints first (highest-N currently being worked) — most new work
     joins the active sprint unless it's a clear separate feature line.
  2. Feature-lineage match — if a feature was introduced or last modified in
     sprint N, follow-on work to that feature naturally extends sprint N
     (provided sprint N is still active or the feature is the sprint's scope).
  3. If no active sprint clearly owns it → bring it to PO before standing a
     new sprint up; new sprints are PO/Tron-authorised, not planner-spun.
- Recordable evidence in the standup: search trail (greps, scenario IORs
  inspected) + reasoned choice + the Sprint scenario unit IOR that becomes
  the `ownerIor` of the new Requirement+Task.

### Step 2 — Create the Requirement + Task as SCENARIO UNITS (not floating markdown)
- One Requirement scenario unit per atomic requirement:
  `scenario/index/<5char>/<req-uuid>.scenario.json` with
  `ior:class:Requirement`, real v4 `model.uuid`, `model.altId` (e.g. `R18.33`),
  `model.tronQuote` (verbatim), `ownerIor` = the owning Sprint's IOR,
  `unitLinks[]` = symlinks under
  `scenario/sprints.json/<sprint>/requirement/<slug>.json`.
- One Task scenario unit per Task: same pattern with `ior:class:Task`, real v4
  `model.uuid`, `ownerIor` = the owning Sprint's IOR,
  `model.coveredRequirements[]` (planner-enforced — see
  [refinement-precedence-analysis.md](./refinement-precedence-analysis.md) §
  Planner↔Architect Sync Rule).
- **All UUIDs must be real v4 (`uuidgen`).** Fake-suffix UUIDs
  (e.g. `…-000000018033`) are rejected.
- The wiring is bidirectional: `Requirement.tasks[]` ↔ `Task.coveredRequirements[]`
  must be populated symmetrically (planner closes both sides at standup or
  on canonicalization-release).

### Step 3 — Architect refines / designs (forward chain)
- Architect attaches `Task.useCases[]` (real v4 IORs of UseCase scenario units)
  — these are the architect's chain entry point into the canonical
  **Requirement → UseCase → Class → Method → Implementation → Test (6-step)** chain.
- Task is NOT a chain node (see traceability-standard.md correction
  2026-06-08); Task is the NAVIGATION node that covers requirements.

### Step 4 — Expert implements
- Per architect's design. Per learning #15+#16 (rule-pair (a)+(b)+(c)) when
  user-facing surface is involved. Self-notes apply for data/infra exemption.

### Step 5 — Tester verifies
- Walks the full forward chain (Req → UC → Class → Method → Impl → Test) and
  confirms every Acceptance Criterion holds. Reports PASS/FAIL into the task
  file. Tron QA gates the final flip to Done.

### Step 6 — Tron QA approves
- QA Review + Done remain Tron's gate — never checked by sync, never inferred
  from impl-shipped. An explicit "QA approved by Tron" commit is required.

---

## Anti-patterns (what this standard prohibits)

- **Floating task files** with no `ownerIor` to a Sprint and no
  `coveredRequirements[]` populated.
- **Hand-edited generated views** (planning.md, traceability-matrix.md). Edit
  the underlying unit, then regenerate.
- **Snapshot-as-source** — referencing the dated `tron-qa-batch-YYYY-MM-DD.md`
  as the current state instead of walking the live units.
- **Implied requirements** — a task whose covering requirement does not exist
  as a Requirement scenario unit with a verbatim Tron quote.
- **Fake UUIDs** in scenario units or task `[task:uuid:…]` tags (per #17).
- **Empty `coveredRequirements[]` / `useCases[]` on committed task units** —
  this is the systemic gap the Planner↔Architect Sync Rule prevents.

---

## How each role applies this standard

| Role | Application |
|------|-------------|
| **robbin-req** | Captures verbatim Tron quote; emits Requirement scenario unit with real v4 UUID + tronQuote + ownerIor → Sprint. |
| **robbin-planner** | Finds the owning Sprint scenario unit; creates the Task scenario unit (or canonicalizes a placeholder at release) with `coveredRequirements[]` populated and `ownerIor` → Sprint. Enforces no floating tasks. Sync Rule check every cycle. |
| **robbin-architect** | Attaches `Task.useCases[]` at refinement; emits UseCase + Class + Method scenario units down the 6-step chain. Never designs UC without wiring it back to Task. |
| **robbin-expert** | Implements per architect's design; emits Implementation scenario unit with `impl:uuid:…` markers; rule-pair (a)+(b)+(c). |
| **robbin-tester** | Walks the chain; emits Test scenario unit with reachability proof. Reports PASS/FAIL into the task file. |
| **robbin-po (you)** | Approves new sprint creation; tracks QA gate; never marks Done from sync. |

---

## Verification

If a unit can be reached from a Requirement root through the 6-step forward
chain via `IOR.resolve()`, it counts as "in the project state". Anything else
is provisionally outside until wired. The `npm run trace:audit:strict`
champagne metric is the live measurement; the snapshots are downstream
records of past measurements.

---

**Authority:** Tron (robbin-po relay, 2026-06-09).
**Standing rule:** every role applies this standard every cycle.
**Index:** linked from `README.md` Traceability section + `scrum.pmo/standards/` directory.
