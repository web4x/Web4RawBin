### R19.88: Every rb-object-item must initialize all interactivity — no partial-init items.

<details><summary>Tron directive</summary>

> BUG: some rb-object-item instances fail ALL interactivity together: no pointer/hand cursor on hover, no collapse-to-icon on click, no drawer-open. Other items of the same type work. This is a per-item INITIALIZATION inconsistency — some items miss the event listener attachment / CSS class / interactive setup entirely. Timing-sensitive: slightly differs between Mac browser and iOS. FIX: rb-object-item initialization must be deterministic and complete for EVERY instance — cursor, click handler (collapse + drawer), drag. No item may be left in a partially-initialized state regardless of render timing or platform.

</details>

## Traceability

**Tasks:**
- [🔗 T-item-init-gate: await customElements.whenDefined before first tree render](../task/item-init-gate-whendefined-before-render.md)
