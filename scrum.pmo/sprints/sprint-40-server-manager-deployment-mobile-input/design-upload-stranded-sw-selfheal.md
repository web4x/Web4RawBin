# Upload stranded-service-worker SELF-HEAL handshake (architect, 2026-09-06)

PO rejected my "ask Tron to unregister/reload" actionable — correctly: that makes the customer fix OUR defect, and his screenshot DISPROVES it (he is on v0.8.187 yet still broken because the old worker keeps CONTROL of the page; a new sw.js can be cached without the old pre-skipWaiting worker ever relinquishing). Manual steps also do nothing for the NEXT stranded device. **The fix must be automatic and by-construction.** The server already logs the machine-detectable signature (server.ts:2640, `received Nb content-length=M`); this design turns that signature into a server→client self-heal handshake. Design-only; hand to expert. **Lock the cause on the expert's raw log line first, but this fix is correct regardless of which cause it names** — it fires ONLY on the exact strip signature.

## The signature (unambiguous, already measured before parse)
In the upload route (server.ts:2633-2640), the raw body is `Buffer.concat(chunks)` from `req.on('data')` BEFORE any parse. The stranded-worker signature is:
```
contentLength = Number(req.headers['content-length'] || 0)
stripped = contentLength > 0 && body.length === 0
```
A real multipart upload always carries boundary overhead, so `body.length===0 while content-length>0` cannot be a legitimate upload — it is a body dropped in flight (the old worker re-issued the POST via networkFirst without the stream). This does NOT collide with the parser cause: a parse fault shows `body.length === contentLength` with parsed fileData=0 (received==declared). The two are distinguishable at exactly this point.

## Server side — a SPECIFIC code, not a generic 401/400
On `stripped`, BEFORE the auth/parse path, respond:
- **HTTP 409 Conflict** (a client-state conflict, distinct from 401 auth / 400 bad-request / 413 too-large).
- Header `X-RawBin-SW-Stripped: 1` (survives even if a worker mangles the JSON body).
- Body `{ "error": "stale-service-worker", "code": "SW_BODY_STRIPPED", "action": "self-heal" }`.
- `Cache-Control: no-store`.
- Keep the existing `[upload] received 0b content-length=…` log (it now also means "answered SW_BODY_STRIPPED").
The response is returned by the old controlling worker's networkFirst to the page, so status+header+body reach the client.

## Client side — self-heal, no reload if avoidable, guarded against loops
In `DropDispatcher.uploadFile`, when `resp.status === 409` AND (`resp.headers.get('X-RawBin-SW-Stripped')==='1'` OR body `code==='SW_BODY_STRIPPED'`):
1. **Loop guard:** read `sessionStorage['sw-selfheal']` (a small counter). If already ≥ 1 this session → do NOT loop; surface a clear one-time message ("Updating the app… if this persists, fully close and reopen") and stop. Else increment it.
2. **Activate the new worker IN PLACE (preferred — no reload, File stays in memory):**
   - `const reg = await navigator.serviceWorker.getRegistration()`
   - `await reg?.update()` (fetches the current sw.js = v0.8.187 with non-GET passthrough + skipWaiting).
   - if `reg?.waiting` → `reg.waiting.postMessage({type:'SKIP_WAITING'})` (sw.js already calls skipWaiting on install, but message it too for the waiting case).
   - `await` a `navigator.serviceWorker` `controllerchange` event, **timeout ~3s**.
3. **Retry ONCE, same File (no reload → File preserved):** re-invoke the upload once. With the new worker controlling (non-GET passthrough), the POST goes straight through → succeeds. Return its result.
4. **Fallback only if controllerchange never fires (timeout):** `await reg?.unregister()`, set `sessionStorage['sw-selfheal-reloaded']=1`, ONE `location.reload()`. After reload the page is uncontrolled/fresh; the loop guard + the reloaded flag prevent a second cycle. (The in-memory File is lost on reload — acceptable last resort; the next drop succeeds. Never reload more than once.)
5. sw.js needs a `message` listener for `{type:'SKIP_WAITING'}` → `self.skipWaiting()` (add if absent; install-time skipWaiting already present).

**Loop safety invariants:** at most ONE in-place self-heal + at most ONE reload per session; a persistent 409 after both → a plain user message, never an infinite reload/retry. The `sessionStorage` flags are cleared on a successful upload.

## Why this is by-construction (protects every future device)
Any device that ever gets stranded (0-body upload) hits the signature on its FIRST upload attempt and auto-recovers — the user does nothing. It is independent of which device, which iOS version, or how it got stranded. It also degrades safely: if the cause is ever NOT the SW (e.g. a genuine future parser 0-byte), the signature (`received==0 & content-length>0`) simply won't match (parser fault = received==content-length), so the handshake never mis-fires.

## Gate (R40.31 isolated; must be able to FAIL)
- **Server:** a request with `content-length>0` but 0 received bytes → 409 + `X-RawBin-SW-Stripped:1` + `SW_BODY_STRIPPED` (not 401/400). stub-must-fail: a normal upload (received==content-length) must NOT get 409.
- **Client:** on 409+signature → performs update()→(skipWaiting)→controllerchange→retry-once; on success clears the flags; loop guard blocks a 2nd cycle. stub-must-fail: simulate a persistent 409 → exactly one in-place heal + at most one reload, then a message (no infinite loop).
- **Device @390 (Tron, the real lock):** his stranded device's next upload auto-recovers with NO manual step. Pair with the expert's raw-log line (`received=0 content-length>0`) which confirms the signature fired.

## Handoff
Expert builds: (server) the strip-signature branch in the upload route returning the 409 handshake; (client) the self-heal in `uploadFile`; (sw.js) the `SKIP_WAITING` message listener. I wire the chain (rides the upload/File area; measure the built shape first). Still PAUSED: Slice-1 OOP + R40.81 until upload works. Lock the cause on the expert's log line; ship this handshake regardless (correct for the SW cause, inert for any other).
