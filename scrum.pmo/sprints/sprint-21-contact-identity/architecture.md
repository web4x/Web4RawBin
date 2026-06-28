[Back to Planning](./planning.md) · [Requirements](./requirements.md)

# Sprint 21 — Contact Identity & Enrichment — Architecture

**Author:** robbin-architect (WODA.prod) · 2026-06-28
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md) — LOCKED 6-step chain: Requirement → UseCase → Class → Method → Implementation → Test.
**Scope:** All 9 requirements (R21.1–R21.9), one sprint (Tron answer #3).
**Diagram:** [diagrams/sprint-21.puml](./diagrams/sprint-21.puml)

> Measured, not assumed. Every mechanism below is grounded in the current code:
> `src/ts/scenario/index-store.ts` (symlink engine), `src/ts/server/server.ts`
> (IDENTIFY/DEVICE_ENROLL handlers), `src/public/ts/RoomBrowser.ts` (lobby render).

---

## 1. Object Graph — Profile → Phone / Email / Address / Company

Phone, Email, Address, Company are **first-class scenario units**, linked to a Profile by the **forward-only Class→Method relationship shape** (the Profile carries forward IOR arrays; the children carry an `ownerIor` back-pointer that is NOT a chain edge — it is the nav parent, per Three-Concerns).

```
ior:class:Profile  (the owning identity unit)
  model.phones[]     : [ ior:instance:<Phone uuid>,   ... ]   // R21.6
  model.emails[]     : [ ior:instance:<Email uuid>,   ... ]   // R21.5
  model.addresses[]  : [ ior:instance:<Address uuid>, ... ]   // R21.7
  model.companies[]  : [ ior:instance:<Company uuid>, ... ]   // R21.8 (SHARED)

ior:class:Phone    { uuid, e164:"+4915253844085", ownerIor:<Profile>, unitLinks:["alt/phone/+4915253844085.scenario.json"] }
ior:class:Email    { uuid, address:"a@b.de",       ownerIor:<Profile>, unitLinks:["alt/email/a@b.de.scenario.json"] }
ior:class:Address  { uuid, oneLine:"DE Berlin 10115 Strasse 7", verified:false, osmLink:null, gmapsLink:null, ownerIor:<Profile> }
ior:class:Company  { uuid, name:"Cerulean Circle", nameKey:"ceruleancircle", ownerIor:null }   // SHARED → no single owner
```

**Model-shape rules**
- **Forward arrays on Profile** are the source of truth for "this profile's contacts" (mirrors `Class.methods[]`).
- **Phone/Email/Address** are owned 1:profile (`ownerIor` → Profile). A profile may carry many of each.
- **Company is shared** — `ownerIor: null` (like a Skill unit, per Learning: legitimate-null owners). Reverse lookup ("who works here") = walk all profiles' `companies[]`. We never store a back-pointer array on Company (forward-only).

---

## 2. Alternate-UUID Index — phone & email as lookup keys (R21.3, R21.5)

**Reuse the existing symlink engine** — `ScenarioIndex.unitLinks[] + ensureSymlinkDisk()` (index-store.ts:115-131) already writes a relative symlink at `scenarioRoot/<linkPath>` → canonical unit file, on every `put()`. No new symlink machinery needed.

**Alt-index tree** (new subtree, parallel to `index/`):
```
scenario/
  index/<5-hex-shards>/<uuid>.scenario.json     // canonical (unchanged)
  alt/
    phone/+4915253844085.scenario.json  ->  ../../index/.../<Profile uuid>.scenario.json
    email/marcel.donges@gmail.com.scenario.json  ->  ../../index/.../<Profile uuid>.scenario.json
```

- The **symlink target is the PROFILE** scenario unit (Tron: "phone becomes an ln symlink … pointing to profile scenario unit. Phone numbers are alternate UUIDs.").
- The symlink is **declared on the Phone/Email unit's `unitLinks[]`** so it self-syncs on write and self-removes on `remove()` (index-store.ts:80-93). One source of truth — the unit JSON.

**Normalization (the key MUST be canonical before it becomes a path):**
- **Phone (R21.3):** `+<CountryCode><digits>` — strip everything but leading `+` and digits. `+49 1525 384-4085` → `+4915253844085`. Reject if no country code resolvable.
- **Email:** lowercase, trim. `Marcel.Donges@Gmail.com` → `marcel.donges@gmail.com`.

**Server resolution** `resolveKeyToProfile(key) → profileUuid | null`:
1. Normalize the key.
2. `path = scenario/alt/<phone|email>/<key>.scenario.json`; if it exists, read it (the symlink resolves to the Profile unit) → return `model.uuid`.
3. Miss → `null` (new identity).

---

## 3. Device-Link on Known Key (R21.4) — extends IDENTIFY, does NOT mint

**Measured today:** `case MSG.IDENTIFY` (server.ts:1757) mints a brand-new profile when the token is unknown (1780). `DEVICE_ENROLL_REQUEST` (1968-1985) already exists and validates `msg.secretCode === profile.secretCode`, then issues device keys. R21.4 **wires the alt-key lookup in front of the mint** and reuses the existing enroll path.

**Flow** (see PUML `deviceLinkFlow`):
```
client → IDENTIFY { playerToken?, name, phone?, email?, deviceId }
server:
  if phone|email provided:
     hit = resolveKeyToProfile(phone) ?? resolveKeyToProfile(email)     // §2
     if hit && hit.uuid != playerToken:
        send KNOWN_KEY_CHALLENGE { profileUuid: hit.uuid, maskedName }   // NEW message
        // DO NOT mint, DO NOT attach yet
        client → DEVICE_ENROLL_REQUEST { profileUuid: hit.uuid, secretCode }
        server: validate secretCode against hit.secretCode (existing 1974 check)
           ok    → attach NEW device to existing profile (existing enroll path 1985), send DEVICE_ENROLL_OK
           wrong → DEVICE_ENROLL_FAILED, NO device, NO merge   (AC: wrong code → nothing)
  else:
     existing IDENTIFY mint path (unchanged)
```

- **Identical for phone and email** — both funnel through `resolveKeyToProfile`. (AC R21.4.)
- **No new-user minting** when a key matches (AC). The only state change on success is a new device attached to the *existing* profile.

---

## 4. Company Dedup — shared by normalized name (R21.8)

- **`nameKey = name.toLowerCase().replace(/[^a-z0-9]/g,'')`** is the dedup key. `Cerulean Circle` and `cerulean-circle` → `ceruleancircle`.
- Reuse the alt-index: `alt/company/<nameKey>.scenario.json → <Company uuid>` declared on the Company unit's `unitLinks[]`.
- **`mintOrReuseShared(name)`**:
  1. `nameKey` → check `alt/company/<nameKey>.scenario.json`. Hit → return existing Company uuid (NO duplicate).
  2. Miss → mint new `ior:class:Company`, declare its alt-link, `put()`.
- Profile references the company by pushing its uuid into `model.companies[]`. Many profiles → same uuid (AC: shared, no duplication).
- **UI:** company input is a type-ahead that queries `alt/company/` prefix; selecting an existing entry reuses it, free-typing a new name mints on save.

---

## 5. Address — async OpenStreetMap verification (R21.7, Tron answer #2)

**Save is immediate and never blocks** (AC). Verification is a background job.

```
mintAndVerifyAsync(oneLine):
  unit = { ior:"ior:class:Address", oneLine, verified:false, osmLink:null, gmapsLink:null }
  index.put(unit)                      // immediate, unblocked
  enqueue VerifyJob(unit.uuid)         // background
  return unit                          // UI renders WITHOUT badge

VerifyJob(uuid):                        // server worker, off the request path
  q = encodeURIComponent(unit.oneLine)
  r = GET https://nominatim.openstreetmap.org/search?q=<q>&format=json&limit=1   (rate-limited, UA header)
  if r[0]:
     unit.verified  = true
     unit.osmLink   = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`
     unit.gmapsLink = `https://www.google.com/maps?q=${lat},${lon}`
     index.put(unit)                    // badge appears on next render / push
  // miss → stays verified:false, persists & displays WITHOUT badge (AC)
```

- **Address string order (Tron):** large→small `Country City PostalCode Street HouseNumber`.
- **Both links stored** on the unit (OSM + Google Maps) on success (AC).
- Nominatim usage policy: ≤1 req/s, descriptive `User-Agent`, cache by `oneLine` to avoid re-hitting.

---

## 6. In-room File Detail reorder + pan/zoom (R21.9)

Client-only (`src/public/ts/trace/rb-file-detail.ts`). Reverse the section order:

```
BEFORE: [ metadata detail ] → [ buttons + preview ]   (bottom)
AFTER:  [ action buttons ]  → [ preview pane 75vh, pan+zoom ] → [ metadata detail ]
```

- **Buttons first:** open-in-preview, open-in-new-tab at the top.
- **Preview pane:** `height: 75vh`, content in a pan/zoom container — pointer/wheel zoom on desktop, pinch on touch. Reuse the bounded-overlay discipline (height bounded, element bounds = visible bounds) so the preview never eats taps outside it.
- **Metadata last:** name/size/type/scenario info below the preview.

---

## 7. Lobby first-load name race (R21.2)

**Diagnosed (measured):** `RoomBrowser` constructor (RoomBrowser.ts:27) sets
`memberName = params.get('name') || localStorage.getItem('rawbin-name') || 'User <rand>'`
and `show()` → `render()` paints that fallback **before** the async `WELCOME → IDENTIFY → PROFILE` round-trip resolves the real profile name. The later handler (line 95) only patches `nameInput.value` — it does **not** re-render the lobby name/avatar block — so on a fresh device the first paint shows the random/default until a manual second reload re-runs with localStorage warm.

**Fix:** make the lobby name **profile-driven and re-rendered on PROFILE arrival**:
- Subscribe to the profile/PROFILE_UPDATED event; on arrival, set `memberName = profile.name` and **re-render** the name+avatar block (not just the input).
- First render: if `client.getProfile()?.name` is already present (warm cache), use it; otherwise render a neutral skeleton (no wrong default) and let the PROFILE event fill it — eliminating the "blank/default then correct" flash.
- One-shot guard so the duplicate async PROFILE_UPDATED (Learning: async side-effect messages fire handlers twice) doesn't thrash.
- **Verify headless** against the running app (Strict Verify Bar): first connect shows the real name, zero second-reload.

---

## 8. Traceability — UC refinement (this sprint's chain seeds)

Each requirement's placeholder UC is refined to a real `Object.verb` UseCase unit, wired `class` + `classes[]` + `method` (design-ahead Class & Method units minted with it). `ownerIor` of each UC = its Requirement (forward-only; the requirement's `useCases[]` already points here).

| Req | UC (Object.verb) | UC uuid | Class | Method |
|-----|------------------|---------|-------|--------|
| R21.1 | profile.dropVCard | 9cd5cc65 | Profile | Profile.dropVCard |
| R21.2 | lobby.renderName | dbfacb7f | RoomBrowser | RoomBrowser.renderNameOnConnect |
| R21.3 | phone.indexAsSymlink | 97015dcc | PhoneIndex | PhoneIndex.registerSymlink |
| R21.4 | identity.deviceLinkOnKnownKey | ff91e891 | IdentityResolver | IdentityResolver.resolveOrEnroll |
| R21.5 | email.mintAndLink | c59356f7 | Email | Email.mintAndLink |
| R21.6 | phone.mintAndLink | 4242f9be | Phone | Phone.mintAndLink |
| R21.7 | address.mintAndVerifyAsync | fab88cb9 | Address | Address.mintAndVerifyAsync |
| R21.8 | company.mintOrReuseShared | a62c6e37 | Company | Company.mintOrReuseShared |
| R21.9 | fileDetail.renderActionsFirst | 5826ca42 | RbFileDetail | RbFileDetail.renderActionsFirst |

Class & Method UUIDs are minted fresh (real v4, no fake-suffix) by `mint-sprint21-chain.mjs` and recorded in the units on disk. Implementation/Test stay empty — wired at code time (impl markers) and by the tester (champagne).

---

*Measured against commit at write-time. Implementations do not yet exist — this is design-ahead; the chain seeds (Req→UC→Class→Method) are created now, Impl/Test land during build.*
