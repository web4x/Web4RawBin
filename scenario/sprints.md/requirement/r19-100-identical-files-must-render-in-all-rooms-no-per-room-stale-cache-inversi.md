### R19.100: Identical files must render in ALL rooms — no per-room stale-cache inversion.

<details><summary>Tron directive</summary>

> BUG (v0.5.228): identical files in the SYSTEM TEST room do NOT render for Tron, while the md-safari room with the same files DOES render them. This is an inversion — the same data renders in one room but not another. Likely per-room stale cache or per-room scenario-unit load inconsistency. FIX: file rendering must be deterministic per FileUnit UUID regardless of which room displays it. If the FileUnit exists in the index and is in Room.files[], it renders. No per-room cache should suppress rendering.

</details>

## Traceability

**Tasks:**
- [🔗 T-room-render-inversion: identical files must render in ALL rooms (no per-room stale-cache suppression)](../task/per-room-file-render-inversion-fix.md)
