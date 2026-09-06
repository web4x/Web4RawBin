<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.42: RENAME as the object's own behaviour — unit.rename(newName), a 2nd class-registered action (displayName overrides derivedName) [R40.104]

[task:uuid:af84c07e-47c3-4173-b3b5-36e61a58da17]

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

STOOD UP Planned (2026-09-06) on req R40.104 (rename requirement minted 7b3804eaf). OWNER=EXPERT, overnight lane increment #4 (TIER-A behind the Move). AC string = a PROJECTION of R40.104 (never hand-written; req projects + 3-pt verifies). Ship as its own increment. 0 Done till Tron.

## Task Description

EXPERT increment #4 of the overnight OBJECT-ACTION lane (after Move-to). Rename is the OBJECT's own behaviour — unit.rename(newName) — registered as a SECOND action alongside Move in the Command+Registry the architect designs. displayName (user override) WINS over derivedName (class-computed, increment #3). CONSTRAINT: OOP-DRY-MVC, NO central switch — both open/closed lints STAY 0; if it needs a central conditional it is the wrong shape -> back to architect. OWNER = EXPERT. queuePriority = TIER-A behind the Move.

## Context

Covers R40.104 069b1f8d (rename = object own behaviour, 2nd class-registered action, 7 failable ACs). PAIRS with increment #3 derivedName (class computes its display name — new req, PO-GO-pending). Rides the architect's OBJECT-ACTION (Command+Registry) design. parent S37 b86b53cc.

## Intention

A file/folder renames by calling its own rename() method (registered action), not by a handler switching on type; the user's displayName overrides the class's derived name.

## Acceptance Criteria

- [ ] **(oop/ask-the-object)** Rename is the OBJECT'S OWN behaviour: unit.rename(newName) on the object, NOT a dialog/handler with rename logic in it. Callers ask the object; there is no free rename function/service.
- [ ] **(naming/three-names)** THREE distinct names, never conflated: originalName (raw input string — NEVER displayed as the name), derivedName (class-computed), displayName (user-set, WINS when present). Display resolves displayName ?? derivedName; originalName is never the displayed name.
- [ ] **(surface/tree)** A FILE and a FOLDER can both be renamed from the room tree (the action is available on each).
- [ ] **(mvc/live)** The new name PERSISTS and RENDERS EVERYWHERE the object appears (tree, detail, preview) with NO reload — it is the OBJECT'S OWN VIEW updating (MVC, live via the one view bus).
- [ ] **(identity/uuid-stable)** Rename does NOT change identity: the uuid is STABLE, links/children intact (same law as the VCard->Contact rename — a rename is a DISPLAY-name change, never an identifier change).
- [ ] **(validation/fail-closed)** An empty or whitespace-only new name is REJECTED (the rename does not apply; the object keeps its prior name).
- [ ] **(dry/open-closed)** The rename action is REGISTERED PER CLASS, so a 7th class gains rename with ZERO central-switch edits — both the open-set and closed-set lints stay 0 (no if/switch enumerating classes for rename).

## Subtasks

None (atomic increment).
