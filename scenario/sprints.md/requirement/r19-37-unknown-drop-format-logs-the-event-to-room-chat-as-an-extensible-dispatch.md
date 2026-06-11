### R19.37: Unknown drop format logs the event to room chat as an extensible dispatcher.

<details><summary>Tron directive</summary>

> When a drop event carries a format NOT recognized by the current handler registry, the system MUST log the drop event to the room chat with the format details ('Dropped [mimeType]: [name/preview] — no handler yet'). This makes unrecognized drops visible and actionable instead of silently failing. The drop dispatcher is an extensible registry: known formats (file) route to the file-upload chain (R19.36); future formats (vcard, mail, href/links, etc.) plug in via handler registration without modifying the dispatcher core. The dispatcher routes by mimeType/DataTransfer item kind.

</details>

## Traceability

**Tasks:**
- [🔗 T-dnd-unknown-dispatcher: unknown format dropped onto room chat + extensible mimeType registry](../task/dnd-unknown-dispatcher-room-chat-mimetype-registry.md)

**UseCases:**
- [🔗 dropZone.dispatchUnknown](../usecase/dropzone-dispatchunknown.md)
