### R20.6g: Consolidate multiple drawer implementations into one via SelectionModel.

<details><summary>Tron directive</summary>

> CONSOLIDATE: chat drawer and details drawer are currently 3 SEPARATE drawer instances (trace-page L38, scenario-view L38, RoomView L160) with no global selection — each has its own drawer.ref. RoomView BYPASSES VerbRegistry (own click listener L198) and writes drawer.body.innerHTML directly (parallel path). Fresh detail-view per show (no reuse/diff, attr leaks). UNIFY all 3 drawer sites + RoomView bypass+direct-write into ONE selection-driven drawer path: central selectedItem observable (SelectionModel) drives a single drawer. Delete duplicate drawer code. ONE DRY drawer renders chat/detail/summary based on SelectionModel state.

</details>

## Traceability

**Tasks:**
- [🔗 T-selection-model: app-wide SelectionModel + selection-driven drawer/multi-select/drag (R20.6 compound)](../task/selection-model-compound.md)
