# Gate-invocation null findings (2 gates) — tracked, PO-routed (2026-08-30)

**By:** robbin-expert (measured) → robbin-planner (tracked, R1/gating-canon). **Status:** DISPOSED (PO 2026-08-30) — task **T37.32** (b43278f7, owner=EXPERT, priority below iOS+PhaseA-gate) minting via req R-number. **DO NOT let sit as permanent RED** (a permanent-RED gate = learned-to-ignore = worse than none).

**PO disposition (AC design for T37.32):** (a) fix the spawn invocation; (b) INTERIM **mark-not-silence** — gates STAY in suite + KEEP RUNNING + carry a KNOWN-BROKEN-INVOCATION marker naming T37.32 (RED reads 'gate cannot invoke its tool (tracked: T37.32)', not 'product broken'); NEVER remove/disable (= the check:task-status weakening mistake — status-EXPLAINED never status-HIDDEN); (c) the marker is **COUNTED** — suite emits 'N gates / M known-broken (listed)', can only shrink (else a quiet dumping ground = decay by another name). Interim marking flagged to expert now (suite honesty can't wait for the full fix).

## The finding: "can EXECUTE but cannot INVOKE" — one layer up from the 22 inert gates
The R37.26 22-gate repoint revived coverage; 2 of the revived gates now RUN but return **null on a spawned-tool call**:

- **r241-objectverb-gate:** scoreboard = false(null) + followUp = false (lintMarkers/emitSkills GREEN, deterministic-stable). ★ EVIDENCE the tool is FINE standalone: `objectVerb Chain scoreboard` runs GREEN = 537 reqs full table. So the **GATE INVOCATION** returns null, not the tool.
- **r245-s24-tooling-gate:** T24.4 generate-md = null, T24.5 audit.strict = false.

## Diagnosis (expert)
- **SUSPECTED ROOT:** stale subprocess **cwd / output-parse in the gate SPAWN** — the gate shells out to the tool with an assumption that broke (a cwd, or an output-parse that no longer matches).
- **NOT a repoint regression:** scenario/index reads work; the tool works standalone; 3 sibling gates (r217 / r218 / r218b) revived GREEN.

## Routing
- **Owner = gate-invocation** (expert offered to own the fix if a task is minted).
- **Disposition = PO:** follow-up task? req determines structurally whether it's a new requirement or rides existing gate-integrity scope (same as R37.26/27). Not minted unilaterally (scenario-first, single-minter).

## Cross-ref
R37.26 dead-guard repoint (revived the coverage that surfaced these), gating-canon (fix the DATA/invocation, never weaken the gate to green CI), r217/r218/r218b (revived GREEN siblings).
