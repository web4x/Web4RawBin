### R18.21: "Parent" link ABOVE the "Scenario view" link in the detail pane navigates to the ownerIor parent instance.

<details><summary>Tron directive</summary>

> ## LITERAL SOURCE — Follow-on C: Detail-view full-methods + Parent/Browse-File links (2026-06-05)
> 
> > TRON: "on this picture we see the beautiful traceability. BUT on the details view, i want to see ALL methods, not just the traced one. the same on the ScenarioView. for all types. above the scenario view link i want a 'Parent' link. and below it i want to see a Browse File Link, that jumps to the corresponding file in the Browser. there i can open it in the monacco editor. add line information to the link, so that eg on a method or usecase the monacco editor can open at the correct line"
> 
> ### Decomposition hints (req: confirm against literal)
> - R18.10 [→ R18.21]: "Parent" link ABOVE the "Scenario view" link in the detail pane → navigates to the ownerIor parent instance.
> 
> Note: Source decomposition draft used the preliminary label "R18.10" which collides with the already-numbered R18.10 (lazy-load) at line 141. The gap-filler renumbered this to R18.21.
> 
> **Acceptance criteria :**
> - [ ] Detail pane shows a "Parent" link
> - [ ] Parent link is positioned ABOVE the "Scenario view" link
> - [ ] Parent link target = ownerIor parent instance of the current object
> - [ ] Clicking navigates to the parent's detail view

</details>