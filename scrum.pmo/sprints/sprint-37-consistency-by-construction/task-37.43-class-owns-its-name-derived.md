<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 37.43: Each natural class OWNS its name — derives its own display name (derivedName←class, displayName←user, originalName preserved) [R40.105]

[task:uuid:c7f5f582-2d2f-45b1-959b-fc380c46a81e]

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

STOOD UP Planned (2026-09-06) on req R40.105 (derivedName req minted 1011d344c, PO GO'd increment #3). OWNER=EXPERT, overnight lane increment #3 (between #2 Move + #4 rename). Scenario-first BACKFILL (build was ahead of req). AC string = PROJECTION of R40.105 (never hand-written; req projects + 3-pt verifies). Expert marks against fc201015. 0 Done till Tron.

## Task Description

EXPERT increment #3 of the overnight OBJECT-ACTION lane (between #2 Move and #4 rename). The DERIVATION half that pairs R40.104 rename: each natural class COMPUTES its own display name — Image←capture, Email←subject, Contact←full-name, CalendarEntry←title+date, File←clean basename. derivedName (class computes) / displayName (user override wins, R40.104) / originalName (raw, preserved, never shown). Registered PER CLASS, NO central switch — open/closed lints STAY 0; central conditional => wrong shape, back to architect. NOT new scope = SCENARIO-FIRST BACKFILL (expert was already building it ahead of a req; minting makes it traceable, zero added work). OWNER = EXPERT.

## Context

Covers R40.105 fc201015 (each natural class derives its display name), extends R40.99, PAIRS R40.104. Rides the architect's OBJECT-ACTION design. parent S37 b86b53cc.

## Intention

A class knows how to name itself; the tree/detail show a class-derived display name, not a raw ref or a filename, and never via a central type-switch.

## Acceptance Criteria

- [ ] **(oop/derivation)** Each natural class DERIVES its own display name from its content: Image from capture datetime, Email from subject, Contact from full name, CalendarEntry from title+date, File from a clean basename. The class owns the derivation — there is no external namer/free naming function for a type.
- [ ] **(naming/original)** originalName (the raw input string) is PRESERVED on the object but NEVER shown as the object's name (this is the string we were wrongly displaying).
- [ ] **(naming/resolution)** derivedName is the FALLBACK display name when no displayName (user override, R40.104) is set: displayed name = displayName ?? derivedName. With no displayName, the class's derivedName shows.
- [ ] **(dry/open-closed)** Name-derivation is registered PER CLASS: a 7th class derives its own name with ZERO central-switch edits — both open-set and closed-set lints stay 0 (no if/switch enumerating classes for naming).
- [ ] **(naming/pairs-r40104)** The three-name model is CONSISTENT with R40.104 rename: derivedName (class-computed, this req) + displayName (user-set, wins, R40.104) + originalName (preserved, never shown). The two reqs are two halves of ONE naming design — no divergent name model.

## Subtasks

None (atomic increment).
