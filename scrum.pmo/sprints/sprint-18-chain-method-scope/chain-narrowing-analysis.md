# Sprint 18 — Chain Narrowing Analysis: All-Methods vs One-Method

**Source:** Tron directive 2026-06-05 (via robbin-po compound-requirement-source.md).
**Authors:** robbin-architect (lead analysis) + robbin-req + robbin-planner (JOINT).

---

## The Distinction (Tron's literal words)

> "classes have All methods in the traceability chain. this is very good for the overall scenario browser! but on the traceability browser it needs to be only exactly the one method, that fulfills the current requirement down to the test that tests it."

Two views of the SAME Class, different purposes:

| View | What it shows | Purpose |
|------|--------------|---------|
| **Scenario browser** | Class → ALL methods | Full object model ("what does this class do?") |
| **Traceability browser** | Class → ONE method per requirement | Chain narrowing ("which method fulfills THIS requirement?") |

## The Problem: Fan-Out at Class→Method

**Current data:** Class.methods[] contains ALL methods. When the traceability chain walks through a Class, it fans out to every method:

```
R17.4 (index.put requirement)
  → T124.3
    → UC index.put
      → Class ScenarioIndex
        → Method ScenarioIndex.put        ← relevant
        → Method ScenarioIndex.get        ← NOT relevant to R17.4
        → Method ScenarioIndex.prefix     ← NOT relevant to R17.4
        → Method ScenarioIndex.scenario   ← NOT relevant to R17.4
```

The chain should narrow at the Class→Method hop: only `ScenarioIndex.put` fulfills R17.4.

**Real data (worst case):** RbObjectItem has 7 methods and 11 different UCs pointing to it. Every UC sees all 7 methods — the tree explodes.

## Analysis: Where Does the Narrowing Information Live?

The chain is: Requirement → Task → UseCase → Class → Method → Implementation → Test

The NARROWING information already exists in the data — it's just not used at the right hop:

1. **UseCase knows its verb.** `index.put` is about the `put` method specifically. The UC name IS the method selector.
2. **Implementation knows its source method.** The `[impl:uuid]` marker sits on a specific function in source code. The Implementation unit has `className` + `methodName`.
3. **Method knows its class.** Method units have `ownerIor` pointing to their Class.

### Key Insight: UseCase.verb = Method.methodName

The UseCase Object.verb naming convention (T168) already encodes the target method:

| UseCase name | Implicit method | Class |
|---|---|---|
| `index.put` | `put` | ScenarioIndex |
| `index.get` | `get` | ScenarioIndex |
| `tree.symlinkJson` | `symlinkJson` | SpeakingTree |
| `objectItem.generateName` | `generateName` | RbObjectItem |
| `objectItem.setIcon` | `setIcon` | RbObjectItem |

The verb after the dot IS the method name. This is by design (Web4 Object.verb = Class.method).

## Design: Chain-Narrowing at Walk-Time

**The data model does NOT change.** Class.methods[] stays as ALL methods (scenario browser needs it). The narrowing happens at WALK TIME in the traceability browser:

### Option A: UC.methods[] direct link (data-model addition)

Add `methods[]` forward link on UseCase, pointing to the SPECIFIC method(s) the UC specifies:

```json
{
  "ior": "ior:class:UseCase",
  "model": {
    "uuid": "17a00104-...",
    "name": "index.put",
    "classes": ["ior:instance:<ScenarioIndex-uuid>"],
    "methods": ["ior:instance:<ScenarioIndex.put-uuid>"]  // NEW: narrows to one method
  }
}
```

**Chain walk changes:**
- Scenario browser: UC → Class → ALL methods (uses `Class.methods[]`)
- Traceability browser: UC → Method (uses `UC.methods[]`, skips Class fan-out)

**Pros:** Explicit, auditable, no runtime heuristic.
**Cons:** Requires populating `methods[]` on all 30 UCs (T178-style data-fill).

### Option B: Walk-time verb matching (heuristic, no data change)

When the traceability walker reaches UC→Class→Method, filter methods by matching the UC verb to the method name:

```typescript
// Traceability walk at Class→Method hop
const ucVerb = useCase.name.split('.')[1];  // "put" from "index.put"
const narrowed = classMethods.filter(m => m.methodName === ucVerb);
```

**Pros:** No data change, works immediately.
**Cons:** Heuristic — fails if verb doesn't match method name exactly. Brittle.

### Option C: Implementation-guided narrowing (follow the impl trace)

At Class→Method, check which methods have Implementations that trace to the SAME Requirement root being walked:

```typescript
// Walk from Requirement R17.4 reaches Class ScenarioIndex
for (const method of classObj.methods) {
  const impls = method.implementations;
  for (const impl of impls) {
    if (impl traces back to R17.4) → include this method
  }
}
```

**Pros:** Uses existing data, no new fields needed, semantically correct.
**Cons:** Expensive (checks every method's impl chain), requires backward trace from impl to requirement.

### Recommendation: Option A (UC.methods[] direct link)

**Option A is the right answer** because:
1. It's EXPLICIT — auditable at data level, no runtime guessing
2. It follows the existing pattern — UC already has `classes[]`, adding `methods[]` is natural
3. The UC Object.verb convention makes population trivial — match verb to method name
4. It keeps the LOCKED 7-step intact: Requirement → Task → UC → Class → Method → Impl → Test. The traceability browser simply reads UC.methods[] instead of Class.methods[] at that hop
5. The scenario browser continues using Class.methods[] (unchanged)

**Population approach:**
```
For each UseCase:
  verb = name.split('.')[1]   // "put" from "index.put"
  For each Class in UC.classes[]:
    Find Method where methodName == verb
    Add to UC.methods[]
```

This is a one-pass pipeline, similar to T178's populate-forward-refs.

### Chain Walk Contract (two modes)

```
SCENARIO BROWSER (full object model):
  Req → Task → UC → Class → ALL Methods → Impls → Tests
  Uses: Class.methods[] (fan-out, shows full class)

TRACEABILITY BROWSER (chain narrowing):
  Req → Task → UC → UC.methods[] → Impl → Test
  Uses: UC.methods[] (narrows to req-fulfilling method)
  Class is still DISPLAYED (as context) but methods come from UC, not Class
```

### FORWARD_KEYS Update

```typescript
// Current:
const FORWARD_KEYS = {
  usecase: 'classes',   // UC → Class → allMethods
  class: 'methods',
};

// Traceability browser override:
const TRACE_FORWARD_KEYS = {
  usecase: 'methods',   // UC → specific Methods (narrows)
  // 'class' key absent — Class not a chain hop in trace mode
};
```

The tree walker checks the current MODE (scenario vs traceability) and uses the appropriate FORWARD_KEYS map.

## T187 WIDENED: Recursive Narrowing at EVERY Hop (Tron 2026-06-05)

Tron confirmed the UC→Method design and widened it: **the narrowing applies recursively at EVERY hop**, not just UC→Method. The traceability browser shows ONE child per intermediate node — a single CHAIN LINE from requirement root to test leaf.

### Two Tree Modes (full contrast)

```
SCENARIO BROWSER (full tree — fan-out at every hop):
  Requirement → ALL Tasks
    → ALL UseCases per task
      → ALL Classes per UC
        → ALL Methods per class
          → ALL Implementations per method
            → ALL Tests per impl

TRACEABILITY BROWSER (chain line — ONE child per intermediate node):
  Requirement → Tasks (1:N OK — req is root, shows its scoped tasks)
    → UseCases (1:N OK — task scopes its own UCs)
      → ONE Class (the UC's implementing class)
        → ONE Method (the UC's verb-matched method)
          → ONE Implementation (the method's impl)
            → Tests (1:N OK — leaf level, shows all covering tests)
```

Fan-out is acceptable at **roots** (Requirement→Tasks) and **leaves** (Impl→Tests). Intermediate hops narrow to ONE child because that's where cross-chain bleed happens (multiple UCs share a Class; a Class has methods serving different requirements).

### Singular Chain Links (data model addition)

Each intermediate node gets a SINGULAR chain-child alongside its existing PLURAL children:

| Node | Scenario link (plural) | Trace link (singular) | Populated from |
|------|------------------------|-----------------------|----------------|
| UseCase | `classes[]` (all) | `class` (singular IOR) | Usually 1 already |
| UseCase | *(new)* | `method` (singular IOR) | Object.verb match |
| Method | `implementations[]` | `implementation` (singular IOR) | Usually 1:1 |

Requirement→Tasks and Impl→Tests stay plural (root/leaf — no narrowing needed).

### Recursive TRACE_FORWARD_KEYS

```typescript
// Scenario mode — fan-out (existing):
const SCENARIO_FORWARD: Record<string, string> = {
  requirement:    'tasks',
  task:           'useCases',
  usecase:        'classes',
  class:          'methods',
  method:         'implementations',
  implementation: 'tests',
};

// Trace mode — chain line (NEW — singular at intermediate hops):
const TRACE_FORWARD: Record<string, string> = {
  requirement:    'tasks',            // 1:N OK (root)
  task:           'useCases',         // 1:N OK (task-scoped)
  usecase:        'method',           // SINGULAR — the one verb-matched method
  method:         'implementation',   // SINGULAR — the one impl
  implementation: 'tests',            // 1:N OK (leaf)
};
// Note: 'class' key absent in trace mode — Class shown as CONTEXT on the UC row,
// not as a chain hop. The chain goes UC → method directly.
```

### Walk Contract

The `/api/trace/children/<uuid>` endpoint gains a `?mode=trace` query parameter:

- `?mode=scenario` (default): uses `SCENARIO_FORWARD` — all children (current behavior)
- `?mode=trace`: uses `TRACE_FORWARD` — singular chain links at intermediate hops

The tree component (`rb-trace-tree.ts`) passes the mode when fetching children. The `/trace` page uses trace mode; the `/scenario` page uses scenario mode.

### Population Pipeline (extends T178)

```
For each UseCase unit:
  1. UC.class = UC.classes[0]                              // usually 1 class
  2. verb = UC.name.split('.')[1]                          // "put" from "index.put"
  3. Find Method in UC.class where methodName == verb
  4. UC.method = ior:instance:<matched-method-uuid>        // singular

For each Method unit:
  5. If Method.implementations.length == 1:
     Method.implementation = Method.implementations[0]     // singular
```

### Impact on 7-Step Chain

The 7-step is PRESERVED in both modes. The difference:
- Scenario: walks all 7 steps with fan-out at every hop
- Trace: walks the same 7 steps but each intermediate hop resolves to ONE child

Both are valid walks of the same chain. The trace mode is a FILTERED view, not a different chain.

## T187 ROOT-STRUCTURE: Sprint→Task→Covered-Reqs→Chain (Tron R18.8, 2026-06-05)

Tron directive: BOTH browsers root at **Sprint (list of tasks)** at top → Task → the atomic requirements that Task COVERS → THEN scenario tree (full) or traceability chain (narrowed) from each requirement down to tests.

### Three Layers (reconciled with forward-only chain)

The display tree has THREE distinct layers — each with its own semantics:

```
LAYER 1 — NAVIGATION (organizational)
  Sprint
    └── Task         "what work was planned/done"

LAYER 2 — COVERAGE (which reqs does this task address)
    └── Task
         └── Requirement(s)    "what atomic reqs does this task fulfill"

LAYER 3 — CHAIN (forward-only traceability, per LOCKED 7-step)
         └── Requirement
              └── UseCase → Class → Method → Impl → Test
```

### Reconciliation: Coverage ≠ Backward Chain Link

`Task.coveredRequirements[]` is a NAVIGATION field, NOT a chain reversal:

| Link | Direction | Purpose | Layer |
|------|-----------|---------|-------|
| Requirement → Task | Forward (chain) | "this req is implemented by this task" | Chain |
| Task → coveredRequirements[] | Display (navigation) | "this task addresses these reqs" | Navigation |
| Sprint → Tasks | Display (navigation) | "this sprint contains these tasks" | Navigation |

The chain's forward direction remains: Req → Task → UC → ... → Test.
The navigation tree starts ABOVE the chain: Sprint → Task → covered Reqs → chain.

`Task.coveredRequirements[]` is the COVERAGE view — it answers "what did this task accomplish?" for the human browsing the sprint. It does NOT violate forward-only because it's a NAVIGATION concern, not a CHAIN concern. Same separation as chain-vs-dependency (Rule 3).

### Three Concerns (extended from precedence analysis)

| Concern | Semantics | Link direction | Where stored |
|---------|-----------|----------------|-------------|
| **Chain** | WHY does this code exist? | Forward-only (Req→...→Test) | `FORWARD_KEYS` |
| **Dependency** | WHAT must be built first? | DAG (`follows`/`Dependencies`) | Task metadata |
| **Navigation** | HOW does the human browse? | Display (Sprint→Task→coveredReqs) | `NAVIGATION_KEYS` |

### Full Tree Structure (both modes)

```
SCENARIO BROWSER (full tree):
  Sprint
    └── Task
         └── Requirement (covered)
              └── UC → ALL Classes → ALL Methods → ALL Impls → ALL Tests

TRACEABILITY BROWSER (chain line):
  Sprint
    └── Task
         └── Requirement (covered)
              └── UC → ONE Method → ONE Impl → Tests
```

Both start at Sprint. Both navigate through Task to covered requirements. They diverge at the chain: scenario fans out, trace narrows.

### Data Model: Task.coveredRequirements[]

```json
{
  "ior": "ior:class:Task",
  "model": {
    "uuid": "...",
    "name": "T124.3: Scenario index storage",
    "useCases": ["ior:instance:<UC-uuid>"],
    "coveredRequirements": ["ior:instance:<R17.4-uuid>"]
  }
}
```

Population: for each Task, find all Requirements whose `tasks[]` includes this Task UUID. Write as `Task.coveredRequirements[]`. This is a ONE-TIME population (same T178 pipeline pattern).

### NAVIGATION_KEYS (new, alongside FORWARD_KEYS)

```typescript
const NAVIGATION_KEYS: Record<string, string> = {
  sprint:  'tasks',                  // Sprint → its Tasks
  task:    'coveredRequirements',    // Task → its covered Requirements
};
// After reaching a Requirement, switch to FORWARD_KEYS (chain) or TRACE_FORWARD (narrowed)
```

### /api/trace/children Updated Contract

```
/api/trace/children/<uuid>?mode=scenario
  Sprint → tasks (NAVIGATION)
  Task → coveredRequirements (NAVIGATION)
  Requirement → tasks... → classes... → methods... (SCENARIO_FORWARD — fan-out)

/api/trace/children/<uuid>?mode=trace
  Sprint → tasks (NAVIGATION)
  Task → coveredRequirements (NAVIGATION)
  Requirement → useCases... → method (singular)... → impl (singular)... → tests (TRACE_FORWARD — narrows)
```

The navigation layer is SHARED between both modes. They diverge only at the Requirement → downstream chain.

## Next Steps (Sprint 18 scope — T187/T188/T189)

1. **T187:** Add singular chain links (`UC.method`, `UC.class`, `Method.implementation`); update `/api/trace/children` with `?mode=trace`; update `rb-trace-tree.ts` to pass mode
2. **T188:** Create S18 as scenario.json units first; ViewGenerator emits planning.md + task-*.md
3. **T189:** Co-specify role SKILL.md files (architect + planner + req-eng, Rules 1-11)
4. Population pipeline: one-pass verb-matching fills singular links on existing 30 UCs

---

**Formulated by:** robbin-architect (2026-06-05, widened per Tron confirmation)
**Joint with:** robbin-planner (T187-T189 decomposition, UC.method singular proposal) + robbin-req (pending atomic decomposition)
