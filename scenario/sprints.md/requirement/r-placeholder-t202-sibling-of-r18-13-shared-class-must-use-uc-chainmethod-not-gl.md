### R-placeholder (T202 sibling of R18.13): Shared Class must use UC.chainMethod, not global Class.methods[]

<details><summary>Tron directive</summary>

> PLANNER PLACEHOLDER unit per learning #38 (placeholder-then-canonicalize). req-eng to capture the verbatim Tron quote and finalize as canonical R18.x. Semantic: when a Class is shared by multiple UseCases, the traceability tree expander MUST resolve the visible Method via the active UC.chainMethod, not via the global Class.methods[] fan-out. Sibling of canonical R18.13 (Every chain terminates in Test). Fix scope: /api/trace/children accepts UC chainMethod context; the expander reads UC.method, not global Class.method.

</details>

## Traceability

**Tasks:**
- [🔗 T202: Class.method-per-UC narrowing — shared Class picks wrong method](../task/class-method-per-uc-narrowing-shared-class-wrong-method.md)
