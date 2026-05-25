# RawBin Project Backlog

Untriaged items awaiting Tron prioritization. **No sprint, no T-number** until
Tron triages an item into a feature sprint (then it gets the next sequential
T-number, currently T84+). Items here are NOT in any sprint's scope.

---

## B1 — Monaco editor back button navigates to /app, not parent directory

- **Status:** Backlog — awaiting Tron triage
- **Sprint:** none · **T-number:** none (assign T84+ only if prioritized)
- **Raised:** 2026-05-25 (req-eng drafted as task-90 in sprint-11; removed — sprint-11 is traceability-only)
- **Triage note (PO):** Possibly an untriaged UX change rather than a confirmed
  bug — `← App`→`/app` and `📂`→`/md/` may be intentional. Needs Tron triage.
- **However (planner note):** the draft cites a *literal Tron quote*: "the monaco
  editor has a back button… it goes always to app and not to the directory in
  which the current edited file is. thats a bug." PO to reconcile whether this is
  already Tron-confirmed.

**Proposed change (preserved from draft, not committed work):**
- `rb-editor-toolbar.ts:36` hardcodes `<a href="/app">← App</a>`.
- Derive parent dir from `this._path`:
  `const parentDir = this._path ? '/md/' + this._path.split('/').slice(0,-1).join('/') + '/' : '/md/';`
- Relabel "← App" → "← Back". Keep the `📂` root-browse button (line 37) unchanged.
- Edge cases: deep paths, root-level files, no file open → `/md/`.

**If triaged in:** belongs to a Monaco/editor feature sprint (NOT Sprint 11), gets
next sequential T-number, authored from the Web4Articles task template with a
`requirement:uuid` up-link per `standards/traceability-standard.md`.

---
**Created:** 2026-05-25 · **Maintained by:** robbin-planner
