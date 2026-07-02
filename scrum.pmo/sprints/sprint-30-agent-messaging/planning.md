# Sprint 30 — Agent Messaging (Async Mailbox) — Planning

**Requirements:** [requirements.md](./requirements.md). **Source:** Tron-authorized (R29.4), skill-expert design 4546a59d9.

## Sprint Goal

Make agent-to-agent messaging first-class + ASYNC: a message is a committed AgentMessage unit; the recipient PULLS at a turn boundary; NO keystroke injection. Structurally ends the sent-!=-delivered / keystroke-into-busy-pane failure.

## Use Cases

| Anchor | UseCase | UC UUID | Covers | Class |
|--------|---------|---------|--------|-------|
| <a id="uc30-1"></a>UC30.1 | agentMessage.unitType | 2a150baf-9a0c-4745-85c6-021053ad0d8b | R30.1 | AgentMessage |
| <a id="uc30-2"></a>UC30.2 | mailbox.sendAndPull | 3a74e3b2-6c60-4dea-be72-6a3850dcbec8 | R30.2 | AgentMailbox |
| <a id="uc30-3"></a>UC30.3 | mailbox.noLiveInjection | 2fbd9ff5-b54b-4d1c-b8ff-4e34f85ac249 | R30.3 | AgentMailbox |
| <a id="uc30-4"></a>UC30.4 | agentMessage.skillVerbs | d90db09d-0b3f-4c89-951e-d467ceb36174 | R30.4 | AgentMessage |

## Definition of Done

- AgentMessage is a first-class registered unit type; send commits a unit (no injection); recipient pulls at turn boundary; no live-prompt-injection path remains; Task.messages[] + skill verbs (send/inbox/read/list/thread) work; the mailbox replaces keystroke messaging.

---

*Planned by robbin-req 2026-07-02. Sprint 30 — Agent Messaging.*
