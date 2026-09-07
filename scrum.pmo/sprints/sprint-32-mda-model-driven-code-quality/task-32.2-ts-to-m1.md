<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 32.2: TS -> M1 generation from the TypeScript compiler base structures

[task:uuid:8559098a-4c96-48f7-b4c3-82d8048f5ad4]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [x] creating test cases
  - [x] implementing
  - [x] testing
- [x] QA Review
- [x] Done

## Traceability

  - up
    - [Sprint 32 Planning](./planning.md)
    - Requirement R32.2 `[requirement:uuid:4a9c6ee7-653f-4745-9d27-9540c5f95384]`
  - down
    - None (atomic task)

## Task Description

From the TS compiler API / AST, generate M1 scenario units for the TS base structures: class, interface, function, attribute, accessor+mutator (getter/setter = property), method (class member). Each generated M1 unit is instanceOf its M2 UML unit. ★ ACs are INITIAL (scenario-first per #126); the MDA-specific invariants (same-UUID-across-M-levels, PUML no-dup round-trip, action-sync) FINALIZE on architect (0.3) MDA-structure design - coordinating now. Chain (UC->Class->Method->Impl->Test) mints onto the built fix per the build order.

## Context

designRef: scrum.pmo/sprints/sprint-32-mda-model-driven-code-quality/PO-vision.md + design-mda-model.md

## Acceptance Criteria

- [ ] **(functional)** TsToModel.generate parses the TS compiler base structures (ts.createProgram + ts.forEachChild) and produces one M1 ior:class:ModelElement unit per TS structure, per the AST->M2 map: ClassDeclaration->class, InterfaceDeclaration->interface, FunctionDeclaration->function, MethodDeclaration->method (memberOf its class), PropertyDeclaration->attribute (memberOf its class), GetAccessor+SetAccessor of the SAME name->ONE property (accessor+mutator paired; memberOf its class), TypeAliasDeclaration->type. A class's members[] = its methods + attributes + properties (composition; reverse memberOf). Built on the R32.1 foundation (REUSE ModelElement / TraceModel / ModelValidator, no fork).
- [ ] **(invariant)** Each generated M1 unit is instanceOf its correct M2 metaclass with MULTI-FACET instanceOf [model facet, code facet] (per R32.1): class->[UmlClass, ts-class-code], interface->[UmlInterface, ts-interface-code], function->[UmlFunction, ts-function-code], method->[UmlMethod, ts-method-code], attribute->[UmlAttribute, ts-attribute-code], property->[UmlProperty, ts-property-code], type->[UmlType] (+ a small seed add of the ts-type-code M2 unit). One-level-up M1->M2 level-integrity holds by construction (ModelValidator gate 2 passes).
- [ ] **(invariant)** The M1 unit UUID is DERIVED DETERMINISTICALLY from the stable identity key `<repo-relative sourceFile> :: <qualifiedName>` (class/interface/function/type = path::Name; member = path::ClassName.memberName; a get/set PAIR shares one key = one property) as a v4-shaped sha256 (the existing scripts/migrate-to-scenario.ts:245 pattern) - NOT random-minted. Re-parsing unchanged TS -> SAME key -> SAME uuid -> ModelValidator.bindByUuid RE-BINDS, never re-mints = idempotent 0-churn re-run (the R32.1/R31.13 discovered-code law). Rename/move = a new key = a new element; the old uuid, now absent from source, is reconciled (delete/tombstone).
- [ ] **(meta)** Typed members resolve (ts TypeChecker / type-node identifier) to typed relationships carrying their M2 type: a typed attribute/property -> `X.relatesTo += Y` instanceOf UmlAssociation (reverse relatedFrom on Y); extends/implements -> UmlGeneralization; a method param/return of another modeled type -> UmlDependency. Post-generation, ModelValidator.validate(generated) = 0 violations (M1->M2 level-integrity, instanceof-nonempty, uuid-unique all hold by construction). The chain mints onto the built TsToModel.generate (Class/Method/Impl/Test), same IMPL-MINT pattern as R32.1.

## Subtasks

None (atomic task).
