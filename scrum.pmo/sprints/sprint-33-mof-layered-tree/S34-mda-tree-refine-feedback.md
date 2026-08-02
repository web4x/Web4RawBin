# MDA-tree refine — Tron device feedback (2026-08-01, IMG_4815-4819)

**Tron:** "I admire the detailed ordered MDA tree in M2 and M1 — a major achievement. Now RETAIN, PROTECT, and TWEAK it to perfection." (These are refinements/fixes to the S33 achievement — NOT a rebuild. Protect the tree.)

## 4 requirement clusters (new work — likely a new sprint S34, Tron increments)

### R-A — File/Folder are real Scenario TYPES + orange Scenario/Edit on ALL detail views
- IMG_4816: tree items show FOLDER ICONS but their type isn't really **"File" scenario / "Folder" scenario** — unlike the in-room files (IMG_4815 screenshot-2).
- As files/folders they must show their **exact LOCATION** + the orange **"Scenario"** and **"Edit"** actions — like the Profile detail (screenshot-3).
- ★ ALL detail views on items must have the orange **Scenario + Edit**. This can become the **DEFAULT actions for scenario-based instances** (generic, solved once for every scenario instance).

### R-B — In-room ACTION BAR: Add folder / remove / delete (for selected items)
- Add the action bar in-room with: **"Add folder"**, **"remove"**, **"delete"** for the selected item.
- **remove** = removes from the TREE only (view/membership; scenario instance stays).
- **delete** = really DELETES the scenario instance + **WARNS** first (destructive, confirm).
- (Distinct verbs: remove=view, delete=unit — same lifecycle discipline as R33.8/R33.9.)

### R-C — Element remove-from-diagram action MISSING in the action bar (IMG_4818 screenshot-4)
- A diagram element is selected → it correctly NAVIGATED to it in the tree ✓, BUT the **remove action for the element is MISSING** in the action bar (should remove the element FROM the diagram — the R33.8 remove-from-diagram verb, not present here).

### R-D — Class-selection: element actions MISSING + tree-navigation BROKEN (IMG_4819 screenshot-5) = REGRESSION
- Selected a CLASS → the element actions are MISSING, AND **the navigation to the class is BROKEN by the new (folder) structure**. The new dir-tree structure (R33.10) broke class-nav.
- ★ REVIEW + REPAIR — this is a regression the new structure introduced; protect the achievement.

## Route (scenario-first, retain-protect-tweak)
New requirement set (Tron to confirm sprint — S34 or S33-backlog). architect diagnoses R-D nav-regression + designs R-A/R-B/R-C (generic default-actions for scenario instances, action-bar verbs remove/delete-with-warn, File/Folder scenario types) → req formalizes ACs → expert builds → tester real-WebKit @390 self-gates → planner flips. Refs: S34-feedback-IMG_4815..4819 in this dir. NOTE quota @98% (resets Aug-2 8pm UTC) — captured now; BUILD timing = Tron's call (now vs post-reset).

## ★ R-D REFINED (Tron, 2026-08-02, fresh-context re-look) — NOT a nav-break
Tron corrected: "the tree navigation from selecting the diagram is NOT as much broken — when the tree IS EXPANDED it actually works, but it does not correctly AUTOEXPAND." So R-D = TWO smaller items, not a regression:
- R-D1: on select→navigate, the tree does NOT auto-EXPAND the (new folder) ancestor path to REVEAL the target class/element (nav is correct; only the reveal/auto-expand is missing). Fix = expandPath the folder ancestors of the navigated node (reuse R33.10 expandPath / R33.7.4 tree-reveal). LOW risk.
- R-D2: element actions still MISSING in the action bar on class-select (real — ties to R-B/R-C action-bar work).
Downgrades R-D from "regression, protect the achievement" to "auto-expand polish" — the tree structure itself is sound.
