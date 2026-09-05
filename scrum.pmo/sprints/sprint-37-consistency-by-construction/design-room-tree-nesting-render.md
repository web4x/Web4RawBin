# Room items-tree nested-folder render — fix-shape ruling (architect, 2026-09-05)

PO GO on the flat report (r4022 A5 both RED: scratch NestGateOuter/Inner render as siblings; live prod Trash+duplicates both at depth-2, Trash no chevron — matches my flat discriminator). Write is correct, view is flat. Ruling requested: confirm/correct/replace the tester's single-site direction + reconcile my two staged sites. DRY, one mechanism, strip anything nobody ordered. Measured, not assumed.

## MEASURED ROOT — ONE site (I CONFIRM the tester)
**The bug = the EAGER Room-type branch, server.ts:3204-3216.** It re-derives the room's file children itself:
- `fileItems` (3204-3208) maps the **entire flat `filesArr`** (all files[] units regardless of depth) with **`hasChildren:false` hardcoded** (3208).
- Inlines that flat list as `children` of the Files collection (3215).
⇒ every folder (Trash, duplicates, …) renders as a direct child of Files at the same depth, no chevron, structurally cannot hold children — independent of how correct the data nesting is.

**The correct mechanism ALREADY EXISTS and is DRY:** the `roomcoll:<room>:files[/nested]` lazy children branch (server.ts:3086-3121):
- filters `files[]` by each unit's `model.location` prefix (`currentPrefix`, 3102);
- emits **only DIRECT child folders** of the current node (3111: `loc.startsWith(prefix+'/') && no further '/'`), with **`hasChildren: directChildFolders>0`** + `childCount` (3113) — chevron correct;
- uploaded Files only at top-level (`!nrel`, 3115);
- nests by location, one level per fetch (lazy).
This is the single source of room file/folder children and it already resolves nesting correctly (tester-confirmed; I verified the code).

## THE DEFECT IN ONE LAW (LAW-9)
The eager branch is a **second derivation of the same children** — behaviour that belongs to the one roomcoll resolver, copied inline and flattened. That duplicate derivation is the defect the moment it was written; the two derivations diverged (lazy=nested-correct, eager=flat-wrong). Fix = delete the duplicate, keep the ONE.

## FIX SHAPE (confirmed, corrected to one mechanism)
In the eager Room-type branch (3204-3216): **do NOT re-derive/inline the flat `fileItems`.** Emit the Files collection node as a **lazy handle** — `{ uuid:'roomcoll:'+uuid+':files', type:'folder', name:'Files (N)', hasChildren:<has-any-top-level>, childCount:<top-level-count> }` with **no inline `children`** — so expanding it fetches `/api/trace/children/roomcoll:<room>:files`, which routes to the EXISTING correct lazy branch (3086). The flat `fileItems` map (3204-3209) is deleted.
- `N`/`childCount`/`hasChildren` = a cheap top-level count (files[] units whose location is directly under `files`, i.e. no nested segment) — the SAME predicate the lazy branch uses; if the client needs the first level eagerly (see open item), extract that top-level computation into ONE shared function both branches call — never copy the predicate.
- **Members** collection is untouched: a flat leaf list (`hasChildren:false` members) is correct — no nesting, nobody ordered a change. Strip nothing else.

## RECONCILE MY TWO STAGED SITES → they collapse to ONE
- **Site 1 (items-tree, Room-type resolver 3204-3216):** the real fix. ✓
- **Site 2 (Trash detail 'no children', detail-children.ts:32 / generic Folder-children path):** **NOT a separate fix — subsumed by Site 1.** Reason (measured): the lazy branch gives each folder node `uuid = its roomcoll LOCATION ref` (3113: `uuid: loc` = `roomcoll:<room>:files/Trash`), not the raw unit uuid. So once folders render via the lazy branch, opening Trash's detail fetches `/api/trace/children/roomcoll:<room>:files/Trash` → the SAME lazy branch (rcKind `files/Trash`, handled at 3086) → returns its direct child `duplicates`. The "no children" symptom exists TODAY only because the eager branch gives Trash the raw uuid (3e041bff) + hasChildren:false, routing its detail to the generic branch. Fix Site 1 → both the tree nesting AND the detail children resolve through the one lazy resolver. The generic-Folder-children path is not hit for room folders; my Site 2 needs no change. Tester's "single real site / second may be already correct" = CONFIRMED.

## OPEN ITEM for the expert (verify, don't assume — one small companion at most)
Does the client items-tree **lazy-fetch** a collection node's children when `hasChildren:true` and no inline `children`? The roomcoll nodes were designed lazy (3211-3213 comment), so removing the inline list should trigger the fetch (fix is server-only, a pure delete + count). IF the tree needs the first level eagerly, the eager branch supplies the TOP-LEVEL list via the shared predicate (option B above) — still one derivation, no copy. Verify before shipping.

## GATE (r4022 A5, unchanged) + LAW-10
Team verifies the RENDER by depth/containment @390 on a scratch member-session room (member-gated, no owner-auth, no Tron): a nested folder renders INDENTED under its parent with a chevron; parent shows its child on expand + in detail. stub-must-fail: a flat render (child at parent depth) stays RED. Verification complete by the team before Tron sees it. DATA UNTOUCHED (correct).

## HANDOFF
Expert: delete the eager flat `fileItems` re-derivation (3204-3209/3215), emit Files as a lazy handle with a top-level count, route children through the existing roomcoll branch; verify the client lazy-fetch (open item). One mechanism, server-only if lazy-fetch works. Commit path-limited. I backstop: both tree + detail resolve through the ONE roomcoll resolver, Members untouched, no second derivation remains.
