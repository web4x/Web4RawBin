# MimeType CLASS MODEL (architect, 2026-09-06)

Tron STANDING LAW, verbatim: *"all dnd processing must be mimetype oop class first. the mimetype says if its binary or not and what parser the class handling the mimetype oop with the load and save as scenario unit requires."* This is the GENERALISATION of the boundary outage: that defect existed ONLY because a content-type was handled as a STRING (`split('boundary=')[1]`) and binary-ness was assumed at a call site. Under this law it is **unconstructable** — a MimeType is a class that OWNS its own header-param parsing, its binary-ness, its parser, and its scenario-unit conversion. **Design-only. Sequence: the boundary-only outage fix ships FIRST (do NOT touch it); this lands right behind it — and makes that fix permanent by construction; then the remaining OOP slices.** Composes with T37.20 (ONE DnD contract) — one design, not a fork.

## THE RULE
A caller **asks a MimeType**, never inspects a content-type string or guesses binary-ness. Zero `contentType.split(...)`, zero `if (type === 'image/png')`, zero per-mimetype branching outside the MimeType classes. The exact outage operation (`content-type.split('boundary=')`) ceases to exist at any call site.

## `MimeType` (abstract base)
- **Data:** parsed `type`/`subtype` + **params** (`boundary`, `charset`, …) — parsed ONCE in the factory, dequoted + params-stripped, never re-split at a call site.
- **Behaviour:**
  - `static MimeType.from(contentTypeHeader): MimeType` — the ONE place a content-type STRING is parsed. Splits type/subtype, parses params (dequote `boundary="…"`, strip `;charset`), returns the right subclass. **This absorbs the outage root** (`split('boundary=')[1]` + quote/param handling) — owned, correct, once.
  - `isBinary(): boolean` — owned by the type, NEVER sniffed/guessed at a call site.
  - `parser(): Parser` / `parse(raw: Buffer): Content` — the type SELECTS + OWNS its parsing strategy, INCLUDING parsing its own content-type params.
  - `load(raw: Buffer): Content` — load raw bytes into the type's representation.
  - `saveAsScenarioUnit(content, container): Unit` — turn loaded content INTO a scenario unit (File/WebItem/…) parented into the container. This is "raw dropped content → scenario unit" — the half T37.20 delegates.

## Concrete subclasses (per family)
- **`ImageMime` (image/*):** isBinary=true; parse = raw Buffer (no decode); saveAsScenarioUnit → File unit + preview/thumbnail.
- **`TextMime` (text/*):** isBinary=false; parse = decode by the `charset` param (owns the `;charset` the outage exposed); save → File/text unit.
- **`MessageMime` (message/rfc822):** the `.eml` Tron dragged ("Grüße-für-….eml"); parse = rfc822 structure; save → File unit.
- **`ApplicationMime` (application/*):** isBinary=true default (octet-stream/pdf/…); save → File. **Special: `application/rb-unit`** (T37.20's in-app drag payload) — its "parse" = RESOLVE the existing Unit by ref (no new file); this is the seam where MimeType meets DndContract.
- **`MultipartMime` (multipart/form-data):** OWNS boundary-param parsing (dequote + strip params) = the outage root, now a type responsibility. The upload route does `MultipartMime.from(req.headers['content-type'])` → it owns the (correct) boundary → parses the parts. The **buffer-native body parse (b42f22931), currently de-scoped, lands HERE** as MultipartMime's parser — owned by the type, not a free function. No call site ever touches `split('boundary=')`.

## Composition with T37.20 (ONE design)
- `DndContract.resolveDragUnit(dataTransfer)` (T37.20) reads the buffer → gets raw content + its content-type → `MimeType.from(ct)` → `.saveAsScenarioUnit(content, container)` → the Unit. **DndContract owns "buffer carries the unit / one serializer-resolver"; MimeType owns "content-shape → unit."** Not forked — resolveDragUnit DELEGATES the content half to MimeType.
- T37.20's external-file→mint path IS `MimeType.from(file.type).saveAsScenarioUnit(...)`.
- T37.20's in-app unit-ref path IS `ApplicationMime('application/rb-unit')` resolving the existing Unit.

## Collapses → DELETE (free functions / call-site branching)
- `content-type.split('boundary=')[1]` (upload route) → `MultipartMime.from().boundary`.
- `DropDispatcher.dispatch`'s MIME allowlist (v0.6.81 audio/+video/) + any `if type===…` → `MimeType.isBinary()` / family dispatch.
- `resolveDropContainer` per-mimetype branches, ProfileEditor/rb-diagram-detail per-type reads → MimeType dispatch.
- the de-scoped buffer-native body parse (b42f22931) → MultipartMime's parser (its rightful home).
- any binary-vs-text guess at a call site → `MimeType.isBinary()`.

## GATE — scan the HAZARD (not the actors) [[scan-the-hazard-not-the-actors]]
The tester counts the dangerous OPERATION anywhere OUTSIDE the MimeType classes: content-type string inspection (`.split('boundary=')`, `contentType.includes(`, `.startsWith('image/')`, a mime literal `=== 'application/…'`) OR per-mimetype branching. **Assert count == 0**, positional exception only (inside `src/…/mime/*.ts`). **Failable by seeding a violation** (add one `type==='image/png'` at a call site → RED). One number proves the law holds by construction — the hazard names itself (a content-type string op outside a MimeType class); no discovery mechanism needed.

## Sequence
1. **Boundary-only outage fix ships FIRST** (Tron broken) — untouched by this design.
2. **MimeType model lands right behind it** — and makes the boundary hardening PERMANENT (MultipartMime owns boundary parsing → the string-split cannot return). The buffer-native body parse migrates in here as MultipartMime's parser.
3. **Then the remaining OOP slices** (Node/Folder/Room/File/Unit) — MimeType composes with `File.create`/`saveAsScenarioUnit`.

## Handoff
Chain (scenario-first, on build-go): UC `dnd.dispatchByMimeType` → Class `MimeType` (+ subclasses) → Methods `from`/`isBinary`/`parse`/`load`/`saveAsScenarioUnit` → Impls (new module `src/…/mime/`). I wire on build-go (measure built shape first); req mints Tests; expert builds; tester runs the hazard-count gate. Composes with T37.20's DndContract (822e663b) — resolveDragUnit delegates to MimeType. No new store (R40.81-consistent).

## ★ REFINEMENT (Tron 2026-09-06) — NATURAL DOMAIN CLASSES + check-before-create
Tron: *"we had urls as webItems, images, eml, ical and vcard. so webitem, image, email, contact and calendarEntry as natural classes"* + *"look out for the classes existing… they should all have a traceability."*

**Model correction:** the mime-family wrappers (ImageMime/TextMime/MessageMime/ApplicationMime) are the WRONG granularity for the DOMAIN. The class is the DOMAIN CONCEPT — the THING — not a mime-shaped wrapper: **WebItem** (urls), **Image**, **Email** (.eml), **Contact** (.vcard — a vcard IS a Contact), **CalendarEntry** (.ical). These natural classes OWN `isBinary()`/`parser()`/`load()`/`saveAsScenarioUnit()`. `MimeType.from(header)` still owns the content-type PARSE (dequote boundary + strip params = the outage root) and then **hands off to the natural domain class** that the mimetype resolves to (text/vcard → Contact, message/rfc822 → Email, text/calendar → CalendarEntry, image/* → Image, a url payload → WebItem). **MultipartMime stays** = the TRANSPORT-shape owner (owns boundary parsing); a transport concern, NOT a domain class — keep distinct.

**CHECK-BEFORE-CREATE — measured (code + traceability), NEVER mint blind:**
| domain class | exists in CODE? | traceability unit (ior:class:Class)? | duplicates | disposition |
|---|---|---|---|---|
| **WebItem** | No domain class (has `RbWebItemDetail` VIEW + minted unit-type + drop-dispatcher url handling) | **YES — 7c486fcb** | none | **REUSE 7c486fcb**; complete traceability (Method/Impl for isBinary/parser/load/save) + build the domain code class |
| **Email** | No domain class (has `EmailIndex` store) | **YES — 3bb26ebe** | none | **REUSE 3bb26ebe**; complete traceability + build code class |
| **Contact** | No domain class | **YES but named "VCard" — bf440a63** | none | **REUSE bf440a63, RENAME VCard→Contact** (vcard = the MIME, Contact = the domain concept per Tron; display-name rename, uuid stable → req folds; blast radius small) |
| **Image** | No | **NONE** | none | **MINT scenario-first via req** (genuinely missing) |
| **CalendarEntry** | No | **NONE** (no CalendarEntry/CalendarEvent/ICal unit) | none | **MINT scenario-first via req** (genuinely missing) |

No duplicate Class units among the five (a duplicate would be a traceability DEFECT under the DRY law — none here). Existing units (WebItem/Email/Contact-née-VCard) are REUSED + traceability-completed, NEVER re-created. Only Image + CalendarEntry are minted (req, scenario-first). The code domain classes do not yet exist for ANY of the five (only views/stores/handlers) — expert builds them under the natural-class model; each gets its full chain (UC → Class → isBinary/parser/load/saveAsScenarioUnit Methods → Impls → Test).

**Layering (final):** `DndContract.resolveDragUnit` (T37.20) → `MimeType.from(contentType)` (owns the header parse) → resolves to the natural DOMAIN class (WebItem/Image/Email/Contact/CalendarEntry) → `.saveAsScenarioUnit()`. MultipartMime is the transport unwrap that precedes it (owns boundary). Three distinct responsibilities, no fork: transport-shape (Multipart) → content-type parse (MimeType.from) → domain concept (the natural class).

## ★★ REVISION 2 — REST: unit JSON is the ONLY thing transferred (Tron ruling 2026-09-06)
Tron VERBATIM: *"transport IS the scenario. json… NOTHING ELSE"* / *"scenario unit json IS THE MODEL AND THE ONLY THING TRANSFERRED IN REST AND ANY OTHER TRANSPORT"* / *"THINK WHAT REST MEANS."* REST = REpresentational State Transfer: what moves is the REPRESENTATION OF STATE, and here that representation IS the scenario unit JSON. **Every transfer carries unit JSON and NOTHING ELSE.**

**OVERRULED — DELETE `MultipartMime` (and the whole transport layer).** There is NO transport layer. Transport IS the scenario. The boundary bug could exist AT ALL only because we invented a NON-REST transport (multipart/form-data + a hand-rolled boundary parser) instead of transferring the unit. With unit-JSON-only there is no boundary, no multipart, no per-mimetype transport branching, no hand-rolled parser — **the entire defect class is unconstructable.** The buffer-native body parse (b42f22931) is now MOOT for the domain (nothing to parse); the boundary-only outage fix remains ONLY as a TOURNIQUET on the existing upload route until this model DELETES that route.

**Revised layering (no transport owner):**
`DndContract.resolveDragUnit` → `MimeType.from(type)` resolves WHICH natural class (image/*→Image, message/rfc822→Email, text/vcard→Contact, text/calendar→CalendarEntry, url→WebItem) → the natural class **loads and saves ITSELF as a unit** → the UNIT JSON is transferred (the ONLY thing on the wire). MimeType is a pure RESOLVER (which class), never a parser-owner.

### class AND interface (Tron)
```ts
interface UnitConvertible {              // every natural class implements it
  isBinary(): boolean;                   // owned by the class, never guessed at a call site
  load(raw: Buffer | string): void;      // become itself from dropped bytes/text
  toUnit(): ScenarioUnit;                // its representation AS a scenario unit (the wire + the model)
  static fromUnit(u: ScenarioUnit): UnitConvertible;  // reconstruct itself from the unit
}
```
`WebItem`, `Image`, `Email`, `Contact`, `CalendarEntry` implement `UnitConvertible`. The unit JSON is the model AND the wire format — one representation, no second shape.

### Binary content WITHIN the unit representation (the crux of replacing the upload POST) — grounded in file-unit.ts
The store ALREADY separates a unit from its bytes: `<uuid>.scenario.json` + `<uuid>.content` sidecar + sha256 content-hash DEDUP (content-index symlink) + unitLinks (file-unit.ts createFileUnit / readFileUnitContent). Use it as the TWO forms of the one representation:
- **TRANSFER form (REST wire):** the unit JSON carries its content INLINE as **base64** (self-contained — the wire is pure unit JSON, per Tron: nothing else moves).
- **AT-REST form (store):** the unit JSON carries a **content-ref** (contentPath) + the `.content` sidecar + hash dedup (the EXISTING mechanism — no new machinery).
- The natural class OWNS the conversion: `toUnit()` materializes `.content`→base64-inline for the wire; `fromUnit()` decodes base64→`createFileUnit` (writes `.content`, stores the ref, hash-dedups). Storage stays efficient (deduped sidecar); the wire stays pure unit JSON; the object owns both directions.

**Replacing the upload POST:** the client builds the natural-class object from the dropped File → `toUnit()` (base64 content inline) → transfers that UNIT JSON via the standard unit-transfer REST path (idempotent PUT by uuid), NOT a multipart POST. No boundary, no multipart, no parser. Hash-dedup + uuid-idempotence make a re-send a no-op.

## ★ SELF-HEAL BY CONSTRUCTION (Tron KILLED the functional 419 handshake — supersedes a85ea536a)
Tron: *"you completely screwed it functional. we will reevaluate it oop… then it CANNOT NOT self heal."* **Do NOT ship the functional handshake (409/419 + client dance).** Self-heal must EMERGE from the OOP model: an object that OWNS its own state reconciles itself.
- The natural-class object owns its state (its unit + content). `persist()` = an **idempotent PUT of its own representation by uuid**. On any failure it simply re-PUTs its owned representation (bounded).
- Because transport is **unit-JSON-only** there is NO streamed multipart body to strip (the SW-strip failure mode DOES NOT EXIST), and because the PUT is **idempotent by uuid + hash-deduped**, a re-send is a no-op / same result — there is no partial/stripped state to reconcile.
- ⇒ Self-heal is not a handshake, it is a PROPERTY: an object owning its state + an idempotent unit-JSON transfer **cannot not self-heal** — reconciliation is the object re-sending itself. `design-upload-stranded-sw-selfheal.md` (a85ea536a) is SUPERSEDED.

## PRIORITIES (Tron) + requirement split for req (QUEUED — do not interrupt working agents)
- **PRIO 1: Slice-1 OOP (Node owns children-rendering) + R40.81 one-store.** R40.81 = the unit is the single canonical representation (one store); the unit-JSON-only wire is the same law (one representation, model==wire). Pull R40.81's convergence to prio 1.
- **PRIO 2: remaining slices — Folder / Room / File / Unit.** File/Unit are where `UnitConvertible` + binary-in-unit land; the natural classes (WebItem/Image/Email/Contact/CalendarEntry) build on File/Unit.
- **req requirement split (queued for lift):** (a) REST-unit-JSON transport — replace the upload POST with idempotent unit-JSON PUT; DELETE multipart/boundary route (defect class unconstructable). (b) binary-in-unit representation — base64-on-wire / content-ref+hash-dedup at rest; natural class owns toUnit/fromUnit. (c) natural classes + UnitConvertible interface — reuse WebItem 7c486fcb/Email 3bb26ebe, rename VCard→Contact bf440a63, mint Image+CalendarEntry. (d) self-heal-by-construction — idempotent-PUT-by-uuid; RETIRE the functional handshake req/ACs. (e) Slice-1 Node + R40.81 (prio 1); Folder/Room/File/Unit (prio 2). Scenario-first; I wire chains on build-go.

## ★★ REVISION 3 — CORRECTION: multipart is CONFINED to ONE ingress edge, not deleted (Tron 2026-09-06)
Tron VERBATIM: *"sure native files come as multipart binaries in but then become scenario units within the system."* This CORRECTS REVISION 2's "delete MultipartMime": the law is NOT "multipart never exists" — it is **multipart is legitimate at EXACTLY ONE PLACE, the INGRESS EDGE**, because a native OS file (Finder drag, file picker) genuinely arrives as a multipart binary and we do not control the outside world's format. At that edge it is converted IMMEDIATELY to a scenario unit; from that instant unit JSON is the ONLY thing transferred. **Multipart must NEVER propagate inward.**

**Neither delete it nor keep it as a general transport layer** — confine it:
- **ONE ingress boundary owner** (name it `NativeFileIngress`, not "MultipartMime" — it owns native-file ENTRY, not a mime family). Its ONLY job: **native file in → scenario unit out.** It owns the content-type PARAMETER parse — dequote boundary + strip params, the outage root — in ONE place, ONCE. It splits the multipart body, extracts bytes+type, then hands to `MimeType.from(type)` → the natural class → `toUnit()`. It emits a UNIT and nothing else.
- **Downstream of it + every OTHER transport (REST, drag buffer, federation) = unit JSON ONLY.** The in-app drag (existing unit/url) never touches multipart — it is unit JSON from the start (T37.20). Only the native-OS-file entry crosses the multipart edge, and only there.
- **The upload POST STAYS** — it IS the native-file ingress edge (a browser can only hand a Finder file as multipart FormData) — but it is now OWNED by `NativeFileIngress` + converts to a unit at the edge. It is NOT replaced by a unit-JSON PUT for native files (that would break Finder upload); it IS replaced for in-app content (which was never a native file). REVISION 2's "replace the upload POST" applies to IN-APP transfers, not the native-file edge.

**Outage fix PERMANENT by construction:** boundary parsing exists in EXACTLY ONE owned place (`NativeFileIngress`) instead of a `split('boundary=')` at a call site → it cannot regress or be duplicated. The boundary-only outage fix (shipping first) is the FIRST step of this — it hardens the parse in place; `NativeFileIngress` then MOVES it into the one owned home permanently. Aligned, not competing.

**GATE (revised, scan the HAZARD):** multipart / boundary / content-type-string handling ANYWHERE OUTSIDE `NativeFileIngress` == 0 (positional exception: inside the ingress owner only). Failable by seeding one boundary/content-type string op elsewhere → RED. One number proves multipart is confined to the edge by construction.

**Net model — ONE transport + ONE foreign-format ingress boundary (PO precision, fidelity to Tron's "transport IS the scenario. json… NOTHING ELSE"):** there is exactly **ONE transport = the scenario unit JSON** (drag buffer, REST, federation — all unit JSON). The native-file ingress multipart is **NOT a transport we own** — it is the EXTERNAL WORLD'S FORMAT, accepted at ONE boundary (`NativeFileIngress`) and converted to a unit immediately. Do NOT frame it as "a third transport": that framing re-legitimises per-format transports ("we already have three, what's a fourth?") — the exact thinking that produced the hand-rolled multipart that broke uploads for a week. So: **ONE transport (unit JSON) + ONE foreign-format ingress boundary**, and internally unit JSON only, always. Self-heal-by-construction + binary-in-unit (REVISION 2) unchanged. PRIO 1 remains Slice-1 OOP + R40.81; this natural-class/ingress design sits behind it.
