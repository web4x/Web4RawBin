# Known Issues — Sprint Tool

## Sprint Status Parser: Sprints 1-4 show IN PROGRESS (actually DONE)

**Reported:** 2026-05-24
**Tool:** `components/OOSH/dev.claude/sprint` (status command)
**Symptom:** Tasks in Sprints 1-4 report as "IN PROGRESS" despite being completed.
**Root cause:** Those task files use the Web4Articles hierarchical Status checklist format:
```
- [x] Planned
- [x] In Progress
- [x] QA Review
- [x] Done
```
The parser looks for `**Status:** DONE` (flat format) but doesn't detect `- [x] Done` as DONE.

**Fix needed:** `private.sprint.get.status()` in the sprint tool must also check for `- [x] Done` checkbox pattern (already partially implemented but the grep pattern misses the `[x]` variant).

**Impact:** 35 tasks across Sprints 1-4 report incorrect status. Sprint totals are misleading.
**Workaround:** Manually verify via git log or task file inspection.
