### R19.42: Drop-zone has clear onDragEnter/onDragExit visual handlers.

<details><summary>Tron directive</summary>

> The room drop-zone MUST have clear visual feedback on drag interaction: onDragEnter highlights the drop-zone (border glow, background color change, or overlay) indicating a valid drop target; onDragLeave/onDragExit clears the highlight back to default state. The visual state transitions must be clean — no stuck highlights after exit, no flicker on child-element boundary crossing (use dragenter/dragleave counter or pointer tracking).

</details>

## Traceability

**Tasks:**
- [🔗 T-dropzone-visual-highlight: drop-zone onDragEnter/onDragExit visual highlight](../task/dropzone-visual-highlight-dragenter-exit.md)

**UseCases:**
- [🔗 dropZone.feedbackCycle](../usecase/dropzone-feedbackcycle.md)
