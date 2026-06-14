### BUG9: /trace leaf file (link.url) detail renders BLANK — tagMap maps to unregistered rb-file-detail.

<details><summary>Tron directive</summary>

> BUG: in /trace, clicking a LEAF file item (e.g. link.url) opens the detail drawer but it renders BLANK. Root cause: the tagMap maps file-type scenario units to 'rb-file-detail' custom element which is UNREGISTERED/nonexistent (never defined). The browser creates an unknown element that renders nothing. FIX: either (a) remove 'file' from tagMap so it falls through to the GENERIC detail view (which works for all types), OR (b) actually build and register rb-file-detail as a real custom element with ContentPreviewer integration. Option (a) is the minimal fix. Tron evidence: IMG_4018-20.

</details>