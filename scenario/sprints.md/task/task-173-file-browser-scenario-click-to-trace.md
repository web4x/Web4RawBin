# T173: .scenario.json click → /trace tree + lazy-load (consolidates R-K1 + R-L; covers R-K2 + R-K3)
[task:uuid:7a5f0eb9-7a33-492b-991a-b13c431dc695]

## Status

- [x] Planned
- [x] In Progress
  - [x] refinement (architect design — this document)
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Traceability

- up
  - [Sprint 17 Planning](./planning.md)
  - [compound-requirement-source-2.md](./compound-requirement-source-2.md) — R-K1, R-K2, R-K3, R-L (Tron verbatim, captured by robbin-req)
  - **R-K1** `[requirement:uuid:bd2670a9-e7c2-4dd8-87c5-f349807c1d95]` — clicking a .scenario.json must not be a dead end
  - **R-K2** `[requirement:uuid:a78c8c41-7883-4628-8eb5-36a426e331f2]` — clicking opens it as that instance in the /trace tree
  - **R-K3** `[requirement:uuid:4c621af1-0081-4e8a-ac45-92e49577cfdb]` — lazy-load children cascading down the LOCKED chain
  - **R-L**  `[requirement:uuid:7034b7ee-d2da-45f4-9f54-bdb606d7df2a]` — generated views must never emit dead links (shares root cause with R-K1)
- follows
  - T165 (7-class tree), T166 (Class+Method overlay), T158 (DetailViews), T168 (LOCKED chain)
- down
  - None (atomic task)

## QA Audit & User Feedback

- 2026-06-03: Tron verbatim — R-K1 "clicking on the sprint.json currently ends in a dead end"; R-K2 "instead open it as a sprint item view in the traceability tree view"; R-K3 lazy-load cascade; R-L "still shows File not found". Captured by robbin-req in `compound-requirement-source-2.md`.
- 2026-06-03: PO refinement — R-K1 + R-L share root cause (json-click-to-navigate). Consolidate into single task with dual AC (this T173).
- 2026-06-03: Architect (3f9ff04) — design complete (Parts 1-4 + Concrete Repro + Fix Specification covering jsonHref + chain-link fallback).
- Pending: expert impl (rule-pair (a)+(b)), tester verification (R-K1+R-L+R-K2+R-K3 ACs), then Tron QA.

---

**Architect:** robbin-architect @ web4team:0.0
**Sprint:** Sprint 17 — Scenario Units
**Owners (CMM4):** robbin-req (R-K1/K2/K3/L capture) → robbin-architect (design, 3f9ff04) → robbin-expert (impl; rule-pair (a)+(b)) → robbin-tester (verify ACs)
**R-K1 + R-L:** consolidated — no dead-end links from file-browser, chain-link fallbacks, or any generated view

### Second Repro: T110 Link from Sprint Overview (R-L family)

**Steps:**
1. Open `/md/scenario/sprints.md/sprint/sprint-traceability-ux.md`
2. See "Traceability Tasks: 🔗 T110: DetailViewContainer..."
3. Click → navigates to relative path `../sprints.md/task/task-110-detailview-container.md`
4. Resolves to `/md/scenario/sprints.md/sprints.md/task/...` → **404 (double sprints.md)**

**Root cause — `templates.ts:64`:**

```typescript
// Line 64 — MD chain link (with slug resolver match):
if (info) return `[🔗 ${info.name}](../sprints.md/${info.type}/${info.slug}.md)`;
```

The relative path `../sprints.md/task/...` is wrong. Generated views live at `scenario/sprints.md/<type>/<slug>.md`. From `sprint/x.md`, `..` goes to `sprints.md/`, then `sprints.md/` prefix doubles it → `sprints.md/sprints.md/`.

**Fix:** Drop the redundant `sprints.md/` from the relative path — views are siblings within the `sprints.md/` tree:

```typescript
// BEFORE (line 64):
if (info) return `[🔗 ${info.name}](../sprints.md/${info.type}/${info.slug}.md)`;

// AFTER — sibling navigation within sprints.md/:
if (info) return `[🔗 ${info.name}](../${info.type}/${info.slug}.md)`;
```

From `sprint/x.md`, `../task/task-110.md` resolves correctly to `sprints.md/task/task-110.md`.

**Same fix for fallback (line 65):**
```typescript
// BEFORE:
return `[🔗 ${uuid.slice(0, 8)}](../sprints.md/task/${uuid.slice(0, 8)}.md)`;

// AFTER (per earlier T173 fix — fallback routes to /trace):
return `[🔗 ${uuid.slice(0, 8)}](/trace?ior=${encodeURIComponent(uuid)})`;
```

### ALL Generated Task Links — Single Fix Point

The `renderChainLinkMd()` function (templates.ts:61-65) is called by `renderChainSection()` (line 76) which ALL 7 class templates use. Fixing it ONCE fixes all 296 generated views.

**Updated files list (cumulative T173):**

| File | Change | Bug |
|------|--------|-----|
| `src/ts/server/server.ts:626` | `jsonHref()` → `/trace?ior=` for `.scenario.json` | Sprint JSON 404 |
| `src/ts/scenario/templates.ts:64` | `../sprints.md/${type}/` → `../${type}/` | Double sprints.md in MD links |
| `src/ts/scenario/templates.ts:65` | Fallback → `/trace?ior=` | Hardcoded task/ fallback |
| `src/ts/scenario/templates.ts:72` | Fallback → `/trace?ior=` | Hardcoded task/ fallback |
| `src/public/ts/trace/index.ts` | Read `?ior=` param, expand tree | New: lazy-load entry |
| `src/public/ts/trace/rb-trace-tree.ts` | Lazy root + per-expand | New: lazy-load tree |
| `src/ts/server/server.ts` | Add `/api/trace/children/`, `/ancestry/`, `/roots` | New: lazy-load endpoints |
| `src/public/ts/components/rb-file-tree.ts` | `.scenario.json` intercept | New: file-browser route |
| `package.json` + `sw.js` | Rule-pair (a)+(b) | |

**After fix:** ALL 296 generated view files have correct relative links. No regeneration needed — the templates emit correct paths on next view generation cycle.

## Subtasks

None (atomic task — one consolidated fix per PO direction 2026-06-03).
