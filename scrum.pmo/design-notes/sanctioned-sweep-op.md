# Step-2: the SANCTIONED SWEEP OP — list-driven, not filter-driven (robbin-architect, 2026-09-12)

PO-routed design (design-only; expert builds AFTER the FINDING-2 brace ships — the brace is the live protection gap, step 1). The problem: there is NO code-checking path to delete an orphan today (delete-unit=401 challenge-auth with no room context, DELETE_ROOM needs a room, raw-fs-unlink bypasses every guard). Step 2 supplies that path — **without introducing the dangerous primitive.**

## THE PATTERN (PO constraint #1, the by-construction answer): reuse the per-unit delete over an EXPLICIT LIST — no new bulk primitive
A predicate-driven bulk delete IS the dangerous primitive: once it exists, someone calls it with a wider predicate someday, and every protection depends on that caller being careful. So the op **takes an explicit enumerated uuid LIST, never a filter.** SELECTION (which uuids) stays OUTSIDE the destructive code — reviewable, printable, the tester's dry-run gate + the PO's written word. The op has the authority to ACT on a given list, never to SELECT (principle of least authority; separation of selection from action). Every unit traverses the SAME `deleteUnitWithScan` a single deliberate delete uses — no new capability enters the codebase.

## Shape
`sweepEnumerated(uuidList: string[], { dryRun, setSha }): Result` — an AUTHENTICATED product-path op (endpoint or owner-authed CLI through the same auth), iterating the EXISTING per-unit delete. Not a new primitive — an orchestrator.

1. **AUTH (constraint #2):** challenge-auth (device-key, `hasDeviceKeyAuth`), the SAME gate as the per-unit delete. No service-token, no bypass path.
2. **Per-unit via `deleteUnitWithScan`, guards EVALUATE (constraint #3):** each uuid goes through `deleteUnitWithScan` on the **`!explicitOwner`** path (NOT the deliberate-owner escape hatch) — so `model.protected` + `ownerByToken` + the new `isOwnerKnownRealAccount` brace ALL fire per unit. A sweep is bulk cleanup, not a deliberate owner act; it must be subject to every guard.
3. **FAIL-CLOSED on the batch (constraint #4) — two-phase, abort BEFORE any deletion:**
   - **Phase 1 (dry, no deletion):** `deleteUnitWithScan(uuid, { dryRun: true })` per unit → returns `{wouldRefuse, reason}` by running the guards only. If **ANY** would-refuse (protected / real-owned) → **ABORT the whole run, delete NOTHING, report the offending uuid(s).** A refusal means THE SET WAS WRONG → re-derive the set, never filter-out-and-continue. (Partial-silent-skip = a bad set becomes partial destruction nobody reviewed.)
   - **Phase 2 (only if phase-1 all-clear):** `deleteUnitWithScan(uuid)` per unit → pre-image + delete + scan-unlink + 0-dangling.
   - ★ This needs a **`dryRun` mode on `deleteUnitWithScan`** (run the guards, return would-refuse, do NOT delete) — so the pre-check is the SAME guard code as the delete (single-sourced, not a duplicate guard in the op). Minimal addition to the signed 7a function; guards unchanged.
4. **COMPLETE, DURABLE pre-image (constraint #5):** `deleteUnitWithScan` already pre-images each unit (footprint = unit + referrers) to COMMITTED git before removal, restore-verified — not gitignored scratch (the roomDir lesson). Phase-1 guarantees phase-2 runs clean, so every deleted unit is pre-imaged before its removal. restoreSha per unit recorded.
5. **SAME CODE PATH dry/run (constraint #6):** `--dry-run` = phase-1 + **PRINT THE SET** (the given list + per-unit would-refuse); run = phase-1 + phase-2. The print is PART of the op, not a separate script → the reviewed path == the executed path. **This SUPERSEDES the standalone `r40106-inc7-sweep-dryrun-gate` script for the EXECUTION review** (that gate stays as SELECTION, producing + printing the list; the op CONSUMES + re-prints it — see set-sha below).
6. **SET chain-of-custody (my refinement, mirrors the 7b blob-binding):** the op computes `setSha = sha256(sorted uuidList)` and ECHOES it in both dry-run and run. The PO authorizes a specific `setSha` (the reviewed set); the op REFUSES to run a list whose `setSha` ≠ the authorized one. So the reviewed set == the executed set is PROVEN, not trusted — the set-level analogue of "a patch verified against superseded bytes is void."
7. **VERIFY-GONE + INV-DATA, idempotent (constraint #7):** after phase-2, assert every uuid gone (shard absent + /api/ior 404) + 0-dangling graph-wide + INV-DATA; re-run = no-op (already-gone units return `unit-absent`, phase-1 all-clear trivially).

## Why this is safe by construction (not by caller-care)
- No filter in the destructive code → no wider-predicate blast radius ever.
- Every unit hits every guard (model.protected / ownerByToken / real-owner brace) on the `!explicitOwner` path → the step-1 brace PROTECTS this op for free.
- Fail-closed-before-any-deletion → a wrong set destroys nothing.
- Same dry/run code + set-sha → the reviewed set is the executed set.
- Reuses the signed 7a delete + pre-image machinery → no new recoverability surface.

## Acceptance (failable BITEs the tester verifies)
- List containing a protected/real-owned uuid → **ABORTS in phase-1, 0 deletions** (stub-must-fail: skip-and-continue → partial deletion → RED).
- `setSha` mismatch (list ≠ authorized) → **REFUSED** (stub-must-fail: run a different list than authorized → RED).
- No raw-fs / no-auth path exists to delete an orphan (grep: orphan deletion ONLY via this authed op → deleteUnitWithScan).
- Dry-run and run produce the SAME printed set (same code path).
- Post-run: all listed gone + 0-dangling + idempotent re-run.

**Gated:** builds AFTER the FINDING-2 brace (step 1) ships green — the op relies on the brace being live in `deleteUnitWithScan` for real-owner protection to evaluate. Then the 34-uuid named execution runs through this op (step 3), I backstop (0-real + pre-images + 0-dangling), then PO lifts no-sweep (step 4). No invented mechanism: existing per-unit delete + a dryRun flag + a list + set-sha + challenge-auth.
