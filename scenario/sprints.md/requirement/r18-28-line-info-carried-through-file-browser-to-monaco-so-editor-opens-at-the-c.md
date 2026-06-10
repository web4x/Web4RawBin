### R18.28: Line info carried through file-browser to Monaco so editor opens at the correct line. (inferred from literal)

<details><summary>Tron directive</summary>

> > TRON: "here you see impl has a src link, but ALL types should have it. it should NOT open directly in the monaco editor, BUT in the browser folder (2nd picture), with the file highlighted. then i can open the editor. the link shall already hold the line of the method if its a method and jump to the method in the edior. same for use case and puml file."
> 
> ### Decomposition hints (req: confirm against literal)
> - R18.15: The link CARRIES the line so the line survives browser→editor: when the user opens the file in the editor, it jumps to the correct line — a Method jumps to the method's line; a UseCase jumps to its line in the .puml file. (Revises R18.11/R18.12: target = browser-with-highlight, line preserved through to editor.)
> 
> **REVISES R18.23.** The line parameter (`?line=42`) is on the file-browser link AND survives through to the Monaco editor. When the user opens a file from the browser listing, the editor receives the line and scrolls to it. Method → method declaration line. UseCase → its line in the .puml file.
> 
> **Acceptance criteria:**
> - [ ] File-browser link includes line parameter
> - [ ] Opening the file in Monaco from the browser preserves the line parameter
> - [ ] Monaco scrolls to the specified line
> - [ ] Method opens at function declaration line
> - [ ] UseCase opens at PUML declaration line

</details>