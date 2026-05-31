[Back to Sprint 17 Planning](./planning.md)

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

## Assigned (per Tron 2026-05-31 directive)
**PO decision-led + agent-trainer-executed:**
1. **robbin-po** — makes the fork decision (when to fork, what scope, naming, sub-skill list)
2. **agent-trainer** — executes the fork (clones robbin-expert role into robbin-skill-expert; tailors the SKILL.md to the skill-set focus)
3. **robbin-req** — captures verbatim Tron quote motivating the fork
4. **robbin-tester** — verifies the new role boots, can read its SKILL, and can be addressed via hiveMind/otmux

> CMM4 4-role: this task's "expert" role is uniquely **agent-trainer**
> (the meta-role that authors other roles' SKILL.md files). Tester verifies
> the new agent functions end-to-end.

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

## Architect Skill Catalog — robbin-architect (2026-05-31)

### Complete .skill File Set for robbin-skill-expert

The skill-expert owns ALL scenario-aware verb functions. Organized by domain:

#### Core CRUD (T138 — already designed)
| Skill | Signature | Source |
|-------|-----------|--------|
| `capture-quote` | `captureQuote(text, sprintIor, taskIor?) → SkillResult<Requirement>` | T138 |
| `propose-task` | `proposeTask(requirementIor, spec) → SkillResult<Task>` | T138 |
| `walk-chain` | `walkChain(ior, direction?, maxDepth?) → ChainStep[]` | T138 |
| `status-transition` | `statusTransition(taskIor, verb, opts?) → SkillResult<Task>` | T138 |

#### Migration (T128/T136 — extend as skills)
| Skill | Signature | Source |
|-------|-----------|--------|
| `migrate-sprint` | `migrateSprint(sprintSlug, opts?) → MigrateResult` | T128 |
| `migrate-requirements` | `migrateRequirements(sprintDir, sprintUuid) → string[]` | T136 |
| `migrate-usecases` | `migrateUseCases(sprintDir, sprintUuid) → string[]` | T136 |

#### View Generation (T126 — wrap as skills)
| Skill | Signature | Source |
|-------|-----------|--------|
| `regenerate-views` | `regenerateViews(sprintSlug?) → { filesWritten: number }` | T126 |
| `regenerate-planning` | `regeneratePlanning(sprintIor) → string` | T126.1 |

#### Source Location (T140 — wrap as skills)
| Skill | Signature | Source |
|-------|-----------|--------|
| `resolve-source` | `resolveSource(ior) → SourceLocation` | T140 |
| `anchor-commit` | `anchorCommit(unitIor) → string` (SHA) | T140 |

#### TraceLink (T134 — wrap as skills)
| Skill | Signature | Source |
|-------|-----------|--------|
| `create-link` | `createLink(fromIor, toIor, relation, opts?) → SkillResult<TraceLink>` | T134 |
| `list-links` | `listLinks(ior, direction?) → TraceLink[]` | T134 |

#### Chain Integrity (T116/T121 — wrap as skills)
| Skill | Signature | Source |
|-------|-----------|--------|
| `audit-chain` | `auditChain(sprintSlug?) → AuditResult` | T116 |
| `fix-uuids` | `fixInvalidUuids(sprintSlug) → { fixed: number }` | T121 |

**Total: 16 skills** across 6 domains.

### SKILL.md Structure for robbin-skill-expert

```markdown
# robbin-skill-expert — Scenario-Unit Skill Verb Maintainer

## Identity
Sole owner of scenario-aware skill verbs. Implements, tests, and maintains
the skill API that all roles invoke instead of hand-editing markdown.

## Owns
- src/ts/scenario/skills.ts (all 16 skill functions)
- src/ts/scenario/skills/ (if split per domain)
- test/vitest/skills-*.test.ts

## Does NOT Own
- General expert work (stays with robbin-expert)
- Template HTML/MD rendering (robbin-expert per T126)
- Architecture decisions (robbin-architect)
- Class model changes (robbin-architect designs, skill-expert implements verb wrappers)

## Reading List (on boot)
1. T138 (core 4 skills — designed)
2. T125 (foundation classes — what skills operate on)
3. T133 (Task FSM — status-transition skill wraps this)
4. T134 (TraceLink — create-link/list-links wrap this)
5. T140 (source location — resolve-source/anchor-commit wrap this)
6. T128/T136 (migration — migrate-* skills wrap these)

## Standing Rules
- #15+#16 rule-pair (version bump on client-facing changes)
- #17 v4 UUIDs only (never invented prefixes)
- #18 CMM4 4-role (req→architect→skill-expert→tester)
- All skills return SkillResult<T> = {ior, unit, links[]}
- All skills throw on invalid input (no silent failures)
- Idempotency required where noted (capture-quote dedupe, migrate-* rerun-safe)
```

### Handoff from robbin-expert

When T139 executes, robbin-expert's SKILL.md gets a note:
```
## Delegated to robbin-skill-expert
- All scenario-unit skill verbs (src/ts/scenario/skills.ts)
- Migration script extensions (scripts/migrate-to-scenario.ts skill wrappers)
- Skill tests (test/vitest/skills-*.test.ts)
```

## Acceptance Criteria
- [ ] AC1 — `~/.claude/agents/robbin-skill-expert/SKILL.md` exists, peer-reviewed by PO
- [ ] AC2 — Agent boots in its assigned pane and reads its SKILL.md correctly (verified by tester)
- [ ] AC3 — Agent can be addressed via `hiveMind send.enter robbin-skill-expert "<msg>"` and `otmux send <pane> "<msg>" Enter`
- [ ] AC4 — Role registry / hiveMind knows the new agent (resolves name → pane correctly)
- [ ] AC5 — Reading-list pointers (T125/T133/T134/T138/etc.) all resolve
- [ ] AC6 — robbin-expert's SKILL.md updated to clarify that skill-set work is now skill-expert's domain (handoff documented)
- [ ] AC7 — Rule-pair: SKILL.md authoring is docs-only — no version bump required (no client-served surface)

## Test Scenarios
| Test | Action | Expected |
|------|--------|----------|
| TS1 | Read ~/.claude/agents/robbin-skill-expert/SKILL.md | Identity + reading list + standing rules present |
| TS2 | Boot the agent in its assigned pane; ask "who are you?" | Returns role identity correctly |
| TS3 | hiveMind resolve robbin-skill-expert | Returns assigned pane address |
| TS4 | Ask the new agent to walk a chain via skill.walkChain (T138 verb) | Returns correct chain walk |
| TS5 | Read robbin-expert SKILL.md | Notes that skill-set work moved to skill-expert |

## Dependencies
- **Requires:** T138 (the verb-set the new role owns); PO decision on timing+scope
- **Enables:** Sustainable maintenance of the scenario-skill verb-set without overloading robbin-expert

## Drive Plan (PO-decision-led, agent-trainer-executed)
1. **PO** makes the fork decision (timing — probably after T138; scope; pane; SKILL.md outline)
2. **req-eng** anchors verbatim Tron quote in this file
3. **agent-trainer** executes: drafts SKILL.md, registers the role, assigns the pane
4. **tester** runs TS1-TS5 (boot verify + chain walk)

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
