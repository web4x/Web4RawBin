# ship.staticShell

**UUID:** `c61bc892-3d10-4f51-9400-d62e249d0ada`
**Roles:** robbin-expert
**Requirement:** R17.18

## Description

Rule #67: New SPA route or changed bundle hash → update sw.js STATIC_SHELL. build.mjs auto-injects hashed names.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `route` | `string` |  | New route path if adding one |


## Returns

`void` — 

## Implementation

`ior:file:build.mjs?function=autoInjectStaticShell`
