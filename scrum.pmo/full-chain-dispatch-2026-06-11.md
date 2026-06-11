# Full Chain Dispatch — 2026-06-11

**Source:** `npx tsx scripts/po-chain-follow-up.ts --all`
**Chains:** 52/612 COMPLETE (560 open) — **WHOLE PROJECT S1-S19**
**Tool:** `chain-wire-impl-node --all-missing` available for expert batch

## Denominator reconcile

| Scope | Chains | Complete | Note |
|-------|--------|----------|------|
| **--all (S1-S19)** | 612 | 52 (8.5%) | Tool truth — whole project. Tron's overnight directive "fill missing traceability" applies project-wide. |
| S19-only | 51 reqs | partial | S19 has 51 owned Requirements; subset of 612. |
| Prior report (482) | — | — | STALE — was S19 chains before tool existed; tool counts all sprints. |

**Driving to: 612/612** (PO to confirm vs Tron; if Tron's intent was S19-only, PO narrows scope). Until then, --all is the denominator.

## Batched Open Nodes by Owner

| Owner | Node type | Count | Action | Tool/method |
|-------|-----------|-------|--------|-------------|
| **architect** | UC | 27 | Create UC + wire to Requirement.useCases[] | Manual — singular UC per req |
| **architect** | Class | 0 | ✓ ALL WIRED (was 54; expert 269ceb32 + prior batches closed) | — |
| **architect** | **subtotal** | **27** | | |
| **expert** | Impl | 525 (fan-out rows; many share uuids) | Add `[impl:uuid:<uuid>]` marker at the real function in source | `chain-wire-impl-node --all-missing`; 269ceb32 fixed 6 + added 3; chains still need Test to flip COMPLETE |
| **expert** | **subtotal** | **525** | | |
| **tester** | Test | 537 | Create Test scenario unit + add `[test:uuid:]` marker in test file | **DISPATCH NOW** — many Impl markers landed (269ceb32); those chains' Test nodes are the bottleneck to flipping COMPLETE |
| **tester** | **subtotal** | **537** | | |

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

## Exceptions (honest exclusions — auditable, not silent gaps)

| Method uuid | Method name | Req | testException | Reason |
|-------------|-------------|-----|---------------|--------|
| `5d6e7f8a` | ServiceWorker.ignoreSearchNav | R19.32 | **true** | Service worker `cacheFirst` with `ignoreSearch` is not unit-testable (runs in SW context, no DOM, no vitest). Covered by share-link E2E test (Playwright navigates `/app?join=<uuid>` offline → verifies app loads). NOT counted as a silent gap — explicitly excluded from the Test-leaf-required invariant for this chain. |

**Rule:** exceptions are VISIBLE here, not buried in allowlists. Each must state: which method, which req, why untestable, and what DOES cover it (E2E, manual Tron verify, etc.). SM can audit this section at any time.

## Full output

The complete 770-row dispatch table is at `/tmp/chain-follow-up-full.txt` (generated this session). Regenerate anytime: `npx tsx scripts/po-chain-follow-up.ts --all`.

---

*52/612 → target 612/612 (minus documented exceptions + orphan-by-design). No chain done until its Test leaf is real or explicitly excepted above.*
