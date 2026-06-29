<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 24.1: Object.verb skill introspection + generation engine

[task:uuid:8bbd1727-041e-456f-a645-67f2b2cd4bb5]

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
    - Requirement R24.1 `[requirement:uuid:527f154f-004d-4ef4-a245-65862e1d3455]`
  - down
    - [UC-SK.1: skill.object-verb-skill](./planning.md#uc-sk1) `[uc:uuid:b77a3494-6b43-4956-bc7e-72485470a6d4]`

## Task Description

Every skill is an Object.verb typed class method whose signature is the single source of truth: objectVerb.ts introspects it to generate CLI invocation + arg-mapping, help text (from JSDoc), Tab-completion (param names + complete()), the OOSH wrapper, the skill docs, and the Claude Code SKILL.md — with NO hand-written flag parsers and NO hand-written skill prose.

## Context

Impl base (formalize, do not rewrite): scripts/objectVerb.ts (introspect/mapArgs/render/helpText/emitOoshText/emitDocsText/emitClaudeSkillText) + scrum.pmo/skills/how-to-write-skills.md + src/ts/scenario/skill-classes.ts. Object.verb = OOSH-for-TS (class=script, method=verb, Tab-complete via c2).

## Intention

PO 2026-06-29: formalize the scattered traceability + MD-planning TS tools as a coherent OOSH-like Object.verb SKILL set. R24.1 is the engine that introspects+generates the other skills.

## Acceptance Criteria

- [ ] (introspect) A public method on a skill class (typed params string/string[]/number/boolean) is discovered by objectVerb.introspect; private methods are invisible
- [ ] (help) Help text is derived from the JSDoc first line (missing JSDoc = broken help, rejected)
- [ ] (complete) Tab-completion candidates come from param names + the class complete(verb,param) method (OOSH c2 contract)
- [ ] (generate) The OOSH wrapper, skill docs, and Claude Code SKILL.md are GENERATED (emitOoshText / emitDocsText / emitClaudeSkills), never hand-written
- [ ] (no-flags) No skill exposes argv --flag parsers; verbs are methods, one canonical measure per metric
- [ ] (completable) Every Object.verb skill is Tab-completable on WODA.prod (the c2/complete() contract resolves live)
- [ ] (ci-drift) The committed OOSH wrapper is byte-equal to emitOosh output; a CI/precommit drift gate fails if they diverge (no hand-edited wrapper)
- [ ] (ownership) Each skill object has a named expert+tester owner and at least one test (no unowned skill surface)

## Subtasks

None (atomic task).
