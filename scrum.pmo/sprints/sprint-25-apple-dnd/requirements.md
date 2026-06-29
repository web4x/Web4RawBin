[Back to Planning](./planning.md)

# Sprint 25 — Apple DnD — Requirements

**Source:** Tron directive 2026-06-29 + PO URL-scheme clarification, via robbin-po.
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md).
**Frame:** Apple drag-and-drop items are URL SCHEMES (mailto:/webcal:/calshow:/maps:/geo:/tel:/x-apple-reminder:), not File objects. Sprint 25 supports them as URL-scheme routing on the R23.2 YouTube model (detect scheme -> preview -> Open-in-New-Tab launches native app). **Phase 1 (now): R25.1 logging instrument** - measure WHICH schemes Apple sends, so the per-scheme handlers (R25.2+) are specced from real Tron-room logs, not guesses.

---

## Requirements

- [ ] **R25.1 — Comprehensive DnD logging (capture every dropped URL scheme)**
  [requirement:uuid:649e9f4c-5e19-4a68-aa80-3378b1e1a9cc]
  > TRON: "on apple iPhone and macOS a lot can be dragged and dropped next to files: emails, calendar entries, locations. Add logging so you see when such action fails and create scrum tasks to start to support them."
  The room drop handler must log EVERYTHING about every drop, framed around URL-scheme capture: all DataTransfer.types, every DataTransfer.items entry (kind+type), DataTransfer.files, and getData() for each advertised type (text/uri-list, text/plain, text/html, text/calendar, text/x-vcard, and Apple UTIs) - then EXTRACT and log the URL SCHEME of each dropped item (mailto/webcal/calshow/maps/geo/tel/x-apple-reminder/http(s)/...). Log to BOTH chat AND server so a drop in Tron's test room is diagnosable. When no handler matches, the log must capture enough to diagnose WHICH scheme/payload was dropped - not just file.name+type (today routeUnknown logs only file.name+type, and the handler reads only dt.files + getData(uri-list||plain), so Apple URL-scheme items that are NOT File objects are invisible).
  *(impl base: src/public/ts/RoomView.ts:178-187 drop handler + src/public/ts/drop-dispatcher.ts routeUnknown:81 / dispatch:92)*
  **Acceptance criteria:**
  - [ ] **(types)** On every drop, log all DataTransfer.types entries.
  - [ ] **(items)** Log every DataTransfer.items entry (kind + type), including non-File items.
  - [ ] **(files)** Log every DataTransfer.files entry (name, type, size).
  - [ ] **(getData)** For each advertised type, log getData(type) - the raw URL/payload (text/uri-list, text/plain, text/html, text/calendar, text/x-vcard, Apple UTIs).
  - [ ] **(scheme)** Extract and log the URL SCHEME of each dropped item (mailto, webcal, calshow, maps, geo, tel, x-apple-reminder, http(s), ...) - the scheme is the routing key.
  - [ ] **(chat+server)** Log to BOTH chat (client-visible) AND server (persisted) so a drop in Tron's test room is diagnosable after the fact.
  - [ ] **(no-handler diagnose)** When no handler matches the scheme/type, the log captures enough (all types + getData + extracted scheme) to diagnose WHAT was dropped - replacing today's file.name+type-only routeUnknown.
  - [ ] **(non-file path)** Apple URL-scheme items that are NOT File objects are captured (the handler reads beyond dt.files + getData(uri-list||plain)).
  → [UC-DND.1: drop.logSchemes](./planning.md#uc-dnd1) `[uc:uuid:5fc59adc-6a84-4426-b892-28294bbb0612]` *(placeholder)*

### Deferred (Phase 2 — created AFTER Tron-room logs)
- **R25.2+** per-scheme preview + Open-in-New-Tab handlers (email / calendar / map / contact / reminder), one per URL scheme the logs reveal. Modeled on R23.2 (YouTube): detect scheme -> meaningful preview -> Open-in-New-Tab launches the native app. NOT captured yet - measure first.

---

## Traceability Matrix

| Req | Concise name | Requirement UUID | UC placeholder UUID |
|-----|--------------|------------------|---------------------|
| R25.1 | DnD logging (capture dropped URL schemes) | 649e9f4c-5e19-4a68-aa80-3378b1e1a9cc | 5fc59adc-6a84-4426-b892-28294bbb0612 |

*Captured by robbin-req 2026-06-29. Tron verbatim authoritative; PO URL-scheme clarification framed in. R25.2+ deferred to measure-first.*
