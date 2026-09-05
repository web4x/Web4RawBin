# Nested roomcoll folder — detail-resolve fix-shape ruling (architect, 2026-09-05)

Follow-on to the render fix (eea1fb136, shipped scratch ef35cf29b). Gate found: nesting RENDERS correctly (inner folder at depth-3; sunburst/precondition/envelope invariants held) BUT selecting a NESTED folder opens a ZERO-verb drawer — can't add a folder inside a nested folder; nested-folder detail + sunburst don't render. Tester measured two ways: empty drawer at settle; `/api/ior/<nested roomcoll ref>` → unit NULL while `/api/trace/children/<same ref>` → 200. Rule the shape now; the FRESH expert builds after its diligent two-phase rewind. DRY, one mechanism, do not reintroduce the deleted duplicate.

## MEASURED
- **My delete EXPOSED this, didn't cause it.** Pre-fix, folder nodes carried real uuids → detail resolved → verb appeared. Post-fix they carry roomcoll LOCATION refs (`roomcoll:<room>:files/<path>`) → render correctly but don't resolve for detail.
- **Root — `resolveViewUnit` roomcoll branch, server.ts:1353-1369:** line 1358 `if (!roomUuid || (ck !== 'members' && ck !== 'files')) return null;`. A nested ref has `ck = 'files/Trash'` → not members/files → **return null** → empty drawer. For members/files it MINTS a synthetic virtual Folder unit (keyToUuid → MODEL_STORE) — correct for those, they are truly virtual collections with no persisted unit.
- **The nested folder IS a real persisted unit** (measured): Trash `3e041bff` `model.location="roomcoll:3231db71…:files/Trash"`; duplicates `3344ade1` `location="…:files/Trash/duplicates"`. **The tree node's ref === the real Folder unit's `model.location`.** So it's directly findable.
- **Children already DRY:** `roomFilesChildren` (1377) is the ONE shared derivation (lazy branch + Room-type handle both call it) — do not touch it. The asymmetry is only that CHILDREN understands `files/<nested>` while DETAIL does not.

## RULING — ONE ref serves both; `resolveViewUnit` learns the location form and returns the REAL unit
**Choice: one ref, not two. `resolveViewUnit` must understand the nested `files/<path>` location form and resolve it to the REAL persisted Folder unit (match `model.location == ref` among the room's `files[]`), NOT mint a synthetic.**

**Why ONE ref, not give folders a second (real-uuid) ref:**
- A node has ONE identity. The children view (`/api/trace/children`) and the detail view (`/api/ior`) of the same folder MUST resolve the SAME ref or they diverge — the exact LAW-9 duplicate-identity we just removed. The roomcoll location ref is already the node identity the children path uses (`roomFilesChildren` emits `uuid: loc`, 1389, and lazy expansion re-parses it). Detail must accept that same ref.
- Giving folders a real-uuid ref instead would SPLIT identity again: render/children key by location, detail by uuid. Worse, expanding a real-uuid folder routes to the GENERIC children branch (3124), which does not do location-nesting → we'd have to teach nesting a SECOND time = reintroduce the duplicate derivation just deleted. Rejected.

**Why resolve to the REAL unit, not a synthetic mint:**
- members/files are virtual (no persisted unit) → synthetic mint is right. A nested folder is a REAL Folder unit whose model IS its scenario unit (the CAPSTONE: the unit IS the model). Minting a synthetic view-dup = a second model for one folder (LAW-9) AND it would carry none of the real unit's verbs/children/detail. So the resolver returns the REAL unit → verbs (Folder type, member-gated) appear **with NO fallback**, detail + sunburst render from the real model/children.

**DRY — one location→unit derivation:** the "find the `files[]` Folder unit whose `model.location == ref`" match is the SAME location logic `roomFilesChildren` already embodies (it filters `folderLocs` by location). Extract a shared `roomFolderByLocation(rmodel, ref, idx)` (or inline the same one-line match) that BOTH the children derivation and `resolveViewUnit` use — one derivation of "which unit is at this roomcoll location," no copy.

## SHAPE (for the fresh expert)
In `resolveViewUnit` (1358): keep `members`/`files` → synthetic mint UNCHANGED. Add: if `ck.startsWith('files/')` → look up the room unit (roomUuid), find the `files[]` Folder unit with `model.location === ref`, and RETURN that real unit (its own uuid/name/kind/children). If no such unit → return null (genuine miss, fail-closed — not a synthetic). Do NOT touch `roomFilesChildren`, the Room-type Files handle, or Members.

## GATE (tester, full suite on the fix — verb must appear with NO fallback)
- `/api/ior/<nested roomcoll ref>` returns the REAL Folder unit (200, real name/type), not null; drawer shows the add-folder verb; nested-nested add works (create under the nested folder).
- Nested-folder detail + sunburst render (sunburst reads its children via trace-children, already 200).
- Render invariants still hold (nesting depth, precondition, envelope, sunburst) — no regression.
- stub-must-fail: a nested ref returning null / a zero-verb drawer stays RED. Team-verifiable @390 member-session (LAW-10), never Tron.

## HANDOFF
Ruling committed path-limited. Fresh expert (after its diligent two-phase rewind) builds the `files/<path>` arm of `resolveViewUnit` → real-unit-by-location, reusing the shared location match. I backstop: one ref both paths, real unit (no synthetic dup), `roomFilesChildren` untouched, verb-no-fallback, no re-introduced duplicate derivation.
