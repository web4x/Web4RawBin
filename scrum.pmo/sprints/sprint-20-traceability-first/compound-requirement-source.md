
## R20.6 Compound: Global SelectionModel + Drawer Consolidation

> TRON: "create a selection model globally for the app. if nothing is selected currently, the default details drawer shows the chat in room. if a item view is clicked in the middle, its the selected item. if its clicked loooong its added to the selection array. the item view get highlighted as selected and active as css. dragging one drags all. long press toggles being in the selection or removed from the selection. this will completely dedup the multiple drawer implementations and consolidate the requirements related. the css highlight on the default drawer is just awkward. remove it as in the chat. keep the x to close the drawer."

### Atomics:
- R20.6a: Global SelectionModel (selection array, app-wide singleton)
- R20.6b: Nothing selected → default drawer shows in-room CHAT
- R20.6c: Tap item middle → single-select (item shown in details drawer)
- R20.6d: Long-press → toggle add/remove from selection array (multi-select)
- R20.6e: Selected items get CSS selected+active highlight
- R20.6f: Drag one selected → drags ALL selected
- R20.6g: Consolidate/dedup multiple drawer implementations into one (chat+details unified via SelectionModel)
- R20.6h: Remove awkward CSS highlight on default drawer (match chat style), keep X close button
