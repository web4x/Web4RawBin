# Universal Link Mechanism — drop/link/remove/delete (robbin-architect, 2026-09-07)

Tron's model: **"one DnD for all folders as dropTargets everywhere. dropping … places a link to the centralized storage scenario unit ALWAYS … no matter if file, image, task, modelElement or whatever oop object. remove button on every file … and a delete button that is red and really removes from the index and removes all links (dangerous)."** Extends the object-action mechanism (Command + self-registering Registry, R33.9/R40.105) — it does NOT fork it. Design-only; hand to expert (mid INC-3).

## ★ THE ROUTED DECISION: MOVE COMPOSES FROM LINK + UNLINK. Link is the primitive; move stops being one.
Measured containment today = **single-parent**: a unit has ONE `parentFolder`; a container has `children[]`; a room has a `fileUnits` Set. Tron's "N links, never a copy" makes containment a **many-to-many edge set** — a unit's presence in a folder IS a link (edge), not the unit's own field.

Under that model the algebra is forced:
- **LINK** (the PRIMITIVE = the drop) = add ONE containment edge (container → unit ref). Never a copy, never touches the unit. Tron: "dropping … places a link ALWAYS" → a plain drop ADDS a link; the source link stays → the unit is now in BOTH → genuine N-links.
- **REMOVE / UNLINK** = delete ONE edge HERE. Unit + all other edges survive.
- **MOVE = unlink(source) + link(target)** — a COMPOSITION of the two primitives, NOT a mechanism. → **We DELETE the bespoke `reparentUnitsIntoContainer` parent-mutation and re-express move as `unlink+link`.** This is the DRY-est outcome: we remove code, not add it. (The explicit "Move…" affordance we shipped v0.8.208 keeps its picker; its `run` becomes `unlink(current)+link(picked)`.)
- **DELETE** = destroy the unit in the index + unlink EVERY edge to it. RED, confirm-gated, dangerous, git-recoverable.

So `move` and `link` are NOT two mechanisms doing the same thing — `link` is the atom, `move` is a two-atom composition. This is exactly the duplication-removal discipline of the night.

## Storage of the edge (reuse what exists, no new unit class)
The edge = the unit's ref in a **container's `children[]`** (folders) / `fileUnits` (rooms) — these ALREADY hold `ior:instance:<uuid>` REFS, not copies. N links = the same ref in N containers' `children[]`. This is identity-by-reference, the same law as the one-store root. The old singular `parentFolder` field is the single-parent CONSTRAINT — it is RETIRED (or demoted to optional `originFolder` provenance, never a containment source of truth). Containment is read from the edge set, one direction (container → unit), never the unit's own field.

## ONE drop contract, every folder a target (no per-surface handler)
`dnd-contract.resolveDropPayload` (the ONE canonical resolver, already fail-loud, no URL parse) resolves any drop → a unit ref. The **Folder class owns `linkIn(unitRef)`** (MVC-in-object: controller on the object). EVERY folder-render across surfaces — room files, /model tree, diagrams, traceability — is a drop target BY BEING A Folder, calling `this.linkIn(resolved)`. No `RoomView`-specific / model-specific / diagram-specific drop handler: the per-surface handlers COLLAPSE into the Folder class's own drop behaviour (same collapse as the drop-defect Proxy/Factory work). A new surface that renders folders inherits drop-link for free.

## The four Commands (on the INC-1 registry, class-registered — R40.105 fold)
Registered via `registerAction({decl, run})`; each is GENERIC over unit kind (operates on a ref, switches on NOTHING):
- `link` — drop target → `container.linkIn(ref)`.
- `remove` — Command, label "✕ Remove", `container.unlink(ref)` (this edge only). On every file (Tron).
- `move` — Command, `unlink(current) + link(picked-folder)` (the v0.8.208 picker supplies the target).
- `delete` — Command, label "🗑 Delete", RED, `confirm()`-gated, → the delete flow below.

Because all four take a bare unit ref and never switch on kind, a NEW object kind (file/image/task/modelElement/…) gets all four with **registration only, zero central-conditional edits** — stronger OCP than move's `types[]` list (which this fold DISSOLVES: link/remove/delete apply to ANY unit; no per-type array).

## DELETE — zero dangling refs, recoverable (the hard part, explicit)
Tron: "removes all links (dangerous)." Delete destroys the unit AND every reference to it, leaving NO dangling ref.

**Scan, NOT a reverse-index.** A reverse-index (uuid → linkers) is a second source of truth that DRIFTS — the exact dangling-ref bug class we fight (R27.4). Delete is RARE and already dangerous/confirm-gated, so an O(N) scan is acceptable and DIRECTLY guarantees correctness: it finds every ref by construction, nothing to keep consistent. Reuse the EXISTING graph-integrity ref-walker (the trace:audit / dangling-ref scanner) — the same walk that enumerates `class`/`classes[]`/`method`/`children[]`/`parentFolder`/`members[]` refs.

**Flow (order matters — recoverability first):**
1. `confirm()` WARN (RED button) — dangerous, explicit.
2. **COMMIT the pre-delete state to git as DATA** (the unit + every unit that references it) BEFORE removal — git IS our rollback (Tron's ruling), exactly as we protected model-store before deleting it. A committed pre-image = restorable.
3. Remove the unit from the index.
4. **Scan all units; remove every ref to the dead uuid** (every edge in every `children[]`/`fileUnits`, and every other ref field). One pass.
5. Emit `publishUnitChanged` for each affected container → live re-render, no reload.

**ACCEPTANCE (machine-checkable):** after delete, the dangling-ref scanner reports **0 refs to the dead uuid** anywhere (the R27.4 invariant, reused). Idempotent (re-delete = no-op). Recoverable: the pre-delete commit restores the unit + its refs.

## Acceptance test (hold me to it — same as before)
1. A NEW object kind gains drop-link + remove + delete with **registration only**, zero central-conditional edits (the Commands are kind-generic; the drop contract is ONE).
2. `move` contains NO containment mutation of its own — it is exactly `unlink(source)+link(target)` (grep: 0 parentFolder-mutation outside link/unlink; `reparentUnitsIntoContainer` bespoke body is deleted or reduced to the composition).
3. DELETE: post-op dangling-ref scan = 0 refs to the dead uuid; pre-delete state is committed (restorable).
4. Every folder across surfaces is a drop target via the ONE contract (grep: 0 per-surface bespoke drop handlers; all → Folder.linkIn).

## Increments (expert is mid INC-3; sequence after it)
- **INC-4 (link primitive + edge model):** introduce `Folder.linkIn(ref)` / `unlink(ref)` as the edge ops on `children[]`; retire `parentFolder` as a containment source (read from edges). Drop = link. Register `link`/`remove` Commands.
- **INC-5 (move = composition):** re-express `move`'s `run` as `unlink(current)+link(target)`; DELETE the bespoke reparent body. Fold the `types[]` array away (link/remove/move are kind-generic).
- **INC-6 (universal drop target):** collapse the per-surface drop handlers (room/model/diagram/trace) into `Folder.linkIn` via the ONE `resolveDropPayload` contract.
- **INC-7 (delete):** the RED confirm-gated `delete` Command — commit-pre-image → remove unit → scan-unlink-all → publish. Gate on the 0-dangling scan.

**No invented mechanism:** Command + the R33.9/R40.105 registry + `children[]` edges that already exist + `resolveDropPayload` (the ONE drop contract) + the existing dangling-ref scanner as the delete gate + git as rollback (Tron's ruling).

## ★ CONTAINMENT-RELIANCE MEASUREMENT + parentFolder-RETIRE = a DATA-SEMANTICS REPOINT (PO condition, R40.81 lesson)
Retiring parentFolder as the containment source is structurally the SAME operation as the R40.81 store repoint (which LOOKED transparent and was not — project:model appeared, only a differential caught it). MEASURED first (PO condition 1):
- **parentFolder is used by ONLY 30 units, ALL `ior:class:WebItem`** (of 6923 total). It is NOT the system-wide containment source — containment for everything else is ALREADY `children[]` edges + room fileUnits.
- **Folders resolve contents via `children[]`** (down) and carry `parent` as their up-pointer (FolderService `FolderUnit.parent`/`children[]`) — `parentFolder` is a SEPARATE, WebItem-only field, NOT the folder tree's pointer.
- **Only 2 code readers touch parentFolder:** `federation-transfer.ts` (ref-rewrite pass) and `WebItem.ts` (where it's set) — NEITHER is the tree/room contents render.
- **★ THE RISK:** all 30 are parentFolder-ONLY — **0 of 30 appear in any `children[]` edge.** So their containment edge does NOT exist yet; dropping parentFolder without backfill = those 30 lose their parent. AND their CURRENT render is unknown-until-differential — since folder `children[]` omits them, they may be a LATENT MIS-RENDER today (parent set, folder doesn't list them). Do NOT assume; the differential decides.

**So the repoint is SMALL + BOUNDED (30 WebItems + 2 code sites), not system-wide — but it gets the FULL R40.81 treatment because containment is user-visible:**
1. **Backfill before retire:** create the `children[]` edge for each of the 30 (WebItem → its parentFolder-target's children[]) as the migration; only THEN retire the field.
2. **Transparency DIFFERENTIAL (PO condition 2, PAIR-2 shape):** the tree/room/model surfaces render IDENTICALLY before vs after, with the 30 WebItems' location asserted specifically. ★ IF the differential shows a WebItem absent-before / present-after, that is a BEHAVIOR CHANGE (a latent-mis-render fix riding the migration) — SURFACE it to Tron, do not ship it silently as "transparent."
3. **Dual-read transition (PO condition 3):** the containment reader resolves from `children[]` edges; keep parentFolder readable during transition (read both), retire the field ONLY after edge-reads are proven byte-identical. No destructive field removal first.
4. **Pre-image commit the migration (PO condition 4):** commit the 30 units + their folders as data BEFORE the backfill mutation (git = rollback), same discipline as delete's pre-image and model-store-before-delete.

This becomes **INC-4a (the parentFolder repoint)**, gated on the differential, sequenced BEFORE the general link/unlink edge ops build on `children[]` as the sole containment truth. federation-transfer.ts + WebItem.ts are the 2 code sites to update to the edge form.
