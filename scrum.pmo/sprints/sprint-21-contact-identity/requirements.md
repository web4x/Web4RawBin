[Back to Planning](./planning.md)

# Sprint 21 — Contact Identity — Requirements

**Source:** Tron directive 2026-06-28 (via robbin-po).
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md) — LOCKED 6-step chain: Requirement → UseCase → Class → Method → Implementation → Test.
**Scope decision (Tron answer #3):** ALL 8 requirements in ONE sprint. No split. Full scope.

## Architecture Pattern

Phone, Email, Address, and Company are all first-class scenario units linked to a Profile via the **Class-to-Method relationship pattern** (the same relationship shape that links a Class to its Methods).

- **Phone + Email** are **alternate lookup keys** (alternate UUIDs): a profile is reachable by its phone or email, not only its primary UUID. Each becomes an `ln` symlink in the index pointing to the profile scenario unit.
- **Company** is a **shared** unit: many profiles reference the SAME company unit (dedup by name) — no duplication. Company is a first-class entity in the object graph.
- **Address** is verified **asynchronously** against OpenStreetMap (Tron answer #2): save immediately, verify in the background, show a verified badge when confirmed — never blocking on creation.

---

## Requirements

- [ ] **R21.1 — vCard drop stores with photo**
  [requirement:uuid:efd1acb6-d9de-476b-b30f-50d7969b37fe]
  > TRON: "drop vCard into profile stores .vcf alongside user avatar photo in same user dir."
  Dropping a vCard onto a profile stores the `.vcf` file alongside the user's avatar photo in the same user directory.
  **Acceptance criteria:**
  - [ ] Dropping a `.vcf` onto a profile persists the file in the user's directory
  - [ ] The stored `.vcf` lives in the same user dir as the avatar photo
  - [ ] vCard fields (phone/email/address/company) feed the unit-minting flows of R21.4–R21.8
  → [UC-CI.1: profile.dropVCard](./planning.md#uc-ci1) `[uc:uuid:9cd5cc65-58d9-4417-8480-86531ed3cf4e]` *(placeholder)*

- [ ] **R21.2 — Lobby correct name on first load**
  [requirement:uuid:4f099ef2-66b6-4eba-b9e2-5b2a4c86e98b]
  > TRON: "lobby renders correct profile name immediately on connect, not blank/default until second reload."
  The lobby MUST render the correct profile name immediately on connect — never blank or a default placeholder that only corrects on a second reload.
  **Acceptance criteria:**
  - [ ] On first connect, the lobby shows the actual profile name (no blank/default frame)
  - [ ] No second reload is required for the name to appear
  - [ ] Verified headless against the running app (live UX reproduction per Strict Verify Bar)
  → [UC-CI.2: lobby.renderName](./planning.md#uc-ci2) `[uc:uuid:dbfacb7f-2f40-4852-975b-dc308cef3b90]` *(placeholder)*

- [ ] **R21.3 — Phone index as ln symlinks**
  [requirement:uuid:144d1332-e3c8-4e37-a1ca-93904801b5c6]
  > TRON: "standardized format +CountryCode digits only (e.g. +4915253844085, no spaces/dashes/parens). Each phone becomes an ln symlink in index pointing to profile scenario unit. Phone numbers are alternate UUIDs."
  Each phone number is normalized to `+<CountryCode><digits>` (no spaces, dashes, or parentheses) and registered as an `ln` symlink in the index pointing to the owning profile scenario unit — making the phone number an alternate UUID for that profile.
  **Acceptance criteria:**
  - [ ] Phone normalization yields `+CountryCode` followed by digits only (e.g. `+4915253844085`)
  - [ ] Input with spaces/dashes/parens normalizes to the canonical form before storage
  - [ ] An `ln` symlink keyed by the normalized phone resolves to the profile scenario unit
  - [ ] Looking up a profile by phone returns the same profile as its primary UUID
  → [UC-CI.3: phone.indexAsSymlink](./planning.md#uc-ci3) `[uc:uuid:97015dcc-de18-4625-9025-f41a49682309]` *(placeholder)*

- [ ] **R21.4 — Phone/email triggers device-link, not new user**
  [requirement:uuid:04dff687-ae49-4d9c-9150-6e2419a1c0b9]
  > TRON: "if connecting user provides phone or email already in index, do NOT create new user. Ask immediately for existing user secret CODE, create new DEVICE for same user. Applies to phone AND email."
  When a connecting user supplies a phone or email already present in the index, the system MUST NOT create a new user. It immediately prompts for the existing user's secret CODE and, on success, creates a new DEVICE for that same user. Applies to BOTH phone and email.
  **Acceptance criteria:**
  - [ ] A phone OR email already in the index does NOT mint a new profile
  - [ ] The user is immediately prompted for the existing profile's secret code
  - [ ] Correct code → a new device is attached to the existing profile
  - [ ] Wrong/absent code → no device created, no profile merge
  - [ ] Behavior is identical whether the matched key was a phone or an email
  → [UC-CI.4: identity.deviceLinkOnKnownKey](./planning.md#uc-ci4) `[uc:uuid:ff91e891-57b8-4d82-b3d5-fa45219b9db1]` *(placeholder)*

- [ ] **R21.5 — Emails as scenario units**
  [requirement:uuid:a8be009e-8d1c-41ae-8f38-96515a72a929]
  > TRON: "ior:class:Email linked to profile via relationships (like class to method). Multiple emails per profile. Same alternate-UUID + device-link behavior as phone."
  Each email is an `ior:class:Email` scenario unit linked to its profile via the Class-to-Method relationship pattern. A profile may carry multiple emails. Emails are alternate lookup keys and follow the same device-link behavior as phones (R21.4).
  **Acceptance criteria:**
  - [ ] An email is minted as an `ior:class:Email` scenario unit with its own UUID
  - [ ] The email unit is linked to the profile via the relationship pattern (class↔method shape)
  - [ ] A profile supports multiple email units
  - [ ] Email is registered as an alternate-UUID `ln` symlink (parallel to R21.3 for phone)
  - [ ] Connecting with a known email triggers the R21.4 device-link flow
  → [UC-CI.5: email.mintAndLink](./planning.md#uc-ci5) `[uc:uuid:c59356f7-d8ea-4e47-9659-efea4ef05c2c]` *(placeholder)*

- [ ] **R21.6 — Phone numbers as scenario units (seed Tron's phone)**
  [requirement:uuid:3bd63ae7-96e9-453a-a19f-fc7e1e00ab1f]
  > TRON: "ior:class:Phone linked to profile. Multiple phones per profile. Standardized format enforced at creation."
  > TRON (seed answer #1): "Seed Tron's phone +4915253844085 as the FIRST Phone unit linked to his profile on WODA.prod — real test data from the start."
  Each phone is an `ior:class:Phone` scenario unit linked to its profile via the relationship pattern, with the standardized format (R21.3) enforced at creation. A profile may carry multiple phones. Tron's phone `+4915253844085` is seeded as the first Phone unit on his WODA.prod profile.
  **Acceptance criteria:**
  - [ ] A phone is minted as an `ior:class:Phone` scenario unit with its own UUID
  - [ ] The phone unit is linked to the profile via the relationship pattern
  - [ ] A profile supports multiple phone units
  - [ ] Standardized `+CountryCode`-digits format (R21.3) is enforced at creation time
  - [ ] `+4915253844085` exists as the first Phone unit on Tron's WODA.prod profile (real seed data)
  → [UC-CI.6: phone.mintAndLink](./planning.md#uc-ci6) `[uc:uuid:4242f9be-20c4-47c7-8035-d395413d7915]` *(placeholder)*

- [ ] **R21.7 — Addresses as scenario units, async-verified**
  [requirement:uuid:5d3b5e6e-75da-4b66-8d44-75df5f9ceb7f]
  > TRON: "address = one string large to small: Country City PostalCode Street HouseNumber. ior:class:Address linked to profile. Verify against OpenStreetMap on creation, store link to OpenStreetMap AND Google Maps."
  > TRON (answer #2 — async): "Address verification is ASYNC — save immediately, verify in background against OpenStreetMap, show a verified badge when confirmed. NOT blocking on creation."
  Each address is an `ior:class:Address` scenario unit linked to its profile, stored as one string ordered large-to-small: `Country City PostalCode Street HouseNumber`. The address is saved immediately; verification against OpenStreetMap runs in the background (non-blocking) and, on confirmation, sets a verified badge and stores links to BOTH OpenStreetMap and Google Maps.
  **Acceptance criteria:**
  - [ ] An address is minted as an `ior:class:Address` scenario unit linked to the profile
  - [ ] Address string is ordered large→small: Country City PostalCode Street HouseNumber
  - [ ] Save is immediate and NEVER blocks on verification
  - [ ] Background job verifies against OpenStreetMap and sets a verified badge on success
  - [ ] On verification, links to OpenStreetMap AND Google Maps are stored on the unit
  - [ ] Unverified addresses persist and display without a badge until confirmed
  → [UC-CI.7: address.mintAndVerifyAsync](./planning.md#uc-ci7) `[uc:uuid:fab88cb9-fd28-4271-b3b1-aff9008c3b9a]` *(placeholder)*

- [ ] **R21.8 — Companies as shared scenario units**
  [requirement:uuid:bf6a0433-6e85-4341-92e5-79acb725e0bf]
  > TRON: "ior:class:Company. Multiple profiles reference SAME company unit, no duplication. Company is first-class entity in object graph."
  Each company is an `ior:class:Company` scenario unit. Multiple profiles reference the SAME company unit (dedup by name) — no duplication. Company is a first-class entity in the object graph.
  **Acceptance criteria:**
  - [ ] A company is minted as an `ior:class:Company` scenario unit with its own UUID
  - [ ] Adding a company that already exists (by name) reuses the existing unit — no duplicate
  - [ ] Multiple profiles can reference the same company unit
  - [ ] The shared company unit is reachable as a first-class node in the object graph
  → [UC-CI.8: company.mintOrReuseShared](./planning.md#uc-ci8) `[uc:uuid:a62c6e37-139f-4107-a157-1c67b3e06bfb]` *(placeholder)*

- [ ] **R21.9 — In-room file detail: buttons + preview first, metadata last**
  [requirement:uuid:21e792e0-0431-4ffd-a4d4-c8d85df23299]
  > TRON: "the in room file details shall START with the action button and the preview pane, then the detail. reverse order. preview 75% screen size. preview needs to pan zoom its content."
  The in-room file detail view is reordered so action buttons come first, then a pannable/zoomable preview pane at 75% of screen height, then the metadata detail last — reversed from the current order (detail on top, buttons/preview at the bottom).
  **Acceptance criteria:**
  - [ ] Action buttons (open-in-preview, open-in-new-tab) appear at the TOP of the file detail view
  - [ ] The preview pane renders BELOW the buttons, sized at 75% of screen height
  - [ ] Preview content supports pan + zoom (pinch-zoom on mobile, scroll-zoom on desktop)
  - [ ] Metadata detail (name, size, type, scenario info) appears BELOW the preview
  - [ ] Order is reversed from the current layout (was: detail top, buttons/preview bottom)
  → [UC-CI.9: fileDetail.renderActionsFirst](./planning.md#uc-ci9) `[uc:uuid:5826ca42-e01a-4ab5-8cd9-67bfb02b2e67]` *(placeholder)*

---

## Traceability Matrix (Tron words → Requirement UUID → UC placeholder)

| Req | Concise name | Requirement UUID | UC placeholder UUID |
|-----|--------------|------------------|---------------------|
| R21.1 | vCard drop stores with photo | efd1acb6-d9de-476b-b30f-50d7969b37fe | 9cd5cc65-58d9-4417-8480-86531ed3cf4e |
| R21.2 | Lobby correct name on first load | 4f099ef2-66b6-4eba-b9e2-5b2a4c86e98b | dbfacb7f-2f40-4852-975b-dc308cef3b90 |
| R21.3 | Phone index as ln symlinks | 144d1332-e3c8-4e37-a1ca-93904801b5c6 | 97015dcc-de18-4625-9025-f41a49682309 |
| R21.4 | Phone/email → device-link | 04dff687-ae49-4d9c-9150-6e2419a1c0b9 | ff91e891-57b8-4d82-b3d5-fa45219b9db1 |
| R21.5 | Emails as scenario units | a8be009e-8d1c-41ae-8f38-96515a72a929 | c59356f7-d8ea-4e47-9659-efea4ef05c2c |
| R21.6 | Phones as scenario units (seed Tron) | 3bd63ae7-96e9-453a-a19f-fc7e1e00ab1f | 4242f9be-20c4-47c7-8035-d395413d7915 |
| R21.7 | Addresses async-verified | 5d3b5e6e-75da-4b66-8d44-75df5f9ceb7f | fab88cb9-fd28-4271-b3b1-aff9008c3b9a |
| R21.8 | Companies as shared units | bf6a0433-6e85-4341-92e5-79acb725e0bf | a62c6e37-139f-4107-a157-1c67b3e06bfb |
| R21.9 | File detail: buttons+preview first | 21e792e0-0431-4ffd-a4d4-c8d85df23299 | 5826ca42-e01a-4ab5-8cd9-67bfb02b2e67 |

UC nodes are **placeholders** — the architect refines them into real UseCase units (Object.verb) and wires Class → Method → Implementation → Test, per the precedence protocol (architect owns UC creation; req-eng owns the requirement roots).

---

*Captured by robbin-req 2026-06-28. Verbatim Tron text is authoritative; concise names are for display.*
