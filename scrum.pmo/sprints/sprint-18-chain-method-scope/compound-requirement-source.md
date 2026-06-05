# Sprint 18 — Traceability Chain Method-Scope & Role Skills — TRON LITERAL SOURCE

**Source:** Tron, chat, 2026-06-05. Captured VERBATIM by robbin-po. Tron-assigned: the three (architect + req-eng + planner) analyze + plan jointly. NEW: this sprint is to be created as scenario.json FIRST, then sprint/task MDs generated from it (dogfood S17). DO NOT paraphrase the source.

---

## LITERAL SOURCE (verbatim)
> i agree. lets add another perspective. classes have All methods in the traceability chain. this is very good for the overall scenario browser! but on the traceability browser it needs to be only exactly the one method, that fulfills the current requirement town to the test that tests it. let the three analyze also this difference and start to plan a new sprint as scenario.json first and then generate the sprint and task mds from it. let them try to co-specify this as Skills for their roles.

---

## Decomposition hints (for req — confirm against literal; NOT authoritative)
- **R18.1 Two distinct views of a Class's methods:**
  - **Scenario browser** = shows ALL methods of a class (full object model) — KEEP, it is good.
  - **Traceability browser** = shows ONLY the exactly-one method that fulfills the CURRENT requirement, down to the test that tests it. NOT all class methods.
- **R18.2 Chain-through-Class narrowing:** when the traceability chain passes through a Class, it must narrow to the single requirement-fulfilling Method (req → … → Class → THE one Method → Impl → the Test that tests it), not fan out to every method of the class.
- **R18.3 Sprint born as scenario.json first:** the new sprint + its tasks are authored as scenario.json units (S17 model) FIRST; the planning.md + task-*.md are GENERATED from those units (R17.7-R17.10 view generation). Dogfood the S17 system.
- **R18.4 Role Skills co-specification:** the three roles co-specify their refinement protocols (the precedence + decomposition + chain-vs-dependency rules from refinement-precedence-analysis.md) as SKILL.md files for their roles — durable, reboot-surviving role skills.

## Process
- Tron-assigned: architect + req-eng + planner ANALYZE the all-methods (scenario) vs one-method (traceability) difference together, then PLAN Sprint 18 — scenario.json units first, MDs generated. Co-specify role Skills. Report conclusion to Tron via PO.
