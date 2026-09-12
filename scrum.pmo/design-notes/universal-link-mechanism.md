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

## ★★ RENDER MEASUREMENT (PO condition, ahead of INC-4a) — CORRECTED
★ CORRECTION of a first-pass over-claim: I initially wrote "25 misplaced + 5 invisible" assuming parentFolder points at a sub-FOLDER. Precise re-measure: **ALL 30 parentFolder targets are ROOMS, never Folders** — parentFolder on a WebItem is a ROOM-membership marker, not a folder pointer. Corrected classification (enumeration: `webitem-containment-defect-30.json`):
- **25 of 30 — REDUNDANT-but-CORRECT (0-delta):** parentFolder == the WebItem's OWN room, AND the WebItem IS in that room's `files[]` → renders at room root = its intended place. NOT a defect. Retiring parentFolder for these changes NOTHING (fileUnits is the real membership; parentFolder is redundant-consistent).
- **5 of 30 — INVISIBLE (the REAL defect):** parentFolder = room `3231db71`, but the WebItem is NOT in that room's `files[]` → renders NOWHERE. They belong to a room (per parentFolder) but were never added to its fileUnits. **1 of the 5 = `about:blank#blocked` junk** (should never have been minted, v0.7.0) → DELETE-candidate, not restore. The 5: `3f80f8c8`(junk) `96f54cc2` `adf1a8c0` `cf45d317` `dc48165b`.

**So the LIVE DEFECT is 5 WebItems, not 30.** parentFolder is a dead-for-render field (0 render reads); for 25 it's harmlessly redundant, for 5 it's the only (unhonored) record of room membership.

**Consequence for INC-4a — TWO differentials (corrected):**
- **Differential (a) TRANSPARENCY 0-delta:** the ~6893 edge-based units + the 25 redundant-parentFolder WebItems — retire changes nothing (proves true transparency).
- **Differential (b) FIX, announced:** the 5 invisible WebItems — 4 restored to room `3231db71`'s fileUnits (invisible→visible), 1 junk deleted. NOT 0-delta; DOCUMENTS the intended change for Tron's approval. Treat as its own announced working-robustness backlog item that INC-4a delivers.

★ The retire is also SIMPLER than first framed: parentFolder here is room-membership (redundant with fileUnits), not a folder `children[]` edge — so "backfill children[] edges" was wrong; the only reconciliation needed is adding the 5 orphans to room `3231db71`'s fileUnits.

## ★ SLICE-4 GAP: derivation + removal still assume ONE parent (the N-link's read/remove half) — design (2026-09-12)
Tester (v0.8.216, 55115a6c3): the link EDGE is correct in data (F's uuid in BOTH containers' children[], resolves ONCE, not a copy) but the tree derives children by LOCATION → an N-linked unit does NOT render under the folder it was linked into. + unlink-unit takes only {unit} (no container) → per-container remove is impossible. ONE ROOT: the model became a many-to-many EDGE SET (children[]), but READ (tree=by-location) and REMOVE (unlink=by-single-parent) still use the single-valued location/parent, which can express only ONE container. Data-right / render-absent is the "stored but not rendered" class; remove-here==remove-there.

### Pattern (from the book — not invented)
- **Single Source of Truth:** the children[] edge set is the AUTHORITATIVE containment relation. `location`/`parent` are a DENORMALIZED cache of the FORMER 1:1 containment — stale/insufficient under N:M (one value can't hold N memberships = a classic update anomaly).
- **Derive the view from the authoritative relation (edges), not the denormalized field** — "view = f(edges)", the SAME generated-view discipline as R37.2/R37.3 (board = f(units)). A folder's contents = the units whose edge set includes it (its children[] / reverse-lookup), a graph adjacency read, NOT a location group-by.
- **The EDGE is the addressable identity for removal:** unlink targets the (container, unit) pair, not unit.parent. `FolderService.unlink(folderUuid, unitRef)` ALREADY takes the container — the /unlink-unit HANDLER just truncates it.
- **Normalization:** single-FK (location) → association-as-SoT (edge set) eliminates the anomaly.

### Fix A — derivation (render): tree contents from the EDGE SET, not location
A folder renders the units whose children[] edges point into it — regardless of physical location. ★ CRUX the expert must decide: the room tree mixes PHYSICAL dirs (createPhysicalFolder) with LOGICAL children[] edges. SEPARATE the concerns — **physical location = where bytes live (stays SINGLE, a storage detail); logical containment = which folders show the unit (N, the edge set, the RENDER source).** Option (a) render PURELY from children[] edges, demote physical location to storage-only (cleanest, one SoT); Option (b) UNION physical-dir contents with logical children[] edges (less disruptive, two sources). **Recommend (a)** — one SoT for the render; physical path stops driving the tree.

### Fix B — removal (edge-targeted): /unlink-unit honors a container ref
/unlink-unit must accept a CONTAINER/parent ref and pass it to FolderService.unlink(container, unit) (primitive already supports it). Remove-here removes THE edge in THIS container; other edges + unit survive. Client remove Command must send the folder-context (which folder the user removes it FROM). ★ SAME bug lurks in MOVE: move-unit's unlink-half must unlink the SOURCE container edge specifically (not the single parent) — else move of an N-linked unit unlinks the wrong/only edge. Verify/fix move's unlink-source too.

### Blast radius (honest — surfaces assuming single location/parent)
- **Room file TREE render:** CHANGES (Fix A) — the main change; derive from edges.
- **unlink-unit handler + remove Command client:** CHANGES (Fix B) — carry + honor the container ref.
- **move-unit unlink-source:** CHANGES/VERIFY — unlink the SOURCE container edge, not the single parent.
- **breadcrumbs / "contained in" / detail location:** an N-linked unit has N parents → show N paths OR the context path (degrade to the folder navigated-from); never assume one canonical parent.
- **parentFolder-retire (INC-4a, in flight):** this IS the READ-side of that retire — they CONVERGE; do them coherently.
- **"exactly one parent" dependency:** PHYSICAL storage path stays single (bytes stored once — fine); every LOGICAL-containment derivation (tree, breadcrumbs, move-source, detail) moves to edges.
Both fixes are ONE root — ship together: finish migrating READ + REMOVE off the single-parent assumption onto the edge set. Design-only; hand to expert.

### Fix-A DECISION (expert owns the tree code): (b) UNION, not (a) pure-edge — ACCEPTED + endorsed
The expert chose (b) UNION (render = physical-location contents ∪ children[] edges), NOT my recommended (a) pure-edge. **Endorsed — (b) is the safer transition and catches a real risk in my (a) rec:** pure-edge render would DROP any unit contained ONLY by physical-location with no children[] edge → it VANISHES = the "stored but not rendered" / parentFolder-retire strand class (the exact hazard this whole arc guards). (b) is ADDITIVE: nothing currently-visible disappears, AND the N-link edges become visible (the bug fix). Correct application of "don't strand units on a derivation-source switch — migrate additively, backfill, then retire."

Two refinements on (b):
1. **SET union (dedup by uuid per container):** a unit BOTH physically-under-F AND with a children[] edge to F renders ONCE under F (not twice); physically-under-A + edge-to-B renders under BOTH A and B (correct N-link). Dedup within a container by uuid.
2. **Name the transitional DEBT + collapse trigger:** (b) is TWO sources (location + edges) = an accepted TRANSITION, NOT the end-state — a standing two-source is the DRY/one-SoT violation this arc removes. The pure-edge SoT end-state (a) is GATED on the location→edge BACKFILL (every physically-located unit gets a children[] edge) done coherently with the parentFolder-retire (INC-4a). Record a gate/check that the backfill DRAINS the location-only set to 0, at which point (a) pure-edge flips on and location is demoted to storage. Without the named trigger, (b)'s two-source union silently becomes permanent (report-only trap).

Fix-B confirmed: /unlink-unit gains a container ref → FolderService.unlink(folder, unit); move-unit unlink-half targets the SOURCE edge, not model.parent.

### INC-6 PURE-EDGE FLIP — pre-stated BACKSTOP BAR (2026-09-12)
Flip nested-child membership derivation from LOCATION to children[] EDGES (root unchanged). Precondition (expert measured @v0.8.221, re-run fresh at flip commit): FILE strand=0 (36 nested, 0 location-only) + FOLDER strand=0 (9 nested folders all edged — covers the probe's folder-skip gap). ★ SCOPE = B (render AND directChildCount both edge-based), NOT A — a correctness point: leaving the count on location while the render flips to edges creates a count-vs-render SPLIT the moment a true N-link (edge-only) is added (count undercounts, render shows it) = the view-disagreement class; the count is part of the view and must share the edge source.
BAR (7): (1) strand=0 fresh at flip commit over ALL nested unit TYPES (not just files+folders; non-physical types = reveal-not-vanish, but any physical placeholder must be edged); (2) each (0) strand unit renders post-flip (pre/post rendered-tree diff = identical); (3) COUNT==RENDER for current units AND a freshly-added edge-only N-link (BITE: add edge-only link → both increment); (4) ROOT (selfFolder=null) byte-identical, the if(!selfFolder) guard gates only the nested path; (5) N-LINK VISIBLE — a unit edge-linked into a nested folder with no location renders under it (BITE: link F into B → F renders under B = the slice-4 fix); (6) roomFolderByLocation (folder identity/breadcrumb/detail) UNTOUCHED (flip = child-membership only, not location-as-identity); (7) FIX-A union debt RETIRES for nested = single-source edges end-state, strand=0 is the drain-check proof. Expert verifies (2)+(5); architect backstops all 7.

### INC-7 DELETE — pre-stated BACKSTOP BAR + the PRE-IMAGE ruling (2026-09-12)
**★ PRE-IMAGE RULING (the expert's question): the INVARIANT is "the pre-image exists in committed git BEFORE removal + the deletion names its restore-sha" — VERIFIED, never ASSUMED.** "git history = rollback" is accepted ONLY when the runtime delete VERIFIES git HEAD already holds the EXACT current unit bytes (`git show HEAD:<path>` == current):
- committed+clean → history IS the pre-image; restore-sha = HEAD; no new commit needed.
- dirty / uncommitted / freshly-created (history lacks the current state) → the delete MUST commit the pre-image FIRST (unit + refs), restore-sha = that commit. 
This closes the uncommitted-window hole — do NOT assume "units are committed by the fleet" (a fresh/dirty unit would delete irrecoverably). Same principle as guard #5: verify the precondition, don't trust it. PUSH: runtime delete commits LOCALLY before removal (durable recoverability floor) + names the sha; push rides the normal fleet cadence (don't hang a user's delete on a network round-trip). DEBRIS migration (one-time, deliberate): commit+PUSH before, as the expert planned. (If the PO wants push-before-delete strict for host-loss-proofing, that's a UX/latency call for the PO — my rec is local-commit-before + async-push.)

**BAR (I backstop):**
1. **Pre-image** per the ruling (verified-in-git or committed-first; restore-sha in the deletion record).
2. **0-DANGLING:** post-delete, the trace-audit dangling walker reports 0 refs to the dead uuid across ALL ref fields (children[]/files[]/fileUnits/parentFolder/members/class/method/…). Idempotent (re-delete = no-op).
3. **GUARD #5 declared-footprint:** actual diff ⊆ guard-derived {remove U + unlink refs-to-U}; ANY bystander change BITES. Tester BITE: a delete that also drops a bystander member → REFUSED (proves #5 bites DURING delete).
4. **ACTUALLY GONE (deleteRoom no-op fix):** post-delete `/api/ior` no longer resolves the unit — the canonical scenario/index unit removed, not just the room dir. deleteRoom: room unit + its file units removed/orphaned + scan → VERIFY /api/ior gone (verify-gone, the no-op WAS the bug).
5. **.content blob (rule):** removing a File unit removes its `.content` blob ONLY if no OTHER unit references that contentHash (dedup) — a shared blob STAYS (removing it = breaking another unit = dangling-content). Same no-dangling principle at the blob layer.
6. **OWNER-gated + RED confirm:** delete-unit route owner-gated (playerToken); client RED-styled + window.confirm.
7. **move-unit UNTOUCHED** (drag streak intact — delete never touches the move/link path; grep: move-unit absent from the delete diff).

### INC-7 DELETE — COMPOSITE-TARGET footprint (PO edge case, ruled before build)
A room delete is a COMPOSITE target (room + member edges + nested content). The footprint derivation MUST be TRANSITIVE, or a legit room delete looks like mass bystander destruction and bites #5 — then we'd be tempted to exempt it, reopening the hole at the worst place. Ruling:
**The guard DERIVES the composite footprint transitively from the target's OWN containment closure, BOUNDED BY SHARING.** footprint(delete Room R) = the transitive closure reachable through R's containment (R's files[]/fileUnits, R's folders' children[], nested content), **INCLUDING a unit U only if U is NOT referenced by any edge from OUTSIDE the closure.** A SHARED U (referenced by another room/container, i.e. an N-link reachable from outside R) is NOT in the footprint → it is NOT destroyed; only R's edge to it is unlinked (R removed, the shared unit survives via its external ref). Same at the blob layer: a `.content` blob is destroyed only if no unit OUTSIDE the removed set references its contentHash (shared-blob-kept).
- A LEGIT room delete (remove R + its EXCLUSIVE closure + unlink R's edges to shared units) → actual-diff ⊆ derived-closure → **PASSES** (no exemption).
- A room delete that destroys a SHARED unit/blob (reachable from outside R) → that unit is BEYOND the closure → **BITES** (this IS the shared-blob-kept / "don't destroy something Tron has open elsewhere" guarantee, at the unit level).
**Unforgeable + composite-aware:** the caller declares only "delete R"; the guard computes R's exclusive closure ITSELF (transitive + sharing-bounded). No "composite exemption" flag — the composite-ness is DERIVED, not asserted. 
NOTE (product choice, within-footprint either way): whether deleteRoom DESTROYS vs ORPHANS R's EXCLUSIVE contents is the delete's design (both are inside R's closure, both legit); the guard only ever bites on crossing the SHARING boundary. Destroy-exclusive (pre-image recoverable) is cleaner than leaving unreachable orphans; orphan-shared (unlink only) is mandatory. Backstop checks: a shared unit/blob referenced outside R SURVIVES a room delete (the BITE test extended to composite — delete a room containing a unit also linked elsewhere → that unit must still resolve via /api/ior afterward).

### INC-7 — destroy-exclusive RULED (PO) + the 48 EXISTING orphans are in scope
PO ruled the within-footprint choice: **DESTROY-EXCLUSIVE (pre-image recoverable), not orphan.** Decisive reason (measured): ORPHAN-EXCLUSIVE IS THE CURRENT BEHAVIOUR AND IS THE BUG — the tester measured **48 orphans**, created precisely because deleting 72 rooms LEFT their exclusive contents behind (unreferenced, unreachable). Choosing orphan-exclusive would ship the defect as the design. So deleteRoom DESTROYS what only that room held (pre-image each → recoverable), UNLINKS (orphans) only SHARED units. PO surfaces this to Tron as a one-liner-he-can-overrule (his data, but a conventional semantic with a rollback → proceeds without blocking, like drag-stays-MOVE).
**★ FORWARD NOTE — the 48 are EXISTING debris, not just a go-forward concern:** destroy-exclusive fixes NEW room-deletes; the 48 orphans already on disk (from the 72 prior deletes) are a DEBRIS CLEANUP that INC-7 (or a paired sweep) must also run. Each orphan-removal goes through the SAME bar: declare the target, guard-derive its footprint, VERIFY it is truly orphaned (0 refs-to-it from anywhere — an "orphan" still referenced is NOT an orphan, it's shared → keep), pre-image, remove, 0-dangling. Do NOT bulk-delete the 48 on the "orphan" label alone — verify 0-refs per unit (guard #5 bites if one is actually shared). Flag so the 48 are cleaned, not forgotten.

### INC-7 — the 48-orphan SWEEP needs TWO orthogonal gates + is DECOUPLED from the go-forward fix (PO)
The 48 orphans need BOTH checks before ANY is removed — they ask DIFFERENT questions:
1. **SAFETY (link-state, architect):** is it TRULY orphaned — 0 refs from ANYWHERE? An "orphan" still referenced is actually SHARED → KEEP (guard #5 bites). ★ THE LABEL IS NOT THE FACT (phantom-4 lesson): "orphan" is a claim about link-state derived ONCE by a scan; it must be RE-DERIVED per-unit AT the moment of deletion, never inherited from the scan.
2. **VALUE (provenance, PO):** does the unit trace to a TEST room or a REAL one? A genuinely-unreferenced unit can still be CONTENT TRON WANTS — a file that outlived its room is recoverable data, not garbage. "Orphan" describes link-state, NEVER worth. So: **test-room orphans = debris (sweepable); any REAL-room orphan = surfaced / re-homed, NOT deleted, PO decides individually.** (Tester is classifying all 48 now.)
A unit is swept ONLY if it passes BOTH (truly-orphaned AND test-provenance).

**SEQUENCING (PO): the orphan SWEEP STAYS HELD until the provenance split lands. The go-forward fix ships WITHOUT it.** Decouple: fix the BEHAVIOUR first — deleteRoom ACTUALLY deletes (no-op fixed), the dangling class closed, the footprint guard live — and let the debris sweep FOLLOW on evidence (the provenance classification). We are not obliged to clean 48 things in the same breath as fixing why they happened. (Corrects my earlier "48 in scope for INC-7" — the go-forward behaviour is INC-7; the 48-sweep is a HELD follow-on, not blocking the ship.)

### INC-7 — ENFORCED KEEP-SET (from the a16262b8 incident): a protection not read by the selection protects NOTHING
Incident (tester git-proved, 4270d0043): room a16262b8 was DELIBERATELY removed by its own 09-09 owner-based sweep — NOT a vanish. The sweep's SELECTION was owner-based; a16262b8 matched the owner filter; the KEEP flag was an ANNOTATION IN NOTES, never wired into selection. The other two KEEP-flagged rooms survived only BY COINCIDENCE (different owners the filter missed). KEEP protected NOTHING.
**THE LAW (third costume this arc): A PROTECTION NOT ENFORCED BY THE SELECTION LOGIC PROTECTS NOTHING.** Same family as guard #5 ("an exemption must be STRUCTURAL, never a phrase a caller asserts") and phantom-4 ("the label is not the fact"). A KEEP written where the delete never reads is decoration.

**FOLD INTO THE BAR (pre-stated, failable):**
1. **Protection is a HARD field ON THE UNIT** (`model.protected`/`keep`), travelling WITH it — NOT in notes, NOT a separate drift-prone list the code may not consult. The selection always loads the unit, so it always sees the flag.
2. **Checked as an EXCLUDE in SELECTION, BEFORE any owner/type/scope filter:** a unit is eligible for delete/sweep ONLY IF `matchesCriteria(u) AND NOT u.protected`. Protection OVERRIDES the match — evaluated first, not after, not as a warning, not as an annotation.
3. **Guard #5 backstop (defense-in-depth):** a protected unit appearing in the actual-diff = BITE (a protected unit is never in a legitimate footprint). So protection is enforced at BOTH selection (primary) and execution (guard).
4. **FAILABLE — the mandatory BITE:** construct a protected unit that MATCHES the sweep criteria → assert it is NOT deleted (REFUSED). A keep-set that has never refused anything is UNTESTED (like guard #5's bystander bite, like a lint that cannot fail). Tester proves the BITE; stub-must-fail (remove the exclude → the protected unit gets swept → RED).

**CAUSALITY (record): deleteRoom-no-op is UPSTREAM of this incident.** Because the automated delete does not work, a HUMAN had to hand-sweep canonical units — and the hand-sweep is where the enforcement gap lived (KEEP-in-notes). A broken delete does not just leave orphans; it FORCES manual deletion, and manual deletion is where safety flags get skipped. So fixing deleteRoom (INC-7 behaviour) removes the FORCING-FUNCTION for unsafe hand-sweeps — raising INC-7's value beyond cleanup. The enforced keep-set protects both the automated delete AND any residual sweep.

### INC-7 — the KEEP-SET needs DATA + a SYSTEM RULE, not just the field (PO: mechanism-without-data protects nothing)
`model.protected` existing protects ZERO units until units CARRY it — ship the field with nothing marked and the next owner-sweep behaves exactly like 09-09 (code correct, outcome identical). That is "banked-centrally-is-not-operational": a protocol that exists but was never applied to the real objects. So the MARKING is part of INC-7, not a follow-on:

**(1) INITIAL MARKING (INC-7 scope — data + mechanism ship together):** set `model.protected` on the three known KEEP rooms — **a16262b8** (being restored), **3231db71** (Tron-owned), **edd7fa61** (Marcel-owned; the latter two survived the last sweep BY COINCIDENCE and are currently unprotected IN FACT) — plus the **3 evidence units** once re-homed.

**(2) GOING-FORWARD = a SYSTEM RULE, never a human memory (PO point 3):** if marking relied on "a human remembers to", we rebuild the annotation failure with extra steps. So the sweep SELECTION protects a unit when `model.protected === true` **OR it matches a system-applied PROTECTION RULE evaluated at selection-time** — and the rule reuses the **provenance axis already established for the 48 orphans**: a sweep may touch ONLY test-provenance units; any unit owned by a REAL/protected identity (Tron + real users — reuse the R40.22 protected-identity-set) is protected BY THE RULE, automatically, without anyone marking it. So a NEW Tron-owned room is protected the moment it exists. ONE provenance axis governs both the orphan-sweep value-gate and the keep-rule. `model.protected` (the field) then covers EXCEPTIONS the rule can't derive (an evidence unit that is test-owned but must be kept) and is set by an explicit keep ACTION (a Command), never a notes annotation.
- Selection exclude = `model.protected` OR `owner ∈ real/protected-identity (non-test provenance)`. Defense-in-depth with guard #5 at execution.

**(3) TESTER VERIFIES ON DISK after INC-7 ships (a protection nobody verified = one nobody wired):** the `model.protected` field PRESENT on a16262b8/3231db71/edd7fa61 (+ the 3 evidence once re-homed); the BITE (a marked unit survives a matching sweep); AND the RULE (a real/Tron-owned room survives a matching sweep even WITHOUT an explicit field). Stub-must-fail on both the field-exclude and the rule-exclude.

### ★ INTENDED CONSEQUENCE (do NOT "fix" this): a real/Tron-owned room is UNDELETABLE BY ANY SWEEP, by design
The provenance rule (a sweep may touch ONLY test-provenance units; real/Tron-owned is protected BY THE RULE) means a real/Tron-owned room CANNOT be removed by any bulk/filter selection — permanently, by design. This is INTENDED, not a limitation:
- **Bulk selection is for DEBRIS.** Destroying something REAL should always cost a DELIBERATE, NAMED, INDIVIDUAL delete (the named-target delete Command, with a pre-image) — never a filter that happens to match it. The asymmetry (bulk=debris-only, real=explicit-named-act) IS the safety.
- If Tron wants one of his rooms gone, it goes via the individual delete naming that uuid (pre-image recoverable) — it is NOT supposed to be sweepable.
**★ DO NOT WEAKEN THE RULE TO MAKE A SWEEP WORK.** A future sweep-author WILL eventually hit "I cannot sweep this real room" and be tempted to loosen the provenance guard so their sweep proceeds. That is EXACTLY the 09-09 incident one abstraction layer up: the protection bypassed to let an operation complete. The correct response to "the rule blocks my sweep of a real room" is NOT to weaken the rule — it is to use the DELIBERATE INDIVIDUAL delete for that one room, or to accept that real rooms are out of the sweep's scope. The rule blocking a real-room sweep is the rule WORKING. (Meta-law: when a protection makes an operation impossible, the answer is a different EXPLICIT operation, never a weakened protection — weakening-to-make-it-work is how protections die.)

### INC-7a BITE-GATE spec (PO-constrained: throwaway unit INSIDE fixed room 909f1bd6, NO new room; 5 bites stub-must-fail; tester runs, architect verifies firing)
Setup (all inside room 909f1bd6, the ONE fixed test room — NEVER a new room, NEVER a real/debris/evidence unit): mint DISPOSABLE units minted-to-be-deleted — `Utest` (with a ref-holder `R` so refs-to-Utest exist), a bystander `B` (in 909f1bd6, does NOT reference Utest), `U2` (shares Utest's contentHash for the blob test), `Uprot` (model.protected=true). Each delete below is a NAMED individual delete of a unit we minted to delete — permitted; NO criteria/owner sweep.
FIVE BITES, each STUB-MUST-FAIL (removing the guard flips the assertion → RED):
1. **KEEP-SET → 403:** delete Uprot → REFUSED 403. Stub-must-fail: remove the `um.protected`/ownerByToken exclude → Uprot gets deleted → RED. (A keep-set that never refused is untested.)
2. **BYSTANDER UNTOUCHED:** delete Utest → B is BYTE-IDENTICAL before/after (diff ⊆ {Utest+refs}; B outside it). Stub-must-fail: if APPLY touched a non-referrer → B changes → RED.
3. **SHARED BLOB KEPT:** Utest+U2 share contentHash; delete Utest → the .content blob SURVIVES + U2 still resolves its content (blobAction=kept-shared). Stub-must-fail: remove the shared-check → blob removed → U2 content gone → RED.
4. **0-DANGLING + RESTORE ACTUALLY WORKS (do NOT trust the sha):** delete Utest (ref-held) → danglingAfter==0 AND restoreSha returned AND restore from restoreSha RE-CREATES Utest + its refs → Utest resolves again via /api/ior. Stub-must-fail: if pre-image not committed-BEFORE-removal → restore fails / unit unrecoverable → RED. (Verify the restore, don't believe the sha — pre-image VERIFIED not ASSUMED, at the test level too.)
5. **IDEMPOTENT:** re-delete Utest (already gone) → ok, no error.
Cleanup = the test's own deletes (the minted throwaways are destroyed by the test; restore-in-#4 then re-delete, or leave deleted) → NOTHING left behind in 909f1bd6. TESTER runs (independent of the builder); ARCHITECT verifies each guard SEEN firing, then signs INC-7a full-green. Until seen firing: 7a = code-sound + UNPROVEN; 7b (deleteRoom) does NOT ship.

### INC-7 reliability follow-on: PIN DATA_DIR (gate-reads == server-writes BY CONSTRUCTION, not inference)
Multi-store hypothesis is DEAD (PO measured 2 ways: live :4444 /api/ior filePath resolves to THIS tree; this tree received writes at 18:55, after the 18:45 restart — no candidate-store writes). Writes land HERE. My "leftover DATA_DIR → alt store" was a reasonable-but-wrong lead; the empirical method I recommended (test-upload → find-new-file) is what resolved it, but the cause was not store-divergence. The narrower live question: WHAT CHANGED AT/AFTER 18:55 — a failing upload path, an auth/permission change, or simply no uploads attempted in the window.
★ BUT the reliability fix STANDS (PO: board it): **pin DATA_DIR / SCENARIO_DIR EXPLICITLY** so the running server's store is fixed BY CONSTRUCTION, not inferable. We just spent the whole arc making the MODEL a single store; leaving "which scenario/index" inferable (DATA_DIR unset → default → .env → prod) is the SAME ambiguity one layer out — a future restart in a shell with a stray DATA_DIR WOULD diverge, and a gate reading a different store than the server writes reports a false "0 writes" (instrument-confound). Pin it (start.mjs sets DATA_DIR to the resolved prod path explicitly, or assert-at-boot that DATA_DIR==the-intended-store and REFUSE otherwise — fail-loud, like the UDS boot-assert). Then gate==server is structural.
★ INSTRUMENT DISCIPLINE (recorded): a `find -newermt '-24 hours'`/grep that CANNOT MATCH reports 0 and reads as "absence" — the same false-negative class as a blank grep on a huge file / a truncated body / ideal-input execution. VALIDATE THE INSTRUMENT before trusting a zero: prove the query returns non-zero on known-present data first. The tester's "0 writes/30min" must be re-measured with a validated instrument before it's trusted as real.

### ✅ INC-7a SIGNED FULL-GREEN (robbin-architect, 2026-09-12) — verified-firing, not read
Signed on INDEPENDENT verification of the bite-gate (test/visual/r40106-inc7a-bite-gate.mjs @ 01e4cdf58, origin/hotfix/t40.1-checklist-band; PO pushed it — tester push was classifier-blocked): I READ the gate's 5 assertions + confirmed each is correct AND failable, and it fired DET-3x on served v0.8.223:
1. keep-set: protected→403+survives AND stub-must-fail (unset protected→200+deleted) — the a16262b8 enforcement proven load-bearing.
2. bystander byte-identical after a ref-held delete.
3. shared-blob: `blob==='kept-shared'` + U2 resolves + blob file survives — failable against server.ts:1099's `'removed'` branch (mis-detected share → removed+gone → RED).
4. danglingAfter==0 + restoreSha + RESTORE actually re-creates Utest (git show restoreSha → /api/ior 200) — VERIFIED not sha-trusted.
5. idempotent (delete restored→ok; re-delete gone→ok).
All throwaways minted INSIDE 909f1bd6 (no new room), each a named individual delete; test self-cleans.
★ HONEST TRAIL: the earlier RED was a TEST BUG (synthetic writeFileSync with NO mkdir → a random uuid hit a nonexistent 5-char shard dir → nondeterministic ENOENT, different path each run), NOT a server/upload defect. Tester proved uploads land@0ms + persist 40s (isolated probe) → no live defect; the "stop if uploads fail" escalation is CLEAR. My refusal to sign on a read was vindicated — exercising the guards found a real fault (in the TEST), and a read-sign would have shipped it unexercised.
★ UNBLOCKS: 7b (deleteRoom composite-fix) + the 6 keep-marks MAY now ship. The no-sweep order lifts ONLY after 7b + keep-marks land (not on this signature alone).

### INC-7b bite vs the single-test-room constraint (tester flag) — architect recommendation: ISOLATE, don't except
REAL collision (tester, correct): the 7b bite INTRINSICALLY needs a DISPOSABLE ROOM to deleteRoom (909f1bd6 is protected, must NOT delete), which collides with the enforced single-test-room constraint + r-test-room-single-source-lint (ROOM_BASELINE=52, RED above). Route to PO (owns the constraint); do NOT build till blessed. 7a used a throwaway UNIT in 909f1bd6 (units don't pollute the room list) — 7b is different because it needs a ROOM.
Two options for the PO:
- **(A) tester's:** ONE SystemTester throwaway room in the PROD store, create+deleteRoom+verify-gone within the run (net-zero, self-cleaning), + a documented lint exception for the transient +1. Faithful (incl the git pre-image path, repo-relative), but needs an EXCEPTION — and an exception a future reader can widen is the hole-reopening class we've been closing all arc.
- **(B) architect rec — ISOLATE (scratch, no exception):** run the 7b deleteRoom-bite on an ISOLATED test server (the server.ts-supported pattern: DATA_DIR=scratch + reuseExistingServer:false + a different port) — ideally DATA_DIR = a scratch GIT WORKTREE so the pre-image commit path is faithfully exercised. The throwaway room(s) live+die in the SCRATCH store → INVISIBLE to the prod room list AND the ROOM_BASELINE lint → **no exception needed, no prod pollution, same deleteRoom code**. For shared-survives: mint TWO scratch rooms + a shared unit linked into both; deleteRoom one → assert the shared unit survives in the other. Scratch torn down at run-end = net-zero by construction.
Recommendation: **(B)** — isolating the destructive room-test is the don't-force-prod-mutation discipline + it avoids a standing lint-exception (which would be a weaken-the-guard-to-make-the-test-work vector, the 09-09 class). Use a scratch git worktree as DATA_DIR so pre-image stays faithful; if 7b reuses deleteUnitWithScan per-unit, 7a already proved the pre-image anyway. PO ratifies; tester holds till blessed. This also DOGFOODS the DATA_DIR-pin (the isolated server has an explicit DATA_DIR = gate==its-own-store by construction).

### INC-7b bite — PO RATIFIED (B) ISOLATE (2026-09-12), build-spec
PO ratified (B) (independent convergence — had ruled it to the tester already) + adopted the dogfoods-DATA_DIR-pin reason (the 7b bite simultaneously proves deleteRoom AND exercises the reliability fix that the which-store confound cost us — the test validates the thing that was blocking tests). Build-spec:
- ISOLATED test server: DATA_DIR = a scratch GIT WORKTREE (so the pre-image git-op stays FAITHFUL — testing it against a non-git store would prove the wrong thing), reuseExistingServer:false, a different port. The explicit DATA_DIR = gate reads its own store BY CONSTRUCTION (dogfoods the pin).
- Throwaway room(s) live+die in the SCRATCH worktree → invisible to the prod room-list AND the ROOM_BASELINE lint → no exception, no prod pollution, same deleteRoom code.
- SHARED-SURVIVES: mint TWO scratch rooms + a shared unit linked into both; deleteRoom one → assert the shared unit SURVIVES in the other (only its edge unlinked).
- 7b BITE assertions: exclusive unit GONE + room /api/ior GONE + shared unit SURVIVES + shared blob SURVIVES + 0-dangling + keep-set/provenance BITE stub-must-fail (a protected/real-owned scratch room → deleteRoom REFUSED; remove the exclude → deletes → RED). Composite footprint guard-DERIVED (transitive closure bounded by sharing).
- FALLBACK (A) ONLY if (B) is PROVEN INFEASIBLE with a SPECIFIC reason ("the rig cannot reproduce X" — NOT "heavier than expected"): then ONE SystemTester-owned, name-prefixed, self-cleaning room (its own deleteRoom IS the cleanup, verified GONE), never marked protected, exception NARROW + TIME-BOXED to this gate + reason documented. (A permanent exception for a one-off need is how a one-room rule became a 72-room sweep.)
★ SYMMETRY (PO): same principle as the held-45 selector that could-not-reach-the-held-set BY CONSTRUCTION — a rig that CANNOT reach prod beats a prod room we promise to clean up. Enforced-by-construction > promised. Tester builds the rig (may prep now); the BITE RUN needs the expert's 7b (deleteRoom-fix + 6 keep-marks) shipped first. Architect co-verifies firing.
