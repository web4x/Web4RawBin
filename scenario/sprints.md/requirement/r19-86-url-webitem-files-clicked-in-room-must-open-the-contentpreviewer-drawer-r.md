### R19.86: URL/webitem files clicked in room must open the ContentPreviewer drawer — regression fix.

<details><summary>Tron directive</summary>

> REGRESSION (~862868bfe): clicking a URL/webitem file item in the in-room file tree no longer opens the ContentPreviewer/detail drawer. Previously worked (R19.73/77). FIX: restore the file-click → drawer-open path for url-type FileUnits. The click handler or event delegation for url/webitem items must invoke the same ContentPreviewer path as image/html files.

</details>

## Traceability

**Tasks:**
- [🔗 T-url-preview-restore: url/webitem file click opens ContentPreviewer drawer (regression fix)](../task/url-preview-restore-click-drawer-regression.md)
