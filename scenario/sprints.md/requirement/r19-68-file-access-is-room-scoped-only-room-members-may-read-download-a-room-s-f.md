### R19.68: File access is room-scoped — only room members may read/download a room's files.

<details><summary>Tron directive</summary>

> SECURITY: file access (read/download of uploaded FileUnits) MUST be authorized per room membership. Only authenticated members of a room may access that room's files. The server MUST validate that the requesting user's token is in the room's members[] before serving file content. Unauthenticated or non-member requests return 403. This prevents cross-room file leakage and unauthorized access to uploaded content.

</details>

## Traceability

**UseCases:**
- [🔗 fileApi.roomScopedAccess](../usecase/fileapi-roomscopedaccess.md)
