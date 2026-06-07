# chain.walk

**UUID:** `c96f4fa2-62e1-4fa0-99dd-a88e7aef6a01`
**Roles:** robbin-tester, robbin-architect, robbin-expert
**Requirement:** R17.18

## Description

Walk the traceability chain from any node (up/down/both). Returns ordered steps with type, name, relation, depth.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `startIor` | `ior:instance` | ✓ | Starting node IOR |
| `direction` | `enum:down|up|both` |  | Walk direction (default: both) |
| `maxDepth` | `number` |  | Max hops (default: 10) |


## Returns

`ChainStep[]` — [{ior, type, name, relation, depth}]

## Implementation

`ior:file:src/ts/scenario/skills.ts?function=walkChain`
