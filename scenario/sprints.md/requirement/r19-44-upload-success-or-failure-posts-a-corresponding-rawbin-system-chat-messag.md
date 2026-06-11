### R19.44: Upload success or failure posts a corresponding RawBin system chat message.

<details><summary>Tron directive</summary>

> On upload completion, the system MUST post a RawBin system chat message (ownerIor = RawBin user per R19.39): on success 'Uploaded <filename>' (or equivalent with file icon); on failure 'Upload failed: <filename> — <reason>'. These are Message scenario units (R19.38) written to the room's chat thread, visible to all room members as system-generated entries.

</details>

## Traceability

**Tasks:**
- [🔗 T-upload-result-message: upload success/failure posts RawBin User message](../task/upload-result-message-rawbin-user.md)

**UseCases:**
- [🔗 dropZone.feedbackCycle](../usecase/dropzone-feedbackcycle.md)
