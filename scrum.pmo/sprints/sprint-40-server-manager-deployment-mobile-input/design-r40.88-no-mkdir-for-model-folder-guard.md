# R40.88 — the ruling-guard: `check:no-mkdir-for-a-model-folder` (architect design, 2026-09-05)

req handed me the guard-CODE lane (trainer + req converged: R40.88 is the ONE home, no fork; PO one-mechanism). **Design-only.** Expert implements the check; tester gates it + the self-stub GREEN; trainer canonizes; req flips R40.88 off UNVERIFIED + mints the Test off the marker on tester-GREEN. **No rush ahead of the R40.85→R40.87 build.**

## What it guards (the ruling, R40.87)
A `Folder` is a MODEL object, not inherently a directory. The MODEL add-folder endpoint (`ModelView.addFolder`) must ROUTE by parent physicality: real-dir parent → `createPhysicalWithUnit` (physical `mkdir`); virtual/model parent (a collection like `diagrams`) → `mintRealUnit` (store-only, NO physical dir). The **HAZARD** is a physical directory creation reached for a MODEL folder.

## Doctrine: scan the HAZARD, not the actors (lift R40.82 `check-children-single-owner`, 9ef91a551)
The forbidden OPERATION names itself → no 2nd shape-matcher; apply the **structuralDiscover PRINCIPLE** (glob every source file so a new/renamed site cannot hide by being unlisted — the same principle as R40.54 AcGuard; there is no literal `structuralDiscover` symbol, each lint realises it). ONE NUMBER proves unevadability AND completeness: **non-gated physical-folder-creations == 0, reached BY ROUTING**.

## The hazard, made precise + self-naming
Physical user-folder creation happens ONLY inside the ONE owner `FolderService.createPhysicalFolder` (the sole `mkdirSync(target)` of a user directory). Two operations must NOT be confused:
- **HAZARD** = a NON-recursive `mkdirSync(<userTarget>)` that creates a user folder, OR a call to `createPhysicalWithUnit`/`createPhysicalFolder`, that is NOT reached through the physicality-gated router branch.
- **NOT the hazard** = the store-shard `mkdirSync(path.dirname(f), { recursive: true })` that lays out the unit-JSON file (comments already say *"shard dir for the unit FILE (store layout), not a user folder"*). Distinguished structurally by `{ recursive: true }` on a shard path → excluded by the matcher, never by a per-site exempt.

**Routing proof (the marker, like `children-owner`):** the ONE router branch in `ModelView.addFolder` that calls the physical path carries a `physicality-gated` marker AND sits immediately downstream of the `resolveFolderRefToDir(parent)` discriminator (real-dir → physical; `''` → `mintRealUnit`). The physical-create owner (`createPhysicalFolder`) carries a `physical-folder-owner` marker. Any physical-create call-site NOT reached through the `physicality-gated` branch = RED.

## The check (glob-discovery + hazard-regex, R40.82 shape)
```
HAZARD_MKDIR   = /\bmkdirSync\s*\(/                 // physical dir creation
SHARD_EXCLUDE  = /recursive:\s*true/                // store-shard layout (unit JSON) — NOT a user folder
PHYS_CALL      = /\b(createPhysicalWithUnit|createPhysicalFolder)\s*\(/  // the physical-create path
GATE_MARK      = /physicality-gated/                // the ONE router branch (downstream of resolveFolderRefToDir)
OWNER_MARK     = /physical-folder-owner/            // the ONE mkdir owner (createPhysicalFolder)
DISCRIMINATOR  = /resolveFolderRefToDir\s*\(/       // must be the upstream gate of every PHYS_CALL
```
Walk `src/ts` (glob, dist excluded). Count:
1. `mkdirSync` of a user target NOT `recursive:true` and NOT inside `physical-folder-owner` → **nonOwnerMkdir**.
2. `PHYS_CALL` call-site NOT within the `physicality-gated` branch (no `resolveFolderRefToDir` discriminator in scope) → **ungatedPhysCall**.
`nonOwnerMkdir + ungatedPhysCall == 0` by ROUTING (never by exempting) → GREEN; else RED, listing each site.

## Guard-on-the-guard (carry R40.82's hard-won rules)
- **0 by ROUTING, never by exempting.** No in-file exempt marker; exemptions live ONLY in an architect-maintained EXEMPT list (reason + approvedBy), reported as a SEPARATE number, never folded into 0.
- **Object-not-module**: the physical-create owner is a Folder/FolderService responsibility invoked through the router, not a free helper any surface can call unrouted.
- **Sole owner**: `physical-folder-owner` appears in exactly ONE file/method; two = RED.

## Failability (stub-must-fail — the guard MUST be provable-able-to-fail)
- **Self-stub (tester GREEN gate):** add a scratch `mkdirSync('/tmp/x')` folder-create outside the owner, or a `createPhysicalWithUnit(...)` call with no `resolveFolderRefToDir` upstream → the check goes RED. Remove → GREEN. (Mirrors R40.82's proven 9→0.)
- **Pre-fix expectation:** run against TODAY's tree (before R40.87 lands) — `ModelView.addFolder` calls the physical path unconditionally (no physicality branch) → the guard is **RED now** (ungatedPhysCall ≥ 1), which is the correct proven-red baseline. It flips GREEN exactly when R40.87's branch ships. That RED-until-fixed is the guard doing its job, not a false alarm.

## Handoff / sequence
Expert (after R40.85→R40.87 build): implement `scripts/check-no-mkdir-for-a-model-folder.ts` (R40.82 shape) + add `check:no-mkdir-for-a-model-folder` to `ci:gates`. Tester gates it + self-stub GREEN. Trainer canonizes. req flips R40.88 off UNVERIFIED + mints the Test off the guard marker. Traceability: the guard is the Impl of R40.88's UC (guardDesign.lanes / trainerConvergence on-unit); I wire UC→Method→Impl when the check lands, marker-sanctioned + filename-independent (like `children-owner`). **No chokepoint touched.**
