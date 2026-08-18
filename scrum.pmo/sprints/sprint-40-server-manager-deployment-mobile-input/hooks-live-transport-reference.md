# R40.45 live-transport HOOKS REFERENCE — for the tester's real-page two-client proof

robbin-expert 2026-08-18. DURABLE handoff (committed, survives rewind) documenting the observables I SHIPPED in v0.8.110
so the tester's independent proof asserts against the RIGHT signals. This DOCUMENTS shipped hooks — it does NOT verify
them (verifier ≠ fixer frame; the proof is the tester's). Source: `src/public/ts/page-bootstrap.ts` + `src/public/ts/live-bridge.ts` (served v0.8.110, commit 74948524d).

## ★★ THE #1 GOTCHA — per-surface CONNECTED signal is DIFFERENT on /app (L16 wrong-target guard)
`connectLiveBridge()` (live-bridge.ts) **SHORT-CIRCUITS** when `window.__rawbinClient` exists: `if (_wired || window.__rawbinClient) return;`. **/app owns the FULL `RawBinClient`** (app.ts:10 `new RawBinClient()` + :69 `.connect()`), so on /app `connectLiveBridge` returns early and **`window.__liveTransport` is NEVER set**.
- **/trace, /model, /scenario** → assert `window.__liveTransport.state === 'connected'` (and/or `<html data-live-transport="connected">`).
- **/app** → assert its OWN client signal: `window.__rawbinClient` present AND the page live-updates. ★ Asserting `__liveTransport === 'connected'` on /app = **FALSE RED on a WORKING page**. Do NOT.

## CONNECTED = a REAL open ws (not "bootstrap ran")
`window.__liveTransport` = `{ state: 'connecting' | 'connected' | 'down', cause?, at }` (also mirrored to `<html data-live-transport="<state>[:<cause>]">`). `'connected'` is set ONLY inside the ws `'open'` handler = a real open socket. down `cause`s: `ws-error`, `ws-closed` (auto-reconnects after 3s), `boot-failed:<cause>`. A raw-ws client or the acting tab's local emit are BOTH DISALLOWED as proof of the broadcast→page path (they false-green — architect AMEND-3).

## THE EMIT PATH (what a SECOND client receives — the admissible proof)
1. Owner acts on client-1 → server `approveByOwner`/make-current → `UnitController.apply({publish: publishUnitChanged})` → `_write` → `publishUnitChanged` (server.ts:190) = `wsClients.forEach(send 'unit-changed')` + re-emits CurrentSprint.
2. client-2's `connectLiveBridge` ws `'message'` → `notifyUnitChanged(msg)` → if `msg.type==='unit-changed'`: `ViewBus.notify(`<type>:<uuid>`)` (type = `msg.ior.split(':')[2].toLowerCase()`), else `ViewBus.notify('graph')` (structural create/delete).
3. Subscribers re-render: `rb-object-item.refreshLive()` → **surgical** `GET /api/ior/<uuid>` (ONE unit — capture client-2's requests = only this, NO whole-tree refetch) → row + badge; `rb-detail-view` ref-subscribes → detail; the action-bar re-derives (below).
★ **AMEND-1**: the ACTING tab (client-1) also does a LOCAL `ViewBus.notify(`task:<uuid>`)` after its 200 → it re-renders from its OWN emit regardless of the broadcast. So client-1 passing proves NOTHING about the broadcast path. The proof MUST be a SECOND client that did NOT act (no local emit) re-rendering from the broadcast ALONE.

## CONTROLS re-derive on the SAME emit (architect AMEND-2 — the acceptance-definition hole)
The action bar (`rb-detail-drawer` `universalActionBar`, subscribes `_shownRef` on the ONE bus) RE-DERIVES visibility on the same ViewBus emit — NOT latched at mount. After approve→Done: Approve/Decline VANISH; Set-as-Current matrix recomputes (pinRole). Assert CONTROLS on client-2, not just row/badge/detail.

## DECLARED opt-out
A page with no live units: `bootstrapPage({ transport: false })` — an explicit declaration, never a silent default.

## stub-must-fail (the proof must be able to fail)
- Disable server `publishUnitChanged` on the approve path → client-2 stays `__liveTransport==='connected'` BUT gets NO `ViewBus.notify` → row/badge/detail/controls do NOT update = RED. (The acting tab would still update via its local emit — proving the proof tests the BROADCAST, not the shortcut.)
- Point the proof at a page whose `connectLiveBridge` is removed → `__liveTransport` never `'connected'` → client-2 no update.
- Latch a control's visibility at mount (ignore the emit) → after approve→Done, Approve/Decline STILL present on client-2 = RED.

## Test-context gotchas (from rtron-twoclient-approve-harness.mjs)
- Block service workers in the browser context (`serviceWorkers: 'block'`) — a cached SW masks a live render.
- The receive-only ws is a BARE connect (in `wsClients`, no IDENTIFY needed to RECEIVE broadcasts).
- Isolation: the owner-SUCCESS path (real approve→Done) must run on R40.31 isolation (never prod:4444, never a real Done) — the expert owner-action smoke authors that scratch-server foundation; the render half can route-mock a throwaway node (as rtron-twoclient does) but the BROADCAST must come from a real server emit to be admissible.

Files: `src/public/ts/page-bootstrap.ts` (`bootstrapPage`), `src/public/ts/live-bridge.ts` (`connectLiveBridge` / `notifyUnitChanged` / `setLiveState`). Expert = fix-on-demand on whatever the proof finds.
