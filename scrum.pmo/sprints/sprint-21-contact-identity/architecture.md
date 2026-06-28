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

ior:class:Phone    { uuid, e164:"+4915253844085", ownerIor:<Profile> }   // alt symlink declared on PROFILE.unitLinks[] (code is law, R21.6)
ior:class:Email    { uuid, address:"a@b.de",       ownerIor:<Profile> }   // alt symlink declared on PROFILE.unitLinks[] (code is law, R21.6)
ior:class:Profile  { uuid, name, secretCode, phones[], emails[], addresses[], companies[],
                     unitLinks:["alt/phone/+4915253844085.scenario.json","alt/email/a@b.de.scenario.json"] }  // Profile OWNS the alt symlinks
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
- **CODE IS LAW (R21.6 shipped):** the symlink is **declared on the PROFILE unit's `unitLinks[]`** (NOT the Phone/Email unit) — so `ensureSymlinkDisk` resolves the link target to the Profile's own file, and it self-syncs on write / self-removes on `remove()` (index-store.ts:80-93). One source of truth — the Profile unit JSON. The Phone/Email unit only carries `ownerIor` → Profile.

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

## 4. Company Dedup — shared scenario units (R21.8)

The hard problem: recognise `Cerulean Circle` == `cerulean circle GmbH` == `CeruleanCircle` as ONE company, **without** silently merging genuinely-different companies that happen to normalize alike (`Apple Inc` ≠ a corner shop `Apple`). The design splits the problem into **recall** (normalize aggressively to *suggest* matches) and **precision** (merge only on a strong domain match or explicit user confirmation — never silently on nameKey alone).

### (a) nameKey normalization algorithm — `companyNameKey(raw)`
Deterministic, pure, server+client shared:
```
1. Unicode-fold:   raw.normalize('NFKD').replace(/[̀-ͯ]/g,'')   // strip diacritics: Glück→Gluck
2. lowercase:      .toLowerCase()
3. ampersand:      .replace(/&/g,' and ')                                  // "AT&T" ~ "AT and T"
4. strip legal suffixes (token-wise, case-insensitive), applied repeatedly until stable:
      gmbh, mbh, ag, se, kg, ug, ohg, e.v, ev, gbr,           // DE
      inc, llc, l.l.c, ltd, limited, corp, corporation, co,   // US/UK
      company, plc, lp, llp, pllc,
      sa, sarl, sas, bv, nv, oy, ab, as, spa, srl, pty, kk,   // INTL
      "gmbh & co kg" (handled by repeat-strip of gmbh + co + kg)
5. strip non-alphanumerics: .replace(/[^a-z0-9]/g,'')                       // spaces, dots, dashes
→ all three variants → "ceruleancircle"
```
**Tradeoff stated explicitly:** steps 4–5 maximise *recall* (collapse variants) at the cost of *precision* (two real companies can collide). nameKey is therefore the **suggestion/candidate key, NOT an auto-merge authority.** The actual identity decision uses domain + user confirmation (below).

### (b) domain — the strong key (precision)
If a company email or URL is available (from the vCard / Email units), derive `domain = registrable host` (e.g. `cerulean.circle`). **A domain match is authoritative** — same domain ⇒ same company even if names differ; different domains ⇒ keep separate even if nameKey collides. Domain beats nameKey whenever present.

### (c) search / suggest UX (autocomplete, user is final arbiter)
Company input is a **debounced type-ahead** (150 ms):
1. Client computes `companyNameKey(typed)` and GETs `/api/company/suggest?q=<typed>` → server ranks existing units: **exact nameKey > domain match > nameKey prefix > token-overlap fuzzy (Jaccard on word-set)**, top 5.
2. Dropdown shows each match as `Display Name · domain · N members`, plus a permanent bottom row **`➕ Create "<typed>"`**.
3. **Selecting a suggestion** reuses that Company uuid (no new unit). **Choosing Create** mints a new unit even if a nameKey neighbour exists (user overrode — distinct company). The raw typed string is appended to the chosen unit's `aliases[]` for future fuzzy recall + audit.

→ No silent merge: normalization only *ranks suggestions*; the human (or an exact domain match) decides identity.

### (d) Company unit shape + shared ownership
```jsonc
{
  "ior": "ior:class:Company",
  "model": {
    "uuid": "<v4>",
    "name": "Cerulean Circle",                 // display = first-entered form
    "nameKey": "ceruleancircle",               // dedup/suggest key (a)
    "domain": "cerulean.circle",               // strong key (b), null if unknown
    "aliases": ["cerulean circle GmbH"],       // raw variants users confirmed onto this unit
    "unitLinks": [
      "alt/company/ceruleancircle.scenario.json",          // nameKey symlink → THIS unit
      "alt/company-domain/cerulean.circle.scenario.json"   // domain symlink → THIS unit (when domain known)
    ]
  },
  "ownerIor": null                              // SHARED — no single owner (legitimate null)
}
```
- **Shared / no owner:** a Company is owned by NO profile (`ownerIor: null`, same legitimate-null class as Skill units). Profiles reference it **forward** via `Profile.model.companies[] = [ior:instance:<company uuid>]`. Many profiles → the SAME uuid (AC: shared, no duplication).
- **Two profiles, same company:** both push the identical uuid into their own `companies[]`. Nothing on the Company changes; there is **no back-pointer array** on Company (forward-only rule). "Who works here?" is answered by walking all profiles' `companies[]` — not by a denormalized members[] (the `N members` count in the UX is a derived/cached read, never the source of truth).
- **Dedicated company index:** the `alt/company/<nameKey>` and `alt/company-domain/<domain>` symlinks (reusing `unitLinks[]`+`ensureSymlinkDisk`) point to the **Company unit itself** (not to a profile — unlike the phone/email alt-index which points to a Profile). These two trees ARE the dedup lookup and the autocomplete source.

### `mintOrReuseShared(name, domain?)` — with race guard
```
key  = companyNameKey(name)
1. if domain && exists(alt/company-domain/<domain>)  → return that unit.uuid     // strong key wins
2. if exists(alt/company/<key>)                      → return that unit.uuid     // nameKey hit
3. miss → mint Company{name,nameKey:key,domain,aliases:[]},
          declare unitLinks (nameKey + domain), index.put()                       // self-syncs symlinks
```
**Concurrency:** two profiles minting the same new company at once both miss step 2 → duplicate. Guard: create `alt/company/<key>.scenario.json` with an **atomic `wx` (exclusive) write**; first writer wins, the loser catches EEXIST and re-reads the winner. Equivalently, serialize company mints through one in-process `mintOrReuseShared` (server is single-process today). The alt symlink existence IS the lock.

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

Client-only (`src/public/ts/trace/rb-file-detail.ts` + `content-preview.ts`).

### Measured current state
`rb-file-detail.render()` emits **metadata first** (`.dv-fields`: Type/Size/Edit) then inserts the content-preview **after** it (line 64 `insertAdjacentElement('afterend')`). `content-preview.ts` relies on **native iframe `touch-action:pinch-zoom` at a fixed `height:400px`** (comment "R19.81 iframe pinch-zoom") — no pan, no desktop zoom, no transform control, hidden until a toggle. That is insufficient for R21.9 (pan + pinch + scroll-zoom, 75vh).

### Reorder (DOM emit order)
```
BEFORE: [ metadata .dv-fields ] → [ preview+buttons ]   (preview at bottom, 400px)
AFTER:  [ action buttons row ]  → [ .pz-viewport 75vh (pan+zoom) ] → [ metadata .dv-fields ]
```
- **Buttons first:** hoist the open-in-preview / open-in-new-tab actions (today inside `renderContentPreview`/`wireUrlActions`) to a top row above the preview.
- **Metadata last:** move `.dv-fields` to AFTER the preview (change the `afterend` insert so fields follow the viewport).
- The 75vh pane is an **in-flow** block (`height:75vh; overflow:hidden`), NOT a `position:fixed` overlay — so it cannot steal taps outside its box (avoids the BUG5 full-viewport-hit-test class entirely; bounded-element discipline satisfied by construction).

### The hard part — `RbPanZoom` transform gesture handler (new, self-contained)
A small controller attached to the `.pz-viewport` (overflow:hidden) wrapping a single `.pz-content` (img / `<pre>` / iframe). State `{ scale, tx, ty }`, applied as `transform: translate(${tx}px,${ty}px) scale(${scale}); transform-origin:0 0`. `MIN=1, MAX=8`.

**Zoom-about-a-point** (keep the point under cursor/pinch-midpoint stationary) — viewport-local point `(px,py)`, factor `f = newScale/oldScale`:
```
tx' = px - f*(px - tx);   ty' = py - f*(py - ty);   scale' = clamp(scale*f, MIN, MAX)
```

**Desktop**
- `wheel` (passive:false → preventDefault): `f = exp(-e.deltaY * ZOOM_SPEED)`; zoom about `(e.offsetX, e.offsetY)`.
- `mousedown→mousemove→mouseup`: pan (only when `scale>1`); `tx+=dx; ty+=dy`; cursor `grab`/`grabbing`.

**Touch** (`touchstart/move/end`, passive:false)
- **1 finger:** pan; track last point, apply `dx,dy` (meaningful only when `scale>1`, else swallow nothing → let the page scroll).
- **2 fingers:** pinch; `f = dist/lastDist`; zoom about the **midpoint** in viewport coords; also translate by the midpoint delta so a two-finger drag pans while zooming.
- **double-tap → toggle** reset(scale1, tx/ty 0) ↔ 2× at the tap point.

**Critical correctness rules (from prior touch-gesture marathons — Learnings):**
1. **Double-tap detector MUST require `touchend` with `touches.length===0`** plus single-finger `touchstart`, duration `<250ms`, movement `<10px`, gap `<300ms`. A pinch release fires `touchend` twice with `changedTouches.length===1` each — the naive detector misfires and snap-resets. (R18.34.B.)
2. **Use `e.target`, never `document.elementFromPoint`** for hit-testing during touch — `elementFromPoint` returns wrong nodes when the DOM mutated mid-touch. (v0.6.0.)
3. **Listeners scoped to `.pz-viewport` only**, not the detail/drawer root, or the handlers eat clicks elsewhere even under `pointer-events:none` (JS addEventListener ignores CSS pointer-events). (v0.6.24.)
4. **`destroy()` removes all listeners**; `rb-file-detail` re-renders on `ViewBus` → must tear down the old controller before re-attaching, or listeners leak and stack.
5. **Clamp `tx,ty` after every gesture** so content can't be dragged fully out of view (edge-stop when `scale>1`; recenter at `scale==1`).
6. **iframe content:** the transform wraps the iframe; set `pointer-events:none` on the iframe while a gesture is active (re-enable on idle) so drags pan instead of being swallowed by the iframe.
7. Reset `{scale:1,tx:0,ty:0}` whenever the previewed file changes.

This `RbPanZoom` is the UC `fileDetail.renderActionsFirst` Method's core; it is content-type agnostic (img/pre/iframe) and reused by the room file view (DRY with `content-preview.ts`).

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
