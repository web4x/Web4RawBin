# Housekeeping (fresh-session, NOT blocking, does NOT affect the 20 champagne) — dup altIds
Counted by uuid, so colliding altIds don't double-count. These are DISTINCT requirements sharing an altId (numbering collision, not true dups). Re-number one of each pair to a unique altId (req-eng/architect; planner wires). Logged 2026-06-14 (02:00, climb deferred to fresh session).

| altId | unit A | unit B | both distinct behaviors |
|-------|--------|--------|--------------------------|
| R19.84 | 0be510a8 "Drawer nudge DRAG-RESIZE" | 62e1b2e1 "Drawer grab-handle drag" | yes — 2 drag behaviors |
| R19.85 | e29dcae1 "Iframe pinch gesture SCALE" (fd) | b6ad2bdd "Iframe preview content preview" (fd) | yes |
| R19.89 | bd9bb433 "Move Remove-Local-Identity" | 2ad3fd18 "Red Remove-Local-Identity" | yes |
| R19.92 | 71a8954e "In-room file items use tree" (fd) | b5688a42 "Icon collapse = long-press" (fd) | yes |

Action (fresh session): req-eng assigns unique altIds (e.g. R19.84/R19.84.A or next free numbers) per the distinct behavior; planner verifies no chain breaks + det-3x holds 20.
