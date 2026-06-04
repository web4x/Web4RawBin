[Back to Sprint 17 Planning](./planning.md)

# T184: Forward-only API emit — strip backward keys at TraceConsistency source (LOW)
[task:uuid:184a0b1c-2d3e-4f50-8617-a18401840184]

> **PO direction 2026-06-05:** Refine the md-parser forward-only design.
> T181 filters backward keys at the DISPLAY layer (client). T184 goes deeper:
> strip at the API EMIT layer (server) so `/api/trace` never sends backward
> keys to the client. FORWARD_KEYS-at-source.

## Status
- [ ] Planned
- [ ] In Progress
- [ ] QA Review
- [ ] Done

## Traceability
- up
  - [Sprint 17 Planning](./planning.md)
  - PO directive 2026-06-05: forward-only at source, not just display
  - **R-U** `[requirement:uuid:82638acb-2fae-4ad9-833b-27f7b218b2b2]` (same as T181)
- follows
  - T181 (`883ce4aa` forward-only DISPLAY — client-side FORWARD_KEYS filter)
  - T178 (overlay-read fix `f306e503` — serves all forward refs)
- down
  - None (atomic)

## Architect Design (2026-06-05)

### Problem

`/api/trace` endpoint (server.ts:481) calls `graph.toJSON()` which emits ALL link keys per object — both forward AND backward:

```typescript
// server.ts:481 — CURRENT
res.end(JSON.stringify({ objects: graph.toJSON(), broken, issueCount: issues.length }));
```

`TraceGraph.link(a, relation, b, inverse)` stores BOTH directions internally (needed for `parent` getter + `resolve()`). But `toJSON()` dumps everything — clients receive backward keys that T181 must then filter.

### Design Decision: Filter at API emit (Option B)

**NOT at toJSON()** — breaks `fromJSON()` round-trip (internal graph needs both directions).
**NOT at construction** — breaks `parent` getter and server-side backward traversal.
**YES at API emit** — clean separation: internal graph stays bidirectional, API response is forward-only.

### FORWARD_KEYS constant (extract from TraceModel.ts)

Currently lives INLINE inside TraceObject.children getter (line 140). Extract as module-level export:

```typescript
// TraceModel.ts — ADD at module level
export const FORWARD_KEYS: Record<string, string> = {
  requirement: 'tasks',
  task:        'useCases',
  usecase:     'classes',
  class:       'methods',
  method:      'implementations',
  implementation: 'tests',
};
```

### Server-side filter function

```typescript
// server.ts or shared/trace-utils.ts
import { FORWARD_KEYS } from '../shared/TraceModel.js';

function forwardOnlyGraph(objects: FlatObject[]): FlatObject[] {
  return objects.map(obj => {
    const fwdKey = FORWARD_KEYS[obj.type];
    const links: Record<string, string[]> = {};
    if (fwdKey && obj.links[fwdKey]) {
      links[fwdKey] = obj.links[fwdKey];
    }
    return { ...obj, links };
  });
}
```

### Per-File Fix Table

| File | Line | Current | Fix |
|------|------|---------|-----|
| `TraceModel.ts` | 140 (inline) | `FORWARD` dict inside `children` getter | Extract as `export const FORWARD_KEYS` at module level |
| `server.ts` | 481 | `graph.toJSON()` — all keys | `forwardOnlyGraph(graph.toJSON())` — forward keys only |
| `rb-trace-tree.ts` | (client) | T181's `forwardOnly(obj)` helper | Can simplify: server already filters; client can trust `links` |
| `server.ts` | 528 | `/api/trace/children` fallback uses `Object.values(links).flat()` | Already keyed by FORWARD_KEYS (line 505-509); no change needed |

### Defense-in-depth

After T184, backward keys are stripped at TWO layers:
1. **Server** (T184) — `/api/trace` response contains only forward keys
2. **Client** (T181) — DetailViews + tree still filter, as a safety net

This is correct: the client filter stays as defense-in-depth. If future API changes accidentally re-introduce backward keys, the client won't render them.

### Rule-pair: (a)+(b) required; (c) EXEMPT
Server-only code change — no client bundle change (T181 client filter stays as-is).

## Acceptance Criteria
- [ ] AC1 — `FORWARD_KEYS` exported from TraceModel.ts as module-level constant
- [ ] AC2 — `/api/trace` response contains ONLY forward link keys per object type
- [ ] AC3 — `/api/trace/children` response unaffected (already keyed by FORWARD_KEYS)
- [ ] AC4 — Internal TraceGraph still stores bidirectional links (parent/children getters work)
- [ ] AC5 — T181 client-side filter stays as defense-in-depth (NOT removed)
- [ ] AC6 — `npm run build` clean; test suite passes; no regression

## Subtasks
None (atomic).

---

**Sprint:** Sprint 17 — Scenario Units
**Phase:** LOW — defense-in-depth, follows T181 (display) + T178 (data)
**Follows:** T181 (client filter) · T178 (overlay-read fix)
