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
