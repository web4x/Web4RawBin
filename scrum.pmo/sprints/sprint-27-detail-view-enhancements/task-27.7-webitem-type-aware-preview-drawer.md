<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 27.7: WebItem type-aware preview drawer

[task:uuid:b849fda2-b15d-4567-8a73-79d2567ec396]

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
    - [Sprint 27 Planning](./planning.md)
    - Requirement R27.7 `[requirement:uuid:54002f11]`
  - crossRef
    - R22.2 (drawer zoom/pan parity) + R25.x
  - down
    - [UC: webItem.typeAwarePreviewDrawer](./planning.md) `[uc:uuid:d48b4dda-ee20-4af5-9136-d492f4702e1a]`

## Task Description

The WebItem detail drawer previews/routes BY TYPE: http/https show a LIVE iframe preview (server side-proxy on CORS/X-Frame block), pdf renders a pdf embed, mailto/message/tel/calendar show NO preview + a launcher Open card that opens the native app. Previewable vs launcher layouts, action buttons below the handle, zoom/pan + reset-zoom overlay preserved. Type-dispatch by url-scheme/content-type.

## Context

Regression root cause: v0.7.8 mailto-routing-all-webitems. crossRef R22.2 (drawer zoom/pan parity) + R25.x. Type-dispatch (url-scheme/content-type) so a NEW type is add-a-handler, not edit-everywhere.

## Intention

Tron directive. REGRESSION+ENHANCEMENT: v0.7.8 killed the v0.6.56 preview by routing ALL webitems through mailto — restore + generalise to a type-aware drawer.

## Acceptance Criteria

- [ ] (preview) An http/https WebItem shows a LIVE preview (iframe/embed of the URL) in the detail drawer.
- [ ] (preview) When CORS/X-Frame-Options blocks the iframe, the server SIDE-PROXIES the URL (server fetches it) and the preview renders the server-proxied content - never a dead/blank frame.
- [ ] (preview) A pdf WebItem/file renders a pdf preview embed.
- [ ] (routing) mailto / message: / tel / calendar show NO preview and a launcher/Open card that opens in the original app; this different handling must NOT kill http/https preview.
- [ ] (layout) Previewable items (http/https/pdf) layout order = [handle] -> [action buttons: Preview / NewTab] -> [PREVIEW pane] -> [file details BELOW]; preview-first, details below (reversed from the old details-first order).
- [ ] (layout) Non-previewable items use the launcher layout: details + Open below the handle.
- [ ] (zoom) Zoom + pan is preserved (R22.2 / R25.x); the RESET-ZOOM control is an OVERLAY button INSIDE the preview pane, NOT in the action-button row.
- [ ] (layout) The action buttons (Preview / NewTab / Open) sit immediately below the drawer handle.
- [ ] (routing) Routing is BY WebItem type (url-scheme / content-type) via a type-dispatch; adding a NEW scheme can never kill preview for other types (regression-proof, correct-by-construction).

## Implementation

STOOD UP (planning) — status Planned; implementation awaits architect design + TRON GO. 9 ACs from R27.7.

## Subtasks

None (atomic task).
