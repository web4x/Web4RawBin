# Sprint 32 — Model-Driven Code Quality (MDA/MOF modeling)  ·  v0.8.0

**Tron directive (2026-07-29):** consistent version reached → **bump v0.8.0** + new sprint, FULLY about **model-driven code quality**, **delivered as a feature via the FeatureManager** (R31.8). Plan diligently **scenario-first** with the team.

This is a PO VISION SEED. req formalizes R32.x units + UCs; architect designs the hard model/diagram/sync architecture; planner boards; skill-expert supplies the traceability-tree UX reuse. NO implementation before scenario units land (#126).

## The core idea (verbatim intent, structured)
Generate **scenario-based model elements** for the TypeScript compiler's base structures — **function, class, interface, attribute, accessor+mutator (getter/setter = property), method (class member), …** — as a proper **MDA/MOF 3-level model**:

- **M3** = MOF meta-meta-model: **Class** and **Relationship** scenario units (the root modeling primitives).
- **M2** = **UML profile** scenario units — *instances of* the M3 Class/Relationship units.
- **M1** = the actual TS structures (class/interface/function/attribute/property/method) — *instances of* the M2 UML units.
- ★ **Same UUID across the M-levels** for corresponding elements: e.g. a PUML class is BOTH an M2 `instanceOf Class` AND an M1 `instanceOf puml-class-code`, serialized with the **same UUID over the M levels**. One identity, represented at each level.

## UX — model tree + interactive SVG diagrams (in the details drawer)
- **Model tree** = conceptually the SAME as the traceability tree — **reuse the same UX components + functionality** (skill-expert's lane: rb-trace-tree). It shows the MDA scenario units and is the drag source.
- **Interactive SVG diagrams live in the DETAILS DRAWER**, all responsive sizes; **pan + pinch-zoom** like any other svg/image/html viewer in the details compartment (reuse RbPanZoom).
- **Drag an itemView of an MDA unit into a (blank) diagram** → it's added as a **VIEW** (e.g. a class view). Views can contain **COMPOSED views**: a class UML SVG has an **attribute compartment** (attribute views), a **methods compartment** (method views), a **properties compartment** (getter/setter views).
- **N diagrams can hold N views of the SAME scenario unit** → each view = a **link** from the diagram to the unit (the unit scenario records N diagram-links; views are references, not copies — identity-by-reference, R25.7 kinship).
- **x,y position** = where the itemView was dropped; the view is then **interactively selectable + movable**.
- **Relationships**: an attribute / getter / setter whose type is **another** class/type/interface/TS-type → rendered as a **relationship view** to that other unit.

## PUML parser/serializer (diagrams → .puml, no duplication)
- Serialize diagrams to **PUML files** WITHOUT duplicating (e.g. don't emit a puml class twice). Treat the **puml class in the .puml as an M2 `instanceOf Class` AND an M1 `instanceOf puml-class-code`, SAME UUID across M-levels** (round-trippable identity).
- **Keep M2 + M1 ALWAYS IN SYNC between the TS and PUML instances on EVERY action** — `class.add`, `class.remove`, `attribute.add`, `attribute.edit`, … Bidirectional, action-driven model sync (TS ↔ model ↔ PUML), same UUID throughout.

## Requirement decomposition (PO ACs — req to formalize as R32.x + UUIDs + UCs)
- **R32.0** — v0.8.0 bump (single-source Config unit R31.7 → build → deploy served==committed==0.8.0) + Sprint 32 as a **FeatureManager feature** (R31.8): the MDA modeling capability registered/entered as a feature.
- **R32.1** — **MDA MoF 3-level scenario model**: M3 Class+Relationship units; M2 UML-profile units instanceOf M3; M1 TS-structure units instanceOf M2; instanceOf links; **same-UUID-across-M-levels** invariant (correct-by-construction).
- **R32.2** — **TS→M1 generation**: from the TS compiler base structures (ts compiler API / AST), generate M1 scenario units — class, interface, function, attribute, accessor+mutator (property), method (class member).
- **R32.3** — **Model tree** = traceability-tree UX reused (rb-trace-tree components/functionality) over the MDA units; drag source.
- **R32.4** — **Interactive SVG diagram surface** in the details drawer, responsive, pan/pinch-zoom (RbPanZoom reuse); blank diagram = drop target.
- **R32.5** — **Drag itemView → diagram VIEW**: drop creates a view (class view); **composed views** into UML compartments (attributes / methods / properties=getters+setters); N-views-of-one-unit = N diagram-links in the unit; x,y-on-drop; select + move.
- **R32.6** — **Relationship views**: attribute/getter/setter of another type → relationship to that class/type/interface/TS-type unit.
- **R32.7** — **PUML serializer/parser**: diagram ⇄ .puml, no duplication, puml-class = M2-instanceOf-Class + M1-instanceOf-puml-class-code, same UUID across levels, round-trippable.
- **R32.8** — **Action-driven M1/M2 sync (TS ⇄ PUML)**: class.add / class.remove / attribute.add / attribute.edit / … keep M1+M2 in sync across TS and PUML by construction, same UUID.

## Design-risk flags (architect owns)
- The **same-UUID-across-M-levels** identity model (one unit, M1+M2+ representations) — the central architectural invariant; get it correct-by-construction (like the federated IOR identity).
- The **PUML no-duplication round-trip** (parse existing .puml → reuse the same-UUID unit, don't re-mint) — a real serializer/parser design.
- **Bidirectional action-sync** (TS ⇄ model ⇄ PUML) without drift — the recurring "single source, generated consumers" law (R31.7/R31.13 pattern) applied to the model.
- **Reuse** (don't re-fork): model tree = the traceability tree; diagram pan/zoom = RbPanZoom; drawer = rb-detail-drawer. Generic mechanics solved once (Tron's "why reinvent the tree").

## Build order (architect/planner to confirm)
R32.0 (bump+feature) → R32.1 (MDA model, foundation) → R32.2 (TS→M1) → R32.3 (model tree) → R32.4 (diagram surface) → R32.5 (drop→view) → R32.6 (relationships) → R32.7 (PUML) → R32.8 (sync). Model foundation first; PUML+sync last (highest risk).

## Gate posture
Model/identity = scenario-unit structural gates (same-UUID invariant, instanceOf integrity). Diagram/tree = visual @ Tron's real viewport (screenshot+pixel; standard HTML5/SVG, no device hacks — R31.12 lesson). PUML = round-trip byte/structure gate (parse→serialize→parse identity). Sync = action → both-representations-consistent gate. All chain-to-Test, scenario-first.
