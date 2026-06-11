# Full Chain Dispatch — 2026-06-11

**Source:** `npx tsx scripts/po-chain-follow-up.ts --all`
**Chains:** 10/176 COMPLETE — **CANONICAL DENOMINATOR (one row per Req, deterministic)**
**Tool:** `po-chain-follow-up.ts --all` (canonical since `2c3ac41d`) + `chain-wire-impl-node --all-missing`

## Denominator history + stabilization

| Date | Denominator | Complete | What changed |
|------|-------------|----------|--------------|
| 2026-06-11 AM | 476/482/612 | 46-52 | Unstable — fan-out rows, inconsistent scope. PO held %. |
| 2026-06-11 `2c3ac41d` | **176** | **10** | **STABLE** — canonical: one row per Requirement, deterministic. Orphans excluded (0 orphanByDesign flagged; ~20 R17.x meta/CI pruned by architect `2695c3c8` placeholder purge). |

**Driving to: 176/176.** Denominator stable — PO can report % now.

## Batched Open Nodes by Owner

| Owner | Node type | Count | Action | Tool/method |
|-------|-----------|-------|--------|-------------|
| **architect** | UC | 22 | Create UC + wire to Requirement.useCases[] | Manual — singular UC per req. Was 27; `2695c3c8` fixed 5 placeholder IORs. |
| **architect** | Class | 0 | ✓ ALL WIRED | — |
| **architect** | **subtotal** | **22** | | |
| **expert** | Impl | 143 | Add `[impl:uuid:<uuid>]` marker at the real function in source | `chain-wire-impl-node --all-missing`; canonical count (no fan-out duplication) |
| **expert** | **subtotal** | **143** | | |
| **tester** | Test | 144 | Create Test scenario unit + add `[test:uuid:]` marker in test file | **DISPATCH NOW** — tester `456cb5a1` landed 5 Tests (6/6 GREEN); more Impl markers ready for Test wiring |
| **tester** | **subtotal** | **144** | | |

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

*10/176 → target 176/176 (canonical, stable denominator). No chain done until its Test leaf is real or explicitly excepted above.*
