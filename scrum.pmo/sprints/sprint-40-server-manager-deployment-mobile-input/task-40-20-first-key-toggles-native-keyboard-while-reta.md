<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.20: First key toggles native keyboard while RETA

[task:uuid:f873ec0e-4128-4995-8f24-fd52783afc13]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.20 (First key toggles native keyboard while RETA). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.20; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(first-position-toggle)** The FIRST (leftmost/primary) key on the artificial key bar IS the toggle — the POSITION is part of the requirement, not a detail.
- [ ] **(toggles-native-keyboard)** Firing it TOGGLES the native (iOS) soft keyboard between SHOWN and HIDDEN.
- [ ] **(bar-retained-both-states)** ★ THE HARD AC (device, most likely to fail-on-device while passing headless): the artificial keys action bar is RETAINED and USABLE in BOTH states. With the native keyboard SHOWN the bar must sit ABOVE the keyboard (input-accessory style) — never covered, never unmounted.
- [ ] **(input-reaches-pty-both)** Input STILL REACHES THE PTY in BOTH states — R40.3's anti-vacuity AC still holds. A bar that renders but sends nothing is the empty-container class we fixed twice this session.
- [ ] **(terminal-visible-usable)** The terminal remains visible/usable per R40.3's pixel ACs (in both keyboard states).
- [ ] **(action-unit-R40.5)** The toggle key is an ACTION UNIT per R40.5's de-duplication — never a bespoke button.
- [ ] **(device-only-390)** ★ DEVICE-ONLY: verified on real iOS @390 on Tron's device, NEVER headless-green. A headless browser cannot show or hide an iOS soft keyboard — the same reason R40.3-B was already split device-only.
- [ ] **(architect-suppression-settable-state)** ★ DESIGN-REQUIRED (architect, R40.3 SHAPE-CHANGE): R40.3 suppressed the keyboard BY CONSTRUCTION; a toggle requires suppression to be a SETTABLE STATE OWNED BY THE BAR (re-enableable), NOT a bolt-on that fights the by-construction suppression. This changes R40.3's shape, not just adds to it.

## Subtasks
