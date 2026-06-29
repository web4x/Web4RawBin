<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 24.5: Traceability audit skill (chain integrity + CI gate)

[task:uuid:b59f4d46-bffb-435d-a376-a480a517efe6]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 24 Planning](./planning.md)
    - Requirement R24.5 `[requirement:uuid:79bc8e34-9acb-4338-bbd0-c1f7e817ca7d]`
  - down
    - [UC-SK.5: skill.traceability-audit-skill](./planning.md#uc-sk5) `[uc:uuid:099aa3ed-9e0b-44af-9333-938927f24b6f]`

## Task Description

Chain integrity is audited by an Object.verb skill surface (trace-cli.ts + scripts/trace-audit.ts) exposing trace:check, trace:fix, trace:audit and trace:audit:strict: the audit walks the chain and asserts every Test is reachable from a Requirement root via the 6-step canonical chain, strict mode fails on any gap, and it is wired into the ci:gates pipeline.

## Context

Impl base (formalize, do not rewrite): src/ts/server/trace-cli.ts (check/fix) + scripts/trace-audit.ts (auditAll/walk, --strict) + npm trace:check/trace:fix/trace:audit:strict + ci:gates. 6-step canonical chain: Requirement → UseCase → Class → Method → Implementation → Test (per traceability-standard.md Strict Verify Bar).

## Intention

PO 2026-06-29: formalize the scattered traceability + MD-planning TS tools as a coherent OOSH-like Object.verb SKILL set — R24.5 is the traceability audit (chain-integrity hard gate, nothing ships chain-open).

## Acceptance Criteria

- [ ] (check) trace:check reports chain-integrity issues (missing/dangling links) across the scenario index
- [ ] (fix) trace:fix repairs the mechanically-fixable chain issues
- [ ] (strict) trace:audit:strict asserts every Test is reachable from a Requirement root via the 6-step chain and FAILS on any gap
- [ ] (ci) trace:audit:strict is part of the ci:gates pipeline (nothing ships chain-open)
- [ ] (walk) The audit walks the forward chain per type (FORWARD_KEYS), reporting per-Test reachable depth and offending UUIDs

## Subtasks

None (atomic task).
