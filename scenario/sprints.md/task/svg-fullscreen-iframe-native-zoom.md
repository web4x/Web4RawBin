# SVG viewer: fullscreen iframe + native zoom
[task:uuid:bef36fd2-aa7c-4766-8001-db2b69452d61]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — chain wired 38653299: UC svgViewer.pinchZoom + Class SvgViewer + Method onPinchEnd + Impl)
  - [x] creating test cases
  - [x] implementing (expert — v0.5.114 → v0.5.121)
  - [x] testing (tester — R18.34.B champagne 2/2 PASS 82ddae97; 3-platform device verify = Tron gate)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 svgViewer.pinchZoom](../usecase/svgviewer-pinchzoom.md)


## Task Description

Replace the current <object> SVG embed (thin centered strip) with a near-fullscreen <iframe> that uses the browser's native pan/zoom. The iframe isolation scopes zoom to the SVG content — no custom JS pinch-zoom needed. Height fills the viewport (min 90vh). pageNav stays visible above.

## Acceptance Criteria

- [ ] AC1: SVG opens in an <iframe> covering most of the viewport (min 90vh height)
- [ ] AC2: Pan/zoom uses native browser gestures scoped inside the iframe
- [ ] AC3: Pinch-zoom on mobile zooms the SVG, not the outer /md/ page
- [ ] AC4: No custom JS pan/zoom implementation
- [ ] AC5: Back navigation works (pageNav visible above iframe)
- [ ] AC6: /md/raw/<path>.svg endpoint still serves raw SVG for the iframe src

## Subtasks


