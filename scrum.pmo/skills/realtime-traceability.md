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

## Auto-follow WIP pin — design proposal (kills "pin is stale" at root)

### The problem
`setChain` is manual (planner calls `planner-drive.ts setChain <6 uuids>`).
When WIP switches, the planner forgets → pin shows the old chain → Tron sees
stale /trace → frustration.

### Design: Task.focus marker + followUp auto-derive

**Hook point**: a `focus: true` field on exactly ONE Task unit in the index.
When a task gains focus (status flips to "In Progress" or planner marks it),
`focus: true` is set on that task, `focus` is cleared on all others (WIP=1
enforcement at the data layer).

**Auto-derive**: `CurrentSprint.autoFollow(idx)` walks the focused task:
1. Find the ONE task with `focus: true`
2. Read `task.coveredRequirements[0]` → req UUID
3. Walk the chain from req: `req.useCases[0]` → `uc.classes[0]` → `uc.method` or
   `class.methods[0]` → `method.implementations[0]` → `impl.tests[0]`
4. Call `setChain({req, uc, class, method, impl, test})` with the derived UUIDs
5. `persist()` + `emit()` → pin updated, /trace reflects on reload

**Who fires it**: two triggers, both automatic:
- **Server-side**: `/api/trace` handler calls `autoFollow()` before building the
  graph (one line: `CurrentSprint.getInstance(idx).autoFollow()`). Every /trace
  reload gets the correct pin. Cost: ~1ms (one idx.list scan for `focus: true`).
- **CLI-side**: `planner-drive.ts focus <task-uuid>` sets focus + calls autoFollow.
  Replaces the manual 6-uuid setChain. The planner's action shrinks from
  "find 6 UUIDs and paste them" to "name the task."

### Implementation in CurrentSprint.ts (~25 lines)

```typescript
autoFollow(): boolean {
  // Find focused task
  for (const uuid of this.index.list()) {
    const unit = this.index.get(uuid);
    if (!unit || unit.ior !== 'ior:class:Task') continue;
    const m = unit.model as Record<string, unknown>;
    if (!m.focus) continue;
    // Derive chain from task's requirement
    const reqIors = (m.coveredRequirements as string[]) || [];
    if (reqIors.length === 0) continue;
    const reqUuid = ior(reqIors[0]);
    const reqUnit = this.index.get(reqUuid);
    if (!reqUnit) continue;
    const reqM = reqUnit.model as Record<string, unknown>;
    const ucUuid = ior(((reqM.useCases as string[]) || [])[0] || '');
    if (!ucUuid) continue;
    const ucUnit = this.index.get(ucUuid);
    if (!ucUnit) continue;
    const ucM = ucUnit.model as Record<string, unknown>;
    const clsUuid = ior(((ucM.classes as string[]) || [])[0] || '');
    const methUuid = ior(String(ucM.method || '')) || /* fallback */ '';
    const methUnit = methUuid ? this.index.get(methUuid) : null;
    const methM = methUnit?.model as Record<string, unknown>;
    const implUuid = ior(((methM?.implementations as string[]) || [])[0] || '');
    const implUnit = implUuid ? this.index.get(implUuid) : null;
    const implM = implUnit?.model as Record<string, unknown>;
    const testUuid = ior(((implM?.tests as string[]) || [])[0] || '');
    return this.setChain(
      { req: reqUuid, uc: ucUuid, class: clsUuid, method: methUuid, impl: implUuid, test: testUuid },
      String(m.sprint || ''), String(m.name || '')
    );
  }
  return false; // no focused task
}
```

### planner-drive.ts: add `focus` verb

```bash
npx tsx scripts/planner-drive.ts focus <task-uuid>
# Sets task.focus=true (clears others), calls autoFollow → pin updated
```

Replaces the current 6-uuid setChain workflow. One argument instead of eight.

### Server hook (one line in /api/trace handler)

```typescript
// At server.ts L617, after `const idx = new ScenarioIndex(scenarioDir);`
CurrentSprint.getInstance(idx).autoFollow();
```

Every /trace reload silently re-derives the pin. If the focused task's chain
grew (e.g. Impl wired since last reload), the pin updates automatically.

### Migration from manual setChain

| Today (manual) | After (auto-follow) |
|---|---|
| Planner finds 6 UUIDs | Planner types task UUID |
| `planner-drive.ts setChain <6 args>` | `planner-drive.ts focus <task-uuid>` |
| Forgets when WIP changes → stale pin | focus marker moves with WIP → pin auto-follows |
| setChain stays as a LOW-LEVEL API (escape hatch) | autoFollow is the default path |

### Risk assessment
- **WIP=1 enforcement**: `focus` verb clears all other task's `focus` fields before
  setting the new one. Cannot have 2 focused tasks (same invariant as today's
  "there's only one setChain call").
- **Partial chains**: if the chain is incomplete (e.g. no Impl yet), autoFollow
  sets what it can (req/uc/class/method) and leaves impl/test empty →
  `setChain` returns false (all 6 required). Fix: accept partial chains in setChain
  (pin shows progress-so-far, not only complete chains).
- **No server restart**: autoFollow runs in the /api/trace request path, not at startup.

## Implementation sequencing (PO-approved 2026-06-14)

| Phase | What | Who | Status |
|---|---|---|---|
| **NOW** | `CurrentSprint.autoFollow()` + `setFocus()` in CurrentSprint.ts | skill-expert | DONE (this commit) |
| **NOW** | `planner-drive.ts focus <task-uuid>` CLI verb | skill-expert | DONE (this commit) |
| **Phase 2** | `/api/trace` server hook: `CurrentSprint.getInstance(idx).autoFollow()` | expert (0.2) — folds into the unit-sourced handler rewrite | COORDINATE (must land in NEW handler, not old scanRepo one) |

The server hook is a 1-line addition BUT must go in the expert's rewritten unit-sourced
/api/trace handler (Phase 2), NOT the current scanRepo-based one. Until then, the pin
auto-derives via the CLI `focus` verb (planner calls it when WIP switches).

## Per-agent realtime hop update (Tron directive 2026-06-14)

Each agent updates THEIR hop's status as they work — the pin reflects who is
working which hop in realtime.

### CLI verb

```bash
# Architect starts working on UseCase
npx tsx scripts/planner-drive.ts hop uc in-progress architect

# Expert finishes Implementation
npx tsx scripts/planner-drive.ts hop impl done expert

# Tester marks test gate-proven (after det-3x + deploy green)
npx tsx scripts/planner-drive.ts hop test gate-proven tester
```

### Role → hop ownership

| Hop | Owner | When they call |
|---|---|---|
| req | req-eng | after capture |
| uc | architect | designing UC |
| class | architect | wiring class |
| method | expert | coding the method |
| impl | expert | marker placed + wireImplNode |
| test | tester | test written + det-3x proven |

### Pin reads per-hop state

`getActiveChain()` now returns `hopState` per hop:

```json
{ "type": "impl", "uuid": "...", "status": "active",
  "hopState": { "status": "in-progress", "owner": "expert", "updatedAt": "..." } }
```

## Task-switch gate (WIP=1 = proven-or-stay)

`setFocus(<new-task>)` is BLOCKED unless:
- The current task's test hop has status `gate-proven`, OR
- No current task is focused (first task), OR
- `--force` flag (escape hatch — logged, visible)

**Gate-proven** means the tester has called:
```bash
npx tsx scripts/planner-drive.ts hop test gate-proven tester
```
...which they do ONLY after det-3x + deploy verification pass.

### Enforcement flow

```
planner: focus <new-task>
  → CurrentSprint.setFocus checks isGateProven()
  → test.status !== 'gate-proven' → BLOCKED
  → "BLOCKED: current task test hop not gate-proven. Use --force to override."

tester: hop test gate-proven tester
  → hopStates.test = {status:'gate-proven', owner:'tester', ...}

planner: focus <new-task>
  → isGateProven() = true → ALLOWED → task switches
```

### --force (escape hatch)
`npx tsx scripts/planner-drive.ts focus <task> --force` bypasses the gate.
Use for: hotfix override, Tron-directed task switch. The force is logged
(persist shows no gate-proven on prior task — auditable).

## Laws enforced (team-laws.md)
- **L1** DATA ON DISK: all endpoints read disk per-request; units = truth, no in-memory cache
- **L2** MARKDOWN IS VIEW: chain = scenario units, not task .md files
- **L4** COMMUNICATE VIA UNITS: chain authored as units, singleton persisted on disk
- **L6** GATE VISIBLE GOAL: Step 6 verifies on /trace (user-visible), not just count
- **L8** WIP=TRON PRIORITY: autoFollow tracks the focused task Tron directed
- **L9** PROVEN-OR-STAY: setFocus blocked until test=gate-proven; per-agent hop self-mark
- **L10** SINGLE OWNER: coordination matrix assigns each hop to one role
