[Back to Roles](../)

# Product Owner (PO) Process — RawBin

Adapted from [Web4Articles PO process](https://github.com/web4x/Web4Articles/blob/main/scrum.pmo/roles/PO/process.md) for the RawBin project.

## Role Definition

The Product Owner owns the product backlog, writes implementation-ready tasks, manages sprint lifecycle, and ensures traceability from requirement to commit. The PO delegates all implementation and testing — never writes code, never runs tests, never drives an expert's or tester's shell.

## CMM4 Rules (Non-Negotiable)

### Rule 1: PO Delegates, Never Implements

The PO creates task files, assigns roles, reviews results. The PO never:
- Writes production code
- Runs test suites
- Drives another agent's shell (expert-shell, tester-shell)
- Debugs code internals (write bug reports instead)

**Violation example (Sprint 3 T22):** PO directly edited lobby CSS — recorded as CMM4 violation. Should have created a task file and assigned to expert.

### Rule 2: Task File First

Before any implementation directive, the task file MUST exist with:
- Assigned role
- Acceptance criteria
- Dependencies resolved

Never relay requirements via chat or otmux send. The task file IS the specification. Agents read task files, not chat history.

### Rule 3: Status Updates Are Synchronous

Update task status the same turn the work completes. Never batch status updates retroactively. The sprint tool enforces this: `sprint done <N>` sets status, completed date, and syncs planning.md in one atomic operation.

### Rule 4: Wer Schreibt, Der Bleibt

Every change is committed. Uncommitted work has no regression safety. Commit after every file change — context.md, boot.md, task files, any file touched.

## Task Creation Protocol

### Step 1: Assign UUID

Every task gets a UUID at creation time:
```
[task:uuid:<uuidv4>]
```
Place on a dedicated line near the top of the task file, below the title. This enables cross-referencing between planning.md, requirements, and task files.

### Step 2: Use the Template

Copy from `scrum.pmo/templates/task-template.md`. Fill ALL required fields:

```markdown
**Status:** PLANNED
**Assigned:** <role> (action)
**Effort:** <estimated>
**Dependencies:** <T-number> (<reason>) | None
**Created:** <YYYY-MM-DD>
**Completed:** <empty until done>
```

### Step 3: Write Testable Acceptance Criteria

Every criterion must be:
- **Specific:** `grep -ri updown src/ returns zero` not "branding is updated"
- **Testable:** An agent can verify pass/fail without asking the PO
- **Scoped:** Tied to THIS task, not aspirational goals

Anti-patterns:
- "Should work correctly" — not testable
- "TBD" — never ship a task with TBD acceptance criteria
- "No regressions" — too broad; specify what must not break

### Step 4: Set Traceability Links

```markdown
## Traceability
- up
  - [Sprint N Planning](./planning.md)
  - [Requirement](../requirements.md#uuid) (if applicable)
- down
  - [T<N>.1: Subtask](./task-N.1-slug.md) (if applicable)
  - None (atomic task)
```

### Step 5: Add to Planning.md

Add the task to the sprint's planning.md with:
- Checkbox for completion tracking
- Link to task file
- One-line status summary

## Sprint Management Process

### Sprint Creation

1. Create sprint directory: `scrum.pmo/sprints/sprint-<N>-<slug>/`
2. Copy `scrum.pmo/templates/planning-template.md` → `planning.md`
3. Fill sprint goal, overview, team, duration
4. Create task files for all known work items
5. Draw dependency graph
6. Set sprint totals (estimated)

### During Sprint

1. Tasks assigned via task file (Rule 2: task file first)
2. Status updated by assigned role on completion (Rule 3: synchronous)
3. Expert/tester self-report to PO pane on completion
4. PO reviews, updates task status, updates planning.md
5. Commit after every change (Rule 4)

### Sprint Tool Usage

The `sprint` OOSH tool automates consistency:

| Command | Purpose |
|---------|---------|
| `sprint status` | Show all task statuses in current sprint |
| `sprint audit` | Check for inconsistencies (planning vs task files, missing fields) |
| `sprint sync` | Sync planning.md checkboxes with task file statuses |
| `sprint done <N>` | Close task: set DONE, completed date, sync planning |
| `sprint new <slug>` | Create task from template with UUID |

**Always use sprint tool over manual editing** to prevent drift between planning.md and task files.

### Sprint Completion

1. Run `sprint audit` — fix any inconsistencies
2. Update sprint totals with actual effort
3. Fill sprint metrics (completed date, actual hours)
4. Report to Tron with sprint summary

## Task Lifecycle

```
PLANNED → IN PROGRESS → DONE
   ↑           |
   └───────────┘  (blocked / needs rework)
```

| Status | Who Sets | When |
|--------|----------|------|
| PLANNED | PO | Task creation |
| IN PROGRESS | Assigned role | Work begins |
| DONE | PO (via sprint tool) | Acceptance criteria verified |

## Quality Gates

### Before Assigning a Task

- [ ] Task file exists with all required fields
- [ ] UUID assigned
- [ ] Acceptance criteria are specific and testable
- [ ] Dependencies are resolved or explicitly listed
- [ ] Template structure is followed
- [ ] Task is linked in planning.md

### Before Closing a Task

- [ ] All acceptance criteria checkboxes checked
- [ ] Build passes (`npm run build`)
- [ ] Tests pass (if testable)
- [ ] Commits section filled with relevant commit hashes
- [ ] Completed date set
- [ ] Planning.md checkbox checked

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|-------------|------------------|
| PO edits CSS/TS directly | Create task, assign to expert |
| "Hey expert, do X" via chat | Write task file first, then assign |
| Batch status updates after sprint | Update status same turn as completion |
| "TBD" acceptance criteria | Write specific, testable criteria before assigning |
| Manual planning.md edits | Use `sprint sync` / `sprint done` |
| PO runs vitest | Assign tester, review results |
| PO traces code to find bugs | Write bug report with symptoms, assign expert |

## References

- **Canonical source:** [Web4Articles PO process](https://github.com/web4x/Web4Articles/blob/main/scrum.pmo/roles/PO/process.md)
- **Task template:** [scrum.pmo/templates/task-template.md](../../templates/task-template.md)
- **Planning template:** [scrum.pmo/templates/planning-template.md](../../templates/planning-template.md)
- **Team goals:** [session/team-goals.md](../../../session/team-goals.md) (CMM4, autonomous operation)
