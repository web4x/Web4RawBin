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

### Increment 3 — fold the MODEL-TRUTH CustomEvent channels into the ONE bus (DISCRIMINATED)
- **FOLD (model-truth second-sources):** `rb-avatar-updated`, `rb-model-resynced` → route through `ViewBus.notify(viewBusKey(...))`; subscribers move to the ONE bus. These broadcast authoritative model changes that ViewBus already owns.
- **KEEP, reasoned out-of-scope (a genuinely DIFFERENT concern — the assertStatusConsistent reflex, named not silent):** `rb-drawer-detail-shown` / `rb-tree-reveal` / `rb-drawer-action` (intra-tab UI orchestration — which panel is open, not a model value), `rb-diagram-refresh` / `rb-active-diagram` (view-local render triggers), `rb-room-files-dropped` (a UI drop gesture), `rb-reconnect` / `rb-model-resync-request` (transport control, not a unit-changed broadcast). These are NOT a shared model-truth → folding them would be over-elimination. Each kept channel is listed WITH its reason so the exclusion is reviewable, not convenient. (Bank point.)

### Increment 4 — the SINGLE-SOURCE gate: structural + R37.12 @390 consumer-vs-consumer POST-BROADCAST
- **Structural (extend `check-viewbus-key-single-source`):** assert ONE ViewBus file/instance — `../ViewBus.ts` GONE, no second `new ViewBusImpl`, and NO model-truth `CustomEvent('rb-*-updated'|'rb-model-resynced')` dispatched outside the ONE bus (the folded set). This asserts the HAZARD (a model-truth second-source: a second bus OR a stored copy OR a parallel model-channel), not enumerated actors. **Stub-must-fail:** reintroduce a second bus file / a raw model-truth CustomEvent → RED.
- **Runtime R37.12 @390 (CONSUMER-vs-CONSUMER, POST-BROADCAST):** after a mutation BROADCAST, assert two CONSUMERS of the same ref render the SAME value on the RENDERED artifact (e.g. `displayName` in ProfileSheet DOM == rb-member-badge DOM == RoomBrowser DOM), @390 real-WebKit. **NOT view-vs-model. NOT at initial load** (assert the check runs only after a broadcast; a load-time variant must be proven to false-pass and is rejected). **RED baseline (the live known-positive shape):** a consumer holding a STORED stale copy renders a DIFFERENT value post-broadcast → the gate MUST RED. Prove the gate can fail on that shape before trusting a GREEN. (Bank point.)

## By-construction discipline (the week's lessons, applied)
- Assert the HAZARD (a model-truth second-source), never an actor blocklist — the next second-source is always a new shape. [[scan-the-hazard-not-the-actors]]
- POST-BROADCAST is load-bearing timing — an initial-load check false-passes (PO's explicit property).
- Stub-must-fail on the REAL shape (stored-copy / second-bus / raw model-channel → RED); a gate never RED on the defect proves nothing. [[L-S40e]]
- Discriminate fold-vs-keep by whether a channel carries the SHARED MODEL-TRUTH; reason each keep explicitly (not convenient exclusion).

## Handoff
req mints the Req + ACs per increment (each gateRef + stub-must-fail; the @390 AC carries the POST-BROADCAST-not-initial-load evidence + the stored-copy RED baseline). Expert builds increment-by-increment, banking each; a mid-slice wall costs ONE increment, not the slice. Tester proves @390 consumer-vs-consumer post-broadcast. I wire Class/Method off the shipped decl on build-go + backstop the gate reds on the real stored-copy shape. Design-only, no build until build-go (expert paused awaiting its own cut).
