# task.transition

**UUID:** `c35bd4fd-22ea-438d-8263-4e405d0094de`
**Roles:** robbin-po, robbin-expert, robbin-tester
**Requirement:** R17.15

## Description

Transition a Task through its lifecycle FSM. 6 verbs: startRefinement, startCreatingTestCases, startImplementing, startTesting, requestQAReview, tronApprove.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `taskIor` | `ior:instance` | ✓ | Task to transition |
| `verb` | `enum:startRefinement|startCreatingTestCases|startImplementing|startTesting|requestQAReview|tronApprove` | ✓ | FSM transition verb |
| `tronCommitRef` | `string` |  | Required for tronApprove — commit SHA |


## Returns

`SkillResult` — {ior, unit, links[]}

## Implementation

`ior:file:src/ts/scenario/skills.ts?function=statusTransition`
