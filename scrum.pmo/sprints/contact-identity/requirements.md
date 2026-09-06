<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Sprint 21 Requirements — Contact Identity

## Requirements

- [ ] **R21.1 — vCard drop stores with photo**
  [requirement:uuid:efd1acb6-d9de-476b-b30f-50d7969b37fe]
  > TRON: "drop vCard into profile stores .vcf alongside user avatar photo in same user dir."
  Dropping a vCard onto a profile stores the .vcf file alongside the user's avatar photo in the same user directory.
  **Acceptance criteria:**
  - [ ] **(drop-ingest)** A .vcf can be added by drag-drop onto the profile overlay OR via the file picker (accept='.vcf,text/vcard').
  - [ ] **(drop-ingest)** A dropped file that is not .vcf / text/vcard is rejected with a 'Please drop a .vcf file' message.
  - [ ] **(drop-ingest)** A vCard with none of fn/tel/url/photo is rejected with 'No profile data found' (no empty import).
  - [ ] **(apply)** On valid drop the vCard is parsed (parseVCard) and applyVCard maps photo->avatar, fn->name, plus tel/url into the profile fields.
  - [ ] **(apply)** The photo from the vCard becomes the user avatar (feeds the same avatar pipeline as /api/avatar).
  - [ ] **(store)** After apply, the client POSTs /api/vcard { playerToken, data:<base64 of the raw .vcf text> } using client.playerToken (not the stale localStorage key).
  - [ ] **(store)** The server authenticates the playerToken (must be in tokenToClient) and rejects unauthenticated/missing-data/no-profile with 401/400.
  - [ ] **(store)** The server stores the .vcf in the user's home via encryptFile(playerToken, buf, 'text/vcard', 'contact.vcf', 'vcard') — i.e. as contact.vcf in the SAME user directory and SAME encrypted-file mechanism as the avatar (avatar.<ext>).
  - [ ] **(store)** On encrypt failure the server rekeys the user and retries the store (no silent loss); success returns { ok:true, vcardUrl:'/api/vcard/<token>' }.
  -> profile.dropVCard [uc:uuid:9cd5cc65-58d9-4417-8480-86531ed3cf4e]

- [ ] **R21.2 — Lobby correct name on first load**
  [requirement:uuid:4f099ef2-66b6-4eba-b9e2-5b2a4c86e98b]
  > TRON: "lobby renders correct profile name immediately on connect, not blank/default until second reload."
  The lobby renders the correct profile name immediately on connect, never blank or a default placeholder that only corrects on a second reload.
  **Acceptance criteria:**
  - [ ] **(first-render)** On first render the member name is resolved as: URL ?name= > client.getProfile()?.name > localStorage 'rawbin-name' > 'User <rand>' — the authoritative server profile name is preferred over an empty localStorage snapshot.
  - [ ] **(first-render)** On a warm profile cache the correct name shows on the FIRST paint — no blank/default flash, no second reload required.
  - [ ] **(self-heal)** On MSG.PROFILE_UPDATED with a non-empty profile.name, memberName is set to that name and persisted to localStorage 'rawbin-name'.
  - [ ] **(self-heal)** The PROFILE_UPDATED handler updates BOTH the #member-name input value AND the rb-avatar 'name' attribute (not just the input) so the visible lobby name+avatar block self-heals.
  - [ ] **(self-heal)** A PROFILE_UPDATED with an empty/absent name is ignored (no clobbering the current name).
  - [ ] **(verify)** Verified headless against the running app (Strict Verify Bar): first connect on a fresh device shows the real profile name with zero second-reload.
  -> lobby.renderName [uc:uuid:dbfacb7f-2f40-4852-975b-dc308cef3b90]

- [ ] **R21.3 — Phone index as ln symlinks**
  [requirement:uuid:144d1332-e3c8-4e37-a1ca-93904801b5c6]
  > TRON: "standardized format +CountryCode digits only (e.g. +4915253844085, no spaces/dashes/parens). Each phone becomes an ln symlink in index pointing to profile scenario unit. Phone numbers are alternate UUIDs."
  Each phone number is normalized to +<CountryCode><digits> (no spaces, dashes, or parentheses) and registered as an ln symlink in the index pointing to the owning profile scenario unit, making the phone an alternate UUID for that profile.
  **Acceptance criteria:**
  - [ ] **(normalize)** A phone key is normalized to +<digits> (normalizePhone strips all non-digits); isValidPhoneKey requires /^\+\d{6,15}$/ before the key may become a path.
  - [ ] **(normalize)** An invalid/empty key is rejected: registerSymlink returns null and writes no symlink.
  - [ ] **(symlink)** registerSymlink(profileUuid, rawPhone) creates alt/phone/<key>.scenario.json as a relative symlink pointing to the PROFILE's canonical scenario file (the symlink target is the PROFILE, not the Phone unit).
  - [ ] **(symlink)** The link is declared on the Profile's unitLinks[] (via index.addLink -> ensureSymlinkDisk), so it self-writes on put() and self-removes when the profile is removed — one source of truth (the unit JSON).
  - [ ] **(symlink)** registerSymlink returns null if the profile does not exist (no dangling symlink).
  - [ ] **(lookup)** resolveToProfile(rawPhone) normalizes the input, follows alt/phone/<key>.scenario.json, and returns the owning profile uuid — i.e. the phone number is an ALTERNATE UUID for the profile.
  - [ ] **(lookup)** resolveToProfile returns null on an invalid key or a missing symlink (new identity).
  -> phone.indexAsSymlink [uc:uuid:97015dcc-de18-4625-9025-f41a49682309]

- [ ] **R21.4 — Phone or email triggers device-link not new user**
  [requirement:uuid:04dff687-ae49-4d9c-9150-6e2419a1c0b9]
  > TRON: "if connecting user provides phone or email already in index, do NOT create new user. Ask immediately for existing user secret CODE, create new DEVICE for same user. Applies to phone AND email."
  When a connecting user supplies a phone or email already present in the index, the system does NOT create a new user; it immediately prompts for the existing user's secret CODE and, on success, creates a new DEVICE for that same user. Applies to both phone and email.
  **Acceptance criteria:**
  - [ ] **(detect)** On IDENTIFY with phone/email when NO profile exists for the connecting token, the server consults resolveKeyToProfile(phone, email).
  - [ ] **(detect)** If a known profile is found (knownUuid != connecting token), the server sends KNOWN_KEY_CHALLENGE { profileUuid, maskedName } and does NOT mint a new profile or attach a device (break, await enroll).
  - [ ] **(detect)** If NO known key matches, a fresh profile is minted as before (unchanged new-identity path).
  - [ ] **(detect)** resolveKeyToProfile uses the SAME alt-index mechanism for phone and email (PhoneIndex/EmailIndex.resolveToProfile) — the rule applies to phone AND email.
  - [ ] **(challenge)** The challenge carries a MASKED existing name (maskName, e.g. 'Marcel Donges' -> 'M***** D*****') so the user sees who they'd link to without leaking the full name.
  - [ ] **(challenge)** DEVICE_ENROLL_REQUEST verifies msg.secretCode === existing profile.secretCode; a mismatch returns DEVICE_ENROLL_FAILED 'Wrong secret code' and enrolls nothing.
  - [ ] **(challenge)** Enroll guards: not-identified / no-profile / keys-not-generated each return DEVICE_ENROLL_FAILED with no enroll.
  - [ ] **(device-link)** On the correct secret code with profileUuid set (device-link), a device record is created/enrolled under the EXISTING profile (ownerToken = existing uuid), not the fresh connecting token.
  - [ ] **(device-link)** The connecting fresh token is redirected to the existing identity: tokenToClient.set(existingUuid, clientId), client.playerToken = existingUuid, and the server sends TOKEN_REDIRECT { newToken: existingUuid }.
  - [ ] **(device-link)** The server then sends PROFILE for the EXISTING user with its linked devices — this device becomes that same user; NO new profile is minted and NO merge/consolidation occurs.
  -> identity.deviceLinkOnKnownKey [uc:uuid:ff91e891-57b8-4d82-b3d5-fa45219b9db1]

- [ ] **R21.5 — Emails as scenario units**
  [requirement:uuid:a8be009e-8d1c-41ae-8f38-96515a72a929]
  > TRON: "ior:class:Email linked to profile via relationships (like class to method). Multiple emails per profile. Same alternate-UUID + device-link behavior as phone."
  Each email is an ior:class:Email scenario unit linked to its profile via the class-to-method relationship pattern; a profile may carry multiple emails, which act as alternate lookup keys with the same device-link behavior as phones.
  **Acceptance criteria:**
  - [ ] **(unit-shape)** Each email is minted as an ior:class:Email scenario unit with its own v4 uuid in scenario/index.
  - [ ] **(unit-shape)** The Email unit model carries { uuid, address (normalized), ownerIor } — the address field stores the NORMALIZED form.
  - [ ] **(unit-shape)** ownerIor points to the owning Profile (nav parent, NOT a chain edge); the Profile carries the forward IOR in model.emails[].
  - [ ] **(relationship)** Profile.model.emails[] holds the forward IOR(s) to Email unit(s) (class-to-method relationship shape).
  - [ ] **(relationship)** A profile may carry MULTIPLE Email units, each an independent ior:class:Email with its own uuid.
  - [ ] **(relationship)** Idempotent: linking an email whose normalized address already exists on the profile creates NO duplicate Email unit and NO duplicate entry in emails[].
  - [ ] **(normalize)** normalizeEmail(raw) = trim + lowercase. "Marcel.Donges@Gmail.com" -> "marcel.donges@gmail.com".
  - [ ] **(normalize)** normalizeEmail is deterministic and pure; the SAME implementation is shared by server and client.
  - [ ] **(normalize)** The normalized form is what is stored as the unit address AND used as the alt-index key (one canonical value).
  - [ ] **(alt-index)** The alt/email/<normalizedAddress>.scenario.json symlink is declared on the PROFILE unit unitLinks[] (matches shipped R21.6 phone) and points to the Profile unit; index.put self-syncs it (ensureSymlinkDisk), remove() self-removes it.
  - [ ] **(alt-index)** The alt/email entry resolves DIRECTLY to the owning Profile — making the email an alternate UUID for that profile (parallel to R21.3 phone).
  - [ ] **(alt-index)** resolveKeyToProfile(normalizedEmail) returns the owning Profile uuid (read the symlinked Profile unit model.uuid), or null on miss.
  - [ ] **(mint-link)** EmailIndex.mintAndLink(profileUuid, rawEmail): normalize -> mint-or-reuse the Email unit (ownerIor=Profile) -> push its IOR into Profile.emails[] -> add alt/email link to Profile.unitLinks[] -> index.put.
  - [ ] **(mint-link)** EmailIndex.mintAndLink is idempotent: calling it twice with the same email on the same profile yields exactly ONE Email unit and ONE emails[] entry and ONE alt/email symlink.
  - [ ] **(mint-link)** EmailIndex.mintAndLink returns the Email unit IOR.
  - [ ] **(device-link)** On IDENTIFY with an email already in the alt/email index, resolveKeyToProfile returns the existing profile and the device-link flow (R21.4) runs — NO new user is minted.
  - [ ] **(device-link)** Email device-link is IDENTICAL to phone (R21.4): correct secret code -> a new device attaches to the existing profile; wrong/absent code -> no device, no profile merge.
  -> email.mintAndLink [uc:uuid:c59356f7-d8ea-4e47-9659-efea4ef05c2c]

- [ ] **R21.6 — Phones as scenario units, seed Tron**
  [requirement:uuid:3bd63ae7-96e9-453a-a19f-fc7e1e00ab1f]
  > TRON: "ior:class:Phone linked to profile. Multiple phones per profile. Standardized format enforced at creation." | TRON (seed answer #1): "Seed Tron's phone +4915253844085 as the FIRST Phone unit linked to his profile on WODA.prod."
  Each phone is an ior:class:Phone scenario unit linked to its profile via the relationship pattern, with the standardized +CountryCode-digits format enforced at creation; a profile may carry multiple phones, and Tron's phone +4915253844085 is seeded as the first Phone unit on his WODA.prod profile.
  **Acceptance criteria:**
  - [ ] **(unit-shape)** A phone is minted as an ior:class:Phone unit with model { uuid, e164, ownerIor } AND a top-level ownerIor; both ownerIor === ior:instance:<profileUuid>.
  - [ ] **(unit-shape)** model.e164 stores the NORMALIZED canonical key (normalizePhone output), never the raw input string.
  - [ ] **(unit-shape)** The caller supplies the v4 uuid (PhoneIndex is runtime-crypto-free); the server passes crypto.randomUUID().
  - [ ] **(format)** normalizePhone(raw) strips ALL non-digit characters and returns +<digits> (e.g. '+49 1525 384-4085' -> '+4915253844085').
  - [ ] **(format)** Input with no digits returns '' (empty), which is rejected downstream.
  - [ ] **(format)** isValidPhoneKey enforces /^\+\d{6,15}$/ — a leading + then 6..15 digits; an invalid key causes mintAndLink to return null and mint NOTHING.
  - [ ] **(format)** The standardized +CountryDigits format is enforced AT creation: mintAndLink normalizes and validates before any unit is written.
  - [ ] **(profile-link)** On success the Phone IOR ior:instance:<phoneUuid> is appended to Profile.model.phones[].
  - [ ] **(profile-link)** A profile may carry MULTIPLE distinct phones — different normalized keys produce multiple Phone units and multiple phones[] entries.
  - [ ] **(idempotent)** IDEMPOTENT: minting a phone whose normalized key already exists in phones[] adds NO duplicate unit and NO duplicate phones[] entry.
  - [ ] **(idempotent)** Idempotency is keyed on the NORMALIZED value — raw variants like '+49 1525 3844085' and '+4915253844085' collapse to the same single entry.
  - [ ] **(mintAndLink)** mintAndLink(profileUuid, rawPhone, phoneUuid) returns the normalized key on success, null on an invalid key OR a missing profile.
  - [ ] **(mintAndLink)** If the profile does not exist, mintAndLink returns null and mints no unit.
  - [ ] **(alt-index)** On success an alt/phone/<key>.scenario.json symlink is registered pointing to the PROFILE's canonical file, declared on the Profile's unitLinks[] (self-syncs on write, self-removes on profile remove).
  - [ ] **(alt-index)** resolveToProfile(rawPhone) normalizes, follows the symlink, and returns the profile uuid — i.e. the phone is an alternate UUID for the profile (feeds R21.3/R21.4).
  - [ ] **(seed)** Tron's phone +4915253844085 exists as the first Phone unit on his WODA.prod profile (real seed data from the start).
  -> phone.mintAndLink [uc:uuid:4242f9be-20c4-47c7-8035-d395413d7915]

- [ ] **R21.7 — Addresses as scenario units, async-verified**
  [requirement:uuid:5d3b5e6e-75da-4b66-8d44-75df5f9ceb7f]
  > TRON: "address = one string large to small: Country City PostalCode Street HouseNumber. ior:class:Address linked to profile. Verify against OpenStreetMap on creation, store link to OpenStreetMap AND Google Maps." | TRON (answer #2): "Address verification is ASYNC - save immediately, verify in background against OpenStreetMap, show a verified badge when confirmed. NOT blocking on creation."
  Each address is an ior:class:Address scenario unit linked to its profile, stored as one string ordered large-to-small (Country City PostalCode Street HouseNumber); it is saved immediately and verified against OpenStreetMap asynchronously in the background, setting a verified badge and storing links to both OpenStreetMap and Google Maps on confirmation, never blocking on creation.
  **Acceptance criteria:**
  - [ ] **(format)** The address is stored as ONE string field `oneLine` ordered large to small: Country City PostalCode Street HouseNumber.
  - [ ] **(format)** Canonical example: `DE Berlin 10115 Strasse 7` — country code first, postal code third, house number last.
  - [ ] **(format)** The five tokens appear in exactly this sequence: Country, City, PostalCode, Street, HouseNumber (no reordering, no separate fields).
  - [ ] **(unit-shape)** Each address is minted as an `ior:class:Address` scenario unit with its own v4 uuid in scenario/index.
  - [ ] **(unit-shape)** The unit model carries exactly: { uuid, oneLine, verified, osmLink, gmapsLink, ownerIor }.
  - [ ] **(unit-shape)** At creation the unit is { verified:false, osmLink:null, gmapsLink:null }.
  - [ ] **(unit-shape)** ownerIor points to the owning Profile (nav parent, NOT a chain edge); the Profile carries the forward IOR in model.addresses[]. A profile may hold multiple Address units.
  - [ ] **(async-verify)** Save is immediate and NEVER blocks: the unit is index.put synchronously and returned before any network call.
  - [ ] **(async-verify)** A background VerifyJob(uuid) is enqueued off the request path (server worker), not awaited by the caller.
  - [ ] **(async-verify)** VerifyJob queries Nominatim GET /search?q=<oneLine>&format=json&limit=1 with a descriptive User-Agent, rate-limited to <=1 req/s, cached by oneLine.
  - [ ] **(async-verify)** On an OSM hit: unit.verified=true and links are set, then index.put — the verified badge appears on next render/push.
  - [ ] **(async-verify)** On an OSM miss: unit stays verified=false, persists, and displays WITHOUT a badge — never deleted, never errors the UI.
  - [ ] **(badge-states)** Badge states: UNVERIFIED (no badge) at creation and on miss; VERIFIED (badge shown) only after a confirmed OSM hit.
  - [ ] **(link-storage)** On verification, osmLink is stored as https://www.openstreetmap.org/?mlat=<lat>&mlon=<lon>#map=18/<lat>/<lon>.
  - [ ] **(link-storage)** On verification, gmapsLink is stored as https://www.google.com/maps?q=<lat>,<lon>.
  - [ ] **(link-storage)** BOTH links are stored on the same unit on success; both remain null while unverified.
  -> address.mintAndVerifyAsync [uc:uuid:fab88cb9-fd28-4271-b3b1-aff9008c3b9a]

- [ ] **R21.8 — Companies as shared scenario units**
  [requirement:uuid:bf6a0433-6e85-4341-92e5-79acb725e0bf]
  > TRON: "ior:class:Company. Multiple profiles reference SAME company unit, no duplication. Company is first-class entity in object graph."
  Each company is an ior:class:Company scenario unit; multiple profiles reference the SAME company unit (dedup by name) with no duplication, making Company a first-class shared entity in the object graph.
  **Acceptance criteria:**
  - [ ] **(namekey)** companyNameKey(raw) is deterministic and pure — identical input always yields identical output; the SAME implementation is shared by server and client.
  - [ ] **(namekey)** Normalization steps, in order: NFKD unicode-fold + strip diacritics, lowercase, replace & with " and ", repeat-strip legal suffixes until stable, strip all non-alphanumerics.
  - [ ] **(namekey)** Canonical collapse: "Cerulean Circle", "cerulean circle GmbH", and "CeruleanCircle" all map to nameKey "ceruleancircle".
  - [ ] **(namekey)** Legal-suffix strip is token-wise, case-insensitive, repeated until stable, and covers at least: gmbh, mbh, ag, se, kg, ug, inc, llc, ltd, limited, corp, corporation, co, company, plc, lp, llp, sa, sarl, bv, nv, oy, ab, as, spa, srl, pty (so "GmbH & Co KG" fully strips).
  - [ ] **(namekey)** nameKey is a RECALL/suggestion key ONLY: a nameKey collision NEVER by itself triggers an automatic merge of two companies.
  - [ ] **(domain)** When a company email or URL is available, domain = the registrable host derived from it (e.g. cerulean.circle); otherwise domain is null.
  - [ ] **(domain)** Domain is AUTHORITATIVE: two inputs with the same domain resolve to the SAME company unit even if their names (and nameKeys) differ.
  - [ ] **(domain)** Two inputs with DIFFERENT domains resolve to SEPARATE company units even if their nameKeys collide (e.g. "Apple Inc" vs an unrelated "Apple").
  - [ ] **(domain)** Where a domain is present it overrides nameKey in both lookup and mint decisions.
  - [ ] **(autocomplete)** GET /api/company/suggest?q=<typed> returns up to 5 existing units ranked: exact nameKey > domain match > nameKey prefix > token-overlap fuzzy (Jaccard on word-set).
  - [ ] **(autocomplete)** The suggestion list ALWAYS includes a permanent bottom row "Create \"<typed>\"".
  - [ ] **(autocomplete)** Selecting an existing suggestion reuses that Company uuid — NO new unit is minted.
  - [ ] **(autocomplete)** Choosing Create mints a NEW unit even if a nameKey neighbour exists (explicit user override = distinct company): no silent merge ever happens from normalization alone.
  - [ ] **(autocomplete)** When a user confirms a typed variant onto an existing unit, the raw typed string is appended to that unit aliases[] (for future recall + audit).
  - [ ] **(autocomplete)** The company input is debounced (~150 ms) before querying /api/company/suggest.
  - [ ] **(dedup)** mintOrReuseShared(name, domain?) step 1: if domain present and alt/company-domain/<domain> exists, return that unit uuid (no mint).
  - [ ] **(dedup)** Step 2: else if alt/company/<nameKey> exists, return that unit uuid (no mint).
  - [ ] **(dedup)** Step 3: else mint a new ior:class:Company, declare unitLinks (nameKey + domain when known), and index.put (which self-syncs the symlinks).
  - [ ] **(dedup)** Concurrent first-mint of the same nameKey does NOT create a duplicate: the alt/company/<nameKey> symlink is created with an atomic exclusive (wx) write — first writer wins, the loser re-reads the winner.
  - [ ] **(unit-shape)** Each company is an ior:class:Company unit whose model carries: { uuid, name (display = first-entered form), nameKey, domain|null, aliases[], unitLinks[] }.
  - [ ] **(unit-shape)** unitLinks include alt/company/<nameKey>.scenario.json and, when domain is known, alt/company-domain/<domain>.scenario.json — both symlinks point to the Company unit ITSELF (not to a profile).
  - [ ] **(unit-shape)** Profile.model.companies[] holds the forward IOR(s) to Company unit(s); a profile may reference multiple companies.
  - [ ] **(shared)** Company.ownerIor === null — a company is owned by NO single profile (legitimate null, like a Skill unit).
  - [ ] **(shared)** Multiple profiles reference the SAME Company uuid via their own companies[]; there is exactly one unit, no duplication.
  - [ ] **(shared)** There is NO back-pointer/members[] array on Company (forward-only): "who works here" is answered by walking all profiles companies[]; any member count shown in UI is a derived read, never stored as source of truth.
  -> company.mintOrReuseShared [uc:uuid:a62c6e37-139f-4107-a157-1c67b3e06bfb]

- [ ] **R21.9 — File detail: buttons and preview first, metadata last**
  [requirement:uuid:21e792e0-0431-4ffd-a4d4-c8d85df23299]
  > TRON: "the in room file details shall START with the action button and the preview pane, then the detail. reverse order. preview 75% screen size. preview needs to pan zoom its content."
  The in-room file detail view is reordered so action buttons (open-in-preview, open-in-new-tab) come first at the top, then a pan- and zoom-capable preview pane sized at 75% of screen height, then the metadata detail (name, size, type, scenario info) last - reversed from the current order where detail is on top and buttons/preview are at the bottom.
  **Acceptance criteria:**
  - [ ] **(reorder)** Action buttons (open-in-preview, open-in-new-tab) render at the TOP of the file detail view.
  - [ ] **(reorder)** The preview pane renders BELOW the buttons at height 75vh with overflow:hidden.
  - [ ] **(reorder)** Metadata (.dv-fields: name/size/type/scenario) renders BELOW the preview (last).
  - [ ] **(reorder)** Order is reversed from the current layout (was: metadata top, preview+buttons bottom at 400px).
  - [ ] **(reorder)** The 75vh preview pane is an in-flow block (NOT position:fixed) so it never intercepts taps outside its own box.
  - [ ] **(transform)** Pan/zoom is applied as CSS transform: translate(tx,ty) scale(s) with transform-origin:0 0 on .pz-content inside .pz-viewport.
  - [ ] **(transform)** scale is clamped to [1, 8] (MIN..MAX).
  - [ ] **(transform)** Zoom-about-a-point keeps the cursor/pinch-midpoint point stationary: tx'=px-f*(px-tx), ty'=py-f*(py-ty), f=newScale/oldScale.
  - [ ] **(transform)** tx,ty are clamped after every gesture so content cannot be dragged fully out of view; recenters when scale==1.
  - [ ] **(desktop)** Mouse wheel zooms about the cursor position (offsetX/offsetY); the handler is passive:false and preventDefaults the wheel.
  - [ ] **(desktop)** Mouse drag pans the content only when scale>1; cursor shows grab/grabbing.
  - [ ] **(touch)** One-finger drag pans when scale>1; when scale==1 it does NOT hijack page scroll.
  - [ ] **(touch)** Two-finger pinch zooms about the midpoint and pans by the midpoint delta.
  - [ ] **(touch)** Double-tap toggles reset (scale 1, tx/ty 0) <-> 2x zoom at the tap point.
  - [ ] **(correctness)** The double-tap detector requires touchend with touches.length===0 AND a single-finger touchstart AND duration<250ms AND movement<10px AND gap<300ms — so a pinch release (two touchend, changedTouches.length===1 each) never misfires a reset.
  - [ ] **(correctness)** Hit-testing during touch uses e.target, never document.elementFromPoint.
  - [ ] **(correctness)** Gesture listeners are attached to the .pz-viewport element ONLY, not the detail/drawer root.
  - [ ] **(correctness)** destroy() removes all listeners; on re-render (ViewBus) the old controller is torn down before a new one attaches (no leaked/stacked listeners).
  - [ ] **(correctness)** While a gesture is active, an iframe preview gets pointer-events:none (re-enabled on idle) so drags pan instead of being swallowed by the iframe.
  - [ ] **(correctness)** State resets to {scale:1, tx:0, ty:0} whenever the previewed file changes.
  - [ ] **(reuse)** RbPanZoom is content-type agnostic — works for image (img), text (pre), and iframe content.
  - [ ] **(reuse)** DRY: the same RbPanZoom is reused by the room file view and content-preview.ts (no duplicate gesture code).
  -> fileDetail.renderActionsFirst [uc:uuid:5826ca42-e01a-4ab5-8cd9-67bfb02b2e67]
