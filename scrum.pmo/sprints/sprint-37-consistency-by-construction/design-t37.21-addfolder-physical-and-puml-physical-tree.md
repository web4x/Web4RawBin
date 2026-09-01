# T37.21 — Add-folder PHYSICAL + puml PHYSICAL-tree (architect design, 2026-09-01)

Task `1bf4acc5`. Deadline: full + driven to QA-Review **tomorrow morning**. Design-in-parallel with req mint (#126). Push-freeze active (commit local, deploy served tree, no push). Parts A + B are the hard ones (mine); 1/3/4 noted for owners. Hand-expert concrete shapes, not a survey.

## TWO FLAGS — BOTH RAISED, BOTH RESOLVED (kept for the record)

### FLAG-1 (RESOLVED) — an OUR-SIDE artefact mishandling; Tron's real screenshots were CORRECT
**★ STANDING LAW (Tron direct, 2026-09-01): Tron's information is AUTHORITATIVE — never state or imply his screenshot/report/observation is wrong/stale/mistaken. On an apparent conflict, the error is OURS (mislabelled artefact, bad file copy/transcription, wrong surface/version/environment, or a broken probe); report "I cannot reconcile my measurement with your evidence — what am I missing?", never "your evidence is wrong." His screenshots ARE the acceptance; a gate that disagrees with what Tron sees is a failing gate, not a failing screenshot.**
What happened tonight: the files ATTACHED to the brief were an older upload batch (a PO file-handling error, PO-owned) — **Tron's four real screenshots were correct and were never in question.** The mislabelled files I/req/tester/planner each independently flagged were the mishandled artefacts, not Tron's evidence. Evidence folder DELETED; **SPEC TEXT + PO's faithful transcription are authoritative (PO-sourced → re-derive against the LIVE app).** The `file:<uuid>` "File unit not found" regression is REAL but **DEFERRED / OUT OF SCOPE** (Tron: "that and only that"). Nobody works it.

### FLAG-2 (RESOLVED by Tron 2026-09-01) — what "physical" means
`FolderService.ts:2` recorded *'"physical" = a persisted unit on disk, NOT a filesystem directory'* attributed to Tron. Tron's word tonight contradicted it → PO asked Tron directly → **TRON RULED: BOTH — mint the Folder scenario-unit AND create the actual filesystem directory, so the model and the filesystem stay in step.** That is the new definition. **★ WORK ITEM (this task): correct the now-WRONG `FolderService.ts:2` comment + its false Tron-attribution, recording that the definition changed by Tron ruling 2026-09-01.** (A stale comment carrying a false attribution already misled the team once tonight — the tester hit it and correctly stopped rather than guess. This is the same stale-attribution hazard as boot-currency: fix it in the code, don't leave it to mislead the next person.)

---

## PART 2 (A) — "Add folder": mint the unit **AND** mkdir a real dir + live-MVC (no reload) + WS fan-out to a 2nd browser

Tron ruling 2026-09-01 = **BOTH** (unit + real directory, kept in step). **FOUR checkable assertions** (was three): (1) the Folder **unit** exists; (2) a real **directory** exists on disk; (3) browser-1 **live-MVC inserts** the node with **no reload**; (4) a **2nd browser** updates over websocket.

### Piece 1 — WS fan-out (CONFIRMED absent at source by tester; I confirm against code)
`POST /api/model/folder/create` (server.ts:2743) calls `FolderService.mintRealUnit` and returns the unit, but **does NOT call `publishUnitChanged`** — whereas the pin route and the verdict route DO. So no `unit-changed` frame is broadcast → a 2nd browser cannot live-update. **CONFIRMED, not refuted.** Fix: after a successful persist, call **`publishUnitChanged(parentIor, parentUuid)`** — ride the EXISTING R37.11 `wsClients` transport (server.ts:189), the SAME channel pin/verdict use. **No second channel** (PO's explicit constraint). A new child is a STRUCTURAL change to the PARENT, so emit on the PARENT ref.

### Piece 2 — browser-1 live-INSERT, not a full refetch (the exact client shape the PO asked for)
Today browser-1 updates via a client `await load()` = a full data refetch (tester's finding). Make the model view **subscribe + live-insert** instead:
- **Frame the client receives** (ride the same `{type:'unit-changed', ior, uuid}` frame — no new frame type): emit it **on the PARENT** → `ior = parentIor`, `uuid = parentUuid`. `live-bridge.ts` maps it → `ViewBus.notify('<parentType>:<parentUuid>')`. The **parent folder node is already a subscriber** (that's how live-MVC works for every unit), so it re-derives its **DIRECT children only** (one-level, the existing children endpoint) and reconciles the new node in — **scoped, NOT whole-tree**. This is parity with pin/verdict (they emit `unit-changed` on the changed unit and its subscriber re-derives that view; here the "changed view" is the parent's child-list).
- **Payload sufficiency:** the acting tab already has the new unit (the POST returns it → "itemview BECOMES the returned unit", one-step, no fetch). The OTHER browsers get the parent-emit and do the one-level child re-derive. If a later true zero-fetch insert is wanted, carry `{node:{uuid,type,name,hasChildren,parentUuid}}` on the SAME frame and insert directly — but that is an enhancement; the 4 assertions pass with the parent-emit + one-level re-derive, and it stays on the one channel.

### Piece 3 — the mkdir (now deliberate in-scope; both-direction atomicity)
`FolderService.createPhysicalWithUnit(storeDir, name, parent)` (supersede-with-record the unit-only `mintRealUnit`; correct the stale `FolderService.ts:2` comment per FLAG-2):
- Resolve the parent's REAL on-disk path from the parent Folder unit's `location`/`dir:` identity. Confine under the allowed model/project root; **reject traversal** (`..`, absolute, escapes root).
- Validate `name`: non-empty, no `/`, no `..`, length ≤ 80, else `{ok:false, error:'invalid-name'}` — **no mkdir, no mint**.
- **Order + atomicity (a half-created folder is worse than a failed one — fail cleanly, leave nothing behind, BOTH directions):**
  1. If the target dir **already exists** → `{ok:false, error:'exists'}`, mint nothing (fail-closed, idempotent-safe).
  2. `fs.mkdirSync(realPath, {recursive:false})`.
  3. Mint+persist the Folder unit, **uuid = `keyToUuid('folder::'+relpath)`** (the SAME identity `ensureViewUnit('dir:'+relpath)` mints ⇒ one folder model, no dup — ties R40.16 + Part 5).
  4. **If the mint/persist throws → `fs.rmdirSync(realPath)`** (remove the dir we just made) and return `{ok:false}`. If the rmdir itself fails, log LOUD + return `{ok:false, error:'half-created'}` naming the orphan (never silently leave it).
  - Net: unit-and-dir both appear, or neither does. Model and filesystem stay in step (Tron's requirement).
- **Room virtual collections (part 1):** Members/Files have NO disk dir → they stay **unit-only** (the virtual-parent branch); mkdir applies only where the parent has a real physical location. (Confirm with PO if Tron wants a dir even for room virtuals — the spec says room collections are "virtual, no physical dir".)

**★ CHOKEPOINT (expert HOLDS for my backstop):** prod **filesystem mutation** (mkdir/rmdir) + store write. Confine root, reject traversal, fail-closed on exists/invalid, write-or-nothing BOTH directions. Do not route the mint through an auto-reuse path. Hold for my backstop before it runs on the served tree. Gate isolated (R40.31, scratch root, cleanup-on-failure, stub-must-fail: invalid-name and exists must each return ok:false with NO dir and NO unit left behind).

## PART B — puml VIRTUAL collection + REAL physical-folder tree beneath (no dup folder model, R40.16)

**Measured current state:** the `puml` collection lists `.puml` as flat `puml-src:<sprint>/diagrams/<file>` nodes (server.ts:1585) → `PumlArtifact` units via `ensureViewUnit`. Physical folders ALREADY have a model: `ensureViewUnit('dir:<relpath>')` → `ior:class:Folder`, uuid `keyToUuid('folder::'+relpath)` (the ONE folder model, MODEL_STORE — R40.16 "folders as real scenario-units, type-driven"). The duplicated names (`class-diagram.puml` ×4, `use-cases.puml` ×2) exist because the flat collection hides each file's physical parent dir.

**Design — two VIEWS over the SAME units, never a second folder model:**
- **KEEP** the virtual `puml` collection (the flat by-artifact list Tron already sees).
- **ADD beneath it** a `pumlPhysicalTree()` server helper: from the same `.puml` file set, compute each file's REAL on-disk parent dir (relpath); take the **distinct** dirs; build a nested tree of **`dir:<relpath>` nodes**; under each, list its actual `.puml` as `puml-src:<relpath>/<file>` leaves.
- **The crux (no dup folder model = R40.16):** every physical-folder node is a **`dir:<relpath>` ref that resolves to the EXISTING folder identity** `keyToUuid('folder::'+relpath)` via `ensureViewUnit` — **reuse, not a parallel Folder structure**. Virtual and physical coexist because they are two GROUPINGS of the same underlying units: virtual = by-artifact (flat `puml-src`), physical = by-location (`dir:` tree). Same `PumlArtifact` leaf units, same one `Folder` model.
- **This is exactly Tron's point:** `class-diagram.puml` ×4 now each appear under their DIFFERENT `dir:` node → disambiguated by real path; the repetition becomes meaningful.

**Concrete shape for expert:** add `pumlPhysicalTree()` next to the puml-collection builder (server.ts ~1585); emit its root as a child section of the puml node (e.g. a `dir:`-rooted subtree, or a labelled "physical folders" node whose children are the distinct dir: roots). Node uuids = `keyToUuid('folder::'+relpath)` — assert 0 newly-minted Folder models beyond the `ensureViewUnit` dir: identities (a count gate: distinct dir: nodes == distinct physical dirs, and each already resolves through ensureViewUnit).

## Parts 1 / 3 / 4 (not the hard two — noted for owners)
- **Part 1 (Members/Files ARE folders, virtual):** same folder-model reuse — the room pseudo-collections become real `Folder` units (virtual: no disk dir → unit-only, the Part-A "virtual parent" branch). **DEPENDENCY:** the shots show these File units currently fail to resolve ("File unit not found" / name=uuid) — that's the `file:<uuid>` regression (RoomView.ts:393/401). Part 1's rendering is blocked until that caller-fix lands. Flag to PO whether it's in-scope here.
- **Part 3 (kill redundant Scenario/Edit links in detail body):** remove the `scenarioBrowserLinkFromIor(uuid)` call from the detail body (detail-children.ts:74) — the action bar already provides them (R34.7, Tron-verified v0.8.153). Do NOT touch the action-bar buttons. Trivial; expert or me.
- **Part 4 (sunburst missing from detail):** the task's required sunburst isn't rendered — add it to the detail view. Needs its own render spec (separate small design); flag if it's mine.

## Handoff
- **req:** mint requirements for A (physical-mkdir + live-MVC + WS-fanout, 3 assertions) + B (physical-folder-tree-reuses-dir:-model, no-dup gate) + 1/3/4; scenario-first before build.
- **expert:** build A (`FolderService.createPhysicalWithUnit` + `publishUnitChanged(parent)` on the create endpoint) + B (`pumlPhysicalTree()`), HOLD on the Part-A chokepoint (prod fs-mutation) for my backstop.
- **me:** backstop A (mkdir confined/fail-closed/atomic + 2nd-browser re-derive) + B (0 new folder models, dir: identity reuse) @390; verify the 3 Part-A assertions on real devices.
