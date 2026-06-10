### file.persistAsUnit

`file.persistAsUnit`

**Source:** `scrum.pmo/sprints/sprint-19-room-handling/diagrams/s19-task-chain.puml` lines ?-? @?

## Traceability

**Requirements:**
- [🔗 R19.14: Files uploaded into a room are stored in the uuid index as <uuid>.content plus a <uuid>.scenario.json that references the content and carries unitLinks[] to the ln symlinks in the room folder — every file is a unique scenario unit.](../requirement/r19-14-files-uploaded-into-a-room-are-stored-in-the-uuid-index-as-uuid-content-p.md)

**Tasks:**
- [🔗 T-file-unit: Files become scenario units (uuid.content + scenario.json + unitLinks[])](../task/file-as-scenario-unit.md)

**Classes:**
- [🔗 FileUnit](../class/fileunit.md)
