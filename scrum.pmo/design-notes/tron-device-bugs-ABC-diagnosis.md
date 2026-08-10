# Tron Device Bugs A/B/C — Architect Diagnosis (freeze lifted; expert builds)

**By:** robbin-architect 2026-08-10, per PO. Priority B → A → C. Measured.

## BUG B — add-view 400 (blocks his testing) : PINNED = two divergent stripRef copies (PO measured; I OWN my wrong hypothesis)
**Route (server.ts:2076-2101):** the ONLY 400 is `bad-uuid` from `/^[0-9a-fA-F-]{16,40}$/` on both `diagramUuid` and `elementUuid`. Type-independence (UseCase AND Class both fail) ⇒ a shared cause.
**ROOT (PO measured, correcting BOTH our earlier guesses — mine was "stale bundle", the PO's first was "diagramUuid"):** TWO divergent `stripRef` copies —
- `rb-modelelement-detail.ts:9` strips ANY leading word-colon prefix (`/^[a-z]+:/i`) — generic.
- `diagram-view-model.ts:17` (imported by the diagram DROP path) strips ONLY `ior:instance:` / `modelelement:` / `diagram:`.
A dragged Class or UseCase ref keeps its OWN **type prefix** (a prefix NOT in the 3-list), the colon survives into **`elementUuid`**, and the server regex returns 400. The `diagram:` case was already fixed; the gap is **every other prefix** → type-independent, exactly as Tron reports.
**FIX (PO-directed, endorsed — by construction):** ONE shared **generic** `stripRef` imported by BOTH sites (strip any leading word-colon), NOT extending the 3-prefix list (that just defers the next drift). Server regex stays strict as a path-safety guard. Ship with the same version bump as C so his device gets it.
**★ GUARD-FAMILY NOTE (PO):** this is **duplicated-logic drift — two copies of the same parser diverging** — the SAME root as sprint-number-in-two-places (R-C1 addendum) and the frozen-boundary case. It belongs in the [[one-parser-one-source]] class: one canonical parser, all consumers import it, + a lint that fails if a second copy is reintroduced. Folds into the same guard family.

## BUG A — decline's ChangeRequest invisible (his requirement) : render as a non-chain child itemView, do NOT touch forwardOnly
**ROOT (tester-found, decisive):** rb-task-detail's "Forward Links" fetches `/api/trace/children?mode=scenario` (detail-children.ts:27), which applies the server's **`forwardOnly` LOCKED allow-list = the canonical 7-step-chain forward keys ONLY**. `changeRequests` is not a chain key → filtered out → "no links", even though the server DID link the CR (`ownerIor→task` + `task.changeRequests[]`, server.ts:1471-1473).
**The child link already exists** (both ways: `CR.ownerIor: ior:instance:<taskUuid>` + `task.changeRequests[]`). So (i) is essentially satisfied — the honest parent/child edge is `ownerIor`. Do NOT extend forwardOnly (PO: it is deliberately locked to the chain; adding a non-chain relationship is a category error, like crediting a Test against the wrong intent) and do NOT re-encode into `children[]` (a 3rd copy fighting the filter).
**FIX SPEC:**
- **(i) parent/child link — keep the single source:** the CR's `ownerIor → task` IS the child edge; `task.changeRequests[]` is the task-side typed mirror. Leave both; add nothing new. The relationship is stated ONCE (owner + typed collection), not re-encoded in a filter.
- **(ii) render alongside the chain, OUTSIDE forwardOnly:** add a dedicated section to rb-task-detail — `<h4>Change Requests</h4>` beside Forward Links — that resolves `task.changeRequests[]` (available on the `/api/ior` data rb-task-detail already fetches, :17) and renders each CR as an **itemView** (`rb-object-item`: name + ChangeRequest type-badge + status, click → detail). This never passes through the chain filter — it is an explicit non-chain child channel, exactly "children as itemViews alongside the chain."
- **(iii) ChangeRequest itemView + detail (must show his reason):** the CR unit = `{ name:"Change Request: <task>", task, requirements, reason, createdBy, createdAt, status:'Open' }`. ChangeRequest is registered with `RequirementTemplate` (templates.ts:370). Add a drawer tagMap entry `changerequest → rb-requirement-detail` (reuse, no fork) so tapping the CR opens its detail; ENSURE the detail renders the **`reason`** field prominently (Tron wrote the reason inside and will read it back — the reason is the CR's payload, not a generic requirement field, so the detail must surface it). Minimal: reuse requirement detail + a `reason` row.
**GATE (@390 device):** decline a task → task detail shows a "Change Requests" section with the CR as a child itemView → tap → CR detail shows the reason text. Forward Links (chain) unchanged. Reachable BY NAVIGATION from the task (his exact complaint).

## BUG C — SW caches a POST (console noise, can mask real errors)
**`networkFirst` (sw.js:~99-103):** `if (response.ok) { const cache = await caches.open(CACHE_NAME); cache.put(request, response.clone()); }` — runs for ANY request incl **POST**; `Cache.put` throws `Request method POST is unsupported`.
**FIX (exactly as PO):** guard non-GET — `if (request.method === 'GET' && response.ok) { … cache.put … }` (skip caching non-GET). One-line. Ships with the same bump as B (helps cache freshness for B too).

## ★ THE FAMILY (PO named it — three tonight, plus two earlier)
**State a relationship ONCE and render/resolve it from that single source — never re-encode it in a second copy or a display filter.**
- BUG B = duplicated-logic drift (two divergent `stripRef` copies).
- BUG A = a locked display allow-list (`forwardOnly`) silently re-encoding "what counts as a child," dropping a real relationship.
- Same family as R-C1's sprint-number-parsed-in-two-places and the frozen-boundary case.
Guard shape (post-GO, R-C3 family): one canonical source per relationship/parser + a lint that FAILS if a second copy or a divergent re-encoding appears (stub-must-fail). This is [[one-parser-one-source]] generalized from parsers to *relationships*.

## BUG D — dropped UseCase renders as a class box (facet-type single-source)
**ROOT (expert-measured):** add-view hardcodes `viewKind:'class'` (server.ts:2093); renderFacet does `k = view.viewKind || node.kind`; and `node.kind = model.kind || 'class'` (rb-diagram-detail:164). A dropped UseCase unit (`ior:class:UseCase`) has NO `kind`/`facetType` field → defaults to `'class'` even if viewKind is omitted. NOTHING derives renderFacet's `UmlUseCase`/`UmlMethod` keys from an element's ior-class. A naive fix (drop the hardcode, read model.kind) = another silent default.
**THE MAPPING (ior-class → facet-type; targets confirmed against renderFacet's keys):**
- `ior:class:UseCase` → `UmlUseCase` (ellipse)
- `ior:class:Method` → `UmlMethod` (or `UmlFunction` when no parent Class — R36.3 method-vs-function)
- `ior:class:Class` → `tsClass` (class-family: class/interface/UmlClass/tsClass all render as a box)
- `ior:class:ModelElement` → `model.kind` (ModelElements DO carry `kind`)
- any other / unresolvable → **null → FAIL-CLOSED** (never silent `'class'`)
**THE HOME (single source, no drift — the family principle):** a new pure fn **`deriveViewKind(ior: string, model): string | null` in `src/ts/shared/facet-type.ts`**. Confirmed importable by BOTH sides: the client already imports `../../../ts/shared/TraceModel.js` + `chain-model.js`; the server imports src/ts/shared freely. ONE copy, both import it.
**WIRING (both derive from the ONE fn):**
1. **Server add-view (derive + store, fail-closed):** resolve the element (`idx.get(elementUuid)` prod, else MODEL_STORE read) → `const vk = deriveViewKind(unit.ior, unit.model)` → if `vk == null` return **400** (unresolvable/unknown → refuse, do NOT store `'class'`); else store `view.viewKind = vk` (replaces the hardcoded `'class'` at :2093).
2. **Client renderFacet fallback (same fn, kills the divergent default):** replace `node.kind || 'class'` with `deriveViewKind(node.ior, node.model)` imported from the SAME module — so when `view.viewKind` is absent (legacy views), the client derives via the identical mapping, never `'class'`. `view.viewKind` stays authoritative when present.
3. **Legacy backfill (optional, small):** existing MODEL_STORE views stored with the buggy `viewKind:'class'` re-derive via the same fn (one pass); new drops are correct immediately for Tron.
**Why this is single-source:** the ior→facet mapping exists in exactly ONE function; server and client both import it; no per-side copy to drift (the disease named above). Fail-closed on unknown (no silent `'class'`) satisfies the expert's requirement.
**Chain-map (for req, verify-owner-first):** the fix = new Method `deriveViewKind` on a shared **Class FacetType** (or DiagramViewModel, since renderFacet lives there) → its own Impl; the add-view store-side change rides the diagram add-view chain (R32.11 / diagram.render R32.4). New UC `diagram.deriveViewKind` OR ride diagram.render — architect confirms on mint (do NOT cross-wire onto R40.10; D is a diagram-render concern like B).

## Sequencing note
B + C are client/SW → both ride ONE build + version bump + restart (B's real cause is deployment freshness, which the C fix + bump also serves). A is server-side (declineToChangeRequest) → same build. All three land in one bump; freeze lifted so a restart is permitted. D2 + rotation still await Tron's GO and ride a later restart.
