### R19.45: Offline page has a red Flush PWA Cache button next to Retry.

<details><summary>Tron directive</summary>

> The offline page ('You're Offline / Retry') MUST display a RED 'Flush PWA Cache' button next to the existing Retry button. Clicking it clears ALL service-worker caches (caches.keys() → caches.delete() for each) AND unregisters then re-registers the service worker, recovering from stale-cache offline state where the SW serves cached 404s or outdated bundles. After flush, the page auto-reloads to attempt a fresh network fetch.

</details>

## Traceability

**Tasks:**
- [🔗 T-flush-cache-button: offline page red Flush PWA Cache button next to Retry](../task/flush-pwa-cache-button-offline-page.md)

**UseCases:**
- [🔗 offlinePage.flushCache](../usecase/offlinepage-flushcache.md)
