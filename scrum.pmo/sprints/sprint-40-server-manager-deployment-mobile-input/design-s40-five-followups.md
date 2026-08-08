# S40 five follow-ups (Tron QA passed) — designs (scenario-first). MEASURED first.

## (2) ★ deploymentRefs → PROPER OOP MODEL (the deep one — Tron: "ior relationships to uml deployment nodes that end in files; oop interfaces + inheritance")
MEASURED current: WODA.prod = M1 `ior:class:ModelElement fc327458`, instanceOf UmlNode M2 (`a1d2e3f4-…0021`), carrying an ad-hoc `deploymentRefs:[{role,ref:'ior:file:…',note}]` (4 string-ref entries). That is a LIST, not a model. M2 family = 21 registered sentinels (0001 Class … 0021 UmlNode). Redesign — REUSE the M2 metamodel, add REGISTERED M2 sentinels (mind [[registered-sentinel]]), never a parallel type system:

**M2 (metamodel) additions — new registered `a1d2e3f4-…00XX` sentinels (join the family, so the identity-detector proves-them-legit):**
- **`DeploymentTarget`** (ABSTRACT, extends UmlNode) — interface for a deployable node. Subtypes (inheritance): **`Device`** · **`ExecutionEnvironment`** · **`Service`**.
- **`Artifact`** (ABSTRACT) — a deployed/config artifact whose leaf terminates in a FILE. Subtypes: **`ConfigFile`** · **`Certificate`** · **`KeyFile`** · **`EnvValue`**.
- **Typed RELATIONSHIP kinds** (extend UmlAssociation/Dependency; replace the 'role' STRING): **`deploys`** · **`contains`** · **`manifestsAs`** (artifact → its file) · **`configuredBy`** (target ← config).

**M1 (instances) — each of the 4 current refs becomes a FIRST-CLASS typed NODE ending in a FILE:**
- WODA.prod: re-type from bare UmlNode → **ExecutionEnvironment** (a real host running the service).
- `sshd_config` = M1 **ConfigFile** —`WODA.prod --configuredBy--> sshd_config --manifestsAs--> ior:file:/etc/ssh/sshd_config`.
- `root.WODA.prod.public_key` = M1 **KeyFile** — `WODA.prod --configuredBy--> keyfile --manifestsAs--> ior:file:~/.ssh/public_keys/root.WODA.prod.public_key`.
- `LE_DOMAIN` = M1 **EnvValue** — `WODA.prod --configuredBy--> domain --manifestsAs--> ior:file:.env#LE_DOMAIN`.
- `prod.wo-da.de cert` = M1 **Certificate** — `WODA.prod --configuredBy--> cert --manifestsAs--> ior:file:/etc/letsencrypt/live/prod.wo-da.de/fullchain.pem`.
Each relationship is a REAL `ior:class:Relationship` (UmlAssociation instance) `{from,to,kind}`, NOT a role string. The graph is typed all the way to the FILE leaf: **Target --configuredBy--> Artifact --manifestsAs--> File.**

**MIGRATION (gated dry-run+count, small=4):** read `deploymentRefs[]` → for each entry mint the typed Artifact M1 node (by role→subtype: ssh-service→ConfigFile, ssh-host-identity→KeyFile, domain→EnvValue, letsencrypt-cert→Certificate) + its `manifestsAs`→(the SAME measured ior:file: leaf, preserved) + a `configuredBy` relationship from WODA.prod; re-type WODA.prod → ExecutionEnvironment. The 4 refs SURVIVE as proper nodes (leaf paths unchanged). Replace the array with the relationships (or keep it as a derived read-view). Renders via `renderFacet` (R40.2) with the new deployment facets. INV-T byte-diff==0 on the tree.

## (1) migrate ALL special buttons → standard actions (DRY everywhere)
Machinery EXISTS (R35.1 universalActionBar + action units — measured in rb-detail-view/rb-file-detail/rb-detail-drawer/content-preview/model). NOT new machinery — a MIGRATION: every remaining bespoke button (◆Scenario · ✎Edit · ↗Claude.ai RC · ✏️Code · 🔀Open Diff · Save · 📁Files/✏️Editor/👁Preview · Refresh · ←Back-to-Profile) becomes an **action UNIT** rendered by universalActionBar.
- **Per-surface action SETS declared as units:** an `actionSet` per surface (editor-header-set, editor-footer-tabs-set, terminal-drawer-set, profile-set) = an ordered list of action-unit refs; the surface renders its set via ONE universalActionBar. Actions declared-as-data, rendered uniformly.
- **GREP-DRIVEN INVENTORY (not guesswork, AC):** grep `src/public` for bespoke button markup (`<button`, `onclick=`, the emoji labels ◆✎↗✏️🔀📁👁) NOT already going through universalActionBar → the exhaustive list of buttons still bypassing it → each migrated. The grep-lint then asserts ZERO bespoke buttons remain outside universalActionBar (single-source, like INV-C1-8). Full inventory produced at build from the grep.

## (3) Back = real history back; path-label takes over today's behaviour
Editor header `← Back  📁 scenario/i…` conflates two affordances. Split: **Back** → `history.back()` (genuine browser/history back). **The file-path label** → a SEPARATE handler doing what Back does today (navigate to the containing FOLDER of that unit). Two distinct actions (and, per (1), each becomes an action unit). No shared handler.

## (4) 'Files' shows the REAL file location (MEASURED where it lives)
MEASURED: a scenario unit's real path = the SHARD `scenario/index/<uuid[0]>/<uuid[1]>/…/<uuid>.scenario.json` (PROD_INDEX = `scenario/index`, server.ts:114; shard = `uuid.slice(0,5)` split, :63). So 📁Files reveals the ACTUAL shard path, browsable — not a placeholder/other tree.
- Server exposes the unit's real shard path (a small `/api/unit/<uuid>/path` returning `{ realPath, dir }` computed from PROD_INDEX + the shard rule — the SAME rule the store uses, single-sourced, never re-derived). The Files tab renders it + opens the containing dir in the existing file-browser. Fail-closed: unit not on disk → say so, don't fake a path (the semantic-fabrication lesson).

## (5) 'Preview' = the scenario's traceability with the details drawer (reuse, not bespoke)
👁Preview renders THAT scenario's traceability — its chain (Req→UC→Class→Method→Impl→Test) — using the EXISTING `/trace` surface (`rb-trace-tree`) scoped to the unit + the EXISTING `rb-detail-drawer` for details. NOT a bespoke preview. Preview = the trace view rooted at the unit + rb-detail-drawer on select (the same flow R31.4/R36 already use). Zero new renderer.

## MEASURE-FIRST + sequence
All grounded in measured artefacts (deploymentRefs shape · M2 family · action mechanism · real shard path). req mints (2)'s M2 sentinels [REGISTERED] + M1 nodes/relationships, (1)'s actionSets, (3)/(4)/(5) UCs; expert builds; I backstop (2 typed-graph-terminates-in-file + registered-sentinels · 1 grep-zero-bespoke · 3 two-distinct-handlers · 4 real-shard-path-not-faked · 5 reuse-trace+drawer-no-fork). CLIENT+server → expert-driven atomic deploy; I verify after.
