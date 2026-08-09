<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.3: Suppress OS (iOS) keyboard + configurable Keyboard Controller (suppression + controller shell + config model)

[task:uuid:d884d8d9-346c-4332-b85a-7704566aaf8e]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

Planned - S40 R40.3 (suppress iOS keyboard + configurable Keyboard Controller shell + config model). ACs MIRRORED from req R40.3 bfe97d61 (requirements.md 3bd0fb847) — SPLIT A-automatable (5: suppress-by-construction / input-still-reaches-pty anti-vacuity / terminal-visible PIXEL / no-overlay PIXEL / configurable) + B-device-only (1: iOS-keyboard-never-opens — TRON real-iOS, NEVER headless-GREEN, like the longpress sliver). coveredRequirements resolves. This sprint = suppression + shell + config model ONLY (controller behavior later). QA-Review: R40.3-A CHAIN-COMPLETE-TO-TEST (planner disk-verified) — Tests f2c7b3e9 + b8e4a1c2 status=pass (A-automatable PROVEN: suppress-attrs + keybar-renders-8-keys + tap->real-PTY-bytes; impls c3a56e56 suppressSoftKeyboard + dbdcc42d renderKeyMap, strict-AST verified 56e5e0628). All 4 In-Progress sub-steps [x]. ★ CERT-SCOPE PENDING (Tron owner-device QA): owner-page + DEVICE — terminal-FULLY-VISIBLE + input-row NO-OVERLAY of Scenario/Edit (pixel @390) + R40.3-B iOS-OSK-NEVER-OPENS (device-only, Tron real-iOS, NEVER headless-GREEN). Done-gate [ ] — NOT Done w/o Tron device sign-off.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.3 `[requirement:uuid:bfe97d61-24b0-4a76-82e7-0ea44406901f]`
  - down
    - None (atomic task)

## Task Description

R40.3 (Tron-authorized S40; Tron screenshot evidence: the iOS keyboard covers the ENTIRE terminal + the input row overlays the Scenario/Edit buttons). An ACTION that PREVENTS the OS-specific (iOS) keyboard from opening, PLUS a new Keyboard Controller surface — like the action bar but with CONFIGURABLE KEYSTROKES. This sprint delivers the SUPPRESSION + the controller SHELL + the config model (the controller behavior/keystroke set is designed LATER, not this sprint). Reuse the action-bar surface pattern + a config model for keystrokes, NO fork. Scenario-first: req mints R40.3 (bfe97d61) + ACs; architect designs the suppression mechanism + controller-shell + config-model chain; expert implements; tester gates @390 (iOS keyboard no longer opens / no longer covers terminal + overlays buttons).

## Acceptance Criteria

- [ ] [A · AUTOMATABLE @390 real-WebKit] (suppress-by-construction) The terminal input is configured to SUPPRESS the OS keyboard by construction (inputmode=none / readonly / not-focusable, per architect design) — verifiable in the served config/DOM, not by observing keyboard absence (vacuously true on a headless host).
- [ ] [A · AUTOMATABLE] (input-still-reaches-pty) Synthetic input STILL REACHES the PTY after suppression — functional proof the suppression did NOT break typing (anti-vacuity guard: the feature must be present, not merely 'no keyboard appeared').
- [ ] [A · AUTOMATABLE @390 + PIXEL] (terminal-fully-visible) The terminal stays FULLY VISIBLE — currently 100% occluded; screenshot pixel-evidence shows it un-occluded (NEVER DOM counts).
- [ ] [A · AUTOMATABLE @390 + PIXEL] (no-overlay-scenario-edit) The keyboard-controller input row does NOT overlay the Scenario/Edit buttons (pixel evidence — Tron's actual reported bug).
- [ ] [A · AUTOMATABLE] (keystrokes-configurable) Keystrokes are CONFIGURABLE (data-driven config model, not hardcoded) — the config model exists and drives the controller shell.
- [ ] [B · DEVICE-ONLY — TRON verifies on REAL iOS; NEVER reportable GREEN from a headless/desktop/Linux-WebKit run] (ios-keyboard-never-opens) The iOS on-screen keyboard genuinely NEVER opens on terminal input (real WebKit on the CI host has no on-screen keyboard, so this cannot be automated without a false pass — device-gated, like the physical-finger longpress sliver).

## Subtasks

None (atomic task).
