<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 24 Requirements — Traceability Skills

## Requirements

- [ ] **R24.1 — Object.verb skill introspection + generation engine**
  [requirement:uuid:527f154f-004d-4ef4-a245-65862e1d3455]
  Every skill is an Object.verb typed class method whose signature is the single source of truth: scripts/objectVerb.ts introspects it to generate CLI invocation + arg-mapping, help text (from JSDoc), Tab-completion (from param names + complete()), the OOSH wrapper, the skill docs, and the Claude Code .claude/skills SKILL.md - with NO hand-written flag parsers and NO hand-written skill prose (flags are forbidden as skill surface).
  **Acceptance criteria:**
  - [ ] **(introspect)** A public method on a skill class (typed params string/string[]/number/boolean) is discovered by objectVerb.introspect; private methods are invisible.
  - [ ] **(help)** Help text is derived from the JSDoc first line (missing JSDoc = broken help, rejected).
  - [ ] **(complete)** Tab-completion candidates come from param names + the class complete(verb,param) method (OOSH c2 contract).
  - [ ] **(generate)** The OOSH wrapper, skill docs, and Claude Code SKILL.md are GENERATED (emitOoshText / emitDocsText / emitClaudeSkills), never hand-written.
  - [ ] **(no-flags)** No skill exposes argv --flag parsers; verbs are methods, one canonical measure per metric.
  - [ ] **(completable)** Every Object.verb skill is Tab-completable on WODA.prod (the c2/complete() contract resolves live).
  - [ ] **(ci-drift)** The committed OOSH wrapper is byte-equal to emitOosh output; a CI/precommit drift gate fails if they diverge (no hand-edited wrapper).
  - [ ] **(ownership)** Each skill object has a named expert+tester owner and at least one test (no unowned skill surface).
  -> objectVerb.introspectAndEmit [uc:uuid:b77a3494-6b43-4956-bc7e-72485470a6d4]

- [ ] **R24.2 — Pin management skill (CurrentSprint lifecycle)**
  [requirement:uuid:a545f899-b733-46ac-8fc7-2ef79e401cfe]
  The Current Sprint pin lifecycle is an Object.verb skill (planner-drive.ts / CurrentSprint) with verbs focus, hop, gate, setChain, advance, pin, status: focus auto-derives the chain from the focused task, hop applies a per-agent realtime hop update (req|uc|class|method|impl|test x pending|in-progress|done|gate-proven), gate checks whether the task-switch gate is proven, and advance moves the pin only on a gate-proven test hop.
  **Acceptance criteria:**
  - [ ] **(focus)** focus <task> auto-derives the chain from the focused task; blocked if the current task test hop is not gate-proven (unless --force).
  - [ ] **(hop)** hop <hop> <status> [agent] applies a per-agent realtime hop update over req|uc|class|method|impl|test with statuses pending|in-progress|done|gate-proven.
  - [ ] **(gate)** gate reports whether the task-switch gate is proven (test hop gate-proven).
  - [ ] **(setChain)** setChain wires req/uc/class/method/impl/test + sprint + task into the pin.
  - [ ] **(advance)** advance increments the active-hop pointer (req->uc->class->method->impl->test); pin/status report the current pin (pinCurrent). NOTE: the gate-proven block currently lives on focus/task-switch (AC-1), not advance - gating advance on gate-proven is TARGET behaviour for the formalized skill.
  - [ ] **(object-verb)** The Pin lifecycle verbs (focus/hop/gate/setChain/advance/pin/status) are Object.verb methods on a Pin/CurrentSprint class, NOT ad-hoc argv handlers.
  - [ ] **(shim-parity)** Removal of the planner-drive shim is gated on pin-parity: the Object.verb Pin surface must reproduce planner-drive behaviour before the shim is retired.
  - [ ] **(three-slot)** getThreeSlots returns the 3-slot pin - current / lastCompleted / nextBacklog - the core Current-Sprint pin model.
  - [ ] **(backlog-slot)** setNextBacklog / clearNextBacklog pin and clear the nextBacklog slot (a real planner-drive verb, part of the 3-slot pin).
  - [ ] **(owner)** hopUpdate records the acting agent on the hop; owner-rejection (rejecting a wrong owner) is NOT enforced today - TARGET behaviour for the formalized skill.
  -> pin.manageLifecycle [uc:uuid:90f9bfe3-6d57-4003-be77-6ce8ade76058]

- [ ] **R24.3 — Chain scoring skill (measurement instruments)**
  [requirement:uuid:fc9a7079-5324-4867-95de-784666d7fc5a]
  Chain completion is measured by one Object.verb skill class (skill-classes.ts Chain) exposing scoreboard, followUp, listComplete, lintMarkers (and snapshotComplete): followUp is the ONE canonical completion measure (one summary row per Requirement), scoreboard renders the table + dispatch list + Summary line, listComplete emits one diffable line per complete requirement, and lintMarkers catches invented-suffix uuids / prefix collisions / shared Impls / orphan markers BEFORE a re-measure.
  **Acceptance criteria:**
  - [ ] **(followUp)** Chain.followUp(reqUuids, sprint?) is the single canonical completion measure - one summary row per Requirement, dedup by methodUuid (UUID identity), NOT display name (display names collide: two *.render on one Req = the R15.6 over-credit bug).
  - [ ] **(scoreboard)** Chain.scoreboard renders the canonical markdown: table + dispatch list + Summary line.
  - [ ] **(listComplete)** Chain.listComplete emits one diffable line per COMPLETE requirement (TSV-stable).
  - [ ] **(lintMarkers)** Chain.lintMarkers reports invented-suffix uuids, prefix collisions, shared Impls, and orphan markers before any re-measure.
  - [ ] **(one-measure)** There is exactly ONE completion measure (followUp); no competing/duplicate scoreboard logic.
  - [ ] **(one-measure-confirmed)** scoreboard, listComplete, generateMatrix, and Velocity ALL delegate to Chain.followUp - verified no competing count (skill-expert confirmed).
  -> chain.score [uc:uuid:4b66c336-c740-4cbf-b9b4-4cbee596fee1]

- [ ] **R24.4 — Sprint planning skill (scenario->MD ViewGenerator)**
  [requirement:uuid:9dd36e28-c666-40b8-bc1b-117aac0a7d8a]
  Sprint planning markdown is a GENERATED VIEW of the scenario units (law #100, markdown=VIEW): generate-sprint-md.ts builds planning.md and per-task MD files FROM the Sprint/Task/Requirement scenario units, supports --list and --all, and a round-trip --check that asserts the on-disk MD is a byte-match of the regenerated view (drift = fail).
  **Acceptance criteria:**
  - [ ] **(generate)** generate-sprint-md builds planning.md + per-task MD files from the Sprint/Task scenario units (markdown is a view, never hand-authored source).
  - [ ] **(list-all)** --list enumerates sprints; --all (re)generates every sprint's MD.
  - [ ] **(roundtrip)** --check (check:sprint-md) asserts on-disk MD is a byte-match of the regenerated view; any drift fails.
  - [ ] **(task-files)** Task MD files are created from Task units with their coveredRequirements + chain, speaking-name slugs.
  - [ ] **(law100)** Scenario units are the source of truth; MD is derived (law #100).
  - [ ] **(drift-scope)** --check (check:sprint-md) drift detection also catches EXTRA/orphan stale MD files (e.g. left by a slug rename), scoped to the GENERATED_HEADER region - not just content byte-diff of expected files.
  -> sprint.generateView [uc:uuid:4a606188-2812-42ef-9e13-f44e652ab4b0]

- [ ] **R24.5 — Traceability audit skill (chain integrity + CI gate)**
  [requirement:uuid:79bc8e34-9acb-4338-bbd0-c1f7e817ca7d]
  Chain integrity is audited by an Object.verb skill surface (trace-cli.ts + scripts/trace-audit.ts) exposing trace:check, trace:fix, trace:audit and trace:audit:strict: the audit walks the chain and asserts every Test is reachable from a Requirement root via the 6-step canonical chain, strict mode fails on any gap, and it is wired into the ci:gates pipeline.
  **Acceptance criteria:**
  - [ ] **(check)** trace:check reports chain-integrity issues (missing/dangling links) across the scenario index.
  - [ ] **(fix)** trace:fix repairs the mechanically-fixable chain issues.
  - [ ] **(strict)** trace:audit:strict asserts every Test is reachable from a Requirement root via the 6-step chain and FAILS on any gap.
  - [ ] **(ci)** trace:audit:strict is part of the ci:gates pipeline (nothing ships chain-open).
  - [ ] **(walk)** The audit walks the forward chain per type (FORWARD_KEYS), reporting per-Test reachable depth and offending UUIDs.
  -> trace.audit [uc:uuid:099aa3ed-9e0b-44af-9333-938927f24b6f]
