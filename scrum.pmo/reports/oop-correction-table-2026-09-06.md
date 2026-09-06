# Radical-OOP Correction Table — SHARED ARTIFACT (planner + req + skill-expert, PO coordinates)

**Tron order:** find the EXISTING tasks for the radical-OOP work, CORRECT them to radical OOP via **OOP CHANGE REQUESTS** (keep history, no rewrite), reflect as CURRENT/NEXT on the pin. **CHECK-BEFORE-CREATE:** existing task covers the behaviour → CORRECT it; genuinely nothing exists (verified absent) → only then mint. A duplicate task is the DRY defect under his law. **Measure first, propose after.**

**Contributions:** planner = the BOARD (find existing tasks, apply CRs, set current/next, priority order). req = the REQUIREMENT-level change requests. skill-expert = traceability/chain view + LOCATE corresponding tasks via scoreboard/chain. Coordinate THROUGH this artifact; commit as you go; PO reports to Tron.

**Correction shape (every row):** most existing tasks are written FUNCTIONALLY (free fn / helper / per-caller handler / resolver). The OOP-CR re-expresses each as **WHICH OBJECT OWNS THE BEHAVIOUR** + attaches the standing AC **transport-is-the-scenario** (scenario-unit JSON = model + only transport payload; no multipart/bespoke).

## CURRENT / NEXT slots (PO coordination call — the pin must show REAL work)

- **CURRENT (expert pulls now) — CORRECTED (PO 2026-09-06; tester caught R40.97 was a moving design REV2->REV3):** **R40.81 one-store (be8ec6b6) = TASK d864b05f (MINTED verified-absent, In-Progress).** Slice-1 Node already SHIPPED+GREEN @v0.8.187, so R40.81 = the OPEN half of Tron's prio-1. Unit.resolve owns the one store. Tester RED-baselines this now.
- **NEXT:** PRIO-2 remaining slices (Folder/Room/File/Unit as classes — object-owns-behaviour).
- **QUEUED BEHIND, BUILD-HELD (design still moving REV2->REV3):** transport R40.96 d7deea49 / R40.97 4d6e701b / R40.100 3b205cfb — do NOT put in the expert's CURRENT (builder stalls on a moving design).
- **CHAIN-DEBT (NOT a builder slot):** R40.101 #126 backfill iOS-upload-boundary (6dcdcdf6) — code LIVE + prod-confirmed (server.ts v0.8.190 7cc4717fb, gate r4090), chain MISSING; closed by req+architect chain-wiring; board QA-Review-chain-debt.
- **PRIO-3 = PO-RANKED (Tron may overrule — NOT an open Tron-question):** R40.98 binary-in-unit (97ce5ac6) · R40.99 natural-classes (92a5d0d4). Rank follows READINESS (natural-class/transport depend on a design still moving); the mimetype/transport-is-scenario law still binds EVERY task as a standing AC regardless of build rank.

## The table (SEEDED by planner — PROVISIONAL; req + skill-expert refine in place)

| REQ (split) | EXISTING TASK (candidate) | says now (FUNCTIONAL) | OOP CHANGE REQUEST (which object owns it) | current/next | chain / disposition |
|---|---|---|---|---|---|
| R40.97 NativeFileIngress 4d6e701b | ⚠TBD-skill-locate (upload/multipart handler; scan: none clean — candidate T40.93 311df491 room-folder-owner is adjacent) | content-type parse per-caller / inline in server.ts upload path | **NativeFileIngress OBJECT owns the single content-type-parse edge**; no per-caller parse | **CURRENT** | verify-owner-first; if no existing task → MINT (verified absent); else CORRECT |
| R40.81 one-store be8ec6b6 | EXISTING (req: reference, do-NOT-remint) | store convergence | Unit.resolve = the ONE store owner | **CURRENT** | reference only; confirm it has a covering task (else flag) |
| R40.96 REST-unit-JSON d7deea49 | ⚠candidate T37.20 ae01f065 "ONE shared DnD drop contract — buffer carries the scenario unit" | buffer/drop-contract as a shared helper | **the Unit owns its own transport form** (JSON = the wire); REST carries scenario-unit-JSON only | NEXT | CORRECT T37.20 if it is the same behaviour (req+skill confirm) |
| R40.100 self-heal-by-construction 3b205cfb | **T37.4 self-heal (model-object self-heal, STAYS)** + 419-handshake (Tron-KILLED, not a task) | 419 handshake = bolted-on FUNCTIONAL self-heal | **an object owning its state self-heals BY CONSTRUCTION**; RETIRE the functional 419 handshake; 37.4 stays distinct | NEXT | CORRECT (retire-handshake CR); 37.4 keeper |
| R40.101 backfill 6dcdcdf6 | (none — verified chain-less earlier) | n/a (backfill for a shipped fix) | transport-is-scenario applies to the permanent form (R40.97) | CHAIN-DEBT | code live+prod-confirmed, chain missing → covering task at QA-Review once req+architect wire chain |
| R40.98 binary-in-unit 97ce5ac6 | ⚠TBD-skill-locate | binary handled outside the unit (multipart/blob) | **the Unit owns its binary payload** (base64/embedded in the scenario JSON) | PRIO-3 inferred | verify-owner-first |
| R40.99 WebItem (7c486fcb) | **T25.2 7c526ba6 "Unified WebItem scenario unit"** (QA-Review) | per-format WebItem handling | WebItem class owns its own resolve/convert (UnitConvertible) | PRIO-3 inferred | CORRECT+reuse |
| R40.99 Email (3bb26ebe) | ⚠TBD-skill-locate (Email task) | functional email parse | Email class owns its resolve/convert | PRIO-3 inferred | CORRECT if exists, else MINT |
| R40.99 Contact (VCard→Contact bf440a63) | **T21.1 0c1b375e "vCard drop stores .vcf"** + others | VCard format-lens as a handler | Contact class owns identity; VCard = a format-LENS (stays), NOT a class-rename | PRIO-3 inferred | CORRECT; **ATTACH req's 47-ref BLAST RADIUS (format-lens STAYS vs class-identity RENAMES) — no rename without it** |
| R40.99 Image | (none expected) | — | Image class owns its resolve/convert | PRIO-3 inferred | MINT (verify absent first) |
| R40.99 CalendarEntry | (none expected) | — | CalendarEntry class owns its resolve/convert | PRIO-3 inferred | MINT (verify absent first) |

**⚠TBD cells = skill-expert LOCATE via scoreboard/chain + req confirm requirement-CR. Nobody mints a row marked CORRECT until verify-owner-first proves no existing task; nobody renames Contact without the blast-radius attached.**
