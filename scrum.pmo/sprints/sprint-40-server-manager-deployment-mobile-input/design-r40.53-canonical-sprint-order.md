# R40.53 — ONE canonical sprint ORDER (fix /model-vs-/trace descending drift) — architect design

Tron: sprints DESCENDING on /trace, ASCENDING on /model. DRY violation, same family as the live-MVC DRY-by-copy. PO measurement CONFIRMED + root-caused below. Fix BY CONSTRUCTION, not another per-surface copy. Design-only; expert builds; tester gates ALL surfaces + stub-must-fail.

## Root cause (measured) — the order is applied in TWO disagreeing places
- **`sprintNumOf` is canonical (S37, sprint-pin-resolver.ts:38)** but there is **NO canonical sprint ORDER** — the PO is right.
- **`sprintOverviewNodes` (server.ts:1518, the R35.4 shared ordered-Sprint source, my cb9168e8c) sorts ASCENDING** (`a.number - b.number`, :1524). It feeds `traceabilityRoots()` (:1537) AND the server sprint-list node (:2637) which composes display "for clients to render VERBATIM."
- So **/model renders the server's ASCENDING order verbatim** (bug), while **/trace's CLIENT re-sorts** (`rb-trace-tree.ts:472` + `rb-overview.ts:42`, my R40.50 flips) to DESCENDING. Two order-application points that disagree = the drift.
- **My R40.50 was the per-surface copy** (flip the two /trace client sites) instead of one canonical order — which is exactly why /model, sourced from the un-flipped shared builder, never inherited it. Owning that: the fix is to move the order INTO the single source.

## Family enumeration — EVERY surface that orders sprints, + current state
| # | Surface | Site | Current | Kind |
|---|---|---|---|---|
| 1 | /trace overview | `rb-overview.ts:42` | DESC (R40.50 ad-hoc) | display |
| 2 | /trace tree | `rb-trace-tree.ts:472` | DESC (R40.50 ad-hoc) | display |
| 3 | **/model + /trace traceability folder (shared server source)** | `server.ts:1524` `sprintOverviewNodes` | **ASC — Tron's bug** | display (canonical source) |
| 4 | /model sprint graph node | `server.ts:2637` (uses #3) | ASC (inherits #3) | display |
| 5 | generated overview MD | `sprint-overview-generator.ts:31` | ASC | generated display |
| 6 | generator | `generator.ts:89` | ASC | generated |
| 7 | coverage/audit list | `TraceConsistency.ts:193` | ASC (localeCompare) | audit, NOT user sprint-list |
| — | pin backward/forward hop | `CurrentSprint.ts:282`/`:303` | b-a / a-b | **ALGORITHMIC — DO NOT reorder** |
| — | pin closed/plannedAhead | `sprint-pin-resolver.ts:149`/`:155` | b-a / a-b | **ALGORITHMIC — DO NOT reorder** |

Correct today: #1, #2 (but ad-hoc). Wrong: #3, #4 (Tron's bug), #5, #6. Out of display-scope: #7 + the two ALGORITHMIC pin-derivation sorts (they are semantic hop logic, not a display list — reordering them would break pin resolution).

## THE FIX — one canonical order, applied at the source
1. **Export ONE canonical comparator from `sprint-pin-resolver.ts` (the `sprintNumOf` home):**
   ```ts
   // THE one sprint display order — DESCENDING (Sprint 40 on top, Tron's spec). Keyed on the canonical number.
   export const bySprintDisplayOrder = (a: { number: number }, b: { number: number }): number => b.number - a.number;
   ```
2. **Apply it INSIDE the shared source** `sprintOverviewNodes` (server.ts:1524): `sprints.sort(bySprintDisplayOrder)`. ⇒ /model (#3/#4) + /trace traceability folder inherit DESCENDING BY CONSTRUCTION from the one source.
3. **Route every OTHER display surface through the SAME export**, replacing the ad-hoc flips: `rb-overview.ts:42` + `rb-trace-tree.ts:472` import and use `bySprintDisplayOrder` (delete the inline R40.50 flips). Generated MD #5/#6 use it too (user-facing overview) — see churn note.
4. **A new surface CANNOT be born unsorted:** there is exactly one exported comparator; a sprint list that sorts by number ad-hoc is the lint/gate target (below).
5. **DO NOT touch the ALGORITHMIC sorts** (CurrentSprint:282/:303, sprint-pin-resolver:149/:155) — they are pin-derivation hop logic, not display order; INV: pin resolution unchanged.

## Impl-shape for the expert (exact)
- Add `bySprintDisplayOrder` to `sprint-pin-resolver.ts` (next to `sprintNumOf`). One line, exported.
- `server.ts:1524`: replace `(a,b)=>a.number-b.number` → `bySprintDisplayOrder`.
- `rb-overview.ts:42` + `rb-trace-tree.ts:472`: import `bySprintDisplayOrder`, replace the inline comparators (removes the R40.50 ad-hoc; single source).
- `sprint-overview-generator.ts:31` + `generator.ts:89`: route the generator **CODE** through `bySprintDisplayOrder` too. **★ PO SCOPE RULING — SPLIT CODE FROM CHURN:** (a) NOW, in this ship: wire ALL SIX display code sites (#1-#6) through the one comparator + delete every ad-hoc flip — a small diff that leaves NO copy behind (wiring only 4 of 6 = "fixed by construction" with two survivors free to drift = exactly Tron's complaint). (b) SEPARATELY, as its own deliberate commit: the `.md` **REGEN** that produces the many-file churn — isolating it keeps the ship small + reviewable and keeps the rewrite from colliding with the shared tree or tripping the version-tag hook mid-flight. **Code-now, artifacts-next, nothing left as a copy.**
- Client change = a rebuild (dist); server change = a restart. Bundle with any pending deploy.

## Gate (tester) — ALL surfaces + stub-must-fail
- Assert DESCENDING (Sprint 40 first) on: /trace overview, /trace tree, **/model** (the reported bug), the /model graph node, and the generated overview MD if in scope — all reading Sprint 40 before Sprint 1.
- **stub-must-fail (by-construction proof):** a NEW/seeded sprint-list site that sorts by number WITHOUT `bySprintDisplayOrder` must FAIL the gate (grep/lint: the only sanctioned sprint-display sort is `bySprintDisplayOrder`; an ad-hoc `a.number-b.number` on a display list is RED). Proves a future surface can't be born unsorted.
- **★ PO CONDITION — the 2 ALGORITHMIC pin-hop sorts MUST be EXPLICITLY EXEMPTED, in-code + in the lint:** CurrentSprint.ts:282/:303 (backward/forward hop) and sprint-pin-resolver.ts:149/:155 (closed/plannedAhead) each carry an **in-code comment** stating they are **SEMANTIC pin-hop ordering, NOT a display list — MUST NOT route through `bySprintDisplayOrder`; reordering breaks pin resolution.** The lint gate **exempts them by an explicit allow-list**, not by their mere absence. Rationale (PO): an explicit-and-justified exemption is by-construction; a merely-absent one is an accident waiting to be tidied away by a future "helpful cleanup." So both the lint AND a code comment must actively protect them from being flipped.
- INV: pin resolution (getThreeSlots backward/forward) unchanged — the algorithmic sorts were not touched (and are guarded from future flips per above).
