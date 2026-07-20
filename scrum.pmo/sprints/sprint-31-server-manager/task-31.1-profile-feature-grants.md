<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.1: User-specific profile features section (per-user grants, owner-only entries, profile bottom)

[task:uuid:5be03af7-6acf-40cb-a9dd-b324afdec217]

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
    - [Sprint 31 Planning](./planning.md)
    - Requirement `[requirement:uuid:f032af09-8448-4d03-8cdd-abf6b12feaf1]`
  - down
    - [UC](./planning.md) `[uc:uuid:aa6b0299-35f7-4929-ba9d-f0b028adc3de]`

## Task Description

A NEW section at the BOTTOM of the profile view (after 'My Bug Reports') driven by per-user feature grants keyed to the user token/UUID (generic + extensible grants map). Renders ONLY the features granted to the viewing user; for non-owners it is absent entirely. First entry = 'Server Manager' (granted only to 41ad88c4-...).

## Context

designRef: scrum.pmo/sprints/sprint-31-server-manager/design-server-manager.md (architect 9920f6832 + d4f7fee8c). Owner token 41ad88c4-4dee-49ac-afcb-8a2026657b2d (Marcel Donges). Sprint 31 Server Manager = owner-gated infra console (otmux tree + xterm.js terminal).

## Intention

R31.1 = the profile surface that renders the Server Manager entry (build after the R31.2 gate).

## Acceptance Criteria

- [ ] The profile view renders a feature-grants section AFTER 'My Bug Reports' (bottom of profile).
- [ ] Feature grants are keyed to the user token/UUID; the model is generic+extensible (a grants map, not a hardcoded single feature).
- [ ] The 'Server Manager' entry renders ONLY when the viewing token === 41ad88c4-4dee-49ac-afcb-8a2026657b2d; for any other user the section renders no entries (and is absent if empty).
- [ ] A non-owner viewing their own profile sees NO Server Manager entry and NO empty affordance hinting at it.

## Subtasks

None (atomic task).
