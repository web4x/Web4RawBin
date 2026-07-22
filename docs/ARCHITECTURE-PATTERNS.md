# ARCHITECTURE PATTERNS — REUSE BEFORE YOU BUILD (Web4RawBin canonical reference)
**GREP THIS FILE BEFORE building any tree, detail view, list, selector, config, or access gate.** Every bespoke rebuild below was a real "sorry pattern" — a wheel we reinvented and had to retire. The shared mechanism already exists; use it. (robbin-architect, 2026-07-22, Tron directive. Weave into build SKILLs — trainer.)

RULE: **presentation ≠ function; data ≠ shape.** One functional core; presentation/position/route is a reactive layer. Typed scenario units are the source of truth; never reshape or hand-copy them. If you're about to write a new component/endpoint/format, first grep here for the shared one.

---
## 1. Typed scenario units (`ior:class:X`) = SOURCE OF TRUTH — render NATIVELY
**WHAT:** Every domain object (Requirement, Task, Feature, Config, Profile, …) is a typed scenario unit on disk (`scenario/index/…/<uuid>.scenario.json`, `ior:class:X`, model + typed refs). The unit IS the truth; every view/consumer DERIVES from it.
**WHEN to reuse:** ANY time you need to display, traverse, or mutate a domain object — read/write the UNIT and let views re-render from it. Refs (`allowedUsers`, `useCases`, `methods`, …) are the graph edges.
**ANTI-PATTERN it replaces:** reshaping units into a bespoke API/JSON shape for a specific view (e.g. `listFeatures → itemView roots`); hand-copying unit data into a parallel store; a view that reads a snapshot instead of the unit. → the data desyncs + you maintain two shapes. (R31.8c: retired the listFeatures reshape — Features render natively; grant = add an `allowedUsers` ref on the unit, the tree re-renders.)
**GREP:** `scenario/index`, `ior:class:`, `CHAIN_TYPE_CONFIG` (src/ts/shared/chain-model.ts — declares each type's child ref-fields).

## 2. SHARED itemView / `rb-trace-tree` for ALL trees
**WHAT:** `rb-trace-tree` (src/public/ts/trace/rb-trace-tree.ts) renders ANY scenario unit + its ref-children as an expand/collapse tree, natively, via `/api/trace/children/<uuid>` (children = `CHAIN_TYPE_CONFIG[type].scenarioFwd`). Nodes reuse `rb-object-item`. Same tree renders the traceability graph, the ServerManager otmux tree, and the FeatureManager feature→users tree.
**WHEN to reuse:** ANY tree of units+refs. To render a new type's tree: add its `scenarioFwd` ref-fields to `CHAIN_TYPE_CONFIG` — the tree renders it. To show a node's children as a sub-list, they're just its refs.
**ANTI-PATTERN it replaces:** a bespoke card-list / custom tree / hand-built DOM list for one view (e.g. the FeatureManager card-list). → duplicated tree mechanics (expand, badges, lazy-load) that drift + re-break. (Tron: "why reinvent tree behavior over and over".)
**GREP:** `rb-trace-tree`, `data-seed-ior`, `/api/trace/children`, `CHAIN_TYPE_CONFIG`.

## 3. SHARED `rb-detail-drawer` for ALL detail views — positioning ≠ function
**WHAT:** ONE drawer (src/public/ts/trace/rb-detail-drawer.ts) hosts EVERY detail view via a `tagMap` (`type → rb-<type>-detail`) + the `selectionModel.select → selection-changed → renderDetailForRef` flow. Terminal, feature, profile, and all trace-unit details are drawer detail-views. Position (inline landscape / bottom-drawer portrait) is a CSS attr (`data-position`), NOT a fork.
**WHEN to reuse:** ANY detail/inspector view. Add `type → rb-<type>-detail` to the drawer tagMap + write a small detail element with `mount()`/`disconnectedCallback`. It gets scroll, grab-bar, expand/minimize, position for free.
**ANTI-PATTERN it replaces:** a bespoke overlay / sheet / modal / full-width-drawer per view (e.g. `ProfileSheet` overlay, the retired `showElement` fork). → each fork re-implements (and re-breaks) scroll/close/position; the recurring drawer-regression class. (R31.4/R31.8b/c: terminal + feature + profile ALL render in the one drawer.)
**GREP:** `rb-detail-drawer`, `tagMap`, `renderDetailForRef`, `rb-terminal-detail` (a model detail-view).

## 4. `c2` completion for SELECTORS
**WHAT:** The OOSH `c2` completion pattern (type-ahead → ranked candidates → select-to-complete, keyboard nav) is the model for any user/entity selector. Backend returns ranked, MASKED matches; client debounces, renders a dropdown, selects → feeds the action.
**WHEN to reuse:** ANY "pick an X by typing" control (grant-a-user, choose-a-feature, …). Server: an owner/permission-gated search endpoint over the source units, ranked (exact→prefix→substring), masked PII, capped+flagged. Client: debounced fetch + dropdown + keyboard nav.
**ANTI-PATTERN it replaces:** a raw text field where the user must paste an exact token/uuid; a bespoke autocomplete per selector; leaking full PII in results. (R31.8c: FeatureManager grant user-selector.)
**GREP:** `c2`, completion; (search endpoint) owner-gated `?q=` + masked identifiers.

## 5. SINGLE typed scenario unit for config/version (R31.7) — generate consumers
**WHAT:** ONE typed `ior:class:Config` unit holds the version (and other config); the build GENERATES every consumer (package.json, sw.js CACHE_NAME, build-manifest, `__BUILD_VERSION__`) from it. Runtime reads the build-stamped value. A guard (INV-V1/2/3) fails loud on divergence.
**WHEN to reuse:** ANY value that must agree across ≥2 places (version, a shared constant, a feature flag). Put it in the Config unit (or its own singleton), generate the copies, guard agreement.
**ANTI-PATTERN it replaces:** a hand-maintained value scattered across files that desync (the phantom-7.99 incident: package.json vs sw.js vs /api/config). → any copy drifting = a broken deploy. Also: `/api/config` reading a file per-request LIED after a stray edit — read the build-STAMP, not a live file.
**GREP:** `ior:class:Config`, `generateVersion`, `__BUILD_VERSION__`, `INV-V`.

## 6. DATA-DRIVEN access via MEMBERSHIP (not hardcoded per-feature)
**WHAT:** Access = "is the caller's token in `Feature.allowedUsers`?" (data), checked server-side at the ONE choke-point (`requireFeatureAccess`). The hardcoded owner token is used ONLY for the root-of-trust (grant-editing) + bootstrap seed, NEVER OR'd into feature access. Authorization = MEMBERSHIP; authentication = a live session; never conflate them (INV-F6: a live non-owner session still 403s by membership, not session-absence).
**WHEN to reuse:** ANY per-feature/per-resource access. Gate by membership in a shared guard; keep the grant-editing authority hardcoded-owner (root-of-trust); seed the owner at bootstrap; fail-closed on empty allowedUsers.
**ANTI-PATTERN it replaces:** a hardcoded token literal per feature; UI-hiding as "the gate"; a data-driven path to grant-editing (self-grant escalation); trusting "has a valid session ⇒ authorized". (R31.2→R31.8.)
**GREP:** `requireFeatureAccess`, `allowedUsers`, `INV-F`, `INV-G`, `ServerManagerGuard`.

---
## BONUS — deploy & correctness patterns (also greppable)
- **A server ship is not LIVE until a real restart** (Ctrl-C → `npm start`, NOT `[r]` rebuild). Verify by the fresh PID + a route curl (403 not 404), NEVER `/api/config` version alone (it reads a file). GREP: `server-green-needs-real-restart`.
- **Correct-by-construction:** pin correctness with an allow-list / invariant / generated artifact; never rely on an incidental heuristic. GREP: `INV-`, `correct-by-construction`.
- **Verify before you build:** grep THIS file. If a shared mechanism exists, extend it (config entry / tagMap entry / new detail element); do not fork.
