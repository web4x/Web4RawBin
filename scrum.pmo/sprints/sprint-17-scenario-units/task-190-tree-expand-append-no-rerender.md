[Back to Sprint 17 Planning](./planning.md)

# T190: Tree expand appends only — no full re-render, no scroll jump

[task:uuid:c8a190d2-e3f4-4056-b7c8-9d0e1f2a3b90]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [x] testing (scenarios pre-authored by tester)
- [ ] QA Review
- [ ] Done

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

## QA Audit & User Feedback
- 2026-06-05: Tester pre-authored 8 test scenarios from PO's AC description. Ready to execute the instant expert deploys.
