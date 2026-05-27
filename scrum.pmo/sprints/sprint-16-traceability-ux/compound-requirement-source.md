# Sprint 16 — Traceability UX & DetailViews — COMPOUND REQUIREMENT SOURCE (Tron, verbatim)

**Source:** Tron, 2026-05-27. Captured VERBATIM by robbin-po. Tron's directive: "let the req agent split this text into requirements it tracks back from this long original prompt text as 'compound requirement source'." robbin-req splits this into tracked requirements (each requirement:uuid links UP to this source). DO NOT paraphrase the source.

---

## LITERAL SOURCE (verbatim)
> success. tractability established. it woks but the ux is very clumsy still. the chat in the room has a drawer like detail area like in goggle maps. create a dedicated DetailViewContainer that can contain specialized DetailViews like eg TaskDetailView or RequirementDetailView inside it and then show the details there when i click on the items on the traceability tree. the tree items should have a name attribute that is a speaky name for the requirement or task. if it does not have a short one create a short name from the requirement text. the item shall have below the name a word wrapping smaller text paragraph with the current requirement text. on the left side they should gave a catchy icon for requirement or task. quadratic svgs… choose a good free library. draggable so i could os specificly drag and drop the item. taping the icon once will collapse the item view just into the quadratic item, taping again will make the item expand to show name and description. on rhe right side the icon will have a ">" like icon if the item has children and clicking on it will expand the tree. let the req agent split this text into requirements it tracks back from this long original prompt text as "compound requirement source". review the traceability chain: requirement-> task, use casees, classes (objects nouns), methods (verbs) and make sure i can trace back each method (verbs) to its original requirement. this implies tracking the usecases in puml as dedicated instances of a UseCase class.

---

## Decomposition hints (for req — confirm/correct against the literal source)
- **R16.1 DetailViewContainer** — a dedicated container, drawer-like (like the room chat's drawer / Google-Maps detail drawer), holding specialized DetailViews (e.g. TaskDetailView, RequirementDetailView). Clicking a tree item shows its details there.
- **R16.2 Specialized DetailViews** — TaskDetailView, RequirementDetailView (extensible per object type) rendered inside the container.
- **R16.3 Tree-item: speaky name** — `name` attribute = human-readable short name for the requirement/task; if none exists, generate a short name from the requirement text.
- **R16.4 Tree-item: description** — below the name, a word-wrapping smaller-text paragraph with the current requirement text.
- **R16.5 Tree-item: icon** — left side, a catchy icon per type (requirement/task), QUADRATIC (square) SVGs from a good free library (architect chooses; e.g. Lucide/Tabler/Feather — square, MIT/ISC).
- **R16.6 Tree-item: draggable** — OS-specific drag-and-drop of the item.
- **R16.7 Tree-item: tap icon to collapse/expand** — tap icon once → collapse the item to just the quadratic icon; tap again → expand to show name + description.
- **R16.8 Tree-item: children expander** — right side, a ">" icon when the item has children; clicking it expands the tree.
- **R16.9 Traceability-chain review** — chain: requirement → task → use cases → classes (objects/nouns) → methods (verbs); ensure EVERY method (verb) traces back to its original requirement.
- **R16.10 UseCase as class instances in PUML** — track use cases in PUML as dedicated instances of a UseCase class (first-class, not just labels).

(req: split/refine per the literal source; these hints are not authoritative — the verbatim text is.)
