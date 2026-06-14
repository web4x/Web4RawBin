### R19.74: text/html file preview renders in a sandboxed iframe, not as raw source.

<details><summary>Tron directive</summary>

> When previewing a text/html file (uploaded HTML content), the ContentPreviewer MUST render it in a SANDBOXED IFRAME that displays the rendered HTML page — NOT as raw <pre> source text. The iframe carries sandbox='allow-same-origin' per R19.69 (blocks scripts/forms/navigation). This applies both in /trace detail and in-room (R19.73). The content is served via a blob URL or /api/file/<uuid>/content so the iframe loads the actual HTML rendering.

</details>

## Traceability

**UseCases:**
- [🔗 contentPreviewer.htmlSandboxed](../usecase/contentpreviewer-htmlsandboxed.md)
