### R19.101: In-room tree shows BOTH Members AND Files collections via seed-ior — no regression.

<details><summary>Tron directive</summary>

> REGRESSION: consolidating the in-room tree to use seed-ior (R19.90/92) lost the Members collection — only Files render now. Members section is gone from the tree. The Members collection was accepted as missing while files were being fixed, but now must return. FIX: the in-room tree MUST show BOTH Members AND Files as top-level folder nodes (R19.21.A) via the SAME seed-ior data path, WITHOUT regressing the files fix. The Room's children API must return both members[] and files[] as children of the room seed, rendered as two folder-type rb-object-items.

</details>

## Traceability

**Tasks:**
- [🔗 T-seed-tree-members-and-files: /api/trace/children returns members+files (option-B synthetic Member children)](../task/seed-tree-restore-members-and-files.md)
