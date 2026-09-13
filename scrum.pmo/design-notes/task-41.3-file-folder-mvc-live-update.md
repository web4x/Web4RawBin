# Task 41.3 — MVC live-update for File & Folder (robbin-architect, 2026-09-13)

Tron (verbatim): "but the ui has NO MVC liveupdates…its all forced reloads!!!" Ordered as Task 41.3, SCOPED to the two classes (File + Folder), NOT a fleet-wide MVC refactor — their live-update behaviour belongs in the same clean build as 41.1/41.2. Banked HERE on disk (not a message) per PO — the none-active ruling got absorbed this morning exactly by living in a ping.

## Measured picture (PO-accepted; counts, not impressions)
- Client surface: **94 `.ts` files. 13 SUBSCRIBE** (ViewBus.on/subscribe). **10 force RELOAD/href.** Live-observation is the MINORITY.
- Tron's surfaces: `rb-trace-tree` SUBSCRIBES; `rb-detail-base`/`rb-detail-drawer` SUBSCRIBE (drawer ALSO reloads); `live-bridge` is the push bridge. BUT `RoomView` (WS-direct, no ViewBus), `rb-task-detail` (static/reload), `model.ts` host (no), `universal-actions` action-bar (RELOADS) do NOT observe. → **"all forced reloads" is directionally TRUE** for his key surfaces (task detail, room, action bar, model host).
- Q3/Q4: a ViewBus/live-bridge push path EXISTS but is PARTIAL + inconsistent (some re-render, the drawer both subscribes AND reloads); there is **no single Model layer all views observe** — views hold COPIES and re-pull. That is the view-layer form of "rebuild the answer from a ref + external machinery" (the anti-pattern Tron banned at the data layer), and it is why every "disk is correct" today failed to reach his screen.

## Observer shape (real MVC — view observes model, model notifies)
- **MODEL** = the File/Folder UNIT owns its state AND a **per-object change-event keyed by its IOR** (emitted on mutation via the ONE write seam, `publishUnitChanged`).
- **VIEW** = the File/Folder tree-node + detail **SUBSCRIBES to THAT object** (ViewBus keyed on the unit's IOR) — not a global/wholesale subscription.
- **ON CHANGE** = re-render THAT object via its OWN `renderSelf()` (the 41.1/41.2 method) — **NOT a wholesale tree rebuild, NOT a forced reload, NO polling.**
- **CONVERGES:** 41.1/41.2 give `File.renderSelf`/`Folder.renderSelf` (the object renders itself); 41.3 = notify → `renderSelf(changed object)`. It also REQUIRES File/Folder writes to go through the emit seam (the route-all-writes-through-seam item, folded in SCOPED to these 2 classes — a direct disk write bypasses the push and blinds the view).

## Failable ACs (hand to req; each: remove the guard → RED)
1. **AC-notify:** a File/Folder unit mutation EMITS a per-object change-event keyed by its IOR (via the write seam). Bypass the seam / no emit → RED.
2. **AC-observe:** the File/Folder view SUBSCRIBES to its own object's event (IOR-keyed), not a global rebuild subscription.
3. **AC-render-object:** on notify, the view re-renders THAT object via `renderSelf()` — no wholesale rebuild, no reload. Force a reload/rebuild → RED.
4. **AC-live-reaches-screen** (the stale-render bite): a File/Folder change reaches the view with NO manual refresh. Bypass observer/seam → screen stale → RED.
5. **AC-no-poll:** no `setInterval`/polling for File/Folder freshness.

## Scope / coordination
- **File + Folder ONLY** (not fleet-wide). The fleet-wide route-all-writes-through-seam remains a separately-ranked design item; 41.3 takes the File/Folder slice.
- **Shape decision** is a MODEL/architecture question → normally Tron's — but 41.3 IS his order and this is its faithful shape; no sub-choice needs a separate confirm (PO-affirmed).
- req mints the 41.3 requirement + ACs; I refine/wire the observer hooks with 41.1/41.2's `renderSelf` on build-go; expert builds; tester fires the 5 bites (esp. AC-live-reaches-screen).
