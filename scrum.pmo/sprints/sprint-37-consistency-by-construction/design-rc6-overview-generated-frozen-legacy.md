# R37.6 — sprints.overview.md generated + preserved-narrative + G5 frozen-legacy (visible)

**Author:** robbin-architect · 2026-08-07 (S37, LAST S37 design). PO-dispatched after R37.1/R37.3. Completes the consistency-by-construction sprint: the ONE remaining hand-maintained board (`sprints.overview.md`) becomes generated-where-it-can-drift + preserved-where-it's-narrative, and the deliberate legacy scope-boundary is made VISIBLE. Design → req mints → expert builds → I backstop. Includes the R37.3 vacuous-BITE.

## MEASURED ground truth (disk, HEAD v0.8.65)
- **`sprints.overview.md`** = hand-authored narrative (Back-link, Team-Achievements, "Durable index…" prose, Status legend) + a durable **sprint index** (the drift-prone part — every sprint's status, maintained BY HAND by planner). NO `GENERATED_HEADER` → the OWNED-OUTPUT guard SKIPS it (never clobbered) = why R37.2 deferred it.
- **Generator mechanisms to reuse:** `GENERATED_HEADER` marker (generate-sprint-md.ts:29); OWNED-OUTPUT guard (:213-236, never clobbers a file lacking the header); `--check --all` walks files starting with `GENERATED_HEADER` (:265-273). All FILE-granularity. R37.6 needs **REGION** granularity (mixed narrative + generated index in one file).
- **R37.1 `resolveSprintPin`** (current/last/next) + **R37.5 rollup** (per-sprint status, supersededBy-aware) = the data the index renders. R37.6 is a pure consumer.

## Part A — overview generator with a PRESERVED-NARRATIVE region
- **Region markers:** `<!-- GENERATED-INDEX:BEGIN -->` … `<!-- GENERATED-INDEX:END -->` delimit the sprint index (the generated part). EVERYTHING OUTSIDE the markers = PRESERVED hand-narrative — the generator never touches it.
- **`generateOverview()`:** read existing file → PRESERVE all bytes outside the markers → REGENERATE only the between-markers index from Sprint units (number-ordered) + R37.1 pin (mark current/last/next) + R37.5 rollup status per sprint (Done / Active / QA-pending / Planned / **Closed** with `Done + supersededBy` counts distinct). First run (markers absent): insert the marker pair at the canonical index location, preserve all surrounding prose.
- **`--check`:** assert the between-markers region == regenerated (drift → FAIL). The outside-markers region is NOT checked (hand-owned). Fold into `check:sprint-md`/`consistency:strict`.

## Part B — G5 frozen-legacy formalized (VISIBLE, never a silent cap)
The consistency gate's scope EXCLUDES two sets — but **lists them explicitly as frozen-legacy in the output** (Tron-bounded scope DECLARED, never hidden — [[no silent caps]]):
1. **10 design-doc `planning.md` (S01-09)** — KEEP-HAND-AUTHORED (R37.7 classification); these are design briefs, not unit-generated boards. G5 narrative-exclude.
2. **S01-18 FROZEN-LEGACY** — the NEEDS-BACKFILL ancient sprints (the 694-gap set): Tron's bounded-scope decision is to FREEZE them, not backfill. They are excluded from checkSprint.
- **Explicit `FROZEN_LEGACY` set** (a named list/config, NOT inferred). `--check` emits a section: `FROZEN-LEGACY (excluded from consistency gate — Tron-bounded scope): sprints S01-18 [list]; design-doc planning.md S01-09 [list]`. The exclusion is a DECLARED line in every run — removing a sprint from the frozen set surfaces it back into the gate (a change, not a silent slip). The overview index also tags them "frozen-legacy" so a reader sees the boundary.

## Part C — vacuous-BITE (per R37.3 INV-C3)
- `generateOverview` on vacuous input (empty sprint set / unresolvable current-pin / **missing markers**) → REFUSE with a named reason, NEVER emit an empty index (an empty index silently maintained would read as "no sprints").
- `--check` on a missing overview file → FAIL named, not skip-as-match.
- The FROZEN_LEGACY list itself: if it's empty or references an unresolvable sprint → refuse (a frozen set that silently matches nothing is a vacuous pass).

## INVARIANTS
- **INV-C6-1 preserved-region:** generator writes ONLY between the markers; outside bytes identical pre/post (hand narrative safe by construction).
- **INV-C6-2 index-from-units:** the index = Sprint units number-ordered + R37.1 pin + R37.5 rollup; can't drift; `--check` enforces.
- **INV-C6-3 frozen-legacy VISIBLE:** excluded sprints are EXPLICITLY LISTED as frozen-legacy in output — never a silent cap; the frozen set is a named list, not inferred.
- **INV-C6-4 fail-closed-vacuous (R37.3):** empty sprint set / unresolvable pin / missing markers / vacuous frozen-list → refuse + name.
- **INV-C6-5 no-status-invention:** index status = R37.5 rollup; `Done` and `supersededBy` counted DISTINCTLY (INV-C1-7 carried up); overview never invents Done-ness.

## GATE — BITE (distinct #126 Test, no cross-wire)
- **drift-BITE:** mutate a sprint's status/pin → `--check` FAILS; regenerate → matches units.
- **preserved-region-BITE:** hand-edit the narrative (outside markers) → regenerate → narrative BYTE-IDENTICAL, index refreshed (proves the generator can't eat prose).
- **frozen-legacy-VISIBLE-BITE:** assert the excluded set appears in `--check` output; drop one from the list → it re-enters the gate (proves no silent cap).
- **vacuous-BITE (R37.3):** empty sprint set / missing markers / vacuous frozen-list → REFUSE with reason.
- **idempotent:** second run byte-stable.

## CHAIN + sequence + deploy
- Chain: UC `overview.generatePreserved` → Class `SprintOverviewGenerator` (or extend `SprintViewGenerator`) → Methods `generateOverview` + `checkOverview` → Impl → BITE Test. req mints at build-go.
- Sequence: R37.6 = LAST S37 design → **S37 design phase COMPLETE** → architect goes to backstop-on-ship posture.
- **Deploy:** scripts/CI (docs) → NO restart.
