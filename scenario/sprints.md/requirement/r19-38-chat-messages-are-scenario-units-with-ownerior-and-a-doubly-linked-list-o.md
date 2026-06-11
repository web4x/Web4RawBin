### R19.38: Chat messages are scenario units with ownerIor and a doubly-linked list of next/prev message IORs.

<details><summary>Tron directive</summary>

> Each chat Message MUST be a first-class scenario unit (ior:class:Message) with: ownerIor pointing to the sender User unit, model.nextMessage as an IOR to the next message in thread order, model.prevMessage as an IOR to the previous message. This forms a doubly-linked list of messages navigable in both directions. Messages are stored in the scenario index like every other unit — unique uuid, {ior, model, ownerIor} shape, traceable.

</details>

## Traceability

**Tasks:**
- [🔗 T-message-units: ior:class:Message with ownerIor + doubly-linked room references](../task/message-units-ior-class-ownerio-doubly-linked.md)

**UseCases:**
- [🔗 chat.lazyLoad](../usecase/chat-lazyload.md)
- [🔗 message.persistAsUnit](../usecase/message-persistasunit.md)
