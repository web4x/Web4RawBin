[Back to T124](./task-124-architecture.md)

# T124.1: Architect — Scenario-Unit + IOR Data Model

## Architect Design — robbin-architect (2026-05-30, refined per Tron clarification)

### Core Principle: IOR = Class Loader, NOT Instance ID

Tron clarification: the outer `ior` in a scenario unit is the IOR to the **CLASS LOADER** — it tells the system WHICH class to use to process this scenario. The instance UUID lives inside `model.uuid`.

### Scenario Unit JSON Shape

Every instance (Task, Requirement, UseCase, Sprint, Class, Method, Test) is a file:

```
scenario/index/<5-char-prefix>/<uuid>.scenario.json
```

```jsonc
{
  "ior": "ior:class:Task",           // CLASS LOADER IOR — resolves to the Task class
  "model": {                          // Domain attributes — vary by class
    "uuid": "a7f3c1d2-8b4e-4f9a-b6c5-3d2e1f0a9b8c",
    "name": "Bootstrap robbinTeam",
    "description": "Clone ud-team agents...",
    "status": "Done",
    "sprint": "ior:instance:sprint-1-uuid",   // IOR to Sprint instance
    "children": [                              // IOR array — relationships
      "ior:instance:task-1.1-uuid",
      "ior:instance:task-1.2-uuid"
    ],
    "requirements": [                          // IOR array — upward links
      "ior:instance:req-uuid"
    ],
    "useCases": [                              // IOR array — downward links
      "ior:instance:uc-uuid"
    ]
  },
  "ownerIor": "ior:instance:sprint-1-uuid"    // Owner instance IOR
}
```

### Loading Protocol

```
1. Read <uuid>.scenario.json from disk
2. Parse JSON → extract `ior` field
3. Resolve ior → class loader:
     "ior:class:Task"        → TaskLoader
     "ior:class:Requirement" → RequirementLoader
     "ior:class:Sprint"      → SprintLoader
     "ior:class:UseCase"     → UseCaseLoader
     "ior:class:Class"       → ClassLoader
     "ior:class:Method"      → MethodLoader
     "ior:class:Test"        → TestLoader
4. Instantiate class: loader.create()
5. Load model + ownerIor into instance: instance.init(model, ownerIor)
6. Instance is now live — can render views, resolve child IORs, navigate chain
```

### IOR Format

```
ior:class:<ClassName>         — resolves to the class loader for that type
ior:instance:<uuid>           — resolves to a loaded scenario instance by UUID
ior:file:<relative-path>      — resolves to a file (PUML, source, test)
```

### IOR Resolution

```typescript
interface IORResolver {
  resolve(ior: string): ScenarioUnit | ClassLoader | File;
}

// Resolution rules:
// "ior:class:Task"      → look up TaskLoader in class registry
// "ior:instance:<uuid>" → look up scenario/index/<prefix>/<uuid>.scenario.json → load it
// "ior:file:<path>"     → resolve relative path to file on disk
```

### Class Registry

```typescript
const CLASS_REGISTRY: Record<string, ClassLoader> = {
  'Task':        new TaskLoader(),
  'Requirement': new RequirementLoader(),
  'UseCase':     new UseCaseLoader(),
  'Class':       new ClassLoader(),
  'Method':      new MethodLoader(),
  'Test':        new TestLoader(),
  'Sprint':      new SprintLoader(),
};

// Resolve: "ior:class:Task" → CLASS_REGISTRY['Task']
```

### The 7 Classes — Model Attributes

#### Sprint
```jsonc
{
  "ior": "ior:class:Sprint",
  "model": {
    "uuid": "...",
    "name": "Sprint 1 — RawBin Foundation",
    "number": 1,
    "goal": "Bootstrap team, strip server, rebrand",
    "status": "Done",
    "tasks": ["ior:instance:<task-uuid>", ...],        // children
    "requirements": ["ior:instance:<req-uuid>", ...]   // requirements.md entries
  },
  "ownerIor": null  // top-level, no owner
}
```

#### Task
```jsonc
{
  "ior": "ior:class:Task",
  "model": {
    "uuid": "...",
    "name": "T1: Bootstrap robbinTeam",
    "description": "Clone ud-team agents as robbinTeam...",
    "status": "Done",
    "assigned": "robbin-expert",
    "effort": "S",
    "children": ["ior:instance:<subtask-uuid>", ...],  // T1.1, T1.2, ...
    "requirements": ["ior:instance:<req-uuid>"],        // up-link
    "useCases": ["ior:instance:<uc-uuid>", ...],        // down-link
    "implementations": ["ior:instance:<impl-uuid>", ...]
  },
  "ownerIor": "ior:instance:<sprint-uuid>"
}
```

#### Requirement
```jsonc
{
  "ior": "ior:class:Requirement",
  "model": {
    "uuid": "...",
    "name": "R17.1 Scenario JSON unit",
    "description": "Every instance is a uuid.scenario.json with {ior, model, ownerIor}",
    "priority": "HIGH",
    "source": "Tron 2026-05-30 compound-requirement-source.md",
    "tasks": ["ior:instance:<task-uuid>", ...],     // down-link
    "tests": ["ior:instance:<test-uuid>", ...]
  },
  "ownerIor": "ior:instance:<sprint-uuid>"
}
```

#### UseCase
```jsonc
{
  "ior": "ior:class:UseCase",
  "model": {
    "uuid": "...",
    "name": "unit.load",                              // Object.verb
    "object": "Unit",
    "verb": "load",
    "tasks": ["ior:instance:<task-uuid>"],             // up-link
    "classes": ["ior:instance:<class-uuid>", ...],     // down-link
    "requirement": "ior:instance:<req-uuid>"           // up-link to originating req
  },
  "ownerIor": "ior:instance:<task-uuid>"
}
```

#### Class (noun)
```jsonc
{
  "ior": "ior:class:Class",
  "model": {
    "uuid": "...",
    "name": "TaskLoader",
    "file": "ior:file:src/ts/server/TaskLoader.ts",
    "useCases": ["ior:instance:<uc-uuid>", ...],
    "methods": ["ior:instance:<method-uuid>", ...]
  },
  "ownerIor": "ior:instance:<uc-uuid>"
}
```

#### Method (verb)
```jsonc
{
  "ior": "ior:class:Method",
  "model": {
    "uuid": "...",
    "name": "TaskLoader.load",                        // Class.verb
    "class": "ior:instance:<class-uuid>",             // owner class
    "implementations": ["ior:instance:<impl-uuid>"],
    "tests": ["ior:instance:<test-uuid>"],
    "task": "ior:instance:<task-uuid>",               // traces back to task
    "requirement": "ior:instance:<req-uuid>"           // traces back to requirement
  },
  "ownerIor": "ior:instance:<class-uuid>"
}
```

#### Test
```jsonc
{
  "ior": "ior:class:Test",
  "model": {
    "uuid": "...",
    "name": "TS1: trace-cli on new requirements.md",
    "file": "ior:file:test/vitest/trace-cli.test.ts",
    "methods": ["ior:instance:<method-uuid>", ...],
    "requirements": ["ior:instance:<req-uuid>", ...],
    "status": "PASS"
  },
  "ownerIor": "ior:instance:<task-uuid>"
}
```

### Relationship Navigation

Every IOR array in `model` is a navigable link. The chain:

```
Requirement.tasks[] → Task.useCases[] → UseCase.classes[] → Class.methods[] → Method.tests[]
                                                                                    ↑
Method.requirement → Requirement  (full reverse trace: method → task → requirement)
```

### Compatibility with Existing TraceModel

The existing `TraceModel.ts` (T101) already has `Requirement`, `Task`, `UseCase`, `TraceClass`, `Method`, `Implementation`, `Test` classes with typed links. The scenario-unit format is the **persistence layer** for TraceModel:

```
TraceModel (in-memory typed graph)
    ↕ serialize/deserialize
Scenario Units (on-disk JSON files)
```

`TraceGraph.toJSON()` already emits `FlatObject[]`. The scenario-unit format extends this with `ior` (class loader) and `ownerIor` (ownership), plus stores each object as an individual file instead of a monolithic array.

### Key Design Decision: IOR is NOT UUID

| Field | Contains | Example |
|-------|----------|---------|
| `ior` | Class loader reference | `"ior:class:Task"` |
| `model.uuid` | Instance identity (v4 UUID) | `"a7f3c1d2-..."` |
| `ownerIor` | Owner instance reference | `"ior:instance:<parent-uuid>"` |
| `model.children[]` | Related instance references | `["ior:instance:<child-uuid>"]` |

The outer `ior` tells the system HOW to process this file. The `model.uuid` tells it WHICH instance this is. They serve different purposes — never conflate them.

---

*Author: robbin-architect @ robbinTeam:0.1*
*Refined: 2026-05-30 per Tron clarification (ior = class loader, not instance UUID)*
