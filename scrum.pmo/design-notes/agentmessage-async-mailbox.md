# AgentMessage — Async Mailbox (design input, Sprint 30, Tron-authorized)

**Author:** robbin-architect · 2026-07-02. **Design INPUT (scenario-first #126): holds for req's R30.1-4 mint; I refine + wire then.** Separate track, parallel to S28. (Sprint 30 is Tron-authorized — it's the first live case of the R29.4 governance guard.)

## Why: replace keystroke-injection with a durable mailbox
Current inter-agent comms = otmux keystroke-send into a pane. Measured failure mode (I hit it repeatedly): when the target claude pane is mid-response, the send STAGES ("staged-not-submitted / UNVERIFIED") — fragile, order-uncertain, lost-looking. **AgentMessage makes a message a first-class SCENARIO UNIT in the graph, not a TTY injection** — the recipient reads its mailbox when ready (async), delivery is durable + auditable + threaded. No keystrokes, no busy-pane races.

## Schema: `ior:class:AgentMessage` (peer to Task/Req/UC)
```
ior:class:AgentMessage
model: {
  uuid,
  from:    <agentId>,          // sender agent (role/pane id or an Agent unit ref)
  to:      <agentId | role>,   // recipient (direct or a role mailbox)
  subject: string,
  body:    string,
  at:      string,             // ISO timestamp (stamped)
  re?:     <Task|Req|UC ior>,  // what it's ABOUT — links the message to the work unit (cross-ref)
  replyTo?:<AgentMessage ior>, // threading (back-edge to the parent message)
  status:  'unread'|'read'|'acked',
}
ownerIor: <the Task it hangs off, or the recipient's mailbox root>
```
A recipient's **mailbox** = query AgentMessages where `to == me && status==unread` — pull when ready.

## Wiring: `Task.messages[]`
A Task carries its message thread: `Task.model.messages[] = [AgentMessage ior, ...]`. So work-scoped discussion lives on the Task (the nav unit), keeping the chain (Req→UC→…→Test) clean — messages are ABOUT the work, not part of the derivation.

## R27.5 ref-slot registry — AgentMessage is a NEW IOR-bearing slot type (the PO's "forward-only-walk key")
Add to `REF_SLOTS` (per R27.5 Axis-1):
- **Task:** `+ messages` — tag **↔ cross / ◇ mailbox-tier**, NOT ▸forward. A message is not part of chain reachability (a Task→message edge must NOT pull messages into the Req→Test walk) — so it's scanned for dangling but NOT traversed for the forward reachability key. This is the "forward-only-walk key" point: `messages[]` is deliberately EXCLUDED from the forward walk (like the data-tier ◇ edges), else the mailbox pollutes chain-reachability.
- **AgentMessage:** `to`/`from` = identity refs (agent ids — likely EXCLUDE as tokens if they're role-strings, or ref an Agent unit if one exists — classify by resolution, per the uuid-shaped≠graph-edge rule); `re` = ↔cross (to the Task/Req/UC); `replyTo` = ◂back (thread parent); `@ownerIor` = ◂back.
- Node-well-formedness (Axis-2) + one-per... N/A (messages are many). Mailbox-tier is its own reachability domain (seed = agent roots, like Sprint roots for the nav tier).

## Traceability (when req mints R30.1-4)
Likely: R30.1 AgentMessage schema/unit-type (+ templates.ts ServerTemplate-style registration + tagMap — new type needs plumbing, same flag as R29.3), R30.2 Task.messages[] wiring, R30.3 mailbox read/send (the async API, no keystroke), R30.4 REF_SLOTS integration. I'll refine the UCs + wire Class `AgentMailbox` (send/read/ack methods) → design-ahead → Test, when the units land. New-type registration is a hard AC (else AgentMessage won't render/resolve).
