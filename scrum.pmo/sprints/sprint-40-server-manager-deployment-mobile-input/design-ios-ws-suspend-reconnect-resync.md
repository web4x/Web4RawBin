# iOS WebSocket-suspend → reconnect-and-resync (architect, 2026-08-30, capture #1)

Tron's symptom: live surface goes stale, only a manual RELOAD resyncs. Tester verdict: **does-not-reproduce on desktop-WebKit** (passive client-2 flipped 40→37 from the BROADCAST ALONE, 3/3, csLive=3, threw=false, reload-confirms, sanity-held = not a null) ⇒ **the general render path is RULED OUT; the symptom is iOS-Safari-SPECIFIC.** Pre-authed design.

## ★ PREMISE (PO correction — do NOT over-read the earlier elimination)
The "3 of 4 hypotheses ruled out" was measured **ON DESKTOP** and those eliminations **DO NOT TRANSFER to iOS**. On iOS the hypotheses are OPEN again, and **SUSPENDED-SOCKET (eliminated on desktop) is the LEADING candidate.** Carrying a desktop elimination into an iOS diagnosis would be a cross-platform wrong-target false-RED. The design targets the known iOS mechanism; the FIX is general-correct behavior (no UA-sniff, correct on every platform), so it ships without his device — his device is the ACCEPTANCE, not the diagnostic instrument.

## The mechanism (known iOS Safari behavior)
iOS Safari aggressively SUSPENDS a WebSocket when the tab is backgrounded or the screen locks: the socket dies quietly, JS/timers freeze, the page keeps its STALE DOM, and broadcasts sent during suspension are LOST. On return-to-foreground nothing resyncs → manual reload is the only cure = Tron's exact symptom.

## Measured gaps (BOTH transports — this is a shared concern)
1. **live-bridge.ts** (the live-MVC broadcast ws, `ws://host/`): `close → setTimeout(open, 3000)` auto-reconnect ONLY. On iOS suspend: (a) `close` may never fire (silent zombie socket, readyState can stay OPEN-but-dead); (b) the 3s timer is FROZEN while backgrounded; (c) even when it reconnects, it just resumes FUTURE broadcasts — it does NOT re-sync the delta missed during suspension → stale DOM persists.
2. **RawBinClient.ts** (the /app full client): has `onclose`→backoff-reconnect + a `messageQueue` — but the queue recovers OUTBOUND only; there is **no visibilitychange/pageshow trigger** (relies on onclose + a backoff timer, both unreliable under iOS suspend) and **no INBOUND re-sync** on reconnect.
Both: no `visibilitychange`/`pageshow` handler; reconnect ≠ re-sync.

## FIX — reconnect AND re-sync on visibility/pageshow (shared helper, general-correct)
A SHARED transport-lifecycle helper (ONE module — don't implement visible-reconnect twice and drift; the DRY/single-source lesson) that BOTH transports use:
- On **`visibilitychange` → visible** AND **`pageshow`** (incl. bfcache restore, `event.persisted`): 
  1. **Verify-or-reconnect the transport** — if `readyState !== OPEN` OR a liveness probe fails (zombie-open), tear down + reopen NOW (do not wait for the frozen backoff/3s timer). Idempotent: a healthy socket needs no reconnect.
  2. **RE-SYNC state** — REFETCH current authoritative state (current-sprint pin + the live views on screen); do NOT trust the in-memory DOM (missed broadcasts are gone). This is the load-bearing half: reconnect resumes future broadcasts, re-sync recovers the missed delta = what a manual reload does today, done automatically.
  3. **FAIL-LOUD if the resync fails** — surface the visible not-live state (live-bridge's `setLiveState({state:'down'})` / RawBinClient's reconnecting emit); a silently-degraded reconnect recreates the same invisible bug. Never a silent half-resync.
- **General-correct, NO UA-sniff:** `visibilitychange`/`pageshow` are standard; the behavior is right on desktop tab-switch, laptop-sleep, and iOS-background alike. iOS is where it MANIFESTS (aggressive suspend), not a device workaround.
- **Per-transport wiring:** live-bridge — add the visible/pageshow listener calling verify-or-reconnect(open) + resync; RawBinClient — same, reusing its `reconnect()` + adding an inbound resync (refetch current) after `reconnected`, plus the visible/pageshow trigger.

## Gate (desktop-observable — the tester's part; iOS-final is Tron's acceptance)
Isolated (R40.31), must FAIL:
- **RED baseline (the gap):** with the fix removed, close/suspend the transport then fire `visibilitychange→visible` (and `pageshow`) → assert the transport does NOT reconnect / no resync fires / the DOM stays stale.
- **GREEN (the fix):** same → the transport RECONNECTS (observable: a new open ws / setLiveState 'connected') AND a RE-SYNC fires (refetch current called; the on-screen view re-derives from refetched state, not the stale in-memory) — assert the DOM UPDATED to current from the resync alone, no manual reload.
- **fail-loud:** a resync forced to fail → visible not-live state asserted (never silent).
- **stub-must-fail proven** on both directions; **iOS-final confirmation = Tron's device** (acceptance, un-mockable — the actual suspend behavior).

## Handoff
Route to expert (build the shared helper + wire both transports); tester gates the desktop-observable parts (reconnects + resync fires on visibility/pageshow + fail-loud); Tron's device = acceptance. req mints the AC (reconnect-and-resync-on-visibility, fail-loud, both transports; ride R40.54 failable). I re-inspect: shared helper (not two copies), resync REFETCHES current (doesn't trust in-memory), fail-loud on resync-fail, no UA-sniff, both transports wired. Copy PO.
