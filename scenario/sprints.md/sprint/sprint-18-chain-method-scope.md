## Sprint 18 — Chain Method-Scope & Role Skills

Narrow the traceability chain at Class→Method to the ONE method that fulfills the current requirement (vs scenario browser which shows ALL methods); dogfood S17 scenario-unit model by authoring Sprint 18 as scenario.json FIRST and generating planning.md + task-*.md from those units; co-specify role refinement protocols as SKILL.md files (Rules 1-11 from refinement-precedence-analysis.md).

**Status:** Planned

## Traceability

**Requirements:**
- [🔗 R18.9: Chain cycles are completely eliminated — forward-only traversal with cycle guard.](../requirement/r18-9-chain-cycles-are-completely-eliminated-forward-only-traversal-with-cycle-g.md)
- [🔗 R18.10: Tree lazy-loads only the NEXT layer per expand — not the full subtree.](../requirement/r18-10-tree-lazy-loads-only-the-next-layer-per-expand-not-the-full-subtree.md)
- [🔗 R18.11: Cycle guard is ancestor-path-precise — only break true ancestor cycles, preserve all legitimate children including DAG re-convergence.](../requirement/r18-11-cycle-guard-is-ancestor-path-precise-only-break-true-ancestor-cycles-pres.md)
- [🔗 R18.12: True-cycle nodes are omitted cleanly — no visible cut artifact shown to the user.](../requirement/r18-12-true-cycle-nodes-are-omitted-cleanly-no-visible-cut-artifact-shown-to-the.md)
- [🔗 R18.16: Traceability chain includes the Class level between UseCase and Method — no skip from UseCase directly to Method.](../requirement/r18-16-traceability-chain-includes-the-class-level-between-usecase-and-method-no.md)
- [🔗 R18.17: /trace sprint list shows each sprint exactly ONCE — no duplicates.](../requirement/r18-17-trace-sprint-list-shows-each-sprint-exactly-once-no-duplicates.md)
- [🔗 R18.18: Sprint names in /trace include their sprint number.](../requirement/r18-18-sprint-names-in-trace-include-their-sprint-number.md)
- [🔗 R18.19: Sprint numbers are zero-padded 2-digit (01-09, 10-18) for correct lexicographic ordering.](../requirement/r18-19-sprint-numbers-are-zero-padded-2-digit-01-09-10-18-for-correct-lexicograp.md)
- [🔗 R18.20: Detail view (right pane) shows ALL methods/children of the object (full object), not just the traced one.](../requirement/r18-20-detail-view-right-pane-shows-all-methods-children-of-the-object-full-obje.md)
- [🔗 R18.21: "Parent" link ABOVE the "Scenario view" link in the detail pane navigates to the ownerIor parent instance.](../requirement/r18-21-parent-link-above-the-scenario-view-link-in-the-detail-pane-navigates-to-.md)
- [🔗 R18.22: "Browse File" link BELOW the "Scenario view" link jumps to the corresponding file in the FILE BROWSER.](../requirement/r18-22-browse-file-link-below-the-scenario-view-link-jumps-to-the-corresponding-.md)
- [🔗 R18.23: Browse-File link carries LINE information so the Monaco editor opens at the correct line.](../requirement/r18-23-browse-file-link-carries-line-information-so-the-monaco-editor-opens-at-t.md)
- [🔗 R18.27: Browse-File link opens the file-browser FOLDER with the target file HIGHLIGHTED — not Monaco directly. (inferred from literal)](../requirement/r18-27-browse-file-link-opens-the-file-browser-folder-with-the-target-file-highl.md)
- [🔗 R18.25: Tree narrowed chain continues past Method through Implementation to Test — not stopping at Method.](../requirement/r18-25-tree-narrowed-chain-continues-past-method-through-implementation-to-test-.md)
- [🔗 R18.26: Source link on ALL types — not just Implementation. (inferred from literal)](../requirement/r18-26-source-link-on-all-types-not-just-implementation-inferred-from-literal.md)
- [🔗 R18.24: Detail-view Traceability-Chain section shows the narrowed single-thread chain, not all children.](../requirement/r18-24-detail-view-traceability-chain-section-shows-the-narrowed-single-thread-c.md)
- [🔗 R18.28: Line info carried through file-browser to Monaco so editor opens at the correct line. (inferred from literal)](../requirement/r18-28-line-info-carried-through-file-browser-to-monaco-so-editor-opens-at-the-c.md)
- [🔗 R-placeholder (T202 sibling of R18.13): Shared Class must use UC.chainMethod, not global Class.methods[]](../requirement/r-placeholder-t202-sibling-of-r18-13-shared-class-must-use-uc-chainmethod-not-gl.md)

**Tasks:**
- [🔗 T187: Trace narrowing — single-thread chain in /trace, full fan-out in /scenario](../task/task-187-trace-narrowing-single-thread-chain.md)
- [🔗 Dogfood S17 view-gen: planning.md + task-*.md emitted from scenario.json Sprint+Task units](../task/t188-dogfood-view-gen-planning-md-from-scenario-units.md)
- [🔗 Role skills — co-specify planner/architect/req-eng SKILL.md from precedence-analysis Rules 1-11](../task/t189-role-skills-co-specify-planner-architect-req-eng.md)
- [🔗 T190: Tree expand appends only — no full re-render, no scroll jump](../task/task-190-tree-expand-append-no-rerender.md)
- [🔗 Champagne lift: Test.verifies[] pipeline + structural verification annotations](../task/t191-champagne-test-verifies-pipeline-structural-annotations.md)
- [🔗 Break Req->Task 2-cycle + server-side cycle guard](../task/t192-break-req-task-2-cycle-server-cycle-guard.md)
- [🔗 Revert Req->tasks + per-branch visited Set + invisible cycle nodes](../task/t193-revert-req-tasks-per-branch-visited-invisible-cycle.md)
- [🔗 Forward-only fallback + type-check child filter](../task/t194-forward-only-fallback-type-check-child-filter.md)
- [🔗 Object.verb UC population + Class/Method/Impl chain wiring (multi-phase epic)](../task/t195-object-verb-uc-population-chain-wiring.md)
- [🔗 Orphan-method + wrong-type-UUID cleanup in Method.implementation chain](../task/t197-orphan-method-wrong-type-uuid-cleanup.md)
- [🔗 Sprint scenario units + sprint catalogue cleanup (dedupe + numbered rename)](../task/t198-sprint-scenario-units-catalogue-cleanup.md)
- [🔗 R18.34 — SVG viewer with scoped pinch/pan (cross-browser)](../task/task-r18.34-svg-viewer-scoped-pinch-zoom.md)
- [🔗 T202: Class.method-per-UC narrowing — shared Class picks wrong method](../task/class-method-per-uc-narrowing-shared-class-wrong-method.md)
- [🔗 T-detail-parent-link: parent link above scenario-view navigates to ownerIor](../task/detail-parent-link-ownerio.md)
- [🔗 T-detail-browse-file: Browse-File link opens file-browser folder with highlight](../task/detail-browse-file-folder-highlight.md)
- [🔗 T-detail-browse-line: line info carried through file-browser to Monaco editor](../task/detail-browse-line-info-to-monaco.md)
- [🔗 T-detail-narrowed-chain: detail-view chain section shows narrowed singular chain](../task/detail-narrowed-chain-singular.md)
- [🔗 T-detail-source-link-all: source link on ALL types (UC to .puml, Class/Method/Impl to src)](../task/detail-source-link-all-types.md)
- [🔗 T-detail-line-monaco: line info to Monaco editor at correct line](../task/detail-line-info-monaco-editor.md)
