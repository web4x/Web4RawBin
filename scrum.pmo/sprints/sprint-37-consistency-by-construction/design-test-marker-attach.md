# [test] marker AST-attach — symmetric with [impl] (the scoreboard-integrity fix)

**Author:** robbin-architect · 2026-08-07. PO TOP priority (outranks the 1003-corruption repair) — a Test that credits a FILE with no per-assertion scope is a claim that cannot fail, sitting UNDER the scoreboard. Design → expert extends the marker audit → tester's blast-radius number and this gate must AGREE. Folds into R-C3's fail-closed family.

## MEASURED (disk, HEAD)
- **The asymmetry is real:** `[impl:uuid]` markers are AST-gated (`strict-marker-audit.ts`: PASS iff the marker HEADS a named member declaration, name-matched, via the TS AST). `[test:uuid]` markers have **NO equivalent rule** — `trace-audit` does not validate them at all. That absence IS the hole.
- **Blast radius (I ran it):** **387 `[test:uuid]` markers total → 335 FILE-STACKED (invalid, no per-assertion scope) + 52 assertion-ATTACHED.** ~87% credit a file, not an assertion. Worst: server.test.ts 68/70, components.test.ts 64/76, room.test.ts 50/56, scenario.test.ts 49/50, file-dnd-chain.test.ts 11/14. (Consequence the tester found: 3 A1 rows cite Tests whose files have grep=0 for the claimed behaviour — chain reads complete-to-Test, asserts nothing.)

## The symmetric rule (mirror [impl])
1. **AST-ATTACH (INV-T1):** a `[test:uuid]` marker confers chain-credit ONLY if it **HEADS a specific test/assertion block** — an `it()` / `test()` / `describe()`-leaf CallExpression — AST-attached (the marker comment immediately precedes that block), with the block's title **name/intent-matched to the Test unit** (exactly as `[impl]` name-matches its declaration). Reuse `strict-marker-audit.ts`'s TS-AST engine; add a `[test:uuid]` pass that finds the marker's nearest FOLLOWING `it/test/describe` node and verifies it heads it + title matches.
2. **FAIL-CLOSED (INV-T2):** a file-level / bulk-stacked `[test]` marker (before the imports, or not heading a test block) is **INVALID → confers NO chain-credit**. `trace-audit` REPORTS it (counted), never silently counts it as complete-to-Test. A Test unit whose ONLY marker is stacked is **NOT chain-complete** — the chain reads incomplete, honestly. ([[false-low-worse-than-absent]] — the same disease as everything today: a claim that can't fail.)
3. **CLASSIFY + AGREE (INV-T3):** the audit buckets every marker `assertion-attached / file-stacked / ambiguous` with counts, and the gate's count MUST equal the tester's measurement. ★ We must lock ONE shared predicate for "attached" (the TS-AST "marker heads a name-matched it/test/describe node") so gate == measurement — my quick count (335/52) used a 2-line-proximity heuristic; the AUTHORITATIVE definition is the AST one. Single-source the predicate (one exported `isTestMarkerAttached(node, unit)`), used by both the audit and any tester harness ([[one-parser-one-source]]).

## Migration policy for the 335 existing stacked markers
**DECISION: stacked markers LOSE chain-credit immediately (fail-closed), but are NOT deleted — they become a VISIBLE, COUNTED re-attach backlog.** Justification:
- **False credit is worse than a lower score** (PO instinct, and the session's whole thesis): a Test crediting a file with grep=0 for its behaviour is a false-green under the scoreboard; denying credit surfaces the truth. The score DROPS honestly (≈335 Tests un-credit) — same honesty as the R-C5 false-Done audit.
- **Don't delete** — the marker still points Test↔file; keep it as `stacked/invalid, needs re-attach` so the info survives and re-attachment is bounded per-file work (move each marker to its real `it()` block, name-matched → credit restored HONESTLY). Deleting would lose the pointer.
- **The 52 already-attached KEEP credit** (valid by the rule).
- Re-attach is incremental (tester/expert, per file); `--strict` on stacked-count turns on as it drains (delta discipline, like R-C2/R-C7). Until a Test's marker is re-attached, its chain is honestly incomplete.

## Forward guard
New/edited `[test]` markers MUST AST-attach — extend `strict-marker-audit.ts` to `[test:uuid]` and add it to `ci:gates`. A file-stacked marker FAILS the build → the hole cannot grow. This is the symmetric partner to the existing `[impl]` gate.

## GATE — BITE
- **attach BITE:** a `[test:uuid]` heading a name-matched `it()` → VALID/credits; the SAME uuid stacked at file-top → INVALID/no-credit (proves file-stacking confers nothing).
- **name-match BITE:** a marker heading an `it()` whose title does NOT match the Test unit's intent → INVALID (credit requires intent-match, not just any block).
- **count-agreement BITE:** the audit's stacked-count == the tester's measured count (shared AST predicate).
- **A1 BITE:** the 3 A1 rows citing grep=0 Tests → those Tests read NOT-complete-to-Test after the rule (the false-green is gone).
- **forward BITE:** a new file-stacked marker → `ci:gates` RED.
- **idempotent** + `--strict` on stacked-count post-drain.

## Sequence + deploy
- Highest priority in the S37 by-construction pass; the 1003-corruption repair queues behind it. Same fail-closed family as R-C3 (folds there or a sibling `strict-marker-audit` extension — the [impl] rule already lives there, so [test] joins it).
- scripts/CI-only (audit + gate) → no restart. Re-attach = test-file edits (no prod).
- Expert extends `strict-marker-audit.ts` + wires `trace-audit`/`ci:gates`; tester supplies the measured baseline; I backstop (INV-T1/2/3 + count-agreement + the A1-rows-now-incomplete assertion).
