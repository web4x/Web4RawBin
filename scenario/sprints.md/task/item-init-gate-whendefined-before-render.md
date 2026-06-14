# T-item-init-gate: await customElements.whenDefined before first tree render
[task:uuid:67abd046-fb92-4327-a9f3-00b3497c0977]

## Traceability

**UseCases:**
- [🔗 roomView.awaitItemUpgrade](../usecase/roomview-awaititemupgrade.md)


## Task Description

R19.88 fix: RoomView.enterRoom must await customElements.whenDefined('rb-object-item') before calling renderMemberList(). Eliminates CE upgrade race where items created before define() runs get no connectedCallback → no cursor, no click, no collapse, no drawer. 1-line await.

## Subtasks


