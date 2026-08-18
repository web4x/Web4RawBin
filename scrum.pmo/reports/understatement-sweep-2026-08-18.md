# Understatement/Over-statement Systemic Sweep — 2026-08-18 (robbin-planner, for robbin-po)

Trigger: Tron caught T37.26 reading Planned/0-of-4 while its FORMATTER deliverable is LIVE (v0.8.101/102). An understated board BLOCKS his verdicts (approve buttons surface only at QA-Review). **Measured, NO flips** — req advances through the seam, evidence-per-tick, 0 Done.

## Q1 — Is the converse detector (R37.5 "Impl-shipped ⇒ implementing-box-checked") actually RUNNING?

**YES — defined AND wired AND running (not "defined-never-wired").** `scripts/checklist-chain-audit.mjs` (family: under-recorded-progress) is registered in `ci:gates:raw` as `check:checklist-chain` (package.json line 58). It **did catch T37.26** — in the FAIL tier ("derived=Planned but chain SHIPPED Impl").

**So detection is NOT the gap — the RESPONSE is.** The gate flags drift; it does not auto-advance. FAIL=3 has been sitting open (the FAIL was surfaced but never acted on / not ci-enforced as a merge block). The exists-vs-proven gradient: it exists + runs + catches, but 3 FAIL rows are currently unaddressed.

## Q2 — The understated set (evidence per row)

`checklist-chain-audit` default (FAIL) tier = **3** (scanned 525 tasks):

| Task | Sprint | Verdict | Evidence |
|---|---|---|---|
| **T37.26** `c8e0b1d2` | S37 | **REAL understatement → advance** | leaf (subtasks=[]); FORMATTER `sprintDisplayName` shipped v0.8.101/102 across 6 surfaces, Tron-confirmed LIVE; status=Planned. req advancing now. |
| **T40.37** `2e831ffd` | S40 | **advance-eligible, verify-owner-first first** | leaf atomic; chain shows a shipped Impl; confirm own-not-shared Impl at advance-time. |
| ⚠ **T37.4** `79fd2164` | S37 | **FALSE POSITIVE — do NOT advance** | this is the MVC **COORDINATION ROOT** (subtasks T37.4.1/2/3 + pending C4.4-8). Planned BY DESIGN (rollup = subtasks complete). It shares R37.4 with its self-heal subtask T37.4.1, so the "shipped Impl" belongs to the SUBTASK, not the root. Planned is correct until subtasks complete. |

WARN tier ("two-keyed passing Test but status≤In-Progress — verify-owner-first"): T37.26 + T37.4 (current) + a large backlog of old S19-era `T-*` room tasks (shared-chain; the pre-campaign verify-owner-first backlog, report-only).

**NET verdict-blocker in the active sprints = essentially ONE: T37.26 (in-flight via req). Plus T40.37 (verify-then-advance). The board is NOT widely understated.**

## Q3 — Over-statement (the reverse: status/checklist AHEAD of chain evidence)

Built `scripts/overstatement-audit.mjs` (family: over-recorded-progress) — the converse detector, reusing the **same** `StepEvidence.evidenceForStep` predicate so "recorded" means the same thing in all three (statusNext / checklist-chain-audit / this).

- **Active verdict sprints S37 + S40 = 0 over-statement.** Every ticked step is backed by real chain evidence → advancing the understated set will NOT create the other direction, and the campaign's strict-chain discipline is confirmed intact.
- Total OVER = 471 (87 in S30-40, dominated by CLOSED S30). This is the **strict-chain-edge WIRING GAP on old/closed sprints** — checklists ticked in the pre-strict-era (and Tron-verdicted long ago) whose chains were never two-key-wired to the strict `Impl.tests[]↔Test` standard. These are **NOT lies**; un-ticking them would falsify completed, verdicted work. Same class as the 163 reverse-wire WARNs. **Do NOT touch** (report-only backlog).

## Bottom line

- Only **T37.26** (req advancing) + **T40.37** (verify-then-advance) are real active understatements. **T37.4 is a coordination-root false positive — leave Planned.**
- **0 over-statement** in the verdict sprints.
- The detector runs + catches; the fix is (a) ACTING on the FAIL tier (advance via the seam, evidence-per-tick) and optionally (b) ci-ENFORCING the FAIL tier so an understatement can't sit unaddressed — expert lane, PO routes.
- `overstatement-audit.mjs` = report-only draft (stub-must-fail bite + ci-registration owed; PO routes to expert if wanted as a standing gate).
