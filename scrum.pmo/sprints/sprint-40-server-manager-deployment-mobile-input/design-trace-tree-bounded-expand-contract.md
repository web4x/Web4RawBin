# /trace tree expand — BOUNDED CONTRACT (P0-B, architect, 2026-08-31)

Tron P0-B: expanding Sprint-40 takes ~a minute; UseCase hop 25.2s. Tester measured: server `/api/trace/children` is FAST (0.4-0.8s); the defect is a CLIENT eager fan-out. Owner = client `rb-trace-tree`. Design-only; PO sequences the build (expert is mid-carry on P0-A).

## Measured root (rb-trace-tree.ts)
- `fetchAndRenderChildren` (line 622) renders a node's direct children, then at **line 644 calls `prefetchVisibleLayer(container)`**.
- `prefetchVisibleLayer` (616) = `Promise.all(nodes.map(n => prefetchLayer(n)))` → **one `/children` prefetch PER just-rendered child**. Also fired at initial render (307/386).
- ⇒ expanding a node with N children costs **1 + N requests** (Sprint-40: 1 + 64 = 65). On prod same-host that hides at ~0.7s; on Tron's macOS Chrome (~6 concurrent/host) the 64 SERIALIZE → ~11 rounds → the "minute". The 100ms eager-lazy AC (req `94c1211c`) is O(children), not O(1).

## THE BOUNDED CONTRACT (enforceable invariant, not a latency wish — mirrors /model's "each expand = ONE bounded fetch")
**(a) O(1) requests per expand — REMOVE the eager fan-out.** Expanding a node fires EXACTLY ONE request (its own `/children`, via `fetchAndRenderChildren`). Delete the `prefetchVisibleLayer(container)` call at line 644 (and the eager 307/386 fan-out). A child's chevron/expander is driven by **`hasChildren` from the PARENT's `/children` payload** (the server already returns `hasChildren` per child; `TreeNode.hasChildren` exists) — so NO prefetch is needed to decide whether a child is expandable. Children's children resolve on THAT child's own expand (lazy). Net: expand = 1 request, forever, regardless of fan-out width.

**(b) The legitimate EAGER part — named + bounded.** "eager-lazy" means a BOUNDED eager root set, then lazy. Eager = the initial visible roots ONLY: the `data-eager-lazy` `renderCurrentSprintEagerLazy` 2-node pin (CurrentSprint top + its immediate slots) + the sprint-collection root rows. That is a small CONSTANT (≤ K, analogous to /model's initial ≤12) — NEVER descendants, NEVER descendants' children. Everything below the initial roots is lazy-on-expand. The current code violates this by eager-prefetching every VISIBLE node's children at render.

**(c) The 25s single-UseCase hop = a SEPARATE slow resolve — measure/name, do NOT assume the fan-out fix covers it.** UseCase fan-out is small, so 25s is not 250 requests × width — it points at a slow per-hop resolve. AFTER the fan-out removal, measure a SINGLE `/api/trace/children/<useCaseUuid>` in isolation (server timing). If >> 0.8s, the UseCase children-resolve is a distinct server-side slow path (candidate: an expensive per-node derivation / full-graph walk in the UseCase branch) — a separate fix, its own req. If it drops to ~0.7s once un-serialized, it WAS the fan-out (the prefetch cascade stacking down the chain) and (a) covers it. This is the falsifier that keeps a hidden slow-resolve from surviving the fan-out fix. Flag to tester: isolated single-UseCase `/children` server timing.

## Invariants (GATEABLE ON /trace — the wrong-surface fix)
- **INV-BOUND-EXPAND:** expanding ANY node fires EXACTLY 1 network request. Gate: instrument `fetch`, expand Sprint-40 on **/trace**, assert request-count == 1 (was 65). **stub-must-fail:** re-introduce a per-child prefetch → count > 1 → RED.
- **INV-EAGER-BOUNDED:** initial /trace render fires ≤ K requests (K = the pin/root eager set, a named constant), not O(nodes).
- **INV-DEPTH-LAZY:** no request is made for a node that is not currently expanded (a collapsed child pulls 0 requests until its own toggle).
- ★ **SURFACE:** the perf gate MUST run on **/trace** (Tron's surface). The existing r332b gate runs on **/model** = a GREEN gate on a surface the user doesn't use = the AC-surface law we ruled in Phase-A (never gate a surface the user does not use). Port/duplicate the bounded-expand gate onto /trace; keep /model's too. `hasChildren`-from-payload is the shared contract both trees already rely on.

## Routing
- Design→ req folds/sharpens the eager-lazy AC `94c1211c` into the bounded contract (O(1)-per-expand + eager≤K + gate-on-/trace), ride R40.54 failable. Planner stands up the task. Expert removes the line-644 fan-out + drives chevrons from `hasChildren`. Tester builds the /trace request-count gate (stub-must-fail) + the isolated-UseCase timing measurement for (c). I backstop: request-count==1 on expand + eager≤K + the gate runs on /trace.
- Do NOT queue the build behind P0-A's carry (PO sequences). (c)'s separate slow-resolve gets its own req IF the isolated measurement confirms it.
