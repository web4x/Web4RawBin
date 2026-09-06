<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.40: CalendarEntry is a natural CLASS — dropping a calendar entry RESOLVES to a CalendarEntry unit that is instantiated and renders ITSELF (no mime/format switch) [R40.99, under T37.20]

[task:uuid:257ab50f-a1fc-4920-a5c6-b523230355c9]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [ ] Done

## Remaining Issues

-> QA-Review (PO ruling 2026-09-06, DIRECTLY-GATED not inferred): tester MEASURED .ics-drop -> CalendarEntry class, class-correct AND rendering as itself (4/4 class-DISTINCT, mutual-distinctness GREEN), live prod v0.8.204, gates d2f95670a. Shipped via MimeType.from Factory (v0.8.203) + per-class render registry (v0.8.204). Awaiting Tron accept (0 Done till Tron). Covers R40.99 + UC f4b10768, under T37.20.

## Task Description

Natural-class implementation UNDER Task 37.20 (the DnD drop contract). TRON FRAMING (do NOT re-frame): there are NO 'shapes'. A drop RESOLVES to a scenario UNIT of a CLASS; the class is INSTANTIATED; the OBJECT owns its own model+view+controller and stores and renders ITSELF. A handler switching on a mime/format string IS the defect. Layered: DndContract -> MultipartMime -> MimeType.from -> CalendarEntry class. CalendarEntry implements UnitConvertible {isBinary/load/toUnit/fromUnit}. OWNER = EXPERT (build-go released by PO). MINTED (no prior CalendarEntry natural-class task — check-before-create).

## Context

Covers R40.99 92a5d0d4 (natural domain classes implement UnitConvertible), UC f4b10768. Implementation UNDER Task 37.20 ae01f065. parent S37 b86b53cc.

## Intention

Dropping a calendar entry (.ics) instantiates a CalendarEntry object that owns its model+view+controller and renders itself; nothing switches on a content-type string.

## Acceptance Criteria

- [ ] **(radical-oop/dispatch)** CalendarEntry implements UnitConvertible {isBinary/load/toUnit/fromUnit}; MimeType.from resolves a calendar-entry drop (.ics/text-calendar) to the CalendarEntry class; NO content-type string-switch outside MimeType.
- [ ] **(radical-oop/mvc)** A dropped calendar entry RESOLVES to a CalendarEntry scenario unit that is INSTANTIATED; the CalendarEntry object owns model+view+controller and RENDERS ITSELF (detail + date fields) — not bytes-stored, not a handler branch.
- [ ] **(radical-oop/dod)** DEFINITION OF DONE: the right CLASS (CalendarEntry) is instantiated AND rendering itself; a mime/format switch handling calendar-entrys = RED (the defect).

## Subtasks

None (atomic natural-class task).
