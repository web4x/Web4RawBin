# Complete M2 metamodel of File — UML · TS · PUML, consistent BY CONSTRUCTION (robbin-architect, 2026-09-13)

Tron: "i want a complete m2 metamodel of file as Uml m2 ts m2 and puml m2… complete consistent and MVC!!!!" + "where is the UmlClass File where are all the other model elements for File… the interfaces and all the overhead." Design-only, top-down, radical-OOP. ★ file-unit.ts is UNTOUCHED (Tron: "leave file-unit.ts allone!!!") — zero-migration, the old functional module coexists beside the clean class. T41.2 Folder BLOCKED until Tron QA-approves File.

## Measured — what EXISTS vs what the metamodel REQUIRES (gaps named)
- **SOURCE exists:** `src/ts/scenario/file.ts` (the clean class) — `FileModel { uuid, origin?, name?, mimeType? }` (attributes) + methods `ownIor / renderSelf / moveTo / displayName / iconToken`; collaborator `ior.ts` (`Ior` value-object: `for`, `toString`). References `Ior` (uses) and `Folder` (moveTo target).
- **DERIVATION TOOLING exists (REUSE, no fork):** `TsToModel` (TS→model units) + `puml-serializer.ts` / `generator.ts` (model→PUML). The pipeline already exists; this wires File through it.
- **M2 VOCABULARY exists:** UmlClass `a1d2e3f4-…-003`, UmlAttribute `…-005`, UmlMethod `…-006`, UmlInterface `…-004`, UmlAssociation `…-010` (fleet has 277 UmlAttribute-typed + 143 UmlMethod-typed MEs — the pattern is used everywhere, just NOT for File).
- ★ **GAP 1 — no real UmlClass File:** only 3 EMPTY lowercase "file" stubs (metaLevel M1, **0 members, ownerIor=null**) = exactly Tron's complaint. File's UmlAttribute/UmlMethod/UmlInterface/UmlAssociation members DO NOT EXIST as units.
- ★ **GAP 2 — no File PUML** (0 file*.puml).
- ★ **GAP 3 — TS not wired as the derivation source** for File's M2 (TsToModel doesn't yet derive File's UML units from file.ts).
- ★ **GAP 4 — UmlInterface: File implements NONE today.** If the clean-class kernel defines a Model/`UnitConvertible` interface File should implement, that is an element to add — FLAGGED (do not invent an interface with no behavior; if File genuinely implements one, model it; else state "none yet" honestly rather than fabricate "overhead").
- 3 stubs COEXIST (zero-migration, untouched); the derived UmlClass File is the real one (duplicate-risk named+accepted).

## SOURCE OF TRUTH + DERIVATION — the CENTRAL "consistent by construction" (never three hand-copies)
**SOURCE = the TS class (`file.ts` + `ior.ts`).** The executable class IS the File (code = the class, radical-OOP); it is the ONE authored representation. The other two are DERIVED, never hand-maintained:
- **UML M2 (derived):** `TsToModel` derives from file.ts → a UmlClass `File` (metaLevel M1, instanceOf UmlClass `…-003`, ownerIor=Tron, fully-qualified IOR) with members: UmlAttribute per `FileModel` field, UmlMethod per method, UmlAssociation per reference (File→Ior uses, File→Folder move-target); + the `Ior` UmlClass (methods for/toString).
- **PUML M2 (derived):** `puml-serializer` derives `file.puml` from the UML units (class File { attributes; methods } + associations).
- **PIPELINE:** `TS --TsToModel--> UML units --puml-serializer--> PUML`. TS is authored; UML + PUML are REGENERATED, so they cannot drift (the MD-is-a-generated-VIEW law applied to the metamodel).
- **PROOF they agree ELEMENT-FOR-ELEMENT (the gate — this is what makes it by-construction, not by-diligence):** a gate re-derives UML from TS and PUML from UML, then asserts **every TS element (each FileModel attribute, each File/Ior method, each association) appears in the UML units AND in the PUML** — an element missing from ANY of the three ⇒ **RED**; and **the diagram renders EVERY modeled element (no silent omission)**. Same defect class as the dual status-source / two-trees / free-fn duplicate that all drifted-by-convention today; the derivation-plus-diff kills it.

## MVC (reuse the clean-class + thin-adapter shape already ruled — do NOT invent a parallel)
- **MODEL** = the M2 element set (DATA: the UML units + the TS FileModel/methods). NO glyph, NO DOM, NO file-format in the model — that leak is closed (inc-2 icon-token) and STAYS closed here.
- **VIEW** = the PUML text AND the on-screen diagram (rendered from the UML units via a thin surface adapter — like the icon token→glyph adapter).
- **CONTROLLER** = the actions: **'open diagram'** (renders the diagram VIEW of this M2 — ABSORBED here; the diagram IS the view of the metamodel) + File's own actions (moveTo, …).

## Element list (to req — the derivation ENUMERATES from TS; current concrete set)
- **UmlClass:** File. **Collaborator UmlClass:** Ior.
- **UmlAttribute ×4:** uuid, origin, name, mimeType (every `FileModel` field).
- **UmlMethod ×5:** ownIor, renderSelf, moveTo, displayName, iconToken (+ Ior: for, toString).
- **UmlAssociation/Dependency:** File→Ior (uses), File→Folder (moveTo target).
- **UmlInterface:** none today — GAP 4 flagged (add only if File genuinely implements one; do not fabricate).
(The list is DERIVED, not hand-maintained — as File's TS gains/loses a field/method, the derivation + gate keep all three in sync.)

## Failable ACs (to req)
1. Every File element (each attribute/method/association) present in ALL THREE representations (UML unit + TS + PUML) — missing from ANY ⇒ RED.
2. The diagram renders EVERY modeled element — a silent omission ⇒ RED.
3. Consistency-by-construction: the gate re-derives UML-from-TS + PUML-from-UML and diffs element-for-element; any drift ⇒ RED (stub the derivation → RED).
4. The derived UmlClass File carries ownerIor=Tron + a fully-qualified IOR + its real members (NOT the 0-member null-owner stub).
5. Model purity: 0 glyph/DOM/file-format in the M2 model units (presentation lives only in the view adapter).

## Method-set (to expert — all REUSE existing tooling; file-unit.ts UNTOUCHED)
- `TsToModel.deriveClassM2(file.ts)` (extend TsToModel) → the UmlClass File + members from the TS source.
- `puml-serializer.classM2Puml(units)` (extend puml-serializer) → file.puml from the UML units.
- gate `check-file-m2-consistency.ts` (ci:gates) → re-derive + element-for-element diff across TS/UML/PUML + diagram-renders-all + stub-must-fail.
- `openDiagram` action (controller, on class File) → renders the diagram view of the M2 (thin adapter; reuse the existing diagram render).

## Coordination
req mints the requirement + UCs + the element chain (from THIS note); I refine the derivation/gate shape + the MVC boundary; expert builds (extending TsToModel + puml-serializer + the gate + open-diagram), file-unit.ts UNTOUCHED. Report the design commit to PO.
