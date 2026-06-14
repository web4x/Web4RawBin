### BUG4: Deselect must return drawer to CHAT mode, not close it.

<details><summary>Tron directive</summary>

> BEHAVIOR REGRESSION (v0.6.10 drawer consolidation): room opens with chat in drawer (correct per R20.6b). Selecting an item switches to detail content (correct per R20.6c). DESELECTING (tap selected item again or selection becomes empty) CLOSES the drawer entirely instead of returning to CHAT mode. Per R20.6b: empty selection = drawer shows chat. The drawer must NEVER close on deselect — it returns to chat.

</details>