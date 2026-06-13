# R19.2 / R19.8 chain-scope — SOURCE VERDICT (planner, 2026-06-14)
## Scope-guard outcome: narrow-to-UC.method REJECTED (not principled). 21 STAYS.

### Premise check (architect proposed fan-out → narrow)
FALSE. Walker (skill-classes.ts:256-264) already narrows: `methIors = ucMethodUuid ? [ucMethodIor] : clsM.methods`. Both reqs' UCs HAVE .method set → no fan-out. Verified:
- R19.2 (18ecdab4) useCases: room.editConfig→editOpen(6fc898ab) + room.bootstrapAsUnit→Room.init(4fed4fda). BOTH .method set.
- R19.8 (30dcb1a0) useCases: room.maintainPersistentMembers→memberAdd(ea02fa6d) + room.retainOnDisconnect→retainOrPrune(f82d09a5). BOTH .method set.

### The REAL rejection reason (for architect): mis-placed source markers, NOT scorer/data
The 1st UC of each is COMPLETE (editOpen→f9b579c1 strict-PASS; memberAdd→4246c0a8 strict-PASS). The 2nd UC's method has NO strict-valid impl marker:
| req | 2nd UC | method | impls | AST strict verdict |
|---|---|---|---|---|
| R19.2 | room.bootstrapAsUnit | 4fed4fda (Room.init) | 2ab8a3dd / 9fbb1f6e / 4c8a91a5 | ALL FAIL: 2ab8a3dd marker in CONSTRUCTOR (Room.ts:113, ≠init); 9fbb1f6e FILE-HEADER (Room.ts:1); 4c8a91a5 = R19.8.B dedup (diff behavior) |
| R19.8 | room.retainOnDisconnect | f82d09a5 (Room.retainOrPrune) | 4c21d2ee | FAIL: marker INSIDE removeMember body (Room.ts:202), name-mismatch ≠ retainOrPrune |

Wiring resolves (architect correct) AND data is correct — but the AST strict-test correctly FAILS the 2nd-UC impls because their source markers are MIS-PLACED (constructor / file-header / wrong-method). Scorer is right; markers are wrong.

### Principle (PO guard: number follows rule)
The 2nd UCs (bootstrapAsUnit, retainOnDisconnect) are GENUINE behaviors of R19.2/R19.8, each a real UseCase with .method set — NOT a Class.methods[] over-walk. So they are GENUINE OPEN WORK. Narrowing them away = scope-redefine-to-inflate = REJECTED. 21 stays.

### Climb path (EXPERT lane, det-3x each, +1 each when done)
- R19.2: author/relocate a strict-valid named-method impl marker for `Room.init`/bootstrapAsUnit — marker must sit INSIDE a named method matching the UC.method (not the constructor, not file-header).
- R19.8: relocate 4c21d2ee's marker from inside removeMember INTO the retainOrPrune named method body (name-match).
Then each 2nd UC completes → R19.2/R19.8 champagne → 21→23. Genuine, not narrowed.
