# Tron QA Batch — S16 + S17 tester-verified tasks awaiting QA (2026-06-05)

**Prepared by:** robbin-planner, on PO direction 2026-06-05
**Total tester-verified (🧪) tasks awaiting Tron QA:** **28**
- **S16:** 1 (T121)
- **S17:** 27 (T124–T185)
**Bonus ready-for-QA (✅ impl-shipped, no strict tester-verify yet):** 33 (S16: 11 · S17: 22)
**Closure-chain status:** S17 cascade FIRED 2026-06-05 (T178 KEYSTONE `452f8d5d` live 44/44 7-hop). T184/T185 PO-confirmed tester-verified strict 2026-06-05. T180 Track 2 shipped (`9c32626b`) unblocks T179 AC11-13 headless verify; T180 Track 1 LE cert still awaits Tron DNS action (CRITICAL-PATH for real-device QA).

---

## 🧪 STRICT TESTER-VERIFIED — Tron QA gate-eligible (28)

### Sprint 16 — Traceability UX & DetailViews (1)

| Task | One-line | Key verify-commit |
|------|----------|-------------------|
| **T121** | Data + traceability-chain fix — diagnose what's "very bad", remediate | (verify in task file) |

### Sprint 17 — Scenario Units (27)

| Task | One-line | Key verify-commit |
|------|----------|-------------------|
| **T124** | Scenario-unit + IOR + class-based view architecture (DATA gate satisfied via T178 cascade) | `452f8d5d` |
| **T125** | Scenario-unit primitives + class system + storage | (task file) |
| **T126** | Generated views — planning.md, sprints.md, per-instance .md/.html | (task file) |
| **T127** | File-browser ↔ traceability-browser nav + IOR universal handler | (task file) |
| **T128** | Migrate all existing sprints/tasks/requirements to scenario-unit model | `4c630dd` |
| **T131** | File-browser symlink support (FileApi + rb-file-tree) | (task file) |
| **T132** | HTML status template fix | (task file) |
| **T133** | Task state-machine + status methods | (task file) |
| **T134** | Traceability-as-units (links as scenario.json + ln in referenced instances + MD/HTML views) | (task file) |
| **T136** | Migration extension for Requirement + UseCase units | (task file) |
| **T138** | Skill set on scenarios (capture-quote, propose-task, walk-chain) | (task file) |
| **T143** | Traceability chain → TREE rework (R17.26–R17.29) | (task file) |
| **T144** | File-browser display fixes — icon order + link targets (B5, 3 fixes) | (task file) |
| **T167** | /trace mobile-first layout + hard width-cap on right pane | `3336f38` v0.5.67 |
| **T168** | Chain order 7-step + atomic requirements as tree ROOTS (DATA gate satisfied via T178 cascade) | `c28c982` + `452f8d5d` |
| **T169** | Data-quality audit + remigrate — complete tree, NO back-chaos, NO untraced scenarios (KEYSTONE) | `7ddf64f` v0.5.66 |
| **T170** | Diligent plan + no-stop sustain (CI gates: trace:audit:strict + rule-pair:check + chain-order) | `afe969e` |
| **T171** | Untraced-closure + traceability-matrix refresh | `7c84fe0` |
| **T172** | Strict-direction audit + massive orphan fix (R-H) + R-H.2 atomic-req-split + R-J test-reachability — 238/238 chain reachability | `3fefc68` |
| **T174** | Drawer UX cleanup + /scenario route + mobile width-cap (R-M1/M2/M3/M4 + R-M3d + R-M3e) | `2eb4dab1` v0.5.71 + `d0796bf4` v0.5.72 + `6ee2278f` v0.5.73 |
| **T175** | Tree base + Traceability layer + typed chain resolution (R-N1+R-N2+R-N3) | (task file) |
| **T177** | /scenario ior-format "Not found" — bare vs ior:instance: prefix | (task file) |
| **T178** | 7-step chain DATA-FILL + lazy-load-deeper-fails (**KEYSTONE — 44/44 7-hop**) | **`452f8d5d`** |
| **T181** | Strict forward-only DISPLAY — no backward links in any DetailView | `48e3d076` v0.5.83 |
| **T184** | Forward-only API emit — strip backward keys at server (R-U umbrella with T181) | **`1e210b9d` v0.5.85** |
| **T185** | PlantUML class diagrams for traceability-tree + scenario-instance architecture (R-X1+R-X2) | `c11f723a` + `f103929f` + `71a600be` + `cc1851f9` |
| **T129** | Traceability gate — every method traces to a task AND a requirement (S17 verification gate) | `f487c2f` |

---

## ✅ IMPL-SHIPPED (bonus — ready for Tron QA after light tester re-verify) — 33

### S16 (11): T110, T111, T112, T113, T114, T115, T116, T117, T120, T122, T123
### S17 (22): T145, T146, T147, T148, T149, T150, T151, T152, T153, T154, T155, T156, T158, T159, T160, T161, T166, T173, T179, T182, T183, T186

(See `sprint-1[67]-*/planning.md` for full status lines + key commits per task. Most have clear impl-shipped commit hashes in their status notes.)

---

## ⚠️ Known data gap (FYI — req-reachable, NOT untraced)

**Background:** S17 closure cascade (`452f8d5d` 2026-06-05) achieves **44/44 7-hop reachability for every Test** via the LOCKED chain `requirement → task → usecase → class → method → implementation → test`.

**Caveat:** Many tasks (particularly historical S1–S14 ones, pre-S16 — UC discipline started at S16) reach the requirement layer via **Path A retroactive UC creation** (architect created 13 UseCases for S1-S14 tasks-with-tests in `452f8d5d`). For tasks WITHOUT an explicit UseCase parent (the remaining historical bulk), the chain still climbs **req-reachable** through alternate forward edges, but the canonical 7-hop UC node is synthetic-retroactive rather than originally-authored.

**What this means for Tron QA:**
- The 44/44 KEYSTONE PASS is real — every Test reaches a Requirement root via the LOCKED chain.
- The synthesized UC nodes for legacy S1-S14 tasks are honest retrofits, not gaps; they're documented as such in `452f8d5d` + my closure-tracking block in `sprint-17-scenario-units/planning.md`.
- T183 7-hop CI gate (`77adf9bf`) now runs `trace:audit:strict` permanently — any future regression in chain reachability fails the gate.

**Not blocking QA:** This is informational. If Tron prefers stricter origination (only Tron-or-team-authored UCs count toward 7-hop), the closure-tracking block lists Path A alternatives. Default: accept retroactive UCs as honest CMM4 history.

---

## Remaining S17 open (NOT in this QA batch)

- **T180 Track 1** — Let's Encrypt cert for `home.donges.it` (Tron DNS action required; CRITICAL-PATH #1 for Tron real-device QA on iPhone). Track 2 shipped (`9c32626b` CDP cert bypass for headless tests).
- **T179 AC11-13** — Headless SW-active verification (now unblocked by T180 Track 2; tester re-verify scheduled).
- **T129 verification gate** — S17 verification gate; gate PASSED on `f487c2f` per planner-tester sync but re-verify post-cascade may be sensible.

---

## Recommended Tron QA pass strategy

1. **Spot-check 3 random 🧪 tasks** end-to-end (open task file, verify ACs, sample live behavior on /trace).
2. **Single batch-approve commit:** `Sprint 17 QA approved by Tron — N tasks (T...)` per the established pattern (S5/S6/S7/S8 set the precedent).
3. **Planner cascades closure** post-Tron-commit: QA Review + Done checkboxes flip on every named task, planning totals updated, Tron-QA gate queue collapses.

---

**Document path:** `scrum.pmo/tron-qa-batch-2026-06-05.md`
**Sprint refs:** `scrum.pmo/sprints/sprint-16-traceability-ux/planning.md` · `scrum.pmo/sprints/sprint-17-scenario-units/planning.md`
**Standards refs:** `scrum.pmo/standards/traceability-standard.md` · learnings #9 (Tron-QA-gate exclusivity)
