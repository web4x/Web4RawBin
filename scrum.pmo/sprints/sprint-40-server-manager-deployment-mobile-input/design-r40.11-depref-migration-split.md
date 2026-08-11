# R40.11 depref-migration — SPLIT design (architect, 2026-08-11)

Task `6e3cc1b2`. PO-dispatched split of the LARGE remaining item. Design-only, **no build until build-go**. Reuses the CLOSED reconcile ruling (applied f59b1b9e4) + R40.6 M2 types 0022-0033. **No new machinery.**

## Measured ground truth (source, dist excluded)
- `buildTypedModel` = **0 src hits**; `DeploymentModel` = **0 src hits**. Neither the class nor the method's code decl exists — R40.6 typed the M1 nodes DATA-side only (34d297d91). buildTypedModel IS T40.11's deliverable, and T40.6's markerPending Impl **e009ace7** credits `DeploymentModel.buildTypedModel` → the marker is fictional until this decl exists.
- The node unit `fc327458` carries `model.deploymentRefs` = a **raw `{role, ref}` string array** (4 refs: sshd_config · host key · .env domain · LE cert; `ref` = `ior:file:…`).
- **TWO depref emitters, identical logic**, both emit synthetic `uuid:'depref:'+role`:
  1. `OtmuxBridge.buildRootedTree` — `src/ts/server/OtmuxBridge.ts:70-71` (carries marker `fcd57103`, R40.2).
  2. inline duplicate — `src/ts/server/server.ts:1561-1562` (R41 re-root block in `/api/server-manager/tree`).
- Drawer `rb-detail-view.ts` gets `depref:<role>` → `graph.get()` miss. A fail-loud `depref:` branch already exists in the built bundle (`/(^|:)depref:/ → "⚠ unresolved"`), so the silent-Loading is PARTLY closed for the synthetic prefix — but the real fix is to stop emitting synthetics at all + generalise fail-loud to ANY unresolvable ior.

## Reconcile rule (CLOSED — do not re-litigate) → the typed unit set (4 refs → 5 units)
| deploymentRef | R40.6 M2 type | units |
|---|---|---|
| ssh-service | **Service** (Deployable) `configuredBy →` **ConfigFile**(/etc/ssh/sshd_config) | **2 (1→2 SPLIT)** |
| ssh-host-identity | **KeyFile** (FileBacked, manifestsAs real path) | 1 |
| letsencrypt-cert | **Certificate** (FileBacked) | 1 |
| domain | **EnvValue** (FileBacked-with-fragment .env#LE_DOMAIN) | 1 |

## THE SPLIT

### ★ SLICE 1 — `DeploymentModel.buildTypedModel` (the decl; closes T40.11 inc-1 AND unblocks T40.6)
Boundary set by MEASURED coupling: this is the one slice that makes e009ace7 a real marker.
- **New `src/ts/server/DeploymentModel.ts`** exporting **`buildTypedModel(node): TypedUnit[]`** — a **PURE** function (no I/O, no persistence, no `put`): takes the node's raw `deploymentRefs`, returns the typed-unit descriptor set per the reconcile table (5 descriptors from 4 refs, incl. the Service→ConfigFile `configuredBy` split), each carrying its R40.6 M2 type + `manifestsAs`/fragment where FileBacked. Reuses M2 types 0022-0033 — **no new type machinery**.
- Expert lands **`[impl:uuid:e009ace7]`** on the `buildTypedModel` decl → T40.6's last markerPending closes on a REAL decl.
- **Real behaviour, not a stub:** buildTypedModel returns the correct 5 typed descriptors with correct types + configuredBy edge + manifestsAs paths — a caller can mint from it. It is the deterministic core the rest of the migration consumes.
- **Persisting the 5 units** (writing them scenario-first so their default views resolve) is a SEPARATE authoring step gated by dry-run+count (below). Keeping buildTypedModel PURE is deliberate — see CHOKEPOINT flag.
- **GATE (isolated, R40.31; must be able to FAIL):** pure unit test — `buildTypedModel(fixtureNode)` → exactly 5 descriptors, types match the table, ssh-service yields Service+ConfigFile with the configuredBy edge, EnvValue carries the `.env#LE_DOMAIN` fragment. **stub-must-fail:** feed a ref with no mappable type → buildTypedModel THROWS/returns an explicit error, never silently drops it. No prod mutation (pure fn). 
- **Ships independently:** delivers the decl + (via the gated mint step) the 5 real units with default views. T40.11 increment-1 done; T40.6 unblocked. Tree/emitter/drawer untouched in Slice 1.

### SLICE 2 — consolidate the 2 emitters → 1, emit the REAL ior, kill `depref:`
- Extract ONE shared emitter (the OtmuxBridge site, keeping marker `fcd57103`) that maps each deploymentRef to its **real minted unit ior** (from Slice 1's units), NOT `'depref:'+role`. Delete the inline duplicate at `server.ts:1561`; the route calls the shared fn.
- **GATE:** grep — no `depref:` id reaches the drawer (AC-source). Tree emits real iors. **INV-T byte-diff==0 on the SESSION subtree** (sessions/windows/panes rows must NOT move); the ref-row uuids intentionally change synthetic→real (INV-T scoped to the parts that must not move, NOT the refs being fixed).

### SLICE 3 — ONE generic type-driven default view + fail-loud generalised
- Drawer renders identity + fields + parent/children via ONE generic view **driven by the M2 type** (type determines fields) — NOT per-type bespoke (DRY, the R40.5 lesson; PO steer). Generalise the existing fail-loud from the `depref:` prefix to ANY unresolvable ior → explicit `⚠ unresolved: <ior>`.
- **GATE:** @390 real-WebKit renders CONTENT not Loading; **stub-must-fail:** feed an unresolvable ref → shows the error state, does not spin.

### SLICE 4 (migration) — remove the raw `deploymentRefs` array from `fc327458`
- Once real units + typed model drive the tree, the raw string array is dead. Remove it as a **GATED dry-run+count migration**.
- **GATE:** dry-run FIRST prints COUNTS (refs removed, units now driving, emitter sites=0 synthetic); reversible; **INV-T byte-diff==0** — the rendered tree JSON must be byte-identical before/after array removal (the real units reproduce the same rows). Run on a SCRATCH index copy (no prod mutation), cleanup surviving failure (R40.31). Fails if byte-diff≠0.

### DEVICE (Tron @390, rides Slices 2+3)
Tron taps the deploymentRef node → drawer RENDERS CONTENT (pixel evidence). Un-mockable; owner device.

## Migration discipline (PIN 4)
Dry-run-first with COUNTS at every persisting step (Slice-1 mint, Slice-4 removal); additive units are reversible; INV-T byte-diff==0 wherever the tree must not move. Nothing destructive before its dry-run+count clears.

## ★ CHOKEPOINT FLAG (PIN 5 — expert HOLDS for architect confirm)
`buildTypedModel` is designed **PURE** so Slice 1's core touches NO chokepoint. BUT the two **persisting** steps — Slice-1 minting the 5 units and Slice-4 removing the array — write via `ScenarioIndex.put`. **I FLAG both:** the expert must NOT route the mint through any auto-reuse/dedup mint chokepoint by availability. Mint the 5 units as explicit scenario-first authoring (like a req mint), each a fresh declared unit; the array-removal is a gated migration. **Expert holds for my confirm before running either put-based step.** No chokepoint machinery is changed by this design.

## Schedule (PIN 3 — reach empty, don't stall at 1-remaining)
- **Slice 1 → build now on build-go** (unblocks T40.6 + closes T40.11 inc-1). Fresh expert builds this first.
- **Slices 2, 3 → next increment** (emitter consolidation + generic view; both client/server code, gateable automatically).
- **Slice 4 → final** (array-removal migration; runs only after 2+3 prove the real units reproduce the tree, so INV-T==0 is achievable).
- **Device @390 → Tron**, rides 2+3.
Remainder is named + ordered; the campaign reaches empty by shipping Slice 1 and scheduling 2/3/4, not by holding T40.11 whole.
