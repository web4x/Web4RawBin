<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 25.1: Comprehensive DnD logging (capture every dropped URL scheme)

[task:uuid:06544a45-382b-4747-9692-0ad444e905ac]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

  - up
    - [Sprint 25 Planning](./planning.md)
    - Requirement R25.1 `[requirement:uuid:649e9f4c-5e19-4a68-aa80-3378b1e1a9cc]`
  - down
    - [UC-DND.1: drop.logSchemes](./planning.md#uc-dnd1) `[uc:uuid:5fc59adc-6a84-4426-b892-28294bbb0612]`

## Task Description

The room drop handler must log EVERYTHING about every drop, framed around URL-scheme capture: all DataTransfer.types, every DataTransfer.items entry (kind+type, incl non-File items), DataTransfer.files, and getData() for each advertised type (text/uri-list, text/plain, text/html, text/calendar, text/x-vcard, Apple UTIs) - then EXTRACT and log the URL SCHEME of each dropped item (mailto/webcal/calshow/maps/geo/tel/x-apple-reminder/http(s)/...), to BOTH chat AND server, so a drop in Tron's test room is diagnosable. Replaces today's file.name+type-only routeUnknown which makes non-File Apple URL-scheme items invisible.

## Context

Impl base: src/public/ts/RoomView.ts:178-187 drop handler + src/public/ts/drop-dispatcher.ts routeUnknown:81 / dispatch:92. Apple DnD items are URL SCHEMES, not File objects (the handler today reads only dt.files + getData(uri-list||plain), so scheme items are invisible). URL-scheme routing modeled on R23.2 (YouTube). R25.2+ per-scheme handlers DEFERRED until Tron-room logs exist.

## Intention

Tron: "on apple iPhone and macOS a lot can be dragged and dropped next to files: emails, calendar entries, locations. Add logging so you see when such action fails and create scrum tasks to start to support them." MEASURE-FIRST (PO): log which schemes Apple sends so R25.2+ per-scheme handlers are specced from real Tron-room logs, not guesses.

## Acceptance Criteria

- [ ] (types) On every drop, log all DataTransfer.types entries
- [ ] (items) Log every DataTransfer.items entry (kind + type), including non-File items
- [ ] (files) Log every DataTransfer.files entry (name, type, size)
- [ ] (getData) For each advertised type, log getData(type) - the raw URL/payload (text/uri-list, text/plain, text/html, text/calendar, text/x-vcard, Apple UTIs)
- [ ] (scheme) Extract and log the URL SCHEME of each dropped item (mailto, webcal, calshow, maps, geo, tel, x-apple-reminder, http(s), ...) - the scheme is the routing key
- [ ] (chat+server) Log to BOTH chat (client-visible) AND server (persisted) so a drop in Tron's test room is diagnosable after the fact
- [ ] (no-handler diagnose) When no handler matches the scheme/type, the log captures enough (all types + getData + extracted scheme) to diagnose WHAT was dropped - replacing today's file.name+type-only routeUnknown
- [ ] (non-file path) Apple URL-scheme items that are NOT File objects are captured (the handler reads beyond dt.files + getData(uri-list||plain))

## Implementation

Shipped v0.6.86 (625d96d25, LIVE): comprehensive DnD diagnostic logging in RoomView.ts drop handler (+16 lines) — captures Apple scheme-URL drops; sw.js + version bumped (#15/#16). Tester gating NOW — testing hop OPEN until a committed GREEN verdict (#102); AC unchecked until tester proves a real Apple drop logs all types/items/getData + the extracted scheme to chat AND server.

## Subtasks

None (atomic task). NOTE: R25.2+ per-scheme preview + Open-in-New-Tab handlers (email/calendar/map/contact/reminder, R23.2 YouTube model) are DEFERRED to Phase 2 — created AFTER Tron-room logs reveal which schemes Apple actually sends (measure-first, PO directive).
