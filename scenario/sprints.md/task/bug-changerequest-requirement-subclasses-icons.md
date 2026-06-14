# T-bug-changerequest-oop-extensions: Bug + ChangeRequest as Requirement subclasses with own icons
[task:uuid:b1c93799-9fd6-4c8a-b006-f8e0822d128a]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect — OOP class design Bug/ChangeRequest extends Requirement + icon map + PUML)
  - [ ] creating test cases (tester — write RED subtype+icon+chain E2E FIRST)
  - [ ] implementing (expert — class registry + icon-map + rb-object-item icon resolution)
  - [ ] testing (tester — RED→GREEN E2E + screenshot)
- [ ] QA Review
- [ ] Done

## Traceability

**UseCases:**
- [🔗 requirement.classifyType](../usecase/requirement-classifytype.md)


## Task Description

R20.4 (S20, traceability-first): Bug and ChangeRequest become OOP EXTENSIONS of Requirement — ior:class:Bug extends ior:class:Requirement, ior:class:ChangeRequest extends ior:class:Requirement. They trace through the SAME 6-step chain (Req→UC→Class→Method→Impl→Test) but are distinctly typed, each a std scenario unit in the index with its OWN icon in rb-object-item (distinct from the Requirement icon). intendedChain (for architect to canonicalize + PUML): UseCase=requirement.classifyType; Class=Requirement (+ Bug/ChangeRequest subclasses); Method=icon resolution per ior:class subtype + scenario-unit creation with subtype ior; Implementation=ior:class:Bug + ior:class:ChangeRequest in class registry + icon-map entry per subtype + rb-object-item resolves icon from ior:class; Test=RED: create Bug unit→assert ior=ior:class:Bug + Bug icon; create ChangeRequest→distinct icon; both trace through full chain; currently FAILS (neither class exists). S20 DISCIPLINE: full chain designed + Test FIRST; UI → Playwright+screenshot gate; nothing ships chain-open. RELEASE → v0.6.3 + git tag. NOTE: architect designs the OOP class hierarchy + icon map.

## Subtasks


