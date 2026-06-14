### R19.92a: In-room file items use the same data path as /trace — not bespoke WS feed.

<details><summary>Tron directive</summary>

> The /trace traceability browser renders the room's files perfectly (first two pictures). The in-room file tree does NOT. ROOT CAUSE: in-room uses a bespoke WS feed for file items instead of the same scenario-unit data path that /trace uses. FIX: in-room file items MUST use the SAME data path as /trace — load FileUnit scenario units from the scenario index (Room.files[] IOR → fetch unit → render rb-object-item), not a separate WS message feed. This is the DRY principle from R19.90 applied to the DATA layer, not just the component layer.

</details>

## Traceability

**Tasks:**
- [🔗 T-seed-ior-room: in-room tree uses data-seed-ior=roomUuid (proven /trace path)](../task/seed-ior-room-tree-proven-trace-path.md)
