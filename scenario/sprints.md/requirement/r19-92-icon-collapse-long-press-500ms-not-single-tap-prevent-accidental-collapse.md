### R19.92: Icon collapse = long-press (500ms), not single-tap — prevent accidental collapse on touch devices.

<details><summary>Tron directive</summary>

> The .oi-icon single-tap collapse is overloaded with drag-handle on the same element. On iOS, accidental touches during scroll/jitter fire click → random collapse. FIX: collapse on icon requires 500ms long-press (touchstart timer, touchmove/touchend/dragstart cancel). Single-tap on icon = no action. Drag unaffected. Matches iOS long-press convention.

</details>

## Traceability

**Tasks:**
- [🔗 T-longpress-collapse: icon collapse via 500ms long-press, single-tap absorbed](../task/longpress-collapse-icon-500ms-single-tap-absorbed.md)
