# Upload OOP collapse — the OBJECT owns its own upload (architect, P0, 2026-09-06)

Tron: *"wtf don't you understand in EVERYWHERE"* + *"by oop!!!"*. We fixed a multipart parser for a request shape that exists NOWHERE (our node-constructed hypothesis), and even a correct parser fix covers ONE of many paths. Root = the file-bytes-to-server operation is implemented **4+ different ways**. Fix is NOT patch-every-call-site (still N impls waiting to diverge) — it is OOP: the OBJECT owns its upload, ONE method, every caller ASKS it, all paths COLLAPSE + are DELETED, ONE server ingress owner. Then "everywhere" is BY CONSTRUCTION, not a checklist. **P0/CURRENT — above the migration.** Composes with design-mimetype-class-model.md (natural classes + REST unit-JSON + NativeFileIngress).

## The disease (measured — scanned, not assumed "two")
| # | path | transport | endpoint |
|---|---|---|---|
| 1 | `drop-dispatcher.uploadFile` (:58-65) | FormData + **fetch** | POST /api/room/<id>/upload |
| 2 | `drop-dispatcher.uploadWithProgress` (:82-92) | FormData + **XMLHttpRequest** | POST /api/room/<id>/upload |
| 3 | `rb-avatar.uploadBlob` (:199-214) | **fetch, base64-in-JSON** | POST /api/avatar |
| 4 | `ProfileEditor` vcard (:114-125) | **fetch, base64-in-JSON** | POST /api/vcard |
| 5 | tester node harness | node-native multipart (INVENTED) | POST /api/room/<id>/upload |

Callers funneling in: `dispatch`/`dispatchUrl`/`dispatchModelGenerate`/`acceptDropIntoContainer` (RoomView, rb-object-item, rb-diagram-detail), clipboard (RoomView:324), pickers (ProfileEditor vcf-input, rb-avatar ov-file). FOUR distinct client transports (2 multipart + 2 base64-JSON) for one operation = the DRY violation.

## The collapse — ONE owned method, ONE transport, ONE server owner
**The object owns its upload.** A file-bearing gesture becomes a natural-class object which saves ITSELF as a unit:
- **Client, ONE path:** `MimeType.from(file.type)` → the natural class (`Image`/`File`/`Contact`/`Email`/`CalendarEntry`, implementing `UnitConvertible`) → `.load(bytes)` → **`.toUnit()`** (binary base64-inline, R40.98) → **`UnitTransport.putByUuid(unit)`** (R40.96, the ONE transport). Every caller does `Image.from(file).saveTo(container)` — ASKS the object; no caller builds FormData/xhr/fetch.
  - **Progress** (the only reason uploadWithProgress was a 2nd impl) = an optional `onProgress` PARAMETER on the one transport, not a second method.
  - **★ His-device-multipart becomes IRRELEVANT by construction:** the client READS the File in JS (FileReader → bytes → base64) and sends **unit-JSON**, so the server never hand-parses his device's multipart at all. iOS Safari's boundary/param/encoding quirks (whatever the real capture shows) cannot reach a hand-rolled multipart parser, because there isn't one on this path. This is why the collapse fixes it EVERYWHERE — it routes around the entire failure class, not just the shape we mis-guessed.
- **Server, ONE owner:** ONE endpoint receives unit-JSON (the REST unit PUT) → `File.fromUnit()` materializes (base64 → `.content` sidecar + sha256 hash-dedup, R40.98). `/api/room/<id>/upload` (multipart), `/api/avatar`, `/api/vcard` COLLAPSE into it (avatar = an Image unit; vcard = a Contact unit). `NativeFileIngress` remains the ONE owner ONLY for genuinely-external multipart (non-browser clients); the browser path is unit-JSON and needs no multipart parse.

## Collapse + DELETE (not patch)
- DELETE `uploadFile` (1) + `uploadWithProgress` (2) → one `UnitTransport.putByUuid` (progress = param).
- DELETE `rb-avatar.uploadBlob` (3) → `Image.from(blob).saveTo(profile)`.
- DELETE `ProfileEditor` vcard fetch (4) → `Contact.from(vcfText).saveTo(profile)`.
- Re-route `dispatch`/`dispatchUrl`/`dispatchModelGenerate`/`acceptDropIntoContainer`/clipboard/pickers → the one object-owned save. (`dispatchUrl` = a WebItem ref, still the one path via the WebItem natural class.)
- The tester's node-multipart (5) is retired with the multipart client path.

## Gate — scan the HAZARD (0 upload impls outside the owner)
- **0 `new FormData` / `XMLHttpRequest` / fetch-POST-with-file-body OUTSIDE the one `UnitTransport` (+ `NativeFileIngress` for external multipart).** grep the hazard; positional exception = the one owner; seed-a-violation → RED.
- **0 base64-in-JSON file POSTs to bespoke endpoints** (avatar/vcard folded into the unit path).
- One number proves "everywhere" holds by construction.

## Parallel with the real-request capture (both, not either)
The expert's prod capture (verbatim Content-Type / content-length-vs-received / per-part headers / framing offsets, PII-safe, + a synthetic-success control to diff) tells us WHAT his device sends. The collapse gives ONE place to fix. Crucially: if the browser path becomes **read-file→unit-JSON**, his multipart quirks are moot on it — the capture then serves to (a) confirm that hypothesis and (b) spec `NativeFileIngress` correctly for any retained external-multipart path. **No cause claim until the real bytes land; the collapse is the by-construction fix the bytes will confirm.**

## Handoff
Expert (after / alongside the capture): build the client `UnitConvertible` upload (natural class `.toUnit` → `UnitTransport.putByUuid`, FileReader→base64, onProgress param) + the ONE server unit-receive owner; DELETE paths 1-4; fold avatar/vcard. I wire chains (rides R40.96 UnitTransport / R40.97 NativeFileIngress / R40.98 BinaryUnit / R40.99 natural classes — all already minted). req mints any missing AC; tester runs the scan-hazard gate + the real-request diff. No new store (R40.81-consistent). Migration stays paused (safe, reversible) beneath this P0.
