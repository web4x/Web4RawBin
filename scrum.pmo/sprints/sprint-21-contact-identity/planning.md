# Sprint 21 — Contact Identity — Planning

**Source:** Tron directive 2026-06-28 (via robbin-po).
**Scope (Tron answer #3):** ALL 8 requirements in ONE sprint. No split.
**Requirements:** [requirements.md](./requirements.md)

## Sprint Goal

Make a profile's contact facets — phone, email, address, company — first-class scenario units in the object graph, with phone and email acting as alternate lookup keys that link a new device to an existing user instead of minting a duplicate. Fix the lobby first-load name, store dropped vCards beside the avatar, and seed Tron's real phone as the first Phone unit on WODA.prod.

## Architecture Pattern (shared across R21.3–R21.8)

```
Profile ──relationship(class↔method shape)──▶ Phone   (ior:class:Phone)    alternate key, ln symlink
        ──relationship──▶ Email   (ior:class:Email)    alternate key, ln symlink
        ──relationship──▶ Address (ior:class:Address)  async-verified vs OpenStreetMap
        ──relationship──▶ Company (ior:class:Company)  SHARED, dedup by name
```

- **Alternate-UUID keys:** phone (R21.3/R21.6) and email (R21.5) register as `ln` symlinks in the index pointing at the profile scenario unit. A profile is reachable by any of its keys.
- **Device-link (R21.4):** a known phone/email never mints a new user — it prompts for the secret code and attaches a new device to the existing profile.
- **Shared Company (R21.8):** dedup by name; many profiles → one Company unit.
- **Async Address (R21.7):** save immediately, verify in background, badge + map links on confirm.

## Use Case Placeholders (architect to refine into real UseCase units)

These anchors back the forward links in requirements.md. Each is a placeholder UUID minted with its requirement; the architect replaces it with a real Object.verb UseCase unit and wires Class → Method → Implementation → Test.

| Anchor | UseCase (Object.verb) | UC placeholder UUID | Covers |
|--------|----------------------|---------------------|--------|
| <a id="uc-ci1"></a>UC-CI.1 | profile.dropVCard | 9cd5cc65-58d9-4417-8480-86531ed3cf4e | R21.1 |
| <a id="uc-ci2"></a>UC-CI.2 | lobby.renderName | dbfacb7f-2f40-4852-975b-dc308cef3b90 | R21.2 |
| <a id="uc-ci3"></a>UC-CI.3 | phone.indexAsSymlink | 97015dcc-de18-4625-9025-f41a49682309 | R21.3 |
| <a id="uc-ci4"></a>UC-CI.4 | identity.deviceLinkOnKnownKey | ff91e891-57b8-4d82-b3d5-fa45219b9db1 | R21.4 |
| <a id="uc-ci5"></a>UC-CI.5 | email.mintAndLink | c59356f7-d8ea-4e47-9659-efea4ef05c2c | R21.5 |
| <a id="uc-ci6"></a>UC-CI.6 | phone.mintAndLink | 4242f9be-20c4-47c7-8035-d395413d7915 | R21.6 |
| <a id="uc-ci7"></a>UC-CI.7 | address.mintAndVerifyAsync | fab88cb9-fd28-4271-b3b1-aff9008c3b9a | R21.7 |
| <a id="uc-ci8"></a>UC-CI.8 | company.mintOrReuseShared | a62c6e37-139f-4107-a157-1c67b3e06bfb | R21.8 |

## Task Skeleton (planner to stand up)

Tasks are NOT created by req-eng. The planner stands up task files referencing the requirement UUIDs above (one task may cover multiple atomic requirements). Suggested grouping for planner consideration:

1. **Contact-unit foundation** — Phone/Email/Address/Company class units + relationship pattern (R21.5, R21.6, R21.7, R21.8)
2. **Alternate-key index + device-link** — ln symlinks for phone/email + secret-code device-link flow (R21.3, R21.4)
3. **vCard ingest** — drop-to-store + field extraction feeding the unit flows (R21.1)
4. **Lobby first-load fix** — correct name on connect (R21.2)
5. **WODA.prod seed** — Tron's `+4915253844085` as first Phone unit (R21.6 acceptance)

## Open / Resolved Questions

- ✅ **Single vs split sprint** — Tron answer #3: ALL 8 in Sprint 21, no split.
- ✅ **Address verification timing** — Tron answer #2: ASYNC, non-blocking, badge on confirm.
- ✅ **Real seed data** — Tron answer #1: seed `+4915253844085` on WODA.prod from the start.

## Definition of Done (per Strict Verify Bar)

- Every requirement's leaf Test is reachable from its Requirement root via the full 6-step chain.
- Live UX reproduction (headless) for browser-visible ACs (R21.1 drop, R21.2 lobby name).
- No duplicate Company units; phone/email lookups resolve to the correct single profile.

---

*Planned by robbin-req 2026-06-28. Sprint 21 — Contact Identity.*
