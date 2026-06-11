# Expert-Blocked Chains — 2026-06-11 (overnight)

**Canonical:** 9/153 COMPLETE. **Architect: 0 open. Tester: 33 (auto-clears once expert wires — all Tests reported done). EXPERT IS THE SOLE GATE: 115 Impl nodes.**

## The single precise edge per chain

Every one of the 115 expert-blocked chains needs the SAME 3-step fix on its Method:
1. **Create Impl scenario unit** (`chain-wire-impl-node <method-uuid>` or `--all-missing`)
2. **Add `[impl:uuid:<impl-uuid>]` marker** at the real function in source (marker MUST = Impl unit uuid, not Method uuid)
3. **Wire `Method.implementations[]→Impl→tests[]`** (the tool/chain-wire-impl-node does this)

Once each Method's Impl is created+marked+wired, its (already-wired) Test registers and the chain flips COMPLETE.

## Highest-fanout Methods (fix these first — each unblocks multiple chains)

| Method | Chains blocked | Note |
|--------|---------------|------|
| `classMethodScope` | 13 | R18.1/2/16/17/18 + more — single Method, huge fanout. ONE fix → 13 flips. |
| `lazyAppend` | 9 | R18.6/7/9 tree lazy-render. ONE fix → 9 flips. |
| `symlinkJson(sprint)` | 5 | R17.7/8/9/10/11 view-gen symlinks. ONE fix → 5 flips. |
| `render` | 4 | R10.2 + R16.6. |
| `feedbackCycle` | 3 | DnD dispatcher. |
| `ts:migrate`, `persistAsSymlink`, `onPinchEnd`, `navigate`, `modeSet`, `mobileCap` | 2 each | |
| ~55 singleton Methods | 1 each | |

**Leverage:** the top-3 Methods (`classMethodScope` 13 + `lazyAppend` 9 + `symlinkJson` 5 = 27 chains) are 23% of the open work in 3 fixes. Routing expert to those first gets us past 25% fastest.

## Batch tool

`npx tsx scripts/chain-wire-impl-node.ts --all-missing` creates all missing Impl units + wires Method.implementations[] in one pass. Then expert adds the source `[impl:uuid:]` markers (the manual part — must match each Impl unit's uuid at the real function).

## Full list

115 rows saved to `/tmp/expert-blocked.txt` (regenerate: `npx tsx scripts/po-chain-follow-up.ts --all | grep '**expert**'`).

---

*Tester 33 Tests are NOT independently blocked — they're downstream of these 115 Impls. As expert clears Impls, tester's Tests auto-register. No separate tester grind needed.*
