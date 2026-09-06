<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# T139: fork skill-expert from expert (PO decision; agent-trainer executes)

[task:uuid:82ec736c-8106-424d-b953-d0323679de8c]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement (PO + agent-trainer — decision pending)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

> QA Review + Done are TRON's gate only — never checked by planner/sync.

## Traceability

`[task:uuid:82ec736c-8106-424d-b953-d0323679de8c]`

- up
  - [Sprint 17 Planning](./planning.md)
  - **requirement:** `[requirement:uuid:9dedeb00-6038-4c43-bcd4-efab99792be1]` —
    "Fork a new `robbin-skill-expert` agent from `robbin-expert`, focused on
    implementing + maintaining the scenario-unit skill verb-set (T138 + future
    skills). PO decides timing + scope; agent-trainer executes the SKILL.md
    fork." (Tron via PO 2026-05-31; req-eng to anchor verbatim Tron quote
    here.)
- down
  - None (atomic role-creation task)
- follows
  - [T138: skill set on scenarios](./task-138-skill-set-scenarios.md) — T138 ships the verbs; T139 dedicates a maintainer
  - [T137: req+planner learn scenarios](./task-137-req-planner-learn-scenarios.md) — T139 follows the same role-evolution pattern
- chain
  - **requirement:** r139 fork skill-expert (Tron 2026-05-31)
  - **use case:** agentTrainer.forkRole, role.boot (architect adds to s17-usecases.puml)
  - **puml:** [diagrams/s17-usecases.puml](./diagrams/s17-usecases.puml)
  - **class/method:** new `~/.claude/agents/robbin-skill-expert/SKILL.md`; updates to `hiveMind` / role registry; possibly a new tmux pane

## Task Description

Tron's directive: fork `robbin-skill-expert` from `robbin-expert`. PO holds
the decision on:
- **When** — likely after T138 lands (the verb-set the new role will own)
- **Scope** — owns the skill verbs (T138 + future T138-derivatives) and any
  follow-on scenario-skill modules; does NOT own general expert work
  (those stay with robbin-expert)
- **Naming + pane** — `robbin-skill-expert`, dedicated tmux pane (e.g.
  robbinTeam:0.4 or a window:2 slot)
- **Boot SKILL.md** — agent-trainer clones robbin-expert/SKILL.md, removes
  general expert responsibilities, adds skill-set focus + reading-list
  pointing at T125/T133/T134/T138 + planner+req SKILL.md (per T137)

## Acceptance Criteria

- [ ] AC1 — `~/.claude/agents/robbin-skill-expert/SKILL.md` exists, peer-reviewed by PO
- [ ] AC2 — Agent boots in its assigned pane and reads its SKILL.md correctly (verified by tester)
- [ ] AC3 — Agent can be addressed via `hiveMind send.enter robbin-skill-expert "<msg>"` and `otmux send <pane> "<msg>" Enter`
- [ ] AC4 — Role registry / hiveMind knows the new agent (resolves name → pane correctly)
- [ ] AC5 — Reading-list pointers (T125/T133/T134/T138/etc.) all resolve
- [ ] AC6 — robbin-expert's SKILL.md updated to clarify that skill-set work is now skill-expert's domain (handoff documented)
- [ ] AC7 — Rule-pair: SKILL.md authoring is docs-only — no version bump required (no client-served surface)

## Dependencies

- **Requires:** T138 (the verb-set the new role owns); PO decision on timing+scope
- **Enables:** Sustainable maintenance of the scenario-skill verb-set without overloading robbin-expert

## Definition of Done

- [ ] All AC met
- [ ] New agent functional in its pane
- [ ] Tron QA approved (final blessing on the new role)

## QA Audit & User Feedback

- 2026-05-31: Tron via PO directed S17 2nd extension. PO holds fork decision; agent-trainer executes. CMM4 4-role with agent-trainer in the "expert" slot.

## Subtasks

None (atomic role-fork task).

---

*Sprint 17 — Scenario Units / IOR Data Model & Class Views · Phase 7 (S17 2nd extension)*
*Owners: robbin-po (decision), agent-trainer (execute), robbin-req (req anchor), robbin-tester (verify)*
*Priority: 5 (org evolution — depends on T138 to define what the new role owns)*
