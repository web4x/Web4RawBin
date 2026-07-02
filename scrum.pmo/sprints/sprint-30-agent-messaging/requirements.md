[Back to Planning](./planning.md)

# Sprint 30 — Agent Messaging (Async Mailbox) — Requirements

**Source:** Tron-AUTHORIZED sprint (first under the R29.4 governance rule). From skill-expert design 4546a59d9, relayed via robbin-po 2026-07-02.
**Theme:** agent-to-agent messaging as first-class scenario units + an async mailbox — the STRUCTURAL fix for keystroke-injection / sent-!=-delivered.
> **GENERATED-FROM-SCENARIO-UNITS view** — source of truth is the scenario units. Do not hand-edit.

---

## Requirements

- [ ] **R30.1 — First-class AgentMessage scenario unit (peer to Task/Req/UC)**
  [requirement:uuid:51b87013-45a2-417b-9d5f-6e8242559c03]
  > TRON via skill-expert (4546a59d9): AgentMessage becomes a first-class unit type, a peer to Task/Req/UC.
  A NEW first-class ior:class:AgentMessage scenario unit type, peer to Task/Requirement/UseCase. An AgentMessage is a committed unit on disk holding from (sender agent+pane), to (recipient), subject/body, threadId, timestamp, and status (unread/read) - durable + auditable (wer schreibt der bleibt). It is registered in templates.ts + tagMap so it renders/resolves like other unit types.
  **Acceptance criteria:**
  - [ ] **(type)** A NEW first-class ior:class:AgentMessage scenario unit type exists, peer to Task/Requirement/UseCase.
  - [ ] **(type)** An AgentMessage holds: from (sender agent + pane), to (recipient agent), subject/body, threadId, timestamp, status (unread/read), and an optional ref to a related Task/Requirement.
  - [ ] **(type)** A message is a COMMITTED scenario unit on disk (durable + auditable) - not an ephemeral keystroke; wer schreibt der bleibt.
  - [ ] **(type)** The AgentMessage type is registered in templates.ts (AgentMessageTemplate) + the tagMap so it renders + resolves (a new scenario type without its template + tagMap will not render/resolve - the R29.3 lesson).
  → [UC30.1: agentMessage.unitType](./planning.md#uc30-1) `[uc:uuid:2a150baf-9a0c-4745-85c6-021053ad0d8b]`

- [ ] **R30.2 — Async mailbox: send writes+commits a unit; recipient pulls at turn boundary (no keystroke injection)**
  [requirement:uuid:71f34bf9-46eb-44ef-82c8-84ed26a7b1e4]
  > TRON via skill-expert (4546a59d9): ASYNC MAILBOX - send = write+commit unit only; recipient PULLS at turn boundary; NO keystroke injection = the STRUCTURAL interrupt fix.
  The STRUCTURAL interrupt fix. Sending a message = WRITE + COMMIT the AgentMessage unit ONLY - NO keystroke injection into the recipient's pane/input. The recipient PULLS its inbox at a TURN BOUNDARY (reads unread AgentMessage units addressed to it), never mid-turn. The sender never interrupts the recipient's running turn; delivery is decoupled from the recipient's execution state. This structurally ends the sent-!=-delivered / keystroke-into-busy-pane failure (messages queued in an agent's input buffer, Enter never submitted).
  **Acceptance criteria:**
  - [ ] **(mailbox)** Sending a message = write + commit the AgentMessage unit ONLY; NO keystroke injection into the recipient's pane or input buffer.
  - [ ] **(mailbox)** The recipient PULLS its inbox at a TURN BOUNDARY (reads unread AgentMessage units addressed to it), not mid-turn.
  - [ ] **(mailbox)** The sender never interrupts the recipient's running turn; delivery is decoupled from the recipient's execution state (structural fix for keystroke-into-busy-pane = the sent-!=-delivered problem).
  - [ ] **(mailbox)** Messages persist (committed) until pulled + read; no message is lost to a busy input buffer or an un-submitted Enter.
  - [ ] **(verify)** Verified: a message sent while the recipient is mid-turn is NOT injected; it is committed and read on the recipient's next turn-boundary pull, intact.
  → [UC30.2: mailbox.sendAndPull](./planning.md#uc30-2) `[uc:uuid:3a74e3b2-6c60-4dea-be72-6a3850dcbec8]`

- [ ] **R30.3 — No live prompt/keystroke injection between agents**
  [requirement:uuid:1aeac13e-d073-46f2-8c29-2590a7f6d072]
  > TRON via skill-expert (4546a59d9): no-live-prompt-injection.
  No agent writes to another agent's stdin / prompt / keystroke buffer to communicate; ALL agent-to-agent communication goes via AgentMessage units + the mailbox pull. A by-construction guard flags any tmux send-keys / stdin-write to a peer agent pane used for messaging (only the mailbox is the sanctioned path). This makes live-prompt-injection - the source of this session's sent-!=-delivered + capture-pane-verify workarounds - impossible.
  **Acceptance criteria:**
  - [ ] **(guard)** No agent writes to another agent's stdin / prompt / keystroke buffer to communicate; all agent-to-agent comms go via AgentMessage units + the mailbox pull.
  - [ ] **(guard)** A by-construction guard (lint/audit) flags any tmux send-keys / stdin-write to a peer AGENT pane used for messaging - only the mailbox is the sanctioned path (agent panes, not the interactive server TUI which is R29.1).
  - [ ] **(verify)** A message delivered while the recipient is mid-turn is NOT injected into its prompt; it waits for the pull. No keystroke-into-busy-pane path remains for agent messaging.
  → [UC30.3: mailbox.noLiveInjection](./planning.md#uc30-3) `[uc:uuid:2fbd9ff5-b54b-4d1c-b8ff-4e34f85ac249]`

- [ ] **R30.4 — Task.messages[] link + agentMessage skill verbs (send/inbox/read/list/thread)**
  [requirement:uuid:8f65a0b4-0d22-453b-bf60-0490736d8e8f]
  > TRON via skill-expert (4546a59d9): Task.messages[] + skill verbs (send/inbox/read/list/thread).
  Task units gain a messages[] field linking related AgentMessage units (a message thread on a task). An agentMessage skill exposes the verbs send / inbox / read / list / thread: send writes+commits a message; inbox lists unread to me; read marks read; list shows a mailbox; thread shows a conversation by threadId. The mailbox skill is the canonical agent-comms path (replaces otmux send-keys for messaging).
  **Acceptance criteria:**
  - [ ] **(integration)** Task units gain a messages[] field linking related AgentMessage units (thread the conversation on a task).
  - [ ] **(integration)** An agentMessage skill exposes verbs: send / inbox / read / list / thread (Object.verb per OOSH), each an addressable use case.
  - [ ] **(integration)** Messages thread by threadId; the thread verb shows the full conversation in order.
  - [ ] **(integration)** The mailbox skill is the canonical agent-comms path - replaces otmux send-keys / keystroke messaging for agent-to-agent communication.
  → [UC30.4: agentMessage.skillVerbs](./planning.md#uc30-4) `[uc:uuid:d90db09d-0b3f-4c89-951e-d467ceb36174]`

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC UUID |
|-----|------|------------------|---------|
| R30.1 | First-class AgentMessage scenario unit (peer | 51b87013-45a2-417b-9d5f-6e8242559c03 | 2a150baf-9a0c-4745-85c6-021053ad0d8b |
| R30.2 | Async mailbox: send writes+commits a unit; r | 71f34bf9-46eb-44ef-82c8-84ed26a7b1e4 | 3a74e3b2-6c60-4dea-be72-6a3850dcbec8 |
| R30.3 | No live prompt/keystroke injection between a | 1aeac13e-d073-46f2-8c29-2590a7f6d072 | 2fbd9ff5-b54b-4d1c-b8ff-4e34f85ac249 |
| R30.4 | Task.messages[] link + agentMessage skill ve | 8f65a0b4-0d22-453b-bf60-0490736d8e8f | d90db09d-0b3f-4c89-951e-d467ceb36174 |

*Captured by robbin-req 2026-07-02. Tron-authorized S30 (R29.4 tronAuthorization record set). Structural fix for agent messaging.*
