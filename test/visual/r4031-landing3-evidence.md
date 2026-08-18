# R40.31 Landing-3 — RAW per-surface evidence (A APPEAR + B VANISH on /model)

Harness reworked `/trace`→`/model` per architect ruling **70cfcdab1** (defect reachable on /model:
graph-less drawer mount). Runs against the isolated foundation scratch server. **worktree ddb645b78 / served v0.8.114.**
Real-WebKit @390. Report A and B as SEPARATE blocks (architect interprets each). Three outcomes: GREEN / RED / **INVALID**.

---

## HALF A (APPEAR — controls follow STATUS not MEMBERSHIP, graph-absent subject) — DIRECT GREEN, DIFFERENTIAL CONFOUNDED

- **Subject swept = 92bdca8b** (Sprint 25 QA-Review). On /model: `_graph.get(92bdca8b) === undefined` **AT TEST TIME** (invariant met — graph-absent precondition VALID, unlike /trace where it was graph-present).
- **DIRECT (fix-on) = GREEN**: controls render=**true** · `/api/ior` status=**QA Review** (sole source) · graph-absent=true. → On /model, control visibility follows the `/api/ior` STATUS on a graph-ABSENT subject. ✅
- **DIFFERENTIAL (fix-off, attachTaskStatus neutered @ same commit) = CONFOUNDED / not isolating**:
  - neuter regex verified to MATCH (`grep -c 'function attachTaskStatus(m: Record<string, unknown>): void {'` = 1) → patch applies deterministically.
  - BUT fix-off arm still measured `iorStatus='QA Review'` AND controls render=true (controlsHidden=**false**).
  - **Root**: the subject carries a STORED `model.status`; `/api/ior` returns it independently of `attachTaskStatus`. `attachTaskStatus` (server.ts:1425, called at the read boundary :2873) computes DERIVED status — redundant when a stored status already satisfies the render.
- **★ ARCHITECT QUESTION (you own EXPECTED):** to isolate `attachTaskStatus`, should the fix-off arm ALSO strip the stored `model.status` (so status is available ONLY via derivation), OR is the DIRECT proof (graph-absent + controls follow /api/ior) the intended acceptance and the differential over-specified for a stored-status subject? The auto-verdict prints RED, but the DIRECT invariant is GREEN and the differential is confounded, not falsified.

## HALF B (VANISH — Tab B moves from broadcast alone, no reload) — INVALID (precondition unmet on /model) + harness gaps

- **Subject = 97e8a6ad** (Sprint 37 QA-Review). worktree ddb645b78 / v0.8.114.
- **(2) C1 STUB broadcast-OFF → client-2 did NOT update = PASS** (the causal negative control holds).
- **(4) NO-RELOAD positive** (sentinel survived + 0 nav on client-2) = **true**.
- **★ PROD 97e8a6ad UNCHANGED (isolation held for a REAL task): true** (QA Review → QA Review) — scratch-only, prod untouched.
- **teardown**: prod:4444 untouched + 0 leftover = true (both arms).
- **PRECONDITION UNMET → INVALID, not RED:**
  1. **controls ABSENT-before** (`before.approve=false`) → PRESENT-after (`after.approve=true`) — the OPPOSITE of vanish. A's DIRECT proved controls DO render for a graph-absent QA-Review subject *with a warmup + `waitForSelector('button[data-verb=qa-approve]')`*; B's before-snapshot lacks that warmup → captured before the drawer rendered controls → present-before precondition FALSE.
  2. **client-2 on /model NOT quiet** — `c2GetsAfterApprove` shows many `/api/trace/children/...?mode=trace` requests + `pollInQuietWindow=3`. This CONTRADICTS the ruling's "/model is tree-less → client-2 quiet" assumption; trap-1 (broadcast≠poll, surgical-only) cannot be evaluated on /model as-loaded.
  3. **status regex noisy** — `before.statusDone=true` BEFORE any approve (drawer textContent contains "Done" substrings); statusDone/statusQaReview are substring matches, not the live status.
- **★ ARCHITECT QUESTION:** is /model genuinely tree-less as ruled, or does the loaded /model page carry a tree subscribed to `graph` emits (the observed `/api/trace/children` calls)? If /model has a tree, the "quiet client-2" causality (trap-1) needs a different surface OR the tree must be excluded. B also needs a harness fix: warmup the before-snapshot (mirror A's openAndRead) + assert the live status via the control-bar/badge element, not a textContent substring.

## NET (tester, honest — not rubber-stamped)
- **A DIRECT = GREEN** on /model (the graph-absence precondition that was INVALID on /trace is now VALID). **A DIFFERENTIAL = confounded by stored status** (architect ruling needed).
- **B = INVALID** (present-before precondition unmet + /model-not-quiet + noisy status detection) — the C1 negative-control + no-reload + prod-isolation all pass, but the core present→absent vanish is not yet measurable as-built. Harness refinement (mine) + a /model-tree ruling (architect) needed before a real B verdict.

---

## HALF B — CAUSALITY-BY-EXCLUSION run (architect 439adf982, worktree 0930018e6/v0.8.114) — INVALID (instrument) + a REAL finding

Reworked per ruling: badge-element status (`.dv-status-badge`), warmup before-snapshot, WS-frame capture, C1-excludes-polls.
- **FIXES THAT WORKED:** present-before now holds (controls approve+decline=true, badge='QA Review'); status read from the BADGE ELEMENT (not a substring).
- **★★ REAL FINDING (needs architect premise ruling):** client-2 RECEIVED the `unit-changed` WS frame for TARGET (`wsUnitChangedForTarget=true`) but the /model drawer did **NOT re-render** — controls stayed (approve=true after), badge stayed 'QA Review' (no flip to Done). **Client-1 (the acting tab) ALSO did not update** after its own approve. So the /model drawer does not reflect the change from EITHER a local action or a broadcast. This is either **Tron's live-MVC gap reproducing on /model** OR the **graph-less /model drawer does not live-update by design** (grep: rb-detail-drawer.ts has NO ViewBus/subscribe/refreshLive path). → ARCHITECT PREMISE QUESTION: is the graph-less /model drawer EXPECTED to live-update on a broadcast? If not, /model is the wrong B surface (like the tree-less premise I already corrected).
- **★ INSTRUMENT BUG I OWN + FIXED:** the C1 `neuterBroadcast` regex used `[^=]*`, which stops at the `=` in publishUnitChanged's type annotation `=> void` → never matched (`grep -cE`=0). The old C1 "pass" was COINCIDENTAL (the drawer never updates anyway). Fixed to `[\s\S]*?` spanning to the impl arrow + a throw-if-not-patched guard + a neuter-effect verification in the verdict (C1 must show `wsUnitChangedForTarget=false`, else INVALID not RED). prove-the-instrument-before-the-reading.
- **VERDICT = INVALID** (not RED): the C1 exclusion control was unproven (broadcast still fired in C1). Re-run on the fixed harness pending the architect's /model-drawer-live-update premise ruling. Banked either way: prod 97e8a6ad UNCHANGED, teardown prod:4444 untouched + 0 leftover (both arms).
- ⚠ HEAD moved mid-work ddb645b78→0930018e6 (version-provenance trap-5) — re-pin per run.

---

## HALF B — PRE-FIX DIAGNOSTIC BASELINE (NOT B-green; PO+architect 748cab757, worktree 748cab757/v0.8.114)
★ CONDITION-1 DISCRIMINATOR PROVEN: REPLACED=true + IN-PLACE=true on known controls → classifications VALID (prove-the-instrument).
★ PRE-REGISTERED PREDICTION: bus-wide INERT (no broadcast-driven in-place flip; any move = poll/wholesale).
ACTUAL:
- **DRAWER (DETAIL+CONTROLS): bus-wide INERT** — /model AND /trace both: drawer RECEIVED the unit-changed WS frame (wsFrame=true) but controls (approve stayed true) + badge (stayed 'QA Review') did NOT move. Transport EXONERATED (frame arrived, drawer inert) → confirms the raw-ref key-mismatch is **BUS-WIDE, not /model-specific**. **MATCHES prediction.**
- **ROW: NOT TESTABLE** — TARGET's rb-object-item was not rendered in either tree (collapsed/lazy); row half of the prediction UNVERIFIED (not claimed). Post-fix run must expand the tree to TARGET (or pick a subject known-rendered).
BOUNDS: divergence locus = bus-wide (drawer inert on both surfaces) → the ONE shared viewBusKey builder is the right fix. Baseline for the differential: re-run IDENTICALLY post-fix = POST-FIX ARM (one variable changed). Post-fix B-green also needs causality-by-exclusion (no in-window /api/trace/children carries new status + WS frame does) paired with the discriminator (architect condition-2).

---

## B DIFFERENTIAL — PRE-FIX BASELINE (first arm) — VALID, provenance-proven

Superseding the suspect f11b71bcf (symlink-dist, unverifiable provenance). Foundation now has `commit` + `buildDist`
(force worktree `build.mjs` so dist==THIS commit) + `distHasViewBusKey` grep (proven, not assumed).

**Arm @ worktree 748cab757, worktree-BUILT dist, served v0.8.114:**
- **dist-provenance `viewBusKey` = false** → the built bundle is genuinely PRE-fix (grep of `src/public/dist/*.js`).
- **present-before HOLDS** (warmup + badge-element): before `{approve:true, decline:true, badge:"QA Review"}`.
- **drawer INERT after owner approve**: after `{approve:true, decline:true, badge:"QA Review"}` — controls did NOT vanish, badge did NOT flip.
- **WS frame carried TARGET = true** — client-2's bridge RECEIVED the `unit-changed` broadcast for 97e8a6ad, yet did not re-render → confirms the ViewBus **key mismatch** (notify-key ≠ subscribe-key), the exact pre-fix gap the v0.8.115 builder closes.
- prod 97e8a6ad unchanged (QA Review→QA Review), teardown prod:4444 untouched + 0 leftover.

**⇒ DELTA low end established (pre=INERT, provenance-proven).** POST arm (≥50b22399a, viewBusKey=true, IN-PLACE) pending
ARON re-measure (checkpoint per "report first-arm"). Row-badge discriminator + expand-to-row on /trace + full 7-pt bar ride the POST arm.

---

## B DIFFERENTIAL — POST-FIX arm (50b22399a, v0.8.115) — ★ DELTA IS ZERO (prediction did NOT hold)

**Arm @ worktree 50b22399a, worktree-BUILT dist, served v0.8.115:**
- **dist-provenance `viewBusKey` = true** → the built bundle genuinely CARRIES the fix (grep-proven).
- present-before HOLDS: before `{approve:true, decline:true, badge:"QA Review"}`.
- **STILL INERT after owner-approve**: after `{approve:true, decline:true, badge:"QA Review"}` — controls did NOT vanish, badge did NOT flip.
- **WS frame carried TARGET = true** — client-2 (and client-1, the acting tab) RECEIVED the `unit-changed` broadcast, yet neither re-rendered. `client1` badge also stayed "QA Review".
- C1 (broadcast-off) arm: no frame, no polls — consistent, but moot since the positive arm didn't update either.
- prod 97e8a6ad unchanged, teardown prod:4444 untouched + 0 leftover.

**⇒ DELTA(pre=INERT → post=INERT) = ZERO.** The v0.8.115 viewBusKey fix did NOT make the /model drawer re-derive on broadcast.

**NOT a harness-mount artifact** (verified): `rb-detail-drawer.ts:469` wires `_barUnsub = ViewBus.subscribe(viewBusKey(ref), () => universalActionBar(...))` on ref-set (attributeChangedCallback:171) — so the setAttribute-mounted drawer DOES subscribe. The frame is received (`wsUnitChangedForTarget=true`) but the action-bar/badge does not re-derive.

**★ ARCHITECT (you own root-cause + EXPECTED):** the prediction (post=IN-PLACE) did NOT hold on the /model graph-less drawer. Candidate causes to diagnose: (a) residual key mismatch — `viewBusKey(ref)` (drawer's ref format, e.g. `task:<uuid>`) vs the notify key `viewBusKey({type,uuid})` still differ; (b) the action-bar re-derive reads STALE cached status (drawer's _fallbackGraph) instead of re-fetching /api/ior, so it re-derives QA Review again; (c) a /model-specific open-path the setAttribute mount misses despite the subscription. **CHECKPOINTED — not chaining row-badge/expand-to-row or seeded-A: if the drawer doesn't re-derive at all, the row discriminator is moot until this is diagnosed.** This is the arm that answers Tron — and it says the fix, as measured on /model, does NOT yet move Tab B.

---

## B BISECT — does the drawer subscribe callback FIRE? (POST bundle, instrumented ViewBus) — ★ (b) RE-DERIVE defect, prediction (a) REFUTED

Instrument (architect spec 683470bf7): clientPatch records the FINAL keys at the ViewBus boundary (subscribe `ref` / notify `ref`
= the built key) + a fire-counter, compiled INTO the POST bundle (before buildDist). Prove-the-instrument: 2 total fires (any key) → the counter works → a 0 would be trustworthy.

**@ 50b22399a, instrumented, viewBusKey=true, client-2:**
- **SUBSCRIBE key for TARGET (verbatim):** `task:97e8a6ad-46db-440f-a9be-cfb97ca64df4` — already TYPED (not the raw typeless ref the (a) prediction assumed).
- **NOTIFY key for TARGET (verbatim):** `task:97e8a6ad-46db-440f-a9be-cfb97ca64df4` — **MATCHES the subscribe key.**
- **FIRED callback keys for TARGET:** `task:97e8a6ad-...` × **2** — the drawer's subscribe callback DID fire (twice).
- SANITY: total fires (any key)=2, subs=6, notifies=2 → instrument PROVEN (not dead code).
- Yet `drawer re-rendered=false` (badge QA Review→QA Review, controls did not vanish). Same on client-1.

**⇒ CLASSIFICATION (b): keys MATCH + callback FIRES, but the view does NOT change → the defect is the RE-DERIVE** (universalActionBar re-derives control/badge visibility from STALE cached status — the drawer's `_fallbackGraph`/cached unit — instead of the fresh post-approve status; or a render short-circuit). **The viewBusKey KEY work is DONE.** The architect's prediction (a INPUT key mismatch) is REFUTED by the verbatim strings.

**★ EXPERT DIRECTION (on architect confirm):** fix the RE-DERIVE, not the key builder — on the ViewBus notify, `universalActionBar` must re-read the FRESH unit status (re-fetch /api/ior for the ref) before deriving visibility, so Approve/Decline vanish + badge flips. Then re-run this differential → expect POST IN-PLACE (DELTA pre=INERT→post=IN-PLACE). Row/expand + seeded-A still held.

---

## B DIFFERENTIAL — POST-FIX v0.8.116 (aaf60ef61) — ★ CONTROLS DELTA FLIPS = Tab B MOVES; badge read-uncertain

Folded run (INSTRUMENT): full differential + (i)/(ii), worktree-built provenance. **This is the run that answers Tron.**

**POST @aaf60ef61, v0.8.116, dist viewBusKey=true:**
- **★ CONTROLS: DELTA FLIPS pre=INERT → post=IN-PLACE.** client-2 (passive, never clicked) after approve = `approve:false, decline:false` — **Approve/Decline VANISHED from the broadcast alone**, latency 1090ms, sentinel survived + nav=0 (NO reload). client-1 (acting) also vanished. PRE baseline (748cab757) was inert (controls stayed). **⇒ Tab B MOVES — live-MVC works for the controls.**
- **CAUSALITY:** C1 (broadcast-OFF, same build) → controls STAYED (`approve:true` after), no WS frame → the broadcast IS the cause. (The `broadcastByExclusion` flag read false only because C1 issued 0 polls — the poll-parity sub-condition, not the causality, which holds: no-broadcast→no-update.)
- **(i)/(ii): rModel FRESH.** re-derive samples `[[QA Review,QA Review,QA Review],[QA Review,Done,Done]]` — the 2nd re-derive: cached obj.status=QA Review (stale) but rModel.status=Done (fresh) and **chosen=Done** → the precedence inversion works (fresh wins). (i) /api/ior issued=true, (ii) rModel==Done=true.
- **BADGE: NOT cleanly captured** — positive-arm after `badge="QA Review"` (did not flip), BUT the C1 acting-tab after showed `badge="Done"`. The inconsistency ⇒ a read-TIMING artifact (my settle signal is control-vanish; the rb-task-detail `.dv-status-badge` overwrite via loadDetailData lags that), NOT a confirmed fix gap. Needs a follow-up assertion that settles on the badge too — HELD with the row work per budget.
- prod 97e8a6ad unchanged (QA Review→QA Review), teardown prod:4444 untouched + 0 leftover.

**NET (measure-first, not the auto-RED, no softening): the CONTROLS live-MVC is FIXED and PROVEN (Tab B vanishes controls from the broadcast, no reload, causal, precedence-confirmed). The BADGE flip is read-uncertain in this run (likely timing, C1 acting-tab reached Done) — flagged for a settle-on-badge follow-up, not greened, not failed.** The core question "does Tab B move" = YES for controls.
