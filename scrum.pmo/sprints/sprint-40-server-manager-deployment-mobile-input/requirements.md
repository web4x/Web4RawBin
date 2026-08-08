[Back to Planning](./planning.md)

# Sprint 40 — RC deep-link · Deployment-node · Keyboard control — Requirements

**Source:** Tron directive 2026-08-08 (verbatim, with failure screenshots), via robbin-po.

> GENERATED FROM SCENARIO UNITS — DO NOT HAND-EDIT.

---

## Requirements

- [ ] **R40.1 — Open Claude.ai RC action (per-pane deep link to the pane's agent)**
  [requirement:uuid:caab6d86-35b8-4865-acf4-d4210670e775]
  > TRON: an action that opens the Claude app or webpage at the AGENT's RC for the SELECTED pane (per-pane deep link, e.g. claude.ai/code/<session-id>)
  An action, visible and fireable from a pane's surface, that opens the Claude app (or the web page as fallback) at the SELECTED pane's AGENT's Remote Control — resolving the pane -> its agent -> its session id -> a per-pane deep link (e.g. claude.ai/code/<session-id>) — so firing it on pane 0.1 opens 0.1's agent's RC, never another pane's.
  **Acceptance criteria:**
  - [ ] **(visible-fireable)** The action is visible AND fireable from the pane surface (the pane's own action affordance).
  - [ ] **(resolve-chain)** Firing resolves the SELECTED pane -> its agent -> its session id -> the RC deep link (claude.ai/code/<session-id>).
  - [ ] **(app-else-web)** Opens the Claude app if available, else the web page (app-if-available-else-web).
  - [ ] **(right-agent)** Opens the RIGHT agent's RC: firing on pane 0.1 must NOT open 0.0's RC (per-pane isolation, no cross-pane leak).
  - [ ] **(device-gate)** Verified @390 mobile REAL-WebKit: the action fires and opens the correct per-pane deep link.
  → [UC R40.1: pane.openAgentRc](./planning.md) `[uc:uuid:350ab353-0f6b-496c-b2f5-ff0f2eaf0ce2]` *(placeholder — architect refines + wires chain at build-go)*

- [ ] **R40.2 — WODA.prod modelled as a UML deployment Node (with real refs + otmux children)**
  [requirement:uuid:adab1bb5-a292-490b-84fb-6e921dfb6a8f]
  > TRON: the SERVER modelled as a UML deployment NODE unit with REFERENCES to (a) its SSH config, (b) its configured DOMAIN, (c) its LETSENCRYPT CERTIFICATE, and the CURRENT OTMUX ITEMS (session -> window -> pane) as CHILDREN of that root
  The WODA.prod server is modelled as a UML deployment-NODE scenario unit with resolvable references to (a) its SSH config, (b) its configured domain, (c) its LetsEncrypt certificate; the current otmux items (session -> window -> pane) appear as CHILDREN of that node root; it renders in the UML diagram in deployment-node style (a 3D node box, not a plain class box).
  **Acceptance criteria:**
  - [ ] **(node-exists)** A deployment-node unit for WODA.prod exists on disk (UML deployment-Node facet), with its 3 references present.
  - [ ] **(refs-resolve-REAL)** The 3 refs — SSH config, configured domain, LetsEncrypt certificate — RESOLVE to REAL MEASURED artefacts on WODA.prod AND are SEMANTICALLY CORRECT (each answers the right question for a deployment NODE — the node's OWN inbound service config, not a resolvable-but-wrong outbound client file). NEVER invented/assumed paths (= fabricated identity) and NEVER a real-path-answering-the-wrong-question. Measured referents: DOMAIN=.env LE_DOMAIN/BASE_DOMAIN(prod.wo-da.de); CERT=/etc/letsencrypt/live/prod.wo-da.de/; SSH=/etc/ssh/sshd_config (inbound service) + host identity ~/.ssh/public_keys/root.WODA.prod.public_key — NOT ~/.ssh/config (outbound client).
  - [ ] **(otmux-children)** The current otmux items appear as CHILDREN under the node root in the correct hierarchy: session -> window -> pane.
  - [ ] **(deployment-style)** Renders in the UML diagram in DEPLOYMENT-NODE style (the 3D node-box notation), NOT a plain class box.
  - [ ] **(inv-t)** INV-T: tree byte-diff == 0 — the node projection is compute-on-read / non-mutating (no write-back to the scenario tree).
  - [ ] **(device-gate)** @390 mobile REAL-WebKit: the node + its otmux children render legibly.
  → [UC R40.2: modelElement.deploymentNodeView](./planning.md) `[uc:uuid:b9a549e4-f48a-45d8-8888-bcf639928449]` *(placeholder — architect refines + wires chain at build-go)*

- [ ] **R40.3 — Suppress OS keyboard + configurable Keyboard Controller shell**
  [requirement:uuid:bfe97d61-24b0-4a76-82e7-0ea44406901f]
  > TRON: an action that PREVENTS the OS keyboard from opening, plus a keyboard-controller surface like the action bar but with CONFIGURABLE KEYSTROKES (full controller designed later — this sprint = suppression + shell + config model)
  An action that PREVENTS the OS (iOS) keyboard from opening on terminal input, plus a keyboard-controller surface (like the action bar) with CONFIGURABLE, data-driven keystrokes. This sprint delivers the suppression + the controller shell + the config model; the full controller is designed later.
  **Acceptance criteria:**
  - [ ] **(A-suppress-by-construction)** [A · AUTOMATABLE @390 real-WebKit] The terminal input is configured to SUPPRESS the OS keyboard by construction (inputmode=none / readonly / not-focusable, per architect design) — verifiable in the served config/DOM, not by observing keyboard absence (which is vacuously true on a headless host).
  - [ ] **(A-input-still-reaches-pty)** [A · AUTOMATABLE] Synthetic input STILL REACHES the PTY after suppression — functional proof the suppression did NOT break typing (input flows to the terminal). This is the anti-vacuity guard: the feature must be present, not merely 'no keyboard appeared'.
  - [ ] **(A-terminal-fully-visible)** [A · AUTOMATABLE @390 real-WebKit + PIXEL] The terminal stays FULLY VISIBLE — currently 100% occluded; screenshot pixel-evidence shows it un-occluded (NEVER DOM counts).
  - [ ] **(A-no-overlay-scenario-edit)** [A · AUTOMATABLE @390 + PIXEL] The keyboard-controller input row does NOT overlay the Scenario/Edit buttons (pixel evidence — Tron's actual reported bug).
  - [ ] **(A-keystrokes-configurable)** [A · AUTOMATABLE] Keystrokes are CONFIGURABLE (data-driven config model, not hardcoded) — the config model exists and drives the controller shell.
  - [ ] **(B-ios-keyboard-never-opens)** [B · DEVICE-ONLY — TRON verifies on REAL iOS; NEVER reportable GREEN from a headless/desktop/Linux-WebKit run] The iOS on-screen keyboard genuinely NEVER opens on terminal input. (Real WebKit on the CI host has no on-screen keyboard at all, so this cannot be automated without a false pass — device-gated, same as the physical-finger longpress sliver.)
  → [UC R40.3: terminal.suppressOsKeyboard](./planning.md) `[uc:uuid:9d1225a4-2e27-4498-88ff-dc87e932aa4c]` *(placeholder — architect refines + wires chain at build-go)*

---

## Traceability Matrix

| Req | Name | Requirement UUID | UC placeholder |
|-----|------|------------------|----------------|
| R40.1 | Open Claude.ai RC action (per-pane deep link to the pane's agent) | caab6d86-35b8-4865-acf4-d4210670e775 | 350ab353-0f6b-496c-b2f5-ff0f2eaf0ce2 |
| R40.2 | WODA.prod modelled as a UML deployment Node (with real refs + otmux children) | adab1bb5-a292-490b-84fb-6e921dfb6a8f | b9a549e4-f48a-45d8-8888-bcf639928449 |
| R40.3 | Suppress OS keyboard + configurable Keyboard Controller shell | bfe97d61-24b0-4a76-82e7-0ea44406901f | 9d1225a4-2e27-4498-88ff-dc87e932aa4c |

*Captured scenario-first by robbin-req 2026-08-08. Chains (UC->Class->Method->Impl->Test) + R40.2's 3 real refs minted at build-go from architect design/measurement.*
