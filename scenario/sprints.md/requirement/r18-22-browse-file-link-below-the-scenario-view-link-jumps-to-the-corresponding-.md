### R18.22: "Browse File" link BELOW the "Scenario view" link jumps to the corresponding file in the FILE BROWSER.

<details><summary>Tron directive</summary>

> ## LITERAL SOURCE — Follow-on C: Detail-view full-methods + Parent/Browse-File links (2026-06-05)
> 
> > TRON: "on this picture we see the beautiful traceability. BUT on the details view, i want to see ALL methods, not just the traced one. the same on the ScenarioView. for all types. above the scenario view link i want a 'Parent' link. and below it i want to see a Browse File Link, that jumps to the corresponding file in the Browser. there i can open it in the monacco editor. add line information to the link, so that eg on a method or usecase the monacco editor can open at the correct line"
> 
> ### Decomposition hints (req: confirm against literal)
> - R18.11 [→ R18.22]: "Browse File" link BELOW the "Scenario view" link → jumps to the corresponding file in the FILE BROWSER (where it can be opened in the Monaco editor).
> 
> Note: Source decomposition draft used the preliminary label "R18.11" which collides with the already-numbered R18.11 (ancestor-path-precise cycle guard) at line 163. The gap-filler renumbered this to R18.22. See also R18.14 (Follow-on D, line 336) which REVISES this: target = browser-with-highlight, NOT Monaco direct.
> 
> **Acceptance criteria :**
> - [ ] Detail pane shows a "Browse File" link
> - [ ] Browse File link is positioned BELOW the "Scenario view" link
> - [ ] Browse File link target = file-browser folder view (/md/<dir>/) with the file highlighted (per R18.14 revision)
> - [ ] User opens Monaco editor from the file browser (not directly)

</details>

## Traceability

**UseCases:**
- [🔗 detailView.browseFile](../usecase/detailview-browsefile.md)
