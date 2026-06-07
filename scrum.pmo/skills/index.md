# RawBin Skills Index

**19 skills** registered as `ior:class:Skill` scenario units.

## chain

- [chain.walk](./chain-walk.md) — Walk the traceability chain from any node (up/down/both). Returns ordered steps 

## quote

- [quote.capture](./quote-capture.md) — Capture a Tron directive as an atomic Requirement scenario unit. Deduplicates by

## rule

- [rule.bottomUpCreatesNewReqs](./rule-bottomUpCreatesNewReqs.md) — Rule 5: Bottom-up discovery creates NEW sibling requirements, not back-links. Ex
- [rule.closureFreeze](./rule-closureFreeze.md) — Rule 8: Closed tasks accept NO new commits. Post-closure atoms get fresh T-numbe
- [rule.compoundDecomposeOnce](./rule-compoundDecomposeOnce.md) — Rule 2: Compound decomposition happens ONCE upfront. Req-eng decomposes ALL atom
- [rule.compoundIsInput](./rule-compoundIsInput.md) — Rule 11: Compound source is INPUT, not OUTPUT. compound-requirement-source*.md i
- [rule.deduplicateBeforeCreate](./rule-deduplicateBeforeCreate.md) — Rule 9: Deduplication before creation. Search existing requirements before creat
- [rule.depsNotChainLinks](./rule-depsNotChainLinks.md) — Rule 3: Task dependencies are NOT chain links. Chain = WHY (forward-only). Depen
- [rule.exhaustiveDecompositionGate](./rule-exhaustiveDecompositionGate.md) — Rule 10: Exhaustive decomposition gate. Verb x noun cross-product checklist. Pla
- [rule.letterBlockReservation](./rule-letterBlockReservation.md) — Rule 7: Letter-block reservation + v4 UUID discipline. Disjoint label ranges for
- [rule.reqBeforeTask](./rule-reqBeforeTask.md) — Rule 1: Requirements ALWAYS precede tasks. Req-eng captures + commits requiremen
- [rule.sprint1Hierarchy](./rule-sprint1Hierarchy.md) — Rule 6: Sprint-1 hierarchy when task accumulates >=3 mid-flight atoms. Decompose
- [rule.ucFollowsTasks](./rule-ucFollowsTasks.md) — Rule 4: Use Cases follow tasks. Architect reads task requirement + defines Objec

## ship

- [ship.staticShell](./ship-staticShell.md) — Rule #67: New SPA route or changed bundle hash → update sw.js STATIC_SHELL. buil
- [ship.versionBump](./ship-versionBump.md) — Rule #66: Every user-facing surface change bumps package.json version + sw.js CA

## task

- [task.propose](./task-propose.md) — Propose a new Task linked to a Requirement. Creates Task at Planned state + emit
- [task.transition](./task-transition.md) — Transition a Task through its lifecycle FSM. 6 verbs: startRefinement, startCrea

## verify

- [verify.7hopGate](./verify-7hopGate.md) — Rule #27: Per-Test 7-hop strict audit. Every Test must reach a Requirement root 
- [verify.liveRepro](./verify-liveRepro.md) — Rule #27 strict-bar: SW-ACTIVE live verification. Tests run WITH service worker 

