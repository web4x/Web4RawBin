<!-- GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT -->

[Back to Planning](./planning.md)

# Task 40.66: PROD regression — File units carry UUIDs where names belong + lost ownerIor (works on older TEST, broken on PROD)

[task:uuid:b981f1c9-2e08-44f7-a1fa-566c0a2408a0]

## Status
- [x] Planned
- [ ] In Progress
  - [ ] refinement
  - [ ] creating test cases
  - [ ] implementing
  - [ ] testing
- [ ] QA Review
- [ ] Done

## Task Description

TRON MAJOR REGRESSION (relayed via PO 2026-08-29). SYMPTOM on PROD (prod.wo-da.de:4444), from Tron's File-unit JSON: ownerIor = NULL; name = a raw UUID (b9fa43a2-ea98-...) instead of a filename; location = the SAME raw uuid; sourceFile = ior:file:b9fa43a2-... — i.e. File units carry UUIDs where NAMES belong and have LOST their owner. TWO-SERVER EVIDENCE (a bisect handed to us): the SAME views render CORRECTLY on TEST (test.wo-da.de:4444, an OLDER version) and are BROKEN on PROD. ★ ROOT NOT PRE-JUDGED — three distinct possibilities, three different fixes: (a) CODE (render/resolve path), (b) DATA (File units written wrong at mint time), (c) GENERATION (the minter stopped resolving names). Architect is diagnosing by DIFFING the same unit from both servers; the root + the specific fix are added to this task when the architect reports. ★ WHY IT MATTERS BEYOND DISPLAY: a File unit whose NAME IS ITS UUID is unreadable to Tron on his own board — and IF the defect is in the DATA (not the render), then EVERY File unit written since the regression carries it, so a DATA REPAIR is needed ON TOP OF a code fix. ★ OPEN QUESTION FOR ARCHITECT (determines scope): is this RENDER-ONLY or PERSISTED? Render-only => code fix; persisted => code fix + data repair of all affected units. ★ RANKING (Tron/PO): MAJOR REGRESSION — above the queued hygiene work (42-AC untasked sweep, backfills, Task 40.62 diagram half) but BELOW the live RCE (remote unauthenticated hole, outranks everything).

## Context

Covers R40.69 (23e77b77, File units carry filenames not UUIDs — Tron prod regression). Architect diagnoses root (code/data/generation) by diffing the same File unit from prod vs test; useCases + chain wired at diagnosis. Not to be built until root is known — task it as symptom+evidence per Tron.

## Intention

Track Tron's PROD File-unit regression (uuid-where-name-belongs + null ownerIor, works-on-older-TEST) as a MAJOR REGRESSION — symptom + two-server bisect evidence now; root + fix added on architect's diff-diagnosis. Covering task (#126); req formalizes the Requirement.

## Acceptance Criteria

- [ ] **(shape/name)** File.name is the FILENAME, NEVER a raw UUID. Gate: 0 File units whose name matches a uuid-v4 regex => RED (the exact prod symptom: name=b9fa43a2-…).
- [ ] **(shape/location)** File.location is a real path/location, NEVER the raw uuid. Gate RED on a File whose location == its uuid (or matches a uuid regex).
- [ ] **(shape/sourceFile)** File.sourceFile is ior:file:<real path>, NEVER ior:file:<uuid>. Gate RED on sourceFile=ior:file:<uuid>.
- [ ] **(shape/owner)** File.ownerIor is SET (non-null) — a File belongs to a parent (its containing folder/room/project). The prod symptom has ownerIor=NULL. Gate RED on a File unit with null ownerIor (scoped to the classes that must own a File).
- [ ] **(evidence/bisect)** TWO-SERVER BISECT (evidence, symptom-not-fix): the regression reproduces on PROD (File b9fa43a2: uuid-name + null owner) and renders CORRECT on an OLDER TEST server -> the DATA/GENERATION changed between them, not the renderer. ROOT is the ARCHITECT's diff-diagnosis (prod File JSON vs test File JSON: code/data/generation). This AC holds the evidence; the fix + its RED baseline attach once the root is known. Do NOT build a fix until the architect names the root.
- [ ] **(root/class-kill (architect b09bb0308))** No ModelElement lives in >1 store. Ruled (b09bb0308): the two stores are BOTH LEGITIMATE (scenario/index = scenario units; data/model-store = M1 model elements) — ModelElements belong in data/model-store. The 33 overlapping units are ALL ior:class:ModelElement (measured) wrongly ALSO in scenario/index. DEDUP: remove the 33 from scenario/index (33 -> 0 in scenario/index; they stay in model-store), GATED dry-run + count, and model-store copies UNCHANGED (byte-diff == 0, verified: the 33 already agree byte-identical). A ModelElement in both stores => RED.
- [ ] **(root/class-kill (architect b09bb0308))** ensureViewUnit REFUSES a path ref whose payload is a bare UUID — FAIL-CLOSED. Ruled root of the 5 name=uuid File units: a bad caller passes file:<uuid> (the source-file UUID) as a path ref, and ensureViewUnit mints a File whose name IS that uuid. FIX: ensureViewUnit('file:<v4-uuid>') returns null (refuse), never mints a uuid-named File. The 5 model-store-only symptom units (incl 5fbed155 name=b9fa43a2) are the RED baseline. 'File names are paths' is the unenforced-wish this enforces.
- [ ] **(root/shape-ruling)** RULE THE SHAPE (architect): what WRITES scenario/index vs what WRITES data/model-store, WHY the second store exists (M1 model vs scenario units), and which is CANONICAL — recorded so a future reader knows the store boundary. If data/model-store is legitimate (separate M1 concern) it derives-from / does-not-duplicate the canonical store; if accidental it is ELIMINATED. Measured evidence: stores largely disjoint (33 of 720+5777), overlap agrees => leans legitimate-M1, 33 still a defect.

## Subtasks

None (atomic task; architect may split at diagnosis).
