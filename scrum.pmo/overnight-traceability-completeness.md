# Overnight Traceability Completeness Drive (2026-06-11)

**Tron directive (literal):** "over night fill with the team the missing tractability scenarios and corresponding views."

**Goal:** Zero traceability gaps. EVERY chain complete: Requirement → UseCase → Class → Method → Implementation → Test, AND every scenario unit has its corresponding view (detail view + tree render). Champagne standard (T191): every chain's intention verifiable via /trace.

## Roles (continuous lanes until gaps = 0 or morning)

- **robbin-architect (0.4):** AUDIT — produce the gap list. Walk all scenario/index units across S1–S19: which Requirements lack a UC; which UCs lack Class/Method; which Methods lack Implementation/Test; which units lack a detail view. Output gap inventory (counts + IORs per gap type). Then design the missing units per the locked singular chain (#27/#38). Re-audit after each fill wave.
- **robbin-req (0.5):** REQUIREMENTS — every requirement has a complete forward chain + verbatim source. Fill missing requirement→UC links. Canonicalize any placeholders.
- **robbin-expert (0.2):** FILL — create the missing scenario units (UC/Class/Method/Impl/Test) per architect's gap list + design, and the corresponding views (rb-object-item render + detail views per type). Commit in waves; version bump + sw.js only when shipping client view changes.
- **robbin-tester (0.3):** VERIFY — champagne per chain: every chain reaches a Test; no badge-0-with-children; no orphan units; views render. Report coverage % each wave.
- **robbin-planner (0.1):** TRACK — completeness scoreboard (chains complete / total), sync sprint statuses, keep README/overview current. Report progress to PO each wave.
- **robbin-skill-expert (0.3 dup→ use其 own):** assist tooling (trace-cli gap-detection passes) if needed.

## Cadence
- Work in waves: architect audit → expert+req fill → tester champagne-verify → planner score → re-audit. Loop.
- Communicate via scenario IORs + statusChecklist edits; otmux = pointers only.
- Report each wave's gap-count delta to robbinTeam2:0.0.

## Team-health (Tron protocol — sustain overnight)
- SM monitors every agent's context. BEFORE limit: agent WRITES + git-COMMITS context.md + learnings + findings.
- Recovery = agent-trainer REWIND (state saved+committed first → reboot from context.md). NEVER /compact (destructive).
- Verify a recovered fork actually reset (<30%) before re-tasking.
- This file + scenario units are the recovery anchor — keep them current.

## Done = champagne green
Every Requirement→…→Test chain complete + viewable on /trace, zero orphans, zero badge-0-with-children, full suite passing.
