### R19.57: Full-width drawer must not cover the top-nav back button — back stays visible and clickable.

<details><summary>Tron directive</summary>

> BUG (regression from R19.52 full-width drawer): the detail drawer now covers/hides the top-nav back button (←). FIX: the back button MUST stay visible and clickable above the drawer at all times. The drawer's z-index or layout must not overlap the top navigation bar. Either the drawer starts below the top-nav, or the top-nav has a higher z-index than the drawer.

</details>

## Traceability

**Tasks:**
- [🔗 T-back-button-visible: full-width drawer must not cover top-nav back button (R19.52 regression)](../task/back-button-visible-above-fullwidth-drawer.md)

**UseCases:**
- [🔗 pageNav.backButtonVisible](../usecase/pagenav-backbuttonvisible.md)
