# Owner-action smoke — the durable accept-direction gate (spec)

robbin-architect 2026-08-18. Acceptance gate for the approve/make-current work (NOT new scope) — the standing version of the expert's immediate 4-code scratch run. Closes the gap L12 named: the owner-SUCCESS branch must be EXERCISED, headlessly, on every change. **Does NOT block the expert's immediate run** (that's the proof that unblocks Tron); this is the durable gate that keeps it proven.

## Why (L12) — boot-check ≠ action-check
The v0.8.108 P0 crashed prod on every owner approve (undeclared `ownerTok8` → ReferenceError after `res.end` → double-writeHead → process exit) and survived ~10 iterations because the boot-check passes (server BOOTS) and every check was reject-direction (403) or construction. The branch that only runs on owner-SUCCESS (`2xx → res.end → addLog`) was never executed. This gate executes it.

## Isolation (R40.31 — never prod, never a real Done)
- Scratch server on a git worktree of HEAD, isolated ports (e.g. 4471), writing to a DISPOSABLE worktree index — NEVER `/var/dev/.../Web4RawBin/scenario` prod, NEVER port 4444.
- Owner token/cookie valid on the ISOLATED instance ONLY. Scratch units minted in the worktree index (a QA-Review task, a Planned task, a refuse-state task) — torn down with the worktree.
- **Cleanup survives failure:** worktree + scratch server removed in a `finally` (or trap), even on assertion failure or crash. Assert 0 worktrees + prod:4444 untouched at end.
- **Credential hygiene:** owner token in HEADERS only, never URL; scrub token + auth headers from any log/artifact; no devtools/header capture. Any artifact carrying a token → do not save/commit + flag.

## Assertions (all on SCRATCH units; the PO 4-code order + zero-5xx + both-surfaces)
For BOTH surfaces — `approve` and `make-current`:
1. **Owner-SUCCESS → 200** — owner approves a QA-Review scratch task → 200 AND derived status == Done (approve) / owner make-current a Planned|In-Progress scratch task → 200 (make-current). The branch that crashed.
2. **Validate-refuse → 409, persists NOTHING** — approve/make-current a task in a refusing state → 409 AND the scratch unit is **byte-identical before/after** (the atomic criterion: refused advance persists nothing — no persist-then-compensate).
3. **/trace owner-token path is NOT 403** — an owner authenticated via the /trace cookie/token path is authorized on both surfaces → NOT 403 (the accept-direction must not be spuriously rejected).
4. **Non-owner → 403, records nothing** — no token / wrong token → 403 before any write (unit byte-identical).
5. **ZERO 5xx across every call** — any 5xx, dropped connection, or process-exit = RED (the P0's signature). Assert the scratch server is still alive + responding after every action.
6. **★ owner-both-surfaces agree BY MEASUREMENT** (folds the ◐ caveat): the SAME owner token → 200 on BOTH approve AND make-current (not 403); the SAME non-owner → 403 on BOTH. So `make-current`'s `actor` resolves the SAME owner/protected-identity set as `approve`'s `profileUuidOf` — proven by both surfaces agreeing on the same token, not assumed.

## stub-must-fail (the gate must be able to fail)
Re-introduce a post-response throw (or an undeclared identifier like the original `ownerTok8`) into the approve or make-current handler → the smoke MUST go RED at assertion 1/5 (owner-success returns non-200 / a 5xx / dropped connection). A smoke that stays green with the bug re-inserted is vacuous — this proves it BINDS.

## ★ AMEND 1 — validate the REMOTE broadcast path, NOT the acting tab's local emit (TAB-B)
Measured: the acting tab (TAB A) does a LOCAL `ViewBus.notify(`task:${uuid}`)` after the 200 (`universal-actions.ts:112`, the R40.45 TAB-A fix). So **TAB A re-renders from its own local emit regardless of whether the WS broadcast arrives** → TAB A passing proves NOTHING about the broadcast→bridge→remote path (the acting tab is exactly the "special case" that MASKS a broken broadcast; existence≠connection). Server-side is CORRECT and fires (`approveByOwner` server.ts:1611 → `apply(Task,{publish:publishUnitChanged})` → `_write` → `emit` → `publishUnitChanged` server.ts:190 = `wsClients.forEach(send unit-changed)` + CurrentSprint; bridge `RawBinClient.ts:98-100` → `notify(`${type}:${uuid}`)` matching `obj.ref()`). So the broadcast is only truly exercised by a SECOND client.
- **Criterion:** the acceptance MUST use a SECOND client that receives ONLY the WS broadcast (no local emit — it did not act) and assert its row + badge + detail + CONTROLS re-render. The acting-tab local emit is DISALLOWED as the proof of the broadcast path.
- **stub-must-fail:** disable the server `publishUnitChanged` on the approve path → the SECOND client must NOT update (RED); the acting tab (local emit) would still update — proving the smoke tests the broadcast, not the local shortcut.

## ★ AMEND 2 — CONTROLS must re-derive on the same emit (the acceptance-definition hole, PO)
The "live-all-surfaces" criterion enumerated tree/row/icon/badge/detail and NEVER the CONTROLS — so an action bar whose visibility is latched at mount passes every criterion. After Done, Approve/Decline stayed visible (body re-rendered, bar did not). Amend:
- **Criterion:** every control whose visibility DERIVES from unit state re-derives on the SAME emit — Approve/Decline (QA-Review-only), Set-as-Current, Set-as-next (when built). Visibility is a DERIVATION of current status, NEVER latched at mount, on the SAME emit path as the surface (no separate refresh path — the acting-tab no-special-case rule).
- **RED conditions:** (1) any control whose visibility is computed only at mount; (2) a matrix recomputed from a cached/stale status rather than the confirmed new one; (3) an action bar on its own refresh path separate from the surface emit.
- **stub-must-fail:** latch a control's visibility at mount (compute once, ignore the emit) → the smoke MUST go RED (after an approve→Done, Approve/Decline still present on the SECOND client = FAIL).

## Wiring / handoff
- Runs in `ci:gates` (or a pre-deploy step) — every server-side change to the action path re-exercises the owner-success branch. Report-only→strict per the DUAL-FLIP discipline (it should pass NOW that v0.8.108 fixed the crash — flip to strict once green).
- I interpret the raw run (codes + alive-check) myself — not a subagent "green" (L10). The immediate expert run proves the path today; this gate keeps it proven.
- Chain: an acceptance Test on the approve/make-current Impls (`approveByOwner` / make-current seam) — req mints the Test unit against this spec; I verify it exercises the SUCCESS branch (not just 403) at derive.
