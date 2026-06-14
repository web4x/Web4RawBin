### R20.15: DRY-unify trace forward-key maps → single CHAIN_TYPE_CONFIG (eliminates BUG9-class by construction)

<details><summary>Tron directive</summary>

> Today 5 PARALLEL forward-key maps must be kept in sync by hand — TraceModel.FORWARD_KEYS, server SCENARIO_FWD, server TRACE_FWD, server EXPECTED_CHILD_TYPE, and client forward-only.FORWARD_KEYS. A missing entry in any one (e.g. Bug) silently breaks /trace children (this was BUG9/BUG12). DURABLE FIX: collapse all 5 into ONE shared source of truth src/ts/shared/chain-model.ts `CHAIN_TYPE_CONFIG` + derived accessors; every consumer imports it. Adding a node type (Bug/ChangeRequest/etc.) is then a single-place edit, eliminating the BUG9-class of defects BY CONSTRUCTION. Parity-regression AC: the unified config must produce IDENTICAL forward keys to the old 5 maps for every existing type. Ships AFTER the BUG9 stopgap (v0.6.31).

</details>

## Traceability

**UseCases:**
- [🔗 chainModel.unifiedForwardKeys](../usecase/chainmodel-unifiedforwardkeys.md)

**Implementations:**
- [🔗 CHAIN_TYPE_CONFIG impl](../implementation/chain-type-config-impl.md)
