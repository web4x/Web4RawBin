<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.7: Back = real history.back(); the path label navigates to the containing folder (distinct)

[task:uuid:b6e4a7dd-0453-4658-98e9-25fcc0b864b0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.7 (Back=real-history + path-label=folder-nav, distinct). Scenario-first: req minted R40.7 6ce80195 (515f743b8); coveredRequirements + useCases 5d02d562 wired; ACs MIRRORED (all 3 AUTOMATABLE @390 real-WebKit). Architect designs the chain. No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.7 `[requirement:uuid:6ce80195-a394-4ba3-b9ca-3db7a04d2ce2]`
  - down
    - None (atomic task)

## Task Description

R40.7 (Tron: 'back should be a real history back; the path label should do what back does today'). The '← Back' control performs GENUINE browser history back; clicking the '📁 scenario/...' path label navigates to the containing folder (the behaviour Back does TODAY). The two are distinct and neither does the other's job. Scenario-first: req mints R40.7 + ACs; architect designs; expert implements; tester gates @390.

## Acceptance Criteria

- [ ] [AUTOMATABLE @390 real-WebKit] '← Back' performs genuine history back — proven by navigating 2+ steps then Back returns to the prior view (not the folder).
- [ ] [AUTOMATABLE @390 real-WebKit] Clicking the '📁 scenario/...' path label navigates to the CONTAINING FOLDER (today's Back behaviour).
- [ ] [AUTOMATABLE @390] The two are DISTINCT: Back does history, the path label does folder-nav; neither does the other's job (both asserted in one flow).

## Subtasks

None (atomic task).
