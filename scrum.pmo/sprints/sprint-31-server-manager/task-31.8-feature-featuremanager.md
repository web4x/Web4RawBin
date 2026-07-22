<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 31.8: Feature typed unit type + FeatureManager root-of-trust — product layer linking implementations to user grants

[task:uuid:71aeff3c-797a-4fcc-9abe-5fb6b5db0d31]

## Status
- [x] Planned
- [x] In Progress
  - [x] refinement
  - [ ] creating test cases
  - [~] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Remaining Issues

In-Progress = IMPL-COMPLETE, FUNCTIONAL-PENDING (req correction, withdrew earlier fully-built framing). FeatureManager-view reframe (R31.8c phase) is chain-complete-to-Impl (5 Impls verified) but NOT functional/Done. Expert caught 2 FUNCTIONAL gaps: (A) server token->user-node resolver + Feature-roots source; (B) client renders a SYNTHETIC root, not the real Feature units. Fresh-expert building A+B. Needs a FUNCTIONAL tester gate (real Feature roots + granted-user children render LIVE) before -> QA-Review/Done. Also open: FeatureManager grant/revoke owner-gated + bootstrap seed + profile.features both-way (per R31.8 ACs).

## Traceability

  - up
    - [Sprint 31 Planning](./planning.md)
    - Requirement R31.8 `[requirement:uuid:a93f5fce-e55a-4d42-9d4d-976a7b892523]`
  - down
    - None (atomic task)

## Task Description

Tron model (2026-07-21, brief 0427d264f) + architect security design 83836631a (APPROVED rulings). ior:class:Feature is a first-class TYPED scenario unit = the PRODUCT layer: {name, description, icon, implementations[] (BOTH-WAY: Impl.feature back-ref, mirror-maintained), allowedUsers[] (-> profile TOKENS, BOTH-WAY with profile.features)}. Two instances: ServerManager (the R31.1-R31.4 feature) + FeatureManager (grant/revoke Features on profiles, root-of-trust). Generalizes R31.1 (profile renders granted-Feature list off m.features, server-computed) + R31.2 (access = requireFeatureAccess = isLiveSession AND user-in-Feature.allowedUsers, data-driven). SECURITY (architect-owned, finalized off 83836631a): FeatureManager grant-editing = HARDCODED owner-gate (root-of-trust, NOT data-driven = closes self-grant escalation); feature ACCESS = data-driven allowedUsers, AND-composed with isLiveSession; OWNER_TOKEN literal used ONLY for root-of-trust + bootstrap seed (==1 preserved, no literal-bypass into feature-access — owner enters via seeded membership); bootstrap idempotent-seeds OWNER_TOKEN into ServerManager+FeatureManager allowedUsers; INV-F5 empty/malformed allowedUsers FAILS CLOSED. Preserves R31.2 INV-G1/G2/G3 (grants only ADD checks). Route: req formalizes (this) -> expert implements (Feature units + Impl.feature back-refs + profile.features + requireFeatureAccess + FeatureManager grant/revoke owner-gated + bootstrap seed + m.features render) -> tester gates (both-way nav; grant/revoke flips member-200/non-member-403; profile lists granted; INV-F1..5 hold).

## Acceptance Criteria

- [ ] ior:class:Feature is a first-class TYPED scenario unit (FeatureModel schema): name, description, icon, implementations[] (refs to Impl units), allowedUsers[] (refs to user profile TOKENS — profiles are Map+JSON today, server.ts:166; token is the stable identity; full profile-as-unit = later migration). The PRODUCT layer linking code to user grants.
- [ ] INV-F-MIRROR: Feature.implementations[] <-> Impl.feature both-way — for every f in Feature.implementations, Impl(f).feature==Feature; Feature->its impls AND impl->its Feature both resolve. Mirror-maintained like Class.methods[]/Method.ownerIor; a drift-check fails loud.
- [ ] Feature.allowedUsers[] <-> profile.features[] (new UserProfile field, Feature-uuid refs) both-way — a grant writes BOTH sides atomically, a revoke removes from BOTH. Feature->its users AND user->their features both resolve.
- [ ] Two S31 Feature instances: ServerManager (implementations=[assertOwner impl 335dbf3d, attachPane 394eac63, readSessionTree 5c1701bc, renderFeatureGrants f345b8ed, buildSeedNode 5b3d9f1a, reapOrphans 5d313828 — representative, architect-refined]; allowedUsers=[Tron 41ad88c4]) + FeatureManager (function: enable/disable Features on profiles = grant/revoke; implementations to-be-built; allowedUsers=[Tron]).
- [ ] REFRAMES R31.1: replace the single serverManager flag (server.ts:2625) with features:<Feature[] where token in allowedUsers> on the PROFILE ws msg (server-computed, same trust path, client can't self-grant). renderFeatureGrants iterates m.features -> one entry per granted Feature (name/icon/link) at #feature-grants. Tron -> [ServerManager, FeatureManager]; non-granted -> empty -> section ABSENT by construction (not UI-hidden).
- [ ] REFRAMES R31.2 (architect design 83836631a): feature ACCESS = requireFeatureAccess(req, featureName) = isLiveSession(token) AND token in Feature.allowedUsers — data-driven membership, AND-composed (both fail-closed), replacing the hardcoded per-feature owner-gate. Added at the SAME server-side choke (server.ts:891 pattern), never bypassed; UI-hiding is NOT the gate. INV-F1: every feature's routes+ws -> 403 for non-members.
- [ ] INV-F4 (root-of-trust): FeatureManager grant/revoke — ANY write to allowedUsers/profile.features — is gated by the HARDCODED owner-gate (ServerManagerGuard.assertOwner / the R31.2 OWNER_TOKEN literal), NOT data-driven. A data-driven-only path to grant-editing is the escalation HOLE (anyone reaching FeatureManager could self-add to any feature) and is REJECTED. Only the hardcoded owner mutates grants; a non-owner grant attempt -> 403, never mutates.
- [ ] BOOTSTRAP + INV-F5: at first run an idempotent seed writes OWNER_TOKEN into ServerManager.allowedUsers AND FeatureManager.allowedUsers from the hardcoded literal (a generated seed step, R31.7-aligned) — the hardcoded owner is the bootstrap root, from there Tron grants others via FeatureManager; NO grant path exists that doesn't originate at the hardcoded owner. INV-F5: a feature with EMPTY/MALFORMED allowedUsers FAILS CLOSED (403 for all, incl owner-unless-seeded), NEVER fails-open.
- [ ] R31.2 INV-G preserved, NOT weakened: INV-G1 stays ONE server-side choke (now calls requireFeatureAccess(feature), not requireOwnerHttp); INV-G2 the OWNER_TOKEN literal stays ==1 (used ONLY for the FeatureManager root-of-trust + bootstrap seed; feature access adds NO new literals, uses allowedUsers data; grep-guard still ==1); INV-F3 (=INV-G3) a feature ws upgrade checks requireFeatureAccess BEFORE handleUpgrade, non-member -> socket.destroy before open. The OWNER reaches ServerManager via seeded allowedUsers MEMBERSHIP (same data path as any grantee) — NO literal-bypass OR into feature-access.

## Subtasks

None (atomic task).
