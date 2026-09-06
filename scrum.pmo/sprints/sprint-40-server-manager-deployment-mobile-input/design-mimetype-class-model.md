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
