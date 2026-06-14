### R19.73: In-room file click opens ContentPreviewer — image/html/href preview works in room context.

<details><summary>Tron directive</summary>

> PRIORITY: clicking a file in the IN-ROOM file tree (RoomView Members/Files tree) MUST open the ContentPreviewer (R19.65) in a detail view/drawer within the room context — image renders as img, html/href renders in sandboxed iframe, etc. Currently preview works in /trace detail but NOT on in-room file-click. REUSE the existing ContentPreviewer DRY (same component as /trace, not a reimplementation). The room tree file-click handler must invoke the same preview path that /trace uses.

</details>

## Traceability

**UseCases:**
- [🔗 roomContent.filePreview](../usecase/roomcontent-filepreview.md)
