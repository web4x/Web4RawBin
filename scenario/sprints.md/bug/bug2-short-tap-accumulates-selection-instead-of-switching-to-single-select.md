### BUG2: Short tap accumulates selection instead of switching to single-select.

<details><summary>Tron directive</summary>

> BUG in delivered R20.6c+d: (1) short tap accumulates selection instead of SWITCHING — tapSingleSelect must clear() then select (result: size===1). (2) long-press does NOT toggle OFF — if item already selected, long-press should REMOVE it from selection (toggle off). Currently long-press only adds, never removes. FIX both: tap=clear+select(1), long-press=toggle(add if absent, remove if present).

</details>

## Traceability

**Tasks:**
- [🔗 T-selection-tap-switch-longpress-toggle: tap clears+selects ONE, long-press toggles off](../task/selection-tap-switch-longpress-toggle-off.md)
