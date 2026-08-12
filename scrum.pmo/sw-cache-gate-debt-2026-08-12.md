# SW-cache gate debt — browser gates that don't self-assert served==committed (2026-08-12)

**Author:** robbin-tester · **Trigger:** PO SW retro-audit (protect Tron from signing a false-green).
**Status:** KNOWN DEBT, durable. Hand to req as a backlog req (do not leave as memory).

## Finding (honest)
A browser gate can only certify the CACHE instead of the DEPLOY if the deployed service worker serves a **stale navigation/shell from cache**. The deployed `sw.js` is **network-first** for navigations + shell + `/dist` bundles (cache-first only for immutable hashed static = which *is* the deploy). **Proven live: `r3014-network-first-gate.mjs` GREEN DET-3x @0.8.91** (soft-reload serves the current hash; SW-controlled). So these gates receive **fresh** content against a reachable prod — **no cache-blind false-green** in the current QA-Review batch.

**Residual (lower-grade):** the gates below navigate to live prod but do **not positively self-assert** `served==committed` (no served-hash / `/api/config` version check). They **rely on** the network-first SW being correct rather than proving the deploy themselves. Mitigation = the network-first SW; **`r3014` is the standing regression-lock** on that backstop (if the SW regresses to cache-first, r3014 goes RED).

## The gates (16; r3014 EXCLUDED — it self-asserts the served hash, SAFE-by-design)
Ranked by risk = user-facing surface Tron actually touches (higher) vs infra/federation (lower).
Note: code live in prod for months is inherently lower-risk (breakage would surface by use — that is how the device regressions surfaced).

### Higher (user-facing visual)
- `drawer-gate.mjs` (T25.4 drawer grab-bar/minimize) — re-navigates `/app` in-context
- `r211-vcard-persist-gate.mjs` (S21 vcard persist)
- `r212-lobby-livename-gate.mjs` (S21 lobby live name)
- `r219-file-detail-layout-gate.mjs` (file detail layout)
- `r225-audio-youtube-gate.mjs`
- `r264-v076-task-detail-gate.mjs`, `r265-v078-per-task-md-gate.mjs`
- `r221-detail-chain-gate.mjs`, `r222-dblclick-zoom-gate.mjs`, `r223-source-links-gate.mjs`
- `r2030-final-gate.mjs`, `r2031-vcard-gate.mjs`, `r2281-mp3-drop-upload-gate.mjs`
- `r4028-newtab-gate.mjs` (T40.28) — single fresh-context load (first load = network, low risk)

### Lower (federation / non-visual)
- `r260-t262-federated-dnd-gate.mjs` (S26 federation DnD)
- `r36b-counterpart-enrichment-gate.mjs` (S36 enrichment)

## Remediation (cheap, when touched — not a last-mile campaign)
When any of these is next re-run for its own reason, add the standard guard: assert `served==committed` via `/api/config` `{cache:'no-store'}` + served bundle-hash (the r3014 / r403b pattern), or neutralise the SW. Do **not** mass-re-run 16 old gates during the campaign's last mile — the network-first backstop covers them.
