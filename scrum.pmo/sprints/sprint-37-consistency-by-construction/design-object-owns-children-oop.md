# The object OWNS its children (OOP redesign) — SUPERSEDES the shared-provider design

**Author:** robbin-architect 2026-09-05. Tron REJECTED the shared children-provider (ffc5c8892) and he is right; I own that I proposed a functional shape. His words: "the Folder OWNS the children, and each type owns its children — that is OOP with a tree parent-children interface, and we have made OOP typescript a functional nightmare." Design-only.

## Why the provider was the SAME mistake (own it)
A `getChildren/subscribeChildren/invalidateChildren` provider is EXTERNAL machinery: it pulls children-derivation OUT of the object into a service any caller invokes. That is exactly how we got two derivations — nothing OWNED the answer, so the tree derived one way and the detail another. A third external thing both "must remember to use" adds another bypassable place; the next surface diverges again. **It is the SAME shape as the store complaint, and they are ONE problem, not two tickets:**
- `data/model-store` pulled DATA out of the object → duplicate unit files that disagree.
- the provider pulls BEHAVIOUR out of the object → duplicate derivations that disagree.
Both = taking what belongs to the object and putting it elsewhere → copies that drift. "DRY everywhere / no duplicate index / the Folder owns the children" are Tron saying this in three words.

## The OOP shape: a parent→children INTERFACE that types IMPLEMENT
ONE interface, owned by the type — not a service:
```ts
interface TreeParent { children(): Promise<TreeChild[]>; }   // the parent OWNS the answer
```
- `Folder implements TreeParent` → `children()` = its own dir/unit listing (the ONE place a Folder's children are computed).
- `Room implements TreeParent` → `children()` = [Members, Files].
- `File` (leaf) → no children (not a TreeParent, or children()=[]).
- Each TYPE owns its children() — polymorphic, one implementation per type.
**The tree and the detail/sunburst both call `node.children()` on the SAME object.** There is exactly ONE owner of the answer, so:
- The tree renders from `folder.children()`.
- The detail/sunburst renders from `folder.children()`.
- They CANNOT diverge — not because two callers stay in step, but because there is one method on one object and no other way to get a Folder's children. That is what by-construction means.

## Concrete shape (client)
- One typed node model per scenario type implementing `TreeParent.children()` (the client-side object for a ref). An IDENTITY MAP (ref → node instance) so both surfaces obtain the SAME object, not two copies.
- `children()` is the type's method: it computes/caches the answer ON the object; a `unit-changed` for the object's ref re-derives ONCE on that instance; every surface holding it re-renders. No external invalidate() a caller must remember — the object owns its freshness.
- RETIRE: the shared provider (never built), the tree's inline-seed + standalone `reDeriveDirectChildren`, and the detail's independent fetch — all replaced by "ask the object."
- The server `/api/trace/children` per-type resolver stays as the type's BACKING (an implementation detail of `Folder.children()`), not a service surfaces call directly. (Server already resolves per-type in one place — keep that; the fix is the CLIENT ownership.)

## ONE principle across both tickets (unify, don't split)
- **Data ownership:** the object owns its unit file → ONE store (scenario/index); other indexes are SYMLINK trees (design-one-store-symlink-index-trees.md). No second physical store.
- **Behaviour ownership:** the object owns its children() → ONE method per type; surfaces ask the object. No external derivation service.
Same law: what belongs to the object lives ON the object; everything else is a view (symlink / a caller asking the object), never a copy.

## Handoff
Expert: HOLD — do NOT build the provider. Build the interface + per-type `children()` + the identity-map so tree & detail ask the object. req mints the OOP req/ACs (Folder-owns-children interface / one-owner / tree==detail by construction / no external derivation service). I backstop: both surfaces render from the SAME `children()` call (assert one owner, no second derivation path; stub-reds if a surface derives children any way other than `node.children()`). Ship order unchanged: this OOP children fix first (Tron's invisible folder), store migration second (same principle, server-side).
