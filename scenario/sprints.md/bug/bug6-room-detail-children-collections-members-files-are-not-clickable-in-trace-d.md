### BUG6: Room detail children collections (Members, Files) are not clickable in /trace drawer.

<details><summary>Tron directive</summary>

> BUG (v0.6.10 /trace drawer): the room detail drawer shows Children (collection Members, collection Files) but these collection rows are NOT clickable. They MUST be clickable → clicking navigates to that collection's detail view in the drawer (tree-navigation within the detail drawer). Part of the same broken in-drawer navigation as BUG5 — renderDetailForRef was never wired to child-click events in the detail view.

</details>