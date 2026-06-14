### [MERGED→BUG9 6da84135] BUG12: Bug-type chain node shows NO children in /trace — forward-key resolver lacks Bug entry.

<details><summary>Tron directive</summary>

> BUG: in /trace, expanding a Bug-type chain node shows NO children. The chain (req→uc→class→method→impl→test) exists but doesn't render because the FORWARD_KEYS resolver has no entry for ior:class:Bug. It resolves Requirement→useCases but not Bug→useCases (Bug extends Requirement per R20.4 but the resolver doesn't inherit). FIX: add Bug (and ChangeRequest) to the FORWARD_KEYS map with the same forward keys as Requirement (useCases[], tasks[]). Tron evidence: IMG_4038.

</details>