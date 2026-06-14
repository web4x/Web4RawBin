### R20.4: Bug and ChangeRequest are OOP extensions of Requirement with own icons.

<details><summary>Tron directive</summary>

> Bug and ChangeRequest become OOP EXTENSIONS (subclasses) of Requirement: ior:class:Bug extends ior:class:Requirement, ior:class:ChangeRequest extends ior:class:Requirement. They trace through the SAME 6-step chain as requirements (Req→UC→Class→Method→Impl→Test) but are distinctly typed. Each is a standard scenario unit in the index with its OWN ICON in rb-object-item (distinct from the Requirement icon). This enables tracing bug-fix chains and change-request chains with full traceability, using the existing Requirement infrastructure.

</details>

## Traceability

**Tasks:**
- [🔗 T-bug-changerequest-oop-extensions: Bug + ChangeRequest as Requirement subclasses with own icons](../task/bug-changerequest-requirement-subclasses-icons.md)
