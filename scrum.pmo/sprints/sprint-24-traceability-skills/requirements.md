[Back to Planning](./planning.md)

# Sprint 24 — Traceability Skills — Requirements

**Source:** PO main-goal directive 2026-06-29 (relaying Tron strategic direction), via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md) + [how-to-write-skills.md](../../skills/how-to-write-skills.md) (Object.verb = OOSH-for-TS).
**Intent:** the tools ALREADY EXIST (scattered); Sprint 24 FORMALIZES them as one coherent Object.verb SKILL set. Each requirement = one skill class/surface, grounded in the existing impl.

---

## Requirements

- [ ] **R24.1 — Object.verb skill introspection + generation engine**
  [requirement:uuid:527f154f-004d-4ef4-a245-65862e1d3455]
  > PO: "PO directive 2026-06-29: formalize the scattered traceability + MD-planning TS tools (planner-drive.ts, objectVerb.ts, generate-sprint-md.ts, trace-cli.ts/trace-audit.ts) as a coherent OOSH-like SKILL set - pin management, chain scoring, sprint planning, traceability audit."
  Every skill is an Object.verb typed class method whose signature is the single source of truth: scripts/objectVerb.ts introspects it to generate CLI invocation + arg-mapping, help text (from JSDoc), Tab-completion (from param names + complete()), the OOSH wrapper, the skill docs, and the Claude Code .claude/skills SKILL.md - with NO hand-written flag parsers and NO hand-written skill prose (flags are forbidden as skill surface).
  *(impl base: ior:file:scripts/objectVerb.ts (introspect/mapArgs/render/helpText/emitOoshText/emitDocsText/emitClaudeSkillText) + scrum.pmo/skills/how-to-write-skills.md + src/ts/scenario/skill-classes.ts)*
  **Acceptance criteria:**
  - [ ] **(introspect)** A public method on a skill class (typed params string/string[]/number/boolean) is discovered by objectVerb.introspect; private methods are invisible.
  - [ ] **(help)** Help text is derived from the JSDoc first line (missing JSDoc = broken help, rejected).
  - [ ] **(complete)** Tab-completion candidates come from param names + the class complete(verb,param) method (OOSH c2 contract).
  - [ ] **(generate)** The OOSH wrapper, skill docs, and Claude Code SKILL.md are GENERATED (emitOosh/emitDocs/emitClaudeSkill), never hand-written.
  - [ ] **(no-flags)** No skill exposes argv --flag parsers; verbs are methods, one canonical measure per metric.
  → [UC-SK.1: skill.object-verb-skill](./planning.md#uc-sk1) `[uc:uuid:b77a3494-6b43-4956-bc7e-72485470a6d4]` *(placeholder)*

- [ ] **R24.2 — Pin management skill (CurrentSprint lifecycle)**
  [requirement:uuid:a545f899-b733-46ac-8fc7-2ef79e401cfe]
  > PO: "PO directive 2026-06-29: formalize the scattered traceability + MD-planning TS tools (planner-drive.ts, objectVerb.ts, generate-sprint-md.ts, trace-cli.ts/trace-audit.ts) as a coherent OOSH-like SKILL set - pin management, chain scoring, sprint planning, traceability audit."
  The Current Sprint pin lifecycle is an Object.verb skill (planner-drive.ts / CurrentSprint) with verbs focus, hop, gate, setChain, advance, pin, status: focus auto-derives the chain from the focused task, hop applies a per-agent realtime hop update (req|uc|class|method|impl|test x pending|in-progress|done|gate-proven), gate checks whether the task-switch gate is proven, and advance moves the pin only on a gate-proven test hop.
  *(impl base: ior:file:scripts/planner-drive.ts (focus/hop/gate/setChain/advance/pin/status) + CurrentSprint (hopUpdate/setChain/advance/pinCurrent))*
  **Acceptance criteria:**
  - [ ] **(focus)** focus <task> auto-derives the chain from the focused task; blocked if the current task test hop is not gate-proven (unless --force).
  - [ ] **(hop)** hop <hop> <status> [agent] applies a per-agent realtime hop update over req|uc|class|method|impl|test with statuses pending|in-progress|done|gate-proven.
  - [ ] **(gate)** gate reports whether the task-switch gate is proven (test hop gate-proven).
  - [ ] **(setChain)** setChain wires req/uc/class/method/impl/test + sprint + task into the pin.
  - [ ] **(advance)** advance moves the Current pin forward only when the gate is proven; pin/status report the current pin (pinCurrent).
  → [UC-SK.2: skill.pin-management-skill](./planning.md#uc-sk2) `[uc:uuid:90f9bfe3-6d57-4003-be77-6ce8ade76058]` *(placeholder)*

- [ ] **R24.3 — Chain scoring skill (measurement instruments)**
  [requirement:uuid:fc9a7079-5324-4867-95de-784666d7fc5a]
  > PO: "PO directive 2026-06-29: formalize the scattered traceability + MD-planning TS tools (planner-drive.ts, objectVerb.ts, generate-sprint-md.ts, trace-cli.ts/trace-audit.ts) as a coherent OOSH-like SKILL set - pin management, chain scoring, sprint planning, traceability audit."
  Chain completion is measured by one Object.verb skill class (skill-classes.ts Chain) exposing scoreboard, followUp, listComplete, lintMarkers (and snapshotComplete): followUp is the ONE canonical completion measure (one summary row per Requirement), scoreboard renders the table + dispatch list + Summary line, listComplete emits one diffable line per complete requirement, and lintMarkers catches invented-suffix uuids / prefix collisions / shared Impls / orphan markers BEFORE a re-measure.
  *(impl base: ior:file:src/ts/scenario/skill-classes.ts class Chain (followUp/listComplete/scoreboard/lintMarkers/snapshotComplete/wireImplNode/generateMatrix))*
  **Acceptance criteria:**
  - [ ] **(followUp)** Chain.followUp(reqUuids, sprint?) is the single canonical completion measure - one summary row per Requirement, dedup by method/first-incomplete representative.
  - [ ] **(scoreboard)** Chain.scoreboard renders the canonical markdown: table + dispatch list + Summary line.
  - [ ] **(listComplete)** Chain.listComplete emits one diffable line per COMPLETE requirement (TSV-stable).
  - [ ] **(lintMarkers)** Chain.lintMarkers reports invented-suffix uuids, prefix collisions, shared Impls, and orphan markers before any re-measure.
  - [ ] **(one-measure)** There is exactly ONE completion measure (followUp); no competing/duplicate scoreboard logic.
  → [UC-SK.3: skill.chain-scoring-skill](./planning.md#uc-sk3) `[uc:uuid:4b66c336-c740-4cbf-b9b4-4cbee596fee1]` *(placeholder)*

- [ ] **R24.4 — Sprint planning skill (scenario->MD ViewGenerator)**
  [requirement:uuid:9dd36e28-c666-40b8-bc1b-117aac0a7d8a]
  > PO: "PO directive 2026-06-29: formalize the scattered traceability + MD-planning TS tools (planner-drive.ts, objectVerb.ts, generate-sprint-md.ts, trace-cli.ts/trace-audit.ts) as a coherent OOSH-like SKILL set - pin management, chain scoring, sprint planning, traceability audit."
  Sprint planning markdown is a GENERATED VIEW of the scenario units (law #100, markdown=VIEW): generate-sprint-md.ts builds planning.md and per-task MD files FROM the Sprint/Task/Requirement scenario units, supports --list and --all, and a round-trip --check that asserts the on-disk MD is a byte-match of the regenerated view (drift = fail).
  *(impl base: ior:file:scripts/generate-sprint-md.ts (generateTaskMd/generatePlanningMd/buildSprintOutput/generateSprint/checkSprint) + npm check:sprint-md)*
  **Acceptance criteria:**
  - [ ] **(generate)** generate-sprint-md builds planning.md + per-task MD files from the Sprint/Task scenario units (markdown is a view, never hand-authored source).
  - [ ] **(list-all)** --list enumerates sprints; --all (re)generates every sprint's MD.
  - [ ] **(roundtrip)** --check (check:sprint-md) asserts on-disk MD is a byte-match of the regenerated view; any drift fails.
  - [ ] **(task-files)** Task MD files are created from Task units with their coveredRequirements + chain, speaking-name slugs.
  - [ ] **(law100)** Scenario units are the source of truth; MD is derived (law #100).
  → [UC-SK.4: skill.sprint-planning-skill](./planning.md#uc-sk4) `[uc:uuid:4a606188-2812-42ef-9e13-f44e652ab4b0]` *(placeholder)*

- [ ] **R24.5 — Traceability audit skill (chain integrity + CI gate)**
  [requirement:uuid:79bc8e34-9acb-4338-bbd0-c1f7e817ca7d]
  > PO: "PO directive 2026-06-29: formalize the scattered traceability + MD-planning TS tools (planner-drive.ts, objectVerb.ts, generate-sprint-md.ts, trace-cli.ts/trace-audit.ts) as a coherent OOSH-like SKILL set - pin management, chain scoring, sprint planning, traceability audit."
  Chain integrity is audited by an Object.verb skill surface (trace-cli.ts + scripts/trace-audit.ts) exposing trace:check, trace:fix, trace:audit and trace:audit:strict: the audit walks the chain and asserts every Test is reachable from a Requirement root via the 6-step canonical chain, strict mode fails on any gap, and it is wired into the ci:gates pipeline.
  *(impl base: ior:file:src/ts/server/trace-cli.ts (check/fix) + scripts/trace-audit.ts (auditAll/walk, --strict) + npm trace:check/trace:fix/trace:audit:strict + ci:gates)*
  **Acceptance criteria:**
  - [ ] **(check)** trace:check reports chain-integrity issues (missing/dangling links) across the scenario index.
  - [ ] **(fix)** trace:fix repairs the mechanically-fixable chain issues.
  - [ ] **(strict)** trace:audit:strict asserts every Test is reachable from a Requirement root via the 6-step chain and FAILS on any gap.
  - [ ] **(ci)** trace:audit:strict is part of the ci:gates pipeline (nothing ships chain-open).
  - [ ] **(walk)** The audit walks the forward chain per type (FORWARD_KEYS), reporting per-Test reachable depth and offending UUIDs.
  → [UC-SK.5: skill.traceability-audit-skill](./planning.md#uc-sk5) `[uc:uuid:099aa3ed-9e0b-44af-9333-938927f24b6f]` *(placeholder)*

---

## Traceability Matrix

| Req | Skill | Requirement UUID | UC placeholder UUID |
|-----|-------|------------------|---------------------|
| R24.1 | Object.verb skill introspection + generation engine | 527f154f-004d-4ef4-a245-65862e1d3455 | b77a3494-6b43-4956-bc7e-72485470a6d4 |
| R24.2 | Pin management skill (CurrentSprint lifecycle) | a545f899-b733-46ac-8fc7-2ef79e401cfe | 90f9bfe3-6d57-4003-be77-6ce8ade76058 |
| R24.3 | Chain scoring skill (measurement instruments) | fc9a7079-5324-4867-95de-784666d7fc5a | 4b66c336-c740-4cbf-b9b4-4cbee596fee1 |
| R24.4 | Sprint planning skill (scenario->MD ViewGenerator) | 9dd36e28-c666-40b8-bc1b-117aac0a7d8a | 4a606188-2812-42ef-9e13-f44e652ab4b0 |
| R24.5 | Traceability audit skill (chain integrity + CI gate) | 79bc8e34-9acb-4338-bbd0-c1f7e817ca7d | 099aa3ed-9e0b-44af-9333-938927f24b6f |

*Captured by robbin-req 2026-06-29. Grounded in the existing impl (objectVerb.ts / planner-drive.ts / skill-classes.ts / generate-sprint-md.ts / trace-cli.ts). Planner to brief per-tool detail; architect designs UC refinement; skill-expert owns the chain tools.*
