# OOP Task-Correction Table — 3-agent collaboration (planner + req + skill-expert)

**Tron order (verbatim):** "let the planner, req, and skill agent work together to find the corresponding existing tasks and correct them to radical oop and reflect them as current and next tasks with oop change requests"

**PO coordinates + owns the Tron conversation.** ONE shared table — each agent fills its column, nobody forks, nobody interrupts, report to PO only.

## Lanes
- **planner (0.6):** locate the EXISTING tasks; fill **EXISTING TASK**, **current/next**, **chain status**.
- **req (0.4 — me):** the **OOP CHANGE REQUEST** column — re-express each functional AC as an OWNERSHIP AC at the requirement/AC level. **CHECK-BEFORE-CREATE: correct the EXISTING requirement, never mint a parallel one (a duplicate is the DRY defect).**
- **skill-expert (0.2):** the skill/OOP-pattern correctness of each change request (ask-the-object, MimeType-class-first, interface conformance).

## Transformation rubric (req lane — functional AC → ownership AC)
| functional smell (as-written) | → ownership AC (radical-OOP) |
|---|---|
| "a helper/service/resolver does X on a type" | "the CLASS that owns X does it; callers ASK the object (obj.X()); 0 implementations of X outside the owner (lint RED on a free X)" |
| "the handler re-renders / re-derives" | "the OBJECT owns its state + emits on change; views subscribe; no caller re-derives" |
| "function parses/converts <type>" | "<Type>.fromUnit/toUnit owns it (UnitConvertible); a free parser => RED" |
| "duplicate logic in surface A and B" | "one owner; A and B ASK it; duplicate collapses INTO the class (traceability query proves ONE)" |
| every AC | **must be FAILABLE** (gateRef + stubMustFail, R40.54) — a wish is not an AC |

## Consolidated OOP/REST set already minted (folds into THIS pass — the req anchors tasks map onto)
These are the OOP-correct requirements; the planner maps located functional tasks onto them (correct-existing, not parallel-mint).

| Req | uuid | OOP law it enforces | prio |
|---|---|---|---|
| R40.96 | d7deea49 | REST transport IS the unit JSON — idempotent PUT-by-uuid, no multipart internal | PRIO-1 |
| R40.97 | 4d6e701b | NativeFileIngress = the ONE edge owning native multipart + content-type parse (outage fix permanent-by-construction) | PRIO-1 |
| R40.98 | 97ce5ac6 | binary-in-unit — base64 wire, sha256 dedup; class owns toUnit/fromUnit | PRIO-3 |
| R40.99 | 92a5d0d4 | natural classes implement UnitConvertible {isBinary/load/toUnit/fromUnit}; reuse WebItem/Email, reconcile VCard→Contact, mint Image/CalendarEntry | PRIO-3 |
| R40.100 | 3b205cfb | self-heal BY CONSTRUCTION (emergent; 419 handshake retired) | PRIO-1 |
| R40.101 | 6dcdcdf6 | #126 backfill — iOS upload boundary; re-point to shipped v0.8.190 | PRIO-1-TOP |
| R40.81 | be8ec6b6 | ONE physical store (existing; covers convergence) | PRIO-1 |
| R40.82 | eb7b086d | Folder owns its children (existing OOP slice) | PRIO-2 |

## THE TABLE (planner seeds rows from located tasks; req fills OOP CHANGE REQUEST; skill-expert reviews)

| EXISTING TASK (planner) | functional-as-written | OOP CHANGE REQUEST — requirement/AC level (req) | current/next (planner) | chain status (planner) | corrects existing req (req, check-before-create) |
|---|---|---|---|---|---|
| _(planner: add located tasks)_ | | | | | |

---

## Skill-expert FINDING — chain-scoreboard status + SHELL defects (PO lane: found-existing + chain-status)

Measured via the REAL chain scorer (`Chain.buildStrictImplSet`, tsx-free esbuild harness, det). Mapped the architect class-model collapse-targets (`design-radical-oop-class-model.md`, per slice) to EXISTING scenario units. **CHAIN-SCOREBOARD status is a DIFFERENT board from the planner's task-FSM** (the distinction PO drew re R40.84 — task-board can be honest while the chain-scoreboard reads a false green, and vice-versa). Planner owns task-FSM current/next; this is the traceability/chain view.

**★ SHELL = the chain reads COMPLETE (credited-green) but the impl lives in a VIEW / server free-fn / service — NOTHING owns the invariant. A SHELL is a DEFECT, not a green** (exactly the void that produced R40.84: nobody owned "I gained a child, render me"). These are the dangerous rows — a green scoreboard hides an unowned invariant.

| Slice | behaviour (collapse-target) | existing unit | sourceFile (where behaviour lives now) | chain-scoreboard | SHELL? | → owner (class model) | found existing task/req |
|---|---|---|---|---|---|---|---|
| S1 | reDeriveDirectChildren | Impl 8693dc2b | rb-trace-tree.ts (VIEW) | **credited** | ★ **SHELL** | `Node.renderChildren()` | R40.84 (just closed — green BUT a shell) |
| S1 | buildSeedNode | Impl 5b3d9f1a | rb-trace-tree.ts (VIEW) | **credited** | ★ **SHELL** | `Node` construction | — |
| S1 | renderSeed | Impl ee897257 | rb-trace-tree.ts (VIEW) | open | (behaviour-outside, chain incomplete) | delete → each Node renders own | — |
| S1 | fetchAndRenderChildren | Impl 5d4ba96f | rb-trace-tree.ts (VIEW) | open | — | `Node.renderChildren()` | — |
| S2 | folderChildrenUnder | Impl 973481f2 | server.ts (FREE-FN) | **credited** | ★ **SHELL** | `Folder.children()` | — |
| S2 | FolderService.mintRealUnit | Impl 0e6761c2 | server/FolderService.ts (SERVICE) | **credited** | ★ **SHELL** | `Folder.createChild()` | Task 40.93 (311df491) · Req e0c95904 |
| S2 | FolderService.createPhysicalFolder | Impl a1988163 | server/FolderService.ts | open | — | `Folder.createChild()` | Task 40.93 (311df491) |
| S2 | ModelView.addFolder | Impl 2f65a342 | model.ts (VIEW) | open | — | `Folder.createChild()` | UC addFolder.routeByParentPhysicality (abac573a) |
| S3 | roomFilesChildren | Impl 87f83fdf | server.ts (FREE-FN) | open | — | `Room.files()` | — |
| S4 | createFileUnit | (TestCase 6c390367 only; no Impl unit) | src/ts/scenario/file-unit.ts | no-impl-unit | — | `File.create()` | — |
| S5 | server.isModelUnit | Impl 010f3e23 | server.ts (FREE-FN) | **credited** | ★ **SHELL** | `Unit.resolve()` (store-fork) | Task 35.2 (7b3c6a57) · Req 23e77b77 |
| S5 | server.ensureViewUnit | Impl a09b474d | server.ts (FREE-FN) | **credited** | ★ **SHELL** | `Unit.resolve()` | UC modelTree.ensureViewUnit (c3902503) |
| S5 | server.mofChildren | Impl b6c88d83 | server.ts (FREE-FN) | open | — | `Node.children()`/`Unit.children()` | UC model.mofChildren (8bdeda90) |
| S5 | server.pumlChildren | Impl 9eb2c39c | server.ts (FREE-FN) | open | — | `Unit.children()` | UC diagram.pumlChildren (c1a629e4) |

**Headline: 6 credited-green SHELLS** (8693dc2b, 5b3d9f1a, 973481f2, 0e6761c2, 010f3e23, a09b474d) — the scoreboard says COMPLETE, but the behaviour lives in a view/server free-fn/service and no domain class owns it. Correcting these to radical-OOP does NOT change the chain-scoreboard number (they already read green) — which is precisely why they're dangerous: **the metric will not tell you they're wrong; only "does a domain class own it?" will.** Recommend the OOP change requests treat a credited SHELL as an OPEN ownership defect.

*Skill-expert (0.2) contribution 2026-09-06 — chain-scoreboard finding + SHELL flags. Coordinated through the artifact, no fork. Report to PO only.*

---

*Seeded by robbin-req 2026-09-06 (first-mover, shared artifact — do NOT fork). Requirement column + rubric are the req contribution; planner populates task rows, skill-expert reviews OOP correctness. Report to PO only.*
