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

- [ ] **R25.2 — Unified WebItem scenario unit (bookmark / .url / .webloc)**
  [requirement:uuid:f8097d7c-07f7-4ef5-90fc-7512b57c1bc2]
  > TRON: "create a scenario WebItem for URLs that acts like a Google bookmark (drag-droppable), a .url file (Windows), and a .webloc (Mac) — unified as ONE ior:class:WebItem unit."
  A dropped URL of any scheme becomes ONE unified `ior:class:WebItem` scenario unit that plays the role of a Google bookmark, a Windows `.url`, and a macOS `.webloc`. Model: `{ uuid, name (page title/bookmark name), description, icon (favicon), badge (scheme icon 📧📅📍📞🔗), url, scheme (http/mailto/tel/maps/calshow/…), parentFolder (ior ref), children[] }`.
  **Acceptance criteria:**
  - [ ] **(model)** `ior:class:WebItem` has model fields: uuid, name, description, icon (favicon), badge (scheme icon), url, scheme, parentFolder (ior ref), children[].
  - [ ] **(drop→unit)** Dropped URLs create WebItem units, NOT bare text/uri-list files.
  - [ ] **(preview)** The preview renders the scheme launcher card (v0.6.87) with name + icon + badge.
  - [ ] **(open)** Open-in-New-Tab does `window.open(url)` → the native app handles the scheme URL.
  - [ ] **(folders)** WebItems organise into folders via parentFolder/children[] (parent/children like the file tree).
  - [ ] **(import .url)** Import from Windows `.url` (INI format) yields WebItem units.
  - [ ] **(import .webloc)** Import from macOS `.webloc` (plist) yields WebItem units.
  - [ ] **(import bookmarks)** Import from Google bookmarks HTML yields WebItem units (with folder hierarchy preserved).
  → [UC-WI.1: webItem.createAndLaunch](./planning.md#uc-wi1) `[uc:uuid:2dc9f063-9c98-40af-9097-fd497804c008]` *(placeholder)*

- [ ] **R25.3 — vCard onboarding recognizes existing users (device-link, no new UUID)**
  [requirement:uuid:d0acb05d-982f-418b-a0d4-667d13435371]
  > TRON: "the moment I dragged the vCard and it filled out the profile it should switch to Authorize This Device WITHOUT creating a new user UUID and profile, but asking for my existing secret code. The dialog shall ask User already exists. Unlock device with your secret code instead of Authorize This Device and then just add the device to my existing user."
  During onboarding, the moment a dragged vCard fills the profile (phone/email), those keys are checked against the alt-UUID index BEFORE any profile is minted: if the phone/email is already known, the dialog switches from "Authorize This Device" to "User already exists. Unlock device with your secret code" — WITHOUT creating a new user UUID/profile — and on the correct secret code the device is linked to the EXISTING profile.
  **Acceptance criteria:**
  - [ ] **(check-on-fill)** When a vCard fills the onboarding profile, the filled phone AND email are checked against the alt-UUID index (resolveKeyToProfile) BEFORE minting any profile.
  - [ ] **(known→switch)** If a key is FOUND, the dialog switches from "Authorize This Device" to "User already exists. Unlock device with your secret code".
  - [ ] **(no new uuid)** No new user UUID / profile is created while a known key awaits the secret code.
  - [ ] **(correct code→link)** On the correct secret code, the device is linked to the EXISTING profile (device-link, R21.4) — no new UUID.
  - [ ] **(wrong code)** A wrong secret code is rejected explicitly; still no new profile.
  - [ ] **(replaces manual)** This replaces today's behaviour (mint new profile → manual Link Account).
  - [ ] **(unknown→authorize)** If neither key is known, onboarding proceeds normally with "Authorize This Device" (new profile).
  → [UC-OB.1: onboarding.vCardKnownUserDeviceLink](./planning.md#uc-ob1) `[uc:uuid:c461d975-729b-4d60-bd45-6b1a1b62be33]` *(placeholder)*

- [ ] **R25.4 — Drawer interaction: grab-bar mouse parity + X-minimize**
  [requirement:uuid:225b18a6-684d-4bec-9a4d-42ed4f23fd09]
  > TRON (drawer): the drawer grab-bar must work the same with mouse as touch, and the X button should collapse the drawer to a minimized peek state (not close it entirely), on both touch and mouse.
  Extends the R22.2 touch-first mouse-parity principle to the drawer CHROME (not just pan/zoom content): the grab-bar must respond to mouse drag for resize/dismiss (currently touch-only), and the X button must collapse the drawer to a MINIMIZED peek state (not full close/hide) on both touch and mouse.
  **Acceptance criteria:**
  - [ ] **(grab-bar)** The drawer grab-bar responds to mousedown/mousemove/mouseup for resize/dismiss — mirroring touch (currently touch-only; rb-detail-drawer.ts lines 38-40).
  - [ ] **(x-minimize)** The X button collapses the drawer to a MINIMIZED (peek) state — NOT a full close/hide — on both touch AND mouse click (today X calls close() which hides entirely; needs a minimize()/peek state).
  → [UC-DR.1: drawer.chromeInteraction](./planning.md#uc-dr1) `[uc:uuid:c6df9164-62f3-47a5-ae91-e9eb7cefe7b5]` *(placeholder — architect to name)*

### Deferred (Phase 3 — per-scheme preview refinements)
- **R25.3+** per-scheme MEANINGFUL preview bodies (email preview, calendar-event preview, map preview, contact card) on top of the WebItem launcher card. Created as Tron exercises each scheme.

---

## Traceability Matrix

| Req | Concise name | Requirement UUID | UC placeholder UUID |
|-----|--------------|------------------|---------------------|
| R25.1 | DnD logging (capture dropped URL schemes) | 649e9f4c-5e19-4a68-aa80-3378b1e1a9cc | 5fc59adc-6a84-4426-b892-28294bbb0612 |
| R25.2 | Unified WebItem unit (bookmark/.url/.webloc) | f8097d7c-07f7-4ef5-90fc-7512b57c1bc2 | 2dc9f063-9c98-40af-9097-fd497804c008 |
| R25.3 | vCard onboarding recognizes existing users | d0acb05d-982f-418b-a0d4-667d13435371 | c461d975-729b-4d60-bd45-6b1a1b62be33 |
| R25.4 | Drawer grab-bar mouse parity + X-minimize | 225b18a6-684d-4bec-9a4d-42ed4f23fd09 | c6df9164-62f3-47a5-ae91-e9eb7cefe7b5 |

*Captured by robbin-req 2026-06-29. Tron verbatim authoritative; PO URL-scheme clarification framed in. R25.2+ deferred to measure-first.*
