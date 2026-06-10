# T135: req-audit — formalize backlog Tron quotes req missed
[task:uuid:2c314fbb-6e07-4917-ac34-81f8ce987fcb]

## Status

- [ ] Planned
- [ ] In Progress
  - [ ] refinement (req + planner JOINT — audit pass)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

**UseCases:**
- [🔗 reqAudit.formalizeQuotes](../usecase/reqaudit-formalizequotes.md)


## Traceability

`[task:uuid:2c314fbb-6e07-4917-ac34-81f8ce987fcb]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:47a86209-e0bb-4142-a6ad-4fff94ff9921]` —
    "req-eng must audit the backlog + S10-S17 task files for Tron quotes that were
    not yet formalized as `[requirement:uuid:v4]` entries in any `requirements.md`,
    then formalize each (verbatim quote + v4 uuid + ↔ task link)." (Tron via PO
    2026-05-31, S17 second extension; req-eng to anchor verbatim Tron quote here.)
- down
  - None (atomic task — single audit pass + formalization)
- follows
  - [T124.4 — req-eng requirements.md](./task-124-architecture.md) — T135 is the audit ensuring T124.4 is complete (not just present)
  - [T121 — chain-data fix](../sprint-16-traceability-ux/task-121-chain-data-fix.md) — Phase 2 C1 class (unformalized reqs) overlaps; T135 closes the S10-S17 portion
- chain
  - **requirement:** r135 req-audit (Tron 2026-05-31)
  - **use case:** req.auditBacklog, req.formalize, req.linkToTask (architect to add to s17-usecases.puml)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** req-eng artifacts: per-sprint `requirements.md` files; backlog.md scan; T124.4 supplement

## Task Description

T129 verification (f487c2f) reported 11 ERRORS for tasks referencing
requirement UUIDs not in any requirements.md — all S16/S17 tasks awaiting
T124.4 formalization. T135 is the audit pass to close that gap (+ a sweep of
the backlog for Tron quotes that were captured verbatim in chat but never
made it into a requirements.md).

**req-eng workflow (per audit + #18 process):**
1. Scan `scrum.pmo/backlog.md` for any Tron-quote backlog item that hasn't been promoted to a `requirements.md` entry.
2. Scan S10-S17 task files for `requirement:uuid:<v4>` references whose UUID isn't anchored in a `requirements.md`.
3. For each gap: capture the verbatim Tron quote (from task QA Audit section, from backlog, from chat history) into the appropriate `requirements.md` with a fresh v4 `requirement:uuid` AND a `→ T<n>` task-link.
4. Cross-update the referring task's `requirement:uuid` to match the freshly-formalized one (or leave the existing uuid and add the same uuid to requirements.md — architect picks which direction).
5. Re-run `npm run trace:check` — orphan-req count must reach 0 across S10-S17 (S1-S9 stays on documented allowlist).

## Acceptance Criteria

- [ ] AC1 — backlog.md audited; every Tron-quote backlog item either has a `requirements.md` entry or is documented as deferred
- [ ] AC2 — every `requirement:uuid:` referenced in any S10-S17 task file resolves to a `requirements.md` entry (no dangling references)
- [ ] AC3 — `npm run trace:check` reports 0 orphan-req errors for S10-S17 (S1-S9 stays on documented allowlist per f487c2f)
- [ ] AC4 — Every newly-formalized requirement has the verbatim Tron quote (not paraphrased — learning #17 + Tron literal-source directive)
- [ ] AC5 — `sprint audit` 0 issues across S10-S17 after the audit lands
- [ ] AC6 — No regression on S1-S9 documented allowlist
- [ ] AC7 — `npm run build` + suite passes; rule-pair: (a)+(b) per #15 if any client surface changes (likely text-only — bump optional, planner annotates the call); (c) STATIC_SHELL exempt

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed S17 2nd extension. CMM4 4-role enforced. Awaiting req+planner audit pass.

## Subtasks

None (atomic audit + formalization task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 7 (S17 2nd extension)*
*Owners (CMM4): robbin-req (audit lead), robbin-architect (review), robbin-expert (tooling if needed), robbin-tester (verify)*
*Priority: 1 (closes T129 documented allowlist; precondition for sprint close)*
