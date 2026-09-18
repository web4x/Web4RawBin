# Reconnect-storm investigation shape (robbin-architect, 2026-09-18)

The lobby flap has TWO required fixes (PO): (A) one-builder room-list (owner-aware `roomListFor(token)` for ALL sends, post-auth) — expert's lane; (B) the RECONNECT STORM — the session reconnects every few seconds, and (A) alone would HIDE it behind a correct-looking screen (the day's recurring failure: a green surface over a broken mechanism). This note specs (B)'s INVESTIGATION (measure, do NOT build) + the required VISIBILITY so a storm can't hide again.

## Measured baseline (grounds the hypothesis)
- **NO app-level WS keepalive:** no ping/pong/heartbeat/isAlive/terminate/idle-timeout on the server WS. So the server does NOT proactively drop idle clients on a few-second cadence → a *server app-level* idle-drop is NOT the mechanism.
- **Client auto-reconnects:** `RawBinClient` (src/public/ts/RawBinClient.ts) has `autoReconnect` + `scheduleReconnect` + `backoffMs`, and `backoffMs` RESETS to 0 on each `connect()` (:93). A served client (server.ts:4672) does `ws.onclose = () => { connected=false; setTimeout(connect, 2000) }` — a fixed **2s** reconnect, matching "seconds apart."
- **Liveness-probe** (RawBinClient :53): an active probe that reconnects a "frozen-but-OPEN" socket — a FALSE-dead detection could reconnect a HEALTHY socket = a self-inflicted loop.
- **Server logs** "WS connected" (:4926) but the close handler (:4936) does NOT log a code/reason today — so the storm is currently INVISIBLE server-side (part of why it hid).

## What to MEASURE (evidence, not inspection)
1. **Rate:** WS connect/close cycles per client (by playerToken/ip) per minute. A storm = many cycles/min for one client. (Server: instrument ws.on connect + close with a per-token counter.)
2. **Close CODE + reason, BOTH sides:** server `ws.on('close', (code, reason))` AND client `ws.onclose(ev.code)`. 1000/1001 = clean/going-away; **1006 = abnormal** (network/infra, no close frame); 1005 = no-status (often client). This is the primary discriminator.
3. **Initiator + timing:** does the CLOSE originate server-side (a handler threw → 1011/error, or an infra proxy dropped → 1006 at a fixed interval) or client-side (the client closed/reopened itself)? Correlate: server "connected"→"closed" ordering, and whether a REAL network drop occurred vs a clean close immediately re-opened.
4. **Which client Tron runs** (/app RawBinClient-with-backoff vs the served 2s-reconnect client) and whether its reconnect fires on a REAL drop or a false-dead (liveness-probe) / a fixed 2s timer.

## CLIENT-retry-loop vs SERVER/INFRA-drop — the discriminator
- **Client retry-loop** (prime hypothesis, from the 2s cadence + backoff-reset + liveness-probe): the client closes/reopens ITSELF — clean close (1000/1005), server sees connect→clean-close→reconnect with NO server error, cycle ~2s (matches server.ts:4672), backoff never grows (resets on connect). Evidence: close is client-initiated, no server-side drop reason, fixed short interval.
- **Server-side drop:** a handler throws on the socket → close 1011/error, server logs an error just before close. (No app keepalive exists, so an app *idle*-drop is not it.)
- **Infra/proxy drop:** close 1006 at a REGULAR interval matching a reverse-proxy/TLS-terminator WS idle-timeout — but those are typically ~30-60s, NOT a few seconds, so a few-second cadence argues AGAINST infra-idle and FOR a client loop.
→ The **close code** settles it: 1006-at-a-fixed-long-interval = infra; 1011/error = server; clean-1000/1005-at-~2s = client retry-loop.

## Required VISIBILITY (by-construction, so a storm can't hide after (A))
- Server: log every WS close WITH `code` + `reason`; a per-token **reconnect counter + rate** (connects/min).
- A GATE/ALARM: if any client's reconnect rate exceeds a JUSTIFIED threshold (relative to normal — a healthy client connects ~once per session; e.g. > 5/min = storm), emit a LOUD log / surface a metric. Threshold named + checkable, not a magic constant pulled from air (tie it to "more than a handful per minute is not a human reconnecting").
- Client: the existing `reconnecting` emit (:59) carries a COUNT and is SURFACED (not silent), so a loop is visible to the user/telemetry.
- **Bite:** simulate a close-loop → the counter climbs + the alarm fires. Remove the counter/alarm → the storm is invisible again → that IS the regression we are preventing.

## Handoff
Read-only investigation first (measure close codes + rate on Tron's live session — expert/tester lane, my SHAPE). Then the fix follows the evidence: a client retry-loop → fix the client reconnect trigger (don't reconnect a healthy socket; real backoff that doesn't reset-to-0 into a tight loop); an infra drop → add an app-level WS ping keepalive (there is none today) so idle sockets stay alive; a server error → fix the throwing handler. The VISIBILITY (counter/log/alarm) ships REGARDLESS of the root, so (A) can never hide (B) again. PO ranks; I own the shape + backstop.
