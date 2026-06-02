# Compound Requirement Source — Task State Machine + Traceability Units

**Captured by:** robbin-req
**Date:** 2026-06-02
**Source:** Tron directive via robbin-po

## FLAG: STATEMENT CUT OFF

Tron's directive was cut off mid-sentence. The text below is **verbatim but incomplete**. Flagged for Tron to complete.

## Tron Verbatim (INCOMPLETE)

> "the task statuses will work like that in md but not in html. actually the tasks statuses must be methods of task class that trigger a task state machine until a task is done. the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links in a requirement and use case and class,… instances with md and"

**CUT HERE** — sentence unfinished. Likely continues with: "...md and [html/json/...] views" or similar.

## Decomposition (3 discernible requirements — NOT authoritative, literal text above IS)

### R-A: HTML view of task status checklist broken
> "the task statuses will work like that in md but not in html"

Task status checkboxes render correctly in raw markdown but are broken when viewed in the HTML browser (`/md/` route). The `marked.js` rendering or the MD_CSS styling does not preserve checkbox state/interactivity.

### R-B: Task.status becomes state-machine methods on Task class
> "actually the tasks statuses must be methods of task class that trigger a task state machine until a task is done"

Task status is not just markdown checkboxes — it must be **methods** (verbs) on a `Task` class that drive a state machine: Planned → In Progress (refinement/test/impl/testing) → QA Review → Done. The class exposes methods like `task.startRefinement()`, `task.startImplementing()`, `task.complete()` that transition state.

### R-C: Traceability artifacts become atomic scenario.json units
> "the traceability needs to be converted to uuid.scenario.json of the traced type as atomic units in the index with ln links in a requirement and use case and class,… instances with md and"

Each traceability artifact (Requirement, UseCase, Class, Method) becomes a `<uuid>.scenario.json` file in `scenario/index/`. These are atomic units indexed by type. `ln` (symlinks) connect instances. Each unit has MD and [CUT — likely HTML/JSON] views.

This extends the Sprint 17 scenario unit architecture to cover the full traceability chain — requirements, use cases, and classes are no longer just markdown sections but first-class scenario units with JSON models and symlink-based indexing.
