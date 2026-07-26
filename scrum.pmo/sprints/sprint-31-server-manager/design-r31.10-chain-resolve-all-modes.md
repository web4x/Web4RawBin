# R31.10 DESIGN — UC→Method chain resolves in ALL modes, not trace-only (robbin-architect 2026-07-26)

PO ITEM-1: the tree resolves a UC to its CORRECT method only in trace-mode; in non-trace it falls back to `Class.methods[]` → a WRONG sibling (IMG_4647: R31.9 `drawer.observePosition` resolved to the old R25.4 `onGrabBarPointer`). Root-correct fix, correct-by-construction, hand expert.

## ROOT (measured, cited — corroborates skill-expert audit RESULT)
- **Server** (server.ts:1644): `if (queryMode === 'trace' && type === 'UseCase' && ct === 'Class' && ucMethodIor)` attaches `entry.chainMethod = {UC's method}` — **ONLY in trace mode**. The authoritative singular pointer `UseCase.model.method` reaches the client as `chainMethod` only when `?mode=trace`.
- **Client** (rb-trace-tree.ts:379-380): on expanding a UC→Class node — `if (inlineKids) buildDirectLayer(); else if (chainMethod) {render chainMethod}; else { fetchAndRenderChildren(uuid) }`. So with NO `chainMethod` (non-trace), it falls to `fetchAndRenderChildren` = the Class's children = **ALL its methods** → surfaces a SIBLING (e.g. `onGrabBarPointer`, an old R25.4 chain on the same `RbDetailDrawer` class) instead of the UC's real method.
- **Net:** the correct method is resolved from the authoritative `UC.method` ONLY in trace mode; every other mode (scenario, etc.) drops it → the client's `Class.methods[]` fallback surfaces a sibling. NOT a data-mint gap (skill-expert: 0 MIS-WIRED on disk; UC.method IS set) — a CODE path defect (the trace-only gate + the client fallback firing when it shouldn't).

## FIX (root-correct: the authoritative UC.method drives resolution in ALL modes)
Make the authoritative `UC.model.method` always drive the UC's chain child; the `Class.methods[]` fallback must fire ONLY when `UC.method` is genuinely EMPTY (a real incomplete chain — correctly surfaced, not silently mis-resolved).

| # | File | Change |
|---|------|--------|
| 1 | `src/ts/server/server.ts:1644` | DROP the `queryMode === 'trace' &&` gate → attach `chainMethod` whenever `type==='UseCase' && ct==='Class' && ucMethodIor` (ALL modes). The authoritative `UC.method` is then always in the node payload. When `ucMethodIor` is empty (no UC.method) → no `chainMethod` attached → client falls back = correct (that IS a genuinely-empty chain). |
| 2 | `src/public/ts/trace/rb-trace-tree.ts:379-380` | (verify — already correct-by-construction once #1 lands) the existing `else if (chainMethod) {render it} else {fetchAndRenderChildren}` now renders the authoritative method in every mode; the `Class.methods[]` fallback fires ONLY when `chainMethod` is absent = `UC.method` genuinely empty. Optionally add a comment pinning WHY (fallback = incomplete-chain surfacing, not the default). |

**Why root-correct (Option-B-via-A):** the defect is that the client's method resolution was NOT authoritative on `UC.method` outside trace-mode. Attaching `chainMethod` (= `UC.method`) in all modes makes the client's resolution honor the authoritative singular pointer everywhere; the sibling-surfacing `Class.methods[]` path becomes reachable ONLY for a truly-empty `UC.method` (a real mint-gap the skill-expert audit then flags — NOT a silent wrong-method). So the tree resolves each UC to its correct method by construction, in any view mode. 1-line server change; the client is already shaped for it.

## GATE (tester — the R31.9 observePosition case is the acceptance probe)
In BOTH trace AND non-trace (scenario) mode, expand R31.9 UC `drawer.observePosition` [cc45a580] → it MUST resolve to Method `RbDetailDrawer.observePosition` [e8097351] → Impl [240c539f] → Test [ccb4a810], NOT the sibling `onGrabBarPointer` (R25.4). Spot-check other UCs on multi-method classes (RbDetailDrawer, FeatureManager, ServerManagerGuard) resolve to their OWN UC.method in non-trace mode. A UC with genuinely-empty `.method` still falls back to Class.methods[] (and is a mint-gap, not this bug). /trace + /scenario both.

## ROUTE
architect (this) → expert builds (1-line server gate-drop + client comment) → SERVER change = real restart remoteShells:0.2 (verify by fresh PID + the observePosition-resolves probe in non-trace) → I backstop (non-trace resolves observePosition not onGrabBarPointer) → tester gates both modes → Tron. req: no mint (code fix; 0 MIS-WIRED on disk). This closes GAP-2 (tree mis-resolution) from the completeness audit.
