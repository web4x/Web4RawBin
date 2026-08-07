# Stale-Active 39 DONE-CANDIDATE — Tron QA batch (grouped by confidence)

By robbin-req 2026-08-07 for PO->Tron. NONE flipped to Done. Confidence = how fully each task covered-req is chain-complete-to-Test (deliverable gated). Tron: bulk-approve a group or spot-check; anything not approved -> superseded/backlog, not Done.
- **A (HIGH)** — covered req FULLY chain-complete-to-Test (all Impls gated), scope-matches: strong Done candidate.
- **B (MED)** — covered req PARTIALLY tested (some Impls gated): scope-match ambiguous, spot-check.
- **C (WEAK)** — only a fragment/shared Impl gated: likely superseded/backlog, verify before any Done.
- **★ CALIBRATION (spot-check, robbin-req):** sampled 2 Group-A tasks — the tested Impl sourceFile SCOPE-MATCHES the task (T-room-unit R19.1 -> src/ts/server/Room.ts; T-room-ui-shared R19.21 -> src/public/ts/RoomView.ts). So Group A is NOT tested-ratio inflation via shared Impls — the deliverables are real + scope-plausible. STILL a candidate for Tron decide, NOT a Done stamp (Tron QA is the gate; I did not flip any).

## Group A — 36 tasks
- S19 0c28c7f8 [R19.54] 1/1 Impls tested — T-user-scenarios: Users become first-class sce :: 8298c379 tested by ior:file:test/vitest/server.test.ts
- S19 147e2f64 [R19.35] 1/1 Impls tested — T-member-iors: room scenario unit model holds  :: d5f0c2b4 tested by ior:file:test/vitest/room.test.ts
- S19 164d8114 [R19.3] 2/2 Impls tested — T-visibility: Room visibility modes (public/by :: 1cef1fa1 tested by ior:file:test/vitest/room.test.ts
- S19 1805f7db [R19.5] 2/2 Impls tested — T-apply-flow: BY-INVITE Apply button + invite- :: 5a397d5d tested by ior:file:test/vitest/components.test.ts
- S19 1c7f8d8e [R19.41] 1/1 Impls tested — T-server-log-level: configurable server log le :: cda50b0f tested by ior:file:test/vitest/server.test.ts
- S19 2195d98f [R19.21] 1/1 Impls tested — T-room-ui-shared: in-room tree REUSES /trace r :: 32578dc6 tested by ior:file:test/vitest/room.test.ts
- S19 25c38ac0 [R19.37] 2/2 Impls tested — T-dnd-unknown-dispatcher: unknown format dropp :: 971bdde0 tested by ior:file:test/vitest/file-dnd-chain.test.ts
- S19 312cb103 [R19.10] 1/1 Impls tested — T-default-flip: PERSISTENT becomes default mod :: 3fbcebaf tested by ior:file:test/vitest/room.test.ts
- S19 3ca88df7 [R19.82] 1/1 Impls tested — T-room-join-stale-takeover: joining from lobby :: 84910216 tested by ior:file:test/vitest/room.test.ts
- S19 40a756f5 [R19.48] 1/1 Impls tested — T-file-version-new: different content same nam :: 148740b9 tested by ior:file:test/vitest/file-dnd-chain.test.ts
- S19 67b2763e [R19.7] 4/4 Impls tested — T-persistent: Room mode PERSISTENT + offline m :: 4246c0a8 tested by ior:file:test/vitest/room.test.ts
- S19 6c4949fa [R19.1] 3/3 Impls tested — T-room-unit: Room IS a scenario unit + click-t :: 2ab8a3dd tested by ior:file:test/vitest/room.test.ts
- S19 6f574da6 [R19.50] 1/1 Impls tested — T-file-version-array: file scenario unit has v :: 7c4a9d74 tested by ior:file:test/vitest/server.test.ts
- S19 787e88ab [R19.24] 1/1 Impls tested — T-remove-spectator: strip isSpectator/mode/rol :: b309d0dd tested by ior:file:test/vitest/room.test.ts
- S19 7fca98ae [R19.36] 5/5 Impls tested — T-dnd-file-chain: drop file onto room drop-zon :: d6ec181b tested by ior:file:test/vitest/room.test.ts
- S19 834fe55b [R19.14] 2/2 Impls tested — T-file-unit: Files become scenario units (uuid :: c546c877 tested by ior:file:test/vitest/scenario.test.ts
- S19 a91643c6 [R19.33] 2/2 Impls tested — T-sticky-drawer-close: sticky close button on  :: aa585fcc tested by ior:file:test/vitest/impl-coverage-batch.test.
- S19 ae090710 [R19.11] 3/3 Impls tested — T-room-ui: drop-zone + Members/Files tree + me :: e289349c tested by ior:file:test/vitest/room.test.ts
- S19 b3b822e9 [R19.22] 2/2 Impls tested — T-room-json-symlink-and-ui: room.json symlink  :: a6e5e49d tested by ior:file:test/vitest/room.test.ts
- S19 c0d67460 [R19.30] 1/1 Impls tested — T-room-edit-pen-canonical: edit pen on room it :: 2a29b3da tested by ior:file:test/vitest/impl-coverage-batch.test.
- S19 e90c223d [R19.23] 1/1 Impls tested — T-remove-room-sizes: strip maxMembers/maxPlaye :: c96d458c tested by ior:file:test/vitest/server.test.ts
- S19 fb629eb7 [R19.57] 1/1 Impls tested — T-back-button-visible: full-width drawer must  :: 2f809076 tested by ior:file:test/vitest/server.test.ts
- S19 fda34dac [R19.31] 1/1 Impls tested — T-room-link-404-fix: room link navigates to li :: b3adefdd tested by 
- S20 d43fce61 [R19.11] 11/11 Impls tested — T-s19-shared-impl-split-recovery: split 11 sha :: e289349c tested by ior:file:test/vitest/room.test.ts
- S21 0c1b375e [R21.1] 1/1 Impls tested — T21.1: vCard drop stores .vcf beside avatar :: d1337706 tested by ior:file:test/visual/r211-vcard-persist-gate.m
- S21 18845496 [R21.7] 1/1 Impls tested — T21.7: Addresses async OSM-verified :: ce2501d3 tested by ior:file:test/visual/r217-address-units-gate.m
- S21 1bae9710 [R21.3] 1/1 Impls tested — T21.3: Phone alt-UUID index (ln symlink) :: f2174329 tested by ior:file:test/visual/r2156-email-phone-units-g
- S21 3960168e [R21.5] 1/1 Impls tested — T21.5: Emails as scenario units + alt-index :: c709147a tested by ior:file:test/visual/r2156-email-phone-units-g
- S21 842d4f01 [R21.8] 1/1 Impls tested — T21.8: Companies as shared dedup units :: 4a7d30bb tested by ior:file:test/visual/r218-company-units-gate.m
- S21 a25e2787 [R21.2] 1/1 Impls tested — T21.2: Lobby renders real name on first connec :: 7dbff12b tested by ior:file:test/visual/r212-lobby-livename-gate.
- S21 af9dc6cc [R21.6] 1/1 Impls tested — T21.6: Phones as scenario units (seed Tron) :: 801f53b3 tested by ior:file:test/visual/r2156-email-phone-units-g
- S21 e83dc244 [R21.4] 1/1 Impls tested — T21.4: Device-link on known phone/email :: cc6df739 tested by ior:file:test/visual/r214-deviceLink-challenge
- S21 f86f7003 [R21.9] 1/1 Impls tested — T21.9: File detail reorder + pan/zoom :: f8b113b7 tested by ior:file:test/visual/r219-file-detail-layout-g
- S25 06544a45 [R25.1] 2/2 Impls tested — Task 25.1: Comprehensive DnD logging (capture  :: 971bdde0 tested by ior:file:test/vitest/file-dnd-chain.test.ts
- S25 92bdca8b [R25.3] 1/1 Impls tested — Task 25.3: vCard onboarding recognizes existin :: b3c5a6f5 tested by ior:file:test/visual/r255-v0694-gate.mjs
- S25 b9deaf57 [R25.4] 2/2 Impls tested — Task 25.4: Drawer interaction — grab-bar mouse :: 9d095150 tested by ior:file:test/visual/r255-v0694-gate.mjs

## Group B — 3 tasks
- S20 56cc23b5 [CR1] 6/7 Impls tested — T-rename-champagne-to-traceability: 'Champagne :: 4947f284 tested by ior:file:test/vitest/components.test.ts
- S20 767dd241 [R20.3] 23/24 Impls tested — T-item-views-default-collapsed: every item vie :: 0b57d139 tested by ior:file:test/vitest/components.test.ts
- S25 d01c38b3 [R25.7] 4/5 Impls tested — Task 25.7: Room membership dedup by resolved i :: 7899449b tested by ior:file:test/visual/r258-v070-gate.mjs

## Group C — 0 tasks
