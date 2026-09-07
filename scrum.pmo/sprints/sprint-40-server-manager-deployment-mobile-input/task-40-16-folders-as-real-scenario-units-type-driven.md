<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.16: Folders as real scenario units — type-driven

[task:uuid:5899aeb2-8456-45fc-8f43-0071356fb9dd]

## Status
- [ ] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

Deliver + verify requirement R40.16 (Folders as real scenario units — type-driven). Retroactive task unit minted scenario-first from the existing requirement (#126 gap: the req existed, its Task unit was never minted). Covers R40.16; status derived from reality, staged by planner.

## Acceptance Criteria

- [ ] **(folder-is-real-unit)** A folder IS a real scenario unit (ior:class:Folder or the EXISTING Folder kind — REUSE, check before minting a new kind per #126) with identity, parent, and CHILDREN as real links (not a render-only tree row).
- [ ] **(default-detail-view-RIDE-R40.11)** A folder has a DEFAULT DETAIL VIEW — SAME CLASS as R40.11 (deploymentRefs needed real units + a type-driven default view). It RIDES that ONE generic type-driven view, NOT a bespoke folder renderer.
- [ ] **(folder-actions-on-item-R40.5)** FOLDER ACTIONS live on the folder ITEM itself, including NEW FOLDER; the existing Add-folder / Add-Diagram actions become action UNITS per R40.5's de-duplication (not bespoke buttons).
- [ ] **(converge-in-room-precedent)** CONVERGE on the in-room 'Files' itemview — Tron says it already behaves right (a folder showing its file children). Do NOT invent a second folder behaviour; the model is that precedent.
- [ ] **(child-size-state-sunburst-DESIGN)** A folder keeps STATE about the SIZE of its children — a real derived/stored field on the unit with ONE source (not computed ad-hoc in one view) — rendered as a SUNBURST diagram (a VIEW over the field). ★ DESIGN-REQUIRED: architect call on WHERE child-size state lives (stored vs derived) so it has ONE source.
- [ ] **(device-390-fail-loud)** Gated @390 real-device PIXEL (Tron's viewport); fail-loud if size or children cannot resolve (never a blank ring / silent-empty).

## Subtasks
