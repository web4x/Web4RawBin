### BUG7: Class All-Children shows only 1 method — should show ALL methods + implementations.

<details><summary>Tron directive</summary>

> BUG against R18.16 (Class in chain): Class detail All-Children shows only 1 method (Requirement.classifyType), should show ALL methods[] + all their implementations[]. Traceability Chain from Class should walk method->impl->test downstream for each chain-relevant method. Evidence: Class Requirement (14831116) missing methods+impls. The Class FORWARD_KEYS or /api/trace/children for type=Class does not resolve all children.

</details>