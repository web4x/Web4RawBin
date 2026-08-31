# CurrentSprint empty-but-open (P0-A) — surfacing + referential-integrity (architect, 2026-08-31)

Tron P0: CurrentSprint renders OPEN but EMPTY on /trace + /model → blocks all MVC + his iOS verdict. Tester + expert root-caused; I measured the disputed facts myself + answer the PO's two design questions.

## ★ SCOPE CORRECTION (PO caught my under-count; owned) — the damage was ~10, not 3
My "3 dangling (sprint-40)" was an UNDER-SCOPE: I swept `sprint-40` (`8e8b32d6`) because the R37.1 error MESSAGE named it — but **a fail-closed reports where it STOPPED (the first refusal), not the full damage.** The pin actually resolves to **Sprint 37 `b86b53cc` "Consistency by Construction" (#37, current-era)** — its chain carried 7 more dangling refs (61718883, bd0e5f4a, 25772198, 968d966d, 2af98c11, afe976e3, e2068636). Full current-era set ≈ 10 (S37's 7 + sprint-40's 3); my "3" and planner's "5" were both sprint-40 SUBSETS (PO's own measurement). I HAD the S37 signal (Task 37.21 designation, measured earlier) and dropped it for the relayed "sprint-40" framing — the lesson is folded into Q2 (report-ALL) + the truth-decay family. **RESOLVED:** expert carried the S37 chain transitive-closure (commit `f57d8188e`, 9 units: 7 Tasks + 1 Req + 1 UC); my re-sweep of ALL current-era sprints = **0 dangling now** (verified, not relayed — even the "10" had decayed to 0 by the time I re-measured). Expert owns the carry end-to-end.

## Measured root (I re-derived the PO-vs-expert conflict)
- `bb9dec65` (Task 40.62): **ABSENT** on served-disk + HEAD; **present** on origin/main + mint-commit `8e0dae054`. Sprint-40 unit `8e8b32d6` (on served) **references** it.
- The `/api/ior` `{ior,type,filePath}` shape = PATH-COMPUTED-BUT-FILE-ABSENT (`get()`→null degraded stub), NOT file-exists-empty. So: **dangling cross-branch ref**, not a corrupt write. (Reconciles PO's "empty/corrupt" ↔ expert's "absent"; expert correct.)
- `resolveSprintPin` (sprint-pin-resolver.ts:120, INV-C1-6) correctly FAIL-CLOSES on an unresolvable task ref → the whole current-sprint refuses → server.ts:2895 catch → `slots` stay all-null.
- Regression window [0.8.87→0.8.148]; NOT Phase-A (only 4 detail-view files changed 147→148; tree/pin/derivation byte-identical — expert). Surfaced by the v0.8.148 restart re-deriving disk (warm v0.8.147 had cached).

## Q1 — the fail-loud did NOT reach the user (fail-SILENT at the surface)
MEASURED: server.ts:2908 `children = slotEntries.filter(s => s.slot?.taskUuid)` → on a refused pin every slot is null → `children=[]` → the node renders OPEN + EMPTY. `pinSprintLabel` = `⚠ UNRESOLVED — R37.1 FAIL-CLOSED: … refusing` is computed (2887/2896) but **never emitted as a child**. A fail-closed whose reason is dropped by the UI is fail-SILENT from the only vantage that matters.

**FIX (code-only, no prod write, no Tron wait):** when the pin is unresolved (the catch fired / `pinSprintLabel` starts with `⚠`) OR `children.length === 0` after the slot map, emit a single NOTICE child where the slots would be:
```ts
if (children.length === 0) {
  children.push({ uuid: 'currentsprint:unresolved', type: 'notice',
    name: pinSprintLabel || '⚠ current sprint unresolved (no slots)', hasChildren: false });
}
```
This is the SAME law shipped in Phase-A (base `renderUnresolved` renders the reason WHERE content would be) and the OtmuxBridge degraded-notice-row pattern — different surface, one discipline: **render the refusal reason where the children would have been, never an empty expansion.** Gate: feed a sprint with a dangling task ref → the tree shows the ⚠ reason as a child (stub-must-fail: an empty expansion with a refused pin = RED).

## Q2 — what put the graph in this state + the by-construction guard
CORRECTED by measurement: NOT a malformed-write. It is a **partial cross-branch data-carry** — `8e8b32d6`'s updated task-list (with the bb9dec65 ref) reached the served hotfix tree; the referent Task-40.62 unit did not (hotfix/main divergence, same family as the R40.69 stranded-units episode). Repairing bb9dec65 alone leaves the CAUSE (an incomplete carry) alive.

**GUARD (write-side dual of R37.1's read-side fail-closed):** REFERENTIAL INTEGRITY — a persisted/carried unit's outbound refs (`tasks[]`, `ownerIor`, `coveredRequirements[]`, `useCases[]`, chain refs) must RESOLVE IN THE TREE; a dangling ref = RED. **★ REPORT ALL, NEVER ABORT ON FIRST (PO, from the under-scope above):** the guard must ENUMERATE every unresolvable ref across every ref-bearing unit — R37.1 fail-closes on the FIRST and its message named only sprint-40, which is exactly why three of us under-scoped to a subset. A guard that stops at the first refusal hands every future consumer the same partial picture; it must emit the COMPLETE set (all sprints, all ref kinds) so a carry is referentially COMPLETE in one shot, not whack-a-mole. Run it (a) as a gate on any cross-branch/cross-tree data-carry (the carry is referentially complete or it fails loud), and (b) in `ci:gates` (trace-audit family) so a dangling ref can never sit silently on a served tree. This makes "a sprint references a task that isn't here" impossible-to-ship, not merely refused-at-read.

**★ HONEST FLAG (separate latent, not this incident):** the PO's atomic-put instinct is a REAL bug — `ScenarioIndex.put` (index-store.ts:57) is a NON-ATOMIC in-place `fs.writeFileSync` with no shape validation; a crash/interruption/concurrent-op mid-write COULD leave a truncated file (a DIFFERENT malformed shape than this dangling one). Worth hardening as a **separate** preventive: (1) atomic write (temp + rename); (2) refuse to persist a unit failing its own shape check (has `ior` + `model` with a `uuid`). Do NOT misattribute this P0 to it — bb9dec65 is absent, not truncated. Two distinct guards for two distinct malformed-unit causes (absent-referent vs truncated-file).

## Routing
- **Immediate (A) unblock** (PO ruled: an AUTHORIZED git-reversible data-only carry of already-committed units, NOT a raw prod-data write / NOT Tron-GO — same op as 67fac186e). **SWEEP-ALL FIRST (PO precondition, DONE):** sprint-40 has **3** dangling task refs — `bb9dec65` (Task 40.62), `b981f1c9`, `800fa79d` — all on origin/main, carryable in ONE path-limited data-only carry. A one-unit fix would surface the next R37.1 refusal = a 2nd false 'fixed'. Deeper chain from resolving tasks = 0; the 3 dangling units' OWN refs are unsweepable-until-carried → **carry-then-re-sweep-to-CLOSURE** (carry 3 → verify their refs resolve → repeat until 0 dangling). Expert has it + rides the Q1 notice-child.
- **Q1 surfacing** → expert (code, ships without Tron) — converts fail-silent→fail-loud NOW even before the data repair.
- **Q2 referential-integrity gate** + **atomic-put hardening** → design→req mints ACs (ride R40.54 failable family)→planner tasks→expert. Both FAILABLE (dangling-ref fixture→RED; interrupted-write fixture→truncated file blocked).

(B) expand-latency is separate (tester measuring per-node-type timings / N+1 load shape) — not this note.
