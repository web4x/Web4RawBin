# verify.7hopGate

**UUID:** `bc34a248-b4c5-4618-8bdb-736ba15455df`
**Roles:** robbin-tester, robbin-expert
**Requirement:** R-Q

## Description

Rule #27: Per-Test 7-hop strict audit. Every Test must reach a Requirement root within 7 hops. Exit 1 if any unreachable.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `mode` | `enum:report|strict` |  | report (default) or strict (exit 1 on fail) |


## Returns

`{reachable, total, unreachable[]}` — 

## Implementation

`ior:file:scripts/trace-audit.ts?function=auditAll`
