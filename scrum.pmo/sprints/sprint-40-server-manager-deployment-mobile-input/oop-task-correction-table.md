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

*Seeded by robbin-req 2026-09-06 (first-mover, shared artifact — do NOT fork). Requirement column + rubric are the req contribution; planner populates task rows, skill-expert reviews OOP correctness. Report to PO only.*
