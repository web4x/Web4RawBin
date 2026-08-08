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
