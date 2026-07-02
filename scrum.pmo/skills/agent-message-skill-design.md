# AgentMessage Skill — Design Proposal (skill-expert contribution)
*Authored by robbin-skill-expert, 2026-07-02, per Tron directive. SCENARIO-FIRST (#126): this doc is the design input for req+architect+planner to mint the scenario units BEFORE any code. Nothing ships until the chain exists.*

## The vision (Tron)
Every inter-agent message (today: raw `otmux send robbinTeam2:0.0 "..."`) becomes a **first-class scenario unit** — `AgentMessage` — minted by a skill layered on top of `otmux send`, and **referenced by the task it is about**. tmux becomes only the *transport*; the AgentMessage scenario unit is the durable, traceable *record*. Wer schreibt, der bleibt: team comms survive the rewind and hang off their task.

## (1) New scenario type: `ior:class:AgentMessage`
Sits alongside Requirement/UseCase/Class/Method/Implementation/Test/Task/Sprint as a peer scenario unit.
```json
{
  "ior": "ior:class:AgentMessage",
  "model": {
    "uuid": "<uuidgen-fresh 36-char>",
    "from": "robbin-skill-expert",          // sending agent (role name)
    "to": "robbin-po",                       // recipient agent (role name)
    "toPane": "robbinTeam2:0.0",             // otmux transport target (delivery only)
    "task": "ior:instance:<taskUuid>",       // THE task this message is about (the anchor)
    "kind": "report|question|directive|ack|verdict",
    "body": "<the message text>",
    "sentAt": "<ISO timestamp, passed in — no Date.now in tooling>",
    "inReplyTo": "ior:instance:<msgUuid>"    // optional thread link (prior message)
  },
  "ownerIor": "ior:instance:<taskUuid>"      // owned BY the task → task is the container
}
```
- **Task ↔ message linkage**: `AgentMessage.task` (back-ref) + `Task.messages[]` (forward-ref list, mirrors how Task.useCases[]/coveredRequirements[] work). Both, so the chain walks either direction (the traceability standard's forward-only walk gets `Task.messages[] → AgentMessage`).
- **Loader**: `AgentMessageLoader` in classes.ts, same factory pattern as TaskLoader/RequirementLoader (adding it bumps ClassRegistry count — update the `toBe(N)` test).
- Shard path: normal uuid-sharded `scenario/index/<h0>/<h1>/../<uuid>.scenario.json`.

## ★ THE INTERRUPTION PROBLEM (Tron caught this — corrects my first draft)
The CURRENT transport — raw `otmux send <pane> "..." Enter` / `tmux send-keys` — INJECTS text+Enter
into the recipient agent's LIVE prompt. If that agent is mid-generation, the Enter SUBMITS input and
INTERRUPTS its turn (this is the source of the `[Request interrupted by user]` events — agents
interrupt each other, including me). My first draft ended `send` with `otmux send ... Enter` → it
would KEEP interrupting. WRONG. The point of first-class AgentMessage units is an ASYNC MAILBOX:
- `send` writes the AgentMessage unit to the recipient's INBOX (scenario unit) + commits it. It does
  NOT inject keystrokes into their active turn. Delivery = the durable unit on disk, full stop.
- The recipient PULLS via `agentMessage.inbox <me>` at THEIR turn boundary (post-turn / on wake /
  per-loop), reads, marks read. No mid-turn interruption — ever.
- OPTIONAL notify: a NON-submitting signal only (e.g. a status-line/file poke, or send WITHOUT Enter
  so nothing is submitted) — never text+Enter into a live prompt. Default = no notify; pull-based.
- The git-committed unit IS the delivery guarantee (survives rewind); tmux keystroke-injection is
  RETIRED for task-comms. This turns sync-interrupt into async-mailbox — the real fix Tron is after.
This becomes a hard REQUIREMENT (R.2a): agentMessage.send MUST NOT submit input to a recipient's
live prompt. Lint-flag any raw `otmux send <team>:* ... Enter` in agent output.

## (2) The skill (OOSH external, on top of `otmux send`)
`agentMessage` — Object.verb, thin dispatch to a TS `AgentMessage` class (like `taskChain` → Chain).
| verb | signature | does |
|------|-----------|------|
| `agentMessage.send` | `<taskUuid> <to> <kind> <body>` | (a) mint AgentMessage unit (fresh uuid, from=me, to, task, kind, body, sentAt, read=false); (b) wire `Task.messages[]` += msg; (c) `git add`+commit (explicit-path). **That is the whole delivery — NO keystroke injection into the recipient's live prompt.** The recipient pulls at their own turn boundary. (Optional non-submitting notify only; never text+Enter.) |
| `agentMessage.read` | `<msgUuid>` | mark a message read (recipient, after consuming) |
| `agentMessage.list` | `<taskUuid>` | list all AgentMessages for a task (the thread), sorted by sentAt |
| `agentMessage.thread` | `<taskUuid>` | render the conversation (from→to, kind, body) as markdown |
| `agentMessage.inbox` | `<agentRole>` | all messages TO an agent across tasks (their queue) |
| `agentMessage.complete` | `<verb> <param>` | Tab-completion (c2 contract) |

- `from` auto-derived from the running agent's identity (hiveMind role / pane), not typed.
- **DRY / self-documenting**: the method signature comment IS the doc + completion source (OOSH first-principles).
- **Anti-pattern guard**: NO raw `otmux send` for task-comms once adopted — the skill is the only sanctioned path; a lint can flag raw `otmux send robbinTeam*` in agent output (like the traceability gate).

## (3) Scenario-first plan (#126 — mint BEFORE code)
Proposed sprint (PO owns the boundary): **"Sprint N — Agent Message Traceability"**.
- **R.1** AgentMessage is a first-class scenario type (loader + schema).
- **R.2** `agentMessage.send` mints the unit + wires Task.messages[] + commits + delivers via otmux.
- **R.3** Tasks reference their messages; `list`/`thread` render the task's conversation.
- **R.4** Team adoption: all task-comms go through the skill; raw `otmux send` for task-comms is lint-flagged.
- Each R → UC → Class(AgentMessage) → Method(send/list/thread/inbox) → Impl → Test, wired in the SAME commit as code (traceability-first, no backfill).

## Coordination asks (for when PO is free — SM to ping)
- **req (0.4)**: formalize R.1-R.4 with ACs + UUID traceability + PlantUML use cases.
- **architect (0.3)**: AgentMessage schema + Task.messages[] wiring shape + where the skill's Class lives; forward-only walk impact (Task→AgentMessage as a new forward key).
- **planner (0.6)**: task units + the sprint; drive the WIP=1 chain.
- **oosh-expert (ooshTeam)**: OOSH external-script correctness (dispatch `.start`, per-method completion, ~/oosh/external symlink) — same review as taskChain.
- **me (skill-expert)**: own the AgentMessage TS class + skill authoring + the chain lint-gate.

## Doctrine fit
This IS the doctrine made structural: THE WORD (the measurement/message) currently decays on the broken tmux channel; making each message a committed AgentMessage unit gives it the redundancy to survive the rewind, anchored to the task it serves. Bootstrapping caveat: the messages *planning this skill* still go via tmux (the skill doesn't exist yet) — we switch to `agentMessage.send` the moment R.2 ships.
