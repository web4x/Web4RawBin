[Back to Sprint 15 Planning](./planning.md)

# T103: Object.verb Routing + Flat-JSON Serialization + MVC Live Views

[task:uuid:103c2d3e-4f50-4162-8839-c03030303103]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement (architect)
  - [x] creating test cases
  - [x] implementing (expert)
  - [ ] testing (tester — run trace-routing.test.ts, jsdom)
- [ ] QA Review
- [ ] Done

## Implementation (robbin-expert, 2026-05-26, v0.5.13)
New client layer `src/public/ts/trace/` (imports shared T101 TraceModel; TraceModel stays DOM-free — the view/observer live here):
- **ViewBus.ts** (AC3 observer): singleton keyed by `type:uuid` ref. subscribe→unsubscribe fn, notify(ref) re-renders only bound views. NOT a field on TraceObject (keeps shared model DOM-free).
- **VerbRegistry.ts** (AC1): `<type>.<verb>` → handler map. VerbContext {graph,obj?,params,mount,router}. `router` typed as a minimal structural `Navigator` to avoid a TraceRouter import cycle. notFound() never throws.
- **TraceRouter.ts** (AC1): `parseHash`/`buildHash` for `#<type>.<verb>?<params>` (default verb=show; ref params reuse type:uuid). `route(hash?)` resolves obj from graph (params.uuid) → dispatches handler; `navigate()` writes location.hash (headless fallback routes directly). Unknown route → notFound.
- **rb-trace-view.ts** (AC2/AC3): attribute-driven web component (uuid/type/title/ref); subscribes to ViewBus by ref on connect, re-renders on notify + attr change, unsubscribes on disconnect. customElements.define guarded (`typeof customElements`).
- **index.ts** (AC4/AC5 + wiring): `serialize`=graph.toJSON, `deserialize`=TraceGraph.fromJSON (reuse T101, no protocol). `defaultRegistry()` wires show/list/link for all 7 types; `link` mutates via graph.link then ViewBus.notify (AC3 mutation→live-update).
- Tests: `test/vitest/trace-routing.test.ts` (jsdom) — parse/build round-trip, router resolution + notFound + list, attribute round-trip, ViewBus propagation + unsubscribe + mounted-view re-render, serialize/deserialize fidelity. Tester runs.
- Verified: routing logic runs under tsx (parseHash/buildHash); the view layer is BROWSER-ONLY by design (node import fails on `extends HTMLElement` — expected; server uses only shared TraceModel). esbuild bundles the layer (13.9kb). v0.5.13, sw.js rawbin-v0.5.13. Not yet wired into a page — T108 mounts the browser in /edit. No deploy needed yet.

## Design (robbin-architect, 2026-05-26)

Builds on **T101 `src/ts/shared/TraceModel.ts`** (typed objects; `TraceGraph` with `register`/`link(a,relation,b,inverse)`/`all`/`toJSON`/`static fromJSON`; route-like `type:uuid` refs via `toRef`/`refUuid`; `obj.ref()`/`toJSON()`) and **T102 `TraceConsistency.ts`** (`scanRepo`→graph). TraceModel is SHARED (server + client) and MUST stay DOM-free — so routing, views, and the MVC observer live in a NEW client layer `src/public/ts/trace/`, importing the shared model. This is the seam T105-T108 build on.

### Object.verb = OOSH-CLI command = route (the core analogy)
`Object.verb(args)` ≡ `./object verb arg…` (OOSH CLI) ≡ a client route. **Method = URL anchor; args = query params:**
```
#<type>.<verb>?<param>=<value>&…
  requirement.show?uuid=15a1b2c3-…     ≈ ./requirement show 15a1b2c3-…
  task.list                            ≈ ./task list
  useCase.show?uuid=…                  ≈ ./useCase show …
  requirement.link?uuid=…&to=task:…    ≈ ./requirement link … task:…
```
- `<type>` = object noun (one of TraceModel's 7 types: requirement, task, useCase, class, method, implementation, test). `<verb>` = method. Default verb when omitted = `show`. Reference param values reuse the route-like `type:uuid` form (`toRef`) — a param IS an object ref, navigable.

### Three new client modules (`src/public/ts/trace/`)
1. **`TraceRouter.ts` (Controller)** — parse `location.hash` → `{ type, verb, params }`; resolve target from `TraceGraph` (`graph.all()` filtered by `type` + `params.uuid`); dispatch to the type's verb handler. `navigate(type, verb, params)` writes `location.hash` → shareable/bookmarkable OOSH-CLI-like URLs. Unknown verb/type → not-found view (never throw to user).
2. **`VerbRegistry.ts`** — maps `<type>.<verb>` → handler `(obj, params, mount) => View`. Verbs are the addressable surface: `show` (DetailView), `list` (ListOverview), `edit`, `link`/`unlink` (mutations). Keeps verbs OUT of the pure data model.
3. **`ViewBus.ts` (the MVC observer — client-side; keeps shared model DOM-free)** — singleton keyed by object ref (`type:uuid`). Views `subscribe(ref, cb)` on connect, `unsubscribe` on disconnect. After a mutation verb the controller calls `ViewBus.notify(ref)` → every subscribed View re-renders ONLY its bound region (MVC live-update, no full reload). Same proven pattern as `rb-avatar-updated`, but per-object and routed through the bus.

**Constraint (do NOT violate):** the observer is NOT a field on `TraceObject`. TraceModel is imported by the SERVER (T102). A DOM/view registry on the shared class would couple shared code to the browser. The Object "does MVC" at the system level via ViewBus.

### Attributes = web-component attributes (AC2)
Each object renders into a View web component (`rb-trace-view` base; specialized in T105-T107). Object fields → component attributes: `uuid`, `type`, `title`, `ref`. set/get round-trips: View reads attributes to render; controller sets attributes from `obj` on (re)render; observed-attribute change triggers re-render (existing rb-* pattern).

### Serialize / deserialize (AC4/AC5 — REUSE T101, do not reinvent)
- `serialize()` = `graph.toJSON()` → flat array `{type,uuid,title,links:{relation:[type:uuid…]}}` (already route-like; no protocol).
- `deserialize()` = `TraceGraph.fromJSON(records)` (rebuilds typed instances + relinks).
- T103 adds only the view-facing wrappers: load flat JSON (from T102 scan output, or a `GET /api/trace` serving `graph.toJSON()`) into a TraceGraph, then render via routes. AC4/AC5 exercised through the router/view path.

### MVC roles + one data-flow cycle
- **Model:** `TraceObject` subclasses in the shared `TraceGraph` (T101).
- **View:** web components (`rb-trace-view` + T105-T107) — attribute-driven, ViewBus-subscribed.
- **Controller:** `TraceRouter` + `VerbRegistry`.
```
hash change → TraceRouter.parse → resolve obj from TraceGraph
  → VerbRegistry[type.verb](obj, params, mount) → render View (attrs from obj)
  → View subscribes to ViewBus(obj.ref)
  ...mutation verb → graph.link(...) → ViewBus.notify(ref) → subscribed Views re-render region (no reload)
```

### Scope
T103 ships: `TraceRouter` + `VerbRegistry` + `ViewBus` + a minimal `rb-trace-view` proof + tests (AC6: route resolution, attribute round-trip, MVC propagation, serialize/deserialize fidelity). The concrete views — `defaultItemView` (T105), `ListOverview`+search (T106), DetailViews/Overview (T107), browser capstone (T108) — CONSUME this seam; T103 enables, doesn't implement them. No server protocol (Tron R1: "no protocols") — serialization is flat JSON state with refs only.

## Traceability
- up
  - [requirement:uuid:25b2c3d4-e5f6-4a71-9b82-0c1d2e3f4a02](./requirements.md) — R15.2 Object.verb model
  - [Sprint 15 Planning](./planning.md)
  - Tron directive 2026-05-26
- down
  - None (atomic task)
- chain
  - **requirement:** R15.2 in [requirements.md](./requirements.md)
  - **use case:** object.verb routing — diagrams/object-verb-usecases.puml
  - **puml:** [diagrams/object-verb-usecases.puml](./diagrams/object-verb-usecases.puml)
  - **class/method:** Object.verb router; flat-JSON serializer; MVC view registry

## Task Description
Treat methods as routes (method anchor + query params, OOSH-CLI-like) and attributes as
web-component attributes. Objects push MVC live-updates to their registered views.
Object state serializes as flat JSON with route-like references to other objects (no
protocols), so the typed object graph is navigable and renderable.

## Acceptance Criteria
- [ ] AC1: A `verb` (method) is addressable as a route — method anchor plus query params resolve to a class instance method invocation
- [ ] AC2: Object attributes map to web-component attributes (set/get round-trips through the component)
- [ ] AC3: Objects register views and emit MVC live-updates; a state change pushes to all registered views without a full reload
- [ ] AC4: `serialize()` produces flat JSON of object state, with references to other objects as route-like strings (no protocol/transport coupling)
- [ ] AC5: `deserialize()` reconstructs the object graph from flat JSON, resolving route-like references back to typed objects
- [ ] AC6: Tests cover route resolution, attribute round-trip, MVC update propagation, and serialize/deserialize fidelity
- [ ] `npm run build` + version bump

## Dependencies
- **Requires:** T101
- **Enables:** T105, T106, T107, T108

## Definition of Done
- [ ] All AC met; chain links resolve
- [ ] Tests pass, build clean
- [ ] Tron QA approved

## QA Audit & User Feedback
- 2026-05-26: Tron directive (Sprint 15 R1-R4). Quote in requirements.tron-literal.md.

## Subtasks
None (atomic task).

---
*Sprint 15 — Traceability Browser & Object Model*
*Owner: robbin-architect (design), robbin-expert (implement)*
*Priority: 2 (object.verb core)*
