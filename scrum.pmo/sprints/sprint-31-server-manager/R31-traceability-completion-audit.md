# Sprint 31 — Traceability chain + PUML completion audit (Tron 2026-07-24)

**Tron:** *"all issues have been resolved. nice. now we have a content issue. the traceability chain is more or less fine but not complete in the tree… do you see it? review the whole Sprint with the team and complete all missing scenarios and puml diagrams."*

## MEASURED GAPS (PO, disk)
### GAP 1 — S31 has NO PlantUML diagrams (all missing)
S31 dir has only screenshots (PNG) + MD; **no `diagrams/` subdir, no `.puml`**. Every other sprint has them: S02/S09 = use-case.puml + class-diagram.puml + sequence-*.puml; S28/S29 = `sprint-NN-<name>-chains.puml`. **S31 needs the full set** to match the pattern: use-case diagram, class diagram, and a sprint-31-chains.puml (the Req→UC→Class→Method→Impl→Test chains).

### GAP 2 — chain mis-resolves in the traceability TREE (incomplete data)
R31.9 evidence (IMG_4647): the tree walks UC `drawer.observePosition` → Class `RbDetailDrawer` → but shows Method **`RbDetailDrawer.onGrabBarPointer`** + Impl + Test `R25.4 onGrabBarPointer gate` — the WRONG method (onGrabBarPointer is an OLD R25.4 chain on the same class). R31.9's real method is `observePosition` (e8097351 → Impl 240c539f → Test ccb4a810). ★ ROOT (skill-expert to confirm): the tree walks Class→Method and picks a SIBLING method's complete chain because `observePosition`'s own chain is INCOMPLETE/mis-wired in the walked data (missing back-ref, or the Method unit's UC/Class linkage not fully bidirectional). Completing the scenario wiring fixes the tree resolution.

## THE TASK (Tron): review the WHOLE sprint + complete all missing scenarios + PUML
Every S31 requirement (R31.1–R31.9) must have a COMPLETE, correctly-wired chain (Req→UC→Class→Method→Impl→Test, bidirectional both-ways) that the tree resolves to the RIGHT method, AND the sprint must have its PlantUML diagrams.

## ROUTE (scenario-first, CMM3/4 — team review, per lanes)
- **skill-expert (traceability lane):** AUDIT every S31 requirement chain on disk — for R31.1..R31.9, walk Req→UC→Class→Method→Impl→Test and report per-req: complete / incomplete (missing unit) / mis-wired (wrong-method resolution like R31.9 observePosition→onGrabBarPointer). Produce the authoritative gap list (which units missing, which links not bidirectional). This is the tree-resolution root.
- **req + architect:** from the gap list, MINT the missing scenario units + fix the mis-wired links (bidirectional Method↔UC↔Class, Impl↔Method, Test↔Impl) so the tree resolves each UC to its correct method. req owns UC/requirement units + use-case PUML; architect owns Class/Method topology + class PUML.
- **architect/req:** AUTHOR the missing S31 PUML (match S28/S29 pattern): `diagrams/use-cases.puml` (all R31 use cases + actors), `diagrams/class-diagram.puml` (RbDetailDrawer, ServerManagerGuard, PtyBridge, OtmuxBridge, RbProfileView, Feature/FeatureManager, etc.), `diagrams/sprint-31-server-manager-chains.puml` (the Req→...→Test chains).
- **planner:** track the completion as tasks; regen views.
- **tester:** verify the tree resolves each S31 UC to its correct method (the R31.9 observePosition case = the acceptance probe).
- **Tron:** review the completed tree + diagrams.

Ref: IMG_4647 (R31.9 chain resolving to wrong onGrabBarPointer method).
