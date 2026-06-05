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

---

## LITERAL SOURCE — Follow-on A: Widen scenario vs trace distinction (2026-06-05)

> TRON: "widen it to the scenario browser as a tree but the traceability browser as tree chains with only one child traced"

### R18.5: Scenario browser renders a full tree (all children at every node); traceability browser renders tree CHAINS with only the one traced child per node.

[requirement:uuid:18e5f6a7-b8c9-4d04-8ab5-000000018005]

The scenario-vs-trace distinction from R18.1 (method scope) WIDENS to the entire tree, not just the Class→Method level. At EVERY node in the traceability browser, only the ONE child that is in the current requirement's traced chain is shown — not all children. The scenario browser continues to show the full tree with all children. This means: a Requirement in /trace shows only the one Task in this chain (not all tasks it links to). That Task shows only the one UseCase in this chain. That UseCase shows only the one Class. That Class shows only the one Method. The chain is a single thread from root to leaf. The scenario browser remains a full tree.

**Acceptance criteria:**
- [ ] /scenario tree: every node shows ALL its forward children (unchanged)
- [ ] /trace tree: every node shows ONLY the one child that continues the traced chain to a Test
- [ ] A Requirement with 3 Tasks shows 1 Task in /trace (the one in the current chain)
- [ ] The trace chain is a single thread: req → 1 task → 1 UC → 1 class → 1 method → 1 impl → N tests

→ T187 (widen scope)

---

## LITERAL SOURCE — Follow-on B: Tree re-renders fully on click / scroll jumps to top (2026-06-05, BUG)

> TRON: "the tree is rendered on each click fully and not lazy by layer on expand, only adding itemview levels. in the long list it always jumps back to the top. thats cumbersome"

### R18.6: Tree expands by APPENDING child item-view levels to the existing DOM — no full re-render.

[requirement:uuid:18f6a7b8-c9d0-4e15-9bc6-000000018006]

Currently, expanding a tree node causes the entire tree to re-render (full innerHTML replacement or equivalent). This must change to incremental DOM append: clicking expand on a node inserts child `<rb-object-item>` elements BELOW that node in the existing DOM. No other nodes are touched. No full tree rebuild. This is the standard lazy-render pattern: each expand adds one layer of children, preserving all existing rendered nodes.

### R18.7: Tree preserves scroll position on expand/collapse — no jump to top.

[requirement:uuid:18a7b8c9-d0e1-4f26-8cd7-000000018007]

After expanding or collapsing a tree node, the scroll position of the tree container MUST remain at the same visual position. The user must not be forced to scroll back down to find the node they just expanded. If the expand causes the tree to grow taller, the scroll position stays at the expanded node. If it causes the tree to shrink (collapse), the scroll stays at or near the collapsed node.

**Acceptance criteria (R18.6 + R18.7 combined):**
- [ ] Expanding a node appends children below it without re-rendering sibling/parent nodes
- [ ] Collapsing a node removes children without re-rendering sibling/parent nodes
- [ ] Scroll position is preserved after expand (user does not jump to top)
- [ ] Scroll position is preserved after collapse
- [ ] In a tree with 100+ nodes, expanding node #50 does not cause visible flicker or re-layout of nodes #1-#49
- [ ] Performance: expand/collapse is instant (no perceptible delay from re-render)

→ New bug task (planner stand-up)

---

## LITERAL SOURCE — Follow-on C: Browser root structure (2026-06-05)

> TRON: "from my perspective the sprint.json with list of tasks should be in both cases the top. each task holding all atomic requirements covered as children and then either scenario tree or traceability chain from the atomic requirements down to the tests."

### R18.8: Both /scenario and /trace browsers root at Sprint → Tasks → atomic Requirements, then branch scenario-full or trace-chain from each Requirement down to Tests.

[requirement:uuid:18b8c9d0-e1f2-4a3b-5c6d-000000018008]

The tree root structure for BOTH browsers is:

```
Sprint (top — list of tasks)
  └── Task (each task in the sprint)
        └── Requirement (atomic requirements this task COVERS — as children)
              └── [/scenario]: full tree (UC → Class → all Methods → Impl → Tests)
                  [/trace]: single chain (UC → Class → 1 Method → 1 Impl → N Tests)
```

This means: (1) Sprint is the root node in both browsers. (2) Tasks are first-level children. (3) Each Task shows the atomic requirements it covers as second-level children. (4) From each Requirement, the tree branches into either full scenario tree or narrowed trace chain.

**ARCHITECT NOTE:** "Task covers requirements" (Task showing Requirements as children in the navigation view) is a NAVIGATION relationship — the tree shows which requirements a task is responsible for. This is DISTINCT from the forward traceability chain (Requirement.tasks[] → forward link). The chain direction is still Requirement → Task. But the TREE DISPLAY inverts this for navigation: Sprint → Task → its Requirements → then forward from each Requirement. The data model does NOT change — no back-refs added. The tree renderer walks Requirement.tasks[] and groups by task for display purposes.

**Acceptance criteria:**
- [ ] Both /scenario and /trace trees root at Sprint
- [ ] First-level children are Tasks of that sprint
- [ ] Second-level children (under each Task) are the atomic Requirements the task covers
- [ ] From each Requirement, the tree continues with the scenario or trace chain
- [ ] The data model remains forward-only (Requirement.tasks[] is the source of truth for grouping)
- [ ] No Task.requirements[] back-ref field is introduced — the renderer walks all Requirements and groups by their tasks[] forward link

→ Planner folds into T187 or new navigation-structure task
