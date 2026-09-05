# R40.93 — extract the mkdir-only owner primitive (architect RULING, 2026-09-05)

PO fast-ruling on the fork the expert correctly flagged (R40.85 trap avoided — it measured + flagged instead of guessing). **RULE: extract-mkdir-only-op.** Design-only; expert builds on this ruling. Guard follow-ups are MINE (on ship).

## The fork (measured)
`FolderService.createPhysicalFolder` (FolderService.ts:121) does **two** things: (1) `mkdirSync(target)` + (2) mints its OWN **Folder unit** (`keyToUuid('folder::'+location)`), both-or-neither. The room route at server.ts:2565 does `mkdirSync(target)` + mints via **`createFileUnit`** (folder-is-a-file, the R40.84/A5 items-tree — `room.addFileUnit`, parent.children update, FILE_ADDED broadcast). **Routing :2565 through createPhysicalFolder DOUBLE-MINTS** (a Folder unit AND the createFileUnit item) or breaks the items-tree we just fixed.

## Ruling: the single owner is the MKDIR PRIMITIVE, not the folder-create-with-mint
The duplicated thing — and the exact hazard the R40.88 guard scans — is the **raw user-directory mkdir**, NOT the unit-minting. So extract it: `createPhysicalDir` = the SOLE raw-mkdir primitive; both callers route through it and keep their OWN unit-minting (model → Folder unit; room → createFileUnit). This satisfies R40.93's key AC honestly: **green-by-ROUTING-not-listing** — the raw folder mkdir at :2565 is genuinely GONE (a call to the owner), not excused by an INFRA_ALLOW entry.

### Exact shape (expert builds)
```ts
// [physical-folder-owner] the SOLE raw user-directory mkdir primitive — mkdir ONLY, NO unit mint. Both physical-folder
// callers (model createPhysicalFolder + room /add-folder) route through HERE; unit-minting stays each caller's concern
// (model → Folder unit; room → createFileUnit items-tree). A raw user-dir mkdir anywhere else = RED.
static createPhysicalDir(parentAbsPath: string, name: string): { ok: boolean; absPath?: string; error?: string } {
  const target = path.join(parentAbsPath, name);
  try { fsSync.mkdirSync(target); }                                   // non-recursive: missing parent OR existing dir throws
  catch (e) { return { ok: false, error: `mkdir-failed: ${(e as Error)?.message || e}` }; }
  return { ok: true, absPath: target };
}
```
- **`createPhysicalFolder`** → call `createPhysicalDir(opts.parentAbsPath, opts.name)`; on `!ok` return its error; else mint the Folder unit exactly as today; on mint failure `rmdirSync(dir.absPath!)` (both-or-neither, unchanged semantics). Net behaviour identical — just the mkdir moves behind the primitive.
- **server.ts:2565 room route** → keep `mkdirSync(filesBase, {recursive:true})` (the Files-CONTAINER infra dir — not a user folder); REPLACE `mkdirSync(target)` with `const dir = FolderService.createPhysicalDir(path.join(filesBase, nrel), cleanName); if (!dir.ok) { …error… }`. Keep the EXISTING `createFileUnit` mint (items-tree) + `rmdirSync(dir.absPath)` on mint failure. **No Folder-unit mint here → no double-mint; R40.84/A5 items-tree untouched.**

## Guard follow-ups (MINE, on ship — R40.93 backstop)
When the extraction lands I update `scripts/check-no-mkdir-for-a-model-folder.ts`:
1. Move the `[physical-folder-owner]` marker to `createPhysicalDir` (the mkdir primitive is now the sole owner; sole-owner-count stays 1).
2. `PHYS_CALL` regex += `createPhysicalDir` so its CALL-sites are architect-gated (a rogue `createPhysicalDir(userModelFolder)` = RED unless GATE-listed).
3. GATE-list the two legit `createPhysicalDir` call-sites (createPhysicalFolder's + :2565's) — physicality-gated / room-physical-by-construction.
4. **Remove the conflated :2565 INFRA_ALLOW entry** — the folder-create is now a GATE-listed `createPhysicalDir` call (green-by-ROUTING). The `mkdirSync(filesBase,{recursive:true})` Files-container stays honest infra (its own clean entry, same class as RoomFilesService.ts:40) — no longer masking a hidden folder mkdir. Re-run: guard GREEN, self-bite GREEN.

## ACs (R40.93, all failable)
- **no double-mint:** the room route mints EXACTLY ONE unit (createFileUnit); assert no Folder unit minted for a :2565 add (R40.84/A5 items-tree byte-unchanged — stub: add a createPhysicalFolder call in the room path → a 2nd unit appears → RED).
- **raw folder mkdir GONE @ :2565:** grep — no `mkdirSync(<folderTarget>)` in the room route; it's a `createPhysicalDir` call.
- **green-by-routing-not-listing:** the :2565 folder-create INFRA_ALLOW entry is REMOVED; guard GREEN because the mkdir routes through the owner (stub: re-add a raw mkdir → guard RED, not silently allowed).
- **both-or-neither preserved** per caller (mint failure → rmdir the dir).

## Better-option check
Considered a `createPhysicalFolder(opts, {mintUnit:false})` flag instead of extraction — REJECTED: a boolean-controlled dual-behaviour method is the "one method does two things conditionally" smell; extraction gives single-responsibility (createPhysicalDir = mkdir; createPhysicalFolder = mkdir+Folder-mint) and makes the guard's sole-owner the exact primitive it scans. Extraction is the cleaner + more measurable shape.
