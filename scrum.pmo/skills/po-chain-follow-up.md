# po-chain-follow-up — SUPERSEDED

> Migrated to Object.verb. See generated [`chain.md`](./chain.md) — the class IS the doc.

- Verb: `taskChain chain.scoreboard` (OOSH, Tab-completes) or `npx tsx scripts/objectVerb.ts Chain scoreboard`
- Logic: `src/ts/scenario/skill-classes.ts` → `class Chain`
- Legacy CLI `scripts/po-chain-follow-up.ts` still works (thin shim, same output).

## Laws enforced (team-laws.md)
- **L1** DATA ON DISK: scorer reads units from disk via ScenarioIndex
- **L5** TEAM PROVES: det-3x canonical = team's proof, not Tron's job
- **L7** SOURCE-VERIFY + DET-3x: 3 identical runs + agrees canonical + named-case check
