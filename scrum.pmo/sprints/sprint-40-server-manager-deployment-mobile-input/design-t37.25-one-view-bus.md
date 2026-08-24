# T37.25 — ONE VIEW BUS (Realtime-MVC single-source) — architect design (2026-08-24)

PO-dispatched, design-only (I rule + specify, expert builds, tester proves @390). The disease is **TWO SOURCES OF A SHARED TRUTH** — same shape as derivedCurrentTaskUuid-vs-designation, baked-pinRole-vs-live-slot, the re-declared cast, two uuid normalizations. **Cure = ELIMINATION, not reconciliation: retire the second definition, never synchronize it.** Bounded increments, bank each (the 6-edit-recipe model).

## MEASURED ground truth (first-hand, dist excluded)
The instance is ALREADY unified — but two second-sources remain around it:
- **ONE real bus instance:** `trace/ViewBus.ts` → `export const ViewBus = new ViewBusImpl()`, canonical `viewBusKey` (R40.45, 98ac90205). Transport bridges (`live-bridge.ts`, `RawBinClient.ts`) notify it; trace views subscribe directly. Gated by `check-viewbus-key-single-source` (raw-ref subscribe/notify → RED). ✓ unified side.
- **SECOND-SOURCE #1 — the root adapter `../ViewBus.ts`** (24-line model-carrying API over the SAME instance; TWO import paths). Consumers = 4 User-surfaces: `ProfileEditor:188` publishes `{displayName}`, `ProfileSheet:51` / `RoomBrowser:117` / `rb-member-badge:14` subscribe. `RawBinClient.ts:4` explicitly flags it: *"NOTED DEBT: two ViewBus files exist → reconcile to ONE = C4 DRY."* An adapter kept-in-step IS the reconciliation the PO says to eliminate, and two import paths invite re-divergence.
- **SECOND-SOURCE #2 — parallel `window.dispatchEvent(CustomEvent('rb-*'))` channels.** Measured counts: `rb-avatar-updated`×6, `rb-model-resynced`×2 = MODEL-TRUTH broadcasts paralleling ViewBus. vs `rb-drawer-detail-shown`/`rb-tree-reveal`/`rb-drawer-action`/`rb-diagram-refresh`/`rb-active-diagram`/`rb-room-files-dropped`/`rb-reconnect`/`rb-model-resync-request` = intra-tab UI-orchestration / transport-control.

## The 3 properties that ACTUALLY caught the bugs (carry them, per PO)
1. **subscribe-on-render ⇒ no stored copy to go stale** — the consumer derives live on each render; a pushed/cached model IS a mini-second-source (I measured stale `model.slots` / baked pinRole myself).
2. **the gate asserts CONSUMER-vs-CONSUMER on the RENDERED artifact** — not each view against a model (a view-vs-its-own-model check passes even when two views disagree).
3. **POST-BROADCAST, never at initial load** — at load everything agrees and a correct-looking check false-passes; the defect only appears after a mutation broadcast.

## THE SLICE — elimination in bounded increments

### Increment 1 — RETIRE the root adapter (one file, one API, one import path)
Migrate the 4 User-surfaces to import the canonical `ViewBus` + `viewBusKey` from `trace/ViewBus.ts` directly, keyed `viewBusKey({ type: 'User', uuid: token })`. **DELETE `src/public/ts/ViewBus.ts`.** Kills the file-level second-source + two-import-paths + the re-divergence risk RawBinClient named. Elimination — the adapter is gone, not kept in step. (Bank point.)

### Increment 2 — subscribe-on-render, no stored model-copy
The adapter delivered a MODEL payload (`displayName`) = a pushed COPY that can go stale. Replace with the canonical semantics: User-surfaces **subscribe-on-render** to the `User:token` key and on notify **RE-DERIVE live** (re-read the authoritative profile / shared store), never cache the pushed model; the notify goes payload-free (re-render/re-fetch). This is the "no stored copy" property. (Bank point.)

### Increment 3 — retire pushed model COPIES; the discriminator is STRUCTURAL at the CONSUMER (PO gap closed)
★ PO caught that my first cut here was a hand-maintained KEEP list = the same rot as check:pin-single-source's actor blocklist (a new model-carrying event added to the "orchestration" bucket hides by construction). I MEASURED every `rb-*` CustomEvent payload to find a structural discriminator, and the honest finding is two-part:
- **A purely event-TYPE discriminator that needs NO list does NOT cleanly exist.** Both kinds carry payloads; separating "carries model field values" from "carries a ref" would need a model-field allowlist — itself a rotting hand-list. Said plainly, per the PO's instruction.
- **BUT the RIGHT structural discriminator exists at the CONSUMER, and it IS the whole cure's property (no-stored-copy).** Measured: model-truth events carry a VALUE a subscriber PAINTS (`rb-avatar-updated {token,url,crop}`, `rb-avatar-changed {avatarUrl}` → subscriber renders `detail.url`); orchestration events carry only a REF/TARGET (`rb-tree-reveal {ref}`, `rb-active-diagram {uuid}`, `rb-drawer-detail-shown {type,ref}`, `rb-drawer-action {verb,ref}` → subscriber uses `detail.ref` to act, paints no value). So the HAZARD is not the event-type — it is **a subscriber that RENDERS a field value carried in an event detail (a pushed copy) instead of using the detail only as a ref/signal to re-derive from the authoritative source.**

**RULING — the gate asserts the CONSUMER property, not an event list:** no subscriber may paint `event.detail.<modelValue>`; an event `detail` may be consumed ONLY as a ref/target/signal (re-derive/re-fetch keyed by it), never as the model itself. Then:
- **The KEEP set FALLS OUT of the property** (orchestration events carry no painted value → nothing to fix), never enumerated.
- **A NEW model-carrying event cannot hide:** if any consumer paints its detail value → RED; if it only uses a ref → it is genuinely orchestration. The gate decides WITHOUT a list.
- **This SUBSUMES the avatar case:** `rb-avatar-updated` subscribers must re-derive the avatar from the authoritative profile on the signal, not paint `detail.url` (retire the pushed value — same as retiring the displayName push in Increment 2). And it SHARPENS my earlier call: `rb-model-resynced {sourceFile,diagramUuid}` is a re-derive SIGNAL (refs, no painted value) → genuinely orchestration, NOT folded — the property is more correct than my hand-classification was.
- **Belt-and-suspenders divergence net (secondary):** a lint also flags any NEW `rb-*` event NAME not previously seen, for one-time triage — so even a novel channel surfaces LOUD, but the primary decision is the consumer-property, not the name list. (Bank point.)

### Increment 4 — the SINGLE-SOURCE gate: structural + R37.12 @390 consumer-vs-consumer POST-BROADCAST
- **Structural (extend `check-viewbus-key-single-source`):** two hazard assertions, neither an actor list — (i) ONE ViewBus file/instance: `../ViewBus.ts` GONE, no second `new ViewBusImpl`; (ii) the CONSUMER property from Increment 3: **no subscriber paints a field VALUE carried in a `CustomEvent` detail** (a detail is a ref/signal only) — this catches a model-truth second-source by its SHAPE (a painted pushed copy), so the KEEP set needs no enumeration and a new model-carrying event can't hide. **Stub-must-fail:** (a) a second bus file / `new ViewBusImpl` → RED; (b) a consumer that renders `event.detail.<value>` as the model → RED. Plus the secondary divergence net (a never-seen `rb-*` event name → triage-flag).
- **Runtime R37.12 @390 (CONSUMER-vs-CONSUMER, POST-BROADCAST):** after a mutation BROADCAST, assert two CONSUMERS of the same ref render the SAME value on the RENDERED artifact (e.g. `displayName` in ProfileSheet DOM == rb-member-badge DOM == RoomBrowser DOM), @390 real-WebKit. **NOT view-vs-model. NOT at initial load** (assert the check runs only after a broadcast; a load-time variant must be proven to false-pass and is rejected). **RED baseline (the live known-positive shape):** a consumer holding a STORED stale copy renders a DIFFERENT value post-broadcast → the gate MUST RED. Prove the gate can fail on that shape before trusting a GREEN. (Bank point.)

## By-construction discipline (the week's lessons, applied)
- Assert the HAZARD (a model-truth second-source), never an actor blocklist — the next second-source is always a new shape. [[scan-the-hazard-not-the-actors]]
- POST-BROADCAST is load-bearing timing — an initial-load check false-passes (PO's explicit property).
- Stub-must-fail on the REAL shape (stored-copy / second-bus / raw model-channel → RED); a gate never RED on the defect proves nothing. [[L-S40e]]
- Discriminate fold-vs-keep by whether a channel carries the SHARED MODEL-TRUTH; reason each keep explicitly (not convenient exclusion).

## Handoff
req mints the Req + ACs per increment (each gateRef + stub-must-fail; the @390 AC carries the POST-BROADCAST-not-initial-load evidence + the stored-copy RED baseline). Expert builds increment-by-increment, banking each; a mid-slice wall costs ONE increment, not the slice. Tester proves @390 consumer-vs-consumer post-broadcast. I wire Class/Method off the shipped decl on build-go + backstop the gate reds on the real stored-copy shape. Design-only, no build until build-go (expert paused awaiting its own cut).
