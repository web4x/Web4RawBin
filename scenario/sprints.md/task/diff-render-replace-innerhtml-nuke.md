# T-diff-render: replace innerHTML='' nuke with diff-render in renderRoomTreeMembers/Files
[task:uuid:c524c8a0-9e40-44b8-9fc1-468674648c4f]

## Traceability

**UseCases:**
- [🔗 roomView.diffRenderItems](../usecase/roomview-diffrenderitems.md)


## Task Description

R19.88.A fix: stop innerHTML='' destroy+recreate. diffRenderItems() indexes existing by ref, removes departed, updates attrs in-place (preserves connectedCallback state), appends only new. Shared helper for both members + files. Zero innerHTML='' on live rb-object-item containers.

## Subtasks


