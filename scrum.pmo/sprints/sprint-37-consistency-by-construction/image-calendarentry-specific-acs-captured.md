# Image / CalendarEntry TASK-specific ACs — CAPTURED (recommend specific covering reqs)

PO ratchet 2026-09-06: T37.39/T37.40 covered only the BROAD R40.99 (natural-class UnitConvertible) but carried hand-written CLASS-SPECIFIC ACs. Projecting R40.99 for parity would LOSE these; CAPTURED here + RECOMMEND minting an Image req + a CalendarEntry req (each extendsRequirement=R40.99) to give these a single-source home, then re-point the tasks + project.

## T37.39 Image (bc0302dd) — specific ACs as authored:

- [ ] Image is a CLASS implementing UnitConvertible {isBinary/load/toUnit/fromUnit}; MimeType.from resolves an image drop to the Image class (no content-type string-switch anywhere outside MimeType).
- [ ] A dropped image RESOLVES to an Image scenario unit that is INSTANTIATED; the Image object owns its model+view+controller and RENDERS ITSELF (detail + preview) — not bytes stored, not a handler branch.
- [ ] DEFINITION OF DONE: the right CLASS (Image) is instantiated AND rendering itself; a mime/format switch handling images = RED (the defect).

## T37.40 CalendarEntry (257ab50f) — specific ACs as authored:

- [ ] CalendarEntry is a CLASS implementing UnitConvertible {isBinary/load/toUnit/fromUnit}; MimeType.from resolves a calendar-entry drop (.ics/text-calendar) to the CalendarEntry class (no content-type string-switch outside MimeType).
- [ ] A dropped calendar entry RESOLVES to a CalendarEntry scenario unit that is INSTANTIATED; the object owns its model+view+controller and RENDERS ITSELF (detail + preview) — not bytes stored, not a handler branch.
- [ ] DEFINITION OF DONE: the right CLASS (CalendarEntry) is instantiated AND rendering itself; a mime/format switch handling calendar entries = RED.

