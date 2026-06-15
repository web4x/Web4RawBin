# How to Write Skills (Object.verb — one source of truth)

**Audience:** All agents (PO, architect, expert, tester, planner, req)
**Pattern:** OOSH applied to TypeScript — the class IS the skill, the signature IS the doc.

## Core Principle (DRY, the OOSH way)

In OOSH, the bash method signature comment is parsed by c2 for help AND completion —
defined once, introspected everywhere. We apply the same model to TypeScript:

```
typed Class method (logic + JSDoc + typed params)
        │  introspected by scripts/objectVerb.ts (= c2 for TS)
        ├─→ CLI invocation + arg mapping        (no per-skill argv parsing)
        ├─→ help text                            (from JSDoc)
        ├─→ Tab completion                       (from param names + complete())
        ├─→ OOSH wrapper `taskChain`             (emitOosh — GENERATED)
        ├─→ skill docs chain.md / velocity.md    (emitDocs — GENERATED)
        └─→ Claude Code skills .claude/skills/rawbin-*/SKILL.md (emitClaudeSkills — GENERATED)
```

**Never** hand-write: argv `--flag` parsers, prose skill .md files, or OOSH wrapper
methods. All three are generated or derived. Flags are FORBIDDEN as skill surface —
verbs are methods (oosh-po rule). One canonical measure per metric.

## Writing a new skill

1. **Add a public method** to a class in `src/ts/scenario/skill-classes.ts`
   (or register a new class in `scripts/objectVerb.ts` registry):

```typescript
export class Chain {
  /** One-line description — becomes help text, OOSH signature comment, and docs */
  listComplete(sprint?: string): CompleteEntry[] {
    // ALL logic here. Typed params only: string, string[], number, boolean.
  }
}
```

Conventions the introspector relies on:
- public method = verb; `private` methods are invisible to the CLI
- JSDoc first line = the description (REQUIRED — missing doc = broken help, same as a missing `#` in OOSH)
- param types limited to `string`, `string[]`, `number`, `boolean`; optional via `?`
- return `string` for rendered output, an array of flat objects for diffable TSV, or a result object (JSON)

2. **Add completion candidates** (if the param benefits from Tab):

```typescript
  complete(verb: string, param: string): string[] {
    if (param === 'sprint') return ['S17', 'S18', 'S19'];   // one candidate per line
    ...
  }
```

3. **Re-emit the generated artifacts** (and commit them):

```bash
npx tsx scripts/objectVerb.ts emitOosh          # regenerates scrum.pmo/skills/taskChain
npx tsx scripts/objectVerb.ts emitDocs          # regenerates chain.md / velocity.md
npx tsx scripts/objectVerb.ts emitClaudeSkills  # regenerates .claude/skills/rawbin-*/SKILL.md
```

4. **Invoke**:

```bash
taskChain chain.listComplete --sprint S19            # OOSH (Tab-completes)
npx tsx scripts/objectVerb.ts Chain listComplete     # direct
```

## Why this beats hand-rolled scripts

| Hand-rolled (before) | Object.verb (now) |
|----------------------|-------------------|
| `args.indexOf('--sprint')` per script | typed param, mapped generically |
| 5 KB prose SKILL.md, drifts | generated from JSDoc, can't drift |
| OOSH wrapper hand-written, deviates | generated canonical (`.start`, per-method completion) |
| duplicate logic script-vs-class | ONE class, shims are 5-line delegates |

## Traceability

Skills are themselves chain units: `class Chain` → `Method followUp` → impl marker
`[impl:uuid:]` in skill-classes.ts → tests in `test/vitest/object-verb.test.ts`.
The skill system eats its own dog food.

## Legacy entry points (kept as thin shims, same output)

`scripts/po-chain-follow-up.ts`, `scripts/team-velocity.ts`,
`scripts/chain-wire-impl-node.ts` — preserved so existing invocations and parsers
(Summary-line regex) keep working. They contain ZERO logic.

## Laws enforced (team-laws.md)
- **L2** MARKDOWN IS VIEW: skill docs generated from class signatures (emitDocs)
- **L10** SINGLE OWNER: logic in typed class method, script = thin dispatch
- **L12** IDEMPOTENT GENERATORS: emitOosh/emitDocs re-runnable without drift
