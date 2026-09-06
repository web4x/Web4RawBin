<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.40: CalendarEntry is a natural CLASS — dropping a calendar entry RESOLVES to a CalendarEntry unit that is instantiated and renders ITSELF (no mime/format switch) [R40.99, under T37.20]

[task:uuid:257ab50f-a1fc-4920-a5c6-b523230355c9]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

STOOD UP Planned (2026-09-06) on PO durable-queue directive. OWNER=EXPERT, build-go released. Covers R40.99 natural-class UnitConvertible + UC f4b10768. Implementation UNDER T37.20 (in its subtasks). req 3-pt verifies + may add per-class ACs. 0 Done till Tron.

## Task Description

Natural-class implementation UNDER Task 37.20 (the DnD drop contract). TRON FRAMING (do NOT re-frame): there are NO 'shapes'. A drop RESOLVES to a scenario UNIT of a CLASS; the class is INSTANTIATED; the OBJECT owns its own model+view+controller and stores and renders ITSELF. A handler switching on a mime/format string IS the defect. Layered: DndContract -> MultipartMime -> MimeType.from -> CalendarEntry class. CalendarEntry implements UnitConvertible {isBinary/load/toUnit/fromUnit}. OWNER = EXPERT (build-go released by PO). MINTED (no prior CalendarEntry natural-class task — check-before-create).

## Context

Covers R40.99 92a5d0d4 (natural domain classes implement UnitConvertible), UC f4b10768. Implementation UNDER Task 37.20 ae01f065. parent S37 b86b53cc.

## Intention

Dropping a calendar entry (.ics) instantiates a CalendarEntry object that owns its model+view+controller and renders itself; nothing switches on a content-type string.

## Acceptance Criteria

- [ ] CalendarEntry is a CLASS implementing UnitConvertible {isBinary/load/toUnit/fromUnit}; MimeType.from resolves a calendar-entry drop (.ics/text-calendar) to the CalendarEntry class (no content-type string-switch outside MimeType).
- [ ] A dropped calendar entry RESOLVES to a CalendarEntry scenario unit that is INSTANTIATED; the object owns its model+view+controller and RENDERS ITSELF (detail + preview) — not bytes stored, not a handler branch.
- [ ] DEFINITION OF DONE: the right CLASS (CalendarEntry) is instantiated AND rendering itself; a mime/format switch handling calendar entries = RED.

## Subtasks

None (atomic natural-class task).
