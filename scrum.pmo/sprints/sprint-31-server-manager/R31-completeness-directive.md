# Sprint 31 — COMPLETENESS directive (Tron 2026-07-26): "i want completeness"

Tron ruled on the two open items — BOTH get fully closed, no shortcuts:

## ITEM 1 — non-trace tree resolution: FIX IT (not defer)
The tree resolves a UC's method correctly ONLY in trace-mode (server attaches `chainMethod` in `queryMode==='trace'`, server.ts:1644-1647). In NON-trace views (scenario-mode etc.), `chainMethod` is absent → client (`rb-trace-tree.buildSeedNode`) falls back to `Class.methods[]` → surfaces the WRONG sibling method (e.g. onGrabBarPointer instead of observePosition). Tester confirmed: correct on /trace, wrong in non-trace.
**Tron wants COMPLETENESS: the correct method must resolve in EVERY view, not just /trace.** = a CODE fix.
- **architect:** diagnose + design — either (a) server attaches `chainMethod` (from UC.method) in ALL query modes, not only trace, OR (b) client resolves UC.method directly (never blind-fallback to Class.methods[] when the UC has a .method). Pick the correct-by-construction one (UC.method is the authoritative pointer; the fallback should only fire when UC.method is genuinely empty). positioning: this is a resolution-correctness fix, shared component (rb-trace-tree / trace API).
- **expert:** build. **tester:** gate in BOTH trace-mode AND non-trace/scenario-mode views — the UC resolves to its correct method everywhere. **req:** capture as a requirement + AC (scenario-first).

## ITEM 2 — R31.5 + R31.6 complete chains (not legit-bare)
Audit flagged R31.5 (umbrella, useCases[] empty) + R31.6 (conceptOnly pan/zoom, useCases[] empty) as INCOMPLETE. Tron wants them COMPLETE, not left bare.
- **R31.5 (umbrella):** mint a rollup UC (or the umbrella's own UC) linking to the composed-layout behavior, so the umbrella itself has a chain — not only its 5.1-5.7 children. req + architect decide the right shape (rollup UC → the RbEditorLayout/composed class, or link the umbrella UC to the strip composition method).
- **R31.6 (concept — pan/zoom, FUTURE, not built):** a concept still gets a COMPLETE chain to the extent it exists: UC (the pan/zoom use case) → Class/Method DESIGN units (the intended shared pan/zoom viewer topology) → and since it's not built, the chain terminates honestly at design/concept (no fake Impl/Test — but the UC + designed Class/Method + PUML make it a COMPLETE concept chain, not a bare requirement). req + architect define the concept-chain shape so the tree shows a full chain for R31.6 too.
- **req:** mint the R31.5 + R31.6 chains. **architect:** the Class/Method design units + PUML for both. **skill-expert:** re-audit → confirm 16/16 COMPLETE (0 incomplete) after.

## ROUTE (scenario-first, CMM3/4)
req formalizes: ITEM-1 as a new requirement+AC (non-trace resolution), ITEM-2 as the R31.5/R31.6 chain mints → architect designs ITEM-1 code fix + ITEM-2 topology/PUML → expert builds ITEM-1 → tester gates ITEM-1 both-modes → skill-expert re-audits ALL S31 = 16/16 complete → Tron reviews the complete tree + all PUML.
GOAL: every S31 requirement has a COMPLETE chain that resolves correctly in EVERY view, + full PUML. Completeness, no gaps.
