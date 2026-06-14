### R19.88.A: Stop destroy+recreate of file items — DIFF/update in place, no innerHTML churn.

<details><summary>Tron directive</summary>

> R19.88 whenDefined gate did NOT fully fix the partial-init race: re-render still destroys and recreates items via innerHTML='' churn, re-introducing the initialization race per item. FIX: stop destroy+recreate. DIFF/update existing item DOM nodes in place — match by file UUID, update changed properties, add new items, remove deleted items. Never innerHTML='' the container that holds live rb-object-item instances. This is architect option-c: reconcile the DOM like a virtual-DOM diff, preserving existing initialized custom elements.

</details>

## Traceability

**Tasks:**
- [🔗 T-diff-render: replace innerHTML='' nuke with diff-render in renderRoomTreeMembers/Files](../task/diff-render-replace-innerhtml-nuke.md)
