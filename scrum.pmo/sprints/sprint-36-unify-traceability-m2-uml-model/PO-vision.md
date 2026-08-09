# Sprint 36 — Unify Traceability Units with the M2 UML/TS Model (views of ONE ScenarioUnit)

**Tron directive (2026-08-05):** "bring these better together." The traceability units (UseCase, Class, Method) and the M2 model elements (UmlUseCase, UmlClass/tsClass, UmlMethod/UmlFunction/tsMethod) should be UNIFIED — the UML/TS elements are TYPED OOP EXTENSIONS / VIEWS of the SAME underlying ScenarioUnit, NOT duplicates. Follows the R35.4 "landed well" traceability folder.

PO VISION SEED — scenario-first. Architect owns the design (OOP-extension/projection model, view mechanism, usage-reference tracking, drag-to-diagram, UmlTraceRelationship, Method-vs-Function) = the sprint's main design work. req formalizes R36.x + UUIDs/UCs; expert builds against units. NO impl before units (#126). Tron-directed → Sprint 36. Existing types on disk: Class/Method/UseCase/Implementation/Test/Requirement/Sprint/Diagram/PumlArtifact/ModelElement/TraceLink. NEW (this sprint): UmlUseCase/UmlClass/tsClass/UmlMethod/UmlFunction/tsMethod/UmlTraceRelationship.

## CORE PRINCIPLE (cross-cutting, DRY)
A **ScenarioUnit is the ONE source of truth on disk** (index). M2 elements are **typed OOP extensions / VIEWS** of that same unit — a NEW view/perspective/reference, NEVER a copy. Each unit is a typed OOP-extended ScenarioUnit on disk tracking its **usage references** (where it appears in diagrams / links in folders). Reuse the existing scenario-unit model + ModelElement/Diagram/TraceLink — do NOT re-fork (the R35.4/DRY lesson).

## Requirement decomposition (PO ACs — req to formalize; architect designs the mechanism)

### R36.1 — UmlUseCase extends UseCase (new view of the same scenario)
- NEW `UmlUseCase` type that EXTENDS the existing `UseCase` ScenarioUnit (typed OOP extension, not a duplicate).
- Drag-and-drop onto a diagram → renders a UML use case built from ALL the UseCase's existing model data (a new VIEW for the same scenario).
- A new reference FROM the scenario's perspective: the UseCase unit tracks WHERE it is used (diagrams it's placed on, folder links).
- Note: UseCases are mainly `Class.method` / `Object.verb` decompositions of the class, tracing to a method (R36.4).

### R36.2 — UmlClass + tsClass extend Class
- `UmlClass` (UML view) + `tsClass` (TypeScript view) EXTEND the existing `Class` ScenarioUnit.
- Draggable onto diagrams; render from the Class's model data; track usage references. Two projections of the ONE Class unit.

### R36.3 — Method enrichment + Method-vs-Function + Uml/ts projections
- ENRICH the `Method` ScenarioUnit with a FULL SIGNATURE: visibility (public/private/protected), name(parameters...), return, and documentation (oosh-style).
- **Method ≠ Function:** a Method MUST have a Class as parent; a Function has no class parent. A Function CAN be converted to a Method; a Method→Function is hard (attribute/state access differs) — model this distinction.
- Projections: `UmlMethod` / `UmlFunction` + `tsMethod` (typed extensions of the enriched Method/Function).

### R36.4 — UmlTraceRelationship (typed, RawBin-specific)
- NEW `UmlTraceRelationship` type — a typed relationship, NOT exactly UML 2.5+; RawBin-specific semantics (decomposition/trace: UseCase = Class.method/Object.verb → traces to a Method).
- Each endpoint stays a typed OOP-extended ScenarioUnit on disk tracking usage references. (May extend/relate to the existing TraceLink — architect decides.)

### R36.5 — Scenario/Edit always open the correct ScenarioUnit + usage-reference tracking
- For EVERY projected view/element, the ◆Scenario + ✎Edit buttons carry the info to open the CORRECT underlying ScenarioUnit in the editor (the unit the view projects).
- Each unit tracks its usage references / back-references (which diagrams it's on, which folders link it) — queryable "where is this used."

## Suggested build order (architect/planner to confirm)
1. MODEL FOUNDATION: typed OOP-extension base (Uml*/ts* extend the existing units) + usage-reference tracking + R36.5 Scenario/Edit-opens-correct-unit (wire the buttons to the underlying unit).
2. R36.3 Method enrichment (signature + Method/Function) — underpins the projections.
3. R36.1/R36.2/R36.3 projections (UmlUseCase/UmlClass/tsClass/UmlMethod/tsMethod) + drag-onto-diagram render.
4. R36.4 UmlTraceRelationship.

## Gate posture (real-WebKit @390, per S35)
- Each new type is a typed ScenarioUnit ON DISK in the index (not a runtime-only view) — gate: the unit exists on disk, extends its base, tracks usage.
- Drag-onto-diagram: the view renders from the unit's data @390; ◆Scenario/✎Edit open the CORRECT underlying unit (gate the actual open-target, not presence).
- DRY: verify the view reuses the ONE unit (no duplicate data); usage-reference is bidirectional (unit ↔ diagram/folder).
- All chain-to-Test; verify Impl.tests[] on disk before flip.
