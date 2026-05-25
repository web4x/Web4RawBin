[Back to Planning](./planning.md)

# Sprint 12 — Editor Fixes — Requirements

Monaco editor (Sprint 8) follow-up bug fixes. Per
[traceability standard](../../standards/traceability-standard.md): each
requirement carries a `[requirement:uuid]` and a forward link to its task.

## Requirements

- [ ] R12.1 — The Monaco editor's back button navigates to the parent directory of
  the file currently being edited, not always to `/app`.
  [requirement:uuid:12a4b6c8-5d2e-4f30-9a17-3b5c7d9e1f02]
  > Tron: "the monaco editor has a back button on the top header, but it goes always to app and not to the directory in which the current edited file is. thats a bug."
  → [T84](./task-84-editor-back-button.md)

## Forward Traceability
| Requirement | Task | Use case | PUML | Class/method |
|-------------|------|----------|------|--------------|
| R12.1 | T84 | UC-FB.1 file.browse (Sprint 8 reqs) | N/A | `rb-editor-toolbar.ts:36` back-button href |

---
**Sprint:** Sprint 12 — Editor Fixes
**Created:** 2026-05-25
**Standard:** [traceability-standard.md](../../standards/traceability-standard.md)
