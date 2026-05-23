[Back to Sprint 4 Planning](./planning.md)

# T23-T25: Sprint 1-3 Task File Audit Report

**Auditor:** robbin-tester
**Date:** 2026-05-23
**Scope:** 28 task files across Sprints 1-3

## Summary

| Category | Count | Details |
|----------|-------|---------|
| Total task files audited | 28 | Sprint 1: 11, Sprint 2: 6, Sprint 3: 11 |
| Status = DONE | 28/28 | All correct |
| Unchecked acceptance criteria | 23/28 | 136 unchecked boxes across 23 files |
| Missing Completed date | 28/28 | None have a Completed date field |
| Broken cross-references | 2 | Both in task-1-team-bootstrap.md |
| Missing acceptance criteria | 1 | task-22-lobby-fixes.md has no AC section |
| planning.md exists | 3/3 | All sprint dirs have planning.md |

## Issue 1: Unchecked Acceptance Criteria (23 files, 136 boxes)

All tasks are marked Status: DONE but acceptance criteria checkboxes remain `- [ ]` (unchecked). These should be `- [x]` for completed work.

| File | Unchecked |
|------|-----------|
| **Sprint 1** | |
| task-1-team-bootstrap.md | 5 |
| task-1.2-expert-fork-ud-agents.md | 5 |
| task-3-room-ts.md | 5 |
| task-3.4-test-alignment.md | 2 |
| task-4-strip-server.md | 6 |
| task-5-room-ui.md | 5 |
| task-6-rebrand.md | 6 |
| **Sprint 2** | |
| task-7-user-editor.md | 7 |
| task-7.0-md-puml-viewer.md | 4 |
| task-8-profile-gate.md | 7 |
| task-9-ssh-keys.md | 7 |
| task-10-device-keys.md | 7 |
| task-11-vcard.md | 6 |
| task-12-ssh-login.md | 8 |
| **Sprint 3** | |
| task-13-playwright-e2e.md | 6 |
| task-14-integration-tests.md | 4 |
| task-15-md-puml-viewer.md | 4 |
| task-16-deployment.md | 5 |
| task-17-bugfixes.md | 7 |
| task-18-header-parity.md | 5 |
| task-19-member-list-parity.md | 6 |
| task-20-chat-parity.md | 10 |
| task-21-tron-feedback.md | 3 |

**Files with ALL criteria checked (5):**
- task-1.1-agent-trainer-clone-ud-team.md (status checklist only)
- task-1.3-trainer-verify-inherited-knowledge.md (status checklist only)
- task-2-rawbin-architecture.md (3 checked)
- task-2-rawbin-architecture-definition.md (no AC section)
- task-22-lobby-fixes.md (no AC section)

## Issue 2: Missing Completed Date (28/28 files)

No task file has a `Completed:` field. Recommendation: add `**Completed:** 2026-05-2X` to each DONE task. Sprint dates:

- Sprint 1: completed ~2026-05-22 (architecture approved by Tron)
- Sprint 2: completed ~2026-05-22/23
- Sprint 3: completed ~2026-05-23

## Issue 3: Broken Cross-References (2 links)

Both in `sprint-1-rawbin-foundation/task-1-team-bootstrap.md`:

| Link Target | Issue |
|-------------|-------|
| `./task-1.2-agent-trainer-rename-rebrand-agents.md` | File does not exist — actual file is `task-1.2-expert-fork-ud-agents.md` |
| `./task-1.3-po-verify-team-operational.md` | File does not exist — actual file is `task-1.3-trainer-verify-inherited-knowledge.md` |

## Issue 4: Missing Acceptance Criteria (1 file)

- `sprint-3-e2e-hardening/task-22-lobby-fixes.md` — has Status: DONE but no acceptance criteria section at all.

## Issue 5: Duplicate Task 2 Files

Sprint 1 has two task-2 files:
- `task-2-rawbin-architecture.md` — overview with Tron approval (207 lines)
- `task-2-rawbin-architecture-definition.md` — detailed analysis (458 lines)

Both are Status: DONE. This is intentional (overview + definition) but should be noted.

## Per-File Checklist

### Sprint 1: rawbin-foundation (11 files)

| File | Status OK | AC Checked | Date | Links |
|------|-----------|------------|------|-------|
| task-1-team-bootstrap.md | DONE ✓ | 5 unchecked | missing | 2 broken |
| task-1.1-agent-trainer-clone-ud-team.md | DONE ✓ | all checked | missing | OK |
| task-1.2-expert-fork-ud-agents.md | DONE ✓ | 5 unchecked | missing | OK |
| task-1.3-trainer-verify-inherited-knowledge.md | DONE ✓ | all checked | missing | OK |
| task-2-rawbin-architecture.md | DONE ✓ | all checked | missing | OK |
| task-2-rawbin-architecture-definition.md | DONE ✓ | no AC section | missing | OK |
| task-3-room-ts.md | DONE ✓ | 5 unchecked | missing | OK |
| task-3.4-test-alignment.md | DONE ✓ | 2 unchecked | missing | OK |
| task-4-strip-server.md | DONE ✓ | 6 unchecked | missing | OK |
| task-5-room-ui.md | DONE ✓ | 5 unchecked | missing | OK |
| task-6-rebrand.md | DONE ✓ | 6 unchecked | missing | OK |

### Sprint 2: identity-ssh (6 files)

| File | Status OK | AC Checked | Date | Links |
|------|-----------|------------|------|-------|
| task-7-user-editor.md | DONE ✓ | 7 unchecked | missing | OK |
| task-7.0-md-puml-viewer.md | DONE ✓ | 4 unchecked | missing | OK |
| task-8-profile-gate.md | DONE ✓ | 7 unchecked | missing | OK |
| task-9-ssh-keys.md | DONE ✓ | 7 unchecked | missing | OK |
| task-10-device-keys.md | DONE ✓ | 7 unchecked | missing | OK |
| task-11-vcard.md | DONE ✓ | 6 unchecked | missing | OK |
| task-12-ssh-login.md | DONE ✓ | 8 unchecked | missing | OK |

### Sprint 3: e2e-hardening (11 files)

| File | Status OK | AC Checked | Date | Links |
|------|-----------|------------|------|-------|
| task-13-playwright-e2e.md | DONE ✓ | 6 unchecked | missing | OK |
| task-14-integration-tests.md | DONE ✓ | 4 unchecked | missing | OK |
| task-15-md-puml-viewer.md | DONE ✓ | 4 unchecked | missing | OK |
| task-16-deployment.md | DONE ✓ | 5 unchecked | missing | OK |
| task-17-bugfixes.md | DONE ✓ | 7 unchecked | missing | OK |
| task-18-header-parity.md | DONE ✓ | 5 unchecked | missing | OK |
| task-19-member-list-parity.md | DONE ✓ | 6 unchecked | missing | OK |
| task-20-chat-parity.md | DONE ✓ | 10 unchecked | missing | OK |
| task-21-tron-feedback.md | DONE ✓ | 3 unchecked | missing | OK |
| task-22-lobby-fixes.md | DONE ✓ | no AC section | missing | OK |

## Recommendations

1. **Check all AC boxes** — 136 unchecked criteria across 23 DONE tasks. Expert/PO should verify and check each.
2. **Add Completed dates** — All 28 tasks missing. Add `**Completed:** YYYY-MM-DD` after Status line.
3. **Fix 2 broken links** in task-1-team-bootstrap.md — update subtask filenames.
4. **Add AC section** to task-22-lobby-fixes.md.
5. **Consider template** — standardize task file format (T26) to prevent future omissions.
