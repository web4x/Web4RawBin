# Children are a TYPE-DECLARED composition, not a runtime query (SHAPE VERDICT)

**Author:** robbin-architect 2026-09-05. SUPERSEDES the per-type children() METHOD design (which still queried). Tron: "WHAT CHILDREN an object has is a TYPE / class / interface DESIGN." Applies LAW-9 + the falsifiable test. Design-only; expert holds until this is the shape.

## FALSIFIABLE TEST — measured against the actual code = VIOLATION
PO's decisive test: does adding a new type require editing a central switch? MEASURED: the server `/api/trace/children` resolver is a per-type SWITCH — branches `rcKind === 'members'|'files'` (roomcoll), `ref.startsWith('dir:')`, `mofChildren` (model). Adding a new collection type = adding a branch to that switch. ⇒ **VIOLATION** (the resolver owns what the type should own). The client `tree-parent.ts` `TreeNode` is one-generic delegating to it (cosmetic this-binding; the per-type logic lives in the resolver). (Trainer ruled on the description; I confirmed on the code — it holds.)

## TRON'S STRONGER FORM (why per-type children() METHOD is still not enough)
A `children()` method that FETCHES is still a runtime QUERY — "what children does this ref have?" — answered by reading the server. Tron: that question **should not exist at runtime**. The SET of children is a **design-time property of the TYPE**:
- A **Room** HAS Members and Files *because that is what a Room IS* — declared in the Room type.
- A **Folder** HAS its contents *because that is what a Folder IS*.
- A **File** has NO children *because it is a leaf BY TYPE*.
A resolver answering "children of ref X" is wrong TWICE: (1) behaviour outside the type, (2) the runtime question itself shouldn't exist — the type already knows the SHAPE; runtime only fills in INSTANCES. This is the MDA layering we already have and haven't used: **M2 declares the STRUCTURE (what a type is composed of); M1 holds the instances.** Children-structure belongs in M2.

## THE SHAPE (buildable)
1. **Each TYPE DECLARES its child-composition** (structural, design-time, in the type/interface — the M2 model): `Room = { Members: Member[], Files: File[] }`, `Folder = { contents: (Folder|File)[] }`, `File = leaf`, etc. This is a declaration, not a fetch.
2. **Runtime POPULATES the declared slots with instances**, owned PER-TYPE (a Folder fills `contents` from its dir; a Room fills Members/Files from its data) — **no central switch**. Instance-population reads data (disk/units) — that is legitimately runtime, but owned by the type, not a resolver. Adding a new type = the new type declares + populates its own composition; nothing central is edited (open-closed, an instance of LAW-9).
3. **Tree AND detail render the DECLARED structure with instances filled in** — the same declared composition, so they cannot diverge (a Room always shows Members+Files; the folder's contents are one populated slot). No surface asks "what children does this ref have."
4. **If any design still has a central place deciding a ref's children, it is the resolver in a third costume** — RED.

## The distinction the guard must eventually hold (not just 13→0)
- **Instance-population** (a Folder reading its dir to fill `contents`) is legitimate runtime, per-type-owned = OK.
- **Shape-discovery** (a central resolver type-switching to decide what child-slots a ref has) = the violation.
The 13-site client guard proves surfaces ask the OBJECT (a step). The deeper guard (later) proves the child-STRUCTURE is type-declared, not resolver-discovered (add-a-type-touches-no-switch).

## rb-detail-drawer:99 (the third ruling) — ROUTE, not exempt
`/api/trace/children/<CS>?mode=trace` gets CurrentSprint's children (for the pin's current-slot). Under this shape, CurrentSprint's composition (current / lastCompleted / nextBacklog slots) is DECLARED by its type; the pin reads a declared slot's instance. So it is NOT a distinct query — it asks the CS object for its own declared children. ROUTE it through the object; the pin's slot-SELECTION is a consumer of the declared composition. No exemption.

## Scope (honest)
This is bigger than the client 13→0 rewire — it is a MODEL (M2 composition declaration) + SERVER (retire the switch → per-type population) change, with the client rendering declared structure. It is the correct FOUNDATION (Tron: cheapest to choose now; retrofitting after the rewire costs it twice). The visible symptom (folder invisible) is the client divergence, but the foundation must be type-declared composition so we do not rewire against a shape about to change. Expert: HOLD the 13-site rewire until this shape is ratified; build types that DECLARE their children, not a children() that queries.
