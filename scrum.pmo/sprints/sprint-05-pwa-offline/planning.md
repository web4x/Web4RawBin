[Back to README](../../README.md)

# Sprint 5 Planning — PWA Offline & Traffic Optimization

## Sprint Goal
Make RawBin a true PWA: installable, offline-capable, one-click update, and traffic-optimized for thin internet connections. Leverage browser cache and sync.

## Sprint Overview
**Focus:** Service worker, offline cache, message queue, auto-reconnect, cache headers, update UX
**Team:** robbinTeam (PO, architect, expert, tester)
**Input Sources:** Tron directive — thin internet, must work offline, install + one-click update

## Current State (from PWA audit)
- manifest.json: complete (A)
- Service worker: MISSING (F)
- Icons: referenced but NOT in filesystem (F)
- Cache headers: all no-cache (D)
- WS reconnect: manual only, messages dropped when offline (D)
- Update mechanism: version string only, no UX (D)
- Overall PWA readiness: D-

## Task List

- [x] [T31: Service Worker + App Shell Cache](./task-31-service-worker.md)
  **Priority:** 1 (CRITICAL — enables all offline capability)
  **Effort:** 3h expert + 1h tester
  - Create sw.js with pre-cache of app shell (HTML, CSS, JS, manifest, icons)
  - Cache-first for static assets, network-first for API/WS
  - Offline fallback page when no cache available
  - Register SW in app.ts + app.html manifest link
  - Create actual icon files (192px + 512px PNG)

- [x] [T32: Cache Headers + Asset Versioning](./task-32-cache-headers.md)
  **Priority:** 2 (HIGH — reduces traffic on thin connection)
  **Effort:** 2h expert + 1h tester
  - Static files: Cache-Control with long max-age + hash-based versioning
  - app.html: must-revalidate (always check for updates)
  - Add ETag headers for conditional 304 responses
  - esbuild output with content hash in filename
  - Source maps excluded in production

- [x] [T33: Auto-Reconnect + Message Queue](./task-33-reconnect-queue.md)
  **Priority:** 3 (HIGH — thin connection resilience)
  **Effort:** 3h expert + 1h tester
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Message queue: buffer outgoing messages while disconnected
  - Replay queued messages on reconnect
  - Visual connection status in UI (already have WS status indicator)
  - Online/offline event listeners (navigator.onLine)

- [x] [T34: One-Click Update](./task-34-update-mechanism.md)
  **Priority:** 4 (HIGH — Tron requirement)
  **Effort:** 2h expert + 1h tester
  - SW lifecycle: install → waiting → activate with skipWaiting
  - Version check on app load (/api/config version vs cached version)
  - "Update available" banner with one-click "Update Now" button
  - Update triggers SW update + page reload
  - SW handles clientsClaim for immediate activation

- [x] [T35: iOS PWA Support](./task-35-ios-pwa.md)
  **Priority:** 5 (MEDIUM — Tron uses iPhone)
  **Effort:** 1h expert
  - apple-mobile-web-app-status-bar-style meta tag
  - apple-mobile-web-app-title meta tag
  - apple-touch-icon link (180px)
  - Splash screen images for common iOS sizes
  - Fix app.html: add manifest link (currently missing)

- [x] [T36: Offline Data Persistence](./task-36-offline-data.md)
  **Priority:** 6 (MEDIUM — preserves state offline)
  **Effort:** 2h expert + 1h tester
  - IndexedDB for offline message queue persistence
  - Cache room state locally for offline viewing
  - Background sync API: replay queued messages when online
  - Profile data cached in IndexedDB (not just localStorage)

- [x] [T37: Hotfixes — Private Room + Version Bar](./task-37-hotfixes.md)
  **Priority:** 7 (CRITICAL — Tron QA findings)
  **Effort:** 1h expert
  - Fix private room join (roomKey check was missing)
  - Join-private CSS visible on mobile
  - Version 0.2.0 from package.json, RED update bar

## Dependency Graph
```
T31 (SW + cache) ──→ T32 (headers + versioning) ──→ T34 (one-click update)
      └──→ T33 (reconnect + queue) ──→ T36 (IndexedDB persistence)
T35 (iOS — independent)
T37 (hotfixes — independent)
```

## Sprint Totals
| Metric | Value |
|--------|-------|
| Tasks | 6 (T31-T36) |
| Expert effort | ~13h |
| Tester effort | ~4h |
| Key deliverable | Installable offline PWA with one-click update |

## Definition of Done
- [x] App installs on iOS (Add to Home Screen) and Android (install prompt)
- [x] App loads offline after first visit (service worker serves cached shell)
- [x] WS auto-reconnects with backoff on network blips
- [x] Messages queued while offline, replayed on reconnect
- [x] "Update available" banner appears when new version deployed
- [x] One-click update reloads with new version
- [x] Static assets cached (not re-downloaded every page load)
- [x] Lighthouse PWA score > 90

---

**Product Owner:** robbin-po (robbinTeam:0.0)
**Tron:** research (iphone:0.0)
**Created:** 2026-05-23
**Sprint:** Sprint 5 — PWA Offline & Traffic Optimization
