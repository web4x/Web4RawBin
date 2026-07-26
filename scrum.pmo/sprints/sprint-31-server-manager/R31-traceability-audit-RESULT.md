# S31 Traceability Audit — RESULT (robbin-skill-expert)

## ★ FINAL CERTIFICATION 2026-07-26 (post req 81fbce45e — R31.11 last chain landed)
**Re-ran the audit walker on disk (det). RESULT: Sprint 31 traceability is WHOLE.**
- **17 / 17 BUILT requirements COMPLETE chain-to-Test** (Req→UC→Class→Method→Impl→Test), **0 mis-wired**.
- All original gaps CLOSED: R31.5 (UC+chain), R31.7 (INV-V1/V3 Tests), R31.8 (6 Tests). Added + complete: R31.9, R31.10 (attachChainMethod strict-credit), R31.11 (UC 8a7039eb→Class a0c492d6→Method 7dc79987→Impl d4ad31f3→Test d48fd23e).
- **R31.6 EXCLUDED** — `status: 'concept'`, `future: true` (name: "…FUTURE / concept"). Its Method `RbPanZoom.applyPanZoom` has no Impl BY DESIGN (a future capability, not yet built). designAhead exclusion — NOT a gap.
- Total S31 = 18 reqs (R31.1–R31.11 + R31.5.1–R31.5.7); 17 built (all COMPLETE) + 1 future/concept (R31.6, excluded).

**CERTIFIED: Sprint 31 chains are traceable Req→…→Test, complete, correctly-wired, no mis-resolution.**
(Below = the original 2026-07-24 audit, kept for record.)

---

# S31 Traceability Audit — RESULT (robbin-skill-expert, 2026-07-24, original)

**Method:** tsx-free node walk on disk (`scratchpad/s31-audit2.mjs`) — for each S31 requirement, walk
**Req.useCases[] → UC(.method, .class) → Method.implementations[] → Impl.tests[] → Test**.
Validated against the known R31.9 chain (UC `drawer.observePosition` cc45a580 → Method observePosition
e8097351 → Impl 240c539f → Test ccb4a810).

**Model note (important):** UC stores SINGULAR pointers `method` + `class` (NOT a `classes[]` forward array).
Links are FORWARD-ONLY (parent stores child refs). So "missing back-ref" is NOT a defect by design.

## Verdict per requirement (16 total incl R31.5.x sub-reqs)

| Req | Verdict | Gap |
|-----|---------|-----|
| R31.1 | ✅ COMPLETE | — |
| R31.2 | ✅ COMPLETE | — |
| R31.3 | ✅ COMPLETE | — |
| R31.4 | ✅ COMPLETE | — |
| R31.5 | ❌ INCOMPLETE | req.useCases[] EMPTY — no UC → no chain |
| R31.6 | ❌ INCOMPLETE | req.useCases[] EMPTY — no UC → no chain |
| R31.7 | ❌ INCOMPLETE | Methods `Build.versionGuardTreeClean` + `Build.versionGuardAgreement` have NO Impl (implementations[] empty) |
| R31.8 | ❌ INCOMPLETE | 6 Impls have NO Test (tests[] empty): RbFeatureDetail.applyGrant, FeatureManager.searchUsers, RbFeatureDetail.userComplete, RbFeatureDetail.mount, FeatureManager.grantedUserProfile, FeatureManager.tokenOfProfileUuid |
| R31.5.1–R31.5.7 | ✅ COMPLETE | — |
| R31.9 | ✅ COMPLETE | UC.method=observePosition correctly wired, chain intact |

**Totals:** COMPLETE 12 · INCOMPLETE 4 (R31.5, R31.6, R31.7, R31.8) · MIS-WIRED **0**.

## Authoritative gap list (for req/architect — MINT, not me)

1. **R31.5** — mint UC(s) + Class→Method→Impl→Test chain (currently a bare requirement).
2. **R31.6** — mint UC(s) + full chain (bare requirement).
3. **R31.7** — mint Impl (+Test) for Methods `Build.versionGuardTreeClean` and `Build.versionGuardAgreement`.
4. **R31.8** — mint Test units for the 6 Impls listed above (chains stop at Impl).

## R31.9 tree mis-resolution — ROOT CAUSE (confirmed)

The tree resolves a UC's method via `UseCase.model.method` → server attaches `chainMethod`
(server.ts:1644–1647, **queryMode==='trace' only**). Client (`rb-trace-tree.buildSeedNode`) renders
`chainMethod` if present, **else falls back to `fetchAndRenderChildren`** (the Class's methods) — which
surfaces a SIBLING method (e.g. `onGrabBarPointer`, R25.4) on the same Class.

- **The failure mode = a UC with EMPTY `.method`.** On CURRENT disk, **no S31 UC has an empty `.method`**
  (0 MIS-WIRED) — R31.9's UC.method IS set to observePosition (e8097351), which IS in RbDetailDrawer.methods[].
- Therefore the IMG_4647 mis-resolution is **either** (a) a stale screenshot pre-dating the UC.method fix, **or**
  (b) the view was NOT trace-mode (chainMethod only attaches in `queryMode==='trace'`) → client fallback.
- **This is NOT a data-mint gap for R31.9.** Recommended: tester re-verifies the live /trace (trace-mode) after a
  server reload; if it STILL shows onGrabBarPointer WITH UC.method set, the residual root cause is the client
  fallback path (queryMode≠trace) = a CODE fix (architect/expert), not a req mint.

## PUML gap (GAP 1, PO-measured — architect/req own)
S31 has NO `diagrams/` (no .puml). Needs use-cases.puml + class-diagram.puml + sprint-31-chains.puml to match S28/S29.
