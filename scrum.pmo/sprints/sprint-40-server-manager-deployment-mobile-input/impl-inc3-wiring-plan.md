# inc-3 IMPLEMENTATION PLAN (robbin-expert, scoped 2026-08-12 post-rewind)

Foundation `src/public/ts/trace/synthetic-ref.ts` (`resolveRefUnit`, `SYNTHETIC_PREFIX`, `isSyntheticRef`) COMMITTED + INERT (28eef8b8c) — 0 real importers today (grep hit was a comment). Wire 3 importers, each DELETING its local parse. Prod v0.8.96 LIVE stays untouched until the gated deploy.

## Files + exact sites (all measured)
1. **server.ts `ensureViewUnit`:1216-1220** — `rawbin:*` ALL get `kind='folder'`. ADD special-case: `ref==='rawbin:diagram'` → `kind='diagrams'` (so `resolveRefUnit('rawbin:diagram').kind==='diagrams'` — the add-diagram applicability key). Other rawbin:* keep 'folder'.
2. **model-action-decls.ts:12** — FLIP `add-diagram` from `appliesTo:{notTypes:[...]}` → `appliesTo:{kinds:['diagrams']}` (precise: offered ONLY on the diagrams container by KIND; absent on folder/task/leaf). `applicableActionsFor` already supports `kinds` (action-applicability.ts:42).
3. **rb-detail-drawer.ts NAV :100-108** (`onUniversalAction`) — replace inline `/^(dir:|...)/.test(rawRef)` + `fetch('/api/ior/'+enc(rawRef))` with `resolveRefUnit(rawRef)`. KEEP the iOS-sync `window.open('about:blank')` BEFORE the await, point `win.location` after resolve (AC-7 popup hazard). This path already behaved right — now via the shared resolver so it can't drift.
4. **rb-detail-drawer.ts DETAIL `renderDetailForRef`:234-287 + collection-branch:240-257 + `resolveDetailUnit`:295-309** — the A3 fix:
   - collection-branch must fire ONLY for GENUINE room collections: `type==='collection' && /^(members|files)-/.test(inner)`. Else route synthetic through the resolver.
   - Replace split-at-colon + `resolveDetailUnit`'s `/api/ior/ior:instance:${uuid}` with `resolveRefUnit(ref)` → use `{uuid,type,kind,unit}` for tagMap + graph seed (carry `kind` per R40.37:305).
5. **rb-detail-drawer.ts ACTION-BAR `universalActionBar`:442-457** — the sync→async, HIGH-BLAST-RADIUS one (all 7 detail views). Replace `const uuid=refUuid(ref); const obj=graph.get(uuid); unit={type,status,kind:obj?.kind}` with `const r=await resolveRefUnit(ref); unit={type:r?.type||type, status:..., kind:r?.kind}`. Make the method async (callers onDetailShown/onActiveDiagram/refreshActions fire-and-forget). refUuid NEVER on a synthetic ref.
6. **NEW grep-lint gate** `scripts/check-synthetic-ref-single-source.ts` + wire into package.json `ci:gates:raw`: assert the synthetic-ref parse (SYNTHETIC_PREFIX regex literal / `ior:instance:${` split-parse / `refUuid(` on a rawRef that can be synthetic) exists ONLY in synthetic-ref.ts → else RED. stub-must-fail: reintroduce a split-parse → RED.
7. **Gate**: A3 (each /model ref type → content not empty; @390 device = Tron) · AC4 (`rawbin:diagram`→kind=diagrams→add-diagram offered ONLY there) · idempotent lazy-mint (resolve twice → 1 unit) · grep-lint 0-outside-resolver · stub-must-fail.
8. **Deploy**: version bump via SOURCE unit (config-singleton) + package.json, `npm run build`, BOOT-CHECK, architect restart (/api/config build-stamped — [[version-bump-needs-restart]]).

## ★ OPEN DECISION (architect) — the `collection:` double-prefix
Tree emits the diagrams container as `mofFolder('rawbin:diagram', ..., type='collection')` (server.ts:1114,1481) → drawer ref = `collection:rawbin:diagram` (DOUBLE-prefixed). `SYNTHETIC_PREFIX` matches `collection`, so `resolveRefUnit('collection:rawbin:diagram')` → `/api/ior/collection:rawbin:diagram` which `ensureViewUnit` does NOT resolve (it wants `rawbin:diagram`). Two options:
- (A) CLIENT-side normalize: strip a redundant outer `collection:` when the remainder is itself synthetic → resolve `rawbin:diagram`. Minimal, no tree-emitter change, no `check-tree-emitter` gate impact.
- (B) Fix `mofFolder` to emit synthetic containers with their real prefix (ref = `rawbin:diagram`, not `collection:...`) → cleaner model but changes tree emission + must re-green `check-tree-emitter`.
RECOMMEND (A) for inc-3 (lower blast radius; the collection-branch RETIRES under S37-B anyway). Confirm before I wire the detail importer.

## Sequencing / safety
Edits are uncommitted + non-deployed → running prod v0.8.96 untouched until the gated deploy. Implement 1→7, compile-check (esbuild), gate all-green, THEN deploy (8). Security B1 PARKED — untouched.
