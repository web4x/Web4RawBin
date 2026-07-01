<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 23.1: Audio files play in the preview (HTML5 player)

[task:uuid:2b6be816-1213-4720-b2eb-4efc759b70b0]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 23 Planning](./planning.md)
    - Requirement R23.1 `[requirement:uuid:480b40aa-c0ba-40dc-8876-823ebe3af91b]`
  - down
    - [UC-MP.1: preview.renderAudioPlayer](./planning.md#uc-mp1) `[uc:uuid:b9792582-755d-4f12-8476-42f134b6f4ef]`

## Task Description

When an audio file (mp3, wav, ogg, or m4a) is dropped or uploaded into a room, the preview pane renders an HTML5 <audio controls> player with play, pause, seek, and volume controls. Extends the room content preview (R21.9 rb-preview-pane / ContentPreviewer).

## Context

Room content preview pane (ContentPreviewer / rb-preview-pane, R21.9). Audio files were not rendered as playable; this adds the HTML5 audio player surface.

## Intention

Tron: "MP3 files must play audio in the preview... the preview pane renders an HTML5 audio player with play/pause/seek/volume. Support mp3/wav/ogg/m4a."

## Acceptance Criteria

- [x] Dropping/uploading an audio file into a room stores it and offers it in the preview
- [x] The preview pane renders an HTML5 `<audio controls>` player for the file
- [x] The player provides play/pause, seek, and volume controls
- [x] Supported types: mp3, wav, ogg, m4a (correct MIME/`<source>` per extension)
- [x] Verified live (headless) — an audio file in a room renders the player and is playable

## Implementation

Shipped v0.6.80 (3a02318ce, LIVE on prod): HTML5 `<audio>` preview rendered in content-preview.ts (ContentPreviewer / rb-preview-pane, R21.9); sw.js + version bumped (#15/#16). Architect design 72b582092 (single fillPreviewPane landing). Tester GREEN DET-3x (verdict 0eb5f64cc, gate r225-audio-youtube-gate.mjs) — testing hop CLEARED → QA Review (Tron gate). FOLLOW-ON v0.6.81 (713e1a23c): fixed MP3/audio drop rejected — audio/ MIME added to drop-dispatcher.ts dispatch allowlist (completes R23.1 'dropping an audio file' AC); sw.js + version bumped (#15/#16). ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
