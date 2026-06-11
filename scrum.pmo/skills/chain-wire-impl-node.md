# chain.wireImplNode

**UUID:** `d4e5f6a7-b8c9-4d0e-9f1a-2b3c4d5e6f7a`
**Roles:** robbin-expert
**Requirement:** R-E (6-step chain), R17.13 (method→impl→test closure)

## Description

Given a Method UUID, ensure the Impl node is correctly wired in the 6-step chain: Method → Implementation → Test. Creates the Implementation unit if missing, wires `Method.implementations[]`, moves any `Method.tests[]` refs to `Impl.tests[]`, and sets the `[impl:uuid:]` source marker. Idempotent — safe to re-run. Validates via `po.chainFollowUp` after.

## Invocation

```bash
npx tsx scripts/chain-wire-impl-node.ts <method-uuid> [--dry-run]
npx tsx scripts/chain-wire-impl-node.ts --all-missing [--dry-run]
```

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `methodUuid` | `uuid` | ✓ (or --all-missing) | Method to wire |
| `--all-missing` | `flag` | | Wire all Methods with empty implementations[] |
| `--dry-run` | `flag` | | Report what would change without writing |

## Steps (idempotent)

1. Load Method unit from scenario index
2. If `Method.implementations[]` is non-empty AND all point to valid Impl units → already wired, skip
3. **Create Implementation unit** (`ior:class:Implementation`):
   - UUID: `crypto.randomUUID()`
   - `model.name`: same as Method name
   - `model.sourceFile`: from Method's parent Class.sourceFile (or `ior:file:<inferred-path>`)
   - `model.tests`: []  (populated in step 5)
4. **Wire forward**: add `ior:instance:<impl-uuid>` to `Method.implementations[]`
5. **Move tests**: if `Method.tests[]` has entries, MOVE them to `Impl.tests[]` (the chain goes Method→Impl→Test, NOT Method→Test)
6. **Clear** `Method.tests[]` to `[]` (tests belong on Impl, not Method)
7. **Report** the source file + line where `[impl:uuid:<impl-uuid>]` marker should be added (expert adds manually or via sed)
8. **Validate**: run `po.chainFollowUp` on the parent Requirement to confirm chain advanced

## Impl-node rule (MANDATORY)

- Method→Test direct (`Method.tests[]` populated, `Method.implementations[]=[]`) is **INCOMPLETE**
- The Implementation unit MUST exist as a distinct `ior:class:Implementation`
- `Method.implementations[]` MUST reference it
- `Impl.tests[]` MUST reference the Test (NOT `Method.tests[]`)
- A real `[impl:uuid:<uuid>]` marker MUST exist in the source file

## Source marker guidance

After the script creates the Impl unit + wires the arrays, the expert must add the marker in source:

```typescript
// [impl:uuid:<impl-uuid>] <method-name>
```

The marker goes on or near the method definition in the source .ts file. The `<impl-uuid>` is the Implementation unit's UUID (printed by the script), NOT the Method UUID.

## Idempotency

- Re-running on an already-wired Method: no-op (checks implementations[] first)
- Re-running after partial wire: completes the remaining steps
- `Method.tests[]` move is one-shot: once moved to Impl, Method.tests[]=[] stays empty

## Examples

```bash
# Wire a specific method
npx tsx scripts/chain-wire-impl-node.ts 7a983076-23e0-419c-a6d0-2a10f4342b4b

# Dry-run all unlinked methods
npx tsx scripts/chain-wire-impl-node.ts --all-missing --dry-run

# Wire all, then validate
npx tsx scripts/chain-wire-impl-node.ts --all-missing
npx tsx scripts/po-chain-follow-up.ts --all
```
