# task.propose

**UUID:** `411297ee-314d-4ef4-a4e6-de5fca6e5815`
**Roles:** robbin-planner, robbin-po
**Requirement:** R17.18

## Description

Propose a new Task linked to a Requirement. Creates Task at Planned state + emits TraceLinks.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `requirementIor` | `ior:instance` | ✓ | Requirement this task implements |
| `name` | `string` | ✓ | Task name |
| `description` | `string` | ✓ | Task description |
| `sprintIor` | `ior:instance` | ✓ | Sprint to own the task |
| `assigned` | `string` |  | Assigned agent role |
| `effort` | `string` |  | Effort estimate (S/M/L) |
| `acceptanceCriteria` | `string[]` |  | AC list |


## Returns

`SkillResult` — {ior, unit, links[]}

## Implementation

`ior:file:src/ts/scenario/skills.ts?function=proposeTask`
