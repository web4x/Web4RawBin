### R19.36: DnD file-upload chain is fully traceable from drop to ln link to room file-tree display.

<details><summary>Tron directive</summary>

> Dropping a file into the room drop-zone MUST execute a FULLY TRACEABLE chain: (1) drop event fires on the drop-zone → (2) file extracted from DataTransfer → (3) file content stored as <uuid>.content in the scenario index → (4) FileUnit scenario unit created as <uuid>.scenario.json (per R19.14) → (5) ln symlink created from the room's folder to the file unit (unitLinks per R19.20) → (6) the room's file-tree (Members/Files tree, R19.12) updates to show the new file item. Every step in this chain MUST be a traceable scenario operation — no silent side-effects, no unlinked file creation. The chain is: DropEvent → FileUnit.upload (Method) → FileUnit (Class) → Room.files[] updated → tree re-render.

</details>

## Traceability

**Tasks:**
- [🔗 T-dnd-file-chain: drop file onto room drop-zone uploads and creates FileUnit with ln symlinks in Files tree](../task/dnd-file-chain-drop-upload-fileunit-ln-files-tree.md)

**UseCases:**
- [🔗 dropZone.uploadFile](../usecase/dropzone-uploadfile.md)
