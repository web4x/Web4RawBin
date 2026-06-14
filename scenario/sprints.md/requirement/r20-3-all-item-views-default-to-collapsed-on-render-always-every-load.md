### R20.3: All item views default to COLLAPSED on render — always, every load.

<details><summary>Tron directive</summary>

> EVERYTHING defaults to COLLAPSED on render — including the Room root node itself. The full expand sequence is: tap Room → Members/Files folder nodes appear (collapsed) → tap folder → items appear (collapsed) → tap item → children appear. NO auto-expand at any level. Collapsed = children/subtree HIDDEN (expander ">" closed), item shows full card (icon+name+desc). NOT icon-only compact (that is a separate state per item-view-states standard). iOS: oi-icon cursor:grab must not suppress tap-to-expand on iOS Safari.

</details>

## Traceability

**Tasks:**
- [🔗 T-item-views-default-collapsed: every item view defaults COLLAPSED on render, always](../task/item-views-default-collapsed-always.md)
