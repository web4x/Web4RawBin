# Post-Restart Verification Checklist — the ONE authorized-restart runbook

**Author:** robbin-architect · 2026-08-12. Written BEFORE the moment, not during it. The single Tron-authorized restart ships **THREE changes at once**: (i) C4.3 approve-path delegation, (ii) the R40.22 storage re-key `--apply` (quiesced window), (iii) C4.1 self-heal ARMING at boot. Execute **in order**. Each step: **OWNER** (TRON-only=owner-gated, else OURS) · CHECK · PASS · **FAIL →** `ABORT-REVERT` (undo, do not proceed) or `CONTINUE-FLAG` (record + proceed; non-destructive). Doc only — no code, no deploy. Restart is HELD until Tron authorises.

**Global revert anchor:** re-key keeps ALL originals (copy-bridge); C4.3 is one commit; the revoked list is data. Any `ABORT-REVERT` = revert the 84 unitLink rewrites + the C4.3 delegation commit + the regrowth-kill code, `rm` the storageId copies, restart OLD code (serves originals). Nothing half-destroys by construction.

## PHASE A — QUIESCED WINDOW (server STOPPED, before restart) · OURS
- **A1. Re-key `--apply`** (migrate-storage-rekey.ts): the FOUR gates GREEN on LIVE data — no-injection (per-home copy==original+declared-heals) · no-drop (original\copy empty) · multiset==quiesced-start · no-token-path (0 owner-token segments in tracked unitLinks). **PLUS line-128:** I INDEPENDENTLY capture the live content multiset at this instant and cross-check `== migration.quiesced-start ref` (second source, not the migration's own word). **FAIL → ABORT-REVERT** (data integrity; originals untouched).
- **A2. Revoked-list — TRON CHOOSES the branch (PO ruling 2026-08-12: state-(C) restart-as-is = FORBIDDEN — armed+absent-list announces armed while the 116 still authenticate; the flag and reality must agree).**
  - **BRANCH A (revoke the 116 now — PO recommends):** in the quiesced window run `gen:revoked-tokens --write` → refuses unless count==116 + disjoint from enrolled-79/Tron/File-owners. Then B1 must show `loaded 116`. Step-7 (F3) proves it did not over-reject (Tron + enrolled-79 still authenticate). **FAIL → ABORT-REVERT.**
  - **BRANCH B (defer revocation — minimal blast radius):** set `REVOKED_ARMED=false` (commit) so the flag tells the truth; ship C4.3 + the re-key only; arm revocation LATER together with its materialized list. Then B1 shows `loaded 0` + honest not-armed (health OK). The 116 still authenticate (deferred, acceptable — they are dormant test tokens). **FAIL → n/a (nothing armed).**
  - **STATE (C) — restart with `REVOKED_ARMED=true` + absent list = FORBIDDEN. Do not boot it under either branch.**

## PHASE B — RESTART / BOOT · OURS
- **B1. Boot log `revoked-tokens loaded 116`** (NOT 0; 0 = fail-open, list missing while armed). **FAIL → ABORT-REVERT.**
- **B2. served == committed == HEAD** phantom-guard: `/api/config` version == package.json == git HEAD; **INV-V1** version-consumer check. **FAIL → ABORT-REVERT** (phantom deploy — served ≠ code).
- **B3. Storage keyed by storageId**: `data/users/<storageId>/` present; a spot-check File resolves via its storageId path (not a token path). **FAIL → ABORT-REVERT** (re-key did not converge).
- **B4. boot-check present + fail-LOUD** (not a silent log line). **FAIL → CONTINUE-FLAG.**

## PHASE C — C4.3 APPROVE-PATH DELEGATION (the newly boot-reachable code)
- **C1. approve-not-404** · TRON-only: Tron's approve tap on a QA-Review row → 200 + advances (not 404). **FAIL → CONTINUE-FLAG** (verdicts blocked, not destructive; fix forward).
- **C2. INV-G 403** · OURS: every `/api/server-manager/*` + terminal ws upgrade, non-owner → 403. **FAIL → ABORT-REVERT** (security regression).
- **C3. D2 refuses ALL tokens** · OURS: the delegated Done-advance is refused for every token (Done requires the owner `approvedBy` verdict, not a token). Feed a token → REFUSED. **FAIL → ABORT-REVERT** (a token must never self-advance to Done).
- **C4. SM still-403** · OURS: `/server-manager` page non-owner → 403, shell no-leak. **FAIL → ABORT-REVERT.**
- **C5. INV-G2 == 1** · OURS: exactly ONE `OWNER_TOKEN` literal (no dup introduced). **FAIL → ABORT-REVERT.**

## PHASE D — DOMINANCE + SELF-HEAL ARMING
- **D1. dominance-lint GREEN** · OURS: `check:controller-dominance` passes post-deploy (single-Done-writer holds). **FAIL → CONTINUE-FLAG** (lint, not runtime).
- **D2. ★ self-heal inertness post-arming** · OURS: C4.1 self-heal armed at boot. VERIFY IN REALITY (not the prediction): board stored-status of the 145 S30++ rows AFTER restart == BEFORE == planner's 0/145. **FAIL → ABORT-REVERT** (self-heal silently moved a row → Tron's batch composition changed mid-authorisation — the exact trap; re-derive before any verdict).

## PHASE E — ★ r4010 RE-GATE (NON-NEGOTIABLE)
- **E1. POST-RESTART r4010 re-gate RE-RUNS against the NEW running path** · OURS: today's r4010 green certifies the OLD path and says NOTHING about the delegation. It MUST be re-run post-restart. **FAIL → ABORT-REVERT** (the delegation broke what r4010 covers).

## PHASE F — REGRESSION + ORDERING · OURS
- **F1. reject-direction unregressed**: whoami/tree/terminal/page non-owner → 403; sacred gate 403. **FAIL → ABORT-REVERT.**
- **F2. ORDERING**: re-key COMPLETED (storage keyed by storageId) BEFORE any rotation. Assert NO token rotation ran this restart — rotation is a SEPARATE later step. **FAIL → ABORT-REVERT** (rotation-before-rekey orphans homes — the incident trap).
- **F3. enrolled-79 + Tron still authenticate**: spot-check an enrolled keypair token accepts (OURS); Tron confirms his own session (TRON). **FAIL → ABORT-REVERT** (revocation over-rejected a valid client).

## PHASE G — TRON-ONLY DEVICE VIEWS (owner-gated, un-mockable)
- **G1. device @390**: approve tap · tree · terminal render on Tron's phone. **FAIL → CONTINUE-FLAG** (visual, not data).

## Failure-semantics summary
- **ABORT-REVERT** (integrity/security/data): A1, A2, B1, B2, B3, C2, C3, C4, C5, D2, E1, F1, F2, F3.
- **CONTINUE-FLAG** (functional/visual, non-destructive): B4, C1, D1, G1.
- **TRON-only steps**: C1, F3(his session), G1. Everything else is OURS and can be verified without the owner tap.

## ★ BY-CONSTRUCTION FIX (capture as a req — non-blocking, shape for req; PO 2026-08-12)
**Problem shape:** `ARMED + absent/short list = fail-OPEN` is a SILENT-security-failure — the feature reports itself armed while quietly authenticating everyone (incl the 116). A loud log is NOT a control (nobody reads a log at 3am). The honest shape is **fail-CLOSED-but-not-lockout: loud AND closed.** Constraint that governs everything here: the refusal must NEVER become a way to lock Tron out — so it must be operator-fixable in seconds.

**Three-layer shape (defense-in-depth; the dishonest state becomes unreachable):**
1. **COMMIT-COUPLE the list to the flag (primary — makes the state unreachable):** the revoked list holds SALTED HASHES (SHA-256 of a 128-bit UUID token + fixed committed salt) — NOT a credential (a UUID is not recoverable from its hash), so it is SAFE TO TRACK in git. Commit the list ATOMICALLY with `REVOKED_ARMED`. Then armed and its list ship together and cannot diverge across deploys (also fixes the fresh-deploy-durability gap). 
2. **CI GATE (`check:revoked-tokens`, already in ci:gates):** assert `REVOKED_ARMED ⟺ (list present AND count==EXPECTED_REVOKED_COUNT AND disjoint from enrolled/Tron/File-owners)`. Armed-but-empty → RED at commit ⇒ the dishonest state cannot be committed. (Today it can slip because the list is gitignored runtime → CI cannot see it → layer 1 tracking closes that hole.)
3. **RUNTIME BELT (disk-corruption / list-lost-at-boot despite committed):** ARMED and `loaded != EXPECTED` ⇒ IDENTIFY **refuses to serve auth** with an operator-facing error naming the fix (`run gen:revoked-tokens --write`), health reports RED, but the server STAYS UP (health/status readable). This is fail-CLOSED (nobody authenticates, incl the 116) + LOUD (visible, not a buried log) + NOT-a-lockout (a deploy/boot-time state, not a live-user event; the fix is seconds; Tron is not permanently excluded — auth resumes the instant the list is materialized). Never `refuse-to-boot` (that is an unattended-restart outage); refuse-AUTH-while-up so the operator can read the exact fix.

**Net:** loud + closed, no silent fail-open, no permanent lockout. Hand to req to capture as an R40-series requirement; architect maps the chain (IDENTIFY refuse-path + check:revoked-tokens ⟺ assertion + the salted-hash-tracked list).
