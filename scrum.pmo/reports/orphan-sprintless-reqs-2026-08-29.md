# Sprint-less (orphan) requirements — triage worklist (planner, 2026-08-29)

Measured STRUCTURAL (no `sprintName` AND `parent` is not a Sprint unit) on origin/main. Architect root-cause ruling f2392ba44: mint choke-point + delta-gated audit; the 24=symptom triaged INDIVIDUALLY (real->true sprint / dead->retire), NEVER bulk auto-attach.

**TOTAL sprint-less = 62** (uncovered 24). ★ NOT 62 real reqs — it is a MIX:

## REAL legacy reqs (13) — have altId (S10-S18 era), triage to TRUE sprint
- R-placeholder-T202 `4d525a4d-5094-4288-9607-3d300efceeca` — covered — R-placeholder (T202 sibling of R18.13): Shared Class must us
- R10.4 `251e2086-ebac-459f-b485-1a9fd0c13d63` — covered — Self-click opens profile sheet
- R12.1 `bb37674f-dea7-474d-9631-5ca46ed2fe60` — covered — Editor back button navigates to parent
- R16.5 `41c49f04-ba9e-4317-b783-17cc0e63fd25` — covered — Detail drawer with swipe dismiss
- R16.6 `2d522d41-b0cb-4c60-af0e-a2127b7a482b` — covered — Tree item generates speaky name
- R16.7 `92ed98b8-77dc-45c3-bd4a-73aaf6d94ee1` — covered — Tree item shows typed SVG icon
- R16.8 `bd9543e0-76b1-476f-9692-cb87afde47cf` — covered — Tree item supports OS drag-and-drop
- R16.9 `3ba633f3-4a88-4438-a003-9f3b75ec2f01` — covered — Tree item collapse/expand with children
- R17.48 `61af65e4-1d5b-4cc1-8929-04ab949d73ff` — covered — Scenario JSON click opens trace tree
- R18.33 `b64a9d54-545f-4f25-b110-209421cec8e2` — covered — Detail navigation syncs tree selection
- R18.34 `042bab1a-46ff-4a92-8494-102b9ad928ac` — covered — SVG renders in fullscreen iframe natively
- R18.34.B `6ee95023-5639-4eb7-86cc-916ebb418e7e` — covered — Pinch release commits SVG zoom without additional gesture
- R18.35 `cd5b1611-7c37-4c47-840d-2ed6188258fb` — covered — Shared Class: trace tree shows the expanding UseCase's metho

## JUNK / fabricated-pattern (49) — NO altId, likely retire (dead)
★ FABRICATED-PATTERN uuids (18xxxxxx / d4e5f6a7-style) — same class as the fa8fffc8-8e2e phantom; many are DUPLICATE refs. Triage = retire, NOT sprint-attach.

### junk uuids:
- `12a4b6c8-5d2e-4f30-9a17-3b5c7d9e1f02` — covered
- `18a1b2c3-d4e5-4f60-8a71-000000018001` — UNCOVERED
- `18a3b4c5-d6e7-8f90-1a2b-000000018031` — UNCOVERED
- `18a7b8c9-d0e1-2f3a-4b5c-000000018025` — UNCOVERED
- `18a7b8c9-d0e1-4f26-8cd7-000000018007` — UNCOVERED
- `18b2c3d4-e5f6-4a71-9b82-000000018002` — UNCOVERED
- `18b2c3d4-e5f6-7a8b-9c0d-000000018020` — UNCOVERED
- `18b8c9d0-e1f2-3a4b-5c6d-000000018026` — UNCOVERED
- `18b8c9d0-e1f2-4a3b-5c6d-000000018008` — UNCOVERED
- `18c3d4e5-f6a7-4b82-9c93-000000018003` — UNCOVERED
- `18c3d4e5-f6a7-8b9c-0d1e-000000018021` — UNCOVERED
- `18c9d0e1-f2a3-4b5c-6d7e-000000018027` — UNCOVERED
- `18d0e1f2-a3b4-5c6d-7e8f-000000018028` — UNCOVERED
- `18d4e5f6-a7b8-4c93-9da4-000000018004` — UNCOVERED
- `18d4e5f6-a7b8-9c0d-1e2f-000000018022` — UNCOVERED
- `18e1f2a3-b4c5-6d7e-8f90-000000018029` — UNCOVERED
- `18e5f6a7-b8c9-0d1e-2f3a-000000018023` — UNCOVERED
- `18e5f6a7-b8c9-4d04-8ab5-000000018005` — UNCOVERED
- `18f2a3b4-c5d6-7e8f-9a0b-000000018030` — UNCOVERED
- `18f6a7b8-c9d0-1e2f-3a4b-000000018024` — UNCOVERED
- `18f6a7b8-c9d0-4e15-9bc6-000000018006` — UNCOVERED
- `30c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b62` — covered
- `34c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b03` — covered
- `41c68a9a-b27d-488e-8346-4bc7a4ce685e` — covered
- `44d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04` — covered
- `45d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04` — covered
- `75a7b8c9-d0e1-4f26-8cd7-5b6c7d8e9f07` — covered
- `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d` — covered
- `b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e` — covered
- `b2dfe117-d591-4715-ba62-07b13a8433c0` — covered
- `b2f3a4e5-c6d7-4e8f-9a01-2b3c4d5e6f27` — UNCOVERED
- `c3a4b5e6-d7e8-4f90-a1b2-3c4d5e6f7028` — UNCOVERED
- `d4b5c6e7-e8f9-4a01-b2c3-4d5e6f708029` — UNCOVERED
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000003` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000004` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000005` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000006` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000007` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000008` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000009` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000010` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000011` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000012` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000013` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000014` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000015` — covered
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000016` — covered
- `e61d14c0-69ce-4e6d-a3f5-9579795188b1` — covered
- `f0b1a2c3-c3d4-4e56-7f8a-9b0c1d230047` — UNCOVERED
