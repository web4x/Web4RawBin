# Action-bar control visibility must derive from STATUS, not eager-graph membership (ruling + fix)

robbin-architect 2026-08-18. Tester surfaced this unblocking landing-3; PO escalated (correctly rejected "product is correct, seed is wrong"). MEASURED myself before ruling (Tron-facing). **Design/ruling only.**

## Q1 — By design or a latent defect? → LATENT DEFECT
Status is a property of the TASK: `deriveStatusEnum(statusChecklist)`, computable on any task unit. But the action-bar (`rb-detail-drawer.ts:483`) reads a PRE-ATTACHED status field — `unit.status = obj?.status ?? rModel?.status` — and **absent status ⇒ approve/decline HIDE** (`:477`). That status is attached by the server-built EAGER current-sprint graph, but **`/api/ior` (server.ts:2848) does NOT attach it**: for a Task it runs `attachTaskChangeRequests` + `attachTaskPinRole` + `attachTaskMdHref` — there is NO `attachTaskStatus` — so it returns `model.status` as-stored (undefined for tasks whose status isn't persisted; measured a39efc32). ⇒ **control visibility depends on GRAPH MEMBERSHIP, not on the task's actual STATUS.** That is a bug, not a design.

## Q2 — Can Tron approve a QA-Review task NOT in the current-sprint eager set today? → NO (measured)
A QA-Review task reached OUTSIDE the eager window — a deep link, a previous-sprint task, anything after sprint rotation, or Tron opening a task by ref from /trace — resolves via `/api/ior` → no attached status → `unit.status` undefined → **Approve/Decline HIDE** even though it IS actionable and he IS the owner. Same class Tron escalated (controls must VANISH at Done — and by the same logic APPEAR when actionable), and **invisible to any gate that only exercises current-sprint tasks** (the T37.24 coverage-false-green pattern).

## Q3 — The fix: derive status from the ONE source at the point of use
Add **`attachTaskStatus`** to the `/api/ior` Task path (mirroring the existing `attachTaskPinRole`/`attachTaskMdHref`/`attachTaskChangeRequests` compute-on-read enrichers): `m.status = deriveStatusEnum(String(m.statusChecklist ?? ''))` — compute-on-read, NEVER writes (INV-T). Then EVERY task carries its ACTUAL derived status at `/api/ior`, so controls render by STATUS regardless of eager-membership. 
- Same `deriveStatusEnum` single source as everywhere (L2); this is the status-getter north-star applied at the read boundary (status = f(statusChecklist), derived wherever needed — never a pre-attached field that some paths carry and others drop).
- Equivalent alternative: the action-bar derives client-side from `statusChecklist` via `deriveStatusEnum` (client-safe). The server `attachTaskStatus` is preferred — consistent with the existing attach* pattern, one place, no client re-derivation.
- **Requirement + gate (req mints):** control visibility is a function of the task's derived status on ANY resolution path; the gate MUST exercise an **out-of-window** QA-Review task (deep-link / previous-sprint / post-rotation) showing controls — NOT only current-sprint tasks (else it repeats the T37.24 false-green). stub-must-fail: an out-of-window QA-Review task with hidden controls → RED.

## Seed recipe for landing-3 (unblock either way; do NOT let it bury the product question)
- **Recommended (the fix IS the unblock):** land `attachTaskStatus` (fix-on-demand). Then the seeded QA-Review task shows controls via `/api/ior` with NO eager-membership needed — landing-3 proves controls-present→absent on the real page, AND the out-of-window case is covered by construction.
- **Workaround on unfixed HEAD:** make the seeded task an eager current-sprint child — membership is the **current-pinned Sprint unit's `model.tasks[]`** (add the task's ior there), NOT `sprintName`/parent on the task (why the tester's seed didn't take; membership is `Sprint.tasks[].includes(taskIor)`, server.ts:1904). The sprint must be the pin's CURRENT slot.
- ⚠ If landing-3 uses the eager-seed workaround, it proves the eager case ONLY — the out-of-window control-visibility defect stays a SEPARATE requirement + gate. Don't let an eager-seeded green mask it.

## Report
Both to PO: (1)+(2) = a real Tron-facing latent defect (controls by membership, not status); (3) fix = `attachTaskStatus` at `/api/ior` (derive from statusChecklist, single-source) + a requirement whose gate exercises an out-of-window QA-Review task. Recipe given to the tester so landing-3 unblocks; the defect does not get buried by the seed fix.
