# ROOT: 6 named File units render UUID not name (robbin-architect, 2026-09-13, MEASURED)

Defect (tester, pixel, served v0.8.236, room 909f1bd6, SystemTester-only, gate 9dd6767ab): 6 File instances that HAVE model.name render their UUID instead. Discriminator: type=image (IMG_5437.png) renders its name correctly → File.renderSelf-path-specific.

## ROOT = (a) name not reaching File.renderSelf's input — NOT (b) snapshot-drops-name. MEASURED, both directions checked.
The 6 units (disk): `8a11f62d mv-1711524-1.bin · ced85458 mv-1711524-2.bin · 9922c93f mv-1711524-3.bin · 0a74859d mv-1713607-1.bin · a87ed2a3 mv-1713607-2.bin · 2411df76 mv-1713607-3.bin` — ALL have `model.name` = the real name, `model.displayName` = **undefined**.

- **(b) FALSE — snapshot does NOT drop name:** `roomFilesChildren` (server.ts:1673 root / :1691 nested) emits `name: String(x.m.displayName || x.m.name || uuid-slice)`. With displayName=undefined and name present → node.name = the real name. The snapshot CARRIES the name. (My first hypothesis — displayName-first override with a stored displayName=uuid — was WRONG: displayName is undefined, measured.)
- **File.displayName correct** (file.ts:58-59): `model.name || uuid`. Not the bug.
- **So the break is DOWNSTREAM of the snapshot:** rb-object-item (L239) does `new File({ uuid, name: this.getAttribute('name') || '' }).renderSelf()` → shows uuid ONLY when `getAttribute('name')===''`. So the element's `name` attribute is EMPTY for these 6. The server snapshot has the name; the client element does not receive it. = (a) not-plumbed, specifically snapshot-node.name → client `name` attribute is lost for these units.
- **Specific to these 6 = MOVED units ("mv-" prefix):** 74 OTHER File instances render their name via the SAME File.renderSelf path → NOT a general File-path bug. The moved units take a plumbing branch (client render / a snapshot branch) that does not set the `name` attribute from node.name. [CLIENT LOCUS being pinned — see below.]

## GATE CONSTRAINT for the fix (PO, both directions — AC4 "never empty" passed while WRONG because a wrong answer is non-empty)
The new gate MUST assert: (1) the rendered label === model.name WHEN a name exists; (2) the uuid-fallback fires ONLY on genuine absence of name. A one-directional "never empty" cannot catch a fallback firing wrongly.

## CLIENT LOCUS PINNED + FIX SPEC (measured)
The caller feeds File.renderSelf a NARROWER name source than every other type — a name-vs-title asymmetry:
- IMAGE/other path (rb-object-item.ts:228): `rawName = getAttribute('name') || getAttribute('title') || '(untitled)'` — resolves name OR title.
- FILE path (rb-object-item.ts:239): `new File({ uuid, name: this.getAttribute('name') || '' })` — reads ONLY `name`, NOT title.
- The client/tree delivers the display name via `title` for many nodes (rb-trace-tree.ts:255 `title: child.name`; RoomView picker :419 `title: t.name`; a conditional title→name copy at rb-trace-tree.ts:510 runs for some nodes but MISSES these 6). So a File node whose name arrived via `title` (no name-copy) → `getAttribute('name')===''` → File.renderSelf → `displayName()` → uuid. Image survives on title alone; File does NOT → File-render-path-specific, exactly the discriminator.

### FIX (caller resolves name consistently; File class + displayName UNCHANGED — the caller/adapter does DOM resolution, File takes the model = MVC-clean):
`rb-object-item.ts:239` → `new File({ uuid, name: this.getAttribute('name') || this.getAttribute('title') || '' }).renderSelf()` — feed File the SAME resolved name the image path uses (name||title). Then a name-via-title File renders its name; the uuid-fallback (File.displayName) fires ONLY when BOTH name and title are genuinely absent. NOT a mask: it makes File's name-resolution match the system convention (name||title) that File uniquely broke. file.ts UNTOUCHED (Tron). No server/snapshot change (snapshot already carries the name).

### GATE (both directions — PO):
- Seed the 6 (or a fresh moved File with model.name + title-delivered): assert rendered label === model.name (NOT the uuid). 
- Assert uuid-fallback fires ONLY on genuine absence: a File with neither name nor title → uuid (the only uuid case).
- stub-must-fail: revert the :239 fix (name-only) → the moved/title-fed File renders uuid → RED. (The old AC4 'never empty' passed while wrong — this gate is directional: label===name when name exists.)

## FIX-COMPLETENESS VERIFICATION (banked pre-HALT; the one-line fix is a HALF-fix)
CHECK 1 — did the file-branch (:239) drop ONLY the title fallback vs old rawName (:228 name||title||'(untitled)')?
- Dropped: the title fallback (the root). ALSO the final fallback changed '(untitled)'→uuid (via File.displayName) — INTENDED per the File-owns-its-fallback design (uuid never-blank), acceptable, not a defect.
- Ordering: same (name||title). Escaping: BOTH branches funnel to :252 `esc(name)` → preserved. → the ONLY functional drop = the title fallback.
CHECK 2 — other branches reading getAttribute('name') WITHOUT ||title (would hit the same defect):
- ★ rb-object-item.ts:173 — the DRAG federated-ref builder: `buildFederatedRef({ …, name: this.getAttribute('name') … })` reads name WITHOUT ||title. A moved File (name in title) DRAGGED cross-origin → fed-ref carries an EMPTY name = the SAME defect on the drag path. **The one-line :239 fix is a HALF-fix; :173 must ALSO read name||title.**
- Other `new File(...)` (RoomView:333/360, rb-avatar:200) = the BROWSER-native File constructor (uploads), NOT our class → unrelated, not the defect.
- Folder path: our Folder class isn't built (T41.2 blocked); when built its branch MUST read name||title (do not repeat the name-only pattern) — flagged for T41.2.
### COMPLETE FIX = rb-object-item :239 (render) AND :173 (drag fed-ref) both read `getAttribute('name') || getAttribute('title')`. Gate must cover BOTH render AND drag-fed-ref of a moved File. file.ts/snapshot/file-unit.ts UNCHANGED.
