### R19.71: Room scenario detail lists files[] as children, not 'no children'.

<details><summary>Tron directive</summary>

> The Room scenario detail view currently shows 'no children' even when the room has files in Room.files[] (R19.46). FIX: the detail view's children section MUST list the room's files[] IOR refs as child items (FileUnit children). The Room's FORWARD_KEYS for /api/trace/children should include 'files' (alongside 'members') so the trace walker and detail view both resolve Room→FileUnit children.

</details>

## Traceability

**UseCases:**
- [🔗 traceChildren.roomForwardRefs](../usecase/tracechildren-roomforwardrefs.md)
