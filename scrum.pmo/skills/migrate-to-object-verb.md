# Migrating from legacy skill scripts to Object.verb surfaces

*Author: robbin-skill-expert · 2026-06-11 · Tron directive: planner migrates FIRST, then the rest of the team.*

## Why migrate (and why it's safe)

The logic already migrated — legacy scripts are byte-identical shims over `Chain`/`Velocity`
classes (commit 0b24dcdb). You are already running migrated code through old syntax.
Migration = changing your invocation habit, nothing else.

- **Safe**: shims are permanent. Old commands keep working. Rollback = keep typing the old form.
- **Worth it**: new verbs (`scoreboard`, `listComplete`, `snapshotComplete`) ONLY exist on the
  new surface. Tab completion only on `taskChain`. Every guard/coverage fix lands once in the
  class and applies to all surfaces simultaneously.

## The mapping (legacy → new)

| You type today | Object.verb CLI | OOSH (Tab-completes) |
|---|---|---|
| `npx tsx scripts/po-chain-follow-up.ts --all` | `npx tsx scripts/objectVerb.ts Chain followUp --all` | `taskChain chain.followUp --all` |
| `npx tsx scripts/po-chain-follow-up.ts --sprint S19` | `npx tsx scripts/objectVerb.ts Chain followUp --sprint S19` | `taskChain chain.followUp --sprint S19` |
| `npx tsx scripts/chain-wire-impl-node.ts <uuid>` | `npx tsx scripts/objectVerb.ts Chain wireImplNode <uuid>` | `taskChain chain.wireImplNode <uuid>` |
| `npx tsx scripts/team-velocity.ts --hours 5` | `npx tsx scripts/objectVerb.ts Velocity dashboard --hours 5` | `taskChain velocity.dashboard --hours 5` |
| *(no legacy equivalent)* | `Chain scoreboard` / `Chain listComplete` / `Chain snapshotComplete` | `taskChain chain.scoreboard` etc. |

Help for any verb: `npx tsx scripts/objectVerb.ts` (lists objects) ·
`npx tsx scripts/objectVerb.ts Chain` (lists verbs + params from JSDoc).

## PLANNER-FIRST migration (your three loops, upgraded)

Your current loop greps a summary line out of a report. The new verbs return your
actual work products directly:

1. **Completion loop** — replace
   `npx tsx scripts/po-chain-follow-up.ts --all | grep "^## Summary"`
   with `npx tsx scripts/objectVerb.ts Chain followUp --all` (JSON: `complete`/`total`/`excluded`
   — det-3x exactly as before, same canonical number).
2. **Flip tracking** — stop diffing by hand: `Chain snapshotComplete` writes the dated TSV
   AND prints named `+`/`-` flips vs the prior snapshot. This is the verb that produced
   every snapshot in scrum.pmo/chain-snapshots/ since 2026-06-11.
3. **Lane dispatch** — `Chain scoreboard` returns the open-nodes table with owner column
   (tester/expert/architect) ready to paste into handoffs. No more deriving lanes from
   the followUp report.

### Verification ritual (validate-before-trust)
1. Run old + new form back-to-back: `complete/total` must match exactly.
2. det-3x the new form (3 identical runs).
3. Then — and only then — update YOUR OWN boot.md/context.md to the new invocations
   (wer schreibt der bleibt: you own your files; nobody edits them for you).

### After you've migrated
Confirm to skill-expert (one-line pointer). You then own teaching the SAME ritual to
tester + expert via your handoff files — their instructions today still carry the
legacy form; replace at next handoff refresh, not retroactively.

## Anti-patterns
- Do NOT delete or bypass the legacy shims — agents mid-task depend on them.
- Do NOT grep new-surface JSON with old-surface patterns (`^## Summary` doesn't exist in JSON).
- Do NOT mix surfaces inside one det-3x (3 runs on ONE form).
