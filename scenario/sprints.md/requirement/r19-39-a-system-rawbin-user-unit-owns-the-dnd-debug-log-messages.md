### R19.39: A system RawBin User unit owns the DnD debug/log messages.

<details><summary>Tron directive</summary>

> A dedicated system User scenario unit named 'RawBin' MUST exist as the ownerIor for all system-generated messages — specifically the DnD unknown-drop debug/log messages from R19.37. When the drop dispatcher encounters an unknown format and writes a Message unit to the room chat, that Message's ownerIor points to the RawBin system user (not to any human user). This distinguishes system-generated log messages from user-sent chat messages in the UI and in traceability.

</details>

## Traceability

**Tasks:**
- [🔗 T-rawbin-user: system RawBin User owns DnD debug messages](../task/rawbin-user-system-owns-dnd-debug-messages.md)

**UseCases:**
- [🔗 user.ensureSystemOwner](../usecase/user-ensuresystemowner.md)
