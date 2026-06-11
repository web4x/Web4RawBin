# How to Write Skills (Object.verb)

**Audience:** All agents (PO, architect, expert, tester, planner, req)
**Pattern:** OOSH — Object.verb

## Core Principle

Write skills like OOSH: the **logic lives in a typed Class method**; the **script/CLI is thin dispatch**.

```
scriptname method args  →  Class.method(args)
```

This makes skills themselves traceable units: Class → Method → Implementation → Test — the same chain model as our scenario units.

## The Pattern

### 1. Class (the logic)

Logic lives in `src/ts/scenario/skill-classes.ts` (or a domain-specific file). Each skill object is a class with typed methods:

```typescript
// src/ts/scenario/skill-classes.ts
export class Chain {
  constructor(private idx: ScenarioIndex, private srcDir: string, private testDir: string) {}

  /** po.chainFollowUp — walk chain per Req, produce scoreboard */
  followUp(reqUuids: string[]): { rows: ChainRow[]; complete: number; total: number; excluded: number } {
    // ... all logic here
  }

  /** chain.wireImplNode — wire Method→Impl→Test */
  wireImplNode(methodUuid: string, dryRun: boolean): WireResult {
    // ... all logic here
  }
}

export class Velocity {
  constructor(private repoDir: string, private chain: Chain) {}

  compute(since: string, sprint?: string): VelocityResult {
    // ... sources Chain.followUp for canonical numerator
  }
}
```

### 2. Script (thin dispatch)

The CLI script in `scripts/` is just argument parsing + dispatch to the class:

```typescript
// scripts/po-chain-follow-up.ts
import { Chain } from '../src/ts/scenario/skill-classes.js';
import { ScenarioIndex } from '../src/ts/scenario/index.js';

const idx = new ScenarioIndex('scenario/index');
const chain = new Chain(idx, 'src', 'test');

// Parse args → dispatch
const result = chain.followUp(reqUuids);
// Format + print
```

### 3. SKILL.md (the contract)

`scrum.pmo/skills/<object>-<verb>.md` documents invocation, parameters, output format. References the Class.method as the implementation.

### 4. Scenario unit (the traceability)

Each skill class + method gets scenario units in the chain:
- `ior:class:Class` → `Chain` (or `Velocity`)
- `ior:class:Method` → `Chain.followUp`, `Chain.wireImplNode`, `Velocity.compute`
- `ior:class:Implementation` → the `[impl:uuid:]` marker on the class method
- `ior:class:Test` → the `[test:uuid:]` marker on the test

## Rules

1. **Logic in the class, not the script.** The script parses args and formats output. The class does the work.
2. **Shared state via constructor.** Pass `ScenarioIndex`, paths, etc. via constructor — not global variables.
3. **Composable.** `Velocity` takes `Chain` as a dependency. Don't reimplement chain-walking in velocity — call `chain.followUp()`.
4. **Deterministic.** Same inputs → same outputs. No `Date.now()` in the logic (pass timestamps as args).
5. **Validated before authoritative.** 3 identical runs before trusting a new metric. Document validation in the commit.
6. **Object.verb naming.** `Chain.followUp`, `Chain.wireImplNode`, `Velocity.compute` — noun.verb, matching our UseCase naming convention.
7. **ONE canonical measure per metric.** Chain completion has ONE canonical measure: `Chain.followUp()` via `po-chain-follow-up.ts`. **No parallel counts.** Any script that computes a completion-like number MUST either source `Chain.followUp()` or print `NON-CANONICAL` and refuse to emit a competing number. Prevention over detection.

## Migration checklist (for existing scripts)

- [ ] Extract logic from script into a class method in `skill-classes.ts`
- [ ] Script becomes thin dispatch (arg parse → class.method → format output)
- [ ] Class method has typed parameters + return type
- [ ] Constructor takes dependencies (ScenarioIndex, paths)
- [ ] SKILL.md references the Class.method
- [ ] Scenario units created for the Class + Method

## Examples

| Skill | Class | Method | Script |
|-------|-------|--------|--------|
| po.chainFollowUp | Chain | followUp() | scripts/po-chain-follow-up.ts |
| chain.wireImplNode | Chain | wireImplNode() | scripts/chain-wire-impl-node.ts |
| team.velocity | Velocity | compute() | scripts/team-velocity.ts |
