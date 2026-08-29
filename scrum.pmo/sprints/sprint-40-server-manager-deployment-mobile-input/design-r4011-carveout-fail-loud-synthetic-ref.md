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
- Also WIDEN the synthetic-ref grep-lint (see "why it didn't fire" below) so the contract-violation class can't recur.

## ★ Why the guard didn't fire — CASE (a) COVERAGE GAP (measured, PO's question)
`check:synthetic-ref-single-source` EXISTS, is WIRED in ci:gates:raw, and has a working self-BITE — so it is NOT removed (b) nor muted (c); this is NOT the check:task-status dead-guard class. It is a **coverage gap (a)** — a scan-the-hazard failure:
- Its pattern #2 matches `/api/ior/ior:instance:${ref}` / `${rawRef}` **by VARIABLE NAME** (regex `\$\{\s*(?:ref|rawRef)\b`). RbDetailBase:57 interpolates `${uuid}` (the result of `refUuid(ref)`) → the name-keyed regex MISSES it.
- And `refUuid(` is explicitly EXEMPT (lint lines 15-16: "refUuid on a ref already proven non-synthetic") — an assumption the lint cannot verify, so it never flags `refUuid` on an UN-proven ref.
- Net: no other guard silently died (bounded — a never-covered call-site, not an accumulating gap), BUT the name-keying means ANY call-site using a differently-named var evades. [[scan-the-hazard-not-the-actors]]: the lint scanned actor-shapes (specific var names) instead of the HAZARD (instance-keying a ref that could be synthetic).
- **WIDEN — REVISED (expert R7-flag, measured; my grep-widen was under-measured):** the naive widens DON'T work and must NOT ship (R1/R2 — a false-firing guard is worse than none):
  - blunt `ior:instance:${…}` (any interp) → **~40 FALSE POSITIVES** (legit ior-MINT sites: Room/EmailIndex/PhoneIndex/class-mint/server CR-mint/message-unit build refs from FRESH uuids, not ref-sniffs).
  - file-level `refUuid + ior:instance + no-isSyntheticRef` → 5 files, but spot-checked their `refUuid` feeds href/graph.get RENDERING, not the instance-fetch = coincidental co-occurrence, not the hazard.
  - The TRUE hazard `refUuid(ref) → var → ior:instance:${var}` is a **DATA-FLOW** a line/file grep cannot catch without false-positives.
  - **Correction accepted (honesty both ways):** the CURRENT lint's narrow `ref|rawRef` pattern NEVER matched r4011's `${uuid}` → there is **NO NEW false-green**; the coverage gap is **pre-existing OWED debt**, not fresh lying. My "false confidence now" framing was off — the lint isn't newly-blind, it just never covered this shape.
- **RULING: (a) ship r4011 INSTANCE-closed NOW** (the fail-loud code fix is verified PASS + closes the user-visible defect) **+ (c) the class-cure is OWED, by-construction, not a grep:** funnel ALL `ior:instance` construction through the existing `types.ts iorInstance()`, then a lint = **no raw `ior:instance:${` outside the funnel** — unevadable, a SYNTACTIC one-funnel invariant (converts the uncatchable data-flow hazard into a structural one). This is scan-the-hazard-not-the-actors done RIGHT: don't scan the data-flow (impossible cleanly), eliminate the hazard SHAPE. It's a ~40-site refactor → its own OWED task, NOT blocking r4011. Reject (b) AST/flow-aware as heavier and still detection-not-elimination.
- **SURFACE THE OWED (truth-decay):** record this coverage gap as a NAMED owed item (the class-widen for synthetic-ref instance-keying) — declared, not silent — so the owed debt is visible (coverage-self-report principle), not a quiet hole that reads as covered.

## Handoff
Expert builds the base fix (route synthetic → resolveRefUnit, fail-loud on no unit); tester gates RED→GREEN + the positive-control pairing + @390. req: this is an R40.11 sibling (fail-loud on unresolvable) regressed by R37.24 — mint/attach the AC as a fail-loud-on-unresolved-synthetic AC (ride R40.54 failable + Arm-B pairing). I re-inspect: synthetic ref routes through resolveRefUnit, no `refUuid` on a synthetic ref, unresolvable→loud, resolvable→content. Not urgent vs the recorder capture; not droppable — owned now, not a nameless permanent RED.
