# R18.8 Contradiction Review — Chain Root vs Browser Tree Root

**Source:** Tron directive 2026-06-05: "review which already specified scenarios contradicted and rework them."
**Author:** robbin-architect (lead) + robbin-req + robbin-planner (JOINT)

---

## The Distinction That Resolves All Contradictions

**Chain root** = Requirement (UNCHANGED — forward-only semantics: req→task→uc→...→test)
**Browser tree root** = Sprint (NEW — navigation: Sprint→Task→coveredReqs→chain)

Prior specs conflated these two. R18.8 separates them. Every contradiction below is resolved by the same principle: "chain root" stays Requirement; "tree/browser root" becomes Sprint.

---

## Contradictions Found (7)

### C1: traceability-standard.md line 18

**Current:** "Atomic requirements are tree ROOTS — nothing parents them; every other object descends from a requirement."

**Contradiction:** R18.8 says Sprint is the tree root. Requirements ARE parented by Task (via Task.coveredRequirements[]) in the browser.

**Rework:** "Atomic requirements are CHAIN ROOTS — the forward-only traceability chain starts at requirements and walks to tests. In the browser tree, Sprint is the NAVIGATION ROOT; requirements appear as children of their covering Task."

### C2: refinement-precedence-analysis.md line 195

**Current:** "Each requirement is a tree ROOT. Each task hangs from exactly ONE requirement."

**Contradiction:** In R18.8 browser, tasks don't "hang from" requirements — requirements hang from tasks (Task→coveredReqs display). The CHAIN direction (req→task) is reversed in the NAVIGATION presentation (Sprint→Task→Req).

**Rework:** "Each requirement is a CHAIN ROOT. In the chain, each task is reached from exactly one requirement (forward: req→task). In the browser navigation, each task DISPLAYS its covered requirements as children (Sprint→Task→coveredReqs→chain)."

### C3: T168 title + AC2

**Current:** "atomic requirements as tree ROOTS" / "Tree builder for /trace produces ROOTS = atomic requirements only"

**Contradiction:** R18.8 tree builder produces Sprint as root, not requirements.

**Rework:** T168 AC2 → "Chain walker starts from atomic requirements as CHAIN ROOTS. Browser tree builder produces Sprint→Task as NAVIGATION ROOTS; requirements appear under their covering tasks." T168 title already closed by PO — no rename, but the reworked AC2 text applies to T187.

### C4: requirements.md R17.32

**Current:** "The traceability chain starts with atomic requirements as roots."

**NOT contradicted.** The CHAIN still starts at requirements. R18.8 adds a navigation layer ABOVE the chain. No rework needed — R17.32 is about chain semantics, not browser presentation.

### C5: compound-requirement-source-2.md line 107

**Current:** "Each atomic requirement is a ROOT of the R-E chain"

**NOT contradicted.** This describes chain semantics, not browser layout. No rework needed.

### C6: chain-narrowing-analysis.md line 186

**Current:** "Requirement → Tasks (1:N OK — req is root, shows its scoped tasks)"

**Contradiction:** In trace mode, Requirement is NOT the display root — Sprint→Task→Requirement is. And the direction below Requirement in the tree is Req→UC→Method (not Req→Task).

**Rework:** Already addressed by the ROOT-STRUCTURE section added in 562f6452. The line should read: "Below the navigation layer, Requirement chains to its UseCases (forward). Tasks are above Requirements in the navigation layer."

### C7: T174 task file line 163

**Current:** "/api/trace/roots fetches all requirement roots"

**Contradiction:** R18.8 means /api/trace/roots should fetch Sprint roots (or the endpoint name changes).

**Rework:** `/api/trace/roots` → returns Sprint units (navigation roots). OR: add `/api/trace/sprints` for nav roots, keep `/api/trace/roots` as requirement-chain-roots for backward compat. Architect recommends the latter (two endpoints, clear semantics).

---

## Summary: What Changes, What Stays

| Concept | Before R18.8 | After R18.8 | Changed? |
|---------|-------------|-------------|----------|
| Chain direction | Req→Task→UC→...→Test (forward) | SAME | NO |
| Chain root | Requirement | Requirement | NO |
| Browser tree root | Requirement | Sprint | YES |
| Task position in browser | Child of Requirement | Child of Sprint, PARENT of coveredReqs | YES |
| /api/trace/roots | Returns Requirements | Returns Sprints (add /api/trace/sprints) | YES |
| FORWARD_KEYS | req→tasks at top | SAME (chain unchanged) | NO |
| NAVIGATION_KEYS | (didn't exist) | sprint→tasks, task→coveredRequirements | NEW |
| Task.coveredRequirements[] | (didn't exist) | NEW navigation field | NEW |

## Files Requiring Rework

| File | Line(s) | What to change |
|------|---------|---------------|
| `traceability-standard.md` | 18 | "tree ROOTS" → "CHAIN ROOTS" + add browser nav root clause |
| `refinement-precedence-analysis.md` | 195 | "tree ROOT" → "CHAIN ROOT" + add nav distinction |
| `chain-narrowing-analysis.md` | 186 | Already partially addressed (562f6452); finalize wording |
| `rb-trace-tree.ts` | 59 | `graph.ofType('requirement')` → Sprint roots for nav layer |
| `server.ts` | 481-493 | `/api/trace/roots` → add Sprint root endpoint |
| T168 task file | AC2 | Historical — append rework note, don't edit closed AC |

## Rework Protocol

1. **Standards files** (traceability-standard.md, refinement-precedence-analysis.md): architect edits to distinguish "chain root" vs "browser tree root" explicitly
2. **Code** (rb-trace-tree.ts, server.ts): expert implements per T187 design (Sprint nav layer + mode param)
3. **Closed task files** (T168): append "R18.8 REWORK NOTE" to QA Audit section — don't edit closed ACs per Rule 8 (closure freeze)
4. **S18 requirements.md**: req-eng ensures R18.8 captures the chain-root-vs-nav-root distinction

---

**Formulated by:** robbin-architect (2026-06-05)
**Contradiction count:** 7 found, 5 require rework, 2 are NOT contradicted (chain semantics unchanged)
