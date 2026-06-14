### R19.77: URL file preview shows two buttons — Open in preview (inline iframe) and Open in new tab.

<details><summary>Tron directive</summary>

> When previewing a URL-type file unit (.url/.html.url scenario unit per R19.62), the ContentPreviewer MUST show TWO action buttons: (a) 'Open in preview' — renders the URL inline in the sandboxed preview iframe (R19.64/74 iframe path), and (b) 'Open in new tab' — opens the URL in a new browser tab (window.open with target=_blank). This gives the user the choice between inline preview and full-page navigation.

</details>

## Traceability

**UseCases:**
- [🔗 contentPreviewer.urlFileActions](../usecase/contentpreviewer-urlfileactions.md)
