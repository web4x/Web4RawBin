# Consistency-by-Construction Guard — SCOPE (planner + req, per ARON doctrine)

**Basis:** `session/knowledge-base/consistency-by-construction.md` (ARON, TRON via robbin-po, 2026-08-07). Files = the ONE source of truth; pin + board = GENERATED views (cannot drift); a FAIL-LOUD guard asserts `pin == board == files`. Consistency owned by DESIGN, not vigilance (CMM4, not CMM2).

## Problem (measured on disk 2026-08-07)
- **CurrentSprint pin STALE at S33** while files/work are on **S36** — 3-sprint drift, never advanced through 34/35.
- **Board↔files:** active sprints **S33/S34/S35/S36 byte-match ✓** (`generate-sprint-md --check`); **29 older sprints DRIFT** (24 `requirements.md`, a handful `planning.md`/`task-*.md`) — hand-maintained copies disagreed with their units.

## Requirement decomposition (req to formalize scenario-first)
- **R37.1 — Pin is COMPUTED from files (never hand-set):** a `currentSprint` resolver derives the pin = the sprint the active work is on (from the scenario units on disk). Skill-expert's "advance the pin" becomes *running the resolver*, not editing a value.
- **R37.2 — Board is a GENERATED view (already true — guarantee + reconcile):** planning.md + task-mds are generated from scenario units (existing `generate-sprint-md`). Add a **one-time reconcile-all** (regenerate every sprint's views from its units) to clear the 29-sprint historical drift in one pass — NOT hand-fixed.
- **R37.3 — FAIL-LOUD guard asserts `pin == board == files` (fold into `ci:gates`):** fails the build if (a) pin != computed-current-sprint-from-files; (b) ANY sprint's planning.md/task-md != regenerated (round-trip byte-match — extend `check:sprint-md` to fail on any drift, not just report); (c) a task-status in a unit != its board checkbox. FAIL-LOUD = "no silent broken state."
- **R37.4 — Objects self-heal:** pin/board validate on init/read → reflect reality or refuse to run drifted; never run silently drifted.

## Roles (from the doctrine — no re-litigation)
skill-expert = keep pin current (run R37.1 resolver) · **planner = board↔files audit/sync (this drift was my bookkeeping miss)** · SM = detect (measure pin vs board vs files each sweep, flag drift) · PO = gate (not done until pin==board==files) · TRON = STRATEGIC increment only.

## Build order
R37.2 reconcile-all (clear historical drift) → R37.1 pin-resolver → R37.3 fail-loud CI guard → R37.4 self-heal.

## Gate posture (per S35/S36)
Each chain-to-Test; the guard itself gated by a **drift-injection BITE** — plant `pin != files` → guard MUST fail-loud; plant a `board != units` → guard MUST fail. Real fail-loud PROVEN not asserted ([[correct-by-construction-needs-gate-verification]]). Verify Impl.tests[] on disk before any flip.

## Governance
Creating THIS guard as a sprint = a STRATEGIC increment → **TRON-authorized** (#76). The TEAM SCOPES it (this doc); PO/SM **surface to TRON via detect-and-ASK** (never detect-and-wait). Planner does NOT self-create the sprint, and does NOT self-close S33/34/35/36 (their sprint-status close is TRON's separate strategic call).
