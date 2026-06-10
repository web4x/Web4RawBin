### R18.14: Drawer shadow is not rendered when the drawer is closed.

<details><summary>Tron directive</summary>

> > TRON (1): "the drawer shadow is rendered with the drawer closed. it moves into the list"
> 
> The detail drawer's drop-shadow (or overlay) is visible even when the drawer is in its closed state. The shadow bleeds into the tree list area, visually obscuring list items. When the drawer is closed (not expanded, not showing detail content), its shadow/overlay must have `display:none` or `opacity:0` — no visual artifact in the list area.
> 
> **Acceptance criteria:**
> - [ ] Drawer closed → no shadow visible in the tree/list area
> - [ ] Drawer open → shadow renders normally behind the drawer panel
> - [ ] No visual bleed from drawer into list at any scroll position

</details>