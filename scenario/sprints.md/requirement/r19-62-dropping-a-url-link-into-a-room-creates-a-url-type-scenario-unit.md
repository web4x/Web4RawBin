### R19.62: Dropping a URL/link into a room creates a url-type scenario unit.

<details><summary>Tron directive</summary>

> When a URL/link is dropped into the room drop-zone (via the R19.37 extensible dispatcher), the system MUST create a url-type FileUnit scenario unit (like a Windows .url or macOS .webloc). The unit stores the href in model.href, the page title in model.name (if extractable), and model.contentType='url'. This extends R19.37's dispatcher with a 'url' handler alongside the existing 'file' handler. The unit is stored in the scenario index and linked to the room via Room.files[] (R19.46).

</details>

## Traceability

**Tasks:**
- [🔗 T-url-drop-unit: dropping a URL into a room creates a url-type scenario unit](../task/url-drop-creates-url-type-scenario-unit.md)

**UseCases:**
- [🔗 dropZone.urlDrop](../usecase/dropzone-urldrop.md)
