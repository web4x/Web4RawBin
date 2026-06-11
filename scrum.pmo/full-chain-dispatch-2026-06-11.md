# Full Chain Dispatch — 2026-06-11

**Source:** `npx tsx scripts/po-chain-follow-up.ts --all`
**Chains:** 46/476 COMPLETE (430 open)
**Tool:** `chain-wire-impl-node --all-missing` available for expert batch (1 new Impl to create; rest = source marker placement)

## Batched Open Nodes by Owner

| Owner | Node type | Count | Action | Tool/method |
|-------|-----------|-------|--------|-------------|
| **architect** | UC | 24 | Create UC + wire to Requirement.useCases[] | Manual — singular UC per req |
| **architect** | Class | 54 | Wire Class to UC.classes[] | Manual — assign existing or new Class per UC |
| **architect** | **subtotal** | **78** | | |
| **expert** | Impl | 75 unique (346 fan-out rows) | Add `[impl:uuid:<uuid>]` marker at the real function in source | `chain-wire-impl-node --all-missing` for unit creation; then grep source for the function + add marker comment |
| **expert** | **subtotal** | **75 unique** | | |
| **tester** | Test | 350 | Create Test scenario unit + add `[test:uuid:]` marker in test file | Manual per chain; blocked on Impl |
| **tester** | **subtotal** | **350** | | |

## Architect: 24 UCs needed (by requirement)

The 24 reqs that have NO UseCase wired via `Requirement.useCases[]`:

```
R17.21, R17.34, R17.35, R17.36, R17.41, R17.42, R17.46, R17.47,
R19.2 (partial — some UCs exist, others missing), R19.23, R19.32,
and ~13 others visible in the full follow-up output
```

Run `npx tsx scripts/po-chain-follow-up.ts --all | grep "UC.*architect"` for the exact list.

## Architect: 54 Classes to wire

These are UCs that HAVE a UC but the UC.classes[] is empty. The Class likely exists already (architect just needs to wire the IOR).

Run `npx tsx scripts/po-chain-follow-up.ts --all | grep "Class.*architect"` for the exact list.

## Expert: 75 unique Impl markers

The 346 rows in the follow-up output are fan-out (same Impl uuid appears in multiple chains sharing a Method). The **75 unique impl:uuid values** are the real work items — each needs:

1. A `[impl:uuid:<uuid>]` comment placed at the real function in source
2. An Implementation scenario unit (if missing — `chain-wire-impl-node --all-missing` creates them)
3. `Method.implementations[]` IOR wired (the tool handles this)

**Batch approach:** `npx tsx scripts/chain-wire-impl-node.ts --all-missing` (dry-run shows 1 new unit; the other 74 may already have units but lack source markers).

## Tester: 350 Tests

Each open chain endpoint needs a Test scenario unit + `[test:uuid:]` marker in a test file. Blocked on the Impl layer being complete (Test.parent must point at an Impl).

## Sequencing

```
architect (78 nodes) ──→ expert (75 Impl markers) ──→ tester (350 Tests)
         │                      │
         └─ UC+Class unblocks ──┘─ Impl unblocks Test
```

Architect and expert can work in parallel on different chains — architect wires UC/Class for reqs that have them missing, expert marks Impls for reqs that already have UC/Class/Method complete.

## Full output

The complete 770-row dispatch table is at `/tmp/chain-follow-up-full.txt` (generated this session). Regenerate anytime: `npx tsx scripts/po-chain-follow-up.ts --all`.

---

*46/476 → target 476/476. No chain done until its Test leaf is real.*
