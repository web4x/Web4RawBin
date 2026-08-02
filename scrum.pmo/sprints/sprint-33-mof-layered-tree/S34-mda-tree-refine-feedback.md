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

---
# ARCHITECT DESIGN — all 4 clusters, one pass (robbin-architect 2026-08-02, full-runway)
MEASURE-FIRST (disk-derived at HEAD 06dd9032c v0.8.38 — NOT replaying restored-era assumptions): the action-bar has ADVANCED past the feedback via **R33.9** — `actionsForContext(type,hasActiveDiagram)` (model.ts:72) ALREADY emits modelelement UNIT verbs (new/rename/delete, always) + MEMBERSHIP verbs (add-to-diagram/discover/**remove-from-diagram**, ONLY when a diagram is active) with INV-A1..A4 (the IMG_4802/4803 fix). And the tree AUTO-EXPAND mechanism ALREADY exists via **R33.7.4** — `onTreeReveal`→`revealModelElement`→`expandPath` (rb-trace-tree.ts:71/118/127). So R-C and R-D2 are LARGELY DELIVERED; the genuinely-new work is R-A, R-B, R-D1. Every cluster REUSES the R33.6.5 action-bar (setActions/showActionsForType) + R33.7.4 reveal + the MODEL_STORE isolation (R32.5) — NO fork.

## R-A — File/Folder real Scenario types + universal «Scenario/Edit» default on ALL detail views
DIAGNOSIS: MOF folders/files are SYNTHETIC nodes today — `mofFolder(uuid,name,…,type='collection')` with `dir:<rel>`/`file:src/<rel>` refs (server.ts:1059,1129-1130), NOT real units → no identity, no proper detail. Detail views carry type-specific buttons (vcard, file-preview) but NO universal default action pair.
- **A1 (universal default actions — client, LOW):** add a baseline `{verb:'scenario',label:'◆ Scenario'}` + `{verb:'edit',label:'✎ Edit'}` pair to the action-bar for EVERY detail type — reuse `actionsForContext`/`DEFAULT_ACTIONS` (model.ts) so setActions renders them on all detail views (orange via a `.da-btn` variant class). Verbs dispatch to the existing scenario-view (`/scenario?ior=`) + edit flow. INV-A-1: every detail shows Scenario+Edit; type-specific verbs append after.
- **A2 (File/Folder as scenario types — server, MEDIUM, MODEL_STORE-isolated):** `mofChildren` mints/uses `ior:class:Folder` + `ior:class:File` units (in MODEL_STORE, prod untouched — R32.5) instead of synthetic `dir:`/`file:` collection refs, so a folder/file node resolves to a real unit with a detail view + the A1 default actions. Reuse `createFileUnit` shape; deterministic uuid (keyToUuid of the rel-path, R32.2 law) → re-derive re-binds, no dup. Tree render UNCHANGED (still rb-trace-tree folders).
- GATE: File/Folder nodes open a real detail with «Scenario»+«Edit»; every detail type shows the orange default pair; prod scenario/index untouched (isolation); /trace detail unregressed.

## R-B — in-room action-bar: Add-folder / remove-from-tree / delete-unit(+warn)
DIAGNOSIS: `delete-element` verb exists (model.ts:105→deleteElementAction); NO Add-folder; no explicit remove-from-TREE vs delete-UNIT distinction; no destructive-warn.
- **Add-folder (new verb + endpoint):** `{verb:'add-folder',label:'📁 Add folder'}` on folder/diagram context → `POST /api/model/folder/create {parent,name}` mints an `ior:class:Folder` unit in MODEL_STORE (mirrors `/api/model/diagram/create` server.ts:1147, store-only INV) → `load()` + `expandPath` to reveal (reuse addDiagram's pattern :112-123).
- **remove-from-tree vs delete-unit (semantics + warn):** `remove` = detach the node from its tree/diagram view (view-link removal, reuse removeFromDiagram) — NON-destructive; `delete` = destroy the UNIT — DESTRUCTIVE, gated by a `confirm()` WARN ("Delete <name> permanently?") before the delete endpoint. Two distinct verbs, distinct labels (✕ Remove vs 🗑 Delete), reuse existing handlers + add the confirm guard.
- INV-B: Add-folder writes MODEL_STORE only; remove is non-destructive (view only); delete is confirm-gated. GATE: add a folder→appears+reveals; remove→node gone from tree, unit still exists; delete→confirm→unit gone (+warn shown).

## R-C — element remove-from-diagram (ALREADY R33.9; residual = active-diagram context)
STATUS: the verb EXISTS (`remove-from-diagram` model.ts:75, handler :101 `removeFromDiagram(shownRef, activeDiagramUuid)`), shown only when `hasActiveDiagram`. Tron IMG_4818 "missing" = the flow had NO active-diagram context set (INV-A: no-diagram→membership absent, by design). RESIDUAL (small): ensure `rb-active-diagram{uuid}` fires when a diagram is being viewed AND an element is selected from THAT diagram, so membership verbs (incl remove) appear. Design: on diagram box-select / diagram-detail open, dispatch `rb-active-diagram{uuid}` (some paths already do — verify + fill the gap for the tree-select-while-diagram-open case). No new verb. GATE: select an element that IS in the open diagram → remove-from-diagram shows + works.

## R-D1 — auto-expand tree folder-path on select→navigate (mechanism EXISTS, wire the trigger)
DIAGNOSIS (Tron refined): nav is CORRECT, only the AUTO-EXPAND/reveal is missing on select→navigate. The full mechanism is BUILT — `revealModelElement(uuid)` (rb-trace-tree.ts:127) builds the synthetic mof path (sourceFile+memberOf→mof-m1→project→file→class→element) + `expandPath` + highlight, triggered by `rb-tree-reveal{ref}` (R33.7.4). GAP: the select→navigate case Tron hit (selecting a diagram/element → tree not revealed) does NOT dispatch `rb-tree-reveal`.
- **FIX (LOW, no fork):** wire the missing trigger(s) to dispatch `rb-tree-reveal{ref}` (or call revealModelElement) on select→navigate — i.e. when a detail/diagram selection should reveal its tree node. Reuse R33.7.4 wholesale. INV-D1: after select→navigate, the tree auto-expands the folder ancestors + scrolls/highlights the target; off-tree/absent = graceful no-op. GATE: select a class (from diagram/detail) → its folder path auto-expands + the leaf highlights (no manual expand).

## R-D2 — element actions on class-select (ALREADY R33.9; residual = tree-select wiring)
STATUS: modelelement actions EXIST via actionsForContext (unit verbs always). RESIDUAL: ensure a class-select IN THE TREE dispatches `rb-drawer-detail-shown{type:'modelelement',ref}` (so setActions fires) + sets active-diagram (R-C) when applicable. Verify the tree/diagram select path emits detail-shown for modelelement; fill any gap. Folds into R-B/R-C action-bar wiring. GATE: select a class in the tree → unit verbs (+membership if a diagram is active) appear in the bar.

## Chain / build order / gate (all clusters)
- **Build order:** R-D1 (lowest risk, wire existing) → R-C/R-D2 (active-diagram + detail-shown wiring, small) → R-B (Add-folder + delete-warn) → R-A (A1 default actions client, then A2 File/Folder units server). A2 + Add-folder + delete = server → REAL restart at the boundary (R32.7/R33.6.5 lesson: BOOT_VERSION frozen at boot); A1/R-D1/wiring = client-only.
- **Reuse map (NO fork):** action-bar setActions/showActionsForType/actionsForContext (R33.6.5/R33.9) · reveal expandPath/revealModelElement (R33.7.4) · MODEL_STORE isolation + deterministic-uuid (R32.5/R32.2) · createFileUnit/diagram-create endpoint pattern.
- **Chain:** per-cluster UC→Class→Method→Impl→Test; req mints scenario-first (#126, IMPL-MINT), I mint/repoint on ship if needed. **GATE = real-WebKit @390 self-gate** (tester); Tron spot-checks by choice.
