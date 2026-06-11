### R19.40: Room holds lastMessageIor; chat lazy-loads 5 messages at a time walking prevMessage.

<details><summary>Tron directive</summary>

> The Room scenario unit MUST hold a model.lastMessageIor field pointing to the most recent Message unit. The chat UI loads the last 5 messages on open (starting from lastMessageIor, walking prevMessage IORs backward). When the user scrolls up and reaches the oldest-loaded message, the UI lazy-loads the next 5 older messages (continuing to walk prevMessage). This is backward-pagination using the R19.38 doubly-linked list — no separate index or query needed, just IOR traversal.

</details>

## Traceability

**Tasks:**
- [🔗 T-chat-lazy-load: Room holds lastMessageIor; chat lazy-loads 5 messages from scenario index](../task/chat-lazy-load-lastmessageior-scenario-index.md)

**UseCases:**
- [🔗 chat.lazyLoad](../usecase/chat-lazyload.md)
