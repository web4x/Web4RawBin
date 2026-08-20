# Orphan-Task Re-home Analysis (R40.51)

robbin-req 2026-08-20, per PO per-bucket ruling. The 99 Tasks claimed by NO Sprint (in zero Sprint.tasks[]) after the R40.49 ownership migration.

**Law: ZERO FABRICATED PARENTS.** An honestly-parked orphan beats a task filed under a guessed parent. Every re-home is chain-provable from the task's OWN links; anything on inference is parked.

**Buckets: (a) EVIDENCED = 18 re-home / (b) VIA-SUCCESSOR = 2 re-home / (P) NAME/SLUG-DECLARED = 1 PENDING PO call / (c) NO-EVIDENCE = 78 parked.** Re-home delta (a+b): 99 -> 79.

## (a) EVIDENCED - re-home (reciprocal both-dir + evidence line on the unit)

| Task | Name | Target | Evidence |
|---|---|---|---|
| 9628370d | T-move-remove-id-to-enroll: relocate red Remove-Lo | S19 (97f513a1) | covers R19.89 (2ad3fd18) -> parent Sprint 19 (97f513a1) |
| 67abd046 | T-item-init-gate: await customElements.whenDefined | S19 (97f513a1) | covers R19.88 (26b5f7c1) -> parent Sprint 19 (97f513a1) |
| 77122058 | T-url-file-opens-drawer: click url-type file item  | S20 (64af2638) | covers R20.1 (c81c9194) -> parent Sprint 20 (64af2638) |
| b0576d79 | T-profile-uuid-restore: restore the user's UUID di | S19 (97f513a1) | covers R19.96 (5c325047) -> parent Sprint 19 (97f513a1) |
| b8da64a1 | T-tree-room-mode: add room data-mode to rb-trace-t | S19 (97f513a1) | covers R19.90 (20fc59cc) -> parent Sprint 19 (97f513a1) |
| b2baea58 | T-seed-tree-members-and-files: /api/trace/children | S19 (97f513a1) | covers R19.101 (4d185684) -> parent Sprint 19 (97f513a1) |
| b476df5f | T-longpress-collapse: icon collapse via 500ms long | S19 (97f513a1) | covers R19.92 (b5688a42) -> parent Sprint 19 (97f513a1) |
| bec78a23 | T-url-preview-restore: url/webitem file click open | S19 (97f513a1) | covers R19.86 (01b055f1) -> parent Sprint 19 (97f513a1) |
| 0189ffbd | T-version-in-header: app header shows version stri | S19 (97f513a1) | covers R19.94 (a5e4fb82) -> parent Sprint 19 (97f513a1) |
| 8cc07506 | T-ios-all-types-open-drawer: on iOS, all file type | S19 (97f513a1) | covers R19.87 (c639acdf) -> parent Sprint 19 (97f513a1) |
| 4aa7e19d | T-seed-ior-room: in-room tree uses data-seed-ior=r | S19 (97f513a1) | covers R19.92a (71a8954e) -> parent Sprint 19 (97f513a1) |
| ccb5e337 | T-reset-pwa-cache-on-main: red Reset PWA Cache but | S19 (97f513a1) | covers R19.95 (c8a480fa) -> parent Sprint 19 (97f513a1) |
| c524c8a0 | T-diff-render: replace innerHTML='' nuke with diff | S19 (97f513a1) | covers R19.88.A (3785b104) -> parent Sprint 19 (97f513a1) |
| aee9e758 | T-object-item-microtask-defer: queueMicrotask in r | S19 (97f513a1) | covers R19.97 (ea6bb854) -> parent Sprint 19 (97f513a1) |
| 51d53769 | T-room-render-inversion: identical files must rend | S19 (97f513a1) | covers R19.100 (ca4f8758) -> parent Sprint 19 (97f513a1) |
| 5da32d29 | T-remove-id-full-wipe: removeLocalIdentity clears  | S19 (97f513a1) | covers R19.91 (4b4b61c1) -> parent Sprint 19 (97f513a1) |
| 5ab2d3b9 | T-file-detail-preview: Preview button in file deta | S19 (97f513a1) | covers R19.93 (36becf02) -> parent Sprint 19 (97f513a1) |
| eff42eff | T-md-safari-broken-link: identify + fix the one br | S19 (97f513a1) | covers R19.99 (aaa36d91) -> parent Sprint 19 (97f513a1) |

## (b) VIA-SUCCESSOR - re-home through the LIVE successor of a DELETED-DUP req

| Task | Name | Target | Evidence (successor chain) |
|---|---|---|---|
| 73297bf1 | T-move-remove-identity: re-home Remove-Local-Ident | S19 (97f513a1) | covers R19.89-DELETED-DUP -> supersededBy R19.89 (2ad3fd18) -> parent Sprint 19 (97f513a1) |
| 3438e110 | T-iframe-pinch: 2-finger pinch scales preview ifra | S19 (97f513a1) | covers R19.85-DELETED-DUP -> supersededBy R19.85 (e29dcae1) -> parent Sprint 19 (97f513a1) |

## (P) NAME/SLUG-DECLARED - PENDING PO CALL (task's own slug names an existing sprint, but NO covered-req chain)

Not re-homed. The slug (task-7.0 -> Sprint 7) is the task's OWN declaration - stronger than the dropped unreciprocated pointer, but a different evidence KIND than the covered-req chain the (a) criterion names. PO decides: slug-declaration counts as (a) evidence, or park.

| Task | Name | Declares |
|---|---|---|
| ecf3e19f | T7.0: MD Browser PlantUML SVG Support | S7 |

## (c) NO-EVIDENCE - PARKED (visible, named backlog; NOT silent floaters)

**Why unresolvable:** no covered-req chain and no sprint-index in the name (flat T<N>: task numbers). The dropped pre-migration ownerIor is git-recoverable but was UNRECIPROCATED (the sprint denied them) = restoring it recreates a link the graph itself rejected = fabrication in a git-history costume.

**What WOULD close each:** a canonical T<N> -> sprint mapping (searched: none found on disk), OR a coveredRequirements link to a parented req, OR a human/Tron assignment.

| Task | Name |
|---|---|
| 90b208e8 | T65: rb-file-tree — Directory Browser |
| 915f458e | T180: Real CA cert (Let's Encrypt) for home.donges |
| 988ca807 | T7: User Editor Dialog |
| 98cab0df | T62: FileApi Vitest Security Tests |
| 959ad06c | T52: Avatar Visible in Lobby + Profile Page |
| 68dec25a | T58: Fix Link Contrast on Sprint Overview Pages |
| 7b0985b9 | T179: SW reliability — auto-activation + STATIC_SH |
| 7271b4a8 | T43: rb-member-badge + rb-member-list |
| 7cb10438 | T23: Task File Audit — Sprint 1 |
| 7d99650e | T61: FileApi.ts — writeFile with mtime conflict |
| b054dfca | T39: rb-update-banner Web Component |
| b29f0e02 | T29: Update OOSH Sprint Tool — Template Enforcemen |
| bca855a1 | T34: One-Click Update |
| 383938b1 | T182: Browse-source href fix — rb-task-detail.ts:4 |
| 3f980c63 | T35: iOS PWA Support |
| 34570c77 | T42: rb-chat-sheet Web Component |
| 3c7d1853 | T-CURRENT-TASK: Drawer/trace DETAIL works end-to-e |
| 3d4e6a88 | T50: Avatar Upload Endpoint POST /api/avatar |
| 3a9277da | T41: rb-overlay Base Class |
| 03fb4511 | Planner: S2-S9 Sprint.tasks[] Backfill — Status |
| 181d5d01 | T44: Server-rendered Pages Shared Shell |
| 1f34b93c | T60: FileApi.ts — readDir + readFile + sanitize +  |
| 15a67f72 | T73: Playwright E2E for Editor |
| 8975ff1f | T57: rb-avatar Fixes — Lobby DRY, Pinch-Zoom, Crop |
| 8b405c16 | T128.4: Method marker retrofit — fill `[impl:uuid: |
| 88ea152a | T66: rb-code-editor — Monaco Wrapper |
| 8dd36103 | T185: PlantUML class diagrams for traceability-tre |
| f116160a | T38: iOS Safe Area Inset for Room Header |
| f84b551a | T200: Tree ↔ Detail Sync — bi-directional selectio |
| fc5f62c4 | T70: rb-editor-toolbar — Save, View Toggle, Breadc |
| f5b8c83e | T199: Scenario data integrity — backfill `ownerIor |
| f55a0b01 | T55: Avatar Fixes — Tron QA Findings |
| 20e89691 | T175: Tree base + Traceability layer + typed chain |
| 46b7eadf | T174: Drawer UX cleanup + /scenario route + mobile |
| 47083e1a | T59: Floating Back Button on /md/ File Views |
| 4bd33c18 | T178: 7-step chain DATA-FILL — populate UC→Class→M |
| 41b0d724 | T181: Strict forward-only DISPLAY — no backward li |
| 424932a6 | T25: Task File Audit — Sprint 3 |
| 44bef447 | T177: /scenario ior-format 'Not found' — bare-uuid |
| 4da7237c | T54: Remove avatarCache + Verify Encrypted Storage |
| 456772fb | T48: Default Avatar Assignment + Encrypted Storage |
| c9ebef46 | T176: Headless test-infra unblocker — page JS must |
| c7f92a8f | T51: ProfileEditor Avatar Upload via API |
| c30f0e03 | T30: PO Process Documentation |
| c8087df0 | T40: rb-header Web Component |
| cf09cf2b | T63: edit.html + edit.ts + CDN Monaco |
| c2b27a4e | T31: Service Worker + App Shell Cache |
| c2ec9189 | T68: rb-preview Markdown — Live Preview |
| ce7f0047 | T12: SSH-Based Login (Challenge-Response) |
| db9091a2 | T11: vCard Download for Other Users |
| d37f0e04 | T37: Hotfixes — Private Room + Version Bar |
| d32fd84e | T24: Task File Audit — Sprint 2 |
| d089a550 | T64: rb-editor-layout — Three-Panel Layout |
| d0c3abf8 | T27: Sprint CLI Tool (OOSH Script) |
| d0c4d141 | T33: Auto-Reconnect + Message Queue |
| dcb79471 | T69: rb-preview PlantUML — SVG Preview |
| dc1149a4 | T56: `<rb-avatar>` Web Component — Clickable Photo |
| dc46e5b0 | T49: Avatar Serving Endpoint GET /api/avatar |
| daf76389 | T186: Tree-view lazy-load at every chain level — s |
| a6ab0ca4 | T36: Offline Data Persistence |
| a6ae7989 | T72: Cross-Links — /md/ ↔ /edit/ |
| ab0cbe5f | T184: Forward-only API emit — strip backward keys  |
| abc78991 | Strict-Champagne Defect Catalog: 21 Unreachable Te |
| a37159a8 | T10: Device Key Enrollment |
| a3f183b4 | T183: 7-hop CI gate — trace:audit:strict per-Test  |
| a165969c | T8: Mandatory Profile Gate |
| a8cfeb7d | T26: Task Template Standardization |
| a28f0e01 | T28: Fix All Task Files — Web4Articles Template Co |
| add91a59 | T67: rb-code-editor Save — Cmd+S + Dirty + Conflic |
| aae52ee0 | T46: Dead Code Cleanup + Bundle Verification |
| 570267c3 | T47: UserCrypto.ts — Hybrid Encryption Module |
| 53b926d6 | T201: 6-step chain correction — propagate `Require |
| 51d3b63f | T71: Mobile Layout — Single-Panel + Tab Bar |
| 559a384b | T32: Cache Headers + Asset Versioning |
| 55bf8edd | T45: rb-qr-popup Web Component |
| e9fdc892 | T53: Room Member AvatarUrl from Profile |
| e7fbf79b | T9: SSH Key Generation on Profile Commit |
| ec187a1f | T-drawer-resize: grab-handle drag sets drawer heig |

*78 parked. Re-open when a T-number->sprint mapping or covered-req link appears. Machine plan committed alongside as orphan-rehome-plan.json.*