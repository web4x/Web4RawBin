<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 25.5: Drop-area clipboard preview + import

[task:uuid:7158a210-c5af-4e06-89f1-df60a2226828]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 25 Planning](./planning.md)
    - Requirement R25.5 `[requirement:uuid:2066ba12-6bd8-42b1-9377-25c82fd944e0]`
  - down
    - [UC-CB.1: clipboard.previewAndImport](./planning.md#uc-cb1) `[uc:uuid:10af6d46-b5b7-46d8-8fe8-3289d8f09d72]`
    - [UC-CB.2: clipboard.readAndRoute](./planning.md#uc-cb2) `[uc:uuid:1aa5b1c5-3685-48f6-b90f-9c90eae59ed2]`

## Task Description

The drop area gets a click/tap listener that opens a dialog which PREVIEWS the clipboard content BEFORE asking yes/no: it shows a type icon + a content preview so the user sees WHAT is in the clipboard, then asks 'Upload from clipboard?'. On yes, it reads the clipboard (navigator.clipboard.read/readText), detects the MIME types (same recognition as DnD), and routes them the same as drop-dispatcher: URLs -> WebItem units, images/bytes -> File, text -> file.

## Context

Impl base: src/public/ts/drop-dispatcher.ts (dispatch MIME routing + dispatchUrl->WebItem, REUSED) + src/public/ts/RoomView.ts (drop area rrc-drop). NEW: the click/tap listener + clipboard-read + preview-dialog; routing reuses the existing dispatcher. Scenario-first (RULE #126): unit exists before impl — no code yet.

## Intention

Tron: on the drop area add a click/tap listener that asks 'Upload from clipboard?' — but first PREVIEW what is in the clipboard (type icon + content preview) before yes/no; on yes read clipboard and route by MIME same as DnD.

## Acceptance Criteria

- [x] (listener) The drop area has a click/tap listener that opens the clipboard dialog
- [x] (preview) BEFORE asking yes/no, the dialog previews the clipboard content: a type icon + a content preview (the user sees WHAT is in the clipboard)
- [x] (confirm) The dialog asks 'Upload from clipboard?' (yes/no)
- [x] (read) On yes, the clipboard is read via navigator.clipboard.read / readText and its MIME types are detected (same recognition as DnD)
- [x] (route) Content is routed the same as drop-dispatcher: URLs -> WebItem units, images/bytes -> File, text -> file
- [x] (cancel) On no, nothing is imported

## Implementation

 GREEN → QA Review: impl shipped v0.6.97/v0.6.98 (RoomView.importFromClipboard bd080edb); tester GREEN DET-3x — gate 91df459ae item4 (tap drop-zone → preview clipboard content-type in confirm → CANCEL) covers listener/preview/confirm/cancel; gate 414eb2ecb item5 (clipboard text File name = first line) covers read/route; URL→WebItem routing proven via WebItem name-harvest. ⚠ NOTE: the gates LABEL the clipboard items R26.1 — R25.5≈R26.1 overlap flagged to PO (Sprint 26 emerging; potential re-capture of this clipboard flow, needs dedup ruling like the earlier contamination).

## Subtasks

None (atomic task).
