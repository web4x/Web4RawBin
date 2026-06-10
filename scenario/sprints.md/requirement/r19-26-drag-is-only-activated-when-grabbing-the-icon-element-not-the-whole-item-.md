### R19.26: Drag is only activated when grabbing the icon element, not the whole item row.

<details><summary>Tron directive</summary>

> rb-object-item drag MUST only initiate when the user grabs the icon element. Dragging from the name, description, or any other part of the item row MUST NOT start a drag. The draggable attribute or mousedown/touchstart handler must be scoped to the icon element only.

</details>

## Traceability

**Tasks:**
- [🔗 T-icon-only-drag: drag uses icon-only ghost image](../task/icon-only-drag-ghost-image.md)

**UseCases:**
- [🔗 objectItem.iconDrag](../usecase/objectitem-icondrag.md)
