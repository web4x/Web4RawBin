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

## Impact on LOCKED 7-Step

The 7-step chain is PRESERVED — Requirement → Task → UseCase → Class → Method → Implementation → Test. The narrowing doesn't remove Class from the chain; it changes WHERE methods come from at walk-time:

- Scenario mode: UC → Class → Class.methods[]
- Traceability mode: UC → UC.methods[] (Class shown as context, not as the method source)

Both modes walk 7 steps. The difference is fan-out (scenario) vs narrowing (traceability).

## Next Steps (Sprint 18 scope)

1. **R18.1 + R18.2:** Add `methods[]` to UseCase scenario units; populate via verb-matching
2. **R18.3:** Create S18 as scenario.json units first (dogfood S17 system)
3. **R18.4:** Co-specify role SKILL.md files (architect + planner + req-eng)
4. Update traceability walker to use `UC.methods[]` in trace mode
5. `/api/trace` and `/api/trace/children` support both modes (query param `?mode=trace` vs `?mode=scenario`)

---

**Formulated by:** robbin-architect (2026-06-05)
**Pending:** robbin-req atomic decomposition + robbin-planner S18 scenario.json structure
