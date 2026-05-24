[Back to Sprint 7 Planning](./planning.md)

# T59: Floating Back Button on /md/ File Views

[task:uuid:j59e0f05-dg56-4g72-f890-010011223344]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## QA Audit & User Feedback
- 2026-05-24: Tron — no way back to browser from file view. Add floating CLOSE button bottom-right that does history.back(). On all file views: SVG, markdown, any file.

## Requirements
- Floating button: position fixed, bottom-right, safe-area-inset-bottom
- Text: "✕" or "Close" — always visible
- On click: history.back()
- Appears on: /md/*.md, /md/*.svg, /md/*.puml, /docs/*.md, /md/*/ directory listings
- Style: semi-transparent dark circle, white icon, fits the gradient theme
- Add via the shared pageNav() or pageHead() in server.ts

## Acceptance Criteria
- [ ] Floating button visible bottom-right on all /md/ file views
- [ ] Click navigates back (history.back)
- [ ] Safe-area padding for iPhone
- [ ] Doesn't overlap content

## Subtasks
None (atomic task).
