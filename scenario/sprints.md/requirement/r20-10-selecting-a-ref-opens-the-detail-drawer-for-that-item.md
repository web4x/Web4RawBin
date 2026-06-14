### R20.10: Selecting a ref opens the detail drawer for that item.

<details><summary>Tron directive</summary>

> When a user selects an item (via tap/click per R20.6c or SelectionModel change), the detail drawer MUST open and render that item's detail view. This is the OPEN-FOR-SELECTION action — the drawer transitions from closed/chat to showing the selected item's detail. Method: openForRef (0a902bff, extracted from attributeChangedCallback).

</details>

## Traceability

**UseCases:**
- [🔗 detailDrawer.openForRef](../usecase/detaildrawer-openforref.md)
