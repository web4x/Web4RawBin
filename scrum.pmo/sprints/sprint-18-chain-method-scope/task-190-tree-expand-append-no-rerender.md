[Back to Sprint 18 Planning](./planning.md)

# T190: Tree expand appends only — no full re-render, no scroll jump

[task:uuid:08e46ce3-69f3-40fe-87d7-5ee875a4e94a]

> Canonical source: `scenario/index/0/8/e/4/6/08e46ce3-69f3-40fe-87d7-5ee875a4e94a.scenario.json` (S18 dogfood — scenario.json first). This .md file holds tester's pre-authored Test Scenarios (TS) for execution; status is mirrored from the unit. uuid + sprint location reconciled by planner per learning #20 + #26 (was sprint-17 + fake-suffix uuid → moved to sprint-18 + real v4).

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect — incremental-append folded into seed-path)
  - [x] creating test cases (tester 27ffe1b4 — 8 TS pre-authored)
  - [x] implementing (expert 02c99a7e v0.5.88)
  - [ ] testing (tester executes 8 TS — pending)
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 18 Planning](./planning.md)
  - Sprint unit: `ior:instance:5b950725-a6f6-4d45-b802-4784ee6ef962`
  - Atomic requirements (covered): R18.5 + R18.6 + R18.7 — req-eng `22f43f31` + `a558480b`
- follows
  - T186 R-Y1 (closed; lazy-LOAD verified)
  - T186 R-Y2 (closed; expand/collapse verified)
- down
  - None (atomic task — 8 TS are test scenarios for execution)

## Task Description
Expanding a tree node appends child-level DOM only — no full re-render of the
tree. Scroll position preserved (no jump-to-top). In a 100+ node tree,
expanding node #50 must not re-layout nodes #1-49.

## Test Scenarios (tester pre-authored — run on deploy)

| TS | Action | Expected | Method |
|----|--------|----------|--------|
| TS1 | Load /trace (100+ items). Record scrollTop. Expand node #50. Check scrollTop. | scrollTop unchanged (±5px tolerance) | Playwright |
| TS2 | Load /trace. Mark DOM node #10 with data-attr. Expand node #50. Check node #10 still has same data-attr (not re-created). | Node #10 element identity preserved (same DOM node, not replaced) | Playwright evaluate |
| TS3 | Load /trace. Count children of node #50 parent BEFORE expand. Expand #50. Count AFTER. | Parent's childNodes grew by the loaded children count; existing children untouched | Playwright evaluate |
| TS4 | Load /trace. Expand node #1. Scroll down to node #50. Expand #50. | No visible flash/jump. scrollTop stays at #50's position. | Playwright screenshot before/after |
| TS5 | Load /trace. Record innerHTML of nodes #1-#10. Expand #50. Compare innerHTML of #1-#10. | Byte-identical (no re-render of earlier nodes) | Playwright evaluate |
| TS6 | Expand then collapse node #50. | Children removed from DOM; parent nodes untouched; scrollTop preserved | Playwright |
| TS7 | Regression: 7-level deep expand still works (T178 keystone) | L1-L7 all lazy-load children | Playwright expand chain |
| TS8 | Regression: 836/836 vitest | Full suite green | vitest |

## Pre-authored verification approach

```javascript
// TS1+TS4: scroll preservation
const tree = page.locator('.trace-tree, rb-trace-tree');
await page.evaluate(() => window.scrollTo(0, 500));
const scrollBefore = await page.evaluate(() => window.scrollY);
// expand node #50
await page.evaluate(() => {
  const items = document.querySelectorAll('rb-object-item[has-children]');
  if (items[49]) items[49].querySelector('.oi-expand')?.click();
});
await page.waitForTimeout(800);
const scrollAfter = await page.evaluate(() => window.scrollY);
assert(Math.abs(scrollAfter - scrollBefore) < 5);

// TS2+TS5: DOM identity preservation
// Tag node #10 with a custom attribute before expand
await page.evaluate(() => {
  const items = document.querySelectorAll('rb-object-item');
  if (items[9]) items[9].setAttribute('data-test-marker', 'identity-check');
});
// expand #50...
// verify marker still on same element
const markerSurvived = await page.evaluate(() =>
  !!document.querySelector('rb-object-item[data-test-marker=identity-check]')
);
```

## Subtasks
None (atomic task — 8 TS above are test scenarios for execution, not subtasks).

## QA Audit & User Feedback
- 2026-06-05: Tester pre-authored 8 test scenarios from PO's AC description. Ready to execute the instant expert deploys.
- 2026-06-05: Expert `02c99a7e` v0.5.88 shipped — seed-path incremental append + toggle (no full re-render); fetchAndRenderChildren appends only; scroll preserved. Tester strict-bar execution pending.
- 2026-06-05: Planner reconciled (learning #20+#26): moved from sprint-17 to sprint-18 (correct sprint); fake-suffix task uuid → real v4 `08e46ce3-…` matching scenario unit; added Traceability + Subtasks sections for Web4Articles audit compliance.
