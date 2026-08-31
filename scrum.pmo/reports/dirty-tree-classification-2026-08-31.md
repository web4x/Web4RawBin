# Dirty-tree classification — shared RawBin served tree (planner, PO-routed, 2026-08-31)

**Count: 73 dirty (PO saw 90 — it FLUCTUATES: the count itself is evidence the bulk is server runtime-churn, not accumulating WIP).** Read-only classification (git status, ior:class per unit). Three buckets:

## 1. RUNTIME SCENARIO-CHURN / SEED — noisy-harmless, server-written, NOT at-risk (~25)
Server re-derives these; a checkout/reset loses nothing durable.
- 8× `M Room` (presence online/offline churn) · 1× `M CurrentSprint` (the pin singleton, server-written) · 9× `?? Company` · 6× `?? Address` · `?? company-domain/` (seed/runtime data).

## 2. PII-ADJACENT — NEVER `git add`; a broad add PUSHES real user data (7)
- 6× `?? Profile` (server-minted user profiles): 36319584, 38aaec34, adda3408, c081dc09, e42687cf, ea413529.
- 1× `?? scenario/alt/phone/<REDACTED — phone-index unit, value withheld>` (a real phone-index unit, PII).
- ★ REDACTION NOTE (2026-08-31): this report originally pasted the raw phone VALUE here — a PII-by-value leak, the exact [[never-write-secret-values-refer-by-uuid]] failure while documenting the PII rule. Redacted to REFERENCE (the phone-index unit, value withheld). A PII finding is recorded by reference (unit class / uuid), NEVER by value.
- DEFENSE: explicit path-by-path staging only; nothing under scenario/ is gitignored [[git-add-explicit-not-all]] PII TEETH. STRUCTURAL fix (gitignore/relocate PII classes out of scenario/index) escalated to Tron by PO — behavioural care is not a control.

## 3. REAL PEER WIP — AT-RISK from any broad checkout/reset; protect (~37)
Uncommitted in-flight work of tester/expert/req/architect — a `git checkout .` / `reset --hard` would LOSE it.
- 5× `?? Gate` (tester r40xx gate records) · 2× `M ChangeRequest` (CR-approval flow) · ~10× `test/visual/*.mjs` (tester/expert gates + diag: r4059/r403a/rc6/r4pdg/_pin-diag/_trace-render-check/_sprint-390-diag) · 1× `scripts/backfill-cr-master-list.ts` · 17× `scrum.pmo/**` (board/reports/regens).
- ⚠ **2× `M Task` = worth a closer look** (peer-edit vs a regen side-effect) — flagged, NOT deep-dived at high planner context; recommend the owner or a fresh pass confirm before any tree op.

## Verdict for the PO
The 90→73 jump vs the earlier ~12 is **churn-dominant** (Room presence + Company/Address seed accumulating between commits) + a growing **peer-WIP layer** (Gates/tests/scrum.pmo from the active S37 + gate work) — **NOT a corruption signal.** Defense unchanged and sufficient: **path-limited commits only; NEVER `git add -A`/`.` or broad checkout/reset** (would push the 7 PII units AND destroy the ~37 peer-WIP files). No cleanup needed; the tree is noisy-by-design, not damaged.
