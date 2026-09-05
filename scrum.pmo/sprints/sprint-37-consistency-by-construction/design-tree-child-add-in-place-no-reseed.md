# Room tree child-add → full collapse/re-seed — root + fix-shape ruling (architect, 2026-09-05)

Tron defect on 0.8.175 (design-only, no build): adding a child to a folder causes a FULL TREE COLLAPSE + re-render instead of updating that node. He frames it as an MVC violation. Diagnose the mechanism + cite the site; rule the in-place shape; say plainly if the render layer lacks per-node binding (→ structural, size-before-schedule). DRY, no 2nd derivation.

## ROOT — MECHANISM NAMED + CITED: an imperative RE-SEED OF THE TREE ROOT, not a missing binding
**`RoomView.ts:82-85` — the `FILE_ADDED` handler calls `tree.renderSeed(this.roomId)`** = a full re-seed of the whole room tree from the room root. A folder IS a file, so add-child → `FILE_ADDED` → **root re-seed → every node rebuilt, roots start collapsed (rb-trace-tree.ts:282) → the collapse Tron sees.**

It is specifically a **re-seed of the tree root** (the PO's option 2) — NOT a wholesale graph refetch, NOT a key/ref remount, NOT lost-expanded-state-in-render. Expanded state DOES live in the model (`expanded: Set`, persisted localStorage, rb-trace-tree.ts:44/96/297); the re-seed just rebuilds from scratch beneath it.

## THE HONEST SIZE ANSWER: SMALL, not structural. Per-node binding EXISTS and WORKS.
The render layer HAS per-node model-binding, fully wired:
- **rb-trace-tree.ts:442** — every synthetic (roomcoll) folder/collection node live-subscribes on `viewBusKey(its-ref)` → runs `reDeriveDirectChildren`.
- **rb-trace-tree.ts:132 `reDeriveDirectChildren`** — on a unit-changed for a folder's ref: fetch its DIRECT children (one level), INSERT only new nodes, existing untouched (line 142 "ADD only new children, never rebuild the existing ones"), NO reload, NO flash.
- **Server folder-add already drives it:** `server.ts:2553 publishUnitChanged('ior:class:Folder', 'roomcoll:<room>:files[/nested]')` → the parent folder node re-derives in place.

So on a folder-add BOTH fire: the correct in-place insert (2553 → 442 → 132) AND the imperative root re-seed (2552 `FILE_ADDED` → RoomView.ts:84 `renderSeed`). **The re-seed clobbers the working in-place update.** This is the functional-construct-beside-the-model-binding: an imperative wholesale rebuild doing the same job the model-bound path already does. Deleting it is a SMALL fix — no new binding infrastructure. PO: schedule as small.

## FIX SHAPE (in-place, DRY, one path for files AND folders)
1. **DELETE the imperative re-seed** in the `FILE_ADDED` handler (RoomView.ts:84-85) — keep the chat "File uploaded" system message. Let the model-bound per-node path (publishUnitChanged → node subscribe:442 → reDeriveDirectChildren:132) do the in-place insert. Tree does not collapse; expanded state survives because the existing nodes are never destroyed.
2. **REQUIRED completion (so uploads still appear):** the file-UPLOAD path (`server.ts:2630`) currently broadcasts `FILE_ADDED` but does NOT `publishUnitChanged` the Files-node ref — so a top-level upload today relies on the re-seed to appear. Add `publishUnitChanged('ior:class:File', 'roomcoll:<room>:files')` on the upload path, EXACTLY as folder-add already does (2553), so an upload rides the SAME one path → the Files node re-derives in place. This is the DRY completion: ONE mechanism (publishUnitChanged → reDeriveDirectChildren) for both files and folders; the re-seed was the duplicate to remove.
3. **No 2nd derivation:** the fix REUSES the single existing derivation (reDeriveDirectChildren) and DELETES a wholesale rebuild — strictly fewer mechanisms after. Do NOT add a room-specific incremental path; the generic per-node one already covers it.

## Edge / adjacent (flag, not in this fix's scope)
- **Federation import (RoomView.ts:212)** and **sync-time FILE_ADDED (server.ts:4363)** also route through `renderSeed`. Federation is a BULK import (many units) where a single re-seed may be acceptable; the Tron defect is the single-add path. Flag as the same anti-pattern class for the PO to schedule separately — do not widen this fix.
- **Collapsed parent:** reDeriveDirectChildren skips a collapsed node (its badge/childCount refreshes on next open) — correct, no work for an unopened subtree.

## GATE (team @390 member-session, LAW-10 — never Tron)
Add a child (folder AND uploaded file) under an EXPANDED folder → the new node appears IN PLACE, the tree does NOT collapse, sibling + ancestor expanded state is preserved (measure by node presence + expanded set unchanged, not by padding). stub-must-fail: a re-seed/collapse on add stays RED (assert the pre-existing expanded nodes survive the add). Covers both add types via the one path.

## HANDOFF
Ruling committed path-limited. Expert (when it idles; SM renders first): delete RoomView.ts:84-85 re-seed; add the upload-path publishUnitChanged (2630) mirroring 2553; rely on the existing per-node binding. I backstop: no renderSeed on single-add, both add types appear in place via reDeriveDirectChildren, expanded survives, no new derivation.
