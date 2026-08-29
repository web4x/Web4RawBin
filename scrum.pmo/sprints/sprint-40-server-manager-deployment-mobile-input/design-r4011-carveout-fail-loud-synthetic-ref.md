# r4011-carveout — restore FAIL-LOUD on unresolved synthetic refs (architect, 2026-08-29)

PO routed: tester settled r4011-carveout PRE-EXISTING (byte-identity, not the 0.8.144 deploy) but it is a REAL open defect with a named root — refusing to leave it a permanently-RED gate nobody owns (a RED that becomes background noise is how a real defect hides). Class: **fail-safe replacing fail-LOUD** (AMEND-4 / L15 — a swallowed degrade recreates the silent bug); user-visible (Tron sees an EMPTY region, not an honest "unresolved").

## Root (measured, falsifiable — corroborates tester+expert)
R37.24 migrated the detail elements onto **RbDetailBase**. Its resolver (`rb-detail-base.ts:50-61`) does, for EVERY ref:
```
const uuid = refUuid(ref);                                  // :53
const obj  = this.graph?.get(uuid) || null;                 // :54
let model  = obj ? this.modelFromObj(obj) : null;           // :55
if (!model) { const j = await fetch(`/api/ior/ior:instance:${uuid}`)...   // :57
              if (!j?.unit) { innerHTML = '⚠ unresolved: …'; return; } }  // :58 fail-loud
```
**This VIOLATES the synthetic-ref single-source contract** (`synthetic-ref.ts:13,17`, verbatim): *"a synthetic ref goes to /api/ior/&lt;FULL rawRef&gt;"* and *"NEVER apply refUuid to a synthetic ref."* RbDetailBase applies `refUuid` + `ior:instance:` to a synthetic ref too. For a synthetic **depref** (or dir:/file:/puml-src:…) that has a TREE-NODE in the graph, `graph.get(refUuid)` returns that node → `modelFromObj` yields a non-null shell → it renders an EMPTY detail (sparse node fields, no real unit) and **never reaches the :58 fail-loud**. The OLD rb-detail-view resolved synthetic refs through `resolveRefUnit(fullRef)` with an explicit depref→"⚠ unresolved" branch; the migration RETIRED that (rb-detail-view.ts:40) and replaced it with the instance-only path → the loud degrade became a silent empty. TWO defects in one: (a) fail-loud→fail-safe (L15); (b) synthetic-ref-contract violation (the module's own grep-lint should have caught `refUuid` on a synthetic ref).

## Fix — route synthetic refs through the SOLE resolver; fail-LOUD on no unit
Per-file, `rb-detail-base.ts` `resolveAndRender()`:
| Step | Current (BUG) | Fix |
|---|---|---|
| classify | `refUuid(ref)` applied to ALL refs | detect **synthetic** ref (has a synthetic prefix: depref:/dir:/file:/puml-src:/project:/rawbin:/mof-/collection:) vs a real instance ref |
| synthetic resolve | `graph.get(refUuid)` → shell → empty | **`resolveRefUnit(fullRef)`** (synthetic-ref.ts — → `/api/ior/<FULL rawRef>` → ensureViewUnit). Do NOT `graph.get(refUuid)` a synthetic ref (a tree-node ≠ a resolved unit). |
| unresolved | falls through to empty shell | if `resolveRefUnit` returns no real unit → `innerHTML = '⚠ unresolved: ${ref}'` + `announceShown` — **fail-LOUD, never empty** |
| instance ref | unchanged | keep `graph.get(refUuid)` ELSE `/api/ior/ior:instance:${uuid}` |

- Composes with **R40.66** (ensureViewUnit refuses a bare-uuid file: → null → resolveRefUnit → no unit → ⚠ unresolved) and with **R40.11** (fail-loud on unresolvable; generic type-driven view on resolvable). One resolution source (resolveRefUnit), one fail-loud site.
- Restores the retired synthetic-unresolved branch INSIDE the base (not a per-element copy — the extract-once RbDetailBase stays the single owner).

## Gate (stub-must-fail + Arm-B positive-control PAIRING)
Isolated (R40.31), must be able to FAIL:
- **RED baseline (the defect):** feed RbDetailView an UNRESOLVABLE synthetic ref (e.g. `depref:__nonexistent__` or a `file:<bogus-uuid>`) → PRE-fix renders EMPTY (`.dv-empty` with no "unresolved" text / a bare shell). Tester captures this RED.
- **GREEN (the fix):** same input → renders `⚠ unresolved: <ref>` (fail-loud), NOT empty.
- **★ Arm-B positive control (pairing — mandatory, not optional):** ALSO feed a RESOLVABLE synthetic ref → renders CONTENT. Proves the instrument DISTINGUISHES (not "always shows unresolved"). Asserting only the unresolved half would be the very assert-one-half born-false shape — both halves gated: unresolvable→loud AND resolvable→content.
- **@390 (user-visible, Tron):** the deployment-ref node whose ref is unresolvable shows the honest "unresolved", not an empty region.
- Also add/verify the synthetic-ref grep-lint fires on `refUuid` applied to a synthetic ref (the contract-violation that let this in) — a by-construction guard so the migration class can't recur.

## Handoff
Expert builds the base fix (route synthetic → resolveRefUnit, fail-loud on no unit); tester gates RED→GREEN + the positive-control pairing + @390. req: this is an R40.11 sibling (fail-loud on unresolvable) regressed by R37.24 — mint/attach the AC as a fail-loud-on-unresolved-synthetic AC (ride R40.54 failable + Arm-B pairing). I re-inspect: synthetic ref routes through resolveRefUnit, no `refUuid` on a synthetic ref, unresolvable→loud, resolvable→content. Not urgent vs the recorder capture; not droppable — owned now, not a nameless permanent RED.
