# Complete M2 metamodel of File — UML · TS · PUML, consistent BY CONSTRUCTION (robbin-architect, 2026-09-13)

Tron: "i want a complete m2 metamodel of file as Uml m2 ts m2 and puml m2… complete consistent and MVC!!!!" + "where is the UmlClass File where are all the other model elements for File… the interfaces and all the overhead." Design-only, top-down, radical-OOP. ★ file-unit.ts is UNTOUCHED (Tron: "leave file-unit.ts allone!!!") — zero-migration, the old functional module coexists beside the clean class. T41.2 Folder BLOCKED until Tron QA-approves File.

## Measured — what EXISTS vs what the metamodel REQUIRES (gaps named)
- **SOURCE exists:** `src/ts/scenario/file.ts` (the clean class) — `FileModel { uuid, origin?, name?, mimeType? }` (attributes) + methods `ownIor / renderSelf / moveTo / displayName / iconToken`; collaborator `ior.ts` (`Ior` value-object: `for`, `toString`). References `Ior` (uses) and `Folder` (moveTo target).
- **DERIVATION TOOLING exists (REUSE, no fork):** `TsToModel` (TS→model units) + `puml-serializer.ts` / `generator.ts` (model→PUML). The pipeline already exists; this wires File through it.
- **M2 VOCABULARY exists:** UmlClass `a1d2e3f4-…-003`, UmlAttribute `…-005`, UmlMethod `…-006`, UmlInterface `…-004`, UmlAssociation `…-010` (fleet has 277 UmlAttribute-typed + 143 UmlMethod-typed MEs — the pattern is used everywhere, just NOT for File).
- ★ **GAP 1 — no real UmlClass File:** only 3 EMPTY lowercase "file" stubs (metaLevel M1, **0 members, ownerIor=null**) = exactly Tron's complaint. File's UmlAttribute/UmlMethod/UmlInterface/UmlAssociation members DO NOT EXIST as units.
- ★ **GAP 2 — no File PUML** (0 file*.puml).
- ★ **GAP 3 — TS not wired as the derivation source** for File's M2 (TsToModel doesn't yet derive File's UML units from file.ts).
- ★ **GAP 4 — UmlInterface: File implements NONE today (MEASURED, PO-ruled: do NOT fabricate, do NOT block).** Completeness = "every element that EXISTS is represented", NOT "every metamodel slot filled" — so the derived metamodel correctly shows File with NO interface. ★ UnitConvertible measurement (Tron: "the interfaces… you INVENTED" — checking if he points at this): `UnitConvertible` IS a declared TS interface (public/ts/mime/unit-convertible.ts, marker 031ca481) = `{ isBinary(): boolean; load(raw): Promise<void>|void; toUnit(): ScenarioUnitJSON }`. **File does NOT structurally satisfy it** — File has none of isBinary/load/toUnit (its methods are ownIor/renderSelf/moveTo/displayName/iconToken). So `implements UnitConvertible` is NOT a real missing element (File does not behave as one) — adding it would be FABRICATION. If Tron WANTS File to be unit-convertible, that is a BEHAVIOR-ADD to File (gain the 3 methods) = HIS call under R12, not a derivation gap; the metamodel would then derive the realization automatically. Reported to PO to surface as a named candidate, never a fabricated element.
- 3 stubs COEXIST (zero-migration, untouched); the derived UmlClass File is the real one (duplicate-risk named+accepted).

## SOURCE OF TRUTH + DERIVATION — the CENTRAL "consistent by construction" (never three hand-copies)
**SOURCE = the TS class (`file.ts` + `ior.ts`).** The executable class IS the File (code = the class, radical-OOP); it is the ONE authored representation. The other two are DERIVED, never hand-maintained:
- **UML M2 (derived):** `TsToModel` derives from file.ts → a UmlClass `File` (metaLevel M1, instanceOf UmlClass `…-003`, ownerIor=Tron, fully-qualified IOR) with members: UmlAttribute per `FileModel` field, UmlMethod per method, UmlAssociation per reference (File→Ior uses, File→Folder move-target); + the `Ior` UmlClass (methods for/toString). ★ **THE DERIVED UmlClass File IS THE TRUTH** — the 3 empty lowercase "file" stubs (0 members, null owner) are NOT the real class; they coexist only as untouched legacy (zero-migration). No future reader should re-point to a stub: the real File UmlClass is the one DERIVED from file.ts (owned, populated, fully-qualified IOR). A gate could assert "the owned+populated UmlClass File is the referenced one" if stub-confusion ever recurs.
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
4. The derived UmlClass File carries ownerIor=Tron + its real members + is FQ-ADDRESSABLE (NOT the 0-member null-owner stub). ★ FQ-IOR shape for an M1 metamodel unit (expert inc-1 Q, ruled 2026-09-13): the M1 UmlClass unit is a `ior:class:ModelElement` that DESCRIBES File — it is NOT a File instance, so its FQ-IOR uses class-token **`ModelElement`** (its OWN ior:class), NEVER `File` (a File-token would be the M0-instance shape = a category error). And the FQ-IOR is **COMPOSED not STORED**: `Ior.for('ModelElement', origin, uuid)` on demand — do NOT store a `selfIor` field on the M1 unit (compose-not-store, per the Ior value-object principle; a stored derived IOR is stored-derived drift). So "fully-qualified IOR" here = FQ-ADDRESSABLE-as-a-ModelElement (owned + populated + composable), the property that distinguishes the real derived unit from the null-owner empty stub. (The M0-instance FQ-IOR `ior:class:File:rest:<origin>/scenario/<uuid>` — class-token File — is composed by `File.ownIor()` at the instance layer; GUARD#2 applies there.)
5. Model purity: 0 glyph/DOM/file-format in the M2 model units (presentation lives only in the view adapter).

## Method-set (to expert — all REUSE existing tooling; file-unit.ts UNTOUCHED)
- `TsToModel.deriveClassM2(file.ts)` (extend TsToModel) → the UmlClass File + members from the TS source.
- `puml-serializer.classM2Puml(units)` (extend puml-serializer) → file.puml from the UML units.
- gate `check-file-m2-consistency.ts` (ci:gates) → re-derive + element-for-element diff across TS/UML/PUML + diagram-renders-all + stub-must-fail.
- `openDiagram` action (controller, on class File) → renders the diagram view of the M2 (thin adapter; reuse the existing diagram render).

## ★ UmlMethod = REFERENCE the chain Method units, NOT dup (ruled 2026-09-13, req Q)
A Method IS-A UmlMethod → M2 `UmlClass File.methods[]` REFERENCES the existing `ior:class:Method` chain-units (renderSelf 3feca893 / moveTo 3500d960 / ownIor 8d5a11e6); do NOT mint parallel `ModelElement instanceOf UmlMethod` units (that = the dup disease Sprint 41 deletes — 2 units for one method). The re-derive+diff gate binds it: TsToModel derives the method SET from file.ts and RESOLVES to the canonical Method unit (by name/sig), and the gate asserts TS-set == UmlClass.methods[] element-for-element (no drift). **Attributes-asymmetry is PRINCIPLED:** attributes have no prior traceability unit → mint fresh ModelElement-instanceOf-UmlAttribute; methods have chain units → reference them. INVARIANT = NO-DUP: mint a fresh ModelElement ONLY when there is no canonical unit to reference. (Optional formal typing: add `instanceOf:[UmlMethod-006]`+`memberOf:[UmlClass File]` to the SAME Method unit — still no dup — not required for the reference to hold.) displayName/iconToken: model ONLY methods file.ts actually has (derived, not fabricated); iconToken is real (surface-convention) → mint its chain Method ONCE then reference; displayName → verify it is a distinct method before modeling.

## Coordination
req mints the requirement + UCs + the element chain (from THIS note); I refine the derivation/gate shape + the MVC boundary; expert builds (extending TsToModel + puml-serializer + the gate + open-diagram), file-unit.ts UNTOUCHED. Report the design commit to PO.
