# Sprint-less (orphan) requirements — STRUCTURAL re-classification (planner, 2026-08-29, CORRECTED)

★ CORRECTION: my prior version classified 49 as "fabricated-pattern JUNK -> retire" by a uuid PREFIX PATTERN (d4e5f6a7-*/18*) = TEXT-NOT-STRUCTURE (the exact family R37.25 cures, applied to my own finding; PO caught it). Re-classified STRUCTURALLY by 3 signals — valid-uuidv4 (version+variant nibbles, not prefix), inbound-refs, real-content.

**RESULT: 0 junk.** Of 49 noAlt sprint-less suspects: **14 LOAD-BEARING** (inbound refs from tasks/UCs/Impls/Tests — retiring would BREAK chains) + **35 real-content orphans** (name+desc/ACs). ALL are REAL reqs, just sprint-less -> TRIAGE to a sprint, NONE retire.

⚠ SEPARATE data-quality finding (NOT a delete signal): **28/49 carry NON-v4 uuids** (fabricated-pattern uuid on a REAL req = a mint-path uuid-quality issue; sibling to the sprint-less by-construction defect — the R40.11 iorInstance funnel + uuidgen enforcement is the cure). A non-standard uuid on a content-bearing, sometimes-referenced req is a quality flaw, not junk.

DISPOSITION (PO ruling): **NOTHING DELETED.** Even a confirmed-junk unit gets MARKED/quarantined (retired flag + reason + structural signals), never removed — preserve-before-restore; a marked unit is honest+recoverable, a deleted one is an unre-checkable guess. Here: 0 to quarantine; all triage to sprints (the 14 load-bearing FIRST — they anchor live chains).

## Per-unit structural signals (uuid | valid-v4 | inbound-refs | content/3 | class)
- `12a4b6c8-5d2e-4f30-9a17-3b5c7d9e1f02 | v4=Y inbound=3 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `18a1b2c3-d4e5-4f60-8a71-000000018001 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18a3b4c5-d6e7-8f90-1a2b-000000018031 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18a7b8c9-d0e1-2f3a-4b5c-000000018025 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18a7b8c9-d0e1-4f26-8cd7-000000018007 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18b2c3d4-e5f6-4a71-9b82-000000018002 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18b2c3d4-e5f6-7a8b-9c0d-000000018020 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18b8c9d0-e1f2-3a4b-5c6d-000000018026 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18b8c9d0-e1f2-4a3b-5c6d-000000018008 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18c3d4e5-f6a7-4b82-9c93-000000018003 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18c3d4e5-f6a7-8b9c-0d1e-000000018021 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18c9d0e1-f2a3-4b5c-6d7e-000000018027 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18d0e1f2-a3b4-5c6d-7e8f-000000018028 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18d4e5f6-a7b8-4c93-9da4-000000018004 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18d4e5f6-a7b8-9c0d-1e2f-000000018022 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18e1f2a3-b4c5-6d7e-8f90-000000018029 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18e5f6a7-b8c9-0d1e-2f3a-000000018023 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18e5f6a7-b8c9-4d04-8ab5-000000018005 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18f2a3b4-c5d6-7e8f-9a0b-000000018030 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18f6a7b8-c9d0-1e2f-3a4b-000000018024 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `18f6a7b8-c9d0-4e15-9bc6-000000018006 | v4=Y inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `30c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b62 | v4=Y inbound=4 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `34c3d4e5-f6a7-4b82-9c93-1d2e3f4a5b03 | v4=Y inbound=1 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `41c68a9a-b27d-488e-8346-4bc7a4ce685e | v4=Y inbound=3 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `44d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04 | v4=Y inbound=2 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `45d4e5f6-a7b8-4c93-9da4-2e3f4a5b6c04 | v4=Y inbound=1 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `75a7b8c9-d0e1-4f26-8cd7-5b6c7d8e9f07 | v4=Y inbound=3 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d | v4=Y inbound=2 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e | v4=Y inbound=1 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `b2dfe117-d591-4715-ba62-07b13a8433c0 | v4=Y inbound=3 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `b2f3a4e5-c6d7-4e8f-9a01-2b3c4d5e6f27 | v4=Y inbound=1 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `c3a4b5e6-d7e8-4f90-a1b2-3c4d5e6f7028 | v4=Y inbound=1 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `d4b5c6e7-e8f9-4a01-b2c3-4d5e6f708029 | v4=Y inbound=1 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000003 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000004 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000005 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000006 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000007 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000008 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000009 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000010 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000011 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000012 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000013 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000014 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000015 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `d4e5f6a7-b8c9-4d0e-1f2a-000000000016 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
- `e61d14c0-69ce-4e6d-a3f5-9579795188b1 | v4=Y inbound=3 content=2/3 | LOAD-BEARING (inbound refs) — NOT junk`
- `f0b1a2c3-c3d4-4e56-7f8a-9b0c1d230047 | v4=N inbound=0 content=2/3 | real-content-orphan — keep, re-home`
