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

---

## LITERAL SOURCE — Follow-on D: Champagne intention verification (2026-06-05, NEW STANDARD)

> TRON: "let the team eat its own dogfood and verify if the tests test the right thing by verifying the trace chain intention per chain. this is what its all about!!! convert eat your own dogfood into drink your own champagne and become the best programming team in the world."

### R-CHAMP: For every complete chain in /trace, the leaf test verifies the behavioral intention of the root requirement.

[requirement:uuid:a0b1c2d3-e4f5-6a7b-8c9d-champ0000001]

Not just that the test passes — but that it tests THE RIGHT THING. Per-chain intention verification: req-eng reads the requirement, follows the chain to the test, and asks "if this test passes, can I tell Tron this requirement is satisfied?" Four verdicts: CHAMPAGNE (correct), FLAT (wrong intent), CORK (stub), EMPTY (no test).

Full standard: `scrum.pmo/standards/champagne-intention-verification.md`

→ Standing process (not a single task — applies to every sprint completion)

---

## LITERAL SOURCE — Follow-on E: Eliminate chain cycles + lazy-load one layer (2026-06-05, BUG)

> TRON: "these cases [T123↔R16.4 infinite cycle in trace tree] have to completely be eliminated. also lazy loading just the next layer would prevent the issue here."

### R18.9: Chain cycles are completely eliminated — forward-only traversal with cycle guard.

[requirement:uuid:18c9d0e1-f2a3-4b5c-6d7e-000000018009]

The trace tree currently exhibits infinite cycles when a Task and Requirement reference each other (T123↔R16.4 observed). ALL cycles in the traceability chain must be eliminated. The chain walker must enforce strict forward-only traversal: requirement → task → UC → class → method → impl → test. A visited-set cycle guard must prevent any node from being expanded twice in the same chain path. If a cycle is detected, the node renders as a leaf with a cycle indicator — it does NOT recurse.

**Deduplication check:** R-F (data quality, zero backward chaos) and B18 (forward-only) cover the DATA direction. R18.9 covers the RUNTIME traversal — the tree walker must guard against cycles even if the data has them. Different layer — genuinely new.

**Acceptance criteria:**
- [ ] No infinite expansion in the trace tree (T123↔R16.4 cycle resolved)
- [ ] Visited-set guard: a node appearing twice in the same path stops expansion
- [ ] Cycle detected → node rendered as leaf with visual indicator (e.g. ⟳ icon)
- [ ] Forward-only chain types enforced: requirement can only expand to tasks, task to UCs, etc.

### R18.10: Tree lazy-loads only the NEXT layer per expand — not the full subtree.

[requirement:uuid:18d0e1f2-a3b4-5c6d-7e8f-000000018010]

Each expand click loads ONLY the immediate children of the clicked node — one layer deep. It does NOT recursively load grandchildren or the full subtree. This prevents the cycle issue (a cycle cannot recurse if only one layer loads at a time) and keeps the tree responsive. The user must explicitly click to expand each successive level.

**Deduplication check:** R18.6 covers DOM append (no full re-render). R-Y1/R-V1 cover lazy-load data fetch at every depth. R18.10 is the DEPTH LIMIT per expand — only one layer, not recursive. Complements R18.6 and R-Y1 but is a distinct constraint.

**Acceptance criteria:**
- [ ] Expanding a node fetches and renders only its immediate children (depth=1)
- [ ] Grandchildren are NOT fetched until the user expands a child node
- [ ] Even if data contains deep nesting, only one layer appears per click
- [ ] Combined with R18.9 cycle guard: cycles cannot recurse because only one layer loads

→ New bug task (planner stand-up — cycle elimination + single-layer lazy-load)

---

## LITERAL SOURCE — Follow-on F: Cycle guard too aggressive + visible cut artifact (2026-06-05, BUG)

> TRON: "cycle stopped but also correct children got cut out. user does not want to see the cut out cycle."

### R18.11: Cycle guard is ancestor-path-precise — only break true ancestor cycles, preserve all legitimate children including DAG re-convergence.

[requirement:uuid:18e1f2a3-b4c5-6d7e-8f90-000000018011]

The R18.9 cycle guard uses a visited-set that is too broad: it cuts ANY node that has been seen before, including legitimate DAG re-convergence (a Class reached from two different UseCases is a valid repeated node, not a cycle). The guard must track only the CURRENT ANCESTOR PATH (root → ... → parent → this node), not a global visited set. A node is a true cycle ONLY if it appears as its OWN ancestor in the current expansion path. A node that appears in a SIBLING branch is legitimate re-convergence and must NOT be cut.

**Acceptance criteria:**
- [ ] A Class appearing under two different UseCases is shown in BOTH (DAG re-convergence preserved)
- [ ] A Requirement appearing as its own descendant (req→task→...→req) IS cut (true cycle broken)
- [ ] The cycle check compares against the ancestor stack, not a global set
- [ ] Expanding the same node in two different branches shows children in both

### R18.12: True-cycle nodes are omitted cleanly — no visible cut artifact shown to the user.

[requirement:uuid:18f2a3b4-c5d6-7e8f-9a0b-000000018012]

When a true cycle IS detected (a node is its own ancestor), the cyclic node is simply NOT rendered — no ⟳ icon, no "cycle detected" label, no placeholder. The tree silently terminates at the parent. The user sees a normal leaf node with no indication that a cycle was suppressed. Tron: "user does not want to see the cut out cycle."

**Acceptance criteria:**
- [ ] True-cycle nodes are omitted entirely from the rendered tree
- [ ] No cycle icon, label, or placeholder visible to the user
- [ ] Parent node of a suppressed cycle appears as a normal leaf (no expand arrow if its only children would be cyclic)
- [ ] If a node has BOTH legitimate children AND a cyclic child, only the legitimate children render

→ T193 (new task — T192 closed per Rule 8 closure freeze)

---

## LITERAL SOURCE — Follow-on G: Chain must end in Test, not loop to Task (2026-06-05, BUG)

> TRON: "the picture shows where the traceability goes wrongly into tasks. double check if this a logic or data quality issue. all chains must end in a test."

### R18.13: Every traceability chain terminates in a Test — no chain may end on or loop back into a Task or Requirement.

[requirement:uuid:18a3b4c5-d6e7-8f90-1a2b-000000018013]

The /trace tree shows chains that go from Method→Implementation and then back INTO Tasks or Requirements instead of continuing to Tests. This is either: (a) a LOGIC bug — the chain walker follows a wrong forward-link type (e.g. Implementation has a `tasks[]` field that it shouldn't follow), or (b) a DATA QUALITY bug — Implementation units have incorrect forward references pointing to Task IORs instead of Test IORs. Architect is diagnosing which.

Regardless of root cause, the INVARIANT is: every chain in /trace must follow the locked 7-step order (requirement → task → UC → class → method → implementation → test) and TERMINATE at a Test leaf. No chain may:
- End on a Method or Implementation without reaching a Test
- Loop back to a Task or Requirement from a deeper level
- Show Task nodes below the Method level
- Show Requirement nodes below the Task level

**Deduplication check:** R18.9 covers cycle guard (ancestor-path). R18.13 covers a different bug — not a cycle but a WRONG-TYPE child (Implementation showing Tasks as children instead of Tests). The chain walker must enforce TYPE ORDER, not just cycle detection.

**Acceptance criteria:**
- [ ] No Task or Requirement nodes appear below Method level in /trace
- [ ] Every chain that reaches an Implementation continues to at least one Test
- [ ] The chain walker enforces type order: at the Implementation level, ONLY `tests[]` is followed — never `tasks[]` or `requirements[]`
- [ ] If an Implementation has no tests, it renders as a leaf (EMPTY per champagne standard) — not as a node with Task children

→ New task (planner stand-up — architect diagnosing logic vs data)

---

## LITERAL SOURCE — Follow-on H: Drawer shadow + back button + chain skips Class (2026-06-05, screenshot BUGs)

> TRON (1): "the drawer shadow is rendered with the drawer closed. it moves into the list"
> TRON (2): "the static back button moves up"
> TRON (3): "usecese -> method instead of usecase -> class -> method and then missing implementation test"

### R18.14: Drawer shadow is not rendered when the drawer is closed.

[requirement:uuid:18b4c5d6-e7f8-9a0b-1c2d-000000018014]

The detail drawer's drop-shadow (or overlay) is visible even when the drawer is in its closed state. The shadow bleeds into the tree list area, visually obscuring list items. When the drawer is closed (not expanded, not showing detail content), its shadow/overlay must have `display:none` or `opacity:0` — no visual artifact in the list area.

**Acceptance criteria:**
- [ ] Drawer closed → no shadow visible in the tree/list area
- [ ] Drawer open → shadow renders normally behind the drawer panel
- [ ] No visual bleed from drawer into list at any scroll position

### R18.15: Static back button does not shift position on scroll or drawer state change.

[requirement:uuid:18c5d6e7-f890-1a2b-3c4d-000000018015]

The back button (← in the header/toolbar) moves vertically ("moves up") when the drawer opens/closes or when the user scrolls. It must stay fixed in its position — anchored to the top of the viewport or the header bar, unaffected by drawer transitions or scroll events.

**Acceptance criteria:**
- [ ] Back button position is visually stable — does not shift on drawer open/close
- [ ] Back button position does not shift on scroll
- [ ] Back button remains accessible (tappable) at all times

### R18.16: Traceability chain includes the Class level between UseCase and Method — no skip from UseCase directly to Method.

[requirement:uuid:18d6e7f8-90a1-2b3c-4d5e-000000018016]

The /trace tree currently shows UseCase → Method, skipping the Class level. The locked 7-step chain (R-E / T168) requires: req → task → UC → **Class** → Method → Implementation → Test. The chain walker must resolve the Class node between UseCase and Method. If the UseCase's `classes[]` links to a Class which has `methods[]`, the tree shows UC → Class → Method. If the data is missing the Class hop (UseCase has `methods[]` directly instead of `classes[]`), this is a data quality fix.

Additionally: Tron notes "missing implementation test" — the chain below Method must continue to Implementation → Test (per R18.13). This links to T195 where missing impl/test data is being filled.

**Deduplication check:** R18.2 covers narrowing to ONE method. R18.16 covers a different issue — the Class LEVEL is skipped entirely. Not narrowing, but a missing hop.

**Acceptance criteria:**
- [ ] /trace tree shows UC → Class → Method (not UC → Method)
- [ ] Every Method in the chain has a parent Class node
- [ ] If UseCase has no `classes[]` but has direct `methods[]`, the data is fixed (Class node inserted)
- [ ] Below Method: Implementation → Test continues (per R18.13, linked to T195 data fill)

→ (1)(2) → CSS bug task (planner stand-up)
→ (3) → Chain Class-hop logic task (planner stand-up) + links to T195 (missing impl/test)

---

## LITERAL SOURCE — Follow-on I: Duplicate sprints + missing sprint numbers (2026-06-05, BUG)

> TRON: "you see a fundamental duplication flaw and missing sprint numbers"

### R18.17: /trace sprint list shows each sprint exactly ONCE — no duplicates.

[requirement:uuid:18e7f890-a1b2-3c4d-5e6f-000000018017]

The /trace browser's sprint list currently shows each sprint twice. This is either a data issue (duplicate Sprint scenario units in the index — the same duplication pattern seen with the 12 duplicate Class pairs) or a rendering issue (the sprint list query returns duplicates). Each sprint must appear exactly once in the list.

**Acceptance criteria:**
- [ ] /trace sprint list shows each sprint name exactly once
- [ ] No duplicate Sprint scenario units in the index (or if duplicates exist in data, the renderer deduplicates)

### R18.18: Sprint names in /trace include their sprint number.

[requirement:uuid:18f890a1-b2c3-4d5e-6f70-000000018018]

Sprint names in the /trace browser omit the sprint number (e.g. showing "Foundation" instead of "Sprint 1 — Foundation"). The Sprint scenario unit's `model.name` must include the sprint number, or the renderer must prepend it from the slug/ordering. Users need the number to identify sprints by their sequence.

**Acceptance criteria:**
- [ ] Each sprint in /trace shows its number (e.g. "Sprint 1 — Foundation", not just "Foundation")
- [ ] Sprint ordering in the list matches sprint number order

→ Bug task (planner stand-up — architect diagnosing data vs render)

---

## LITERAL SOURCE — Follow-on J: Zero-padded sprint numbers for sort (2026-06-05)

> TRON: "to sort the sprints correctly do 01 - 09 and then 10,11"

### R18.19: Sprint numbers are zero-padded 2-digit (01-09, 10-18) for correct lexicographic ordering.

[requirement:uuid:18a1b2c3-d4e5-6f70-8190-000000018019]

Sprint names/slugs must use 2-digit zero-padded numbers so string-based sorting produces numeric order. "Sprint 01", "Sprint 02", ... "Sprint 09", "Sprint 10", "Sprint 11", ... "Sprint 18". Without zero-padding, lexicographic sort puts "Sprint 1" before "Sprint 10" before "Sprint 2" — wrong order.

Applies to: Sprint scenario unit `model.name`, speaking-name symlink tree directory names, and any sorted display in /trace or /scenario.

**Acceptance criteria:**
- [ ] Sprint names use 2-digit numbers: "Sprint 01 — Foundation" through "Sprint 18 — ..."
- [ ] Lexicographic sort of sprint names produces correct numeric order
- [ ] Speaking-name tree uses zero-padded slug: `sprint-01-rawbin-foundation/`
- [ ] Existing Sprint scenario units re-migrated with padded names

→ Sprint-migration task (planner folds into dedup/rename task)

---

## LITERAL SOURCE — Follow-on C: Detail-view full-methods + Parent/Browse-File links (2026-06-05)

> TRON: "on this picture we see the beautiful traceability. BUT on the details view, i want to see ALL methods, not just the traced one. the same on the ScenarioView. for all types. above the scenario view link i want a 'Parent' link. and below it i want to see a Browse File Link, that jumps to the corresponding file in the Browser. there i can open it in the monacco editor. add line information to the link, so that eg on a method or usecase the monacco editor can open at the correct line"

### Decomposition — CANONICAL numbers (reconciled by req-eng 2026-06-07)
- **R18.20**: Detail view (right pane) shows ALL methods/children of the object (full object), NOT just the traced one — applies to BOTH detail view AND scenario view, for ALL types. *(Originally hinted as R18.9 — renumbered to avoid collision with R18.9 cycle guard.)*
- **R18.21**: "Parent" link ABOVE the "Scenario view" link in the detail pane → navigates to the ownerIor parent instance. *(Originally R18.10 → renumbered.)*
- **R18.22**: "Browse File" link BELOW the "Scenario view" link → file browser. *(Originally R18.11 → renumbered. REVISED by R18.27: target is folder-with-highlight, not Monaco direct.)*
- **R18.23**: Browse-File link carries LINE information → editor opens at correct line. *(Originally R18.12 → renumbered. REVISED by R18.28: line carried through browser→editor.)*

---

## LITERAL SOURCE — Follow-on D: Source links on ALL types + open file-browser-with-highlight (not Monaco direct) (2026-06-05)

> TRON: "here you see impl has a src link, but ALL types should have it. it should NOT open directly in the monaco editor, BUT in the browser folder (2nd picture), with the file highlighted. then i can open the editor. the link shall already hold the line of the method if its a method and jump to the method in the edior. same for use case and puml file."

### Decomposition — CANONICAL numbers (reconciled by req-eng 2026-06-07)
- **R18.26**: SOURCE LINK ON ALL TYPES — every type shows source link to its artifact. *(Originally hinted as R18.13 — renumbered to avoid collision with R18.13 chain-terminates-in-Test.)*
- **R18.27**: Browse-File link opens the FILE BROWSER folder view (/md/\<dir\>/) with the target file HIGHLIGHTED — not Monaco direct. REVISES R18.22. *(Originally R18.14 → renumbered to avoid collision with R18.14 drawer shadow.)*
- **R18.28**: Line info carried through browser→editor. REVISES R18.23. *(Originally R18.15 → renumbered to avoid collision with R18.15 back button.)*

---

## LITERAL SOURCE — Follow-on E: Detail traceability-chain section + tree chain depth (2026-06-05, BUG)

> TRON: "Traceability Chain = All children but they should not. tree shows the tracability chain but also broken ...only till method...not deeper to impl and test"

### R18.24: Detail-view Traceability-Chain section shows the narrowed single-thread chain, not all children.

The detail pane's "Traceability Chain" section currently shows ALL children (same as the full-object view). It must show ONLY the narrowed chain: the single traced thread from the current requirement root to the test leaf. ALL children belong in the detail view's object inspector (R18.20); the Traceability Chain section is the NARROWED view (one child per level).

### R18.25: Tree narrowed chain continues past Method through Implementation to Test — not stopping at Method.

The /trace tree currently stops the chain at Method level — it does not expand further to show Implementation → Test(s). The chain must continue the full 7-step depth: req → task → UC → class → method → **impl → test**. This is the same gap as R18.13 (chain terminates in Test) but specifically about the tree UI not rendering the last two levels.

---

## EVIDENCE — Tron-provided screenshots (2026-06-05)

Process (Tron directive): every picture Tron provides is recorded here + referenced in the corresponding task. (Binaries: drop in ./evidence/ — chat-pasted images have no repo path; descriptions recorded until binaries land.)

- **E1** /trace sprint list — duplication flaw (each sprint listed 2x) + missing sprint numbers. → drove T198 dedup + numbered/zero-padded names + S2-S9 migration.
- **E2** /trace RbObjectItem detail — "Traceability Chain = All children" (both show all 7 methods; chain should be narrowed) + tree chain stops at Method (not Impl/Test). → R18 narrowing bugs B1+B2.
- **E3** /scenario Implementation detail — has a src link, but ALL types should; link should open file-browser-with-highlight (not Monaco direct) + carry line. → R18.13-15.
- **E4** /md file-browser folder view (target of the Browse-File link). → R18.14 highlight param.
- **E5** earlier S16: /trace tree + DetailViewContainer drawer (Google-Maps style). → S16 T110.

---

## LITERAL SOURCE — Follow-on D: unitLinks[] + Unit lifecycle (always-consistent symlinks) (2026-06-08)

> TRON: "ok thats exactly right but the symlinks are fundamental part of the game. make sure they are always generated. extend the scenarios with an attribute unitLinks[] with a list of iors to the linked instances and add to the unit class the lifecycle methods to always keep this lust consistent with the state on disk. so add link, removeLink and so on."

### Decomposition hints (req: confirm against literal)
- R18.29: Symlinks are FUNDAMENTAL and must ALWAYS be generated/maintained — never a missable batch step (the S18 sprints.json gap must be structurally impossible).
- R18.30: Extend the scenario unit with attribute `unitLinks[]` = a list of IORs to the linked instances (the symlinks this unit should have on disk).
- R18.31: Add to the Unit class LIFECYCLE METHODS that keep `unitLinks[]` consistent with the on-disk symlink state: `addLink(ior)`, `removeLink(ior)`, and the full set (e.g. syncLinks/rebuildLinks). Each method updates `unitLinks[]` AND the on-disk symlink atomically so the two never diverge.

---

## LITERAL SOURCE — Follow-on H: Orphan owners + missing unitLinks (2026-06-08)

> TRON: "I found scenarios without owners and without unitLists [unitLinks]."

### R18.32: Every scenario unit has valid ownerIor and unitLinks[].

[requirement:uuid:18c9d0e1-f2a3-4b5c-6d7e-000000018032]

Every scenario unit MUST have: (1) a valid `ownerIor` field pointing to its parent/owner unit (Sprint owns Tasks, Task owns UseCases, etc.), and (2) a `unitLinks[]` field present (per R18.30 schema). Measured gaps on 768 units: 184 have no real ownerIor (39 missing the field entirely, 145 empty/null), 501 are missing the unitLinks[] field. Both must be populated — ownerIor from the chain hierarchy, unitLinks[] initialized to empty array at minimum.

**Acceptance criteria:**
- [ ] Zero units with missing ownerIor field (currently 39)
- [ ] Zero units with empty/null ownerIor (currently 145)
- [ ] Zero units missing unitLinks[] field (currently 501)
- [ ] `trace-cli audit` reports 0 ownerIor violations, 0 missing unitLinks[]

→ Planner stand-up

---

## LITERAL SOURCE — Follow-on I: model.parent IOR (2026-06-08)

> TRON: "all scenario models should have a model.parent ior."

**Folded into R18.32** (deduplication Rule 9 — same integrity concern). R18.32 already requires valid ownerIor; this Tron quote adds: the model object itself carries a `parent` IOR field (not just the top-level ownerIor). Updated R18.32 description + AC accordingly.

→ Same task as R18.32
