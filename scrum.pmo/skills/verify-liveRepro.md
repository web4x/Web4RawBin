# verify.liveRepro

**UUID:** `39d30faa-a34d-4d53-89c5-b4cf0921c145`
**Roles:** robbin-tester
**Requirement:** R-Q

## Description

Rule #27 strict-bar: SW-ACTIVE live verification. Tests run WITH service worker registered + activated, not bypassing SW.

## Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `route` | `string` | ✓ | Route to verify (e.g. /app, /trace) |


## Returns

`{swState, cacheEntries, status}` — 

## Implementation

`ior:file:test/e2e/sw-activation.spec.ts`
