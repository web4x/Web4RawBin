<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.3: Suppress OS (iOS) keyboard + configurable Keyboard Controller (suppression + controller shell + config model)

[task:uuid:d884d8d9-346c-4332-b85a-7704566aaf8e]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.3 (suppress iOS keyboard + configurable Keyboard Controller shell + config model). ACs MIRRORED from req R40.3 bfe97d61 (requirements.md 9af2aa9f7); coveredRequirements resolves. This sprint = suppression + shell + config model ONLY (controller behavior later). device-gate is PIXEL/screenshot @390 (visual/occlusion, never DOM). Architect supplies useCases[] at design (req UC 9d1225a4). No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.3 `[requirement:uuid:bfe97d61-24b0-4a76-82e7-0ea44406901f]`
  - down
    - None (atomic task)

## Task Description

R40.3 (Tron-authorized S40; Tron screenshot evidence: the iOS keyboard covers the ENTIRE terminal + the input row overlays the Scenario/Edit buttons). An ACTION that PREVENTS the OS-specific (iOS) keyboard from opening, PLUS a new Keyboard Controller surface — like the action bar but with CONFIGURABLE KEYSTROKES. This sprint delivers the SUPPRESSION + the controller SHELL + the config model (the controller behavior/keystroke set is designed LATER, not this sprint). Reuse the action-bar surface pattern + a config model for keystrokes, NO fork. Scenario-first: req mints R40.3 (bfe97d61) + ACs; architect designs the suppression mechanism + controller-shell + config-model chain; expert implements; tester gates @390 (iOS keyboard no longer opens / no longer covers terminal + overlays buttons).

## Acceptance Criteria

- [ ] (no-os-keyboard) Firing the action means the iOS keyboard NEVER opens on terminal input (suppressed by construction, not dismissed after).
- [ ] (terminal-visible) The terminal stays FULLY VISIBLE — it is currently 100% occluded by the keyboard; after the action it is not occluded.
- [ ] (no-overlay) The keyboard-controller input row must NOT overlay the Scenario/Edit buttons.
- [ ] (configurable) Keystrokes are CONFIGURABLE (data-driven config model, not hardcoded) — the config model exists and drives the controller shell.
- [ ] (device-gate-pixel) Gated @390 REAL-WebKit with a SCREENSHOT: pixel evidence that the terminal is un-occluded and the input row clears the Scenario/Edit buttons — NEVER DOM counts (this is a visual/occlusion bug).

## Subtasks

None (atomic task).
