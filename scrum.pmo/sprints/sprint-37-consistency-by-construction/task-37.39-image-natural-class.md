<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.39: Image is a natural CLASS — dropping an image RESOLVES to an Image unit that is instantiated and renders ITSELF (no mime/format switch) [R40.99, under T37.20]

[task:uuid:bc0302dd-cef7-4d55-b71f-1da410ca76d3]

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

STOOD UP Planned (2026-09-06) on PO durable-queue directive (R40.81 root closed -> T37.20 current; queue the natural classes under it). OWNER=EXPERT, build-go released. Covers R40.99 natural-class UnitConvertible + UC f4b10768. Implementation UNDER T37.20 (in its subtasks). req 3-pt verifies + may add per-class ACs. 0 Done till Tron.

## Task Description

Natural-class implementation UNDER Task 37.20 (the DnD drop contract). TRON FRAMING (do NOT re-frame): there are NO 'shapes'. A drop RESOLVES to a scenario UNIT of a CLASS; the class is INSTANTIATED; the OBJECT owns its own model+view+controller and stores and renders ITSELF. A handler switching on a mime/format string IS the defect. Layered: DndContract -> MultipartMime -> MimeType.from -> Image class. Image implements UnitConvertible {isBinary/load/toUnit/fromUnit} — ask the object, no free transport function. OWNER = EXPERT (build-go released by PO). MINTED (no prior Image natural-class task — check-before-create).

## Context

Covers R40.99 92a5d0d4 (natural domain classes implement UnitConvertible), UC f4b10768. Implementation UNDER Task 37.20 ae01f065 (radical-OOP: the class renders itself). parent S37 b86b53cc.

## Intention

Dropping an image instantiates an Image object that owns its model+view+controller and renders itself; nothing switches on a content-type string.

## Acceptance Criteria

- [ ] Image is a CLASS implementing UnitConvertible {isBinary/load/toUnit/fromUnit}; MimeType.from resolves an image drop to the Image class (no content-type string-switch anywhere outside MimeType).
- [ ] A dropped image RESOLVES to an Image scenario unit that is INSTANTIATED; the Image object owns its model+view+controller and RENDERS ITSELF (detail + preview) — not bytes stored, not a handler branch.
- [ ] DEFINITION OF DONE: the right CLASS (Image) is instantiated AND rendering itself; a mime/format switch handling images = RED (the defect).

## Subtasks

None (atomic natural-class task).
