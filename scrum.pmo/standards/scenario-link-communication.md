# Scenario-Link Communication

[standard:uuid:0525f028-150c-4163-b3a8-a753df5581d9]

**Authority:** Tron 2026-06-10 (via robbin-po)
**Pair with:** [project-state-is-scenarios.md](./project-state-is-scenarios.md) - [traceability-standard.md](./traceability-standard.md) - [scenario-data-pipeline.md](./scenario-data-pipeline.md)
**Scope:** Standing rule for all roles. SM enforces.

---

## Principle

> Communicate via the scenario ln links in the chat and updates to the scenarios instead of these long chats. -- Tron 2026-06-10

Scenarios are the project state and the communication substrate. Chat panes = navigation layer, not report layer.

## The rule (mandatory)

**1. Chat (otmux send) = ONE-LINE POINTERS ONLY.**

Body of any otmux send to a teammate must be a single line:

    PLANNER pointer: -> ior:instance:<uuid> + <verb-what-changed>

Examples:

    PLANNER pointer: -> ior:instance:2195d98f-eb78-47da-9048-e8553d2b8d35 stood up T-room-ui-shared
    ARCHITECT pointer: -> ior:instance:8a303a65-d8c1-4aa3-885e-e10e5c3f00ca refinement designed
    EXPERT pointer: -> ior:instance:67b2763e-57d7-4d3e-ac16-11c0f905c3dc implementing[x] v0.5.127
    TESTER pointer: -> ior:instance:bef36fd2-aa7c-4766-8001-db2b69452d61 device-accepted v0.5.125

Multi-task batches: one pointer per task OR a single commit-hash pointer when the batch landed in one commit:

    PLANNER pointer: -> commit 5bb9ca83 + 7 task statuses synced (S19)

**2. Detail goes INTO scenario units, not into chat.**

Findings, status changes, design notes, test evidence belong inside the scenario unit:

- task.model.statusChecklist for status hop transitions
- task.model.description for scope / context updates
- task.model.useCases / coveredRequirements for chain changes
- placeholder.model.placeholderNote for handoff instructions (learning #38)
- requirement.model.tronQuote for verbatim Tron capture

Other agents read the scenario unit at the IOR. The chat pointer tells them where to look.

**3. ln symlinks are the navigation layer.**

The scenario/sprints.json/<sprint>/{requirement,task}/ symlink trees resolve a slug to the canonical 5-deep unit. Agents follow ln links instead of grepping. Round-trip gate (npx tsx scripts/generate-sprint-md.ts --check) reports drift.

**4. statusChecklist edits ARE the status report.**

When an agent finishes their hop (refinement / creating-test-cases / implementing / testing):

- toggle their sub-step checkbox in task.model.statusChecklist (python3 one-liner per learning #44 if classifier-gated, otherwise Edit/Write)
- note the commit-hash + evidence inline in the checked sub-step line
- send a one-line pointer to the next role

The status report IS the sub-step toggle in JSON. No prose summary in chat.

**5. CMM1 anti-pattern: paragraph status dumps in chat.**

Walls of prose, tables, and bullet-summaries in otmux send waste context for every reader. Even when a real change happens, chat carries only the IOR pointer; the change lives in the scenario unit.

Exception: Tron explicitly asks for a chat-rendered table or paragraph. Then provide it inline as a one-off.

## Tron quote (verbatim)

> communicate via the scenario ln links in the chat and updates to the scenarios instead of this loooong chats.

## SM enforcement

SM monitors otmux sends across all panes. Multi-line / table / paragraph sends without an explicit Tron ask trigger an SM reminder pointing at this standard.

## Per-role learning ack

Every agent appends a numbered learning to their own learnings.md acknowledging this standard, then commits the ack:

    git -C /Users/Shared/Workspaces/AI/Claude add session/agents/<role>/learnings.md
    git -C /Users/Shared/Workspaces/AI/Claude commit -m '<role>: ack scenario-link-communication standard 0525f028-150c-4163-b3a8-a753df5581d9'

SM watches for the 5 ack commits (architect, expert, tester, req, planner) before marking the standard live.

## Indexing

Linked from: README.md Traceability section; scrum.pmo/standards/ directory; project-state-is-scenarios.md sibling header pair.
