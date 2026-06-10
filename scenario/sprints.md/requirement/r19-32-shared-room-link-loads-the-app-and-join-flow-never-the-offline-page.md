### R19.32: Shared room link loads the app and join flow, never the offline page.

<details><summary>Tron directive</summary>

> BUG: opening a shared room link (/app?join=<roomUuid>) in a browser lands on the 'RawBin — Offline' page instead of loading the app and triggering the join flow. Sharing (sending the link) works, but the receiving browser shows the offline fallback. FIX: the /app?join=<roomUuid> route MUST be served by the service worker as the app shell (not the offline page), the app MUST parse the ?join= query parameter on load, and MUST initiate the join/apply flow for the referenced room. The SW STATIC_SHELL must include /app or the SPA entry that handles this route.

</details>

## Traceability

**Tasks:**
- [🔗 T-share-link-offline: sw.js cacheFirst ignoreSearch for /app?join=<uuid> offline navigation](../task/share-link-offline-sw-cachefirst-ignoresearch.md)

**UseCases:**
- [🔗 sw.ignoreSearchNav](../usecase/sw-ignoresearchnav.md)
