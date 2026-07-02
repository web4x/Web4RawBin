# Class-Unit Duplication Audit (data-quality)

**By:** robbin-req 2026-07-01, per PO directive (architect flagged 4x RbTaskDetail). Measured across scenario/index.

**Summary:** 163 Class units for 108 distinct code classes. 23 code classes have >1 Class unit = **55 duplicate Class units collapsible** (163 -> 108).

Class-per-req sprawl: prior chains minted a NEW Class unit per requirement instead of REUSING the existing Class node for that code class. The chain fans out through N duplicate Class nodes -> over-count + broken single-source. R27.2 is the by-construction invariant (reuse existing Class node); this list is the cleanup target (collapse each to 1 canonical, repoint methods, rewrite UC.class refs).

| Code class | # units | methods per unit | uuids |
|-----------|---------|------------------|-------|
| IORResolver | 5 | [1, 3, 3, 3, 3] | 4dfd37fd 4faa8312 a7168b31 b4eaa489 fdc768a6 |
| RbDetailDrawer | 5 | [10, 14, 3, 2, 1] | 0dd08b2f 0e293e59 56a12f75 7af8178b d86af73d |
| ClassRegistry | 4 | [2, 2, 2, 2] | 40475f3e 60a20d33 9184bb2c fc39af25 |
| RbDetailView | 4 | [1, 8, 2, 1] | 1420a915 2eeda38d a27784f0 f2f84ce3 |
| RbObjectItem | 4 | [16, 7, 2, 5] | 311ff74e 3bc876b5 43fd2e62 fd49f5e1 |
| RbRequirementDetail | 4 | [1, 1, 1, 2] | 019ad715 23c155e7 5d9132cf bba9766e |
| RbTaskDetail | 4 | [1, 3, 1, 1] | 4df19279 d038f521 df8d2680 f09de66b |
| RbUseCaseDetail | 4 | [1, 1, 1, 1] | 15d9a535 84a94745 9f808797 cd70a713 |
| ScenarioIndex | 4 | [3, 3, 4, 3] | 13dc3fc7 c8bdae18 cf30d52c f9a3f8d1 |
| ScenarioUnit | 4 | [4, 1, 5, 1] | 179310af 21b6dbeb 88dcce3a e48d798c |
| SpeakingTree | 4 | [2, 2, 2, 2] | 015b1ac0 6db16a5b a4f056d2 c8060ced |
| TraceConsistency | 4 | [2, 1, 3, 3] | 875af60f 89285695 f5cf7284 fbd7573d |
| ViewTemplateRegistry | 4 | [3, 4, 3, 3] | 6a4207e4 6fdc9ac6 9adde1d9 a150ff77 |
| DropDispatcher | 3 | [1, 5, 1] | 3854affc 3fca4816 c743ff39 |
| FileBrowser | 3 | [1, 1, 1] | 0cb4be1b 609204de e4c9c03c |
| Room | 3 | [16, 1, 4] | 1165c293 2172dc56 2bf13995 |
| TraceGraph | 3 | [1, 1, 8] | 10de8452 809e65ee b9589ec2 |
| ContentPreviewer | 2 | [1, 1] | 4cf1d1de 828e5328 |
| MdPreview | 2 | [1, 1] | 4f11ade5 77f2c618 |
| MigrateToScenario | 2 | [1, 1] | 66625aa7 728b821f |
| RbFileDetail | 2 | [3, 1] | 37103cf0 4e678ce3 |
| RbTraceTree | 2 | [3, 3] | 5a057914 d72bf09a |
| Requirement | 2 | [3, 3] | 14831116 5ba78db7 |

**Recommended canonical per class:** keep the unit with the MOST methods (or the one already on the active chain), repoint all other methods + rewrite every UC.class ref to it, delete the emptied duplicates. Same remap shape as the federation reference-rewrite (R26.5) / company mint-new-on-conflict.
