### R18.26: Source link on ALL types — not just Implementation. (inferred from literal)

<details><summary>Tron directive</summary>

> > TRON: "here you see impl has a src link, but ALL types should have it. it should NOT open directly in the monaco editor, BUT in the browser folder (2nd picture), with the file highlighted. then i can open the editor. the link shall already hold the line of the method if its a method and jump to the method in the edior. same for use case and puml file."
> 
> ### Decomposition hints (req: confirm against literal)
> - R18.13: SOURCE LINK ON ALL TYPES — currently only Implementation shows the src link; EVERY type must have one linking to its source artifact: UseCase → its .puml file; Class/Method/Implementation → its .ts source; Test → its test file; Requirement/Task → its .md (or scenario). Not just Impl.
> 
> Every scenario type must show a source link in its detail view: UseCase → its `.puml` file; Class/Method/Implementation → its `.ts` source; Test → its test file; Requirement/Task → its `.md` or scenario source. Currently only Implementation shows the link.
> 
> **Acceptance criteria:**
> - [ ] UseCase detail shows source link to .puml file
> - [ ] Class detail shows source link to .ts file
> - [ ] Method detail shows source link to .ts file
> - [ ] Test detail shows source link to test .ts file
> - [ ] Requirement detail shows source link to .md file
> - [ ] Task detail shows source link to .md file

</details>

## Traceability

**UseCases:**
- [🔗 detailView.sourceLink](../usecase/detailview-sourcelink.md)
