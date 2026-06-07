<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->


[Back to Planning](./planning.md)

# Tree lazy-render + scroll-preservation — expand APPENDS children only, no full re-render

[task:uuid:08e46ce3-69f3-40fe-87d7-5ee875a4e94a]

## Status
- [ ] Planned
- [ ] In Progress
- [ ] Done

## Task Description

T186 shipped lazy-LOAD (children fetched on demand) — that's still verified. But Tron flagged a separate atom: even though data is lazy-loaded, the DOM RENDER on click is wholesale: rb-trace-tree clears innerHTML and rebuilds the subtree, which resets scroll to top. In a long tree this is cumbersome — UX regression at the render layer, NOT the data layer.

Fix scope: tree expand handler must APPEND new child item-view elements into the existing parent node's children container (additive DOM mutation), NOT rebuild the whole subtree. Scroll position of the scroll container preserved across expand. Collapse can hide-not-destroy or destroy-without-reflow.

Distinct task per Rule 8 (closure freeze): T186 closed in-scope for lazy-LOAD; T190 owns the lazy-RENDER + scroll-preservation atom on the same /trace + /scenario tree surface.
