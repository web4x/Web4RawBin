# Skill — Realtime Traceability Chain (CMM3, automated, deterministic)

**Owner:** robbin-skill-expert · **Maturity:** CMM3 (reproducible, measured, automated)
**Goal:** GIVEN a Tron bug/req → chain appears on /trace on reload, ZERO manual steps after authoring.

## Prerequisites

| Component | Owner | Status |
|---|---|---|
| ScenarioIndex reads from disk per-request (no startup cache) | already live | `/api/trace` at L617 constructs `new ScenarioIndex()` per call; `get()` reads disk, `list()` has 5s TTL |
| CurrentSprint.setChain() | architect (43d570be) | live — sets the WIP=1 chain singleton |
| Chain.wireImplNode() | skill-expert | live — creates Impl unit + wires forward arrays |
| /trace renders from /api/trace graph | already live | trace-page.ts fetches + renders |

**No server restart needed.** The server creates a fresh ScenarioIndex per /api/trace request.
The only latency is the 5s list-cache TTL — a reload 5 seconds after authoring always reflects.

## The Skill: end-to-end in 6 commands

### Step 0 — Tron says something (input)

```
TRON: "the detail drawer nudge is too small on iPhone"
```

### Step 1 — req captures as Requirement unit (req-eng, ~30s)

```bash
npx tsx scripts/objectVerb.ts Scenario captureQuote \
  --altId "R20.2" \
  --name "R20.2: Default detail drawer nudge becomes the wide grab-bar" \
  --quote "the detail drawer nudge is too small on iPhone" \
  --sprint S20
```

Produces: `scenario/index/<prefix>/<req-uuid>.scenario.json` with `ior:class:Requirement`.
Returns the req UUID.

### Step 2 — architect designs UseCase + Class + Method (architect, ~60s)

Create UC, Class, Method units with forward wiring. Each is a `put()` call:

```bash
# UC
npx tsx scripts/objectVerb.ts Scenario proposeTask \
  --reqUuid <req-uuid> \
  --ucName "detailDrawer.wideGrabBar" \
  --className "RbDetailDrawer" \
  --methodName "renderGrabBar"
```

Or manually via idx.put() in a one-shot script. The key fields:
- UC: `useCases[]` on Req pointing to UC; `classes[]` on UC; `method` on UC
- Class: `methods[]` array
- Method: `implementations[]` (empty until Step 3)

### Step 3 — expert implements + wires Impl (expert, ~5min)

Write the code with a real `[impl:uuid:]` marker heading the named function:

```typescript
// [impl:uuid:<uuidgen-fresh>] renderGrabBar
renderGrabBar(): void { /* ... */ }
```

Then wire the Impl scenario unit:

```bash
npx tsx scripts/objectVerb.ts Chain wireImplNode <method-uuid>
```

Creates Implementation unit + sets `Method.implementations[]` + moves any `Method.tests[]` → `Impl.tests[]`.

### Step 4 — tester writes test with `[test:uuid:]` (tester, ~2min)

```typescript
// [test:uuid:<uuidgen-fresh>] renderGrabBar
it('renders the wide grab-bar', () => { /* ... */ });
```

Wire `Impl.tests[]` to point to the Test unit UUID.

### Step 5 — planner drives via CurrentSprint (planner, ~10s)

```typescript
import { CurrentSprint } from './src/ts/scenario/CurrentSprint.js';
const cs = new CurrentSprint(idx);
cs.setChain({
  req: '<req-uuid>',
  uc: '<uc-uuid>',
  class: '<class-uuid>',
  method: '<method-uuid>',
  impl: '<impl-uuid>',
  test: '<test-uuid>',
}, 'S20', 'T-wide-grab-bar');
```

Or via the planner driving skill (scrum.pmo/skills/planner-current-sprint-driving.md).

### Step 6 — verify on /trace (anyone, ~5s)

```bash
# Wait 5s for list-cache TTL, then:
curl -sk https://home.donges.it:4444/api/trace | python3 -c "
import json,sys; d=json.load(sys.stdin)
for o in d['objects']:
    if o['uuid'] == '<req-uuid>':
        print('FOUND:', o['type'], o['title'], 'links:', list(o['links'].keys()))
        break
else:
    print('NOT FOUND — check unit on disk')
"
```

Then reload /trace in browser — the chain renders in the tree, clickable through to the detail drawer.

## Why it's realtime (no restart)

```
scenario/index/  ←── units written to disk (Steps 1-4)
       ↓
/api/trace       ←── new ScenarioIndex() per request (L617, reads disk)
       ↓                + scanRepo overlays (L611)
       ↓                + SCENARIO_FORWARD populates graph edges (L624-649)
/trace page      ←── fetch('/api/trace') + render (trace-page.ts)
```

Each reload gets fresh disk state. The 5s `list()` TTL is the only delay.

## Verification checklist (det-3x gate)

```bash
# 1. Chain credited in canonical scorer
npx tsx scripts/objectVerb.ts Chain followUp <req-uuid>
# → complete: true (all 6 nodes check)

# 2. Deterministic (3 identical runs)
for i in 1 2 3; do npx tsx scripts/objectVerb.ts Chain followUp <req-uuid> 2>/dev/null | grep complete; done

# 3. AST strict-test passes (impl marker heads named member + name-match)
npx tsx scripts/objectVerb.ts Chain lintMarkers | grep <impl-uuid>
# → no output = clean

# 4. /trace renders
curl -sk https://home.donges.it:4444/api/trace | python3 -c "import json,sys; print(len([o for o in json.load(sys.stdin)['objects'] if '<req-uuid>' in str(o)]),'objects in graph')"
```

## Coordination matrix

| Step | Role | Tool | Artifact |
|---|---|---|---|
| 1. Capture | req-eng (0.5) | Scenario.captureQuote | Requirement unit |
| 2. Design | architect (0.4) | Scenario.proposeTask / manual | UC + Class + Method units |
| 3. Implement | expert (0.2) | code + Chain.wireImplNode | source marker + Impl unit |
| 4. Test | tester (0.6) | test code + idx.put | test marker + Test unit |
| 5. Drive | planner (0.1) | CurrentSprint.setChain | WIP=1 singleton |
| 6. Verify | anyone | curl + /trace reload | visual confirmation |

## Known constraints

- **list() 5s TTL**: `ScenarioIndex.list()` caches for 5s. Reload after 5s always reflects.
  `get()` has NO cache — individual unit lookups are always fresh.
- **scanRepo still runs per-request**: parses scrum.pmo markdown (Pass 1-3) + PUML (Pass 4) + source markers (Pass 5-6) on every /api/trace call. This is ~200ms on the current repo. If it becomes slow, the fix is caching scanRepo with file-watcher invalidation — NOT caching ScenarioIndex.
- **AST strict-test runs per scorer call**: parses all source files with TS compiler. ~2s. Not on the /api/trace hot path (scorer is CLI-only).

## Worked example: BUG8 (detail-drawer collection 404)

The BUG8 chain was authored using this exact procedure during the S20 champagne run:

1. **req** captured BUG8 as `ior:class:Bug` (R20 OOP extension of Requirement)
2. **architect** created UC `detailDrawer.renderCollection` → Class `RbDetailDrawer` → Method `renderSyntheticCollection`
3. **expert** implemented the fix in `rb-detail-drawer.ts` with `// [impl:uuid:<fresh>] renderSyntheticCollection` heading the method
4. **tester** wrote the test with `// [test:uuid:<fresh>]`, wired `Impl.tests[]`
5. **planner** called `setChain({...})` — chain appeared on /trace on next reload

Total wall-clock: ~8 minutes from Tron's bug report to chain visible on /trace.

## Endpoint reference (all read per-request, no restart)

| Endpoint | What it reads | Latency |
|---|---|---|
| `GET /api/trace` | scanRepo (markdown) + ScenarioIndex (all units) + SCENARIO_FORWARD graph build | ~200ms, fresh per call |
| `GET /api/trace/children/<uuid>` | ScenarioIndex.get (single unit, zero cache) + forward-ref walk | <10ms |
| `GET /api/ior/ior:instance:<uuid>` | ScenarioIndex.get (zero cache) | <5ms |
| `GET /api/ior/singleton` | CurrentSprint file read | <5ms |

All four endpoints construct fresh `ScenarioIndex` instances or read disk directly.
Zero caching on the read path = zero stale data = realtime by design.
