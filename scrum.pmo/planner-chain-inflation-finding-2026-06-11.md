# Planner Chain-Completion Inflation Finding (2026-06-11)

**For:** robbin-po (0.0) + SM (TRONinterface:0.1)
**Trigger:** SM's gold-standard 14→25 climb-rigor request (learning #45) + PO's R19.23-should-flip re-measure.
**Tool:** `npx tsx scripts/po-chain-follow-up.ts --all` (canonical) + `objectVerb.ts Chain listComplete`.
**Measured at HEAD `0b24dcdb`:** 25/154 COMPLETE — but the number is **INFLATED** (see below).

## SMOKING GUN: shared-marker false-completes (answers SM's concern)

One impl + one test pair is wired into **7 unrelated methods**:

- **Impl `94bc8f6e`** = `[impl:uuid:94bc8f6e-a1b2-4c3d-8e4f-5a6b7c8d9e05] chat lazy-load` (src/ts/server/server.ts:431).
  Note the **fake template suffix** `-a1b2-4c3d-8e4f-5a6b...` (learning #17 violation — not a real uuidgen v4).
- **Test `dd85c4d7`** = `[test:uuid:dd85c4d7-2fe6-4564-ba91-66a362860b0f] R19.38+R19.40 chat+lazy-load chain` (test/vitest/server.test.ts:338).

Both markers ARE in committed source (pass `git log -S`), so a naive git-S check says "real". But they are **MISCREDITED**: a single chat-lazyload impl/test pair cannot implement+verify avatar, upload, SVG-pinch, or device-unit requirements.

### 7 methods wiring `implementations[]` → `94bc8f6e`:
| Method | Verdict |
|--------|---------|
| `Message.lazyLoadChain` | ✅ LEGIT (this IS chat lazy-load) |
| `Assets.rekeyFix` | ❌ MISCREDIT |
| `server.ucScopedMethodResolve` | ❌ MISCREDIT |
| `Assets.keylessUpload` | ❌ MISCREDIT |
| `Device.createDeviceUnit` | ❌ MISCREDIT |
| `Assets.avatarPersist` | ❌ MISCREDIT |
| `Room.restoreFilesFromScenario` | ❌ MISCREDIT |

### COMPLETE chains affected (in the 25 set, crediting 94bc8f6e/dd85c4d7):
- **R-A2** (avatarPersist) — FALSE
- **R-R1** (keylessUpload) — FALSE
- **R19.55** (createDeviceUnit) — FALSE
- R18.34 / R18.34.B (listComplete shows impl=94bc8f6e) — SUSPECT, verifying onPinchEnd path
- **R19.38 / R19.40** (lazyLoadChain) — REAL (legit chat lazy-load)

→ At least **3 confirmed false-completes** (R-A2, R-R1, R19.55); 2 suspects (R18.34/B). Honest count ≤ 22, pending the R18.34 path check + a full shared-marker sweep.

## SM's 14→25 question — answer
The +11 are NOT all source-marker-grounded. The markers exist in source, but the climb included **shared-marker miscrediting** (one chat-lazyload impl/test fanned into 6 unrelated methods via `Method.implementations[]` wiring). This is the "credited via reclassify+wiring" failure mode SM suspected — confirmed. R19.38/39/40 you already verified real; those stand.

## R19.23 (PO's re-measure) — did NOT flip, and why
R19.23 gates at the **Impl edge**, not Test (tester's 0119b09b Test wiring was correct but insufficient):
- Method `Room.stripSizeLimits` (`f1dd0d77`) has `implementations: []` (empty wiring).
- TWO `f1dd0d77` impl units exist: `f1dd0d77-a2b3-...` (FAKE suffix) + `f1dd0d77-edaf-...` (real).
- Source has competing markers: `RawBinClient.ts:217` → `f1dd0d77-a2b3-` (fake); `server.ts:1496` → `c96d458c-af29-` (real, my a579b5b4 fix).
- **Fix needed:** expert reconciles source to ONE real impl uuid; planner wires `stripSizeLimits.implementations[]` to it. Then it flips.

## Proposed de-inflation (planner data-lane, awaiting SM/PO ack)
1. Un-wire the 6 miscredited methods' `implementations[]` from `94bc8f6e` (they have no other impl → chains go honestly OPEN at impl edge; expert creates real impls).
2. Full shared-marker sweep: find every impl/test uuid wired into >1 unrelated method; de-inflate all.
3. Re-measure → report the HONEST corrected count.
4. The fake-suffix family (`-a1b2-4c3d-8e4f-...`, `-a2b3-4c4d-9e5f-...`) = expert source-marker fix lane (7+ markers found); flag to expert.

**This change DROPS the reported number — holding for SM/PO ack before executing, since it is report-affecting (rule: drops get the same rigor + sign-off).**
