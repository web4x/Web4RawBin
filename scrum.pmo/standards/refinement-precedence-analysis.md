# Refinement Precedence Analysis

**Source:** Tron directive 2026-06-05 (via robbin-po).
**Authors:** robbin-architect + robbin-planner (JOINT reasoning).
**Context:** Tron observes recurring task→req→task→req dependencies in the traceability chain. This analysis establishes the canonical PRECEDENCE of refinement artifacts — what begets what, forward-only, no recurrence.

---

## The Problem: Recurring task↔req Alternation

The current traceability chain shows:
```
Requirement R17.1 → Task T124 → ... but T124 depends on T125 which traces to R17.2
R17.2 → T125 → ... but T125 subtasks trace back to R17.1 requirements
```

This creates a **DAG with back-edges** instead of a clean tree. The chain walker encounters the same requirement from multiple task paths, and tasks that depend on other tasks' requirements. The LOCKED 7-step chain (T168) demands forward-only — but the REFINEMENT PROCESS that creates the artifacts isn't forward-only.

## First-Principles Reasoning: What Begets What?

### Observation 1: Requirements exist BEFORE work begins

A requirement is a STATEMENT OF NEED. It exists because Tron (the product owner / stakeholder) stated it. No code, no task, no use case caused it — it came from the domain.

**Therefore: Requirements are the absolute first artifact.**

### Observation 2: Compound requirements decompose into atomic requirements

Tron's directives are often compound: "The system shall support traceability from requirement to test with lazy-loading and PUML diagrams." This contains multiple independently-testable atoms:
- R17.1: Every scenario unit has an IOR field
- R17.4: Scenario index stores units by UUID prefix
- R17.7: HTML views render from templates per class

**Therefore: Compound → Atomic is the first refinement step.** Req-eng owns this.

### Observation 3: Tasks IMPLEMENT requirements (not the reverse)

A task exists because a requirement demands work. "Build the scenario index" exists because "R17.4: Scenario index stores units by UUID prefix" was stated. The task doesn't create the requirement — it fulfills it.

**Therefore: Atomic Requirements → Tasks.** Planner owns this.

### Observation 4: Use Cases describe HOW a task is realized

A use case (Object.verb) describes the system behavior that a task delivers. "index.put" exists because T124.3 ("implement scenario index storage") was scoped. The use case doesn't create the task — it specifies the behavioral contract.

**Therefore: Tasks → Use Cases.** Architect owns this.

### Observation 5: The recurrence comes from BOTTOM-UP DISCOVERY

In practice, implementing T124 (scenario units) reveals that T125 (IOR resolver) is also needed. T125 traces to R17.2 (IOR resolution). So T124 → discovers need for T125 → which traces to R17.2. This looks like task→req dependency, but it's actually:

```
R17.2 (already stated by Tron) → T125 (created by planner to implement R17.2)
T124 depends-on T125 (implementation dependency, not chain dependency)
```

The recurrence is a **conflation of two relationships:**
1. **Chain relationship** (forward-only): Requirement → Task → UC → Class → ... → Test
2. **Dependency relationship** (DAG, can be cyclic): T124 depends-on T125, T125 depends-on T126

These are DIFFERENT link types. The chain is for traceability (WHY does this code exist?). The dependency is for scheduling (WHAT must be built first?).

## Canonical Precedence (forward-only refinement)

```
1. COMPOUND REQUIREMENT     Tron directive (verbatim capture)
       ↓                    req-eng decomposes
2. ATOMIC REQUIREMENTS      One-sentence, independently testable
       ↓                    planner scopes work
3. TASKS                    Implement specific atomic requirements (1:N)
       ↓                    architect designs behavior
4. USE CASES                Object.verb — how the system behaves (1:N per task)
       ↓                    architect maps to code
5. CLASSES                  Which source file / module
       ↓                    discoverable from source
6. METHODS                  Which function / getter
       ↓                    impl markers in source
7. IMPLEMENTATIONS          [impl:uuid] in .ts
       ↓                    test markers in test files
8. TESTS                    [test:uuid] in test .ts
```

**Each step is CREATED BY the step above.** No artifact creates its parent.

## Optimal Refinement Process (team protocol)

### Rule 1: Requirements ALWAYS precede tasks

**Before planner creates a task file**, the requirement it implements MUST already exist in `requirements.md` with a `[requirement:uuid]`. If Tron gives a directive that doesn't yet have a requirement:

1. Req-eng captures Tron's words verbatim as an atomic requirement
2. Req-eng commits the requirement to `requirements.md`
3. THEN planner creates the task referencing that requirement UUID

**Never: planner creates task → req-eng retroactively adds requirement.**

### Rule 2: Compound decomposition happens ONCE, upfront

When Tron gives a multi-part directive:

1. Req-eng decomposes ALL atomic requirements in ONE pass
2. Req-eng commits ALL atoms to `requirements.md`
3. THEN planner creates tasks (may be 1:1 or N:1 with requirements)

**Never: planner creates task for part of the directive → discovers another part → req-eng adds requirement → planner creates another task → cycle.**

### Rule 3: Task dependencies are NOT chain links

When T124 depends-on T125:

- `T124.md` lists T125 in its `Dependencies` section (scheduling)
- T124's `up → requirement` points to R17.1 (chain — WHY)
- T125's `up → requirement` points to R17.2 (chain — WHY)
- The chain is R17.1 → T124 and R17.2 → T125 (two separate forward paths)
- The dependency T124→T125 is in the `follows` / `Dependencies` metadata, NOT in the chain

**The chain answers "why does this code exist?" The dependency answers "what must be built first?" Different questions, different link types.**

### Rule 4: Use Cases follow tasks (architect refines)

After planner creates a task file:

1. Architect reads the task's requirement + scope
2. Architect defines Object.verb use cases in PUML
3. Each UC links to its parent Task in the PUML annotation (`T124.3 / T125`)
4. The chain is: Requirement → Task → UseCase (forward-only)

**Never: architect creates a UC that spawns a new requirement.**

### Rule 5: Bottom-up discovery creates NEW requirements, not back-links

When implementation reveals a new need:

1. Expert reports: "T124 impl needs IOR resolution that doesn't exist"
2. Req-eng captures: "R17.2: IOR strings resolve to class loaders" (NEW requirement)
3. Planner creates: T125 (implements R17.2)
4. T124's `Dependencies` notes T125 (scheduling)

The NEW requirement R17.2 is a **sibling** of R17.1 — both are roots. Not a child of T124.

---

## Planner Protocol (robbin-planner)

Operational teeth that enforce the chain-vs-dependency separation. Rules 6-8 are planner-owned discipline; architect-owned chain semantics above (Rules 1-5) remain authoritative on the WHY.

### Rule 6: Sprint-1 hierarchy on mid-flight atom accumulation (planner)

The Sprint-1 `task-1` / `task-1.1` / `task-1.2` / `task-1.3` decomposition Tron praised is the canonical pattern when a top-level task accumulates ≥ 3 mid-flight atoms:

- **Top-level T(N)** = coordination root (intent + scope statement only)
- **Subtasks T(N).1, T(N).2, T(N).3, …** = atomic units (one atom each)
- **Each subtask** has its own v4 task-uuid, its own atomic requirement uuid, its own role-keyed owner, its own ship cycle

**Trigger:** when a task takes ≥ 3 version bumps for distinct atoms (T174 went v0.5.71 → v0.5.72 → v0.5.73 → v0.5.84 for R-M1/M2/M3/M4 + R-M3d + R-M3e + R-Y1+R-Y2 — should have decomposed into T174.1 through T174.6 after the second mid-flight atom).

**Benefit:** each ship-cycle owns one chain forward-step; no single task accumulates scope; tester verifies per-subtask not per-task; Tron QA gates per-subtask.

**Anti-pattern (observed in S17):** "fold the new atom into the existing task" — keeps a single task in iteration through multiple version bumps. The fold pattern is correct when the atom is the SAME requirement at a different layer (T181 display → T184 server: same R-U umbrella, different layer = fold). The fold pattern is WRONG when the atom is a new requirement on the same surface (R-M3d/R-M3e added to T174: distinct atoms = should be subtasks).

### Rule 7: Letter-block reservation + v4 uuid discipline (planner)

To eliminate label collisions:

- At sprint kickoff, **req-eng and planner agree on disjoint letter ranges** for new mid-sprint atoms (e.g. req-eng owns R-A* through R-T*; planner owns R-U* through R-Z* for synthesized labels on tasks Tron hasn't yet captured).
- Both roles use real `uuidgen` v4 uuids (per learning #17). Fake-suffix placeholders like `…-x00000000001` are rejected at audit.
- **Pre-flight check (planner):** before any label commit, run `grep -r "R-<letter><number>" scrum.pmo/sprints/<sprint>/` — if the label is in use elsewhere, generate a new one. Add to learning #26 pre-flight checklist.

**Observed collisions removed by this rule:** T184 R-X1 → R-Y1 → R-Z1 → R-U (umbrella) rename chain across 24h was caused by req-eng claiming the same letters mid-flight. Disjoint ranges + grep-check prevent it.

### Rule 8: Closure freeze (planner)

Once PO marks a task closed (✓ in their message), the task's banner accepts NO new commits. Post-closure atoms that the team discovers get a fresh T-number, not a re-open.

**Precedent:** PO directive 2026-06-05 — "Stand up T186 for the v0.5.84 tree-lazy-load fix; do NOT fold into closed T178. Distinct layer, distinct fix — own task = clean traceability (closed tasks don't gain post-closure commits)."

**Why:** closure is the team's contract that the task is done-as-scoped. If new atoms emerge afterward, they belong to a new task; otherwise closure means nothing and Tron QA loses meaning.

## The Recurrence Eliminated

**Before (recurrent):**
```
R17.1 → T124 → depends-on T125 → R17.2 → T125 → depends-on T126 → R17.3 ...
(chain walker sees req-task-req-task-req)
```

**After (forward-only):**
```
R17.1 → T124 → UC → Class → Method → Impl → Test
R17.2 → T125 → UC → Class → Method → Impl → Test
R17.3 → T126 → UC → Class → Method → Impl → Test
(three independent forward chains; dependencies are metadata, not chain links)
```

Each requirement is a tree ROOT. Each task hangs from exactly ONE requirement. Dependencies between tasks are scheduling metadata (`follows` / `Dependencies`), not chain links. The chain walker never sees task→req→task — only req→task→uc→...→test.

## Conclusion

**Canonical precedence:** Compound Requirement → Atomic Requirements → Tasks → Use Cases → Classes → Methods → Implementations → Tests.

**The recurrence is eliminated by separating TWO concerns:**
1. **Chain** (traceability — why): strictly forward, requirement-rooted, each task under exactly one atomic requirement
2. **Dependency** (scheduling — what first): DAG in `follows`/`Dependencies` metadata, explicitly NOT in the chain

**Team protocol change:** req-eng ALWAYS captures the requirement BEFORE planner creates the task. No retroactive requirement creation. Bottom-up discovery creates NEW sibling requirements, not back-links.

---

**Formulated by:** robbin-architect + robbin-planner (JOINT, 2026-06-05)
**Architect contributions (chain-vs-dependency framing + 5 protocol rules):** Sections "The Problem", "First-Principles Reasoning", "Canonical Precedence", "Optimal Refinement Process" Rules 1-5, "The Recurrence Eliminated", and "Conclusion".
**Planner contributions (operational teeth):** "Planner Protocol" sub-section with Rules 6-8 — Sprint-1 decomposition trigger, letter-block reservation + v4 uuid discipline, closure freeze. Anchored on Tron-praised Sprint-1 task-1/1.1 hierarchy and S17 collision incidents (R-X1→Y1→Z1 on T184, T174 multi-atom scope creep, T186 vs T178 PO-directed separation).
**req-eng contribution slot:** Architect to integrate when it lands.
**Approved by:** (pending Tron review via robbin-po)
