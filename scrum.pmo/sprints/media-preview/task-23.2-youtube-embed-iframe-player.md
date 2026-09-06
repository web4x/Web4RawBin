<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 23.2: YouTube URLs render as embedded iframe player

[task:uuid:9f599cbf-b544-4d1b-b654-a29fdd7d99a9]

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
    - Requirement R23.2 `[requirement:uuid:8f34c3e5-351c-48b3-8f33-fae45ca279b2]`
  - down
    - [UC-MP.2: preview.renderYouTubeEmbed](./planning.md#uc-mp2) `[uc:uuid:d0d09ff8-27e1-4059-88d0-90cc20f05eb2]`

## Task Description

When a YouTube URL is discovered in a room (dropped as text/uri-list or pasted in chat), the preview automatically renders it as an embedded YouTube iframe player by extracting the video ID and rendering https://www.youtube.com/embed/<id> instead of plain text.

## Context

Room content preview pane (ContentPreviewer / rb-preview-pane, R21.9). A YouTube .url in the Heartspaces room renders as text; this adds detection + iframe embed.

## Intention

Tron: "when a YouTube URL is discovered in the room... automatically render it as an EMBEDDED YouTube iframe player in the preview — extract the video ID from the URL, render as youtube.com/embed/<id>." (Heartspaces room: youtube.com/watch?v=a-_CuBOu6BA shows as text, not embedded.)

## Acceptance Criteria

- [x] A YouTube URL discovered in the room (text/uri-list drop or chat paste) is detected
- [x] The video ID is extracted from the URL (watch?v=<id>, youtu.be/<id>, and embed/<id> forms)
- [x] The preview renders an embedded iframe at `https://www.youtube.com/embed/<id>` (not raw text)
- [x] The existing Heartspaces `.url` (youtube.com/watch?v=a-_CuBOu6BA) renders as an embedded player, not text
- [x] Verified live (headless) — a YouTube URL in a room renders the embed

## Implementation

Shipped v0.6.80 (3a02318ce, LIVE on prod): YouTube .url auto-embed in content-preview.ts (ContentPreviewer / rb-preview-pane, R21.9) — video-id extraction → youtube.com/embed/<id> iframe; sw.js + version bumped (#15/#16). Architect design 72b582092 (single fillPreviewPane landing). Tester GREEN DET-3x (verdict 0eb5f64cc, gate r225-audio-youtube-gate.mjs) — testing hop CLEARED → QA Review (Tron gate). ✓ TRON-ACCEPTED 2026-07-01 (Tron QA review pass) -> DONE (full-AC).

## Subtasks

None (atomic task).
