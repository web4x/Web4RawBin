# R37.32 — Parent-notion authority (architect chain-model ruling, 2026-08-31)

req measured (independent repro of the expert's 26%): 286/1374 owned units (20.8%) disagree between STORED-parent (`ownerIor`|`model.parent`) and FORWARD-SCAN parent (who lists the uuid). Sub-classes: 177 (62%) stored-but-NO-forward / 65 (23%) single-forward≠stored / 44 (15%) multi-forward. + a 3rd notion: stored splits `ownerIor`(24) vs `model.parent`(1350). /trace breadcrumb (server.ts:3096-3116) already MIXES ownerIor-then-FWD_SCAN. Analysis-only (freeze). My read, from chain Rules 1-5.

## (1) THE AUTHORITATIVE NOTION = the FORWARD-CHAIN edge. Stored back-refs are DENORMALIZED VIEWS that drifted.
Chain Rule 1: the chain is **forward-only, requirement-rooted** (Req.useCases[] → UC.class/method → Class.methods[] → Method.implementations[] → Impl.tests[]). **A unit's chain-parent IS "who forward-references it"** — the FORWARD-SCAN parent. That is the single source of truth for the chain; the chain is DEFINED by the forward refs.
- **`ownerIor`** = meant to be the INVERSE of the forward edge (a denormalized back-ref cache: Class.ownerIor→UC, Method.ownerIor→Class, …). When it disagrees with the forward scan, **`ownerIor` is stale/wrong**, not the forward edge.
- **`model.parent`** = for a NAV unit (Task) it is the nav-parent (the Sprint that covers it, Rule 1 navigation Sprint→Task→coveredRequirements); for a CHAIN unit it should mirror the forward edge. Its wide use (1350) vs ownerIor (24) means it is the legacy back-ref field.
- **3rd-notion smell:** `ownerIor` vs `model.parent` are TWO stored back-ref fields = a two-source-of-truth for "parent" on top of the forward source = a THIRD copy that can drift from both. Collapse to ONE (or derive at read-time).
**Ruling: FORWARD is authoritative; ownerIor/model.parent are display-time denormalizations, never the source.** The 20.8% disagreement IS the denormalization drift (the whole-session disease: a stored copy nothing keeps true).

## (2) The 62% is a DATA BUG (→ R37.29); the 38% is classify-then-name
- **177 (62%) stored-but-NO-forward-parent = DATA BUG → route R37.29.** A unit stores a parent that does NOT forward-reference it back = a one-way link = **existence≠connection** ([[connection-is-what-lives]] F8) = R37.29's write-side dual (a ref must resolve BOTH ways). The forward edge is MISSING (the parent's forward array omits the child). Fix = add the forward ref (the real chain edge) OR drop the stale back-ref. This is the bulk and it is a genuine chain-wiring defect, not a dual-meaning.
- **65 (23%) single-forward ≠ stored — classify:**
  - if the FORWARD parent is a CHAIN edge and the STORED is a NAV edge (e.g. a Task forward-in-a-sprint vs its stored coveredReq nav) → **legit dual-meaning → NAME them** (`chainParent` = forward; `navParent` = stored nav). Two concerns, Rule 1.
  - if BOTH are chain-notions → **stored is stale drift → fix stored to match forward** (or derive it).
- **44 (15%) multi-forward = type-dependent:**
  - a **Class** with multiple forward-parents (UCs) = **LEGIT REUSE** (R27.2 canonical single-Class-node shared across UCs — exactly the dedup we built). Multi-parent is CORRECT for a shared Class.
  - a **leaf** (Method/Impl/Test) with multiple forward-parents = a chain violation (should be single-parent) → dedup/fix.
  - So multi-forward is legit-for-Class, suspect-for-leaf — classify by type (req's breakdown Class46 vs Test35/Method23 lets this split).

## (3) CREDIT / chain-completeness MUST read the FORWARD edge, never the stored back-ref
strict-impl credit / chain-completeness derives from the FORWARD chain (Req.useCases → UC.method → Method.implementations → Impl.tests → Test) = the single source. **If credit reads `ownerIor`/`model.parent`, a stale back-ref = false completeness** (a unit credited as chain-connected while its forward edge is missing = the 62% wiring gap wearing a green — the phantom-coverage disease at the chain layer). So: **credit reads FORWARD only; the stored back-refs are display-only + must be VERIFIED against forward (R37.29 both-ways), never the completeness source.** Check whether current credit code reads ownerIor — if it does, that is a live false-credit bug (route it).

## Cure (design shape for the eventual build, post-freeze)
- **Derive the back-ref from the forward refs at READ time** (eliminate the stored ownerIor/model.parent drift entirely — a reverse-index of the forward edge, like the parent-reverse-index we just approved for perf). Single source: forward refs; the "parent" is a derived view, invalidated on write. Kills the 20.8% drift by construction.
- If a stored back-ref must persist (perf), it is a CACHE verified both-ways by R37.29 (a stored parent with no forward counterpart = RED), never authoritative.
- Collapse `ownerIor` + `model.parent` → ONE field (or none, derive).
- The /trace breadcrumb (3096-3116) mixing ownerIor-then-FWD_SCAN = the two-source in one surface; route it through the single forward-derived reverse-index.

## Handoff
This is a chain-model authority ruling, not a build. UC 5ee38fed unblocked: FORWARD is authoritative; 62%→R37.29 data bug; credit-reads-forward. req refines R37.32 ACs to this; the 62% wiring-gap fix rides R37.29 (don't build a parallel guard); the dual-meaning naming (chainParent/navParent) is a small model addition. Coordinate so R37.29 (both-ways integrity) + R37.32 (parent authority) + the perf reverse-parent-index are ONE forward-single-source mechanism, not three. Post-freeze / post-scrub (no chain-data migration during the PII scrub).
