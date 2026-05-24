[Back to Sprint 7 Planning](./planning.md)

# T58: Fix Link Contrast on Sprint Overview Pages

[task:uuid:i58d0e04-cf45-4f61-e789-009900112233]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

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
- [ ] Links clearly readable on gradient background
- [ ] Unvisited = white, visited/hover = shiny light blue

## Subtasks
None (atomic task).
