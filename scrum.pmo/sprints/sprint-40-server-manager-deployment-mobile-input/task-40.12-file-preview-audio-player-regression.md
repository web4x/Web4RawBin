<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.12: File detail view renders a working type-appropriate preview (audio player regression fix; fail-loud, all contexts)

[task:uuid:241a2be3-a2cf-4ac7-b2ef-658ebc4507e5]

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

Planned - S40 R40.12 (file detail working-preview / audio-player regression fix, fail-loud all contexts). Scenario-first: req minted R40.12 c9fa4f49 (6a5910d9e); coveredRequirements + useCases 16b3a2ef wired; ACs MIRRORED w/ tags (4 AUTOMATABLE + 1 device @390 pixel Tron). crossRef R23.1 480b40aa (S23 FROZEN legacy; R23.1 unit backfilled AC-6 audio-player-in-room-drawer @390 — S23 board MD frozen/no-regen, unit is the truth). Architect designs. No build until build-go.

## Traceability

  - up
    - [Sprint 40 Planning](./planning.md)
    - Requirement R40.12 `[requirement:uuid:c9fa4f49-caa1-4032-ae47-7144646c4fd0]`
  - down
    - None (atomic task)

## Task Description

R40.12 (Tron: 'here we also have a massive regression from a music player and the item being a file and especially a music file with a music player'). REGRESSION: selecting an audio file (Ed Sheeran - I See Fire.mp3, unit 63462717) in Heartspaces on v0.8.71 renders File badge+name+uuid+parent then a LARGE EMPTY BLACK BOX where the audio player should be — the S23 (R23.1) HTML5 audio player is GONE. FIX (code AND the S23 requirement, per device-regression=missing-AC): a File unit detail view renders a type-appropriate preview (audio->working player), fail-LOUD on failure (never an empty box), present in EVERY context the drawer opens, gated @390 real-device by PIXEL. crossRef R23.1 480b40aa (its verify AC was HEADLESS so it never caught the room-view-drawer empty box; R23.1 gets a backfilled AC-6). Scenario-first: req mints R40.12 + ACs; architect designs; expert implements; tester gates @390 pixel.

## Acceptance Criteria

- [ ] [AUTOMATABLE @390 real-WebKit] A FILE unit detail view renders a TYPE-APPROPRIATE preview; an AUDIO file renders a WORKING HTML5 audio player (play/pause/seek controls PRESENT + functional), NOT an empty container.
- [ ] [AUTOMATABLE, ★ silent-failure guard] If a preview CANNOT render, an EXPLICIT error state is shown -- an empty box is a SILENT failure (the same sin as R40.11 eternal spinner). Fail-LOUD, never a blank container; stub-must-fail (break the asset -> explicit error, not empty).
- [ ] [AUTOMATABLE] The asset is REGISTERED/present in EVERY context the drawer opens: ROOM view AND /trace AND /app -- a context-dependent empty render is HOW this hid (the drawer resolved the file in one context, not the room view).
- [ ] [AUTOMATABLE @390 real-WebKit PIXEL + Tron real-device] Tap the .mp3 -> the player is VISIBLE with controls present, proven by PIXEL screenshot @390 -- NEVER a DOM-count green (a <audio> container in the DOM != a player that renders). Tron confirms on his phone.
- [ ] [AUTOMATABLE] DET-3x + stub-must-fail: strip the player render -> gate RED (proves the gate catches the empty-box regression that shipped).

## Subtasks

None (atomic task).
