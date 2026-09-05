# TRON ARCHITECTURE — stated 2026-09-05 (verbatim, captured live)

Recorded as given, in order. **Not a build order.** The room Add-folder fix ships first.

## The chain, as he stated it
1. **"DRY everywhere"** — one mechanism; endpoints differ only by parent path.
2. **"I don't want a data/model-store"** — units may have `ln` links in redundant index trees, so a model *tree folder* is fine, but **not a duplicate index**.
3. **"The Folder owns the children!!! and each type owns its children"** — OOP with a tree parent/children interface. *"you made oop typescript a functional nightmare."*
4. **"The whole traceability is about deduplication of classes and methods and keep it DRY in oop"** — traceability IS the DRY enforcement, not bookkeeping.
5. **"That's why we started the MVC/MDA diagrams"** — to make *fictional* things visible and refactor them **by drag and drop into the correct class**. The diagrams are a refactoring instrument, not pictures.
6. **"Even functional constructs are defects by definition — violated since 1969 when we found the OOP solution."**
7. **"WHAT CHILDREN an object has is a TYPE (class or interface) DESIGN"** — children structure is declared in the type, not resolved at runtime.
8. **"We are on linux. ALL is a file. Even FOLDERS."** — nothing is more fundamental; get it right first or everything on top is broken.
9. **"A file is a unit in our environment… SO EVERYTHING is a SCENARIO-UNIT."**
10. **"The scenario-unit is the MODEL as in MVC of every special class."**
11. **"usecase implements model"**
12. **"deploymentNode implements model"**

## The shape this describes
- **The scenario-unit IS the Model (MVC) of its class.** Not storage, not a record — the Model.
- **Everything is a unit** → every class's model is a unit → **one representation, no special cases**.
- **One physical store**; other index trees are symlink trees (`ln`), never duplicate real files.
- **Aspect types IMPLEMENT the model** from different viewpoints — `UseCase implements Model` (functional/behavioural), `DeploymentNode implements Model` (deployment/physical). Expect more of this form; treat it as a **pattern**, not a list of one-offs.
- **Types own their structure and behaviour**: what children an object has is type design; behaviour/data belonging to a type lives ON the type. A function/service/resolver holding it is a defect **by definition**.

## Why every fix this week looked partial
Files were units; **folders were not** (bare directory, unit in a *second* store, no symlink beside its siblings). The items-tree reads units → saw files, not the folder. The sunburst reads the filesystem → saw the folder. **Neither view was broken.** Every fix (base-dir, mis-route, provider, per-type, 13-site rewire) sat *on top of* a foundation where a folder isn't a file.
