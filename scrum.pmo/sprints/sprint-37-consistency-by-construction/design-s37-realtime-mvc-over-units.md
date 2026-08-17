# S37 — Real-time MVC over scenario-units-as-models (design, impl-shape)

robbin-architect 2026-08-17. Tron's sprint subject: "consistency by design of REAL-TIME MVC over SCENARIO UNITS AS MODELS that can be DnD, and ONE CONTROLLER, and LIVE-UPDATING VIEWS like item and detail views" — "not reflecting it in realtime currently." Lands the design T37.20 (`ae01f065`, R37.20 `03e0f803`, UC dnd.carryUnitPayload `5474886a`) has waited on. **Design only — nothing built.** @390 mobile-first. Reuse R32.6/R40.17 derivation + T103 ViewBus — consolidation, not new machinery.

## ★ FAMILY RULING — is "not realtime" ONE defect or TWO? NEITHER — it is MVC-BY-CONVENTION, not by-construction
The mechanism EXISTS and MANY views subscribe — so it is NOT "no notification mechanism" and NOT "views don't subscribe." Measured, it is a **three-part omission-by-default / two-source family** (same disease as the type-index gaps + R40.18):
1. **TWO controllers/buses** (not one): `src/public/ts/trace/ViewBus.ts` `ViewBus` (ref-keyed `type:uuid`, `notify(ref)`, T103 marker 9ce0b153 — used by ALL trace item+detail views) AND `src/public/ts/ViewBus.ts` `viewBus` (classType/uuid-keyed, `publish/subscribe` — Profile/Room/member-badge). Two independent observers = the two-source disease R40.18 killed, recurring.
2. **No single mutation choke-point** — mutate→notify is scattered per site and remembered by hand: `trace/index.ts:100-101 linkHandler` (mutate graph, then `ViewBus.notify(obj.ref())`+`notify(target.ref())`), `universal-actions.ts:131` (notify CurrentSprint), `RawBinClient.ts:98` (server `unit-changed`→`notify('graph')`, R40.17). A mutation that FORGETS to notify → stale view. Realtime is opt-in per site = omission-by-default.
3. **DnD has no shared drop contract** — drag emits 4 payload formats (`rb-object-item.ts:129-134`: text/plain hash, text/uri-list, application/rb-object-ref, application/rb-federated-ref); each drop target resolves ad-hoc (`rb-diagram-detail.ts:243`: `getData('application/rb-object-ref')||getData('text/plain')`). No one contract; a drop mutation is not guaranteed to route through a notifying controller.
**⇒ Name the family: "MVC-by-convention."** The fix makes realtime a CONSEQUENCE of mutating through the one controller — declared-not-defaulted, not per-site vigilance.

## (1) MODEL = the scenario UNIT itself (single source, no shadow view-model)
- The model is the `TraceObject` wrapping the on-disk scenario unit in `graph`; views already `graph.get(ref)` at render (`rb-object-item.render()`, `rb-detail-view.render()`). **PIN it:** a view DERIVES from `graph.get(ref)` at each render — **never caches unit fields across renders** (cache-and-drift ban). No parallel view-model struct that can diverge.
- **INV-T byte-diff==0 (model store):** rendering is READ-ONLY — a render pass must not mutate any unit. The controller (below) is the ONLY writer. Gate: snapshot units → run a full render pass → byte-diff==0. stub-must-fail: a view that writes a unit field during render trips it red.

## (2) ONE CONTROLLER — a single mutation seam that mutates AND dispatches
- Introduce ONE `applyMutation(mutateFn): void` seam (extend the existing `trace/index.ts` verb path into the canonical controller) that: (a) runs the mutation against `graph`, (b) collects the AFFECTED refs (the object + every ref it links/unlinks/parents), (c) calls `ViewBus.notify(ref)` for each. **Notify becomes a CONSEQUENCE of mutating, impossible to forget** — no handler calls `notify` directly.
- Migrate ALL current mutation sites to route through it: `linkHandler`, `universal-actions` designate, the DnD drop handler, and the `RawBinClient` server-`unit-changed` bridge (server push → controller → notify). 
- **Retire the second bus:** fold `ViewBus.ts` (User/Room `viewBus`) under the one `ViewBus` (ref-keyed), or DECLARE it a distinct bounded surface — declared, not two silent independents. One controller for the item+detail-view surface this sprint targets.
- **Gate (by-construction, the R27.2 lint family):** no code may mutate `graph` (link/unlink/set) outside the controller seam — grep-lint BITE: a direct `graph.link(`/unit write outside `applyMutation` = FAIL. Realtime cannot silently regress because a mutation cannot exist without dispatch.

## (3) LIVE-UPDATING VIEWS — item AND detail derive + subscribe, by construction
- Item view (`rb-object-item.ts:73`) and detail views (`rb-detail-view.ts:152-154`, `rb-*-detail`) ALREADY `ViewBus.subscribe(ref, ()=>this.render())` on connect + unsubscribe on disconnect. The design makes coverage COMPLETE + gated, not ad-hoc:
- **Coverage invariant:** any view that renders `graph.get(ref)` MUST `ViewBus.subscribe(ref)` for that ref (and each linked ref it displays, as `rb-detail-view` already does for `linked`). **Gate:** a view reading a ref without a subscription to it → RED (static check over the view set). So a new view is realtime by construction or it fails the gate — declared-not-defaulted.
- Region re-render only (ViewBus `notify` re-renders the bound view's region, no full reload) — @390-friendly, already the T103 shape; keep it. Reuse R40.17 server→bus bridge so remote unit changes are live too.

## (4) DnD SHARED DROP CONTRACT — T37.20 dnd.carryUnitPayload (`5474886a`)
One contract for every drag source and every drop target:
- **Payload (what a dragged unit carries):** the CANONICAL internal format is `application/rb-object-ref` = the unit ref(s) `type:uuid` (multi = newline/comma list). `text/plain`, `text/uri-list`, `application/rb-federated-ref` are DERIVED for external/interop drops — declared derivations of the one ref, not independent truths.
- **Resolver (who resolves it):** ONE shared `dropDispatcher.resolveDropPayload(dataTransfer): UnitRef[]` — reads the canonical `rb-object-ref`, falls back to derive from the others for external drags, FAIL-LOUD on unresolvable (never a silent no-op drop). EVERY drop target calls it — no per-target `getData`.
- **Drop → controller → live:** a drop routes its mutation through the ONE controller (2), which notifies → subscribed item+detail views re-render. So a drop is `resolve(payload) → applyMutation → notify → views live`, identical for every target.
- **Gate:** every `drop` listener resolves via the shared resolver AND mutates via the controller (grep-lint: a `drop` handler calling `getData` directly or mutating graph outside the seam = FAIL); a dropped unit's item+detail views update with NO manual refresh (@390 pixel, Tron device).

## Missing req/UC units (report to req 0.4)
- **EXISTS:** R37.20 `03e0f803` / UC `dnd.carryUnitPayload` `5474886a` (the drop contract — this design lands its shape).
- **MISSING (need req mint, scenario-first):**
  - a req/UC for **the one mutation controller seam** (e.g. `mvc.applyMutation` — mutate+dispatch choke-point + the no-mutation-outside-seam gate). No unit today; the notify is scattered.
  - a req/UC for **live-view coverage-by-construction** (e.g. `mvc.subscribeOnRender` — the subscribe-every-rendered-ref invariant + gate). AC3 live-update marker 9ce0b153 exists but no coverage gate/unit.
  - a req/UC for **one-bus consolidation** (retire/declare the 2nd `viewBus`).
  - the DnD contract may want sibling UCs: `dnd.resolveDropPayload` (shared resolver) + `dnd.dropRoutesThroughController`.
- Each carries a BITE gate + stub-must-fail. Declared-not-defaulted, family-not-instance (fixing only the DnD leaves the scattered-notify + two-bus disease). 

## Constraints honored
INV-T byte-diff==0 (render read-only, controller sole writer); @390 region re-render no-reload; reuse T103 ViewBus + R40.17 bridge + R32.6 derivation (no new machinery); declared-not-defaulted gates throughout.

## Build sequence (PO-RATIFIED 2026-08-17) — slices, each backstopped on ship
1. **ONE CONTROLLER seam + retire the 2nd bus** (mutate+collect-refs+notify; grep-lint no-mutation-outside-seam).
2. **subscribe-on-render coverage + gate** (every rendered ref MUST subscribe else RED).
3. **T37.20 DnD shared contract routed THROUGH the controller** (canonical rb-object-ref payload + one `resolveDropPayload` + drop→controller→notify); then @390 device.
★ **Dependency (why this order, not DnD-first):** T37.20's acceptance is "drop → item+detail views update LIVE." That live-update is produced by 1+2 (the seam notifies; views subscribe). **A drop contract shipped BEFORE the seam would resolve payloads but NOT live-update** — half the value, root untouched. So the Tron-pinned T37.20 is not deprioritised; slices 1+2 build exactly what its acceptance NEEDS. Hold the INV-T line every slice: render READ-ONLY, controller SOLE writer. Architect backstops each slice vs this design on ship.
