# RESUME — 5-shape real-drop end-to-end measurement (robbin-tester, PO re-rank 2026-09-06)

## THE GATE INVERTED (this supersedes lint-counting for the upload/drop verdict)
PASS = **the user action SUCCEEDS end-to-end**: drop → unit STORED (real bytes) → RENDERS live.
NOT a well-formed error, NOT a lint 1→0. A gate that greens while Tron's drop fails is WORSE than no gate.
**REAL FIXTURES ONLY** — a constructed multipart POST is the blind-gate that fooled us (and invalidated T40.85:
constructed-input blind gate + a missed 2nd client transport). Do NOT hand-build requests.

## METHOD (per shape, on prod v0.8.192, SystemTester room, CLEAN UP after)
Trigger the APP'S OWN drop path (DropDispatcher.route / the real drop zone) with a REAL payload — so the app builds the
request the way a user's drop does — then verify BOTH halves; PASS only if both:
1. **STORED**: the new unit resolves with real bytes (room files[] grows / `/api/ior/ior:instance:<uuid>` returns a unit
   whose content round-trips, OR `/api/room/file/<uuid>/content?token=ce981242` == source bytes).
2. **RENDERS**: the room tree / file-list shows it live (no reload).
Report PER SHAPE: **works / fails-with-what**. That list is what the PO takes to Tron.

## PRIORITY (PO, if only one gets done): shape-5 in-app object-ref FIRST (the 2nd-client-transport path T40.85 missed), then shape-1 Finder file, then shape-4 URL. (iOS photo/Mail carry fidelity flags — never upgrade a desktop repro to 'iOS works'.)

## THE 5 SHAPES
1. **Finder file** — real File drop (desktop chromium/webkit). Fully desktop-reproducible.
2. **iOS photo** — real image File @390 webkit (closest repro). ⚠ FLAG: not real-iOS (R40.89) — fidelity caveat.
3. **iOS Mail message** — text/html + attachment drop. ⚠ FLAG: iOS-Mail fidelity gap; needs real device / captured bytes.
4. **URL** — real text/uri-list drop → WebItem.
5. **in-app object-ref** — real `application/rb-object-ref` drag → folder. ★ This is the path r4088's SECOND client
   transport (drop-dispatcher.ts xhr :92 vs fetch :59) hits — the 'missed 2nd transport' T40.85 warns of; exercise the REAL one.

## TOOLING ALREADY BUILT (reuse, don't rebuild)
- CLEANUP after measuring: `test/visual/r4090-cleanup-exec.mjs` (deleteRoom by known id) + disk-remove the units +
  VERIFY `/api/ior` returns stillResolves=false (the verified pattern; commit b83bc65b9). Always cleanup — no debris in his app.
- SystemTester seed: localStorage `rawbin-player-id=ce981242-74fe-4d44-b5b6-43c641e224df`; NEVER seed rawbin-name.
- Room create: WS UPDATE_PROFILE{name:'SystemTester'} (its OWN name) → createRoom → #room-tree seeds.

## DISCIPLINE
- Never green a shape unless the drop actually STORES+RENDERS on the real surface. Say works/fails-with-what per shape.
- Lints (r4074/r4084/r4088/r4096, R37.34 axis) are PARKED for this verdict — structural ownership is a SEPARATE track,
  not the working-system proof. The working-system proof is these 5 real drops.
