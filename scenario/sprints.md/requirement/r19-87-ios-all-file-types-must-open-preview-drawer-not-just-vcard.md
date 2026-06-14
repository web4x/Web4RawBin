### R19.87: iOS — all file types must open preview drawer, not just vcard.

<details><summary>Tron directive</summary>

> BUG (iOS-specific): on iPhone, only text/vcard files open the ContentPreviewer/detail drawer. Image, HTML, URL/webitem files do NOT open the drawer on iOS — they work on desktop. Root cause likely: iOS Safari touch event handling differs (click vs touchend delegation, passive listeners, or 300ms tap delay interfering with the file-item click handler). FIX: the file-click → drawer-open path must work on iOS Safari for ALL content types (image, html, url, vcard, etc.), not just vcard. Test on real iPhone Safari + PWA.

</details>

## Traceability

**Tasks:**
- [🔗 T-ios-all-types-open-drawer: on iOS, all file types (not just vcard) must open the ContentPreviewer drawer](../task/ios-all-file-types-open-preview-drawer.md)
