# Planner Over-Credit Reconcile — R19.83–102 (2026-06-13)

**Trigger:** SM over-credit flag — "24 reqs (R19.83-102) counted-complete but Impl.tests[] empty = test-debt." Asked: honest count — is it 149-genuine + 24-test-debt, or is there test-linkage I'm missing?

**Method:** canonical det `objectVerb.ts Chain followUp --all` (det-2x identical) + per-row `Chain scoreboard` + independent forward-walk (req→task→useCase→class→method→impl→test) over all 24.

## HONEST FINDING — the premise is off: these 24 are OPEN, not complete

**`followUp --all` (det-2x): complete=173, total=198, excluded=41 → 25 open (non-excluded).**

**`scoreboard` per-row for ALL 24 (R19.83–102) is uniformly:**
`| Rxx | check | open architect | open | open | open | open |`
→ Req exists (col-1 check); **UseCase = open (architect owes it); Class / Method / Impl / Test = open.**

Independent forward-walk agrees: **0 Impl units reached for all 24** — there are no Impl units yet, so `Impl.tests[]` is empty because the Impl node does not exist, not because a test is merely missing.

### Therefore
- It is **NOT** "149-genuine + 24-test-debt." The **173 genuine complete EXCLUDES all of R19.83–102.** The 173 is not inflated by these.
- R19.83–102 are **24 of the ~25 currently-open chains** — open at the **UseCase hop**. They are **further from done than test-debt**: they are chain-skeleton (Requirement + Task only; no UC / Class / Method / Impl / Test units).
- The "counted-complete" reading came from the **`listComplete` display row** where col-1 "check" = the requirement *exists* (boot pattern #1: never trust the display row; trust the det Summary + ground-truth).

### Feature vs Chain (the real status)
These 24 ARE **feature-shipped / device-verified** — the fixes are live in v0.5.x. So: **FEATURE-done, CHAIN-open.** Two separate gates (learning #58). No champagne (chain-complete) claim applies until each chain is built: architect UC → class → method → impl → genuine test.

## The 24 (all: feature-shipped, chain-open at UseCase)

R19.83, R19.84 (×2: 0be510a8/62e1b2e1), R19.85 (×2: e29dcae1/b6ad2bdd), R19.86, R19.87, R19.88, R19.88.A, R19.89 (×2: bd9bb433/2ad3fd18), R19.90, R19.91, R19.92 (×2: 71a8954e/b5688a42), R19.93, R19.94, R19.95, R19.96, R19.97, R19.99, R19.100, R19.101, R19.102 (tasks=0 — not even task-wired yet).

**altId-label duplicates noted** (R19.84/85/89/92 each appear on 2 req units) — separate housekeeping item for req-eng to dedup; not part of the 173.

## Marking
Each of the 24 req units flagged `needsGenuineChain: true` + `chainStatus: "feature-shipped-chain-open"` (this reconcile is the durable record). The in-room-UX ones additionally gate on the E2E standard (R19.97 = Tron real-Chrome exception).

## 149 vs 173 reconciliation (IMPORTANT — do not double-subtract)
PO milestone framing: "~149 genuine + 24 chain-debt." Canonical measurement says otherwise: **173 chain-complete, and the 24 are ALREADY excluded (open), not inside the 173.** `173 − 24 = 149` would **double-subtract** — it removes the 24 a second time. The canonical det tool credits **0** of R19.83–102 as complete (all show `open architect` at the UseCase hop; open non-excluded = 25, of which 24 are these).

**Honest milestone numbers:**
- **Chain-complete (genuine champagne): 173** / 198 active / 41 excluded (det-2x identical).
- **Chain-incomplete (NOT champagne): 25 open** = 24 × R19.83–102 (feature-shipped, chain-open at UC) + 1 other (R19.72 impl-hop).
- v0.6.0 = **FUNCTIONAL milestone real + device-verified**; chain champagne stands at **173 genuine**, with R19.83–102 tracked as full-chain-debt to true champagne.

(If the intent was instead "149 of the 173 are genuine and 24 within the 173 are over-credited," that is NOT what the data shows — the over-credit SM flagged is the `listComplete` display row showing col-1 "check" = req-exists, not a real completion inside the 173.)

## Bottom line for PO/SM
**No full-champagne 173 claim is affected — 173 is genuine and does NOT include R19.83–102.** The honest board: **173 chain-complete · 24 feature-shipped-but-chain-open (R19.83-102, architect owes UCs first) · 1 other open.** "Test-debt" understates it — they need the whole chain, not just a test. Do NOT count the 24 complete; canonical already doesn't.

---
## UPDATE — post-7f1e8b2e (architect "batch champagne-debt closure R19.83-101, 7 chains")
Re-ran authoritative guard det-3x: **complete=173 UNCHANGED** (173/173/173). Deepest-hop walk: all 24 now reach the **UC hop** (architect added UC units — they no longer dangle) but **NONE advance past UC** to Class/Method/Impl/Test. So 7f1e8b2e advanced the chains internally (UC now exists) but produced **ZERO new genuine champagne** — the count did not move. (validate-vs-ground-truth: the commit says "closure" but the canonical count is flat.)

### CATEGORIZED HONEST COUNT (X/198)
- **(a) GENUINE champagne** (full chain Req→UC→Class→Method→Impl→Test, all committed, real markers): **173 / 198** (41 excluded orphanByDesign). **0 of these are from R19.83–102.**
- **(b) CHAIN-DEBT** (functional shipped / in-flight, chain stops at UC — needs Class→Method→Impl→genuine Test markers): **21 units** = R19.83, 84(×2), 85(×2), 86, 87, 88, 88.A, 89(×2), 90, 91, 92(×2), 93, 94, 95, 96, 97, 101.
- **(c) OPEN BUGS not yet fixed**: **3** = R19.99 (broken-link), R19.100 (inversion), R19.102 (folder-actions — `no-task`, not even task-wired).
- Open total (non-excluded) = 25 = 24 (R19.83-102) + 1 (R19.72, impl-hop).

**TRUE champagne = 173/198.** (b) and (c) are NOT champagne. Next genuine flip requires architect Class+Method, expert Impl + real `[impl:uuid:]` marker, tester real Test (in-room → E2E; R19.97 → Tron real-Chrome).
