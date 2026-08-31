# CurrentSprint empty-but-open (P0-A) — surfacing + referential-integrity (architect, 2026-08-31)

Tron P0: CurrentSprint renders OPEN but EMPTY on /trace + /model → blocks all MVC + his iOS verdict. Tester + expert root-caused; I measured the disputed facts myself + answer the PO's two design questions.

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

**GUARD (write-side dual of R37.1's read-side fail-closed):** REFERENTIAL INTEGRITY — a persisted/carried unit's outbound refs (`tasks[]`, `ownerIor`, `coveredRequirements[]`, `useCases[]`, chain refs) must RESOLVE IN THE TREE; a dangling ref = RED. Run it (a) as a gate on any cross-branch/cross-tree data-carry (the carry is referentially complete or it fails loud), and (b) in `ci:gates` (trace-audit family) so a dangling ref can never sit silently on a served tree. This makes "a sprint references a task that isn't here" impossible-to-ship, not merely refused-at-read.

**★ HONEST FLAG (separate latent, not this incident):** the PO's atomic-put instinct is a REAL bug — `ScenarioIndex.put` (index-store.ts:57) is a NON-ATOMIC in-place `fs.writeFileSync` with no shape validation; a crash/interruption/concurrent-op mid-write COULD leave a truncated file (a DIFFERENT malformed shape than this dangling one). Worth hardening as a **separate** preventive: (1) atomic write (temp + rename); (2) refuse to persist a unit failing its own shape check (has `ior` + `model` with a `uuid`). Do NOT misattribute this P0 to it — bb9dec65 is absent, not truncated. Two distinct guards for two distinct malformed-unit causes (absent-referent vs truncated-file).

## Routing
- **Immediate (A) unblock** (PO ruled: an AUTHORIZED git-reversible data-only carry of already-committed units, NOT a raw prod-data write / NOT Tron-GO — same op as 67fac186e). **SWEEP-ALL FIRST (PO precondition, DONE):** sprint-40 has **3** dangling task refs — `bb9dec65` (Task 40.62), `b981f1c9`, `800fa79d` — all on origin/main, carryable in ONE path-limited data-only carry. A one-unit fix would surface the next R37.1 refusal = a 2nd false 'fixed'. Deeper chain from resolving tasks = 0; the 3 dangling units' OWN refs are unsweepable-until-carried → **carry-then-re-sweep-to-CLOSURE** (carry 3 → verify their refs resolve → repeat until 0 dangling). Expert has it + rides the Q1 notice-child.
- **Q1 surfacing** → expert (code, ships without Tron) — converts fail-silent→fail-loud NOW even before the data repair.
- **Q2 referential-integrity gate** + **atomic-put hardening** → design→req mints ACs (ride R40.54 failable family)→planner tasks→expert. Both FAILABLE (dangling-ref fixture→RED; interrupted-write fixture→truncated file blocked).

(B) expand-latency is separate (tester measuring per-node-type timings / N+1 load shape) — not this note.
