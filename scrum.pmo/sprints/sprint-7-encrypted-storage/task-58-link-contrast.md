[Back to Sprint 7 Planning](./planning.md)

# T58: Fix Link Contrast on Sprint Overview Pages

[task:uuid:68dec25a-ec4e-4655-904b-0cdff10f50ad]

## Status
- [x] Planned
- [x] In Progress
- [x] QA Review
- [x] Done

## Traceability
- up
  - [Sprint 7 Planning](./planning.md)
- down
  - None (atomic task)

## QA Audit & User Feedback
- 2026-05-24: Tron — links barely readable against new background. Unvisited=WHITE, visited/hovered=SHINY LIGHT BLUE fitting color tones.

## Requirements
- Unvisited links: WHITE (#ffffff)
- Visited links: light blue (#a8c8ff or similar fitting the gradient)
- Hovered links: shiny light blue (#b8d8ff or brighter)
- Applies to: /md/ rendered pages, sprint overview, docs index
- Check MD_CSS in server.ts (inline styles for rendered markdown)
- Check app.css lobby links

## Acceptance Criteria
- [x] Links clearly readable on gradient background
- [x] Unvisited = white, visited/hover = shiny light blue

## Subtasks
None (atomic task).
