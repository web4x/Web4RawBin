# Policy: [impl] markers in ANONYMOUS handlers (219) — extend attach to handler-scope

**Author:** robbin-architect · 2026-08-08. PO-asked; expert measured 219 REAL impls that live in anonymous handlers (sw.js `cec00d7f` ServiceWorker.ignoreSearchNav = real, inside a `self.addEventListener('fetch',…)`, no named member decl). NOT fiction, NOT a marker bug — the AST-attach rule (marker heads a name-matched declaration) structurally cannot express it. 219 is the number behind the call.

## DECISION: (B) extend the attach-rule to HANDLER-SCOPE — with (A) as fallback only where the AST can't bind
A `[impl:uuid]` marker is ATTACHED iff it heads EITHER:
1. a **named member declaration**, name-matched to the marker label (the existing rule); OR
2. an **anonymous HANDLER NODE** it directly heads — an `addEventListener(...)` call, an event-handler arrow/function expression, or an arrow assigned as a handler — where the marker carries an **explicit label** (`Class.method`) that supplies the intent-match (since there is no member name to match). The AST binds the handler node; the label is the name.

Still FAIL-CLOSED: a marker heading NEITHER a named decl NOR a handler node (e.g. floating in prose, or a bulk-stacked block) is INVALID → no credit (unchanged).

## Why not the others
- **(A) require named handlers everywhere** — forces ~219 refactors across public/ and fights the browser idiom (handlers are legitimately anonymous). Keep it only as the fallback where the AST genuinely cannot identify a handler node.
- **(C) alternative proof (label + external gate covers it)** — decouples the marker from the CODE LOCATION: it would prove "a gate exists somewhere," not "the impl is HERE." That weakens the attach guarantee and reopens a softer version of the hole. (B) keeps the marker bound to the actual handler node.

## Consequence
- Makes the rule TOTAL (named + handler-scoped) with ~0 code churn; the 219 become PROVEN-COMPLETE (attached to their handler node), not a fourth limbo bucket.
- Single-source: the handler-scope predicate lives in the ONE `impl-marker-attach.ts` (symmetric with `test-marker-attach.ts`); [test] gate-style files already needed a parallel "assertions-without-it()" allowance, so this is the same shape.
- Fail-closed on truncation (see identity-family): the attach resolver is full-uuid only.

## FILE_HEADER (182) — component/module-scope [impl] tags — same shape, one nuance
> ★ PO RULING (authoritative, 2026-08-08): file/component-scope tags = VALID but a DISTINCT attachment kind → **`COMPLETE_FILE_SCOPE`, separately reported**, with the condition that **a tag whose label NAMES an existing method must attach THERE instead**. This section (committed independently, converges) DEFERS to that ruling — same policy-B shape; the classifier emits `COMPLETE_FILE_SCOPE` as the distinct bucket.
Expert measured 182 markers heading a NON-member (a class decl or an import) = file/component-scope tags (e.g. `[impl] T10 device enrollment` atop DeviceEnrollDialog.ts; module R17.x tags).

**DECISION: LEGIT when the marker heads a named CLASS/MODULE DECLARATION → attach to that class/module NODE + explicit label = PROVEN-COMPLETE, but tagged `component-scope` (distinct from method-scope).** Same reasoning as handler-scope (B): a real impl at a bindable NAMED node + a label is proven; declaring file-scope "out of scope" would reopen the hole. A class decl IS a specific named node — the existing heads-named-member rule already binds it.
- **Heads an import / floats with NO declaration** → NOT a valid attach → labelled `needs-reattach` (fallback-A: find the real method, or it's a file-stack-style over-tag). Fail-closed, no credit.
- **★ NUANCE — keep the granularity VISIBLE (don't let coarse credit masquerade as method-precise):** a component-scope attach is COMPLETE but coarser than a method attach — it credits the whole component, not a named method. Tag it `component-scope` in the classifier so a reviewer sees which credits are component-level vs method-level. A requirement that is genuinely method-level should still attach to its METHOD; component-scope is for genuinely component-level features (a UI component implementing a feature end-to-end). The tag makes that judgement reviewable rather than hidden.
- This preserves the anti-file-stack principle: attach to a SPECIFIC named node (class = specific), name-matched (label), fail-closed on no-decl — while not forcing a method that doesn't exist for a whole-component feature.
