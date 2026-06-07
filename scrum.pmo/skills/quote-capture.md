# quote.capture

**UUID:** `0644dcf2-e879-412a-9ab0-da3cfcf22dea`
**Roles:** robbin-req, robbin-po
**Requirement:** R17.18

## Description

Capture a Tron directive as an atomic Requirement scenario unit. Deduplicates by text hash.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | ✓ | Verbatim Tron quote |
| `sprintIor` | `ior:instance` | ✓ | Sprint to own the requirement |
| `taskIor` | `ior:instance` |  | Optional task to link via TraceLink |


## Returns

`SkillResult` — {ior, unit, links[]}

## Implementation

`ior:file:src/ts/scenario/skills.ts?function=captureQuote`
