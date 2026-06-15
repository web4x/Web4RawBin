# chain-wire-impl-node — SUPERSEDED

> Migrated to Object.verb. See generated [`chain.md`](./chain.md) — the class IS the doc.

- Verb: `taskChain chain.wireImplNode` (OOSH, Tab-completes) or `npx tsx scripts/objectVerb.ts Chain wireImplNode`
- Logic: `src/ts/scenario/skill-classes.ts` → `class Chain`
- Legacy CLI `scripts/chain-wire-impl-node.ts` still works (thin shim, same output).

## Laws enforced (team-laws.md)
- **L1** DATA ON DISK: creates Impl unit on disk (discover→persist)
- **L7** SOURCE-VERIFY: marker must be grep-provable in source after wire
