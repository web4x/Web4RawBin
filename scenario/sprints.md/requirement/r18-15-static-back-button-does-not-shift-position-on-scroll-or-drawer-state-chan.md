### R18.15: Static back button does not shift position on scroll or drawer state change.

<details><summary>Tron directive</summary>

> > TRON (2): "the static back button moves up"
> 
> The back button (← in the header/toolbar) moves vertically ("moves up") when the drawer opens/closes or when the user scrolls. It must stay fixed in its position — anchored to the top of the viewport or the header bar, unaffected by drawer transitions or scroll events.
> 
> **Acceptance criteria:**
> - [ ] Back button position is visually stable — does not shift on drawer open/close
> - [ ] Back button position does not shift on scroll
> - [ ] Back button remains accessible (tappable) at all times

</details>